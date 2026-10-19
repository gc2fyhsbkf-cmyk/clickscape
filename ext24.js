'use strict';
/* =========================================================
   CLICKSCAPE v9.1 — workers earn their keep, crates need you, a readable feed,
   archaeology shrines, more low-level monsters, stronger hands-on combat
   ========================================================= */

/* ================= WORKERS: dearer, capped, and weaker on a fresh account ================= */
const workerCap = () => lifeAsc() < 1 && !tcount() && !apoCount() ? 10 : 25 + Math.floor(capAsc(S.asc?.count || 0) / 2) + 25 * tcount() + 100 * apoCount();
const workerEff = () => Math.min(1, 0.35 + 0.13 * Math.min(5, lifeAsc() + 5 * tcount() + 5 * apoCount())) * (1 + 0.25 * tcount());
hire = (orig => function (st, k) {
  const cap = workerCap(), n = S.workers[st] || 0, room = cap - n;
  if (room <= 0) return toast(`👷 ${STATIONS[st].name} is full (${cap} workers). Ascend or Transcend to raise the cap.`, 'warn', 4000);
  if (k === 'max') { k = 0; while (k < room && hireCost(st, k + 1) <= S.coins) k++; if (!k) k = 1; }
  return orig(st, Math.min(k, room));
})(hire);
recalc4 = (orig => function () { orig(); if (!S?.asc) return; const e = workerEff(); for (const st of STATION_ORDER) M.rate[st] *= e; M.workerEff = e; })(recalc4);
viewSkill = (orig => function () {
  const h = orig(); if (UI.skill === 'farming' || UI.skill === 'sailing' || COMBAT_SKILLS.includes(UI.skill)) return h;
  const note = `<div class="panel small muted worker-note">👷 Worker cap <b>${workerCap()}</b> per station · efficiency <b>${Math.round(workerEff() * 100)}%</b> <span>(both rise with ascensions and Transcendence)</span></div>`;
  return h.replace('<div class="list">', note + '<div class="list">');
})(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);

/* ================= SKILLING BOSS CRATES: only from your own taps ================= */
let TAPPING = false;
for (const a of Object.values(ACTIONS)) if (a.crate) { a.crateDef = a.crate; delete a.crate; }
tapStation = (orig => function (...args) { TAPPING = true; try { return orig(...args); } finally { TAPPING = false; } })(tapStation);
doYield = (orig => function (st, a, n, xpScale) {
  const done = orig(st, a, n, xpScale);
  if (done > 0 && a.crateDef && TAPPING) { const k = rollCount(done, a.crateDef[1] * M.luck); if (k) { add(a.crateDef[0], k); toast(`📦 You earn ${k > 1 ? k + ' × ' : 'a '}${ITEMS[a.crateDef[0]].name}!`, 'rare'); } }
  return done;
})(doYield);
for (const id in SOURCES) SOURCES[id] = SOURCES[id].map(s => /crate|pouch|cache|pool/i.test(s) ? s : s);
for (const c of Object.values(CRATES)) (c.loot || []).forEach(l => { if (l[0] === 'coins') { l[1] = Math.round(l[1] / 2); l[2] = Math.round(l[2] / 2); } });

/* ================= A READABLE MESSAGE FEED ================= */
const MSG_LOG = [];
const FEED_BUF = { lvlup: [], rare: [] };
let feedFlushT = null;
function flushFeed() {
  feedFlushT = null;
  for (const cls of ['lvlup', 'rare']) {
    const b = FEED_BUF[cls]; if (!b.length) continue;
    const first = b[0], more = b.length - 1;
    toastRaw(more ? `${first} <small class="muted">+${more} more · see Messages</small>` : first, cls, more ? 4500 : 3500);
    FEED_BUF[cls] = [];
  }
}
const toastRaw = toast;
toast = function (html, cls = '', ms) {
  if (OFF) return;
  MSG_LOG.unshift({ html: rebrand(String(html)), cls, t: Date.now() }); if (MSG_LOG.length > 300) MSG_LOG.pop();
  if ((cls === 'lvlup' || cls === 'rare') && !LOOT_MUTE) { FEED_BUF[cls].push(html); if (!feedFlushT) feedFlushT = setTimeout(flushFeed, 1500); return; }
  return toastRaw(html, cls, cls === 'pet' ? Math.max(ms || 0, 12000) : ms);
};
function viewMsgLog() {
  const f = UI.logF || 'all', cls = { all: null, lvl: 'lvlup', loot: 'rare', pet: 'pet', warn: 'warn' }[f];
  const rows = MSG_LOG.filter(m => !cls || m.cls === cls).slice(0, 150).map(m => `<div class="log-row ${m.cls}"><small class="muted">${new Date(m.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small> <span>${m.html}</span></div>`).join('') || '<p class="muted pad">No messages yet.</p>';
  return subHead('📜 Messages', 'menu') + `<div class="tabs">${[['all', 'All'], ['lvl', '🎉 Levels'], ['loot', '✨ Loot'], ['pet', '🐾 Pets & rares'], ['warn', '⚠️ Warnings']].map(([k, n]) => `<button class="tab ${f === k ? 'on' : ''}" data-act="log-f" data-id="${k}">${n}</button>`).join('')}</div><div class="panel msg-log">${rows}</div>`;
}
VIEWS.msglog = () => viewMsgLog();
if (typeof HUB_VIEWS !== 'undefined') HUB_VIEWS.push('msglog');
viewMenu = (orig => function () { return orig().replace('<div class="panel', `<div class="panel row-between"><div><b>📜 Messages</b><br><small class="muted">Everything the feed showed, including drops that flew past</small></div><button class="btn" data-nav="msglog">Open</button></div><div class="panel`); })(viewMenu);
VIEWS.menu = (orig => function () { return rebrand(orig()); })(viewMenu);

