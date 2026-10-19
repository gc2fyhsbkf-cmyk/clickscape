'use strict';
/* =========================================================
   CLICKSCAPE v7.0 (part 1) — limitless levels & ascended tiers,
   Sailing, Rift depths, Omens, prestige skills, relic upgrades,
   item upgrades, gear upkeep
   ========================================================= */

/* ================= LEVEL CAPS THAT KEEP CLIMBING ================= */
// Extend the classic XP curve (each +7 levels ≈ double XP) up to level 300.
{ let pts = 0; for (let l = 1; l < 300; l++) { pts += Math.floor(l + 300 * Math.pow(2, l / 7)); if (l + 1 >= XP_TABLE.length) XP_TABLE[l + 1] = Math.floor(pts / 4); } }
const LEVEL_HARD_CAP = 299;
function capBonus() {
  const a = S?.asc?.count || 0, t = S?.trans?.count || 0, p = S?.trans?.perks?.caps || 0;
  return Math.min(LEVEL_HARD_CAP - 120, 3 * a + 12 * t + 5 * p);
}
applyCaps();
const capText = () => `${99 + capBonus()} / ${120 + capBonus()}`;

/* ================= ASCENDED ITEM TIERS ================= */
const ATIERS = [
  { id: 'ascended', name: 'Ascended', tint: '#e8d8a0', trim: '#fff6c8', lvl: 140, tier: 11, f: 18, mult: 22, bv: 120000, fxp: 220, extra: { rift_essence: 1 } },
  { id: 'exalted', name: 'Exalted', tint: '#3ae8c8', trim: '#c8fff4', lvl: 160, tier: 12, f: 23, mult: 30, bv: 350000, fxp: 300, extra: { rift_essence: 2 } },
  { id: 'divine', name: 'Divine', tint: '#ffd84a', trim: '#ffffff', lvl: 185, tier: 13, f: 29, mult: 42, bv: 1000000, fxp: 420, extra: { celestial_core: 1 } },
  { id: 'eternal', name: 'Eternal', tint: '#c84aff', trim: '#f0c8ff', lvl: 215, tier: 14, f: 36, mult: 60, bv: 3000000, fxp: 600, extra: { echo_shard: 1 } },
  { id: 'godforged', name: 'Godforged', tint: '#ff6a2a', trim: '#ffe0a0', lvl: 250, tier: 15, f: 45, mult: 85, bv: 9000000, fxp: 850, extra: { leviathan_scale: 1 } },
];
it7('leviathan_scale', 'Leviathan scale', 2000000, 'shard', '#2a8ad8', { cat: 'drop', rare: true });
ATIERS.forEach((T, i) => {
  TOOL_MULT[T.tier] = T.mult;
  item(T.id + '_ore', T.name + ' ore', Math.round(T.bv / 6), { cat: 'ore', kind: 'ore', tint: T.tint });
  item(T.id + '_bar', T.name + ' bar', Math.round(T.bv / 2), { cat: 'bar', kind: 'bar', tint: T.tint });
  A7({ id: 'm_' + T.id + '_ore', st: 'mine', name: T.name + ' rock', lvl: T.lvl, xp: 300 + i * 160, hp: effort(300 + i * 160, 12 + i), out: { [T.id + '_ore']: 1 }, icon: T.id + '_ore' });
  A7({ id: 's_' + T.id, st: 'furnace', name: T.name + ' bar', lvl: T.lvl, xp: 140 + i * 70, hp: 8 + i, inp: { [T.id + '_ore']: 1, ...Object.fromEntries(Object.entries(T.extra).filter(([k]) => ITEMS[k])) }, out: { [T.id + '_bar']: 1 }, icon: T.id + '_bar' });
  const eq = T.lvl - 20;
  SMITH_ITEMS.forEach(si => {
    const id = T.id + '_' + si.k;
    item(id, T.name + ' ' + si.name, Math.round(si.bars * T.bv * 1.5), { cat: si.tool ? 'tool' : 'gear', kind: si.k, tint: T.tint, trim: T.trim, slot: si.slot, tier: T.tier, rare: true, spd: si.k === 'dagger' ? 0.85 : undefined,
      mult: si.tool ? T.mult : undefined, atk: Math.round((si.atk || 0) * T.f), str: Math.round((si.str || 0) * T.f), def: Math.round((si.def || 0) * T.f), req: si.tool ? { [si.tool]: T.lvl - 15 } : gearReq(si, eq) });
    A7({ id: 'a_' + id, st: 'anvil', metal: T.id, name: T.name + ' ' + si.name, lvl: T.lvl + si.off, xp: si.bars * T.fxp, hp: si.bars * 3 + 12 + i * 2, inp: { [T.id + '_bar']: si.bars }, out: { [id]: 1 }, icon: id });
  });
  [['harpoon', 'rod', 'fishing'], ['mattock', 'mattock', 'archaeology']].forEach(([k, slot, sk]) => {
    const id = T.id + '_' + k;
    item(id, T.name + ' ' + k, Math.round(2 * T.bv * 1.5), { cat: 'tool', kind: k, tint: T.tint, trim: T.trim, slot, tier: T.tier, mult: T.mult, req: { [sk]: T.lvl - 15 }, rare: true });
    A7({ id: 'a_' + id, st: 'anvil', metal: T.id, name: T.name + ' ' + k, lvl: T.lvl + 8, xp: 2 * T.fxp, hp: 14 + i * 2, inp: { [T.id + '_bar']: 2 }, out: { [id]: 1 }, icon: id });
  });
  // a tree, a fish and a herb per tier so every gathering skill climbs with the caps
  item(T.id + '_logs', T.name + ' logs', Math.round(T.bv / 8), { cat: 'log', kind: 'log', tint: T.tint });
  A7({ id: 'w_' + T.id + '_logs', st: 'forest', name: T.name + ' tree', lvl: T.lvl, xp: 600 + i * 300, hp: effort(600 + i * 300, 11 + i), out: { [T.id + '_logs']: 1 }, icon: T.id + '_logs' });
  A7({ id: 'f_' + T.id + '_logs', st: 'fire', name: 'Burn ' + T.name.toLowerCase() + ' logs', lvl: T.lvl, xp: 800 + i * 400, hp: 8 + i, inp: { [T.id + '_logs']: 1 }, out: { ashes: 4 }, icon: T.id + '_logs' });
  A7({ id: 'sw_' + T.id + '_plank', st: 'sawmill', name: T.name + ' plank', lvl: T.lvl, xp: 40 + i * 20, hp: 6 + i, inp: { [T.id + '_logs']: 1 }, out: { elder_plank: 2 }, icon: 'elder_plank' });
  item('raw_' + T.id + '_fish', 'Raw ' + T.name.toLowerCase() + ' eel', Math.round(T.bv / 10), { cat: 'fish', kind: 'fish', tint: T.tint });
  item(T.id + '_fish', T.name + ' eel', Math.round(T.bv / 6), { cat: 'food', kind: 'cookedfish', tint: T.tint, heal: 60 + i * 25 });
  A7({ id: 'fi_' + T.id, st: 'fish', name: T.name + ' eel spot', lvl: T.lvl, xp: 520 + i * 260, hp: effort(520 + i * 260, 11 + i), out: { ['raw_' + T.id + '_fish']: 1 }, icon: 'raw_' + T.id + '_fish' });
  A7({ id: 'c_' + T.id, st: 'range', name: 'Cook ' + T.name.toLowerCase() + ' eel', lvl: T.lvl, xp: 600 + i * 300, hp: 8 + i, inp: { ['raw_' + T.id + '_fish']: 1 }, out: { [T.id + '_fish']: 1 }, icon: T.id + '_fish' });
  FOODS.push(T.id + '_fish');
});
FOODS.sort((a, b) => ITEMS[b].heal - ITEMS[a].heal);
METALS.push(...ATIERS.map(T => ({ id: T.id, name: T.name, tint: T.tint, lvl: T.lvl, tier: T.tier, eq: T.lvl - 20, bv: T.bv, fxp: T.fxp })));

