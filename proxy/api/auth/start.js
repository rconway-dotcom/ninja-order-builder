// /api/auth/start.js
// Kicks off Shopify OAuth for the requested brand.
// Brand is passed as ?brand=transfers or ?brand=patches

export default function handler(req, res) {
  const brand = req.query.brand || 'transfers';

  const configs = {
    transfers: {
      clientId:   process.env.TRANSFERS_CLIENT_ID,
      shopDomain: process.env.TRANSFERS_SHOP_DOMAIN,
    },
    patches: {
      clientId:   process.env.PATCHES_CLIENT_ID,
      shopDomain: process.env.PATCHES_SHOP_DOMAIN,
    },
  };

  const config = configs[brand];
  const { PROXY_URL } = process.env;

  if (!config?.clientId || !config?.shopDomain || !PROXY_URL) {
    return res.status(500).send(`Proxy not configured for brand: ${brand}. Check environment variables.`);
  }

  const params = new URLSearchParams({
    client_id:         config.clientId,
    scope:             'write_draft_orders,read_customers,write_customers',
    redirect_uri:      `${PROXY_URL}/api/auth/callback`,
    state:             brand, // pass brand through the OAuth state param
    'grant_options[]': 'per-user',
  });

  res.redirect(`https://${config.shopDomain}/admin/oauth/authorize?${params}`);
}
