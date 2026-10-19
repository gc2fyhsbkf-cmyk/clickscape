'use strict';
/* =========================================================
   CLICKSCAPE v7.8 — economy rebalance
   1) Market fix: buying always costs more than selling, and markets react to volume
   2) No coin-to-goods shortcuts: exotic & top-tier materials can't be bought, auto-supply = basics only
   3) Crafted item values brought in line with their ingredients
   4) Soft caps on runaway multipliers
   5) Sailing becomes timed voyages
   ========================================================= */

/* ================= 1) MARKET ================= */
const MKT_HALF = 2 * 3600e3; // flooded prices recover with a 2h half-life
function mktDepthCoins() { return 3e9 * Math.pow(2, S.trans?.count || 0); }
const mktDepth = id => Math.max(200, mktDepthCoins() / Math.max(1, ITEMS[id]?.value || 1));
function mktFlood(id) {
  const e = S.mkt?.[id]; if (!e) return 0;
  return e[0] * Math.pow(0.5, (now() - e[1]) / MKT_HALF);
}
const mktFactor = id => { const D = mktDepth(id); return D / (D + mktFlood(id)); };
const mktQuote = (id, q, p) => { const D = mktDepth(id), F = mktFlood(id); return Math.floor(p * D * Math.log1p(q / (D + F))); };
saleTake = function (id, q, p) {
  if (q <= 0) return 0;
  const got = mktQuote(id, q, p);
  const F = mktFlood(id) + q; (S.mkt ||= {})[id] = [F, now()];
  if (F < 1e-3 * mktDepth(id)) delete S.mkt[id];
  return got;
};
// the buy price always sits above the best sell price (no more buy-low-sell-high loop)
geBuyPrice = (orig => function (id) { return Math.max(orig(id), Math.ceil(ITEMS[id].value * Math.max(1, M.sell) * geF(id) * 1.05)); })(geBuyPrice);
function mktTag(id) {
  const f = mktFactor(id); if (f > 0.97) return '';
  return `<span class="cb-red">📉 market flooded: ${Math.round(f * 100)}% price</span>`;
}

/* ================= 2) NO COINS → GOODS SHORTCUTS ================= */
const NOBUY = new Set(['rift_essence', 'celestial_core', 'echo_shard', 'leviathan_scale', 'star_coral', 'abyssal_pearl', 'dragon_metal_shard', 'pirate_doubloon']);
ATIERS.forEach(T => { NOBUY.add(T.id + '_ore'); NOBUY.add(T.id + '_bar'); Object.keys(T.extra || {}).forEach(k => NOBUY.add(k)); });
geBuy = (orig => function (id, q) {
  if (NOBUY.has(id)) return toast(`${ITEMS[id].name} can't be bought: gather, loot or sail for it yourself.`, 'warn');
  return orig(id, q);
})(geBuy);
geRow = (orig => function (id, mode) {
  if (mode !== 'sell' && NOBUY.has(id)) return `<div class="ge-row"><span class="ar-icon">${itemIcon(id)}</span><span class="ar-main"><b>${ITEMS[id].name}</b><small class="muted">Not for sale: gather, loot or sail for it</small></span></div>`;
  const h = orig(id, mode), t = mode === 'sell' ? mktTag(id) : '';
  return t ? h.replace('</small></span>', ` · ${t}</small></span>`) : h;
})(geRow);
// auto-supply only tops up cheap basics (vials, feathers, planks, essence…)
const AUTO_MAX_VALUE = 150;
// herblore secondaries count as basics (herbs themselves must be grown)
const AUTO_OK = new Set();
for (const a of STATION_ACTIONS.herb || []) for (const i in a.inp || {}) if (ITEMS[i] && ITEMS[i].kind !== 'herb' && ITEMS[i].cat !== 'farm' && !(STATION_ACTIONS.herb || []).some(b => b.out?.[i])) AUTO_OK.add(i);
autoSupplyTick = function () {
  if (!S.autoSupply || activeChal() === 'ironman') return;
  for (const st in S.autoSupply) {
    if (!S.autoSupply[st]) continue;
    const a = ACTIONS[S.target[st]]; if (!a?.inp) continue;
    const rate = (M.rate[st] || 0) / Math.max(1, a.hp), want = Math.max(10, Math.ceil(rate * 60));
    for (const [id, q] of Object.entries(a.inp)) {
      const need = q * want - have(id); if (need <= 0 || !GE_SET.has(id) || NOBUY.has(id) || (ITEMS[id].value > AUTO_MAX_VALUE && !AUTO_OK.has(id))) continue;
      const price = geBuyPrice(id), n = Math.min(need, Math.floor(S.coins * 0.25 / price));
      if (n > 0) { S.coins -= n * price; add(id, n); (S.bought ||= {})[id] = (S.bought[id] || 0) + n; S.lifetime.autoSpent = (S.lifetime.autoSpent || 0) + n * price; }
    }
  }
};
viewSkill = (orig => function () {
  if (UI.skill === 'sailing') return voyageView();
  return orig()
    .replace(/<div class="panel buybar">[\s\S]*?<\/div>/, '')
    .replace(/Buying missing ingredients from the Trading Post[^<]*/, `Topping up cheap basic ingredients (worth ≤ 🪙${AUTO_MAX_VALUE}) from the Trading Post`)
    .replace('Automatically buy this recipe’s missing ingredients', 'Automatically buy cheap basic ingredients (vials, feathers, essence…)');
})(viewSkill);
openItemModal = (orig => function (id, fromSlot) {
  orig(id, fromSlot);
  const box = $('#modal'); if (!box || fromSlot) return;
  if (NOBUY.has(id)) box.querySelectorAll('[data-act="ge-x"][data-mode="buy"]').forEach(b => b.remove());
  box.querySelectorAll('[data-act="sell"],[data-act="ge-sell"]').forEach(b => {
    const q = +b.dataset.q, sm = b.querySelector('small'); if (!q || !sm) return;
    const p = b.dataset.act === 'sell' ? sellPrice(id) : geSellPrice(id);
    sm.textContent = '🪙' + fmt(mktQuote(id, q, p));
  });
  const t = mktTag(id), p = box.querySelector('.item-modal p, p');
  if (t && p) p.insertAdjacentHTML('afterend', `<p class="small">${t} <span class="muted">· selling lots of one item drops its price; it recovers over a few hours</span></p>`);
})(openItemModal);

