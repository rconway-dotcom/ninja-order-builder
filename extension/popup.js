// ============================================================
// Ninja Order Builder — popup.js  v1.3
// Auth: Shopify OAuth via Vercel proxy (staff-gated)
// Credentials never stored in the extension — reps sign in
// with their own Shopify staff accounts.
// ============================================================

// ─── Icons ────────────────────────────────────────────────────────────────
const I = {
  refresh:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 3.5v3h-3"/><path d="M13.5 6.5A5.5 5.5 0 1 0 14 9"/></svg>',
  settings: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v1.6M8 12.9v1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M1.5 8h1.6M12.9 8h1.6M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/></svg>',
  search:   '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="4.5"/><path d="m13.5 13.5-3-3"/></svg>',
  arrowL:   '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3.5 5.5 8 10 12.5M5.5 8h8"/></svg>',
  arrowR:   '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5 10.5 8 6 12.5M10.5 8h-8"/></svg>',
  check:    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 8 3.5 3.5L13 4.5"/></svg>',
  image:    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2.5" width="12" height="11" rx="1.5"/><circle cx="6" cy="6.5" r="1.2"/><path d="m2.5 11.5 3.5-3 3 2.5 3-2 1.5 1.5"/></svg>',
  external: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3.5h3.5V7M12.5 3.5 7 9"/><path d="M11.5 9.5v2.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1h2.5"/></svg>',
  info:     '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 7.5v3.5M8 5.2v.1"/></svg>',
  alert:    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2 1.8 13h12.4z"/><path d="M8 6.5v3M8 11.8v.1"/></svg>',
  cart:     '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5h2L5.5 11h7l1.2-5H4.6"/><circle cx="6" cy="13" r="0.9"/><circle cx="12" cy="13" r="0.9"/></svg>',
  sun:      '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 1.5v1.4M8 13.1v1.4M2.6 2.6l1 1M12.4 12.4l1 1M1.5 8h1.4M13.1 8h1.4M2.6 13.4l1-1M12.4 3.6l1-1"/></svg>',
  moon:     '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 9.4A6 6 0 0 1 6.6 2.5 6 6 0 1 0 13.5 9.4z"/></svg>',
  send:     '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m14 2-6.5 12L6 9 1.5 7.5z"/></svg>',
  signIn:   '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3M10.5 11 14 8l-3.5-3M14 8H6"/></svg>',
  signOut:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3M6.5 11 3 8l3.5-3M3 8h8"/></svg>',
  user:     '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="5.5" r="2.5"/><path d="M2.5 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/></svg>',
  lock:     '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></svg>',
};

// ─── State ────────────────────────────────────────────────────────────────
const PROXY_URL = 'https://ninja-order-builder.vercel.app';

let state = {
  step: 1,
  cartItems: [],
  rawCart: null,
  selectedCustomer: null,
  newCustomer: null,
  note: '',
  sessionToken: null,  // JWT from proxy — identifies the rep
  repInfo: null,       // { email, firstName, lastName } decoded from JWT
  createdOrderUrl: null,
  theme: 'light',
};

// ─── Init ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const stored = await chromeGet(['sessionToken', 'theme']);
  state.theme = stored.theme || 'light';
  applyTheme(state.theme);
  renderHeaderActions();

  if (stored.sessionToken) {
    const rep = parseJWT(stored.sessionToken);
    if (rep && rep.exp * 1000 > Date.now()) {
      // Valid session — go straight to cart
      state.sessionToken = stored.sessionToken;
      state.repInfo = rep;
      renderStepper();
      renderFooterFor(1);
      await fetchCart();
      return;
    }
    // Token expired — clear it and show sign-in
    await chromeSet({ sessionToken: null });
  }

  renderSignIn();
});

// ─── Storage helpers ──────────────────────────────────────────────────────
function chromeGet(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, r => resolve(r || {})));
}
function chromeSet(obj) {
  return new Promise(resolve => chrome.storage.local.set(obj, () => resolve()));
}

// ─── JWT decode (no verification — proxy already validated it) ────────────
function parseJWT(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

// ─── Theme ────────────────────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
}
async function setTheme(theme) {
  applyTheme(theme);
  await chromeSet({ theme });
  renderHeaderActions();
}

