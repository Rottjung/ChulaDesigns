// ===== Shared state & utilities =====
window.recipes = [];
window.prices = {};
window.baseRecipesCache = [];

// New: DB readiness gating
let recipesReady = false;
let pricesReady = false;
let appInitialized = false;

// New: brand selection cache (persists while page is open)
const brandCache = {
  ingredient: {}, // key: ingredient name -> brand
  extra: {}       // key: extra name -> brand
};

function showPopup(message) {
  const popup = document.createElement('div');
  popup.className = 'popup';
  popup.textContent = message;
  document.body.appendChild(popup);
  const existing = document.querySelectorAll('.popup');
  existing.forEach((el, i) => el.style.top = `${20 + i * 50}px`);
  setTimeout(() => popup.remove(), 1800);
}

function switchTab(which) {
  document.getElementById('tab-calculator').classList.toggle('active', which === 'calculator');
  document.getElementById('tab-builder').classList.toggle('active', which === 'builder');
  document.getElementById('panel-calculator').classList.toggle('active', which === 'calculator');
  document.getElementById('panel-builder').classList.toggle('active', which === 'builder');
}

function loadJSON(path, success, fail) {
  fetch(path + '?cacheBust=' + new Date().getTime())
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(data => success(data))
    .catch(err => { if (fail) fail(err); });
}

