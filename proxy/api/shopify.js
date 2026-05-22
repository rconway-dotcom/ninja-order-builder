// /api/shopify.js
// Proxies Shopify API calls — validates JWT, enforces strict allowlist of
// permitted paths and methods so no arbitrary Admin API access is possible.
import jwt from 'jsonwebtoken';

// ── Strict allowlist of permitted path patterns + methods ─────────────────
// Only the exact operations the extension needs. Nothing else passes.
const ALLOWED_ROUTES = [
  // Customer search
  { method: 'GET',  pattern: /^\/admin\/api\/[\d-]+\/customers\/search\.json(\?.*)?$/ },
  // Create customer
  { method: 'POST', pattern: /^\/admin\/api\/[\d-]+\/customers\.json$/ },
  // Create draft order
  { method: 'POST', pattern: /^\/admin\/api\/[\d-]+\/draft_orders\.json$/ },
  // Shop info (used for settings connection test)
  { method: 'GET',  pattern: /^\/admin\/api\/[\d-]+\/shop\.json$/ },
];

// ── Extension CORS origin ─────────────────────────────────────────────────
const EXTENSION_ORIGIN = 'chrome-extension://pcboikbpgdnjokngeagkohpjjichfelf';

// ── App token cache ───────────────────────────────────────────────────────
let _appToken = null;
let _appTokenExpiry = 0;

async function getAppToken() {
  if (_appToken && Date.now() < _appTokenExpiry - 60_000) return _appToken;

  const { SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, SHOP_DOMAIN } = process.env;
  const res = await fetch(`https://${SHOP_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     SHOPIFY_CLIENT_ID,
      client_secret: SHOPIFY_CLIENT_SECRET,
      grant_type:    'client_credentials',
    }),
  });

  if (!res.ok) throw new Error(`App token fetch failed: ${res.status}`);
  const data     = await res.json();
  _appToken      = data.access_token;
  _appTokenExpiry = Date.now() + (data.expires_in || 86400) * 1000;
  return _appToken;
}

// ── Handler ───────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Restrict CORS to extension origin only
  res.setHeader('Access-Control-Allow-Origin', EXTENSION_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  // Validate JWT
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing session token. Please sign in.' });
  }
  let rep;
  try {
    rep = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Session expired. Please sign in again.'
      : 'Invalid session token. Please sign in again.';
    return res.status(401).json({ error: msg, code: 'SESSION_EXPIRED' });
  }

  const { path, method = 'GET', body } = req.body || {};
  if (!path) return res.status(400).json({ error: 'Missing path' });

  // ── Strict path + method allowlist ──────────────────────────────────────
  const allowed = ALLOWED_ROUTES.some(r => r.method === method && r.pattern.test(path));
  if (!allowed) {
    console.warn(`Blocked disallowed route: ${method} ${path} by ${rep.email}`);
    return res.status(403).json({ error: 'Route not permitted.' });
  }

  // ── Validate path points to our Shopify store only ──────────────────────
  // Prevents URL tricks like @evil.example paths
  const { SHOP_DOMAIN } = process.env;
  let targetUrl;
  try {
    targetUrl = new URL(`https://${SHOP_DOMAIN}${path}`);
    if (targetUrl.hostname !== SHOP_DOMAIN) {
      return res.status(403).json({ error: 'Invalid path.' });
    }
  } catch {
    return res.status(400).json({ error: 'Malformed path.' });
  }

  // Inject rep metafields on draft order creation
  let requestBody = body;
  if (method === 'POST' && path.includes('/draft_orders') && body?.draft_order) {
    requestBody = {
      ...body,
      draft_order: {
        ...body.draft_order,
        metafields: [
          ...(body.draft_order.metafields || []),
          { namespace: 'ninja_order_builder', key: 'rep_email',  value: rep.email,                              type: 'single_line_text_field' },
          { namespace: 'ninja_order_builder', key: 'rep_name',   value: `${rep.firstName} ${rep.lastName}`.trim(), type: 'single_line_text_field' },
          { namespace: 'ninja_order_builder', key: 'built_at',   value: new Date().toISOString(),               type: 'single_line_text_field' },
        ],
      },
    };
  }

  try {
    const appToken    = await getAppToken();
    const shopifyRes  = await fetch(targetUrl.toString(), {
      method,
      headers: {
        'Content-Type':           'application/json',
        'X-Shopify-Access-Token': appToken,
      },
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    });
    const data = await shopifyRes.json();
    return res.status(shopifyRes.status).json(data);
  } catch (err) {
    console.error('Shopify proxy error:', err.message);
    return res.status(500).json({ error: 'Proxy error.' });
  }
}
