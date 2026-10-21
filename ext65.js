'use strict';
/* =========================================================
   CLICKSCAPE v9.44 — carried-over gear is tracked per item, not per stack: only the copies you
   actually brought from a previous run are unsellable; new copies of the same item sell normally
   ========================================================= */
// before: carrying one Volcanic scimitar over marked "volcanic scimitar" itself as unsellable (and locked),
// so every scimitar you later made or looted joined an unsellable stack
const carryN = () => (S.carriedN ||= {});
const equippedN = id => Object.values(S.equip).filter(x => x === id).length;
const carriedInBank = id => Math.max(0, (carryN()[id] || 0) - equippedN(id));
const freeToSell = id => Math.max(0, have(id) - carriedInBank(id));
function carryAdd(id) { const C = carryN(); C[id] = (C[id] || 0) + 1; syncCarried(); }
// S.carried (used everywhere else) now lists only items whose whole bank stack is carried-over copies
function syncCarried() {
  const C = carryN();
  for (const id in C) { const own = have(id) + equippedN(id); C[id] = Math.min(C[id], own); if (C[id] <= 0) delete C[id]; }
  S.carried = Object.keys(C).filter(id => have(id) === 0 ? equippedN(id) > 0 : freeToSell(id) === 0);
}
// selling: only the free copies can go
const capSell = fn => (orig => function (id, q) {
  syncCarried(); const free = freeToSell(id);
  if (!carryN()[id]) return orig.apply(this, arguments);
  if (free <= 0) return toast(`${ITEMS[id].name}: the ${fmt(have(id))} you have ${have(id) === 1 ? 'was' : 'were'} carried over from an earlier run, so ${have(id) === 1 ? 'it' : 'they'} can't be sold.`, 'warn');
  const L = S.carried; S.carried = L.filter(x => x !== id);
  try { return orig.call(this, id, Math.min(q, free)); } finally { syncCarried(); }
})(fn);
sell = capSell(sell); geSell = capSell(geSell);
openItemModal = (orig => function (id, fromSlot) {
  syncCarried(); orig.apply(this, arguments); const n = carriedInBank(id); if (fromSlot || !n || n >= have(id)) return;
  ($('#modal .item-modal') || $('#modal'))?.insertAdjacentHTML('beforeend', `<p class="small muted">🔁 ${fmt(n)} of these ${fmt(have(id))} ${n === 1 ? 'was' : 'were'} carried over from an earlier run and can't be sold; the other ${fmt(have(id) - n)} sell normally.</p>`);
})(openItemModal);
// ascending: carried copies are counted, and no longer auto-locked
ascend = (orig => function () {
  const old = S, n = S.asc.count; const r = orig.apply(this, arguments); if (S === old || S.asc.count === n) return r;
  S.carriedN = {}; for (const id of (S.carried || [])) { S.carriedN[id] = equippedN(id) || 1; delete S.locked[id]; }
  syncCarried(); return r;
})(ascend);
let carT = 0;
tickCore = (orig => function (dt) { orig(dt); carT += dt; if (carT >= 2) { carT = 0; syncCarried(); } })(tickCore);

function boot65() {
  boot64();
  if (!S.carriedN) { S.carriedN = {}; for (const id of (S.carried || [])) S.carriedN[id] = Math.max(1, equippedN(id)); }
  if (!S.lifetime.carryFix) { S.lifetime.carryFix = true; for (const id in S.carriedN) delete S.locked[id]; }
  syncCarried(); UI.force = true; render();
}