/* ================= SAILING ================= */
addSkill('sailing', 'Sailing', '⛵', '#2a6ab8');
addStation('harbour', { skill: 'sailing', name: 'Harbour', verb: 'Sail', worker: 'Deckhand', wicon: '🧑‍✈️', wbase: 60, upg: "Navigator's" }, 'hunt');
STATION_ORDER.splice(STATION_ORDER.indexOf('harbour'), 1); STATION_ORDER.splice(STATION_ORDER.indexOf('hunt') + 1, 0, 'harbour');
SKILL_ORDER.splice(SKILL_ORDER.indexOf('sailing'), 1); SKILL_ORDER.splice(SKILL_ORDER.indexOf('hunter') + 1, 0, 'sailing');
[['trade_goods', 'Trade goods', 180, 'crate', '#a87a4a'], ['pirate_doubloon', 'Pirate doubloon', 1500, 'emblem', '#ffd84a'], ['sea_salvage', 'Sea salvage', 1, 'crate', '#3a6a8a'], ['dragon_metal_shard', 'Dragon metal shard', 60000, 'shard', '#c83a2a'], ['abyssal_pearl', 'Abyssal pearl', 250000, 'orb', '#3a3a8a'], ['star_coral', 'Star coral', 900000, 'material', '#ff8ac8']]
  .forEach(([id, n, v, k, t]) => it7(id, n, v, k, t, { cat: id === 'sea_salvage' ? 'misc' : 'drop', open: id === 'sea_salvage' }));
