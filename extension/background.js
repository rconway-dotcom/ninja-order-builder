// background.js — MV3 service worker v1.4.1
// Persists auth tab IDs in storage so they survive service worker restarts.

const PROXY_URL = 'https://ninja-order-builder.vercel.app';

let authSessions = {};

// Restore any pending auth tabs from storage on startup
chrome.storage.local.get(['_pendingAuthTabs'], result => {
  if (result._pendingAuthTabs) {
    authSessions = result._pendingAuthTabs;
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'startAuth') {
    startAuth(msg.proxyUrl || PROXY_URL, msg.brand || 'transfers')
      .then(token  => sendResponse({ ok: true,  token }))
      .catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (msg.action === 'signOut') {
    sendResponse({ ok: true });
    return true;
  }
});

function persistSessions() {
  chrome.storage.local.set({ _pendingAuthTabs: authSessions });
}

function startAuth(proxyUrl, brand) {
  return new Promise((resolve, reject) => {
    const existing = authSessions[brand];
    if (existing?.tabId != null) {
      chrome.tabs.update(existing.tabId, { active: true }, tab => {
        if (chrome.runtime.lastError) {
          // Tab no longer exists, create a new one
          delete authSessions[brand];
          persistSessions();
          startAuth(proxyUrl, brand).then(resolve).catch(reject);
        } else {
          existing.resolve = resolve;
          existing.reject  = reject;
        }
      });
      return;
    }

    authSessions[brand] = { tabId: null, resolve, reject };

    chrome.tabs.create({ url: `${proxyUrl}/api/auth/start?brand=${brand}` }, tab => {
      authSessions[brand].tabId = tab.id;
      persistSessions();
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

  // Check all pending sessions
  const brand = Object.keys(authSessions).find(k => authSessions[k]?.tabId === tabId);

  // Also check any tab navigating to /success even if we lost the session reference
  let url;
  try { url = new URL(tab.url); } catch { return; }
  if (!url.pathname.endsWith('/success')) return;

  const token = url.searchParams.get('token');
  const error = url.searchParams.get('error');

  if (!token && !error) return;

  // Decode brand from token if we lost the session
  let activeBrand = brand;
  if (!activeBrand && token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      activeBrand = payload.brand || 'transfers';
    } catch {}
  }

  if (token && activeBrand) {
    chrome.storage.local.get(['sessions'], result => {
      const sessions = result.sessions || {};
      sessions[activeBrand] = token;
      chrome.storage.local.set({ sessions }, () => {
        // Close the tab
        chrome.tabs.remove(tabId, () => {});
        // Resolve the promise if we have it
        if (authSessions[activeBrand]?.resolve) {
          const resolve = authSessions[activeBrand].resolve;
          cleanupAuthTab(activeBrand);
          resolve(token);
        }
      });
    });
  } else if (error) {
    const errorMessages = {
      auth_failed:  'Authentication failed. Please try again.',
      not_staff:    "Your Shopify account doesn't have staff access.",
      server_error: 'Server error during sign-in. Please try again.',
    };
    const msg = errorMessages[error] || 'Sign-in failed. Please try again.';
    chrome.tabs.remove(tabId, () => {});
    if (activeBrand && authSessions[activeBrand]?.reject) {
      const reject = authSessions[activeBrand].reject;
      cleanupAuthTab(activeBrand);
      reject(new Error(msg));
    }
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
  delete authSessions[brand];
  persistSessions();
}
