// background.js — MV3 service worker
// Manages the Shopify OAuth flow for the popup.
// Opens an auth tab, watches for the success redirect, extracts the JWT,
// stores it, and notifies the popup — all without the popup staying open.

let authTabId   = null;
let authResolve = null;
let authReject  = null;

// ─── Message handler ──────────────────────────────────────────────────────
// Popup sends { action: 'startAuth' } when the rep clicks "Sign in with Shopify"
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'startAuth') {
    startAuth(msg.proxyUrl)
      .then(token  => sendResponse({ ok: true,  token }))
      .catch(error => sendResponse({ ok: false, error: error.message }));
    return true; // keep message channel open for async response
  }

  if (msg.action === 'signOut') {
    chrome.storage.local.remove(['sessionToken'], () => sendResponse({ ok: true }));
    return true;
  }
});

// ─── Start OAuth ──────────────────────────────────────────────────────────
function startAuth(proxyUrl) {
  return new Promise((resolve, reject) => {
    // If there's already an auth tab open, focus it
    if (authTabId !== null) {
      chrome.tabs.update(authTabId, { active: true });
      // Replace existing callbacks
      authResolve = resolve;
      authReject  = reject;
      return;
    }

    authResolve = resolve;
    authReject  = reject;

    chrome.tabs.create({ url: `${proxyUrl}/api/auth/start` }, tab => {
      authTabId = tab.id;
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      if (authResolve) {
        cleanupAuthTab();
        authReject(new Error('Sign-in timed out. Please try again.'));
      }
    }, 5 * 60 * 1000);
  });
}

// ─── Watch for the success redirect ──────────────────────────────────────
// When Shopify redirects to /success?token=..., we grab the token here.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId !== authTabId)              return;
  if (changeInfo.status !== 'complete') return;
  if (!tab.url)                         return;

  let url;
  try { url = new URL(tab.url); } catch { return; }

  // Wait until we're on the /success page of the proxy
  if (!url.pathname.endsWith('/success')) return;

  const token = url.searchParams.get('token');
  const error = url.searchParams.get('error');

  if (token) {
    // Store the JWT and resolve the promise
    chrome.storage.local.set({ sessionToken: token }, () => {
      const resolve = authResolve;
      cleanupAuthTab();
      resolve(token);
    });
  } else {
    const errorMessages = {
      auth_failed:  'Authentication failed. Please try again.',
      not_staff:    'Your Shopify account doesn\'t have staff access.',
      server_error: 'Server error during sign-in. Please try again.',
    };
    const msg = errorMessages[error] || 'Sign-in failed. Please try again.';
    const reject = authReject;
    cleanupAuthTab();
    reject(new Error(msg));
  }
});

// ─── Clean up if rep manually closes the auth tab ────────────────────────
chrome.tabs.onRemoved.addListener(tabId => {
  if (tabId !== authTabId) return;
  const reject = authReject;
  cleanupAuthTab();
  if (reject) reject(new Error('Sign-in cancelled.'));
});

function cleanupAuthTab() {
  if (authTabId !== null) {
    chrome.tabs.remove(authTabId, () => { /* ignore if already closed */ });
    authTabId = null;
  }
  authResolve = null;
  authReject  = null;
}
