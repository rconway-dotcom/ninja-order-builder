// background.js — Single store (Ninja Transfers)
// Handles Shopify OAuth tab and extracts JWT when proxy redirects to /success.

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

  // Receive token directly from success page
  if (msg.action === 'authComplete' && msg.token) {
    chrome.storage.local.set({ sessionToken: msg.token }, () => {
      if (authResolve) {
        const resolve = authResolve;
        cleanupAuthTab();
        resolve(msg.token);
      }
      sendResponse({ ok: true });
    });
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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId !== authTabId)              return;
  if (changeInfo.status !== 'complete') return;
  if (!tab.url)                         return;

  let url;
  try { url = new URL(tab.url); } catch { return; }
  if (!url.pathname.endsWith('/success')) return;

  const token = url.searchParams.get('token');
  const error = url.searchParams.get('error');

  if (token) {
    chrome.storage.local.set({ sessionToken: token }, () => {
      const resolve = authResolve;
      cleanupAuthTab();
      if (resolve) resolve(token);
    });
  } else {
    const errorMessages = {
      auth_failed:  'Authentication failed. Please try again.',
      not_staff:    "Your Shopify account doesn't have staff access.",
      server_error: 'Server error during sign-in. Please try again.',
    };
    const msg    = errorMessages[error] || 'Sign-in failed. Please try again.';
    const reject = authReject;
    cleanupAuthTab();
    if (reject) reject(new Error(msg));
  }
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
