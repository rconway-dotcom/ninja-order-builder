// api/mascot.js
// Serves the mascot image directly from the proxy
// so it loads correctly inside the Shopify admin iframe.
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const imgPath = path.join(process.cwd(), 'assets', 'mascot.png');
  try {
    const img = fs.readFileSync(imgPath);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(img);
  } catch {
    res.status(404).send('Not found');
  }
}
