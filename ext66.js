'use strict';
/* =========================================================
   CLICKSCAPE v9.45 — loot chests keep their secret: a run's loot (and its fanfare) is held in the
   chest until you open it, instead of landing in the bank and being announced straight away
   ========================================================= */
let CHEST_DEFER = 0, CHEST_FX = [], CHEST_NEW = false;
fanLegend = (orig => function (o) { if (CHEST_DEFER) { CHEST_FX.push(['L', o]); return; } return orig.apply(this, arguments); })(fanLegend);
fanBanner = (orig => function () { if (CHEST_DEFER) { CHEST_FX.push(['B', [...arguments]]); return; } return orig.apply(this, arguments); })(fanBanner);
const playFx = list => list.forEach(([k, a], i) => setTimeout(() => { if (k === 'L') fanLegend(a); else fanBanner(...a); }, 900 + i * 300));
function grantChest(c) {
  if (!c?.pending) return; c.pending = false;
  if (c.coins) gainCoins(c.coins);
  for (const [id, q] of c.items || []) if (ITEMS[id]) add(id, q);
}
const holdWrap = orig => function (m) {
  if (OFF) return orig.apply(this, arguments);
  const Q = S.runChests ||= [];
  while (Q.length >= 30) grantChest(Q.shift()); // never let an unopened chest fall off the end
  const n0 = Q.length; CHEST_DEFER++; CHEST_FX = [];
  let r; try { r = orig.apply(this, arguments); } finally { CHEST_DEFER--; }
  const fx = CHEST_FX; CHEST_FX = [];
  if ((S.runChests || []).length > n0) {
    // a chest was made: take its contents back out of the bank until it's opened
    const c = S.runChests[S.runChests.length - 1];
    if (c.coins) S.coins = Math.max(0, S.coins - c.coins);
    for (const [id, q] of c.items || []) { const k = Math.min(q, have(id)); if (k > 0) remove(id, k); }
    c.pending = true; c.fx = fx; CHEST_NEW = true;
  } else playFx(fx);
  return r;
};
raidKill = holdWrap(raidKill);
barrowsKill = holdWrap(barrowsKill);
// the loot line under the monster shows the chest, not its contents
killMonster = (orig => function () {
  CHEST_NEW = false; const r = orig.apply(this, arguments);
  if (CHEST_NEW && !OFF) { lastLoot = '<span class="y">🎁 A loot chest! Tap the chest to see what\'s inside</span>'; const el = document.querySelector('[data-live="killloot"]'); if (el) el.innerHTML = `<small class="muted">Last kill:</small> ${lastLoot}`; }
  CHEST_NEW = false; return r;
})(killMonster);
// opening: the loot goes in now, and any fanfare plays after the chest pops
chestModal = (orig => function (all) {
  const Q = S.runChests || []; if (!Q.length) return orig.apply(this, arguments);
  const list = all ? Q.slice() : [Q[0]], fx = [];
  for (const c of list) { grantChest(c); if (c.fx?.length) { fx.push(...c.fx); c.fx = []; } }
  const r = orig.apply(this, arguments);
  const note = $('#modal .chest-modal .tiny.muted'); if (note) note.textContent = 'Added to your bank.';
  if (fx.length) playFx(fx);
  return r;
})(chestModal);
// pending chests still count as unopened in the item window / bank totals (nothing to change), and
// chests made before this update already gave their loot
function boot66() { boot65(); }
