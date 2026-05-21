// api/success.js
export default function handler(req, res) {
  const { token, error } = req.query;

  const errorMessages = {
    auth_failed:  "Authentication failed. Please try again.",
    not_staff:    "Your account doesn't have staff access to this store.",
    server_error: "Something went wrong. Please try again.",
  };

  const errorMsg = errorMessages[error] || (error ? "Sign-in failed. Please try again." : null);

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
      background: #F1F1F1;
      color: #2B2B2B;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #fff;
      border: 1px solid #E4E4E6;
      border-radius: 16px;
      padding: 40px 36px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 24px rgba(43,43,43,0.08);
    }
    .mascot { font-size: 56px; margin-bottom: 16px; line-height: 1; }
    h1 { font-size: 22px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.01em; }
    p { font-size: 14px; color: #5A5B60; line-height: 1.6; }
    .status { margin-top: 16px; font-size: 13px; font-weight: 600; }
    .status.success { color: #21AF70; }
    .status.error { color: #FF394C; }
    .divider { height: 1px; background: #E4E4E6; margin: 24px 0; }
    .steps { display: flex; flex-direction: column; gap: 12px; text-align: left; }
    .step { display: flex; align-items: flex-start; gap: 12px; }
    .step-num {
      width: 24px; height: 24px;
      border-radius: 50%;
      background: rgba(1,154,255,0.1);
      color: #019AFF;
      font-size: 11px;
      font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .step-text { font-size: 13px; color: #5A5B60; line-height: 1.5; }
    .step-text strong { color: #2B2B2B; font-weight: 600; }
    .spinner {
      display: inline-block;
      width: 18px; height: 18px;
      border: 2.5px solid #E4E4E6;
      border-top-color: #019AFF;
      border-radius: 50%;
      animation: spin 700ms linear infinite;
      vertical-align: middle;
      margin-right: 6px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card" id="card">
    <div class="mascot">🥷</div>
    <h1>Ninja Order Builder</h1>
    <div id="content"></div>
  </div>

  <script>
    const token = ${JSON.stringify(token || null)};
    const errorMsg = ${JSON.stringify(errorMsg || null)};
    const isEmbedded = window.self !== window.top;
    const content = document.getElementById('content');

    if (errorMsg) {
      content.innerHTML = \`
        <p>\${errorMsg}</p>
        <div class="status error">✗ Sign-in failed</div>
      \`;
    } else if (token && !isEmbedded) {
      // Opened by the Chrome extension — show success and close
      content.innerHTML = \`
        <p>You're signed in! This tab will close automatically.</p>
        <div class="status success">✓ Signed in — returning to extension…</div>
      \`;
      setTimeout(() => window.close(), 3000);
    } else {
      // Embedded in Shopify admin or direct visit — show the how-to guide
      content.innerHTML = \`
        <p>Use the <strong>Chrome extension</strong> to build draft orders directly from your Ninja Transfers cart.</p>
        <div class="divider"></div>
        <div class="steps">
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-text">Build your cart on <strong>ninjatransfers.com</strong> with the right products and artwork.</div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-text">Click the <strong>Ninja Order Builder</strong> icon in your Chrome toolbar.</div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-text">Search for a customer, review the order, and hit <strong>Create Draft Order</strong>.</div>
          </div>
          <div class="step">
            <div class="step-num">4</div>
            <div class="step-text">Open the draft order here in Shopify and <strong>send the invoice</strong>.</div>
          </div>
        </div>
      \`;
    }
  </script>
</body>
</html>`);
}
