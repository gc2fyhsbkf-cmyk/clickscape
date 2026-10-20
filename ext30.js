'use strict';
/* =========================================================
   CLICKSCAPE v9.7 — Pantheon costs that scale, tier bones for Prayer,
   expeditions, a richer "welcome back" summary, progress charts
   ========================================================= */

/* ================= PANTHEON: pricier levels + endless perks ================= */
for (const p of TRANS_PERKS) if (p.max > 1 && !p.endless && !p.scaled) { const c0 = p.cost; p.cost = l => Math.round(c0(l) * Math.pow(2, l)); p.scaled = true; }
[{ id: 'dmight', icon: '🌟', name: 'Divine might', max: 9999, endless: true, cost: l => Math.round(4 * Math.pow(1.6, l)), desc: l => `All production ×${fmtD(Math.pow(1.5, l))}` },
 { id: 'dinsight', icon: '📖', name: 'Divine insight', max: 9999, endless: true, cost: l => Math.round(5 * Math.pow(1.6, l)), desc: l => `All XP ×${fmtD(Math.pow(1.3, l))}` },
].forEach(p => { if (!TRANS_PERKS.some(x => x.id === p.id)) TRANS_PERKS.push(p); });
recalc4 = (orig => function () {
  orig(); if (!S?.asc) return; const tp = S.trans?.perks || {};
  if (tp.dmight) { const k = Math.pow(1.5, tp.dmight); for (const st of STATION_ORDER) { M.rate[st] *= k; M.tap[st] *= k; } }
  if (tp.dinsight) M.xp *= Math.pow(1.3, tp.dinsight);
})(recalc4);

/* ================= TIER BONES: Prayer keeps up at high levels ================= */
const BONE_NAMES = { ascended: 'Dawn', exalted: 'Sky', divine: 'Halo', eternal: 'Ever', godforged: 'Ember', starmetal: 'Star', voidsteel: 'Void', primordial: 'First' };
ATIERS.forEach((T, i) => {
  const id = T.id + '_bones', nm = (BONE_NAMES[T.id] || T.name) + ' bones';
  if (!ITEMS[id]) item(id, nm, Math.round(T.bv / 10), { cat: 'drop', kind: 'bone', tint: T.tint });
  const xp = Math.round(24000 * Math.pow(1.6, i));
  if (!ACTIONS['p_' + id]) A7({ id: 'p_' + id, st: 'altar', name: 'Offer ' + nm.toLowerCase(), lvl: Math.max(1, T.lvl - 50), xp, hp: 2, inp: { [id]: 1 }, out: {}, icon: id });
  if (typeof BONE_XP === 'object') BONE_XP[id] = xp;
});
(function () {
  const tiOf = {}; [...(typeof BEYOND !== 'undefined' ? BEYOND : []), ...(typeof BEYOND_BOSSES !== 'undefined' ? BEYOND_BOSSES : [])].forEach(b => { tiOf[b[0]] = b[3]; });
  for (const m of MONSTERS) {
    const ti = tiOf[m.id]; if (ti == null || !m.drops) continue;
    const a = ATIERS[ti], b = ATIERS[Math.min(ATIERS.length - 1, ti + 3)];
    if (a && !m.drops.some(d => d[0] === a.id + '_bones')) m.drops.push([a.id + '_bones', 1, 1, m.boss ? 5 : 2]);
    if (b && b !== a) m.drops.push([b.id + '_bones', m.boss ? 0.2 : 0.05, 1, 1]);
    [a, b].forEach(T => T && (SOURCES[T.id + '_bones'] ||= []).push(`Drop: ${m.name}`));
  }
})();