[['sl_trade', 'Coastal trade run', 1, 30, 6, { trade_goods: 1 }], ['sl_trawler', 'Fishing trawler', 15, 55, 8, { raw_swordfish: 2 }], ['sl_pirates', 'Hunt pirates', 35, 110, 11, { pirate_doubloon: 1 }],
  ['sl_salvage', 'Deep sea salvage', 55, 180, 14, { sea_salvage: 1 }], ['sl_dragon', 'Voyage to Dragon Isle', 75, 300, 20, { dragon_metal_shard: 1 }], ['sl_trench', 'Abyssal trench dive', 100, 520, 28, { abyssal_pearl: 1 }],
  ['sl_star', 'Celestial sea', 130, 900, 36, { star_coral: 1 }], ['sl_leviathan', 'Hunt the Leviathan', 170, 1600, 48, { leviathan_scale: 1 }]]
  .forEach(([id, name, lvl, xp, hp, out]) => A7({ id, st: 'harbour', name, lvl, xp, hp, out, icon: Object.keys(out)[0] }));
PETS.seagull = { name: 'Gull', icon: '🕊️', st: 'harbour', chance: 1 / 4000, desc: '+10% Sailing speed' };
const SHIP = [['hull', '🛶 Hull', 'Sailing speed +20% per level', { teak_plank: 50, mahogany_plank: 20 }], ['sails', '⛵ Sails', 'Voyages bring back +15% cargo per level', { silk: 40, bowstring: 20 }], ['cannon', '💣 Cannons', 'Rare cargo +25% per level', { steel_bar: 40, rune_bar: 5 }]];
const shipLvl = k => S.ship?.[k] || 0;
const shipCost = (k, l) => ({ coins: Math.round(2e5 * Math.pow(5, l)), items: Object.fromEntries(Object.entries(SHIP.find(s => s[0] === k)[3]).map(([i, q]) => [i, Math.round(q * Math.pow(2, l))])) });
CRATES.sea_salvage = { loot: [['coins', 2000, 15000], ['rune_bar', 1, 3], ['cut_diamond', 1, 3], ['dragon_metal_shard', 1, 2], ['clue_hard', 1, 1], ['abyssal_pearl', 0, 0]] };
doYield = (orig => function (st, a, n, xpScale) {
  const d = orig(st, a, n, xpScale);
  if (st === 'harbour' && d > 0) {
    const extra = rollCount(d, 0.15 * shipLvl('sails')); if (extra) for (const id in a.out) add(id, a.out[id] * extra);
    if (rollCount(d, (1 / 400) * M.luck * (1 + 0.25 * shipLvl('cannon')))) { const r = pickWeighted([['clue_elite', 4], ['abyssal_pearl', 2], ['leviathan_scale', LV.sailing >= 120 ? 1 : 0], ['mystery_box', 6]]); add(r, 1); if (!OFF) toast(`⛵ Rare cargo: <b>${ITEMS[r].name}</b>!`, 'rare'); }
  }
  return d;
})(doYield);
recalc4 = (orig => function () { orig(); if (!S.asc || !M.rate.harbour) return; const f = 1 + 0.2 * shipLvl('hull'); M.rate.harbour *= f; M.tap.harbour *= f; })(recalc4);
function shipPanel() {
  return `<div class="panel"><h3>🚢 Your ship</h3>${SHIP.map(([k, n, d]) => { const l = shipLvl(k), c = shipCost(k, l), ok = S.coins >= c.coins && Object.entries(c.items).every(([i, q]) => have(i) >= q);
    return `<div class="upg"><div class="upg-icon">${n.split(' ')[0]}</div><div class="upg-main"><b>${n} ${l}/10</b><small>${d} (now +${l * (k === 'hull' ? 20 : k === 'sails' ? 15 : 25)}%)</small>
      ${l < 10 ? `<small>🪙${fmt(c.coins)} · ${Object.entries(c.items).map(([i, q]) => `<span class="${have(i) >= q ? '' : 'cb-red'}">${fmt(q)} ${ITEMS[i].name.toLowerCase()}</span>`).join(' · ')}</small>` : ''}</div>
      ${l < 10 ? `<button class="btn ${ok ? '' : 'poor'}" data-act="ship-up" data-id="${k}">Upgrade</button>` : '<span class="y">MAX</span>'}</div>`; }).join('')}
    <p class="muted small">The ship is kept through ascension. Voyages also carry exotic materials for Godforged smithing (Leviathan scales) and ship upgrades.</p></div>`;
}
viewSkill = (orig => function () { const h = orig(); return UI.skill === 'sailing' ? h.replace('<div class="list">', shipPanel() + '<div class="list">') : h; })(viewSkill);
VIEWS.skill = viewSkill;