/* ================= ARCHAEOLOGY: shrines in your house ================= */
// every dig site's material + its restored artefacts build a shrine that boosts what the site is known for
const SHRINES = DIGSITES.map(d => {
  const dig = ACTIONS['d_' + d.id], mat = dig && Object.keys(dig.out)[0];
  const arts = (STATION_ACTIONS.restore || []).filter(a => mat && a.inp[mat]).map(a => Object.keys(a.out)[0]);
  return mat ? { id: d.id, name: rebrand(d.name || cap1(d.id)), mat, arts, buff: d.buff, lvl: dig.lvl } : null;
}).filter(Boolean);
const shrineLvl = id => S.house?.shrines?.[id] || 0;
const shrineCost = (s, l) => ({ mat: Math.round(60 * Math.pow(4, l)), art: l + 1, coins: Math.round(5000 * Math.pow(12, l) * (1 + s.lvl / 20)) });
const shrineGain = (s, l) => { const b = s.buff; return b.type === 'grow' ? 1 - Math.min(0.7, (1 - b.mult) * 0.5 * l) : 1 + (b.mult - 1) * 0.5 * l; };
const artsHave = s => s.arts.reduce((a, id) => a + have(id), 0);
recalc4 = (orig => function () {
  orig(); if (!S?.house?.shrines) return;
  for (const s of SHRINES) {
    const l = shrineLvl(s.id); if (!l) continue; const g = shrineGain(s, l), b = s.buff;
    if (b.type === 'station' && M.rate[b.st] !== undefined) { M.rate[b.st] *= g; M.tap[b.st] *= g; }
    else if (b.type === 'stations') for (const st of b.sts) { if (M.rate[st] !== undefined) { M.rate[st] *= g; M.tap[st] *= g; } }
    else if (b.type === 'grow') M.grow *= g; else if (b.type === 'sell') M.sell *= g; else if (b.type === 'damage') M.dmg *= g; else if (b.type === 'xp') M.xp *= g; else if (b.type === 'luck') M.luck *= g;
  }
})(recalc4);
function shrinePanel() {
  return `<div class="panel"><h3>⛩️ Shrines <small class="muted">· built from Archaeology finds, kept through ascension</small></h3><div class="list">${SHRINES.map(s => {
    const l = shrineLvl(s.id), max = l >= 5, c = shrineCost(s, l), ok = have(s.mat) >= c.mat && artsHave(s) >= c.art && S.coins >= c.coins, lock = LV.archaeology < s.lvl;
    const now = l ? s.buff.desc.replace(/\d+%/, m => Math.round(Math.abs(shrineGain(s, l) - 1) * 100) + '%') : 'Not built';
    return `<div class="upg ${l ? 'got' : ''} ${lock ? 'locked' : ''}"><div class="upg-icon">${itemIcon(s.mat)}</div><div class="upg-main"><b>Shrine of the ${s.name} ${l}/5</b><small>${now}</small>
      ${max ? '' : `<small><span class="${have(s.mat) >= c.mat ? '' : 'cb-red'}">${fmt(c.mat)} ${ITEMS[s.mat].name.toLowerCase()}</span> · <span class="${artsHave(s) >= c.art ? '' : 'cb-red'}">${c.art} restored artefact${c.art > 1 ? 's' : ''} from this site</span> · 🪙${fmt(c.coins)}</small>`}</div>
      ${max ? '<span class="y">MAX</span>' : lock ? `<span class="muted">Arch ${s.lvl}</span>` : `<button class="btn ${ok ? '' : 'poor'}" data-act="shrine" data-id="${s.id}">Build</button>`}</div>`; }).join('')}</div></div>`;
}
viewHouse = (orig => function () { return orig() + shrinePanel(); })(viewHouse);
VIEWS.house = (orig => function () { return rebrand(orig()); })(viewHouse);
for (const s of SHRINES) { (SOURCES[s.mat] ||= []).push(`Builds the Shrine of the ${s.name} (House)`); s.arts.forEach(id => (SOURCES[id] ||= []).push(`Offer at the Shrine of the ${s.name} (House)`)); }

