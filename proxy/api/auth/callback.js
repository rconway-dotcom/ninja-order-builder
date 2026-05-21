// /api/auth/callback.js
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  const { code, shop, error, state: brandState } = req.query;
  const brand = brandState || 'transfers';

  const { JWT_SECRET, PROXY_URL } = process.env;

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

  console.log('Callback hit:', { brand, shop, hasCode: !!code, error, expectedShop: config?.shopDomain });

  if (error) {
    return res.redirect(`${PROXY_URL}/success?error=${encodeURIComponent(error)}`);
  }

  if (!config) {
    return res.status(400).send(`Unknown brand: ${brand}`);
  }

  if (!shop || shop !== config.shopDomain) {
    console.log('Shop mismatch:', shop, 'expected:', config.shopDomain);
    return res.status(400).send(`Unauthorized store. Got: ${shop}, Expected: ${config.shopDomain}`);
  }

  if (!code) {
    return res.status(400).send('Missing authorization code.');
  }

  try {
    const tokenRes = await fetch(`https://${config.shopDomain}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     config.clientId,
        client_secret: config.clientSecret,
        code,
      }),
    });

    const tokenText = await tokenRes.text();
    console.log('Token response status:', tokenRes.status);

    if (!tokenRes.ok) {
      return res.redirect(`${PROXY_URL}/success?error=auth_failed`);
    }

    const tokenData        = JSON.parse(tokenText);
    const { associated_user } = tokenData;

    console.log('Associated user:', associated_user?.email);

    if (!associated_user) {
      return res.redirect(`${PROXY_URL}/success?error=not_staff`);
    }

    const sessionToken = jwt.sign(
      {
        email:     associated_user.email,
        firstName: associated_user.first_name,
        lastName:  associated_user.last_name,
        userId:    associated_user.id,
        isOwner:   associated_user.account_owner,
        brand,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log('Success for brand:', brand);
    res.redirect(`${PROXY_URL}/success?token=${encodeURIComponent(sessionToken)}`);

  } catch (err) {
    console.error('Auth callback error:', err);
    res.redirect(`${PROXY_URL}/success?error=server_error`);
  }
}
