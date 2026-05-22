// background.js — v1.3.3
// Background worker detects navigation to /success?code=...
// calls the exchange endpoint itself, stores the token.
// No sendMessage needed — worker wakes on tab navigation.

const PROXY_URL = 'https://ninja-order-builder.vercel.app';

let authTabId   = null;
let authResolve = null;
let authReject  = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'startAuth') {
    startAuth(msg.proxyUrl || PROXY_URL)
      .then(token  => sendResponse({ ok: true,  token }))
      .catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (msg.action === 'signOut') {
    chrome.storage.local.remove(['sessionToken'], () => sendResponse({ ok: true }));
    return true;
  }
});

function startAuth(proxyUrl) {
  return new Promise((resolve, reject) => {
    if (authTabId !== null) {
      chrome.tabs.update(authTabId, { active: true });
      authResolve = resolve;
      authReject  = reject;
      return;
    }
    authResolve = resolve;
    authReject  = reject;
    chrome.tabs.create({ url: `${proxyUrl}/api/auth/start?brand=transfers` }, tab => {
      authTabId = tab.id;
    });
    setTimeout(() => {
      if (authResolve) {
        cleanupAuthTab();
        authReject(new Error('Sign-in timed out. Please try again.'));
      }
    }, 5 * 60 * 1000);
  });
}

// Watch for navigation to /success — extract code and exchange for token
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId !== authTabId)              return;
  if (changeInfo.status !== 'complete') return;
  if (!tab.url)                         return;

  let url;
  try { url = new URL(tab.url); } catch { return; }
  if (!url.pathname.endsWith('/success')) return;

  const code  = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    const errorMessages = {
      auth_failed:  'Authentication failed. Please try again.',
      not_staff:    "Your Shopify account doesn't have staff access.",
      server_error: 'Server error during sign-in. Please try again.',
    };
    const reject = authReject;
    cleanupAuthTab();
    if (reject) reject(new Error(errorMessages[error] || 'Sign-in failed.'));
    return;
  }

  if (!code) return;

  // Exchange code for token directly from the background worker
  fetch(`${PROXY_URL}/api/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  .then(r => r.json())
  .then(data => {
    if (!data.token) throw new Error(data.error || 'No token returned');
    chrome.storage.local.set({ sessionToken: data.token }, () => {
      const resolve = authResolve;
      cleanupAuthTab();
      if (resolve) resolve(data.token);
    });
  })
  .catch(err => {
    const reject = authReject;
    cleanupAuthTab();
    if (reject) reject(new Error(`Exchange failed: ${err.message}`));
  });
});

chrome.tabs.onRemoved.addListener(tabId => {
  if (tabId !== authTabId) return;
  const reject = authReject;
  cleanupAuthTab();
  if (reject) reject(new Error('Sign-in cancelled.'));
});

function cleanupAuthTab() {
  if (authTabId !== null) {
    chrome.tabs.remove(authTabId, () => {});
    authTabId = null;
  }
  authResolve = null;
  authReject  = null;
}
