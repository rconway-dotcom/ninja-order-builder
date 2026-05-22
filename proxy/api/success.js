// api/success.js
// Post-OAuth landing page. Exchanges one-time code for session JWT
// via postMessage to the extension — JWT never appears in URL or HTML.
export default function handler(req, res) {
  const { code, error } = req.query;
  const PROXY_URL = process.env.PROXY_URL;

  const errorMessages = {
    auth_failed:  "Authentication failed. Please try again.",
    not_staff:    "Your account doesn't have staff access to this store.",
    server_error: "Something went wrong. Please try again.",
  };

  const { envelope } = req.query;
  const errorMsg = errorMessages[error] || (error ? "Sign-in failed. Please try again." : null);

  // No caching — this page may contain sensitive exchange codes
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html');

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ninja Order Builder</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', system-ui, sans-serif;
      background: #F1F1F1; color: #2B2B2B;
      min-height: 100vh; display: flex;
      align-items: center; justify-content: center; padding: 24px;
    }
    .card {
      background: #fff; border: 1px solid #E4E4E6; border-radius: 16px;
      padding: 40px 36px; max-width: 440px; width: 100%; text-align: center;
      box-shadow: 0 4px 24px rgba(43,43,43,0.08);
    }
    .logo { width: 72px; height: 72px; margin: 0 auto 16px; display: block; }
    h1 { font-size: 22px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.01em; }
    p { font-size: 14px; color: #5A5B60; line-height: 1.6; }
    .status { margin-top: 16px; font-size: 13px; font-weight: 600; }
    .status.success { color: #21AF70; }
    .status.error { color: #FF394C; }
    .divider { height: 1px; background: #E4E4E6; margin: 24px 0; }
    .steps { display: flex; flex-direction: column; gap: 12px; text-align: left; }
    .step { display: flex; align-items: flex-start; gap: 12px; }
    .step-num {
      width: 24px; height: 24px; border-radius: 50%;
      background: rgba(1,154,255,0.1); color: #019AFF;
      font-size: 11px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; margin-top: 1px;
    }
    .step-text { font-size: 13px; color: #5A5B60; line-height: 1.5; }
    .step-text strong { color: #2B2B2B; font-weight: 600; }
    .download-btn {
      display: inline-flex; align-items: center; gap: 8px; margin-top: 24px;
      background: #019AFF; color: #fff; font-family: inherit; font-size: 14px;
      font-weight: 700; padding: 12px 24px; border-radius: 12px; text-decoration: none;
    }
    .download-btn:hover { background: #0089E5; }
    .download-btn svg { width: 16px; height: 16px; }
    .install-hint { margin-top: 10px; font-size: 11px; color: #9FA0A4; line-height: 1.5; }
    .spinner {
      display: inline-block; width: 18px; height: 18px;
      border: 2.5px solid #E4E4E6; border-top-color: #019AFF;
      border-radius: 50%; animation: spin 700ms linear infinite;
      vertical-align: middle; margin-right: 6px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <img class="logo" src="https://ninja-order-builder.vercel.app/api/mascot" alt="Ninja Order Builder" />
    <h1>Ninja Order Builder</h1>
    <div id="content"></div>
  </div>
  <script>
    const envelope = ${JSON.stringify(envelope || null)};
    const errorMsg = ${JSON.stringify(errorMsg || null)};
    const EXTENSION_ID = 'bchlgmdbehoeefkppjaponkpdllolhai';
    const PROXY_URL    = ${JSON.stringify(PROXY_URL || '')};
    const isEmbedded   = window.self !== window.top;
    const content      = document.getElementById('content');

    if (errorMsg) {
      content.innerHTML = \`<p>\${errorMsg}</p><div class="status error">✗ Sign-in failed</div>\`;

    } else if (envelope && !isEmbedded) {
      content.innerHTML = \`
        <p>Completing sign-in…</p>
        <div class="status success"><span class="spinner"></span> Please wait…</div>
      \`;

      fetch(PROXY_URL + '/api/auth/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envelope }),
      })
      .then(r => r.json())
      .then(data => {
        if (!data.token) throw new Error('No token in exchange response');
        // Send token to extension via chrome.runtime.sendMessage
        try {
          chrome.runtime.sendMessage(EXTENSION_ID, { action: 'authComplete', token: data.token }, () => {
            content.innerHTML = \`<p>You're signed in!</p><div class="status success">✓ Signed in — you can close this tab.</div>\`;
            setTimeout(() => window.close(), 1500);
          });
        } catch(e) {
          content.innerHTML = \`<p>You're signed in!</p><div class="status success">✓ Signed in — you can close this tab.</div>\`;
          setTimeout(() => window.close(), 1500);
        }
      })
      .catch(err => {
        content.innerHTML = \`<p>Sign-in failed. Please try again.</p><div class="status error">✗ \${err.message}</div>\`;
      });

    } else {
      content.innerHTML = \`
        <p>Use the <strong>Chrome extension</strong> to build draft orders directly from your Ninja Transfers cart.</p>
        <div class="divider"></div>
        <div class="steps">
          <div class="step"><div class="step-num">1</div><div class="step-text">Download and install the extension below.</div></div>
          <div class="step"><div class="step-num">2</div><div class="step-text">Build your cart on <strong>ninjatransfers.com</strong> with the right products and artwork.</div></div>
          <div class="step"><div class="step-num">3</div><div class="step-text">Click the <strong>Ninja Order Builder</strong> icon in your toolbar, sign in, and create a draft order.</div></div>
          <div class="step"><div class="step-num">4</div><div class="step-text">Open the draft order here in Shopify and <strong>send the invoice</strong>.</div></div>
        </div>
        <a class="download-btn" href="https://github.com/rconway-dotcom/ninja-order-builder/raw/main/shuriken.zip" download>
          <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 16 16"><path d="M8 2v8M5 7l3 3 3-3M2 12v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1"/></svg>
          Download Shuriken
        </a>
        <div class="install-hint">Unzip and load via chrome://extensions → Developer mode → Load unpacked</div>
      \`;
    }
  </script>
</body>
</html>`);
}
