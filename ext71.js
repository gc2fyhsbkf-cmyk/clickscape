'use strict';
/* =========================================================
   CLICKSCAPE v9.50 — drop table deep dive: boss & rare uniques promoted to the gear tier their
   monster's level implies, champions get real drops, region locks close their gaps, and a
   kill-streak (enrage) mode for the toughest bosses: risk the streak chest for better odds
   ========================================================= */

/* ================= 1) GEAR TIER BY MONSTER LEVEL ================= */
// crafted ladder (scimitar power by level requirement) used as the yardstick
const LADDER = ['bronze', 'iron', 'steel', 'mithril', 'adamant', 'rune', 'dragon', 'primal', 'void', 'ascended', 'exalted', 'divine', 'eternal', 'godforged', 'starmetal', 'voidsteel', 'primordial'];
const gscore = it => (it.atk || 0) + (it.str || 0) + (it.def || 0) + (it.ratk || 0) + (it.rstr || 0) + (it.matk || 0) + (it.mdmg || 0) * 3;
const greq = it => it?.req ? Math.max(0, ...Object.values(it.req)) : 0;
const slotRef = slot => LADDER.map(m => ITEMS[`${m}_${slot}`]).filter(Boolean).map(it => [greq(it), gscore(it)]).sort((a, b) => a[0] - b[0]);
const REF = { weapon: slotRef('scimitar'), body: slotRef('platebody'), legs: slotRef('platelegs'), head: slotRef('full_helm'), shield: slotRef('kiteshield') };
const lerp = (pts, x) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [a, b] = [pts[i - 1], pts[i]]; return a[1] + (b[1] - a[1]) * (x - a[0]) / Math.max(1, b[0] - a[0]); } return pts[pts.length - 1][1]; };
// what level requirement of gear a monster of this level should drop
const TIER_PTS = [[1, 1], [30, 20], [60, 30], [90, 60], [120, 70], [300, 99], [600, 130], [1000, 180], [1600, 230], [2400, 280], [3200, 330]];
const tierReq = lvl => Math.round(lerp(TIER_PTS, lvl));
const isLadder = id => new RegExp(`^(${LADDER.join('|')})_(scimitar|platebody|platelegs|full_helm|kiteshield|dagger|defender|boots|chainbody|sq_shield|dfward|dbward)$`).test(id);
const PROMOTED = [];
(function promote() {
  const src = {}; for (const m of MONSTERS) if (!m.season) for (const d of m.drops || []) if (ITEMS[d[0]]?.slot) (src[d[0]] ||= []).push(m.lvl);
  for (const id of (typeof DROP_ONLY !== 'undefined' ? DROP_ONLY : [])) {
    const it = ITEMS[id]; if (!it || !src[id] || isLadder(id) || it.cosmetic || it.cat === 'tool') continue;
    if (!['weapon', 'body', 'legs', 'head', 'shield', 'feet', 'hands'].includes(it.slot)) continue;
    const cur = greq(it); if (!cur) continue;
    const tr = tierReq(Math.min(...src[id])); if (tr <= cur + 5) continue;
    let f = lerp(REF.weapon, tr) / Math.max(1, lerp(REF.weapon, cur));
    // armour never ends up more than 30% above crafted armour of its new level
    const R = REF[it.slot]; if (R) { const cap = lerp(R, tr) * 1.3 / Math.max(1, gscore(it)); f = Math.min(f, Math.max(1, cap)); }
    if (f <= 1.02) continue;
    for (const k of Q_STATS) if (typeof it[k] === 'number' && it[k] > 0) it[k] = Math.round(it[k] * (k === 'mdmg' ? Math.sqrt(f) : f));
    for (const k in it.req) it.req[k] = Math.max(it.req[k], tr);
    it.value = Math.round((it.value || 1) * f);
    PROMOTED.push([id, cur, tr, Math.round(f * 100) / 100]);
  }
  if (typeof requalify === 'function') requalify();
})();

