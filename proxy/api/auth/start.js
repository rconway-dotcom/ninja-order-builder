// /api/auth/start.js
// Kicks off the Shopify OAuth flow.
// "per-user" grant (online access) means Shopify returns the staff member's
// identity in the token response — this is how we verify who the rep is.

export default function handler(req, res) {
  const { SHOPIFY_CLIENT_ID, SHOP_DOMAIN, PROXY_URL } = process.env;

  if (!SHOPIFY_CLIENT_ID || !SHOP_DOMAIN || !PROXY_URL) {
    return res.status(500).send('Proxy not configured. Check environment variables.');
  }

  const params = new URLSearchParams({
    client_id:    SHOPIFY_CLIENT_ID,
    scope:        'write_draft_orders,read_customers,write_customers',
    redirect_uri: `${PROXY_URL}/api/auth/callback`,
    // "per-user" triggers online access mode — response will include
    // associated_user with the staff member's name + email
    'grant_options[]': 'per-user',
  });

  res.redirect(`https://${SHOP_DOMAIN}/admin/oauth/authorize?${params}`);
}
