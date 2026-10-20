'use strict';
/* =========================================================
   CLICKSCAPE v9.9 — gentler early tributes that grow with depth, faster &
   clearer farmlands, last-kill loot under the monster
   ========================================================= */

/* ================= TRIBUTES ================= */
// early runs ask for fewer, skill-made items; quantities and tiers grow with ascensions & Transcendence
const TRIB_RNG = new Set(['cut_ruby', 'cut_diamond', 'black_dragonhide', 'green_dragonhide', 'dragon_bones', 'red_chinchompa', 'black_chinchompa']);
const isCrop = id => ITEMS[id]?.kind === 'herb' || CROPS.some(c => (c.cropItem || c.id) === id);
function tierTributes() {
  const out = [], cap = MAX_LVL.mining || 99;
  ATIERS.forEach((T, i) => { if (cap >= T.lvl + 15) [[T.id + '_bar', 20], [T.id + '_logs', 40], [T.id + '_fish', 40], [T.id + '_pelt', 15]].forEach(([id, q]) => ITEMS[id] && out.push([id, q, 0])); });
  return out;
}
rollTribute = function () {
  const c = S.asc.count || 0, td = tcount(), early = c < 3 && !td && !apoCount();
  const n = td || apoCount() ? 3 : c < 1 ? 1 : c < 3 ? 2 : 3;
  let pool = [...TRIBUTE_POOL.filter(t => t[2] <= c), ...tierTributes()];
  if (early) pool = pool.filter(([id]) => !TRIB_RNG.has(id) && !isCrop(id));
  const tiers = tierTributes().map(t => t[0]);
  // prefer the newest tier items once they're available, so tributes track your level
  pool.sort(() => rnd() - 0.5); pool.sort((a, b) => tiers.indexOf(b[0]) - tiers.indexOf(a[0]));
  const pick = []; for (const t of pool) { if (pick.length >= n) break; if (!pick.some(p => p[0] === t[0])) pick.push(t); }
  const k = (0.35 + 0.15 * Math.min(c, 40)) * (1 + 0.6 * td) * (1 + apoCount());
  S.tribute = { items: pick.map(([id, q]) => [id, Math.max(5, Math.round(q * k))]), offer: 1 };
};
// re-roll an already-rolled tribute on a brand-new account so it uses the gentler rules
function tributeFix() { if (!S.lifetime.tribFix99 && S.tribute && !lifeAsc() && !tcount()) { rollTribute(); } S.lifetime.tribFix99 = 1; }

/* ================= FARMLANDS: 3× faster, and they tell you what they made ================= */
const FL_SPEED = 3;
let flMade = {}, flToastT = 0;
farmlandTick = function (dt) {
  (S.farmlands || []).forEach((f, i) => {
    const c = CROP_BY_ID[f.crop]; if (!c || !f.hands) return;
    const cycles = (flAcc[i] || 0) + FL_SPEED * f.hands * dt / Math.max(10, c.time * M.grow);
    let n = Math.floor(cycles); flAcc[i] = cycles - n; if (!n) return;
    const seed = c.id + '_seed';
    if (have(seed) < n) { const sp = SHOP.seeds.find(s => s.id === seed); const need = n - have(seed); if (sp && S.coins >= sp.price * need * 2) { S.coins -= sp.price * need; add(seed, need); } }
    n = Math.min(n, have(seed)); if (!n) { f.idle = true; return; } f.idle = false;
    remove(seed, n);
    const id = c.cropItem || c.id, y = Math.max(1, Math.round(n * flYield(c)));
    add(id, y); logItem(id, y); f.made = (f.made || 0) + y; flMade[id] = (flMade[id] || 0) + y;
    gainXP('farming', (c.pxp + c.hxp * y / n) * n * 0.5);
  });
  flToastT += dt;
  if (flToastT >= 60 && Object.keys(flMade).length) {
    const msg = '🌾 Farmlands harvested ' + Object.entries(flMade).map(([id, q]) => `${fmt(q)} ${ITEMS[id].name}`).join(', ');
    if (OFF) OFFLOG.push(msg); else toast(msg, 'rare', 4000);
    flMade = {}; flToastT = 0;
  }
};
// a plain-language summary at the top of the Farming page
viewFarming = (orig => function () {
  const F = S.farmlands || [];
  const rates = F.map(f => { const c = CROP_BY_ID[f.crop]; return c && f.hands ? [c, FL_SPEED * f.hands * flYield(c) * 3600 / Math.max(10, c.time * M.grow)] : null; }).filter(Boolean);
  const sum = {}; rates.forEach(([c, r]) => { const id = c.cropItem || c.id; sum[id] = (sum[id] || 0) + r; });
  const panel = `<div class="panel farm-guide"><h3>🌱 How your farm works</h3>
    <div class="trib">🟫 <b>Patches</b> <small>· plant & harvest by tapping. Farmhands (${fhN()}) tend them for you and add +${fhN() * 20}% crops.</small></div>
    <div class="trib">🌾 <b>Farmlands</b> <small>· big fields that grow non-stop with hired hands and buy their own seeds. Best for herbs.</small></div>
    <div class="trib ${rates.length ? 'ok' : ''}">📦 <b>Producing now</b> <small>· ${rates.length ? Object.entries(sum).map(([id, r]) => `${itemIcon(id)} ${fmt(r)} ${ITEMS[id].name}/hour`).join(' · ') : 'nothing yet: buy a farmland below, pick a crop and hire hands'}</small></div></div>`;
  return panel + orig().replace(/· crops grow \d+% faster<\/small><br><small class="muted">Your workforce also boosts harvests ×([\d.]+) \(more gathering workers = bigger farms\)<\/small>/, (m, x) => `· crops grow ${Math.round(100 - 100 * Math.max(0.4, 1 - 0.01 * fhN()))}% faster</small><br><small class="muted">Workforce bonus ×${x} on every harvest</small>`)
    .replace(/≈([\d.,KMBT]+)\/min/g, (m, x) => `≈${x}/min`);
})(viewFarming);


/* ================= LAST KILL'S LOOT UNDER THE MONSTER ================= */
let lastLoot = '';
killMonster = (orig => function (m) {
  if (OFF) return orig(m);
  const s = snapBank(); orig(m); const d = diffBank(s);
  const parts = Object.entries(d.got).sort((a, b) => ITEMS[b[0]].value * b[1] - ITEMS[a[0]].value * a[1]).slice(0, 6).map(([id, n]) => `${itemIcon(id)}<span>${n > 1 ? fmt(n) + '× ' : ''}${ITEMS[id].name}</span>`);
  if (d.coins) parts.unshift(`🪙<span>${fmt(d.coins)}</span>`);
  lastLoot = parts.length ? parts.join('') : '<span class="muted">nothing this time</span>';
  const el = document.querySelector('[data-live="killloot"]'); if (el) el.innerHTML = `<small class="muted">Last kill:</small> ${lastLoot}`;
})(killMonster);
viewCombat = (orig => function () {
  return orig().replace('<div class="fight-btns">', `<div class="kill-loot" data-live="killloot">${lastLoot ? `<small class="muted">Last kill:</small> ${lastLoot}` : '<small class="muted">Loot from your last kill shows here</small>'}</div><div class="fight-btns">`);
})(viewCombat);
VIEWS.combat = (orig => function () { return rebrand(orig()); })(viewCombat);

function boot33() { boot32(); tributeFix(); UI.force = true; render(); }
boot33();