/* ================= 2) CHAMPIONS DROP SOMETHING WORTH THE FIGHT ================= */
// each region's champion now drops tier gear for its level, and its region's best regular unique at double rate
(function () {
  const metalFor = lvl => { const tr = tierReq(lvl); let best = 'bronze'; for (const m of LADDER) { const it = ITEMS[`${m}_platebody`]; if (it && greq(it) <= tr && !(DROP_ONLY?.has?.(`${m}_platebody`) && m !== 'dragon')) best = m; } return best; };
  for (const R of REGIONS) {
    if (R.event) continue; const c = champion(R.id); if (!c || c.boss || !c.drops) continue;
    const mt = metalFor(c.lvl), add = (id, p) => { if (ITEMS[id] && !c.drops.some(d => d[0] === id)) { c.drops.push([id, p, 1, 1]); (SOURCES[id] ||= []).push(`${c.name}, champion (1/${Math.round(1 / p)})`); } };
    add(`${mt}_platebody`, 1 / 60); add(`${mt}_scimitar`, 1 / 50); add(`${mt}_platelegs`, 1 / 60);
    // the region's best regular-monster gear unique, at twice its usual rate
    let best = null; for (const m of regMons(R.id)) if (!m.boss && m !== c) for (const d of m.drops || []) { const it = ITEMS[d[0]]; if (it?.slot && it.cat !== 'tool' && !it.cosmetic && d[1] < 1 && (!best || (it.value || 0) > (ITEMS[best[0]].value || 0))) best = d; }
    if (best) add(best[0], Math.min(1 / 20, best[1] * 2));
    c.champBoost = true;
  }
})();
// champions also give more coins
killMonster = (orig => function (m) { if (!m?.champBoost || OFF) return orig.apply(this, arguments); const c0 = S.coins; const r = orig.apply(this, arguments); const d = S.coins - c0; if (d > 0) gainCoins(Math.round(d * 0.5)); return r; })(killMonster);

/* ================= 3) REGION LOCKS: no back doors ================= */
// the crypt brothers sat in no region (open from day one), and bounty-area monsters skipped the region
// gates entirely. Both now follow the region their level belongs to.
const bandRegion = lvl => REGIONS.find(r => r.band && lvl >= r.band[0] && lvl <= r.band[1])?.id || 'deep';
canFight = (orig => function (m) {
  if (m && (m.barrows || regionOf(m) === 'slayer')) { const r = m.barrows ? 'waste' : bandRegion(m.lvl); if (REG_BY_ID[r] && !regOpen(r) && !(typeof onTask === 'function' && onTask(m) && !m.barrows)) return `🗺️ ${REG_BY_ID[r].name} is locked: ${gateText(r)}`; }
  return orig.apply(this, arguments);
})(canFight);