/* ================= 3) CRAFTED VALUES IN LINE WITH INGREDIENTS ================= */
(function () {
  for (const a of Object.values(ACTIONS)) {
    if (!a.inp || !a.out) continue;
    const iv = Object.entries(a.inp).reduce((s, [i, q]) => s + (ITEMS[i]?.value || 0) * q, 0); if (iv <= 0) continue;
    const outs = Object.entries(a.out).filter(([i]) => ITEMS[i]); if (outs.length !== 1) continue;
    const [oid, oq] = outs[0], cap = Math.ceil(4 * iv / oq);
    if (ITEMS[oid].value > cap && ITEMS[oid].value > 2000) ITEMS[oid].value = cap;
  }
})();

/* ================= 4) SOFT CAPS ================= */
const SELL_SOFT = 10, PROD_SOFT = Infinity;
const soft = (x, c) => x <= c ? x : c * Math.sqrt(x / c);
recalc4 = (orig => function () {
  orig(); if (!S?.asc) return;
  M.sellRaw = M.sell; M.sell = soft(M.sell, SELL_SOFT);
  M.prodRaw = 0; M.prodEff = 0;
  for (const st of STATION_ORDER) {
    const base = (1 + LV[STATIONS[st].skill] * 0.01) * toolMult(st) || 1, w = (S.workers[st] || 0) * 0.2;
    const tb = M.tap[st] / base; M.tap[st] = base * soft(tb, PROD_SOFT);
    if (w > 0) { const rb = M.rate[st] / (w * base); M.rate[st] = w * base * soft(rb, PROD_SOFT); if (rb > M.prodRaw) { M.prodRaw = rb; M.prodEff = soft(rb, PROD_SOFT); } }
  }
  M.rate.harbour = 0; M.tap.harbour = 0; // sailing runs on voyages now
})(recalc4);
viewStats2 = (orig => function () {
  return orig() + `<div class="panel small"><h3>📉 Sell soft cap</h3><p>Your sell bonus grows more slowly past ×10 (square root of the extra).</p>
    <p>Sell bonus: ×${fmtD(M.sellRaw || M.sell)} → <b>×${fmtD(M.sell)}</b> <span class="muted">(full value up to ×${SELL_SOFT})</span></p></div>`;
})(viewStats2);
VIEWS.stats = (orig => function () { return rebrand(orig()); })(viewStats2);

