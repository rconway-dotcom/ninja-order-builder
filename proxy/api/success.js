// api/success.js
// Serves the post-OAuth success page.
// The extension background worker watches for navigation to this URL
// and extracts the token from the query string.

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
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');
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
      max-width: 380px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 24px rgba(43,43,43,0.08);
    }
    .mascot { font-size: 48px; margin-bottom: 16px; line-height: 1; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    p { font-size: 14px; color: #5A5B60; line-height: 1.5; }
    .status { margin-top: 20px; font-size: 13px; font-weight: 600; }
    .status.success { color: #21AF70; }
    .status.error { color: #FF394C; }
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
  <div class="card">
    <div class="mascot">🥷</div>
    <h1>Ninja Order Builder</h1>
    ${errorMsg ? `
      <p>${errorMsg}</p>
      <div class="status error">✗ Sign-in failed</div>
    ` : token ? `
      <p>You're signed in! This tab will close automatically.</p>
      <div class="status success">✓ Signed in — returning to extension…</div>
      <script>setTimeout(() => window.close(), 3000);</script>
    ` : `
      <p>Completing sign-in…</p>
      <div class="status"><span class="spinner"></span> Please wait…</div>
    `}
  </div>
</body>
</html>`);
}
