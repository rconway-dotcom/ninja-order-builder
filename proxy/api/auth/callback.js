// /api/auth/callback.js
// Shopify redirects here after the rep logs in.
// We exchange the code for an online access token, extract the staff
// member's identity, then issue our own short-lived JWT back to the extension.

import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  const { code, shop, error } = req.query;
  const { SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, SHOP_DOMAIN, JWT_SECRET, PROXY_URL } = process.env;

  // User cancelled or Shopify returned an error
  if (error) {
    return res.redirect(`${PROXY_URL}/success?error=${encodeURIComponent(error)}`);
  }

  // Reject if the shop in the callback doesn't match our store
  if (!shop || shop !== SHOP_DOMAIN) {
    return res.status(400).send('Unauthorized store.');
  }

  if (!code) {
    return res.status(400).send('Missing authorization code.');
  }

  try {
    // Exchange code for an online access token
    // Online tokens include `associated_user` — the logged-in staff member
    const tokenRes = await fetch(`https://${SHOP_DOMAIN}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      console.error('Token exchange failed:', tokenRes.status, body);
      return res.redirect(`${PROXY_URL}/success?error=auth_failed`);
    }

    const tokenData = await tokenRes.json();
    const { associated_user } = tokenData;

    // associated_user is only present for online (per-user) access tokens
    // If it's missing, something went wrong with the OAuth config
    if (!associated_user) {
      console.error('No associated_user in token response — check grant_options[]=per-user');
      return res.redirect(`${PROXY_URL}/success?error=not_staff`);
    }

    // Issue a signed JWT (8 hours) with the rep's identity
    // This is what the extension stores and sends with every API call
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

    // Pass token back to the extension via the success page
    res.redirect(`${PROXY_URL}/success?token=${encodeURIComponent(sessionToken)}`);

  } catch (err) {
    console.error('Auth callback error:', err);
    res.redirect(`${PROXY_URL}/success?error=server_error`);
  }
}
