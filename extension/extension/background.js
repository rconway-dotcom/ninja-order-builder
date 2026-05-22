// background.js — MV3 service worker v1.4
// Handles multi-brand OAuth tabs.
// Each brand gets its own auth tab.

let authSessions = {}; // { transfers: { tabId, resolve, reject }, patches: { ... } }

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'startAuth') {
    startAuth(msg.proxyUrl, msg.brand || 'transfers')
      .then(token  => sendResponse({ ok: true,  token }))
      .catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (msg.action === 'signOut') {
    sendResponse({ ok: true });
    return true;
  }
});

function startAuth(proxyUrl, brand) {
  return new Promise((resolve, reject) => {
    const existing = authSessions[brand];
    if (existing?.tabId != null) {
      chrome.tabs.update(existing.tabId, { active: true });
      existing.resolve = resolve;
      existing.reject  = reject;
      return;
    }

    authSessions[brand] = { tabId: null, resolve, reject };

    // Pass brand as a query param so the proxy knows which store to auth against
    chrome.tabs.create({ url: `${proxyUrl}/api/auth/start?brand=${brand}` }, tab => {
      authSessions[brand].tabId = tab.id;
    });

    setTimeout(() => {
      if (authSessions[brand]?.reject) {
        const rej = authSessions[brand].reject;
        cleanupAuthTab(brand);
        rej(new Error('Sign-in timed out. Please try again.'));
      }
    }, 5 * 60 * 1000);
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  // Find which brand this tab belongs to
  const brand = Object.keys(authSessions).find(k => authSessions[k]?.tabId === tabId);
  if (!brand) return;

  let url;
  try { url = new URL(tab.url); } catch { return; }
  if (!url.pathname.endsWith('/success')) return;

  const token = url.searchParams.get('token');
  const error = url.searchParams.get('error');

  if (token) {
    chrome.storage.local.get(['sessions'], result => {
      const sessions = result.sessions || {};
      sessions[brand] = token;
      chrome.storage.local.set({ sessions }, () => {
        const resolve = authSessions[brand].resolve;
        cleanupAuthTab(brand);
        resolve(token);
      });
    });
  } else {
    const errorMessages = {
      auth_failed:  'Authentication failed. Please try again.',
      not_staff:    "Your Shopify account doesn't have staff access.",
      server_error: 'Server error during sign-in. Please try again.',
    };
    const msg    = errorMessages[error] || 'Sign-in failed. Please try again.';
    const reject = authSessions[brand].reject;
    cleanupAuthTab(brand);
    reject(new Error(msg));
  }
});

chrome.tabs.onRemoved.addListener(tabId => {
  const brand = Object.keys(authSessions).find(k => authSessions[k]?.tabId === tabId);
  if (!brand) return;
  const reject = authSessions[brand].reject;
  cleanupAuthTab(brand);
  if (reject) reject(new Error('Sign-in cancelled.'));
});

function cleanupAuthTab(brand) {
  const session = authSessions[brand];
  if (!session) return;
  if (session.tabId != null) {
    // DEBUG: not closing tab so we can inspect console
    // chrome.tabs.remove(session.tabId, () => {});
  }
  delete authSessions[brand];
}
