// Ingredients Editor — inline wiring like Recipe Builder
const USER_PRICES_KEY = 'brood_user_prices_v1';

function ie_getUserPrices() {
  try { return JSON.parse(localStorage.getItem(USER_PRICES_KEY) || '{}') || {}; } catch { return {}; }
}
function ie_setUserPrices(obj) {
  localStorage.setItem(USER_PRICES_KEY, JSON.stringify(obj || {}));
  document.dispatchEvent(new CustomEvent('userPricesUpdated'));
  if (typeof showPopup === 'function') showPopup('Saved ingredient prices');
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
    Object.keys(brands).sort().forEach(brand => rows.push({ ing, brand, price: brands[brand] }));
  });
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.ing}</td>
      <td>${r.brand}</td>
      <td>${Number(r.price).toFixed(2)}</td>
      <td><button onclick="ieDelete('${r.ing.replace(/'/g, "\'")}','${String(r.brand).replace(/'/g, "\'")}')">Delete</button></td>
    </tr>`).join('');
}

function ieAddOrUpdate() {
  const ing = (document.getElementById('ie-ingredient')?.value || '').trim();
  const brand = (document.getElementById('ie-brand')?.value || '').trim();
  const price = parseFloat(document.getElementById('ie-price')?.value);
  if (!ing || !brand || isNaN(price)) {
    if (typeof showPopup === 'function') showPopup('Please fill ingredient, brand and price.');
    return;
  }
  const user = ie_getUserPrices();
  if (!user[ing]) user[ing] = {};
  user[ing][brand] = price;
  ie_setUserPrices(user);
  ie_renderTable(); ie_refreshDatalist();
  document.getElementById('ie-brand').value = '';
  document.getElementById('ie-price').value = '';
}
function ieDelete(ing, brand) {
  const user = ie_getUserPrices();
  if (user[ing] && user[ing][brand] != null) {
    delete user[ing][brand];
    if (Object.keys(user[ing]).length === 0) delete user[ing];
    ie_setUserPrices(user);
    ie_renderTable(); ie_refreshDatalist();
  } else {
    if (typeof showPopup === 'function') showPopup('That brand is from the base DB; create an override to change it.');
  }
}
function ieExport() {
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
function ieImport(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(reader.result);
      if (typeof obj !== 'object' || Array.isArray(obj)) throw new Error('bad format');
      ie_setUserPrices(obj);
      ie_renderTable(); ie_refreshDatalist();
      if (typeof showPopup === 'function') showPopup('Imported prices.');
    } catch {
      if (typeof showPopup === 'function') showPopup('Invalid JSON for prices.');
    } finally { e.target.value = ''; }
  };
  reader.readAsText(file);
}

// Boot: refresh when base prices ready & when user overrides change
(function ie_boot(){
  const tryInit = () => { ie_refreshDatalist(); ie_renderTable(); };
  if (window.basePricesCache && Object.keys(window.basePricesCache).length) tryInit();
  document.addEventListener('pricesLoaded', tryInit);
  document.addEventListener('userPricesUpdated', tryInit);
})();