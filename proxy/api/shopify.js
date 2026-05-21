// /api/shopify.js
// All Shopify API calls from the extension flow through here.
// 1. Validates the rep's session JWT
// 2. Gets/refreshes the app's own CCG token
// 3. Forwards the request to Shopify
// 4. On draft order creation, injects rep identity as metafields

import jwt from 'jsonwebtoken';

// ─── CCG token cache (app-level, not per-user) ────────────────────────────
// Serverless functions can be cold-started, so this is a best-effort cache.
// The token will be re-fetched if the instance is cold or if it's expired.
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

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to get app token: ${res.status} ${body}`);
  }

  const data = await res.json();
  _appToken       = data.access_token;
  _appTokenExpiry = Date.now() + (data.expires_in || 86400) * 1000;
  return _appToken;
}

// ─── Handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS — Chrome extensions send cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── 1. Validate session JWT ─────────────────────────────────────────────
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

  // ── 2. Parse request ────────────────────────────────────────────────────
  const { path, method = 'GET', body } = req.body || {};
  if (!path) return res.status(400).json({ error: 'Missing path' });

  // Only allow requests to the configured store
  const { SHOP_DOMAIN } = process.env;
  const targetUrl = `https://${SHOP_DOMAIN}${path}`;

  // ── 3. Inject rep metafields on draft order creation ────────────────────
  let requestBody = body;
  const isDraftOrderCreate = method === 'POST' && path.includes('/draft_orders') && body?.draft_order;

  if (isDraftOrderCreate) {
    requestBody = {
      ...body,
      draft_order: {
        ...body.draft_order,
        metafields: [
          ...(body.draft_order.metafields || []),
          {
            namespace: 'ninja_order_builder',
            key:       'rep_email',
            value:     rep.email,
            type:      'single_line_text_field',
          },
          {
            namespace: 'ninja_order_builder',
            key:       'rep_name',
            value:     `${rep.firstName} ${rep.lastName}`.trim(),
            type:      'single_line_text_field',
          },
          {
            namespace: 'ninja_order_builder',
            key:       'built_at',
            value:     new Date().toISOString(),
            type:      'single_line_text_field',
          },
        ],
      },
    };
  }

  // ── 4. Forward to Shopify ───────────────────────────────────────────────
  try {
    const appToken = await getAppToken();

    const shopifyRes = await fetch(targetUrl, {
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
    console.error('Shopify proxy error:', err);
    return res.status(500).json({ error: `Proxy error: ${err.message}` });
  }
}
