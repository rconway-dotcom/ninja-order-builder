// /api/auth/callback.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// In-memory exchange store — short-lived codes, one-time use
// Vercel keeps this warm between requests on the same instance
const exchangeStore = new Map();

// Clean up expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of exchangeStore) {
    if (val.expiry < now) exchangeStore.delete(key);
  }
}, 5 * 60 * 1000);

// Export store so exchange.js can access it
export { exchangeStore };

export default async function handler(req, res) {
  const { code, shop, error, state: returnedState } = req.query;
  const { SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, SHOP_DOMAIN, JWT_SECRET, PROXY_URL } = process.env;

  res.setHeader('Cache-Control', 'no-store');

  if (error) {
    return res.redirect(`${PROXY_URL}/success?error=${encodeURIComponent(error)}`);
  }

  // Verify signed OAuth state
  if (!returnedState) {
    return res.status(400).send('Missing state parameter.');
  }
  const [nonce, sig] = returnedState.split('.');
  if (!nonce || !sig) return res.status(400).send('Malformed state.');
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(nonce).digest('hex');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return res.status(400).send('Invalid state.');
    }
  } catch {
    return res.status(400).send('Invalid state.');
  }

  if (!shop || shop !== SHOP_DOMAIN) return res.status(400).send('Unauthorized store.');
  if (!code) return res.status(400).send('Missing authorization code.');

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
      console.error('Token exchange failed:', tokenRes.status);
      return res.redirect(`${PROXY_URL}/success?error=auth_failed`);
    }

    const tokenData = await tokenRes.json();
    const { associated_user } = tokenData;
    // NEVER log tokenData — contains access_token

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

    // Store session token keyed by a one-time exchange code
    const exchangeCode = crypto.randomBytes(24).toString('hex');
    exchangeStore.set(exchangeCode, {
      sessionToken,
      expiry: Date.now() + 60_000, // 60 seconds to complete exchange
    });

    res.redirect(`${PROXY_URL}/success?code=${exchangeCode}`);

  } catch (err) {
    console.error('Auth callback error:', err.message);
    res.redirect(`${PROXY_URL}/success?error=server_error`);
  }
}
