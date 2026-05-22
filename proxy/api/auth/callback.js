// /api/auth/callback.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export default async function handler(req, res) {
  const { code, shop, error, state: returnedState } = req.query;
  const { SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, SHOP_DOMAIN, JWT_SECRET, PROXY_URL } = process.env;
  const { UPSTASH_REDIS_KV_REST_API_URL, UPSTASH_REDIS_KV_REST_API_TOKEN } = process.env;

  res.setHeader('Cache-Control', 'no-store');

  if (error) {
    return res.redirect(`${PROXY_URL}/success?error=${encodeURIComponent(error)}`);
  }

  // Verify signed OAuth state
  if (!returnedState) return res.status(400).send('Missing state.');
  const [nonce, sig] = returnedState.split('.');
  if (!nonce || !sig) return res.status(400).send('Malformed state.');
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(nonce).digest('hex');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return res.status(400).send('Invalid state.');
    }
  } catch { return res.status(400).send('Invalid state.'); }

  if (!shop || shop !== SHOP_DOMAIN) return res.status(400).send('Unauthorized store.');
  if (!code) return res.status(400).send('Missing code.');

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

    const tokenData        = await tokenRes.json();
    const { associated_user } = tokenData;
    // NEVER log tokenData — contains access_token

    if (!associated_user) return res.redirect(`${PROXY_URL}/success?error=not_staff`);

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

    // Store session token in Upstash Redis with 60s TTL
    // keyed by a random one-time code — token never touches a URL
    const exchangeCode = crypto.randomBytes(24).toString('hex');
    await fetch(`${UPSTASH_REDIS_KV_REST_API_URL}/set/auth:${exchangeCode}/${encodeURIComponent(sessionToken)}?ex=60`, {
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_KV_REST_API_TOKEN}` },
    });

    res.redirect(`${PROXY_URL}/success?code=${exchangeCode}`);

  } catch (err) {
    console.error('Auth callback error:', err.message);
    res.redirect(`${PROXY_URL}/success?error=server_error`);
  }
}