/* ================= RIFT DEPTHS (endless) ================= */
MON({ id: 'rift_depths', name: 'Depth guardian', icon: '🕳️', hue: 260, lvl: 100, hp: 200, atk: 100, def: 100, mh: 15, spd: 3, area: 'rift', ascReq: 1, depth: true, drops: [] });
const DEPTH_NAMES = ['Void wraith', 'Abyssal horror', 'Star devourer', 'Rift titan', 'Null knight', 'Echo warden', 'Chaos serpent', 'Entropy lord'];
function depthFloor() { return S.depth?.floor || 1; }
function setDepthStats() {
  const f = depthFloor(), m = MONSTER_BY_ID.rift_depths, k = Math.pow(1.06, f - 1);
  Object.assign(m, { name: `${DEPTH_NAMES[(f - 1) % DEPTH_NAMES.length]} (floor ${f})`, lvl: Math.round(100 + f * 12), hp: Math.round(200 * k), atk: Math.round(110 * Math.pow(1.045, f - 1)), def: Math.round(90 * Math.pow(1.045, f - 1)), mh: Math.round(15 * Math.pow(1.035, f - 1)), boss: f % 10 === 0, hue: (f * 37) % 360 });
}
killMonster = (orig => function (m) {
  orig(m);
  if (!m.depth) return;
  const D = S.depth ||= { floor: 1 }, f = D.floor;
  add('rift_essence', 1 + Math.floor(f / 5)); if (f % 10 === 0) { add('echo_shard', Math.floor(f / 10)); add('mystery_box', 1); }
  D.floor++; const L = S.lifetime; L.depthBest = Math.max(L.depthBest || 0, f);
  if (!OFF && f % 10 === 0) toast(`🕳️ Rift depth ${f} cleared! Best: ${L.depthBest}. Permanent bonus: +${Math.floor(L.depthBest / 10)}% damage & XP.`, 'pet', 5000);
  setDepthStats(); recalc();
})(killMonster);
die = (orig => function () { const m = curMon(); orig(); if (m?.depth && S.depth) { S.depth.floor = Math.max(1, S.depth.floor - ((S.depth.floor - 1) % 10)); setDepthStats(); if (!OFF) toast(`🕳️ You were pushed back to floor ${S.depth.floor} (checkpoint).`, 'warn'); } })(die);
recalc4 = (orig => function () { orig(); if (!S.asc) return; const b = Math.floor((S.lifetime.depthBest || 0) / 10) * 0.01; M.dmg *= 1 + b; M.xp *= 1 + b; })(recalc4);