// ─── Header ───────────────────────────────────────────────────────────────
function renderHeaderActions() {
  const el = document.getElementById('headerActions');
  const signedIn = !!state.sessionToken;
  el.innerHTML = `
    <div class="theme-toggle" role="group" aria-label="Theme">
      <button class="theme-toggle__btn ${state.theme === 'light' ? 'is-active' : ''}" data-theme="light" title="Light">${I.sun}</button>
      <button class="theme-toggle__btn ${state.theme === 'dark'  ? 'is-active' : ''}" data-theme="dark"  title="Dark">${I.moon}</button>
    </div>
    ${signedIn ? `<button class="icon-btn" id="btnRefresh" title="Refresh cart">${I.refresh}</button>` : ''}
    ${signedIn ? `<button class="icon-btn" id="btnSignOut" title="Sign out (${state.repInfo?.email || ''})">${I.signOut}</button>` : ''}
  `;
  el.querySelectorAll('.theme-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => setTheme(btn.dataset.theme));
  });
  document.getElementById('btnRefresh')?.addEventListener('click', fetchCart);
  document.getElementById('btnSignOut')?.addEventListener('click', signOut);
}

// ─── Sign-in screen ───────────────────────────────────────────────────────
function renderSignIn(errorMsg) {
  document.getElementById('stepperNav').style.display = 'none';
  document.getElementById('mainFooter').style.display = 'none';
  document.getElementById('mainContent').innerHTML = `
    <div class="setup-wrap">
      <div class="setup-mascot"></div>
      <div>
        <div class="setup-title">Sign in to get started</div>
        <div class="setup-body" style="margin-top:8px">
          Use your <strong>Ninja Transfers Shopify account</strong> to sign in. Only staff members can access this tool.
        </div>
      </div>
      ${errorMsg ? `
        <div style="background:var(--danger-bg);border:1px solid var(--danger);border-radius:10px;padding:10px 14px;font-size:12px;color:var(--danger);font-weight:600;display:flex;align-items:center;gap:8px;width:100%;max-width:300px;">
          ${I.alert} ${escapeHtml(errorMsg)}
        </div>` : ''}
      <button class="btn btn--primary" id="btnSignIn" style="max-width:260px;width:100%">
        ${I.signIn}<span>Sign in with Shopify</span>
      </button>
      <div class="setup-meta">${I.lock} Verified against your Shopify staff account</div>
    </div>
  `;
  document.getElementById('btnSignIn').addEventListener('click', startSignIn);
}

async function startSignIn() {
  const btn = document.getElementById('btnSignIn');
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = `<div class="spinner" style="border-top-color:currentColor;border-color:rgba(255,255,255,0.3)"></div><span>Opening Shopify…</span>`;

  try {
    const result = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'startAuth', proxyUrl: PROXY_URL }, response => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response?.ok) {
          resolve(response.token);
        } else {
          reject(new Error(response?.error || 'Sign-in failed'));
        }
      });
    });

    // Signed in successfully
    state.sessionToken = result;
    state.repInfo = parseJWT(result);
    renderHeaderActions();
    renderStepper();
    renderFooterFor(1);
    await fetchCart();

  } catch (err) {
    renderSignIn(err.message);
  }
}

async function signOut() {
  await chromeSet({ sessionToken: null });
  state.sessionToken = null;
  state.repInfo = null;
  state.cartItems = [];
  state.rawCart = null;
  state.step = 1;
  renderHeaderActions();
  renderSignIn();
}

// ─── Stepper ──────────────────────────────────────────────────────────────
function renderStepper() {
  const nav = document.getElementById('stepperNav');
  const steps = [
    { n: 1, label: 'Cart' },
    { n: 2, label: 'Customer' },
    { n: 3, label: 'Review' },
  ];
  nav.style.display = 'flex';
  nav.innerHTML = steps.map((s, i) => {
    const cls = state.step === s.n ? 'is-active' : state.step > s.n ? 'is-done' : '';
    const numContent = state.step > s.n ? I.check : s.n;
    const rule = i < steps.length - 1
      ? `<div class="pop-step__rule ${state.step > s.n ? 'is-done' : ''}"></div>` : '';
    return `
      <div class="pop-step ${cls}">
        <div class="pop-step__num">${numContent}</div>
        <div class="pop-step__label">${s.label}</div>
      </div>${rule}`;
  }).join('');
}

