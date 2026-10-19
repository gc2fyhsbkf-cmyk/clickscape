'use strict';
/* =========================================================
   CLICKSCAPE v7.5 — relic tiers scale, bestiary, followers,
   new essence perks, rebrand pass 2
   ========================================================= */

/* ---------- Relic tiers scale with your ascensions ---------- */
const RELIC_BASE = [0, 400, 900, 1500];
function relicNeed(i) { const a = S?.asc?.count || 0, f = (1 + 0.08 * Math.min(a, 12)) * (1 - 0.1 * (S?.asc?.perks?.swift || 0)); return Math.round(RELIC_BASE[i] * f / 10) * 10; }
// RELIC_TIERS is a const array — update its entries in place whenever we recalc
recalc4 = (orig => function () { orig(); if (!S?.asc) return; for (let i = 0; i < RELIC_TIERS.length; i++) RELIC_TIERS[i] = relicNeed(i); })(recalc4);

/* ---------- New essence perks ---------- */
ASC_PERKS.push(
  { id: 'scrolls', name: "Scholar's notes", icon: '📜', max: 5, cost: l => 5 * (l + 1) ** 2, desc: l => `Tribute materials −${l * 10}%` },
  { id: 'merchant', name: 'Merchant prince', icon: '💰', max: 5, cost: l => 4 * (l + 1) ** 2, desc: l => `+${l * 10}% coins from everything` },
  { id: 'swift', name: 'Swift relics', icon: '🔮', max: 3, cost: l => 8 * (l + 1) ** 2, desc: l => `Relic tiers unlock ${l * 10}% sooner` });
gainCoins = (orig => function (n) { return orig(n * (1 + 0.1 * (S?.asc?.perks?.merchant || 0))); })(gainCoins);
rollTribute = (orig => function () { orig(); const f = 1 - 0.1 * (S.asc.perks?.scrolls || 0); if (f < 1) S.tribute.items = S.tribute.items.map(([id, q]) => [id, Math.max(1, Math.round(q * f))]); })(rollTribute);

/* ---------- Bestiary: every monster has kill milestones ---------- */
const BEST_MS = [25, 100, 500, 2500];
const bestTier = m => BEST_MS.filter(k => (S.kills[m.id] || 0) >= k).length;
const bestEligible = () => MONSTERS.filter(m => !m.raid && !m.season && !m.depth && m.area !== 'echo');
function bestStats() { const ms = bestEligible(); let pts = 0; for (const m of ms) pts += bestTier(m); return { pts, max: ms.length * BEST_MS.length, seen: ms.filter(m => S.kills[m.id]).length, total: ms.length }; }
weaponVs = (orig => function (m) { return orig(m) * (m && !m.boss ? 1 + 0.04 * bestTier(m) : 1); })(weaponVs);
killMonster = (orig => function (m) {
  const t = !m.boss ? bestTier(m) : 0, l0 = M.luck;
  if (t) M.luck *= 1 + 0.05 * t;
  try { orig(m); } finally { M.luck = l0; }
  if (!m.boss && !m.raid && bestTier(m) > t && !OFF) toast(`📖 Bestiary: ${m.name} tier ${bestTier(m)}! +${bestTier(m) * 4}% damage & +${bestTier(m) * 5}% drops against it.`, 'rare', 5000);
})(killMonster);
recalc4 = (orig => function () { orig(); if (!S?.asc) return; const b = bestStats().pts; M.xp *= 1 + 0.002 * b; M.dmg *= 1 + 0.002 * b; })(recalc4);
function viewBestiary() {
  const st = bestStats(), areas = AREAS.filter(([a]) => bestEligible().some(m => m.area === a));
  const A = UI.bestArea || areas[0][0];
  const list = bestEligible().filter(m => m.area === A).sort((a, b) => a.lvl - b.lvl);
  return subHead('📖 Bestiary') + `<div class="panel small">Every monster has kill milestones (${BEST_MS.join(' / ')}). Each tier gives <b>+4% damage and +5% drops</b> against that monster, and every tier you earn anywhere adds <b>+0.2% XP and damage</b> globally.
      <div class="stats"><div>Bestiary tiers</div><b class="y">${st.pts} / ${st.max}</b><div>Global bonus</div><b>+${fmtD(st.pts * 0.2)}% XP & damage</b><div>Monsters discovered</div><b>${st.seen} / ${st.total}</b></div></div>
    <div class="tabs scroll">${areas.map(([a, n]) => `<button class="tab ${A === a ? 'on' : ''}" data-act="best-area" data-id="${a}">${n}</button>`).join('')}</div>
    <div class="list">${list.map(m => { const k = S.kills[m.id] || 0, t = bestTier(m), next = BEST_MS[t]; return `<div class="upg ${t === 4 ? 'got' : ''}"><div class="upg-icon"><span class="emo" style="${monFilter(m)}">${k ? m.icon : '❔'}</span></div><div class="upg-main"><b>${k ? m.name : '???'} <small class="muted">· lvl ${m.lvl}</small></b><small>${'★'.repeat(t)}${'☆'.repeat(4 - t)} · ${fmt(k)} kills${next ? ` · next at ${fmt(next)}` : ' · complete!'}</small></div>${k ? `<button class="btn small" data-act="moninfo" data-id="${m.id}">📋</button>` : ''}</div>`; }).join('')}</div>`;
}

