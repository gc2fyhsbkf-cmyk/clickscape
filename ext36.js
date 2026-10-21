'use strict';
/* =========================================================
   CLICKSCAPE v9.12 — offline time is earned (4h base, Night shift upgrades),
   the Wardrobe: rare cosmetics give permanent bonuses and survive every reset
   ========================================================= */

/* ================= OFFLINE: 4 HOURS TO START, EVERY HOUR EARNED ================= */
const OFF_BASE = 4, OFF_MAX = 48;
// Night shift: a permanent coin sink (kept through AC, TD and Apotheosis), +2h per level
const NIGHT = { max: 8, hours: 2, cost: n => 1e6 * Math.pow(12, n) };
const nightLvl = () => S.lifetime?.night || 0;
function offlineParts() {
  const P = [['Base', OFF_BASE]];
  if (has('long_rest')) P.push(['🛏️ Feather Bed', 2]);
  if (nightLvl()) P.push(['🌙 Night shift', NIGHT.hours * nightLvl()]);
  if (perk('tireless')) P.push(['⏳ Tireless (essence)', 2 * perk('tireless')]);
  if (room('portal')) P.push(['🌀 Portal chamber', 2 * room('portal')]);
  const tl = S.trans?.perks?.timeless || 0; if (tl) P.push(['✴️ Timeless', 6 * tl]);
  if (typeof relicOn === 'function' && relicOn('fairy')) P.push(["🧚 Fairy's Flight", 4]);
  const q = permBuffs().reduce((a, b) => a + (b.offline || 0), 0); if (q) P.push(['📜 Quests', q]);
  return P;
}
offlineHours = function () { return Math.min(OFF_MAX, offlineParts().reduce((a, [, h]) => a + h, 0)); };

// rewrite the descriptions of everything that touches offline time
(() => {
  const u = UPGRADES.find(x => x.id === 'long_rest'); if (u) { u.desc = 'Offline progress limit +2h'; u.cost = 250000; u.eff = { type: 'offline', hours: 2 }; }
  const t = ASC_PERKS.find(x => x.id === 'tireless'); if (t) t.desc = l => `+${l * 2}h offline progress`;
  const p = HOUSE.find(x => x.id === 'portal'); if (p) p.desc = l => `+${l * 2}h offline progress`;
  const tp = (typeof TRANS_PERKS !== 'undefined' ? TRANS_PERKS : []).find(x => x.id === 'timeless'); if (tp) tp.desc = l => `+${l * 6}h offline progress`;
  const f = RELICS.flat(2).find(x => x && x.id === 'fairy'); if (f) f.desc = '+4h offline time this run';
})();

function nightPanel() {
  const n = nightLvl(), c = NIGHT.cost(n), h = offlineHours(), parts = offlineParts();
  return `<div class="panel night"><div class="row-between"><div><b>🌙 Night shift</b> <small class="muted">· Lv ${n}/${NIGHT.max}</small><br>
      <small class="muted">Your workers keep going for <b class="y">${h}h</b> while you're away (max ${OFF_MAX}h). Night shift levels are kept forever.</small></div>
      ${n < NIGHT.max ? `<button class="btn ${S.coins >= c ? '' : 'poor'}" data-act="night-buy" data-afford="${c}">+${NIGHT.hours}h<br><small>🪙${fmt(c)}</small></button>` : '<button class="btn disabled" disabled>Max</button>'}</div>
    <small class="muted">${parts.map(([k, v]) => `${k} ${v}h`).join(' · ')}</small></div>`;
}
viewUpgrades = (orig => function () { return nightPanel() + orig(); })(viewUpgrades);
VIEWS.upgrades = (orig => function () { return rebrand(orig()); })(viewUpgrades);
viewSettings = (orig => function () { return orig().replace('<div class="panel"><h3>💾 Save</h3>', `<div class="panel small">🌙 Offline limit: <b>${offlineHours()}h</b> · raise it with Night shift on the Upgrades page, the Feather Bed, essence perks and more.</div><div class="panel"><h3>💾 Save</h3>`); })(viewSettings);
VIEWS.settings = (orig => function () { return rebrand(orig()); })(viewSettings);
viewSig = (orig => function () { return UI.view === 'upgrades' ? orig() + '|n' + nightLvl() : orig(); })(viewSig);

// coming back after the limit ran out points at how to raise it
simulateOffline = (orig => function () {
  const capped = (Date.now() - S.last) / 1000 > offlineHours() * 3600; orig();
  if (capped) setTimeout(() => !$('#modal .wb2') && $('#modal .btn.big')?.insertAdjacentHTML('beforebegin', `<p class="small y">🌙 Your workers stopped after ${offlineHours()}h. Raise the limit with Night shift on the Upgrades page.</p>`), 0);
})(simulateOffline);