/* ================= EXPEDITIONS ================= */
const EXPEDITIONS = [
  { id: 'scout', icon: '🧭', name: 'Scouting trip', h: 1, cost: 1, loot: 1 },
  { id: 'delve', icon: '⛏️', name: 'Deep delve', h: 4, cost: 4, loot: 5 },
  { id: 'voyage', icon: '🏔️', name: 'Grand expedition', h: 12, cost: 12, loot: 18 },
];
const expSlots = () => 1 + (lifeAsc() >= 1 ? 1 : 0) + (tcount() >= 1 ? 1 : 0) + (apoCount() >= 1 ? 1 : 0);
const runHours = () => Math.max(0.25, (now() - (S.stats.started || now())) / 3.6e6);
const expCost = e => Math.round(e.cost * Math.max(500, 0.02 * (S.stats.earned || 0) / runHours()));
const topTier = () => { let t = null; for (const T of ATIERS) if (LV.mining >= T.lvl || LV.woodcutting >= T.lvl) t = T; return t; };
function expLoot(e) {
  const got = {}, g = (id, n) => { if (ITEMS[id] && n > 0) got[id] = (got[id] || 0) + Math.round(n); };
  const k = e.loot, T = topTier();
  const coins = Math.round(expCost(e) * (1.6 + rnd()));
  const mats = T ? [T.id + '_ore', T.id + '_logs', 'raw_' + T.id + '_fish', T.id + '_bones'] : ['coal', 'yew_logs', 'raw_lobster', 'big_bones'];
  for (let i = 0; i < 2 + k; i++) g(mats[randInt(0, mats.length - 1)], randInt(5, 20) * (1 + LV.slayer / 100));
  const tier = clueTierFor(combatLevel ? combatLevel() : 50);
  if (rnd() < 0.15 * k) g('clue_' + tier, 1);
  if (rnd() < 0.1 * k) g('casket_' + tier, 1);
  if (rnd() < 0.08 * k) g('mystery_box', 1);
  if (rnd() < 0.05 * k) g('xp_lamp', 1);
  return { coins, got, pet: rnd() < 0.002 * k * M.luck };
}
function expTick() {
  const E = S.exped; if (!E?.length) return; const t = now();
  E.forEach((x, i) => {
    if (!x || x.end > t || x.done) return;
    const e = EXPEDITIONS.find(z => z.id === x.id), r = expLoot(e); x.done = true;
    gainCoins(r.coins); for (const id in r.got) { add(id, r.got[id]); logItem(id, r.got[id]); }
    if (r.pet && typeof givePet === 'function' && PETS.explorer) givePet('explorer');
    S.lifetime.exped = (S.lifetime.exped || 0) + 1;
    const msg = `${e.icon} ${e.name} returned: 🪙${fmt(r.coins)}${Object.keys(r.got).length ? ' + ' + Object.entries(r.got).map(([id, n]) => `${fmt(n)} ${ITEMS[id].name}`).join(', ') : ''}`;
    if (OFF) OFFLOG.push(msg); else toast(msg, 'rare', 6000);
    E[i] = null;
  });
}
let expT = 0;
tickCore = (orig => function (dt) { orig(dt); expT += dt; if (expT >= 2) { expT = 0; expTick(); } })(tickCore);
PETS.explorer ||= { name: 'Compass sprite', icon: '🧚', st: 'combat', chance: 0, desc: 'Found on expeditions · +10% rare drops' };
function viewExpeditions() {
  const E = S.exped ||= [], slots = expSlots(), t = now();
  const rows = Array.from({ length: slots }, (_, i) => {
    const x = E[i]; if (!x) return `<div class="voy-ship idle">🏕️ <b>Party ${i + 1}</b> <small class="muted">ready to set out</small></div>`;
    const e = EXPEDITIONS.find(z => z.id === x.id);
    return `<div class="voy-ship">${e.icon} <b>Party ${i + 1}: ${e.name}</b> <small>back in <b data-exp="${i}">${fmtTime(Math.max(0, x.end - t) / 1000)}</b></small><div class="voy-bar"><div class="voy-fill" style="width:${Math.min(100, 100 * (t - x.start) / (x.end - x.start))}%"></div></div></div>`;
  }).join('');
  const free = E.slice(0, slots).filter(Boolean).length < slots;
  const list = EXPEDITIONS.map(e => `<div class="upg"><div class="upg-icon">${e.icon}</div><div class="upg-main"><b>${e.name}</b> <small class="muted">${e.h}h</small><small>Brings back coins, ${topTier() ? topTier().name.toLowerCase() + '-tier ' : ''}materials and bones, with a chance of clues, caskets, boxes and lamps</small><small>Supplies: 🪙${fmt(expCost(e))}</small></div><button class="btn ${free && S.coins >= expCost(e) ? '' : 'poor'}" data-act="exp-go" data-id="${e.id}">Send</button></div>`).join('');
  return subHead('🧭 Expeditions', 'menu') + `<div class="panel"><p class="small">Send adventuring parties out for real time. They return on their own (offline too) with loot that scales with your level. Parties: ${slots} (more unlock with ascension, Transcendence and Apotheosis).</p>${rows}</div><div class="panel"><h3>🗺️ Destinations</h3><div class="list">${list}</div></div>`;
}
VIEWS.expeditions = () => rebrand(viewExpeditions());
if (typeof HUB_VIEWS !== 'undefined') HUB_VIEWS.push('expeditions');
viewMenu = (orig => function () { return orig().replace('<div class="panel row-between"><div><b>📜 Messages', `<div class="panel row-between"><div><b>🧭 Expeditions</b><br><small class="muted">${(S.exped || []).filter(Boolean).length}/${expSlots()} parties out</small></div><button class="btn" data-nav="expeditions">Open</button></div><div class="panel row-between"><div><b>📜 Messages`); })(viewMenu);
VIEWS.menu = (orig => function () { return rebrand(orig()); })(viewMenu);
liveUpdate = (orig => function () { orig(); document.querySelectorAll('[data-exp]').forEach(e => { const x = S.exped?.[+e.dataset.exp]; if (x) e.textContent = fmtTime(Math.max(0, x.end - now()) / 1000); }); })(liveUpdate);
// expeditions survive ascension
ascend = (orig => function () { const old = S, ex = old.exped; orig(); if (S !== old) S.exped = ex; })(ascend);