// ─── Cart ─────────────────────────────────────────────────────────────────
async function fetchCart() {
  setCartLoading();
  try {
    const res = await fetch('https://ninjatransfers.com/cart.json', {
      credentials: 'include',
      cache: 'no-cache',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.rawCart = data;
    state.cartItems = parseCartItems(data);
    renderCartPanel();
  } catch (err) {
    renderCartError(err.message);
  }
}

function parseCartItems(cart) {
  if (!cart?.items?.length) return [];
  return cart.items.map(item => {
    // Properties can be an array [{name,value}] or an object {key:value}
    const toArray = p => Array.isArray(p)
      ? p
      : Object.entries(p || {}).map(([name, value]) => ({ name, value: String(value) }));

    const allProps = toArray(item.properties);
    const displayProps = allProps.filter(p =>
      !p.name.startsWith('_cartImg') &&
      !p.name.startsWith('_discount_input') &&
      !p.name.startsWith('_discount_name') &&
      !p.name.startsWith('_Original Image') &&
      p.value && p.value.toString().trim() !== ''
    );
    return {
      variantId:         item.variant_id,
      productId:         item.product_id,
      title:             item.product_title || item.title,
      variantTitle:      item.variant_title,
      sku:               item.sku,
      quantity:          item.quantity,
      price:             item.price,
      originalPrice:     item.original_price,
      linePrice:         item.line_price,
      originalLinePrice: item.original_line_price,
      image:             item.image,
      url:               item.url,
      properties:        displayProps,
      allProperties:     allProps,
    };
  });
}

function setCartLoading() {
  document.getElementById('mainContent').innerHTML =
    `<div class="loading-row"><div class="spinner"></div> Fetching cart from Ninja Transfers…</div>`;
}
function renderCartError(msg) {
  document.getElementById('mainContent').innerHTML = `
    <div class="state-box">
      <div class="state-box__icon is-warning">${I.alert}</div>
      <div class="state-box__title">Couldn't load cart</div>
      <div class="state-box__body">${escapeHtml(msg)}<br><br>Make sure you're signed in to ninjatransfers.com and have items in your cart.</div>
    </div>`;
  disableNext();
}
function renderCartPanel() {
  const items = state.cartItems;
  const el = document.getElementById('mainContent');
  if (!items.length) {
    el.innerHTML = `
      <div class="state-box">
        <div class="state-box__icon">${I.cart}</div>
        <div class="state-box__title">Cart is empty</div>
        <div class="state-box__body">Add items to the cart on ninjatransfers.com first.</div>
      </div>`;
    disableNext();
    return;
  }
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal   = items.reduce((s, i) => s + i.linePrice, 0);
  const orig       = items.reduce((s, i) => s + i.originalLinePrice, 0);
  const saved      = orig - subtotal;
  let html = `
    <div class="sum-bar">
      <div class="sum-bar__left">
        <div class="sum-bar__count">${items.length} line item${items.length !== 1 ? 's' : ''} · ${totalItems} transfer${totalItems !== 1 ? 's' : ''}</div>
        ${saved > 0 ? `<div class="sum-bar__savings">${I.check} Saving ${formatMoney(saved)} in discounts</div>` : ''}
      </div>
      <div class="sum-bar__total">${formatMoney(subtotal)}</div>
    </div>`;
  html += items.map(item => renderItemCard(item)).join('');
  el.innerHTML = html;
  enableNext('Next: Customer', I.arrowR);
}
function renderItemCard(item) {
  const isDisc  = item.price < item.originalPrice;
  const variant = item.variantTitle && item.variantTitle !== 'Default Title'
    ? `<span class="variant"> — ${escapeHtml(item.variantTitle)}</span>` : '';
  const thumb = item.image ? `<img src="${escapeAttr(item.image)}" alt="" />` : I.image;
  return `
    <article class="item-card">
      <div class="item-card__header">
        <div class="item-card__thumb">${thumb}</div>
        <div class="item-card__title">${escapeHtml(item.title)}${variant}</div>
        <div class="item-card__qty">×${item.quantity}</div>
      </div>
      <div class="item-card__body">${renderProperties(item.properties)}</div>
      <div class="item-card__price">
        ${isDisc ? `<span class="price-was">${formatMoney(item.originalPrice)}</span>` : '<span></span>'}
        <span class="price-now">${formatMoney(item.price)} ea</span>
        <span class="price-line">${formatMoney(item.linePrice)}</span>
      </div>
    </article>`;
}
function renderProperties(props) {
  if (!props?.length) return '';
  return props.map(p => {
    let label = p.name.replace(/^_/, '').replace(/ \(Vector Files Preferred\)/i, '');
    let value = p.value.toString();
    let cls   = 'prop-value';
    let inner = escapeHtml(value);
    if (value.startsWith('http')) {
      cls += ' is-link';
      let shortVal = value;
      try {
        const url   = new URL(value);
        const parts = url.pathname.split('/');
        shortVal = `…/${parts.slice(-2).join('/')}${url.search ? '?…' : ''}`;
      } catch {}
      inner = `${escapeHtml(shortVal)} ${I.external}`;
    } else if (label.toLowerCase() === 'width' || label.toLowerCase() === 'height') {
      cls  += ' is-dim';
      inner = `${escapeHtml(value)}"`;
    } else if (value.toLowerCase() === 'yes') {
      cls += ' is-yes';
    } else if (value.toLowerCase() === 'no') {
      cls += ' is-no';
    }
    return `<div class="prop-label">${escapeHtml(label)}</div><div class="${cls}">${inner}</div>`;
  }).join('');
}

// ─── Customer panel ───────────────────────────────────────────────────────
function renderCustomerPanel() {
  document.getElementById('mainContent').innerHTML = `
    <div class="search-row">
      <input class="input" id="customerSearch" type="text" placeholder="Search by name or email…" />
      <button class="search-row__btn" id="btnSearchCustomer" title="Search">${I.search}</button>
    </div>
    <div id="customerResults"></div>
    <div id="selectedCustomerBadge"></div>
    <div class="divider">or add new</div>
    <div class="form-stack">
      <div class="form-row">
        <div class="field"><div class="field__label">First name</div><input class="input" id="newFirstName" type="text" placeholder="Jane" /></div>
        <div class="field"><div class="field__label">Last name</div><input class="input" id="newLastName" type="text" placeholder="Smith" /></div>
      </div>
      <div class="field"><div class="field__label">Email</div><input class="input" id="newEmail" type="email" placeholder="jane@example.com" /></div>
      <div class="field"><div class="field__label">Phone (optional)</div><input class="input" id="newPhone" type="tel" placeholder="+1 555-000-0000" /></div>
    </div>
  `;
  document.getElementById('btnSearchCustomer').addEventListener('click', doCustomerSearch);
  document.getElementById('customerSearch').addEventListener('keydown', e => { if (e.key === 'Enter') doCustomerSearch(); });
  updateSelectedBadge();
  checkCustomerNextState();
}

async function doCustomerSearch() {
  const query = document.getElementById('customerSearch').value.trim();
  if (!query) { showToast('Enter a name or email to search', 'error'); return; }
  const resultsEl = document.getElementById('customerResults');
  resultsEl.innerHTML = `<div class="loading-row"><div class="spinner"></div> Searching…</div>`;
  try {
    const res  = await proxyFetch(`/admin/api/2024-01/customers/search.json?query=${encodeURIComponent(query)}&limit=5`);
    const data = await res.json();
    if (!data.customers?.length) {
      resultsEl.innerHTML = `<div class="state-box" style="padding:18px 16px"><div class="state-box__body">No customers found for <strong>"${escapeHtml(query)}"</strong> — fill in the new customer form below.</div></div>`;
      return;
    }
    let html = '<div class="cust-list">';
    data.customers.forEach(c => {
      const selected = state.selectedCustomer?.id === c.id;
      const initials = ((c.first_name || '').charAt(0) + (c.last_name || '').charAt(0)).toUpperCase() || '?';
      html += `
        <div class="cust-card ${selected ? 'is-selected' : ''}" data-customer='${JSON.stringify(c).replace(/'/g, "&#39;").replace(/"/g, '&quot;')}'>
          <div class="cust-card__avatar">${escapeHtml(initials)}</div>
          <div class="cust-card__info">
            <div class="cust-card__name">${escapeHtml((c.first_name || '') + ' ' + (c.last_name || ''))}</div>
            <div class="cust-card__email">${escapeHtml(c.email || '—')}</div>
            <div class="cust-card__meta">${c.orders_count} order${c.orders_count !== 1 ? 's' : ''}</div>
          </div>
          <div class="cust-card__check">${I.check}</div>
        </div>`;
    });
    html += '</div>';
    resultsEl.innerHTML = html;
    resultsEl.querySelectorAll('.cust-card').forEach(card => {
      card.addEventListener('click', () => {
        resultsEl.querySelectorAll('.cust-card').forEach(c => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        const raw = card.dataset.customer.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
        state.selectedCustomer = JSON.parse(raw);
        state.newCustomer = null;
        clearNewCustomerForm();
        updateSelectedBadge();
      });
    });
  } catch (err) {
    handleProxyError(err, resultsEl);
  }
}

function clearNewCustomerForm() {
  ['newFirstName','newLastName','newEmail','newPhone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}
function updateSelectedBadge() {
  const badge = document.getElementById('selectedCustomerBadge');
  if (!badge) return;
  if (state.selectedCustomer) {
    const c = state.selectedCustomer;
    badge.innerHTML = `
      <div class="sel-badge">
        <div class="sel-badge__label">${I.check} Selected customer</div>
        <div class="sel-badge__name">${escapeHtml((c.first_name || '') + ' ' + (c.last_name || ''))}</div>
        <div class="sel-badge__email">${escapeHtml(c.email || '—')}</div>
      </div>`;
    enableNext('Next: Review', I.arrowR);
  } else {
    badge.innerHTML = '';
  }
}
function checkCustomerNextState() {
  const nc = collectNewCustomer();
  if (state.selectedCustomer || nc) enableNext('Next: Review', I.arrowR);
  else disableNext('Next: Review', I.arrowR);
  ['newFirstName','newLastName','newEmail'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      const nc2 = collectNewCustomer();
      if (state.selectedCustomer || nc2) enableNext('Next: Review', I.arrowR);
      else disableNext('Next: Review', I.arrowR);
    });
  });
}

// ─── Review panel ─────────────────────────────────────────────────────────
function renderReviewPanel() {
  const subtotal   = state.cartItems.reduce((s, i) => s + i.linePrice, 0);
  const orig       = state.cartItems.reduce((s, i) => s + i.originalLinePrice, 0);
  const totalItems = state.cartItems.reduce((s, i) => s + i.quantity, 0);
  const savings    = orig - subtotal;
  let customerHtml = '';
  const nc = collectNewCustomer();
  if (state.selectedCustomer) {
    const c = state.selectedCustomer;
    const initials = ((c.first_name || '').charAt(0) + (c.last_name || '').charAt(0)).toUpperCase() || '?';
    customerHtml = `<div class="customer-line"><div class="customer-line__avatar">${escapeHtml(initials)}</div><div><div class="customer-line__name">${escapeHtml((c.first_name||'')+' '+(c.last_name||''))}</div><div class="customer-line__email">${escapeHtml(c.email||'—')}</div></div></div>`;
  } else if (nc) {
    const initials = (nc.first_name.charAt(0)+nc.last_name.charAt(0)).toUpperCase();
    customerHtml = `<div class="customer-line"><div class="customer-line__avatar">${escapeHtml(initials)}</div><div><div class="customer-line__name">${escapeHtml(nc.first_name+' '+nc.last_name)}</div><div class="customer-line__email">${escapeHtml(nc.email)}</div></div><div class="customer-line__chip">New</div></div>`;
  }

  // Rep attribution row
  const repHtml = state.repInfo ? `
    <div class="review-row" style="margin-top:4px;padding-top:10px;border-top:1px solid var(--line)">
      <div class="review-row__label" style="display:flex;align-items:center;gap:5px">${I.user} Built by</div>
      <div class="review-row__value" style="font-size:12px">${escapeHtml(state.repInfo.firstName+' '+state.repInfo.lastName)}</div>
    </div>` : '';

  document.getElementById('mainContent').innerHTML = `
    <div class="review-section">
      <div class="review-section__label">Customer</div>
      <div class="review-card">${customerHtml}</div>
    </div>
    <div class="review-section">
      <div class="review-section__label">Order summary</div>
      <div class="review-card">
        <div class="review-row"><div class="review-row__label">Line items</div><div class="review-row__value">${state.cartItems.length} SKU${state.cartItems.length!==1?'s':''} · ${totalItems} transfer${totalItems!==1?'s':''}</div></div>
        ${savings > 0 ? `<div class="review-row"><div class="review-row__label">Subtotal</div><div class="review-row__value is-strike">${formatMoney(orig)}</div></div><div class="review-row"><div class="review-row__label">Discounts</div><div class="review-row__value is-positive">− ${formatMoney(savings)}</div></div>` : ''}
        <div class="review-divider"></div>
        <div class="review-total"><div class="review-total__label">Draft total</div><div class="review-total__value">${formatMoney(subtotal)}</div></div>
        ${repHtml}
      </div>
    </div>
    <div class="review-section">
      <div class="review-section__label">Internal note <span class="normal">· optional</span></div>
      <textarea class="textarea" id="orderNote" placeholder="Special instructions, etc.">${escapeHtml(state.note)}</textarea>
    </div>
    <div class="note-card">${I.info}<div>This creates a <strong>draft order</strong> in Shopify — nothing is charged. Open it after to send the invoice.</div></div>`;
  document.getElementById('orderNote').addEventListener('input', e => { state.note = e.target.value; });
  renderReviewFooter();
}

function renderReviewFooter() {
  const footer = document.getElementById('mainFooter');
  footer.style.display = 'flex';
  footer.innerHTML = `
    <button class="btn btn--ghost" id="btnBack">${I.arrowL}<span>Back</span></button>
    <button class="btn btn--primary" id="btnCreateOrder" style="flex:1">${I.send}<span>Create draft order</span></button>
  `;
  document.getElementById('btnBack').addEventListener('click', () => goToStep(2));
  document.getElementById('btnCreateOrder').addEventListener('click', createDraftOrder);
}

// ─── Create draft order ──────────────────────────────────────────────────
async function createDraftOrder() {
  renderSubmitting();
  let stepFlags = { customer: false, items: false, posting: false };
  const updateProg = () => {
    const cont = document.getElementById('submitProgress');
    if (!cont) return;
    cont.innerHTML = `
      ${progLine('Customer matched',    stepFlags.customer, false)}
      ${progLine('Line items prepared', stepFlags.items,    !stepFlags.items && stepFlags.customer)}
      ${progLine('Posting to Shopify',  stepFlags.posting,  !stepFlags.posting && stepFlags.items)}
    `;
  };
  updateProg();

  try {
    let customerId = null;
    if (state.selectedCustomer) {
      customerId = state.selectedCustomer.id;
    } else {
      const nc = collectNewCustomer();
      if (!nc) { showToast('Please select or enter a customer', 'error'); goToStep(2); return; }
      const createRes = await proxyFetch(
        '/admin/api/2024-01/customers.json',
        { method: 'POST', body: JSON.stringify({ customer: nc }) }
      );
      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.errors ? JSON.stringify(err.errors) : 'Failed to create customer');
      }
      customerId = (await createRes.json()).customer.id;
    }
    stepFlags.customer = true; updateProg();

    const lineItems = state.cartItems.map(item => ({
      variant_id: item.variantId,
      quantity:   item.quantity,
      properties: item.allProperties
        .filter(p =>
          !p.name.startsWith('_cartImg') &&
          !p.name.startsWith('_discount_input') &&
          !p.name.startsWith('_discount_name') &&
          p.value && p.value.toString().trim() !== ''
        )
        .map(p => ({ name: p.name, value: p.value.toString() })),
    }));
    stepFlags.items = true; updateProg();

    const orderRes = await proxyFetch(
      '/admin/api/2024-01/draft_orders.json',
      {
        method: 'POST',
        body: JSON.stringify({
          draft_order: {
            line_items: lineItems,
            customer: { id: customerId },
            use_customer_default_address: true,
            note: state.note || undefined,
            tags: 'rep-built',
            // Metafields are injected server-side by the proxy
          },
        }),
      }
    );
    if (!orderRes.ok) {
      const err = await orderRes.json();
      const msgs = err.errors
        ? Object.entries(err.errors).map(([k, v]) => `${k}: ${v}`).join(', ')
        : 'Unknown error';
      throw new Error(msgs);
    }
    const order = (await orderRes.json()).draft_order;
    const _stored = await chromeGet(['shopDomain']);
    const shopSlug = (_stored.shopDomain || '').replace('.myshopify.com', '');
    state.createdOrderUrl = `https://admin.shopify.com/store/${shopSlug}/draft_orders/${order.id}`;
    stepFlags.posting = true; updateProg();

    setTimeout(() => renderSuccess(order), 250);
  } catch (err) {
    // If session expired mid-flow, send to sign-in
    if (err.message?.includes('SESSION_EXPIRED') || err.message?.includes('sign in')) {
      await chromeSet({ sessionToken: null });
      state.sessionToken = null;
      renderSignIn('Your session expired. Please sign in again.');
      return;
    }
    showToast(err.message, 'error');
    renderReviewPanel();
  }
}

