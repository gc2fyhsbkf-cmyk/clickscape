'use strict';
/* =========================================================
   CLICKSCAPE v9.2 — farmhands that actually farm, high-level content for every
   skill, more spells & voyages, metal set bonuses, a power breakdown
   ========================================================= */

/* ================= FARMHANDS DO THE FARMING ================= */
// they harvest ready patches and replant the same crop (buying seeds from the shop if you're out)
const rr = x => Math.floor(x) + (rnd() < x % 1 ? 1 : 0); // random rounding so small bonuses still count
function farmhandTick() {
  if (!fhN()) return;
  S.plots.forEach((p, i) => {
    if (!plotReady(p)) return;
    const c = p.c; harvest(i);
    if (!have(c + '_seed')) { const sp = SHOP.seeds.find(s => s.id === c + '_seed'); if (sp && S.coins >= sp.price * 10) { const q = 5; S.coins -= sp.price * q; add(c + '_seed', q); } }
    plant(i, c, true);
  });
}
let fhT = 0;
tickCore = (orig => function (dt) { orig(dt); fhT += dt; if (fhT >= 5) { fhT = 0; farmhandTick(); } })(tickCore);
// stronger, and the bonus never rounds away to nothing: +20% crops & XP per farmhand
harvest = (orig => function (i) {
  const p = S.plots[i]; if (!plotReady(p)) return 0;
  const c = CROP_BY_ID[p.c], xp0 = S.xp.farming, y = orig(i); if (!y) return y;
  const n = fhN(); if (!n) return y;
  const ex = rr(y * 0.1 * n); if (ex) add(c.cropItem || c.id, ex); // on top of the +10% each from v9.0
  const g = S.xp.farming - xp0; if (g > 0) S.xp.farming = Math.min(1e300, S.xp.farming + g * 0.1 * n / (1 + 0.1 * n));
  return y + ex;
})(harvest);
viewFarming = (orig => function () {
  return orig().replace(/\+(\d+)% crops & Farming XP · crops grow/, (m, x) => `+${fhN() * 20}% crops & Farming XP · they harvest & replant for you · crops grow`);
})(viewFarming);