/* ================= 5) SAILING VOYAGES ================= */
const VOY = {
  sl_trade: [5, {}, 12], sl_trawler: [10, { plank: 5 }, 20], sl_pirates: [20, { oak_plank: 10, scroll_ember: 10 }, 6],
  sl_salvage: [30, { teak_plank: 10, lobster: 10 }, 4], sl_dragon: [45, { mahogany_plank: 10, swordfish: 15 }, 3], sl_trench: [60, { magic_plank: 10, shark: 20 }, 2],
  sl_star: [90, { elder_plank: 12, shark: 30 }, 3], sl_leviathan: [120, { elder_plank: 20, scroll_infernowave: 20, shark: 40 }, 1],
};
for (const k in VOY) { if (!ACTIONS[k]) { delete VOY[k]; continue; } for (const i in VOY[k][1]) if (!ITEMS[i]) delete VOY[k][1][i]; }
const shipSlots = () => Math.min(5, 1 + Math.floor(Math.sqrt((S.workers.harbour || 0) / 5)));
const nextShipAt = () => { const n = shipSlots(); return n >= 5 ? null : 5 * n * n; };
const voyDur = k => VOY[k][0] * 60e3 * Math.pow(0.94, shipLvl('hull')) / (S.pets.seagull ? 1.1 : 1);
const voyCargoMult = k => (1 + Math.max(0, LV.sailing - ACTIONS[k].lvl) / 50) * (1 + 0.15 * shipLvl('sails')) * (1 + 0.01 * (S.workers.harbour || 0)) * (M.depthPow || 1);
const voySupOk = k => Object.entries(VOY[k][1]).every(([i, q]) => have(i) >= q);
const voyOk = k => VOY[k] && LV.sailing >= ACTIONS[k].lvl && voySupOk(k);
function voyLaunch(i, k, start = now()) {
  if (!voyOk(k)) return false;
  for (const [id, q] of Object.entries(VOY[k][1])) remove(id, q);
  (S.voy ||= [])[i] = { k, start, end: start + voyDur(k) };
  return true;
}
function voyReturn(sh) {
  const k = sh.k, a = ACTIONS[k], m = voyCargoMult(k), got = {};
  for (const [id, q] of Object.entries(a.out)) { const raw = VOY[k][2] * q * m, n = Math.floor(raw) + (rnd() < raw % 1 ? 1 : 0); if (n) { add(id, n); logItem(id, n); got[id] = n; } }
  if (rnd() < Math.min(0.8, 0.08 * (1 + 0.25 * shipLvl('cannon')) * M.luck)) { const r = pickWeighted([['clue_elite', 4], ['abyssal_pearl', 2], ['leviathan_scale', LV.sailing >= 120 ? 1 : 0], ['mystery_box', 6]]); add(r, 1); logItem(r, 1); got[r] = (got[r] || 0) + 1; }
  gainXP('sailing', a.xp * VOY[k][0] * 8 * (typeof farmMult === 'function' ? farmMult() : 1));
  if (rnd() < 1 / 150 * M.luck) givePet('seagull');
  S.lifetime.voyages = (S.lifetime.voyages || 0) + 1;
  return got;
}
function voyTick() {
  if (!S.voy) return;
  const t = now(), win = offlineHours() * 3600e3, haul = {}; let n = 0;
  for (let i = 0; i < S.voy.length; i++) {
    let sh = S.voy[i], guard = 0;
    while (sh && sh.end <= t && guard++ < 300) {
      const got = voyReturn(sh); n++; for (const id in got) haul[id] = (haul[id] || 0) + got[id];
      S.voy[i] = null;
      if (S.voyAuto && i < shipSlots() && sh.end > t - win && voyLaunch(i, sh.k, sh.end)) sh = S.voy[i]; else sh = null;
    }
  }
  if (!n) return;
  const txt = Object.entries(haul).map(([id, q]) => `${fmt(q)} ${ITEMS[id].name}`).join(', ');
  const msg = `⛵ ${n > 1 ? n + ' voyages' : 'Your ship'} returned: ${txt || 'nothing this time'}`;
  if (OFF) OFFLOG.push(msg); else { toast(msg, 'rare', 5000); SFX.play('coin'); UI.force = true; }
}
let voyT = 0;
tickCore = (orig => function (dt) { orig(dt); voyT += dt; if (voyT >= 1) { voyT = 0; voyTick(); } })(tickCore);
liveUpdate = (orig => function () {
  orig();
  document.querySelectorAll('[data-voy]').forEach(e => { const sh = S.voy?.[+e.dataset.voy]; if (!sh) return; const left = Math.max(0, sh.end - now()); e.textContent = fmtTime(left / 1000); const bar = e.closest('.voy-ship')?.querySelector('.voy-fill'); if (bar) bar.style.width = Math.min(100, 100 * (now() - sh.start) / (sh.end - sh.start)) + '%'; });
})(liveUpdate);
function voyageView() {
  const slots = shipSlots(), voy = S.voy || [], nxt = nextShipAt();
  const ships = Array.from({ length: slots }, (_, i) => {
    const sh = voy[i];
    if (!sh) return `<div class="voy-ship idle">⚓ <b>Ship ${i + 1}</b> <small class="muted">in harbour: pick a voyage below</small></div>`;
    const a = ACTIONS[sh.k];
    return `<div class="voy-ship">⛵ <b>Ship ${i + 1}: ${a.name}</b> <small>back in <b data-voy="${i}">${fmtTime(Math.max(0, sh.end - now()) / 1000)}</b></small><div class="voy-bar"><div class="voy-fill" style="width:${Math.min(100, 100 * (now() - sh.start) / (sh.end - sh.start))}%"></div></div></div>`;
  }).join('');
  const free = voy.slice(0, slots).filter(Boolean).length < slots;
  const list = Object.entries(VOY).map(([k, [mins, sup, q]]) => {
    const a = ACTIONS[k], lock = LV.sailing < a.lvl, oid = Object.keys(a.out)[0], est = q * voyCargoMult(k);
    const supTxt = Object.entries(sup).map(([i, n]) => `<span class="${have(i) >= n ? '' : 'cb-red'}">${n} ${ITEMS[i].name.toLowerCase()}</span>`).join(' · ') || 'no supplies needed';
    return `<div class="upg ${lock ? 'locked' : ''}"><div class="upg-icon">${itemIcon(oid)}</div><div class="upg-main"><b>${a.name}</b> <small class="muted">Lv ${a.lvl} · ${fmtTime(voyDur(k) / 1000)}</small>
      <small>Cargo ≈ ${fmtD(est)} × ${ITEMS[oid].name} · ${fmt(a.xp * mins * 8 * (typeof farmMult === 'function' ? farmMult() : 1) * M.xp * SKILL_XP_RATE)} xp</small><small>Supplies: ${supTxt}</small></div>
      ${lock ? `<span class="muted">Lv ${a.lvl}</span>` : `<button class="btn ${free && voySupOk(k) ? '' : 'poor'}" data-act="voy-send" data-id="${k}">Send</button>`}</div>`;
  }).join('');
  return skillHead('sailing') + `<div class="panel voy"><h3>⛵ Your fleet <small class="muted">${slots}/5 ships</small></h3>${ships}
    <div class="row-between voy-auto"><small>🔁 Auto-resend: ships set off again on the same voyage if you have the supplies (while offline too, up to your offline limit)</small><button class="btn ${S.voyAuto ? 'danger' : ''}" data-act="voy-auto">${S.voyAuto ? 'On' : 'Off'}</button></div>
    <div class="row-between voy-auto"><small>🧑‍✈️ Deckhands: <b>${fmt(S.workers.harbour || 0)}</b> · +1% cargo each${nxt ? ` · next ship at ${nxt}` : ' · fleet complete'}</small><span><button class="btn" data-act="hire" data-st="harbour" data-k="1">Hire<small data-hire="harbour:1"></small></button><button class="btn" data-act="hire" data-st="harbour" data-k="10">×10<small data-hire="harbour:10"></small></button></span></div></div>
    <div class="panel"><h3>🗺️ Voyages <small class="muted">ships sail for real time and bring back a big haul</small></h3><div class="list">${list}</div></div>${shipPanel().replace(/Sailing speed \+20% per level \(now \+\d+%\)/, `Voyages 6% shorter per level (now −${Math.round((1 - Math.pow(0.94, shipLvl('hull'))) * 100)}%)`)}`;
}
viewSig = (orig => function () { return UI.view === 'skill' && UI.skill === 'sailing' ? orig() + JSON.stringify(S.voy || []) + shipSlots() + (S.voyAuto ? 1 : 0) : orig(); })(viewSig);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act; if (!['voy-send', 'voy-auto'].includes(a)) return;
  e.stopImmediatePropagation();
  if (a === 'voy-auto') S.voyAuto = !S.voyAuto;
  else {
    const k = t.dataset.id, slots = shipSlots(); S.voy ||= [];
    const i = Array.from({ length: slots }, (_, j) => j).find(j => !S.voy[j]);
    if (i === undefined) toast('All your ships are at sea. Hire deckhands for more ships.', 'warn');
    else if (!voyOk(k)) toast(`You need supplies: ${Object.entries(VOY[k][1]).map(([id, q]) => `${q} ${ITEMS[id].name}`).join(', ')}`, 'warn');
    else { voyLaunch(i, k); SFX.play('click'); toast(`⛵ Ship ${i + 1} sets sail: ${ACTIONS[k].name}`); }
  }
  UI.force = true; render(); liveUpdate();
}, true);
// pirate & seafaring sources
for (const id of ['star_coral', 'abyssal_pearl', 'dragon_metal_shard', 'pirate_doubloon', 'trade_goods']) if (SOURCES[id]) SOURCES[id] = SOURCES[id].map(s => s.replace(/^Sailing/, 'Sailing voyage'));

/* ---------- boot ---------- */
(function () {
  ach('fleet', 'Admiral', 'Command a fleet of 5 ships', '⚓', () => shipSlots() >= 5, 20);
  ach('voyager', 'Voyager', 'Complete 100 voyages', '🗺️', g => (g.S.lifetime.voyages || 0) >= 100, 15);
})();
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);
function boot21() { boot20(); recalc(); voyTick(); UI.force = true; render(); }
