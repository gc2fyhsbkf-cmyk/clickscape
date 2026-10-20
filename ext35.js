'use strict';
/* =========================================================
   CLICKSCAPE v9.11 — QA pass: live level numbers while tapping, shop buy/sell
   loop closed, misc polish
   ========================================================= */

/* ---------- levels update live (the page doesn't redraw while you're tapping) ---------- */
viewSkills = (orig => function () {
  return orig().replace(/(data-act="skill" data-id="([a-z_]+)">[\s\S]*?<span class="sc-lvl"><span)>/g, '$1 data-lvl="$2">');
})(viewSkills);
VIEWS.skills = (orig => function () { return rebrand(orig()); })(viewSkills);
let lvlSeen = {};
liveUpdate = (orig => function () {
  orig();
  document.querySelectorAll('[data-lvl]').forEach(el => { const sk = el.dataset.lvl, v = String(LV[sk]); if (el.textContent !== v) { el.textContent = v; el.classList.remove('lvl-pop'); void el.offsetWidth; el.classList.add('lvl-pop'); } });
})(liveUpdate);

/* ---------- shop: never sells below what the item sells back for ---------- */
const shopFloor = id => Math.ceil(sellPrice(id) * 1.15);
function applyShopFloor() { for (const cat in SHOP) for (const it of SHOP[cat]) { if (!ITEMS[it.id]) continue; it.base ??= it.price; it.price = Math.max(it.base, shopFloor(it.id)); } }
recalc4 = (orig => function () { orig(); if (S?.asc) applyShopFloor(); })(recalc4);
buy = (orig => function (id, q, price) {
  const e = Object.values(SHOP).flat().find(x => x.id === id);
  return orig(id, q, e ? Math.max(price || 0, e.price) : Math.max(price || 0, shopFloor(id)));
})(buy);

function boot35() { boot34(); applyShopFloor(); UI.force = true; render(); }
