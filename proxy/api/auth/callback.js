// /api/auth/callback.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export default async function handler(req, res) {
  const { code, shop, error, state: returnedState } = req.query;
  const { SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, SHOP_DOMAIN, JWT_SECRET, PROXY_URL } = process.env;

  // No-store to prevent any caching of this sensitive endpoint
  res.setHeader('Cache-Control', 'no-store');

  if (error) {
    return res.redirect(`${PROXY_URL}/success?error=${encodeURIComponent(error)}`);
  }

  // Verify signed OAuth state to prevent CSRF
  if (!returnedState) {
    return res.status(400).send('Missing state parameter.');
  }
  const [nonce, sig] = returnedState.split('.');
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(nonce).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(sig || ''), Buffer.from(expectedSig))) {
    return res.status(400).send('Invalid state — possible CSRF attempt.');
  }

  if (!shop || shop !== SHOP_DOMAIN) {
    return res.status(400).send('Unauthorized store.');
  }
  if (!code) {
    return res.status(400).send('Missing authorization code.');
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

    if (!tokenRes.ok) {
      // Log status only — never log token response body
      console.error('Token exchange failed:', tokenRes.status);
      return res.redirect(`${PROXY_URL}/success?error=auth_failed`);
    }

    const tokenData = await tokenRes.json();
    const { associated_user } = tokenData;
    // NEVER log tokenData — it contains access_token

    if (!associated_user) {
      return res.redirect(`${PROXY_URL}/success?error=not_staff`);
    }

    // Issue our own short-lived JWT — does NOT include the Shopify access token
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

    // Pass token via a one-time code stored server-side rather than in the URL.
    // We use a signed short-lived exchange token instead of the full JWT in the URL.
    const exchangeCode = crypto.randomBytes(24).toString('hex');
    const exchangePayload = jwt.sign({ sessionToken, exchangeCode }, JWT_SECRET, { expiresIn: '60s' });

    // Store exchange token in a secure cookie — extension picks it up via postMessage
    res.setHeader('Set-Cookie', `exchange_token=${exchangePayload}; HttpOnly; Secure; SameSite=None; Max-Age=60; Path=/`);
    res.redirect(`${PROXY_URL}/success?code=${exchangeCode}`);

  } catch (err) {
    console.error('Auth callback error (no token data):', err.message);
    res.redirect(`${PROXY_URL}/success?error=server_error`);
  }
}
