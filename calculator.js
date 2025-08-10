// Only the relevant function is shown here to minimize diff.
// Drop-in replacement for updateSuggestedPrice with employees support.
function updateSuggestedPrice(totalCost, recipe) {
  const itemWeight = recipe.itemWeightGrams || 1;
  const itemsPerBatch = Math.max(1, parseFloat(document.getElementById('input-grams').value) / itemWeight);
  const elec = parseFloat(document.getElementById('electricity').value);
  const water = parseFloat(document.getElementById('water').value);
  const gas = parseFloat(document.getElementById('gas').value);
  const days = parseFloat(document.getElementById('work-days').value);
  const hours = parseFloat(document.getElementById('hours-day').value);
  const wage = parseFloat(document.getElementById('hour-wage').value);
  const employees = parseFloat(document.getElementById('employees').value) || 1;
  const dailyItems = parseFloat(document.getElementById('items-day').value);
  const misc = parseFloat(document.getElementById('misc').value);
  const markup = parseFloat(document.getElementById('markup').value);

  const monthlyCost = elec + water + gas + (days * hours * wage * employees) + misc;
  const monthlyItems = days * dailyItems;
  const overheadPerItem = monthlyCost / monthlyItems;

  document.getElementById('overhead-per-item').textContent = overheadPerItem.toFixed(2);
  const totalPerItem = (totalCost / itemsPerBatch) + overheadPerItem;
  document.getElementById('total-item-cost').textContent = totalPerItem.toFixed(2);
  const suggestedPerItem = totalPerItem * markup;
  document.getElementById('suggested-price').textContent = suggestedPerItem.toFixed(2);

  const batchOverhead = overheadPerItem * itemsPerBatch;
  const totalBatchCost = totalCost + batchOverhead;
  const suggestedTotalBatch = suggestedPerItem * itemsPerBatch;

  const ob = document.getElementById('overhead-batch'); if (ob) ob.textContent = batchOverhead.toFixed(2);
  const tbc = document.getElementById('total-batch-cost'); if (tbc) tbc.textContent = totalBatchCost.toFixed(2);
  const stb = document.getElementById('suggested-total-batch'); if (stb) stb.textContent = suggestedTotalBatch.toFixed(2);

  const profit = suggestedTotalBatch - totalBatchCost;
  const ep = document.getElementById('estimated-profit'); if (ep) ep.textContent = profit.toFixed(2);
}