/* ================= OMENS (one random world event per run) ================= */
const OMENS = [
  { id: 'seas', icon: '🌊', name: 'Bountiful Seas', desc: 'Fishing & Sailing ×3, Mining ×0.5', st: { fish: 3, harbour: 3, mine: 0.5 } },
  { id: 'forge', icon: '🔥', name: 'Forge Fever', desc: 'Furnace & Anvil ×3, Woodcutting ×0.5', st: { furnace: 3, anvil: 3, forest: 0.5 } },
  { id: 'harvest', icon: '🌾', name: 'Harvest Moon', desc: 'Crops grow 2× faster, Herblore ×2, Thieving ×0.5', grow: 0.5, st: { herb: 2, thieve: 0.5 } },
  { id: 'blood', icon: '🩸', name: 'Blood Moon', desc: 'Monsters hit 30% harder, rare drops ×2', luck: 2, hurt: 1.3 },
  { id: 'gold', icon: '🪙', name: 'Gold Rush', desc: 'All coins ×2, all XP ×0.8', coins: 2, xp: 0.8 },
  { id: 'wisdom', icon: '📚', name: 'Age of Wisdom', desc: 'All XP ×1.5, sell prices ×0.7', xp: 1.5, sell: 0.7 },
  { id: 'war', icon: '⚔️', name: 'Time of War', desc: 'Damage & combat XP ×1.5, workers ×0.75', dmg: 1.5, cxp: 1.5, crew: 0.75 },
  { id: 'arcane', icon: '🌀', name: 'Arcane Surge', desc: 'Runecrafting & Magic damage ×2, Smithing ×0.6', st: { runealtar: 2, furnace: 0.6, anvil: 0.6 }, mdmg: 2 },
  { id: 'calm', icon: '🍃', name: 'Peaceful Times', desc: 'Every worker +40%, no other effects', crew: 1.4 },
];
const omen = () => OMENS.find(o => o.id === S.omen) || null;
function rollOmen() { S.omen = OMENS[randInt(0, OMENS.length - 1)].id; }
recalc4 = (orig => function () {
  orig(); const o = omen(); if (!S.asc || !o) return;
  for (const st in o.st || {}) if (M.rate[st] !== undefined) { M.rate[st] *= o.st[st]; M.tap[st] *= o.st[st]; }
  if (o.crew) for (const st of STATION_ORDER) M.rate[st] *= o.crew;
  if (o.grow) M.grow *= o.grow; if (o.luck) M.luck *= o.luck; if (o.xp) M.xp *= o.xp; if (o.sell) M.sell *= o.sell; if (o.dmg) M.dmg *= o.dmg; if (o.cxp) M.cxp *= o.cxp;
  if (o.mdmg && wclass() === 'magic') M.dmg *= o.mdmg;
})(recalc4);
gainCoins = (orig => function (n) { return orig(omen()?.coins ? n * omen().coins : n); })(gainCoins);
reduction = (orig => function () { const r = orig(); return omen()?.hurt ? 1 - (1 - r) * omen().hurt : r; })(reduction);

