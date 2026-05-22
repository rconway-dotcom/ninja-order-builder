// /api/auth/exchange.js
// Retrieves and deletes the session token from Upstash Redis.
// One-time use — code is deleted immediately after retrieval.

const EXTENSION_ORIGIN = 'chrome-extension://pcboikbpgdnjokngeagkohpjjichfelf';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', EXTENSION_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).end();

  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Missing code' });

  const { UPSTASH_REDIS_KV_REST_API_URL, UPSTASH_REDIS_KV_REST_API_TOKEN } = process.env;

  try {
    // GET and DELETE atomically using GETDEL
    const r = await fetch(`${UPSTASH_REDIS_KV_REST_API_URL}/getdel/auth:${code}`, {
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_KV_REST_API_TOKEN}` },
    });

    const data = await r.json();
    const token = data.result ? decodeURIComponent(data.result) : null;

    if (!token) return res.status(401).json({ error: 'Invalid or expired code' });
    return res.status(200).json({ token });

  } catch (err) {
    console.error('Exchange error:', err.message);
    return res.status(500).json({ error: 'Exchange failed' });
  }
}