function progLine(label, done, active) {
  return `
    <div class="submit-step ${done ? 'is-done' : active ? 'is-active' : ''}">
      <div class="submit-step__dot">${done ? I.check : active ? '<div class="spinner"></div>' : ''}</div>
      <span>${label}</span>
    </div>`;
}
function renderSubmitting() {
  document.getElementById('mainContent').innerHTML = `
    <div class="submit-wrap">
      <div class="spinner is-lg"></div>
      <div>
        <div class="submit-title">Creating draft order…</div>
        <div class="submit-body">Resolving customer, attaching artwork links, and posting to Shopify.</div>
      </div>
      <div class="submit-progress" id="submitProgress"></div>
    </div>`;
  document.getElementById('mainFooter').innerHTML = `
    <button class="btn btn--primary btn--block" disabled>
      <div class="spinner" style="border-top-color:currentColor;border-color:rgba(255,255,255,0.3)"></div>
      Working…
    </button>`;
}

function renderSuccess(order) {
  document.getElementById('stepperNav').style.display = 'none';
  document.getElementById('mainFooter').style.display = 'none';
  const total    = state.cartItems.reduce((s, i) => s + i.linePrice, 0);
  const customer = state.selectedCustomer
    ? `${state.selectedCustomer.first_name||''} ${state.selectedCustomer.last_name||''}`.trim()
    : (state.newCustomer ? `${state.newCustomer.first_name} ${state.newCustomer.last_name}` : '');
  document.getElementById('mainContent').innerHTML = `
    <div class="success-wrap">
      <div class="success-emoji">🎉</div>
      <div>
        <div class="success-title">Draft order created</div>
        <div class="success-body" style="margin-top:6px">All artwork links, dimensions and rep info are attached. Open it in Shopify to review and send the invoice.</div>
      </div>
      <div class="success-order">
        <div class="success-order__num">${escapeHtml(order.name||'#draft')}</div>
        ${customer ? `<span class="success-order__name">${escapeHtml(customer)}</span>` : ''}
        <div class="success-order__total">${formatMoney(total)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;width:100%">
        <a class="btn btn--primary btn--block" href="${escapeAttr(state.createdOrderUrl)}" target="_blank"><span>Open in Shopify</span>${I.external}</a>
        <button class="btn btn--ghost btn--block" id="btnReset">Build another order</button>
      </div>
    </div>`;
  document.getElementById('btnReset').addEventListener('click', () => {
    state = { ...state, step:1, cartItems:[], rawCart:null, selectedCustomer:null, newCustomer:null, note:'', createdOrderUrl:null };
    document.getElementById('mainFooter').style.display = 'flex';
    renderStepper();
    renderFooterFor(1);
    fetchCart();
  });
}

