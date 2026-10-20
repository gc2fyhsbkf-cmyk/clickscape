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


/* ================= STARTER KIT: explained, and gear puts itself on when you can wear it ================= */
giveKit = (orig => function () {
  const k = orig();
  S.kitGear = Object.keys(k.items).filter(id => ITEMS[id]?.slot && !['pickaxe', 'hatchet', 'rod', 'mattock'].includes(ITEMS[id].slot) && have(id));
  return k;
})(giveKit);
ascend = (orig => function () {
  const old = S, n = S.asc.count; orig(); if (S === old || S.asc.count === n || OFF) return;
  const g = (S.kitGear || []).map(id => ITEMS[id].name);
  setTimeout(() => toast(`🎒 Ascension starter kit added to your bank${g.length ? `: ${g.join(', ')}. Gear equips itself once your levels allow` : ''}.`, 'pet', 12000), 1200);
})(ascend);
transcend2 = (orig => function (auto) { const t0 = tcount(); orig(auto); if (tcount() > t0) { giveKit(); recalc(); } })(transcend2);
const gearScore = id => { const it = ITEMS[id]; return it ? (it.atk || 0) + (it.str || 0) + (it.def || 0) + (it.ratk || 0) + (it.matk || 0) : 0; };
let kitT = 0;
tickCore = (orig => function (dt) {
  orig(dt); kitT += dt; if (kitT < 5 || !S.kitGear?.length) return; kitT = 0;
  S.kitGear = S.kitGear.filter(id => {
    const it = ITEMS[id]; if (!have(id)) return false;
    if (!reqOk(it.req)) return true;
    const cur = S.equip[it.slot];
    if (!cur || gearScore(cur) < gearScore(id)) { equip(id); if (!OFF) toast(`🎒 Equipped your starter ${it.name}.`); }
    return false;
  });
})(tickCore);


/* ================= STARTER KITS: bronze → iron → steel, never better ================= */
const KIT_METAL = ['bronze', 'iron', 'steel'];
giveKit = function () {
  const n = Math.max(1, S.asc.count || 1), m = KIT_METAL[Math.min(n, 3) - 1];
  const items = {}; ['scimitar', 'full_helm', 'platebody', 'platelegs', 'kiteshield'].forEach(k => { if (ITEMS[m + '_' + k]) items[m + '_' + k] = 1; });
  const food = ['shrimp', 'trout', 'salmon'][Math.min(n, 3) - 1]; if (ITEMS[food]) items[food] = 20 * Math.min(n, 3);
  for (const [id, q] of Object.entries(items)) add(id, q);
  const coins = [500, 2000, 5000][Math.min(n, 3) - 1]; gainCoins(coins);
  S.kitGear = Object.keys(items).filter(id => ITEMS[id]?.slot);
  S.combat.food = food;
  return { items, coins };
};

/* ================= KEPT GEAR CAN'T BE SOLD ================= */
// gear carried into a new run (Armoury / Toolkit perks) is for using, not for cashing in
ascend = (orig => function () {
  const old = S, n = S.asc.count; orig(); if (S === old || S.asc.count === n) return;
  S.carried = [...new Set(Object.values(S.equip).filter(Boolean))]; S.carried.forEach(id => { S.locked[id] = true; });
})(ascend);
const isCarried = id => (S.carried || []).includes(id);
sell = (orig => function (id, q) { if (isCarried(id)) return toast(`${ITEMS[id].name} was carried over from your last run, so it can't be sold.`, 'warn'); return orig(id, q); })(sell);
geSell = (orig => function (id, q) { if (isCarried(id)) return toast(`${ITEMS[id].name} was carried over from your last run, so it can't be sold.`, 'warn'); return orig(id, q); })(geSell);
openItemModal = (orig => function (id, fromSlot) {
  orig(id, fromSlot); if (!isCarried(id)) return; const box = $('#modal'); if (!box) return;
  box.querySelectorAll('[data-act="sell"],[data-act="ge-sell"],[data-act="ge-x"][data-mode="sell"]').forEach(b => b.remove());
  const p = box.querySelector('.item-modal p, p'); if (p) p.insertAdjacentHTML('afterend', '<p class="small muted">🔁 Carried over from your last run: can be worn, not sold.</p>');
})(openItemModal);
autoSellNow = (orig => function () { const L = S.autosell || {}; const saved = {}; for (const id of S.carried || []) if (L[id]) { saved[id] = 1; L[id] = false; } orig(); for (const id in saved) L[id] = true; })(autoSellNow);

function boot33() { boot32(); tributeFix(); UI.force = true; render(); }