/* ================= 4) KILL STREAKS (ENRAGE) ================= */
// for bosses level 580+: turn the streak on and every kill's loot goes into a streak chest instead of
// the bank. Each kill in a row makes the boss hit 10% harder (up to 3×) and your drop luck 5% better
// (up to 2×). Cash out any time to bank it all. Die, and the chest is lost.
const STREAK_LVL = 580;
const streakOk = m => !!m && m.boss && !m.raid && !m.season && m.lvl >= STREAK_LVL;
const SK = () => (S.streak ||= { on: false, mon: null, n: 0, items: {}, coins: 0 });
const skActive = () => { const k = SK(); return k.on && k.mon === S.combat?.mon && streakOk(curMon()); };
function streakCash(quiet) {
  const k = SK(); if (!k.n && !k.coins && !Object.keys(k.items).length) { k.n = 0; return; }
  if (k.coins) gainCoins(k.coins); for (const id in k.items) if (ITEMS[id]) add(id, k.items[id]);
  const n = Object.values(k.items).reduce((a, b) => a + b, 0);
  if (!quiet) toast(`🔥 Cashed out a ${k.n}-kill streak: 🪙${fmt(k.coins)} and ${fmt(n)} items to the bank.`, 'rare', 5000);
  k.n = 0; k.items = {}; k.coins = 0;
}
killMonster = (orig => function (m) {
  const k = SK(); if (OFF || !k.on || !streakOk(m)) return orig.apply(this, arguments);
  if (k.mon !== m.id) { streakCash(); k.mon = m.id; }
  const L = M.luck, b0 = { ...S.bank }, c0 = S.coins; M.luck = L * Math.min(2, 1 + 0.05 * k.n);
  let r; try { r = orig.apply(this, arguments); } finally { M.luck = L; }
  for (const id of new Set([...Object.keys(b0), ...Object.keys(S.bank)])) { const d = have(id) - (b0[id] || 0); if (d > 0 && ITEMS[id] && !ITEMS[id].outfit && !ITEMS[id].costumeSet) { remove(id, d); k.items[id] = (k.items[id] || 0) + d; } }
  const dc = S.coins - c0; if (dc > 0) { S.coins -= dc; k.coins += dc; }
  k.n++;
  if (typeof lastLoot !== 'undefined') { lastLoot = `<span class="y">🔥 Streak ${k.n}: loot added to the streak chest</span>`; const el = document.querySelector('[data-live="killloot"]'); if (el) el.innerHTML = `<small class="muted">Last kill:</small> ${lastLoot}`; }
  return r;
})(killMonster);
monsterAttack = (orig => function () {
  const m = curMon(); if (!skActive() || !SK().n || !m) return orig.apply(this, arguments);
  const mh = m.mh; m.mh = Math.round(mh * Math.min(3, 1 + 0.1 * SK().n)); try { return orig.apply(this, arguments); } finally { m.mh = mh; }
})(monsterAttack);
die = (orig => function () {
  const k = SK(), lost = k.n > 0 && skActive();
  const r = orig.apply(this, arguments);
  if (lost) { const n = Object.values(k.items).reduce((a, b) => a + b, 0), msg = `💀 Your ${k.n}-kill streak is over: the streak chest (🪙${fmt(k.coins)} + ${fmt(n)} items) is lost.`; if (OFF) OFFLOG.push(msg); else toast(msg, 'warn', 7000); k.n = 0; k.items = {}; k.coins = 0; }
  return r;
})(die);
// never risk a streak while you're away
simulateOffline = (orig => function () { if (SK().n) streakCash(true); return orig.apply(this, arguments); })(simulateOffline);
setInterval(() => { const k = SK(); if (k.n && (S.combat?.mon !== k.mon || !k.on)) streakCash(); }, 1500);
function streakPanel() {
  const m = curMon(); if (!streakOk(m)) return '';
  const k = SK(), on = k.on && k.mon === m.id, n = on ? k.n : 0, items = Object.values(k.items).reduce((a, b) => a + b, 0);
  const top = Object.entries(k.items).sort((a, b) => (ITEMS[b[0]]?.value || 0) * b[1] - (ITEMS[a[0]]?.value || 0) * a[1]).slice(0, 5);
  return `<div class="panel kstreak ${on ? 'on' : ''}"><div class="row-between"><div><b>🔥 Kill streak</b> <small class="muted">${on ? `· ${n} in a row` : '· off'}</small><br>
    <small class="muted">${on ? `Boss hits <b class="r">+${Math.round(Math.min(2, 0.1 * n) * 100)}%</b> · your drop luck <b class="y">+${Math.round(Math.min(1, 0.05 * n) * 100)}%</b> · loot goes in the streak chest. Die and it's lost.` : 'Risk it: each kill in a row makes the boss hit harder and your drops luckier. Loot is held until you cash out.'}</small></div>
    <button class="btn small ${on ? 'danger' : ''}" data-act="streak-toggle">${on ? 'Stop' : 'Start'}</button></div>
    ${on && (n || items) ? `<div class="streak-chest">${top.map(([id, q]) => `<span title="${esc(ITEMS[id].name)}">${itemIcon(id)}${q > 1 ? `<small>${fmt(q)}</small>` : ''}</span>`).join('')}<span class="muted small">🪙${fmt(k.coins)}${items > 5 ? ` · ${fmt(items)} items` : ''}</span><button class="btn small" data-act="streak-cash">💰 Cash out</button></div>` : ''}</div>`;
}
viewCombat = (orig => function () { const h = orig(); const p = streakPanel(); if (!p) return h; return h.includes('<div class="ctabs') ? h.replace('<div class="ctabs', p + '<div class="ctabs') : h + p; })(viewCombat);
VIEWS.combat = (orig => function () { return rebrand(orig()); })(viewCombat);
viewSig = (orig => function () { if (UI.view !== 'combat') return orig(); const k = SK(); return orig() + `|sk${k.on}${k.mon}${k.n}`; })(viewSig);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="streak-toggle"],[data-act="streak-cash"]'); if (!t) return; e.stopImmediatePropagation();
  const k = SK();
  if (t.dataset.act === 'streak-cash') streakCash();
  else if (k.on && k.mon === S.combat.mon) { streakCash(); k.on = false; toast('🔥 Kill streak stopped.', '', 2500); }
  else { streakCash(true); k.on = true; k.mon = S.combat.mon; k.n = 0; toast('🔥 Kill streak on: loot goes into the streak chest. Cash out before you die!', 'rare', 5000); }
  UI.force = true; render();
}, true);

function boot71() { boot70(); if (typeof requalify === 'function') requalify(); recalc(); UI.force = true; render(); }
