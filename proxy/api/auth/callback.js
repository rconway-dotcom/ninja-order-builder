// /api/auth/callback.js
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  const { code, shop, error } = req.query;
  const { SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, SHOP_DOMAIN, JWT_SECRET, PROXY_URL } = process.env;

  console.log('Callback hit:', { shop, hasCode: !!code, error, SHOP_DOMAIN, hasClientId: !!SHOPIFY_CLIENT_ID });

  if (error) {
    console.log('OAuth error:', error);
    return res.redirect(`${PROXY_URL}/success?error=${encodeURIComponent(error)}`);
  }

  if (!shop || shop !== SHOP_DOMAIN) {
    console.log('Shop mismatch:', shop, 'expected:', SHOP_DOMAIN);
    return res.status(400).send(`Unauthorized store. Got: ${shop}, Expected: ${SHOP_DOMAIN}`);
  }

  if (!code) {
    return res.status(400).send('Missing authorization code.');
  }

  if (!SHOPIFY_CLIENT_ID || !SHOPIFY_CLIENT_SECRET) {
    console.log('Missing credentials');
    return res.status(500).send('Missing Shopify credentials in environment variables.');
  }

  try {
    const tokenRes = await fetch(`https://${SHOP_DOMAIN}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
        code,
      }),
    });

    const tokenText = await tokenRes.text();
    console.log('Token response status:', tokenRes.status, 'body:', tokenText);

    if (!tokenRes.ok) {
      return res.redirect(`${PROXY_URL}/success?error=auth_failed`);
    }

    const tokenData = JSON.parse(tokenText);
    const { associated_user } = tokenData;

    console.log('Associated user:', associated_user);

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
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log('Success, redirecting to:', `${PROXY_URL}/success`);
    res.redirect(`${PROXY_URL}/success?token=${encodeURIComponent(sessionToken)}`);

  } catch (err) {
    console.error('Auth callback error:', err);
    res.redirect(`${PROXY_URL}/success?error=server_error`);
  }
}
