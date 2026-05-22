// /api/auth/start.js
// Generates a signed state nonce to prevent CSRF in the OAuth flow.
import crypto from 'crypto';

export default function handler(req, res) {
  const { SHOPIFY_CLIENT_ID, SHOP_DOMAIN, PROXY_URL, JWT_SECRET } = process.env;

  if (!SHOPIFY_CLIENT_ID || !SHOP_DOMAIN || !PROXY_URL) {
    return res.status(500).send('Proxy not configured.');
  }

  // Generate a signed state nonce — verified in callback
  const nonce    = crypto.randomBytes(16).toString('hex');
  const sig      = crypto.createHmac('sha256', JWT_SECRET).update(nonce).digest('hex');
  const state    = `${nonce}.${sig}`;

  // Store nonce in a short-lived cookie so callback can verify it
  res.setHeader('Set-Cookie', `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`);

  const params = new URLSearchParams({
    client_id:         SHOPIFY_CLIENT_ID,
    scope:             'write_draft_orders,read_customers,write_customers',
    redirect_uri:      `${PROXY_URL}/api/auth/callback`,
    state,
    'grant_options[]': 'per-user',
  });

  res.redirect(`https://${SHOP_DOMAIN}/admin/oauth/authorize?${params}`);
}