/* ================= HIGH-LEVEL CONTENT FOR EVERY SKILL ================= */
const TIER_NAMES = {
  ascended: ['Dawnstag', 'Dawn noble', 'Sunrise steps'], exalted: ['Skywyrm', 'Sky baron', 'Cloud spires'], divine: ['Halo lynx', 'Temple high priest', 'Seraph bridges'],
  eternal: ['Everfox', 'Eternal archon', 'Timeless stair'], godforged: ['Emberhound', 'Forge lord', 'Molten causeway'], starmetal: ['Starmoth', 'Astral regent', 'Comet trail'],
  voidsteel: ['Voidstalker', 'Void sovereign', 'Rift walk'], primordial: ['Firstbeast', 'Primordial king', 'Path of creation'],
};
ATIERS.forEach((T, i) => {
  const nm = TIER_NAMES[T.id]; if (!nm) return;
  const f = Math.pow(1.35, i), L = T.lvl;
  // Hunter
  item(T.id + '_pelt', nm[0] + ' pelt', Math.round(T.bv / 5), { cat: 'drop', kind: 'hide', tint: T.tint });
  A7({ id: 'h_' + T.id + '_beast', st: 'hunt', name: nm[0], lvl: L, xp: Math.round(700 * f), hp: effort(700 * f, 12 + i), out: { [T.id + '_pelt']: 1 }, icon: T.id + '_pelt' });
  // Thieving
  const th = { id: T.id + '_mark', name: 'Pickpocket ' + nm[1].toLowerCase(), lvl: L, xp: Math.round(1600 * f), hp: 18 + i, coins: [Math.round(T.bv / 4), Math.round(T.bv / 2)], icon: '🎩', loot: [[T.id + '_herb_seed', 0.05, 1, 1], [T.id + '_pelt', 0.1, 1, 2]].filter(([x]) => ITEMS[x]) };
  if (typeof THIEVING !== 'undefined') THIEVING.push(th);
  A7({ id: 't_' + th.id, st: 'thieve', name: th.name, lvl: L, xp: th.xp, hp: th.hp, out: {}, thieve: th, icon: '__' + th.id });
  // Agility
  const co = { id: T.id + '_course', name: nm[2], lvl: L, xp: Math.round(4500 * f), hp: 50 + 2 * i, mark: 0.5 };
  if (typeof COURSES !== 'undefined') COURSES.push(co);
  A7({ id: 'ag_' + co.id, st: 'course', name: co.name, lvl: L, xp: co.xp, hp: co.hp, out: {}, course: co, icon: '__ag' });
  // Construction
  if (STATIONS.workbench) {
    item(T.id + '_statue', T.name + ' statue', Math.round(T.bv * 3), { cat: 'craft', kind: 'statue', tint: T.tint });
    A7({ id: 'b_' + T.id + '_statue', st: 'workbench', name: T.name + ' statue', lvl: L, xp: Math.round(2800 * f), hp: 12 + i, inp: { elder_plank: 10 * (i + 1), [T.id + '_bar']: 2 }, out: { [T.id + '_statue']: 1 }, icon: T.id + '_statue' });
  }
  // Sailing: a voyage for every tier from 200 up
  if (L >= 200 && typeof VOY === 'object') {
    const id = 'sl_' + T.id;
    A7({ id, st: 'harbour', name: `Voyage to the ${T.name.toLowerCase()} isles`, lvl: L, xp: Math.round(2000 * f), hp: 60, out: { [T.id + '_ore']: 1 }, icon: T.id + '_ore' });
    VOY[id] = [120 + 15 * i, Object.fromEntries([['elder_plank', 20 + 5 * i], [T.id + '_fish', 20]].filter(([x]) => ITEMS[x])), 25];
  }
  [T.id + '_pelt', T.id + '_statue'].forEach(id => { if (ITEMS[id]) (SOURCES[id] ||= []).push(id.endsWith('pelt') ? `Hunter ${L}: ${nm[0]}` : `Construction ${L}: workbench`); });
});
// Glyphcraft: four more spells to level 500
[[280, 'Rift Lance', 100, 'riftlance', { pure_essence: 12, divine_logs: 1 }, 5, '#8ad8ff'], [350, 'Starcall', 135, 'starcall', { pure_essence: 14, godforged_logs: 1 }, 5, '#ffe08a'],
 [420, 'Void Storm', 180, 'voidstorm', { pure_essence: 16, starmetal_logs: 1 }, 5, '#7a4aff'], [500, 'Genesis', 240, 'genesis', { pure_essence: 18, primordial_logs: 1 }, 5, '#ffffff']]
  .forEach(([lvl, name, max, key, inp, out, tint]) => {
    if (SCROLLS.some(s => s[3] === key)) return;
    SCROLLS.push([lvl, name, max, key, inp, out, tint]); SPELLS.push([lvl, name, max]);
    const id = 'scroll_' + key;
    item(id, `Scroll of ${name}`, Math.round(lvl * lvl / 20), { cat: 'ammo', kind: 'scroll', tint, scroll: name, spellLvl: lvl });
    if (Object.keys(inp).every(k => ITEMS[k])) A7({ id: 'gl_' + key, st: 'runealtar', name: `Scroll of ${name} ×${out}`, lvl, xp: 6 + lvl * 1.6, hp: 2 + Math.floor(lvl / 25), inp, out: { [id]: out }, icon: id });
    (SOURCES[id] ||= []).push(`Glyphcraft ${lvl}`);
  });

/* ================= METAL SET BONUSES ================= */
// wear a full set (helm, body, legs, shield) of one metal for a bonus that grows with the metal's tier
const SET_SLOTS = ['head', 'body', 'legs', 'shield'];
function wornSet() {
  const ids = SET_SLOTS.map(s => S.equip[s]); if (ids.some(x => !x)) return null;
  const m = METALS.find(me => ids.every(id => id.startsWith(me.id + '_'))); return m || null;
}
recalc4 = (orig => function () {
  orig(); if (!S?.asc) return;
  const m = wornSet(); M.setBonus = null; if (!m) return;
  const k = 1 + 0.04 * (m.tier || 1);
  M.dmg *= k; M.capeDef = (M.capeDef || 1) * k; M.cxp *= 1 + 0.02 * (m.tier || 1); M.setBonus = { name: m.name, k };
})(recalc4);
viewCombat = (orig => function () {
  const h = orig(), sb = M.setBonus;
  if ((UI.ctab || 'setup') !== 'setup') return h;
  const note = sb ? `<div class="panel small set-note">🛡️ <b>${sb.name} set</b>: +${Math.round((sb.k - 1) * 100)}% damage & defence, +${Math.round((sb.k - 1) * 50)}% combat XP</div>` : `<div class="panel small muted set-note">🛡️ Wear a full metal set (helm, body, legs, shield) for a set bonus</div>`;
  return h.replace('<h3>Combat style</h3>', '<h3>Combat style</h3>' + note);
})(viewCombat);
VIEWS.combat = (orig => function () { return rebrand(orig()); })(viewCombat);