/* ================= THE WARDROBE ================= */
// rare cosmetics stored in the costume room give permanent bonuses and are never lost on a reset,
// so a lucky clue drop is a real choice: cash it in now, or keep it for good
const isWardrobe = id => !!ITEMS[id]?.cosmetic;
const WARD_IDS = Object.keys(ITEMS).filter(isWardrobe);
const wardPts = id => Math.max(1, Math.min(5, Math.round(Math.log10((ITEMS[id].value || 5e4) / 1e4))));
const wardTotal = () => WARD_IDS.reduce((a, id) => a + wardPts(id), 0);
const wardOwned = () => WARD_IDS.filter(id => (S.costume?.[id] || 0) > 0);
const wardScore = () => wardOwned().reduce((a, id) => a + wardPts(id), 0);
// clue sets: every cosmetic unique of a clue tier stored = +25% on all wardrobe bonuses
const WARD_SETS = Object.entries(CLUE_UNIQUES).map(([t, L]) => [t, [...new Set(L)].filter(isWardrobe)]).filter(([, L]) => L.length);
const wardSets = () => WARD_SETS.filter(([, L]) => L.every(id => (S.costume?.[id] || 0) > 0)).map(([t]) => t);
// +0.5% XP and +1% rare drops per point
const wardMult = () => { const p = wardScore(), k = 1 + 0.2 * wardSets().length; return { xp: 1 + Math.min(0.6, 0.005 * p * k), luck: 1 + Math.min(1.2, 0.01 * p * k) }; };
recalc4 = (orig => function () { orig(); if (!S?.costume) return; const W = wardMult(); M.xp *= W.xp; M.luck *= W.luck; })(recalc4);

// wardrobe pieces survive AC, TD and Apotheosis (outfits & skillcapes in the room still reset with the bank)
const keepWardrobe = fn => (orig => function (...a) {
  const old = S, kept = {}; for (const id in (S.costume || {})) if (isWardrobe(id) && S.costume[id] > 0) kept[id] = S.costume[id];
  const r = orig.apply(this, a);
  if (S !== old) { const C = S.costume ||= {}; for (const id in kept) C[id] = Math.max(C[id] || 0, kept[id]); recalc(); }
  return r;
})(fn);
ascend = keepWardrobe(ascend);
if (typeof transcend === 'function') transcend = keepWardrobe(transcend);
if (typeof transcend2 === 'function') transcend2 = keepWardrobe(transcend2);
if (typeof apotheosis === 'function') apotheosis = keepWardrobe(apotheosis);

viewCostume = (orig => function () {
  const p = wardScore(), W = wardMult(), got = wardOwned().length;
  const sets = WARD_SETS.map(([t, L]) => { const n = L.filter(id => S.costume?.[id] > 0).length; return `<span class="chip ${n === L.length ? 'y' : ''}">${CLUE_TIERS[t]?.name || t} ${n}/${L.length}</span>`; }).join(' ');
  const panel = `<div class="panel ward"><h3>👑 Wardrobe <small class="muted">· ${got}/${WARD_IDS.length} pieces · ${p}/${wardTotal()} pts</small></h3>
    <small>Rare cosmetics stored here are <b>kept forever</b>, through every ascension, transcendence and apotheosis, and each one gives a permanent bonus (rarer pieces give more).</small>
    <div class="stats"><div>XP</div><b class="y">+${fmt((W.xp - 1) * 100)}%</b><div>Rare drops</div><b class="y">+${fmt((W.luck - 1) * 100)}%</b></div>
    <small class="muted">Clue sets: complete every unique of a clue tier for +20% on all wardrobe bonuses (wardrobe caps: +60% XP, +120% rare drops).</small><div class="chips">${sets}</div></div>`;
  return orig().replace('<div class="list">', panel + '<div class="list">');
})(viewCostume);
// tag wardrobe rows with their points
viewCostume = (orig => function () {
  return orig().replace(/data-act="costume-take" data-id="([a-z0-9_]+)"/g, (m, id) => isWardrobe(id) ? `${m} title="Taking it out removes its wardrobe bonus"` : m)
    .replace(/<b>([^<]+)<\/b><small>([^<]*) · ×(\d+)<\/small>/g, (m, name, slot, q) => { const id = WARD_IDS.find(i => ITEMS[i].name === name); return id ? `<b>${name} <small class="y">👑 ${wardPts(id)} pt${wardPts(id) > 1 ? 's' : ''}</small></b><small>${slot} · ×${q}</small>` : m; });
})(viewCostume);
VIEWS.costume = (orig => function () { return rebrand(orig()); })(viewCostume);

// the item window tells you what a cosmetic is worth to the wardrobe
openItemModal = (orig => function (id, fromSlot) {
  orig(id, fromSlot); if (!isWardrobe(id)) return; const box = $('#modal .item-modal') || $('#modal'); if (!box) return;
  const stored = (S.costume?.[id] || 0) > 0;
  box.insertAdjacentHTML('beforeend', `<p class="small ${stored ? 'muted' : 'y'}">👑 Wardrobe piece (${wardPts(id)} pt${wardPts(id) > 1 ? 's' : ''}): ${stored ? 'already in your costume room.' : `store it for a permanent +${fmtD(wardPts(id) * 0.5)}% XP and +${wardPts(id)}% rare drops, kept through every reset.`}</p>`);
})(openItemModal);

/* ---------- clicks & boot ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
  if (a === 'night-buy') {
    e.stopImmediatePropagation(); const n = nightLvl(); if (n >= NIGHT.max) return; const c = NIGHT.cost(n);
    if (S.coins < c) return toast(`🌙 You need 🪙${fmt(c)} for the next Night shift.`, 'warn');
    S.coins -= c; S.lifetime.night = n + 1; toast(`🌙 Night shift ${n + 1}: your workers now keep going for ${offlineHours()}h while you're away.`, 'rare', 5000);
    UI.force = true; render(); return;
  }
  if (a === 'costume-take' && isWardrobe(t.dataset.id)) setTimeout(() => { recalc(); toast(`👑 ${ITEMS[t.dataset.id].name} left the wardrobe: its bonus is gone until you store it again.`, 'warn', 4500); }, 0);
  if (a === 'costume-store' || a === 'costume-one') setTimeout(() => { recalc(); UI.force = true; render(); }, 0);
}, true);
function boot36() { boot35(); recalc(); UI.force = true; render(); }

