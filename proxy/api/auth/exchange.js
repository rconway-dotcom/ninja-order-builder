// /api/auth/exchange.js
// One-time token exchange endpoint.
// The success page posts the exchange code here; we return the session JWT.
// This keeps the full JWT out of URLs and page HTML entirely.
import jwt from 'jsonwebtoken';

const EXTENSION_ORIGIN = 'chrome-extension://bchlgmdbehoeefkppjaponkpdllolhai';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', EXTENSION_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const cookie = req.headers.cookie || '';
  const match  = cookie.match(/exchange_token=([^;]+)/);
  if (!match) return res.status(401).json({ error: 'No exchange token' });

  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Missing code' });

  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET);
    if (payload.exchangeCode !== code) {
      return res.status(401).json({ error: 'Code mismatch' });
    }
    // Clear the cookie after use
    res.setHeader('Set-Cookie', 'exchange_token=; HttpOnly; Secure; SameSite=None; Max-Age=0; Path=/');
    return res.status(200).json({ token: payload.sessionToken });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired exchange token' });
  }
}