/* ---------- Followers: one active pet that levels up ---------- */
const FOLLOW_XP = l => Math.round(500 * Math.pow(1.6, l));
function follower() { return S.follow?.id && S.pets[S.follow.id] ? S.follow : null; }
function petXpTick(dt) { const F = follower(); if (!F) return; F.xp = (F.xp || 0) + dt; while ((F.lvl || 0) < 20 && F.xp >= FOLLOW_XP(F.lvl || 0)) { F.xp -= FOLLOW_XP(F.lvl || 0); F.lvl = (F.lvl || 0) + 1; recalc(); if (!OFF) toast(`${PETS[F.id].icon} ${PETS[F.id].name} reached follower level ${F.lvl}!`, 'pet'); } }
tickCore = (orig => function (dt) { orig(dt); petXpTick(dt); })(tickCore);
recalc4 = (orig => function () {
  orig(); const F = follower(); if (!S?.asc || !F) return;
  const p = PETS[F.id], k = 1 + 0.1 + 0.02 * (F.lvl || 0); // following: base bonus again (+10%) plus 2% per level
  if (p.st === 'combat') M.dmg *= k;
  else if (p.st && M.rate[p.st] !== undefined) { M.rate[p.st] *= k; M.tap[p.st] *= k; }
  else M.xp *= 1 + 0.01 * (F.lvl || 0) + 0.05;
})(recalc4);
viewPets = (orig => function () {
  const F = follower();
  const panel = `<div class="panel"><h3>🐾 Follower</h3>${F ? `<p class="small">${PETS[F.id].icon} <b>${PETS[F.id].name}</b> is following you · level ${F.lvl || 0}/20 · +${10 + 2 * (F.lvl || 0)}% to its bonus</p><div class="hpbar pp"><i style="width:${(F.lvl || 0) >= 20 ? 100 : Math.min(100, (F.xp || 0) / FOLLOW_XP(F.lvl || 0) * 100)}%"></i><span>${(F.lvl || 0) >= 20 ? 'MAX' : fmtTime(Math.max(0, FOLLOW_XP(F.lvl || 0) - (F.xp || 0))) + ' to next level'}</span></div>` : '<p class="small">Choose a pet to follow you. Its bonus gets +10%, and it gains a level for time spent playing (up to 20, +2% each). Followers are kept forever.</p>'}
    <div class="chips">${Object.keys(S.pets).map(id => `<button class="chip ${F?.id === id ? 'on' : ''}" data-act="follow" data-id="${id}">${PETS[id]?.icon} ${PETS[id]?.name}${S.followLv?.[id] ? ` · ${S.followLv[id]}` : ''}</button>`).join('') || '<span class="muted">No pets yet.</span>'}</div></div>`;
  return orig().replace('<div class="panel"><div class="pet-grid">', panel + '<div class="panel"><div class="pet-grid">');
})(viewPets);
ascend = (orig => function () { const old = S, n = S.asc.count; orig(); if (S === old || S.asc.count === n) return; S.follow = old.follow; S.followLv = old.followLv; recalc(); save(); })(ascend);
transcend = (orig => function () { const old = S, t = S.trans?.count || 0; orig(); if ((S.trans?.count || 0) > t) { S.follow = old.follow; S.followLv = old.followLv; recalc(); save(); } })(transcend);

