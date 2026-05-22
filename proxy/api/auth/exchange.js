// /api/auth/exchange.js
// Unwraps the signed envelope containing the session JWT.
// No shared state needed — envelope is self-contained and expires in 60s.

import jwt from 'jsonwebtoken';

const EXTENSION_ORIGIN = 'chrome-extension://bchlgmdbehoeefkppjaponkpdllolhai';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', EXTENSION_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).end();

  const { envelope } = req.body || {};
  if (!envelope) return res.status(400).json({ error: 'Missing envelope' });

  try {
    const payload = jwt.verify(envelope, process.env.JWT_SECRET);
    if (!payload.sessionToken) return res.status(400).json({ error: 'Invalid envelope' });
    return res.status(200).json({ token: payload.sessionToken });
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Envelope expired' : 'Invalid envelope';
    return res.status(401).json({ error: msg });
  }
}
