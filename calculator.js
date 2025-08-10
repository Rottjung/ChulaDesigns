// ===== Shared state & utilities =====
window.recipes = [];
window.prices = {};
window.baseRecipesCache = [];

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
    .then(r => { if (!r.ok) throw new Error('HTTP error'); return r.json(); })
    .then(data => success(data))
    .catch(err => fail(err));
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
    showPopup(`Auto-loaded: ${recipes[0].name}`);
    handleRecipeChange();
  }
}

// ===== Calculator logic (unchanged) =====
function handleRecipeChange() {
  const recipe = recipes[document.getElementById('recipe-select').value];
  const inputType = document.getElementById('input-type').value;
  const grams = parseFloat(document.getElementById('input-grams').value);
  if (!recipe || isNaN(grams)) return;

  document.getElementById('item-weight').value = recipe.itemWeightGrams || 1;
  const flourWeight = (inputType === 'flour')
    ? grams
    : grams / (1 + totalExtraPercent(recipe));

  const itemsPerBatch = Math.max(1, grams / (recipe.itemWeightGrams || 1));
  document.getElementById('number-of-items').value = itemsPerBatch.toFixed(0);

  const ingTbody = document.querySelector('#ingredients-table tbody');
  ingTbody.innerHTML = '';
  let totalCost = 0;

  (recipe.ingredients || []).forEach(ing => {
    const row = document.createElement('tr');
    const amount = flourWeight * (ing.percent / 100);
    const brands = Object.keys(prices[ing.name] || {});
    const pricePerKg = prices[ing.name]?.[brands[0]] || 0;
    const cost = pricePerKg * (amount / 1000);
    totalCost += cost;

    row.innerHTML = `
      <td>${ing.name}</td>
      <td>${amount.toFixed(1)}</td>
      <td>${ing.percent}%</td>
      <td>
        <select onchange="updateBrand(this, '${ing.name}', ${amount}, this.parentElement.nextElementSibling)">
          ${brands.map(b => `<option value="${b}">${b}</option>`).join('')}
        </select>
      </td>
      <td>${cost.toFixed(2)}</td>`;
    ingTbody.appendChild(row);
  });

  const extraTbody = document.querySelector('#extras-table tbody');
  extraTbody.innerHTML = '';
  (recipe.extras || []).forEach((extra, idx) => {
    const brands = Object.keys(prices[extra.name] || {});
    const pricePerKg = prices[extra.name]?.[brands[0]] || 0;
    const costPerItem = pricePerKg * (extra.perUnitGrams / 1000);
    const totalExtraCost = costPerItem * itemsPerBatch;
    totalCost += totalExtraCost;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${extra.name}</td>
      <td><input type="number" value="${extra.perUnitGrams}" class="input-short" oninput="updateExtraGrams(${idx}, this.value)"></td>
      <td>
        <select onchange="updateBrand(this, '${extra.name}', ${extra.perUnitGrams}, this.parentElement.nextElementSibling)">
          ${brands.map(b => `<option value="${b}">${b}</option>`).join('')}
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

function updateBrand(selectEl, name, amount, costTd) {
  const brand = selectEl.value;
  const price = prices[name]?.[brand] || 0;
  const cost = price * (amount / 1000);
  costTd.textContent = cost.toFixed(2);
  showPopup(`${name} price updated (${brand})`);
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
  const dailyItems = parseFloat(document.getElementById('items-day').value);
  const misc = parseFloat(document.getElementById('misc').value);
  const markup = parseFloat(document.getElementById('markup').value);

  const monthlyCost = elec + water + gas + (days * hours * wage) + misc;
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

  // Profit (requested): Suggested Total (Batch) – Total Ingredient Cost
  const profit = suggestedTotalBatch - totalCost;
  const ep = document.getElementById('estimated-profit'); if (ep) ep.textContent = profit.toFixed(2);
}

// ===== Startup =====
loadJSON('recipes.json',
  data => {
    baseRecipesCache = data || [];
    const mine = getUserRecipes();
    recipes = mergeRecipes(baseRecipesCache, mine);
    populateRecipeSelect();
    showPopup('Recipes loaded');
    document.dispatchEvent(new CustomEvent('recipesLoaded'));
  },
  () => showPopup('Failed to load recipes')
);

loadJSON('ingredientPrices.json',
  data => {
    prices = data || {};
    showPopup(`Prices loaded (${Object.keys(prices).length} items)`);
    document.dispatchEvent(new CustomEvent('pricesLoaded'));
  },
  () => showPopup('Failed to load prices')
);
