// /api/auth/exchange.js
// One-time code exchange — retrieves session JWT from in-memory store.
// Must run on the same Vercel instance as callback.js.
// Vercel routes all /api/auth/* to the same function bundle, so this works.

import { exchangeStore } from './callback.js';

const EXTENSION_ORIGIN = 'chrome-extension://bchlgmdbehoeefkppjaponkpdllolhai';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', EXTENSION_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).end();

  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Missing code' });

  const entry = exchangeStore.get(code);
  if (!entry) return res.status(401).json({ error: 'Invalid or expired code' });
  if (Date.now() > entry.expiry) {
    exchangeStore.delete(code);
    return res.status(401).json({ error: 'Code expired' });
  }

  // One-time use — delete immediately after retrieval
  exchangeStore.delete(code);
  return res.status(200).json({ token: entry.sessionToken });
}