/* ================= PRESTIGE SKILLS ================= */
const prest = sk => S.lifetime.prest?.[sk] || 0;
function prestige(sk) {
  if (LV[sk] < MAX_LVL[sk]) return toast(`Reach the level cap (${MAX_LVL[sk]}) in ${SKILLS[sk].name} first.`, 'warn');
  if (prest(sk) >= 5) return toast('That skill already has 5 prestige stars.', 'warn');
  (S.lifetime.prest ||= {})[sk] = prest(sk) + 1; S.xp[sk] = sk === 'hitpoints' ? XP_TABLE[10] : 0; refreshLevels(); recalc();
  toast(`⭐ ${SKILLS[sk].name} prestiged! ${'⭐'.repeat(prest(sk))} · +${prest(sk) * 5}% XP & speed forever.`, 'pet', 6000); SFX.play('pet'); burst();
}
skillXpMult = (orig => function (sk) { return orig(sk) * (1 + 0.05 * prest(sk)); })(skillXpMult);
recalc4 = (orig => function () { orig(); if (!S.asc) return; for (const st of STATION_ORDER) { const p = 1 + 0.05 * prest(STATIONS[st].skill); M.rate[st] *= p; M.tap[st] *= p; } })(recalc4);
skillHead = (orig => function (sk) {
  const h = orig(sk), p = prest(sk), at = LV[sk] >= MAX_LVL[sk];
  return h + `<div class="prestige-row">${p ? `<span class="y">${'⭐'.repeat(p)}</span> <small>+${p * 5}% XP & speed</small>` : '<small class="muted">Prestige at the level cap for a permanent star</small>'}${at && p < 5 ? ` <button class="btn small" data-act="prestige" data-id="${sk}">⭐ Prestige</button>` : ''}</div>`;
})(skillHead);

/* ================= RELIC UPGRADES ================= */
const relicLvl = id => Math.min(3, 1 + Math.floor((S.lifetime.relicUse?.[id] || 0) / 3));
recalc4 = (orig => function () {
  orig(); if (!S.asc || !S.relic) return;
  for (const id of Object.values(S.relic.picks || {})) {
    const k = 1 + 0.25 * (relicLvl(id) - 1); if (k === 1) continue;
    const sts = id === 'harvest' ? GATHER : id === 'prodigy' ? PROCESS : id === 'trickster' ? ['thieve', 'course'] : ['overgrowth', 'workforce', 'gloves'].includes(id) ? STATION_ORDER : [];
    for (const st of sts) if (M.rate[st] !== undefined) { M.rate[st] *= k; M.tap[st] *= k; }
    if (id === 'lucky') M.luck *= k; if (id === 'scholar') M.xp *= k; if (id === 'banker') M.sell *= k; if (id === 'weapon') M.dmg *= k; if (id === 'avatar') M.cxp *= k; if (id === 'grit') M.sxp *= k;
  }
})(recalc4);
ascend = (orig => function () {
  const old = S, n = S.asc.count, picks = Object.values(S.relic?.picks || {});
  orig();
  if (S === old || S.asc.count === n) return;
  const U = S.lifetime.relicUse ||= {}; picks.forEach(id => U[id] = (U[id] || 0) + 1);
  S.ship = old.ship; S.depth = old.depth; rollOmen(); setDepthStats(); recalc(); save();
})(ascend);
relicPanel = (orig => function () { return orig().replace(/<b>([^<]+)<\/b><small>([^<]+)<\/small><\/button>/g, (m, name, desc) => { const r = RELICS.flat().find(x => x.name === name); const l = r ? relicLvl(r.id) : 1; return `<b>${name}${l > 1 ? ' ' + ['', '', 'II', 'III'][l] : ''}</b><small>${desc}${l > 1 ? ` (+${(l - 1) * 25}%)` : ''}</small></button>`; }); })(relicPanel);