function getUserRecipes() {
  try {
    const raw = localStorage.getItem('brood_user_recipes');
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function setUserRecipes(arr) {
  localStorage.setItem('brood_user_recipes', JSON.stringify(arr || []));
}
function mergeRecipes(base, user) { return [...user, ...base]; }

function populateRecipeSelect() {
  const select = document.getElementById('recipe-select');
  if (!select) return;
  select.innerHTML = '';
  recipes.forEach((r, i) => {
    const opt = document.createElement('option');
    opt.value = i; opt.textContent = r.name;
    select.appendChild(opt);
  });
  if (recipes.length > 0) {
    select.selectedIndex = 0;
    showPopup(`Loaded: ${recipes[0].name}`);
    handleRecipeChange();
  }
}

// Ensure both DBs are ready before initializing UI with a recipe
function tryInitializeApp() {
  if (appInitialized || !recipesReady || !pricesReady) return;
  appInitialized = true;
  populateRecipeSelect();
}

// ===== Calculator logic =====
function handleRecipeChange() {
  if (!appInitialized) return; // guard until DBs loaded
  const recipe = recipes[document.getElementById('recipe-select').value];
  const inputType = document.getElementById('input-type').value;
  const grams = parseFloat(document.getElementById('input-grams').value);
  if (!recipe || isNaN(grams)) return;

  document.getElementById('item-weight').value = recipe.itemWeightGrams || 1;
  const flourWeight = (inputType === 'flour') ? grams : grams / (1 + totalExtraPercent(recipe));

  const itemsPerBatch = Math.max(1, grams / (recipe.itemWeightGrams || 1));
  document.getElementById('number-of-items').value = itemsPerBatch.toFixed(0);

  const ingTbody = document.querySelector('#ingredients-table tbody');
  ingTbody.innerHTML = '';
  let totalCost = 0;

  (recipe.ingredients || []).forEach(ing => {
    const row = document.createElement('tr');
    const amount = flourWeight * (ing.percent / 100);
    const brands = Object.keys(prices[ing.name] || {});

    // Brand persistence for INGREDIENTS
    let chosenBrand = brandCache.ingredient[ing.name];
    if (!chosenBrand || !brands.includes(chosenBrand)) {
      chosenBrand = brands[0] || "";
      if (chosenBrand) brandCache.ingredient[ing.name] = chosenBrand;
    }

    const pricePerKg = prices[ing.name]?.[chosenBrand] || 0;
    const cost = pricePerKg * (amount / 1000);
    totalCost += cost;

    const opts = brands.map(b => `<option value="${b}" ${b === chosenBrand ? 'selected' : ''}>${b}</option>`).join('');

    row.innerHTML = `
      <td>${ing.name}</td>
      <td>${amount.toFixed(1)}</td>
      <td>${ing.percent}%</td>
      <td>
        <select onchange="updateBrand(this, 'ingredient', '${ing.name}', ${amount}, this.parentElement.nextElementSibling)">
          ${opts}
        </select>
      </td>
      <td>${cost.toFixed(2)}</td>`;
    ingTbody.appendChild(row);
  });

  const extraTbody = document.querySelector('#extras-table tbody');
  extraTbody.innerHTML = '';
  (recipe.extras || []).forEach((extra, idx) => {
    const brands = Object.keys(prices[extra.name] || {});

    // Brand persistence for EXTRAS
    let chosenBrand = brandCache.extra[extra.name];
    if (!chosenBrand || !brands.includes(chosenBrand)) {
      chosenBrand = brands[0] || "";
      if (chosenBrand) brandCache.extra[extra.name] = chosenBrand;
    }

    const pricePerKg = prices[extra.name]?.[chosenBrand] || 0;
    const costPerItem = pricePerKg * (extra.perUnitGrams / 1000);
    const totalExtraCost = costPerItem * itemsPerBatch;
    totalCost += totalExtraCost;

    const opts = brands.map(b => `<option value="${b}" ${b === chosenBrand ? 'selected' : ''}>${b}</option>`).join('');

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${extra.name}</td>
      <td><input type="number" value="${extra.perUnitGrams}" class="input-short" oninput="updateExtraGrams(${idx}, this.value)"></td>
      <td>
        <select onchange="updateBrand(this, 'extra', '${extra.name}', ${extra.perUnitGrams}, this.parentElement.nextElementSibling)">
          ${opts}
        </select>
      </td>
      <td>${costPerItem.toFixed(2)}</td>`;
    extraTbody.appendChild(row);
  });

  document.getElementById('total-cost').textContent = totalCost.toFixed(2);
  document.getElementById('cost-per-item').textContent = (totalCost / itemsPerBatch).toFixed(2);
  updateSuggestedPrice(totalCost, recipe);
}

function handleItemWeightChange() {
  const recipe = recipes[document.getElementById('recipe-select').value];
  recipe.itemWeightGrams = parseFloat(document.getElementById('item-weight').value) || 1;
  handleRecipeChange();
}

function handleItemsChange() {
  const items = parseFloat(document.getElementById('number-of-items').value) || 1;
  const itemWeight = parseFloat(document.getElementById('item-weight').value) || 1;
  document.getElementById('input-grams').value = (items * itemWeight).toFixed(1);
  handleRecipeChange();
}

// Update brand, persist to cache, and recompute the cell cost
function updateBrand(selectEl, type, name, amount, costTd) {
  const brand = selectEl.value;
  if (type === 'ingredient') brandCache.ingredient[name] = brand;
  else brandCache.extra[name] = brand;

  const price = prices[name]?.[brand] || 0;
  const cost = price * (amount / 1000); // amount is grams (for extras it's grams per item => cost per item)
  costTd.textContent = cost.toFixed(2);
  showPopup(`${name} → ${brand}`);
  updateTotalCost();
}

function updateExtraGrams(index, newGrams) {
  const recipe = recipes[document.getElementById('recipe-select').value];
  if (!recipe.extras) recipe.extras = [];
  recipe.extras[index].perUnitGrams = parseFloat(newGrams);
  handleRecipeChange();
}

function updateTotalCost() {
  let total = 0;
  document.querySelectorAll('#ingredients-table tbody tr').forEach(row => {
    total += parseFloat(row.cells[4].textContent) || 0;
  });

  const recipe = recipes[document.getElementById('recipe-select').value];
  const itemsPerBatch = Math.max(1,
    parseFloat(document.getElementById('input-grams').value) / (recipe.itemWeightGrams || 1));
  document.querySelectorAll('#extras-table tbody tr').forEach(row => {
    const costPerItem = parseFloat(row.cells[3].textContent) || 0;
    total += costPerItem * itemsPerBatch;
  });

  document.getElementById('total-cost').textContent = total.toFixed(2);
  document.getElementById('number-of-items').value = itemsPerBatch.toFixed(0);
  document.getElementById('cost-per-item').textContent = (total / itemsPerBatch).toFixed(2);
  updateSuggestedPrice(total, recipe);
}

function totalExtraPercent(recipe) {
  return (recipe.ingredients || [])
    .reduce((acc, i) => acc + (i.name.toLowerCase() === 'bread flour' ? 0 : i.percent), 0) / 100;
}

function updateSuggestedPrice(totalCost, recipe) {
  const itemWeight = recipe.itemWeightGrams || 1;
  const itemsPerBatch = Math.max(1, parseFloat(document.getElementById('input-grams').value) / itemWeight);
  const elec = parseFloat(document.getElementById('electricity').value);
  const water = parseFloat(document.getElementById('water').value);
  const gas = parseFloat(document.getElementById('gas').value);
  const days = parseFloat(document.getElementById('work-days').value);
  const hours = parseFloat(document.getElementById('hours-day').value);
  const wage = parseFloat(document.getElementById('hour-wage').value);
  const employees = parseFloat(document.getElementById('employees')?.value || 1) || 1;
  const dailyItems = parseFloat(document.getElementById('items-day').value);
  const misc = parseFloat(document.getElementById('misc').value);
  const markup = parseFloat(document.getElementById('markup').value);

  const monthlyCost = elec + water + gas + (days * hours * wage * employees) + misc;
  const monthlyItems = days * dailyItems;
  const overheadPerItem = monthlyCost / monthlyItems;

  // Per-item
  document.getElementById('overhead-per-item').textContent = overheadPerItem.toFixed(2);
  const totalPerItem = (totalCost / itemsPerBatch) + overheadPerItem;
  document.getElementById('total-item-cost').textContent = totalPerItem.toFixed(2);
  const suggestedPerItem = totalPerItem * markup;
  document.getElementById('suggested-price').textContent = suggestedPerItem.toFixed(2);

  // Batch totals
  const batchOverhead = overheadPerItem * itemsPerBatch;
  const totalBatchCost = totalCost + batchOverhead;
  const suggestedTotalBatch = suggestedPerItem * itemsPerBatch;

  const ob = document.getElementById('overhead-batch'); if (ob) ob.textContent = batchOverhead.toFixed(2);
  const tbc = document.getElementById('total-batch-cost'); if (tbc) tbc.textContent = totalBatchCost.toFixed(2);
  const stb = document.getElementById('suggested-total-batch'); if (stb) stb.textContent = suggestedTotalBatch.toFixed(2);

  // Profit
  const profit = suggestedTotalBatch - totalBatchCost;
  const ep = document.getElementById('estimated-profit'); if (ep) ep.textContent = profit.toFixed(2);
}

// ===== Startup (wait for BOTH DBs) =====
loadJSON('recipes.json',
  data => {
    baseRecipesCache = data || [];
    const mine = getUserRecipes();
    recipes = mergeRecipes(baseRecipesCache, mine);
    recipesReady = true;
    document.dispatchEvent(new CustomEvent('recipesLoaded'));
    tryInitializeApp();
  },
  () => showPopup('Failed to load recipes')
);

loadJSON('ingredientPrices.json',
  data => {
    prices = data || {};
    pricesReady = true;
    showPopup(`Prices loaded (${Object.keys(prices).length} items)`);
    document.dispatchEvent(new CustomEvent('pricesLoaded'));
    tryInitializeApp();
  },
  () => showPopup('Failed to load prices')
);