// ─── Footer / navigation ──────────────────────────────────────────────────
function renderFooterFor(step) {
  const footer = document.getElementById('mainFooter');
  footer.style.display = 'flex';
  if (step === 3) { renderReviewFooter(); return; }
  const nextLabel = step === 1 ? 'Next: Customer' : 'Next: Review';
  footer.innerHTML = `
    ${step > 1 ? `<button class="btn btn--ghost" id="btnBack">${I.arrowL}<span>Back</span></button>` : ''}
    <button class="btn btn--primary" id="btnNext" style="flex:1"><span>${nextLabel}</span>${I.arrowR}</button>`;
  document.getElementById('btnBack')?.addEventListener('click', () => goToStep(step - 1));
  document.getElementById('btnNext').addEventListener('click', handleNextClick);
}
function goToStep(step) {
  state.step = step;
  renderStepper();
  renderFooterFor(step);
  if (step === 1)      { if (state.rawCart) renderCartPanel(); else fetchCart(); }
  else if (step === 2) { renderCustomerPanel(); }
  else if (step === 3) { renderReviewPanel(); }
}
function handleNextClick() {
  if (state.step === 1) {
    if (!state.cartItems.length) { showToast('No cart items found', 'error'); return; }
    goToStep(2);
  } else if (state.step === 2) {
    const nc = collectNewCustomer();
    if (!state.selectedCustomer && !nc) { showToast('Select an existing customer or fill in new customer fields', 'error'); return; }
    if (!state.selectedCustomer && nc) state.newCustomer = nc;
    goToStep(3);
  }
}
function collectNewCustomer() {
  const first = document.getElementById('newFirstName')?.value.trim();
  const last  = document.getElementById('newLastName')?.value.trim();
  const email = document.getElementById('newEmail')?.value.trim();
  const phone = document.getElementById('newPhone')?.value.trim();
  if (!first || !last || !email) return null;
  const obj = { first_name: first, last_name: last, email };
  if (phone) obj.phone = phone;
  return obj;
}
function enableNext(label, icon) {
  const btn = document.getElementById('btnNext');
  if (!btn) return;
  btn.disabled = false;
  btn.innerHTML = `<span>${label}</span>${icon||''}`;
}
function disableNext(label, icon) {
  const btn = document.getElementById('btnNext');
  if (!btn) return;
  btn.disabled = true;
  if (label) btn.innerHTML = `<span>${label}</span>${icon||''}`;
}

