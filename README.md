# Ninja Order Builder

Internal tool for building Shopify draft orders directly from a Ninja Transfers cart — with artwork links, dimensions, and rep attribution attached automatically.

**Access is gated to Shopify staff accounts. Every order is stamped with the rep's name and email.**

---

## How it works

```
Rep builds cart on ninjatransfers.com
        ↓
Chrome Extension reads the cart
        ↓
Rep searches customer / adds new
        ↓
"Create Draft Order" →  Vercel Proxy  →  Shopify Admin API
                         (auth gate)       (draft order + metafields)
```

No credentials live on rep machines. Reps sign in once per day with their Shopify staff account. Remove a staff account in Shopify → access revoked instantly.

---

## Repository structure

```
ninja-order-builder/
├── extension/              Chrome extension (load unpacked)
│   ├── manifest.json
│   ├── background.js       Service worker — handles OAuth tab
│   ├── popup.html/css/js   Extension popup UI
│   ├── settings.html/css/js  Settings & session page
│   ├── assets/             Inter font, mascot
│   └── icons/              Extension icons (16/48/128px)
│
├── proxy/                  Vercel serverless proxy
│   ├── api/
│   │   ├── auth/
│   │   │   ├── start.js    Redirect to Shopify OAuth
│   │   │   └── callback.js Exchange code → JWT
│   │   └── shopify.js      Proxy all Shopify API calls
│   ├── public/
│   │   └── success.html    Shown after OAuth, closes tab
│   ├── package.json
│   ├── vercel.json
│   └── .env.example        ← copy to .env, fill in values
│
├── .gitignore
└── README.md
```

---

## Initial setup (one time, admin only)

### 1 — Shopify Dev Dashboard app

1. Go to [dev.shopify.com/dashboard](https://dev.shopify.com/dashboard)
2. **Create app** → **Start from Dev Dashboard** → name it `Ninja Order Builder`
3. **Versions** tab → create a version with these scopes:
   - `write_draft_orders`
   - `read_customers`
   - `write_customers`
4. Set App URL to `https://shopify.dev/apps/default-app-home`
5. Click **Release**
6. **Home** → **Install app** → select your store → **Install**
7. **Settings** tab → copy **Client ID** and **Client Secret**

### 2 — Deploy the proxy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# From the proxy directory
cd proxy
vercel
```

Or connect via the Vercel dashboard: [vercel.com/new](https://vercel.com/new) → import this repo → set root directory to `proxy`.

**Set these environment variables in Vercel** (Project → Settings → Environment Variables):

| Variable | Value |
|---|---|
| `SHOP_DOMAIN` | `yourstore.myshopify.com` |
| `SHOPIFY_CLIENT_ID` | From Dev Dashboard → Settings |
| `SHOPIFY_CLIENT_SECRET` | From Dev Dashboard → Settings |
| `PROXY_URL` | Your Vercel deployment URL (set after first deploy) |
| `JWT_SECRET` | A long random string — generate at [generate-secret.vercel.app/64](https://generate-secret.vercel.app/64) |

After first deploy, set `PROXY_URL` to your Vercel URL and **redeploy once**.

### 3 — Add the redirect URL to your Shopify app

In your Dev Dashboard app → Versions → add this as an allowed redirect URI:
```
https://your-vercel-url.vercel.app/api/auth/callback
```

### 4 — Install the Chrome extension

1. Open `chrome://extensions/`
2. Toggle **Developer mode** on (top right)
3. Click **Load unpacked** → select the `extension/` folder
4. Pin the Ninja icon to your toolbar

---

## Rep usage

1. Build the cart on [ninjatransfers.com](https://ninjatransfers.com) with the right products and artwork
2. Click the extension icon → **Sign in with Shopify** (first time / new day)
3. Search for the customer or fill in a new one
4. Review and click **Create Draft Order**
5. Open the order in Shopify and send the invoice

Sessions last 8 hours. Reps will be prompted to sign in again the next day.

---

## Access management

| Task | How |
|---|---|
| Give someone access | Add them as a staff member in Shopify Admin |
| Revoke access | Remove their Shopify staff account |
| See who built what | Check `ninja_order_builder.rep_name` / `rep_email` metafields on any draft order |

---

## Metafields stamped on every draft order

| Namespace | Key | Value |
|---|---|---|
| `ninja_order_builder` | `rep_name` | Full name of the rep who built the order |
| `ninja_order_builder` | `rep_email` | Email address of the rep |
| `ninja_order_builder` | `built_at` | ISO timestamp of when the order was created |

---

## Local proxy development

```bash
cd proxy
npm install
cp .env.example .env   # fill in your values
npx vercel dev         # runs proxy locally on port 3000
```

---

## Versioning

| Version | Notes |
|---|---|
| v1.3 | Shopify OAuth via Vercel proxy, staff-gated, rep metafields |
| v1.2 | Client Credentials Grant (Dev Dashboard apps), transparent icons |
| v1.1 | Full Ninja Transfers brand redesign, light/dark mode |
| v1.0 | Initial build |
