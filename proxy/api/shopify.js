// /api/shopify.js
// Routes Shopify API calls to the correct store based on brand.
// Brand is read from the JWT and double-checked against the request body.

import jwt from 'jsonwebtoken';

let _appTokens = {}; // { transfers: { token, expiry }, patches: { token, expiry } }

async function getAppToken(brand) {
  const cached = _appTokens[brand];
  if (cached?.token && Date.now() < cached.expiry - 60_000) return cached.token;

  const configs = {
    transfers: {
      clientId:     process.env.TRANSFERS_CLIENT_ID,
      clientSecret: process.env.TRANSFERS_CLIENT_SECRET,
      shopDomain:   process.env.TRANSFERS_SHOP_DOMAIN,
    },
    patches: {
      clientId:     process.env.PATCHES_CLIENT_ID,
      clientSecret: process.env.PATCHES_CLIENT_SECRET,
      shopDomain:   process.env.PATCHES_SHOP_DOMAIN,
    },
  };

  const config = configs[brand];
  if (!config) throw new Error(`Unknown brand: ${brand}`);

  const res = await fetch(`https://${config.shopDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     config.clientId,
      client_secret: config.clientSecret,
      grant_type:    'client_credentials',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to get app token for ${brand}: ${res.status} ${body}`);
  }

  const data = await res.json();
  _appTokens[brand] = {
    token:  data.access_token,
    expiry: Date.now() + (data.expires_in || 86400) * 1000,
  };
  return _appTokens[brand].token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

  // Brand from JWT — use this as the source of truth
  const brand = rep.brand || 'transfers';

  const shopDomains = {
    transfers: process.env.TRANSFERS_SHOP_DOMAIN,
    patches:   process.env.PATCHES_SHOP_DOMAIN,
  };

  const shopDomain = shopDomains[brand];
  if (!shopDomain) return res.status(400).json({ error: `Unknown brand: ${brand}` });

  const { path, method = 'GET', body } = req.body || {};
  if (!path) return res.status(400).json({ error: 'Missing path' });

  const targetUrl = `https://${shopDomain}${path}`;

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
          { namespace: 'ninja_order_builder', key: 'brand',      value: brand,                                  type: 'single_line_text_field' },
          { namespace: 'ninja_order_builder', key: 'built_at',   value: new Date().toISOString(),               type: 'single_line_text_field' },
        ],
      },
    };
  }

  try {
    const appToken = await getAppToken(brand);
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