/* ================= WELCOME BACK: prestige highlights ================= */
simulateOffline = (orig => function () {
  const a0 = lifeAsc(), t0 = tcount(), s0 = sigils(), tl0 = totalLevel(), x0 = S.lifetime.exped || 0;
  orig();
  const box = $('#modal'); if (!box || box.hidden || !/Welcome back/.test(box.innerHTML)) return;
  const tiles = [['🌀', 'Ascensions', lifeAsc() - a0], ['✴️', 'Transcendences', tcount() - t0], ['🔆', 'Sigils', tcount() > t0 || lifeAsc() > a0 ? sigils() : sigils() - s0], ['📈', 'Levels', Math.max(0, totalLevel() - tl0)], ['🧭', 'Expeditions', (S.lifetime.exped || 0) - x0]].filter(x => x[2] > 0);
  if (!tiles.length) return;
  const h2 = box.querySelector('h2'); if (h2) h2.insertAdjacentHTML('afterend', `<div class="away-tiles">${tiles.map(([i, n, v]) => `<div class="away-tile"><span>${i}</span><b>+${fmt(v)}</b><small>${n}</small></div>`).join('')}</div>`);
})(simulateOffline);

/* ================= PROGRESS CHARTS ================= */
function histSample() {
  const H = S.lifetime.hist ||= [];
  const last = H[H.length - 1]; if (last && now() - last.t < 600000) return;
  H.push({ t: now(), tl: totalLevel(), s: Math.log10(1 + sigils()), c: Math.log10(1 + Math.max(0, S.lifetime.earned || 0)), a: lifeAsc(), d: tcount() });
  if (H.length > 400) H.splice(0, H.length - 400);
}
let histT = 0;
tickCore = (orig => function (dt) { orig(dt); histT += dt; if (histT >= 60) { histT = 0; histSample(); } })(tickCore);
function sparkChart(title, H, key, fmtY) {
  if (H.length < 2) return `<div class="chart-card"><b>${title}</b><p class="muted small">Not enough history yet: check back after a while.</p></div>`;
  const W = 320, Hh = 90, xs = H.map(p => p.t), ys = H.map(p => p[key]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys) || 1;
  const X = t => 4 + (W - 8) * (t - x0) / Math.max(1, x1 - x0), Y = v => Hh - 4 - (Hh - 12) * (v - y0) / Math.max(1e-9, y1 - y0);
  const pts = H.map(p => `${X(p.t).toFixed(1)},${Y(p[key]).toFixed(1)}`).join(' ');
  const marks = H.filter((p, i) => i && p.d > H[i - 1].d).map(p => `<line x1="${X(p.t)}" x2="${X(p.t)}" y1="0" y2="${Hh}" class="ch-td"/>`).join('');
  return `<div class="chart-card"><div class="row-between"><b>${title}</b><small class="muted">${fmtY(ys[ys.length - 1])}</small></div><svg viewBox="0 0 ${W} ${Hh}" class="chart">${marks}<polyline points="${pts}" class="ch-line"/><circle cx="${X(xs[xs.length - 1])}" cy="${Y(ys[ys.length - 1])}" r="3" class="ch-dot"/></svg></div>`;
}
viewStats2 = (orig => function () {
  histSample(); const H = S.lifetime.hist || [];
  const span = H.length > 1 ? fmtTime((H[H.length - 1].t - H[0].t) / 1000) : '';
  return orig() + `<div class="panel"><h3>📊 Progress over time <small class="muted">${span ? '· last ' + span : ''} · dashed lines = Transcendence</small></h3>
    ${sparkChart('Total level', H, 'tl', v => fmt(v))}${sparkChart('Sigils (log scale)', H, 's', v => fmt(Math.pow(10, v)))}${sparkChart('Lifetime coins (log scale)', H, 'c', v => fmt(Math.pow(10, v)))}${sparkChart('Lifetime ascensions', H, 'a', v => fmt(v))}</div>`;
})(viewStats2);
VIEWS.stats = (orig => function () { return rebrand(orig()); })(viewStats2);