/* ================= MORE LOW-LEVEL MONSTERS ================= */
[{ id: 'goose', name: 'Goose', icon: '🪿', lvl: 2, hp: 6, atk: 1, def: 1, mh: 1, drops: [['bones', 1, 1, 1], ['feather', 1, 15, 40], ['raw_chicken', 0.5, 1, 1]] },
 { id: 'imp', name: 'Imp', icon: '😈', lvl: 4, hp: 10, atk: 3, def: 2, mh: 1, coins: [2, 20], drops: [['eye_of_newt', 0.5, 1, 3], ['vial_of_water', 0.4, 2, 6], ['bowstring', 0.2, 1, 3], ['ashes', 0.5, 1, 2]] },
 { id: 'giant_frog', name: 'Giant frog', icon: '🐸', lvl: 7, hp: 16, atk: 5, def: 4, mh: 2, drops: [['big_bones', 1, 1, 1], ['eye_of_newt', 1, 2, 5], ['raw_trout', 0.3, 1, 2]] },
 { id: 'scarecrow', name: 'Scarecrow', icon: '🎃', lvl: 9, hp: 18, atk: 6, def: 6, mh: 2, drops: [['flax', 1, 4, 12], ['potato_seed', 0.3, 2, 5], ['cabbage_seed', 0.2, 1, 3], ['limpwurt_seed', 0.05, 1, 1]] },
 { id: 'boar', name: 'Wild boar', icon: '🐗', lvl: 11, hp: 24, atk: 8, def: 7, mh: 3, drops: [['bones', 1, 1, 1], ['cowhide', 1, 1, 2], ['raw_beef', 1, 1, 2], ['leather', 0.2, 1, 2]] },
 { id: 'druid', name: 'Druid', icon: '🧙', lvl: 15, hp: 30, atk: 10, def: 9, mh: 3, coins: [5, 40], drops: [['bones', 1, 1, 1], ['guam', 0.3, 1, 2], ['tarromin', 0.2, 1, 2], ['limpwurt_root', 0.15, 1, 1], ['white_berries', 0.08, 1, 1], ['guam_seed', 0.1, 1, 2]] },
].forEach(m => {
  if (MONSTER_BY_ID[m.id]) return;
  m.drops = m.drops.filter(([i]) => ITEMS[i]); Object.assign(m, { spd: 2.4, area: 'overworld' });
  let at = MONSTERS.length; for (let i = MONSTERS.length - 1; i >= 0; i--) if (MONSTERS[i].area === 'overworld' && MONSTERS[i].lvl <= m.lvl) { at = i + 1; break; }
  MONSTERS.splice(at, 0, m); MONSTER_BY_ID[m.id] = m;
  m.drops.forEach(([i]) => (SOURCES[i] ||= []).push(`Drop: ${m.name} (level ${m.lvl})`));
});

/* ================= HANDS-ON COMBAT PAYS ================= */
// fighting gives 4× combat XP and low-level monsters fall faster, so grinding is a real alternative to trainers
const FIGHT_XP = 4;
let FIGHT_HIT = false;
playerAttack = (orig => function (...args) { FIGHT_HIT = true; try { return orig(...args); } finally { FIGHT_HIT = false; } })(playerAttack);
gainXP = (orig => function (skill, amt) { return orig(skill, FIGHT_HIT && COMBAT_SKILLS.includes(skill) ? amt * FIGHT_XP : amt); })(gainXP);
maxHit = (orig => function (tap, m = curMon()) { const h = orig(tap, m); const cl = typeof combatLevel === 'function' ? combatLevel() : 1; return m && !m.boss && cl > m.lvl * 2 ? Math.max(h, Math.ceil(m.hp / 2)) : h; })(maxHit);

/* ---------- clicks, styles & boot ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act; if (!['shrine', 'log-f'].includes(a)) return;
  e.stopImmediatePropagation();
  if (a === 'log-f') UI.logF = t.dataset.id;
  else {
    const s = SHRINES.find(x => x.id === t.dataset.id), l = shrineLvl(s.id), c = shrineCost(s, l);
    if (l >= 5) return;
    if (have(s.mat) < c.mat || artsHave(s) < c.art || S.coins < c.coins) toast(`You need ${fmt(c.mat)} ${ITEMS[s.mat].name}, ${c.art} restored artefact${c.art > 1 ? 's' : ''} from this site and 🪙${fmt(c.coins)}.`, 'warn');
    else {
      remove(s.mat, c.mat); S.coins -= c.coins; let need = c.art; for (const id of s.arts) { const k = Math.min(need, have(id)); if (k) { remove(id, k); need -= k; } }
      (S.house.shrines ||= {})[s.id] = l + 1; recalc(); SFX.play('ach'); toast(`⛩️ Shrine of the ${s.name} → level ${l + 1}`, 'pet');
    }
  }
  UI.force = true; render(); liveUpdate();
}, true);
viewSig = (orig => function () { return UI.view === 'msglog' ? orig() + MSG_LOG.length + (UI.logF || '') : UI.view === 'house' ? orig() + JSON.stringify(S.house?.shrines || {}) : orig(); })(viewSig);
function boot24() { boot23(); S.house ||= {}; recalc(); UI.force = true; render(); }
boot24();
