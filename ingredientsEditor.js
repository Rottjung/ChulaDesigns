// Ingredients Editor: manages user price overrides merged with base DB.

const USER_PRICES_KEY = 'brood_user_prices_v1';

function ie_getUserPrices() {
  try { return JSON.parse(localStorage.getItem(USER_PRICES_KEY) || '{}') || {}; } catch { return {}; }
}
function ie_setUserPrices(obj) {
  localStorage.setItem(USER_PRICES_KEY, JSON.stringify(obj || {}));
  document.dispatchEvent(new CustomEvent('userPricesUpdated'));
  showPopup('Saved ingredient prices');
}

function ie_merge(base, user) {
  const out = JSON.parse(JSON.stringify(base || {}));
  Object.keys(user || {}).forEach(ing => {
    if (!out[ing]) out[ing] = {};
    Object.assign(out[ing], user[ing]);
  });
  return out;
}

function ie_refreshDatalist() {
  const dl = document.getElementById('ingredient-list');
  if (!dl) return;
  const merged = ie_merge(window.basePricesCache || {}, ie_getUserPrices());
  const names = Object.keys(merged).sort();
  dl.innerHTML = names.map(n => `<option value="${n}"></option>`).join('');
}

function ie_renderTable() {
  const tbody = document.querySelector('#ie-table tbody');
  if (!tbody) return;
  const merged = ie_merge(window.basePricesCache || {}, ie_getUserPrices());
  const rows = [];
  Object.keys(merged).sort().forEach(ing => {
    const brands = merged[ing] || {};
    Object.keys(brands).sort().forEach(brand => {
      rows.push({ ing, brand, price: brands[brand] });
    });
  });
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.ing}</td>
      <td>${r.brand}</td>
      <td>${Number(r.price).toFixed(2)}</td>
      <td><button data-ing="${r.ing}" data-brand="${r.brand}" class="ie-del">Delete</button></td>
    </tr>
  `).join('');

  // Wire delete buttons (affects user overrides only)
  tbody.querySelectorAll('.ie-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const ing = btn.getAttribute('data-ing');
      const brand = btn.getAttribute('data-brand');
      const user = ie_getUserPrices();
      if (user[ing] && user[ing][brand] != null) {
        delete user[ing][brand];
        if (Object.keys(user[ing]).length === 0) delete user[ing];
        ie_setUserPrices(user);
        ie_renderTable();
        ie_refreshDatalist();
      } else {
        showPopup('That brand is from the base DB; create an override to change it.');
      }
    });
  });
}

function ie_addOrUpdate() {
  const ingEl = document.getElementById('ie-ingredient');
  const brandEl = document.getElementById('ie-brand');
  const priceEl = document.getElementById('ie-price');
  const ing = (ingEl.value || '').trim();
  const brand = (brandEl.value || '').trim();
  const price = parseFloat(priceEl.value);

  if (!ing || !brand || isNaN(price)) { showPopup('Please fill ingredient, brand and price.'); return; }

  const user = ie_getUserPrices();
  if (!user[ing]) user[ing] = {};
  user[ing][brand] = price;
  ie_setUserPrices(user);

  // Update UI
  ie_renderTable();
  ie_refreshDatalist();

  // Clear brand/price fields but keep ingredient for faster entry
  brandEl.value = '';
  priceEl.value = '';
}

function ie_export() {
  const data = JSON.stringify(ie_getUserPrices(), null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'ingredientPrices_user.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function ie_import(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(reader.result);
      if (typeof obj !== 'object' || Array.isArray(obj)) throw new Error('bad format');
      ie_setUserPrices(obj);
      ie_renderTable();
      ie_refreshDatalist();
      showPopup('Imported prices.');
    } catch {
      showPopup('Invalid JSON for prices.');
    } finally {
      e.target.value = '';
    }
  };
  reader.readAsText(file);
}

// Wire up once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('ie-add')?.addEventListener('click', ie_addOrUpdate);
  document.getElementById('ie-export')?.addEventListener('click', ie_export);
  document.getElementById('ie-import')?.addEventListener('change', ie_import);

  const tryInit = () => { ie_refreshDatalist(); ie_renderTable(); };
  if (window.basePricesCache && Object.keys(window.basePricesCache).length) tryInit();
  document.addEventListener('pricesLoaded', tryInit);
  document.addEventListener('userPricesUpdated', tryInit);
});