/* ================= ITEM UPGRADES ================= */
gear('corrupted_twisted_bow', 'Corrupted twisted bow', 'weapon', [0, 0, 0], { ranged: 99 }, { kind: 'longbow', tint: '#c84aff', trim: '#ffd84a', wclass: 'ranged', ratk: 90, rstr: 30, tbow: true, ammo: 'arrow', ammoCap: 7, spd: 1.0, twoHanded: true, untradeable: true, value: 1 });
['full_helm', 'platebody', 'platelegs'].forEach(k => { const b = ITEMS['torva_' + k]; if (b) gear('sanguine_torva_' + k, 'Sanguine torva ' + k.replace('_', ' '), b.slot, [b.atk || 0, Math.round((b.str || 0) * 1.3) + 4, Math.round((b.def || 0) * 1.25)], { defence: 90 }, { kind: k, tint: '#8a1a2a', trim: '#ffd84a', untradeable: true, value: 1 }); });
gear('amulet_of_torture_or', 'Amulet of torture (or)', 'neck', [17, 12, 0], null, { kind: 'amulet', tint: '#c8302a', trim: '#ffd84a', untradeable: true, value: 1 });
gear('infernal_max_cape', 'Infernal max cape', 'cape', [6, 10, 15], null, { kind: 'cape', tint: '#b8180c', trim: '#ffffff', perk: 'max', untradeable: true, value: 1 });
RECIPES.push({ out: 'corrupted_twisted_bow', inp: { twisted_bow: 1, echo_shard: 200 } },
  ...['full_helm', 'platebody', 'platelegs'].filter(k => ITEMS['sanguine_torva_' + k]).map(k => ({ out: 'sanguine_torva_' + k, inp: { ['torva_' + k]: 1, echo_shard: 60 } })),
  { out: 'amulet_of_torture_or', inp: { amulet_of_torture: 1, pirate_doubloon: 500 } },
  { out: 'infernal_max_cape', inp: { max_cape: 1, infernal_cape: 1 } });
if (ITEMS.twisted_bow) ITEMS.corrupted_twisted_bow.req = ITEMS.twisted_bow.req;

/* ================= GEAR UPKEEP ================= */
const UPKEEP = id => { const it = ITEMS[id]; if (!it) return 0; if (it.set && ['ahrim', 'dharok', 'guthan', 'karil', 'torag', 'verac'].includes(it.set)) return 1; if (it.crystal || ['bow_of_faerdhinen', 'blade_of_saeldor', 'toxic_blowpipe', 'trident_of_the_seas', 'trident_of_the_swamp', 'sanguinesti_staff', 'scythe_of_vitur', 'tumekens_shadow'].includes(id)) return 1; return 0; };
const MAX_CHG = 5000;
const charges = id => S.charges?.[id] ?? MAX_CHG;
const degradedGear = () => GEAR_SLOTS.filter(s => S.equip[s] && UPKEEP(S.equip[s]) && charges(S.equip[s]) <= 0);
const repairCost = id => Math.max(1000, Math.round((ITEMS[id]?.value || 1e6) * 0.02 * (MAX_CHG - Math.max(0, charges(id))) / MAX_CHG));
killMonster = (orig => function (m) {
  orig(m); const C = S.charges ||= {};
  for (const s of GEAR_SLOTS) { const id = S.equip[s]; if (id && UPKEEP(id)) { const before = charges(id); C[id] = Math.max(0, before - 1); if (before > 0 && C[id] === 0) { recalc(); if (!OFF) toast(`🔧 Your ${ITEMS[id].name} has degraded! Repair it from its item window (Bank).`, 'warn', 6000); } } }
})(killMonster);
recalc4 = (orig => function () { orig(); if (!S.asc) return; const n = degradedGear().length; if (n) { M.dmg *= Math.pow(0.85, n); M.capeAcc *= Math.pow(0.9, n); } })(recalc4);
openItemModal = (orig => function (id, fromSlot) {
  orig(id, fromSlot); if (!UPKEEP(id)) return;
  const c = charges(id), box = $('#modal .item-modal') || $('#modal');
  box?.insertAdjacentHTML('beforeend', `<div class="panel small">🔧 Charges: <b class="${c > 0 ? 'y' : 'cb-red'}">${fmt(Math.max(0, c))}/${fmt(MAX_CHG)}</b> kills${c <= 0 ? ' · <b class="cb-red">DEGRADED (−15% damage)</b>' : ''}
    ${c < MAX_CHG ? `<button class="btn small" data-act="repair" data-id="${id}">Repair · 🪙${fmt(repairCost(id))}</button>` : ''}</div>`);
})(openItemModal);