/* ---------- clicks & boot ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="exp-go"]'); if (!t) return;
  e.stopImmediatePropagation();
  const E = S.exped ||= [], slots = expSlots(), ex = EXPEDITIONS.find(z => z.id === t.dataset.id), c = expCost(ex);
  const i = Array.from({ length: slots }, (_, j) => j).find(j => !E[j]);
  if (i === undefined) toast('All your parties are out.', 'warn');
  else if (S.coins < c) toast("You can't afford the supplies.", 'warn');
  else { S.coins -= c; E[i] = { id: ex.id, start: now(), end: now() + ex.h * 3.6e6 }; toast(`${ex.icon} Party ${i + 1} sets out: ${ex.name}`); }
  UI.force = true; render(); liveUpdate();
}, true);
viewSig = (orig => function () { return UI.view === 'expeditions' ? orig() + JSON.stringify(S.exped || []) + Math.floor(S.coins / Math.max(1, expCost(EXPEDITIONS[0]))) : orig(); })(viewSig);
(function () {
  for (const it of Object.values(ITEMS)) it.name = rebrand(it.name);
  Object.keys(ITEMS).forEach(id => { if (!(id in ITEM_ORDER)) ITEM_ORDER[id] = Object.keys(ITEM_ORDER).length; });
  for (const id of Object.keys(ITEMS)) { const it = ITEMS[id]; if (!it.hidden && !it.untradeable && it.value >= 1 && !GE_SET.has(id)) { GE_ITEMS.push(id); GE_SET.add(id); } }
  ach('exp_10', 'Trailblazer', 'Complete 10 expeditions', '🧭', g => (g.S.lifetime.exped || 0) >= 10, 15);
})();
function boot30() { boot29(); expTick(); histSample(); UI.force = true; render(); }
