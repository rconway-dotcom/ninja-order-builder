// ============================================================
// Ninja Order Builder — settings.js  v1.3
// ============================================================

const PROXY_URL = 'https://ninja-order-builder.vercel.app';

const I = {
  check: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 8 3.5 3.5L13 4.5"/></svg>',
  alert: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2 1.8 13h12.4z"/><path d="M8 6.5v3M8 11.8v.1"/></svg>',
  user:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="5.5" r="2.5"/><path d="M2.5 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/></svg>',
  sun:   '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 1.5v1.4M8 13.1v1.4M2.6 2.6l1 1M12.4 12.4l1 1M1.5 8h1.4M13.1 8h1.4M2.6 13.4l1-1M12.4 3.6l1-1"/></svg>',
  moon:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 9.4A6 6 0 0 1 6.6 2.5 6 6 0 1 0 13.5 9.4z"/></svg>',
};

let currentTheme = 'light';

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['sessionToken', 'theme'], result => {
    currentTheme = result.theme || 'light';
    applyTheme(currentTheme);
    renderThemeToggle();
    renderSessionState(result.sessionToken);
  });

  document.getElementById('btnSignIn').addEventListener('click', startSignIn);
  document.getElementById('btnSignOut').addEventListener('click', signOut);
});

// ─── Theme ────────────────────────────────────────────────────────────────
function applyTheme(theme) { document.documentElement.setAttribute('data-theme', theme); currentTheme = theme; }
function setTheme(theme) { applyTheme(theme); chrome.storage.local.set({ theme }); renderThemeToggle(); }
function renderThemeToggle() {
  const el = document.getElementById('themeToggle');
  el.innerHTML = `
    <button class="theme-toggle__btn ${currentTheme==='light'?'is-active':''}" data-theme="light">${I.sun}</button>
    <button class="theme-toggle__btn ${currentTheme==='dark'?'is-active':''}"  data-theme="dark">${I.moon}</button>
  `;
  el.querySelectorAll('.theme-toggle__btn').forEach(b => b.addEventListener('click', () => setTheme(b.dataset.theme)));
}

// ─── Session rendering ────────────────────────────────────────────────────
function renderSessionState(token) {
  const infoEl    = document.getElementById('sessionInfo');
  const actionsEl = document.getElementById('sessionActions');
  const signInBtn = document.getElementById('btnSignIn');
  const signOutBtn = document.getElementById('btnSignOut');
  const pill      = document.getElementById('connectionPill');
  const pillIcon  = document.getElementById('connectionPillIcon');
  const pillText  = document.getElementById('connectionPillText');

  actionsEl.style.display = 'flex';

  if (!token) {
    infoEl.innerHTML = `
      <div class="state-box" style="padding:20px;text-align:left;align-items:flex-start">
        <div class="state-box__body">Not signed in. Click below to authenticate with your Shopify staff account.</div>
      </div>`;
    signInBtn.style.display  = '';
    signOutBtn.style.display = 'none';
    pill.className = 'set-header__pill is-warning';
    pillIcon.innerHTML = I.alert;
    pillText.textContent = 'Not signed in';
    return;
  }

  // Decode JWT (client-side only — no sensitive data in payload)
  let rep = null;
  try {
    const payload = token.split('.')[1];
    rep = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {}

  const expired = rep && rep.exp * 1000 < Date.now();

  if (expired || !rep) {
    infoEl.innerHTML = `
      <div class="state-box" style="padding:20px;text-align:left;align-items:flex-start">
        <div class="state-box__body" style="color:var(--warning)">Session expired. Please sign in again.</div>
      </div>`;
    signInBtn.style.display  = '';
    signOutBtn.style.display = 'none';
    pill.className = 'set-header__pill is-warning';
    pillIcon.innerHTML = I.alert;
    pillText.textContent = 'Session expired';
    return;
  }

  const expiresAt = new Date(rep.exp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const initials  = ((rep.firstName||'').charAt(0) + (rep.lastName||'').charAt(0)).toUpperCase();

  infoEl.innerHTML = `
    <div class="scope-row" style="gap:12px">
      <div style="width:40px;height:40px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;font-size:14px;font-weight:700;flex-shrink:0;border:1px solid var(--line)">${escapeHtml(initials)}</div>
      <div>
        <div style="font-size:14px;font-weight:700;color:var(--ink)">${escapeHtml((rep.firstName||'')+' '+(rep.lastName||''))}</div>
        <div style="font-size:12px;color:var(--ink-muted);margin-top:2px">${escapeHtml(rep.email||'')}</div>
        <div style="font-size:11px;color:var(--ink-soft);margin-top:3px">Session expires at ${expiresAt}</div>
      </div>
    </div>
    <div class="note-card" style="margin-top:4px">
      ${I.check}
      <div style="font-size:12px">Every draft order you build is stamped with your name and email as a Shopify metafield.</div>
    </div>`;

  signInBtn.style.display  = 'none';
  signOutBtn.style.display = '';
  pill.className = 'set-header__pill is-connected';
  pillIcon.innerHTML = I.check;
  pillText.textContent = `Signed in · ${rep.firstName||rep.email}`;
}

// ─── Sign in ──────────────────────────────────────────────────────────────
async function startSignIn() {
  const btn = document.getElementById('btnSignIn');
  btn.disabled = true;
  btn.innerHTML = `<div class="spinner"></div><span>Opening Shopify…</span>`;

  try {
    const token = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'startAuth', proxyUrl: PROXY_URL }, response => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else if (response?.ok) resolve(response.token);
        else reject(new Error(response?.error || 'Sign-in failed'));
      });
    });

    chrome.storage.local.set({ sessionToken: token }, () => {
      renderSessionState(token);
      showStatus('Signed in successfully!', 'success');
    });
  } catch (err) {
    showStatus(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Sign in with Shopify';
  }
}

// ─── Sign out ─────────────────────────────────────────────────────────────
function signOut() {
  chrome.storage.local.remove(['sessionToken', '_tokenValue', '_tokenExpiry'], () => {
    renderSessionState(null);
    showStatus('Signed out.', 'success');
  });
}

// ─── Status ───────────────────────────────────────────────────────────────
function showStatus(msg, type) {
  const bar = document.getElementById('statusBar');
  bar.className = `set-status is-show is-${type}`;
  bar.innerHTML = `${type === 'success' ? I.check : I.alert}<span>${escapeHtml(msg)}</span>`;
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