/* ---------- logs, sources, indexes ---------- */
(function () {
  CLOG.push({ id: 'sailing', name: 'Sailing', icon: '⛵', cat: 'Skilling', items: ['pirate_doubloon', 'dragon_metal_shard', 'abyssal_pearl', 'star_coral', 'leviathan_scale', 'pet:seagull'] });
  CLOG.push({ id: 'upgrades', name: 'Item upgrades', icon: '✨', cat: 'Other', items: ['corrupted_twisted_bow', 'sanguine_torva_platebody', 'amulet_of_torture_or', 'infernal_max_cape'].filter(i => ITEMS[i]) });
  CLOG.flatMap(p => p.items).forEach(i => CLOG_ITEMS.add(i));
  const addS = (id, s) => (SOURCES[id] ||= []).push(s);
  addS('leviathan_scale', 'Sailing: Hunt the Leviathan (170) · rare cargo'); addS('pirate_doubloon', 'Sailing: Hunt pirates');
  ATIERS.forEach(T => { addS(T.id + '_ore', `Mining ${T.lvl} (needs raised level caps)`); addS(T.id + '_bar', `Furnace: ${T.name} ore + ${Object.keys(T.extra).map(k => ITEMS[k]?.name).join(' + ')}`); });
  ach('sail_50', 'Seafarer', 'Reach Sailing 50', '⛵', g => g.LV.sailing >= 50, 10);
  ach('depth_50', 'Into the Abyss', 'Reach Rift depth 50', '🕳️', g => (g.S.lifetime.depthBest || 0) >= 50, 30);
  ach('prestige_1', 'Again!', 'Prestige a skill', '⭐', g => Object.keys(g.S.lifetime.prest || {}).length >= 1, 20);
  ach('ascended_tier', 'Beyond Mortal Metal', 'Smith an Ascended item', '✨', g => ATIERS.some(T => have(T.id + '_platebody') || Object.values(g.S.equip).some(e => e && e.startsWith(T.id + '_'))), 25);
})();
for (const m of MONSTERS) MONSTER_BY_ID[m.id] = m;
Object.keys(ITEMS).forEach(id => { if (!(id in ITEM_ORDER)) ITEM_ORDER[id] = Object.keys(ITEM_ORDER).length; });
for (const id of Object.keys(ITEMS)) { const it = ITEMS[id]; if (!it.hidden && !it.untradeable && !it.open && it.value >= 1 && !GE_SET.has(id)) { GE_ITEMS.push(id); GE_SET.add(id); } }
Object.assign(UPGRADE_BY_ID, Object.fromEntries(UPGRADES.map(u => [u.id, u])));

/* ---------- input ---------- */
document.addEventListener('click', e => {
  if (e.target.closest('[data-nav]')) return;
  const t = e.target.closest('[data-act]'); if (!t) return;
  const d = t.dataset; let h = true;
  switch (d.act) {
    case 'ship-up': { const k = d.id, l = shipLvl(k); if (l >= 10) break; const c = shipCost(k, l); if (S.coins < c.coins || !Object.entries(c.items).every(([i, q]) => have(i) >= q)) { toast('You don’t have everything for that upgrade.', 'warn'); break; } S.coins -= c.coins; Object.entries(c.items).forEach(([i, q]) => remove(i, q)); (S.ship ||= {})[k] = l + 1; recalc(); toast(`🚢 ${SHIP.find(s => s[0] === k)[1]} upgraded to ${l + 1}!`, 'rare'); break; }
    case 'prestige': openModal(`<h2>⭐ Prestige ${SKILLS[d.id].name}?</h2><p>${SKILLS[d.id].name} goes back to level 1, and you gain a permanent star: +5% XP and speed in it, forever (even through Transcendence).</p><button class="btn big danger" data-act="prestige-yes" data-id="${d.id}">Prestige</button><button class="btn" data-act="close">Not yet</button>`); e.stopImmediatePropagation(); return;
    case 'prestige-yes': closeModal(); prestige(d.id); break;
    case 'repair': { const c = repairCost(d.id); if (S.coins < c) { toast(`You need 🪙${fmt(c)}.`, 'warn'); break; } S.coins -= c; (S.charges ||= {})[d.id] = MAX_CHG; recalc(); toast(`🔧 ${ITEMS[d.id].name} repaired.`, 'rare'); closeModal(); openItemModal(d.id); break; }
    default: h = false;
  }
  if (h) { e.stopImmediatePropagation(); UI.force = true; render(); liveUpdate(); }
}, true);