/* ---------- Rebrand pass 2 ---------- */
for (const it of Object.values(ITEMS)) if (/^dragon_/.test(it.id) && /^Dragon\b/.test(it.name)) it.name = it.name.replace(/^Dragon\b/, 'Wyrm');
const RB2 = [
  ['Zamorakian spear', 'Zarvokian spear'], ['Zamorakian', 'Zarvokian'], ['Ancient godsword', 'Nyxar warblade'], ['Ancient warblade', 'Nyxar warblade'], ['Ancient hilt', 'Nyxar hilt'], ['Amulet of glory', 'Amulet of renown'], ['Amulet of fury', 'Amulet of wrath'], ['Amulet of torture', 'Amulet of torment'],
  ['Necklace of anguish', 'Necklace of sorrow'], ['Tormented bracelet', 'Agonised bracelet'], ['Ring of suffering', 'Ring of endurance'], ['Occult necklace', 'Arcane pendant'], ['Berserker ring', 'Rage ring'], ['Seers ring', 'Oracle ring'], ['Archers ring', 'Marksman ring'],
  ['Ring of wealth', 'Ring of fortune'], ['Draconic visage', 'Wyrm visage'], ['Dragonfire shield', 'Wyrmfire shield'], ['Anti-dragon shield', 'Wyrmguard shield'], ['Serpentine visage', 'Serpent visage'],
  ['Aberrant Spectre', 'Rotting Spectre'], ['Bloodveld', 'Bloodtongue'], ['Cave Crawler', 'Cave creeper'], ['Pyrefiend', 'Flame imp'], ['Rockslug', 'Stone slug'], ['Spiritual Mage', 'Zealot mage'], ['Ripper Demon', 'Rending demon'], ['Jelly', 'Ooze'],
  ['Ikkle Hydra', 'Tiny Hydra'], ['Hellpuppy', 'Hellhound pup'], ['Chompy Beaver', 'Chompy'], ['Ava', 'Ava'], ['Elder Wyrm', 'Elder Wyrm'],
];
RB2.forEach(([a, b]) => { if (a !== b) RB_MAP.set(a, b); });
const RB_RE2 = new RegExp('(?<![\\w\'-])(' + RB2.filter(r => r[0] !== r[1]).map(r => r[0]).sort((a, b) => b.length - a.length).map(esc_).join('|') + ')(?![\\w])', 'g');
rebrand = (orig => function (s) { return typeof s === 'string' ? orig(s).replace(RB_RE2, m => RB_MAP.get(m) || m) : s; })(rebrand);
(function () {
  const fix = o => { if (o) for (const k of ['name', 'desc', 'txt']) if (typeof o[k] === 'string') o[k] = rebrand(o[k]); };
  Object.values(ITEMS).forEach(fix); MONSTERS.forEach(fix); Object.values(ACTIONS).forEach(fix); Object.values(PETS).forEach(fix); CLOG.forEach(fix); QUESTS.forEach(fix); ACHIEVEMENTS.forEach(fix);
  for (const k in SOURCES) SOURCES[k] = SOURCES[k].map(rebrand);
  ach('best_100', 'Monster Scholar', 'Earn 100 bestiary tiers', '📖', () => bestStats().pts >= 100, 25);
  ach('follow_20', 'Best Friends', 'Raise a follower to level 20', '🐾', g => (g.S.follow?.lvl || 0) >= 20, 25);
})();

/* ---------- views & input ---------- */
VIEWS.bestiary = viewBestiary; VIEWS.pets = viewPets; HUB_VIEWS.push('bestiary');
for (const k of ['bestiary', 'pets']) VIEWS[k] = (orig => function () { return rebrand(orig()); })(VIEWS[k]);
viewMenu = (orig => function () { const b = bestStats(); return orig().replace('<button class="hub-tile" data-act="hub" data-id="pets">', `<button class="hub-tile" data-act="hub" data-id="bestiary"><span class="ht-icon">📖</span><b>Bestiary</b><small>${b.pts}/${b.max} tiers</small></button><button class="hub-tile" data-act="hub" data-id="pets">`); })(viewMenu);
VIEWS.menu = (orig => function () { return rebrand(orig()); })(viewMenu);
viewSig = (orig => function () {
  if (UI.view === 'bestiary') return 'b' + (UI.bestArea || '') + bestStats().pts + bestStats().seen;
  if (UI.view === 'pets') return orig() + JSON.stringify(S.follow || {}).replace(/"xp":[\d.]+/, '') + Math.floor(Date.now() / 5000);
  return orig();
})(viewSig);
document.addEventListener('click', e => {
  if (e.target.closest('[data-nav]')) return;
  const t = e.target.closest('[data-act]'); if (!t) return;
  const d = t.dataset; let h = true;
  switch (d.act) {
    case 'best-area': UI.bestArea = d.id; break;
    case 'follow': { const L = S.followLv ||= {}; const F = follower(); if (F) L[F.id] = F.lvl || 0; S.follow = { id: d.id, lvl: L[d.id] || 0, xp: 0 }; recalc(); toast(`${PETS[d.id].icon} ${PETS[d.id].name} is now following you.`, 'pet'); break; }
    default: h = false;
  }
  if (h) { e.stopImmediatePropagation(); UI.force = true; render(); liveUpdate(); }
}, true);

function boot18() { boot17(); for (let i = 0; i < RELIC_TIERS.length; i++) RELIC_TIERS[i] = relicNeed(i); UI.force = true; render(); }