// ─── Proxy fetch ──────────────────────────────────────────────────────────
async function proxyFetch(shopifyPath, options = {}) {
  const res = await fetch(`${PROXY_URL}/api/shopify`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${state.sessionToken}`,
    },
    body: JSON.stringify({
      path:   shopifyPath,
      method: options.method || 'GET',
      body:   options.body ? JSON.parse(options.body) : undefined,
    }),
  });

  // Surface session expiry so the caller can handle it
  if (res.status === 401) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || 'Session expired');
    err.code = data.code || 'SESSION_EXPIRED';
    throw err;
  }

  return res;
}

function handleProxyError(err, container) {
  if (err.code === 'SESSION_EXPIRED') {
    chromeSet({ sessionToken: null });
    state.sessionToken = null;
    renderSignIn('Your session expired. Please sign in again.');
    return;
  }
  if (container) {
    container.innerHTML = `<div class="state-box" style="padding:18px 16px"><div class="state-box__icon is-danger" style="width:36px;height:36px;margin-bottom:0">${I.alert}</div><div class="state-box__body">${escapeHtml(err.message)}</div></div>`;
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────
function formatMoney(cents) { return '$' + (cents / 100).toFixed(2); }
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast is-show' + (type ? ' is-' + type : '');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.className = 'toast'; }, 3000);
}