/* ================= POWER BREAKDOWN (stats page) ================= */
viewStats2 = (orig => function () {
  const rows = [
    ['🔆 Sigils', `×${fmt(sigilPow('prod'))} production · ×${fmt(sigilPow('xp'))} XP`],
    ['✴️ Transcendence', `×${fmt(Math.pow(TPOW.prod, tcount()))} production (${tcount()} × ${TPOW.prod})`],
    ['☀️ Apotheosis', `×${fmt(Math.pow(APOW.prod, apoCount()) * Math.pow(2, apoPerk('omni')))}`],
    ['👷 Worker efficiency', `${Math.round(workerEff() * 100)}% · cap ${workerCap()} per station`],
    ['⛩️ Shrines', `${SHRINES.filter(s => shrineLvl(s.id)).length}/${SHRINES.length} built`],
    ['🧑‍🌾 Farmhands', `${fhN()} (+${fhN() * 20}% crops)`],
    ['🛡️ Set bonus', M.setBonus ? `${M.setBonus.name} +${Math.round((M.setBonus.k - 1) * 100)}%` : 'none'],
    ['📈 Level caps', `${MAX_LVL.attack} combat / ${MAX_LVL.mining} skilling`],
  ];
  return orig() + `<div class="panel small"><h3>⚡ Where your power comes from</h3><div class="stats">${rows.map(([a, b]) => `<div>${a}</div><b>${b}</b>`).join('')}</div></div>`;
})(viewStats2);
VIEWS.stats = (orig => function () { return rebrand(orig()); })(viewStats2);


/* ================= AUTOMATION SETTINGS ================= */
// auto-ascend can wait for a run worth at least ×N the last one's sigils
const AUTO_MIN = [0, 1.5, 2, 3];
automationTick = (orig => function () {
  const au = S.auto ||= {}, m = AUTO_MIN[au.minIdx || 0], last = S.engine?.lastGain || 0;
  const hold = m && last && au.asc !== false && sigilGain() < last * m;
  if (hold) { au.asc = false; try { orig(); } finally { delete au.asc; } } else orig();
})(automationTick);
viewAscension = (orig => function () {
  const h = orig(); if (!S.trans?.perks?.autoasc) return h;
  const i = S.auto?.minIdx || 0;
  return h.replace('<div class="ctabs asc-tabs">', `<div class="panel small row-between"><small>🔁 Auto-ascend waits for: <b>${i ? `×${AUTO_MIN[i]} the last run's sigils` : 'any gain'}</b></small><button class="btn" data-act="auto-min">Change</button></div><div class="ctabs asc-tabs">`);
})(viewAscension);
VIEWS.ascension = (orig => function () { return rebrand(orig()); })(viewAscension);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="auto-min"]'); if (!t) return;
  e.stopImmediatePropagation(); const au = S.auto ||= {}; au.minIdx = ((au.minIdx || 0) + 1) % AUTO_MIN.length;
  UI.force = true; render(); liveUpdate();
}, true);

/* ---------- boot ---------- */
(function () {
  for (const it of Object.values(ITEMS)) it.name = rebrand(it.name);
  Object.keys(ITEMS).forEach(id => { if (!(id in ITEM_ORDER)) ITEM_ORDER[id] = Object.keys(ITEM_ORDER).length; });
  for (const id of Object.keys(ITEMS)) { const it = ITEMS[id]; if (!it.hidden && !it.untradeable && it.value >= 1 && !GE_SET.has(id)) { GE_ITEMS.push(id); GE_SET.add(id); } }
  ach('set_1', 'Matching outfit', 'Wear a full metal set', '🛡️', () => !!M.setBonus, 10);
})();
function boot25() { boot24(); recalc(); UI.force = true; render(); }
