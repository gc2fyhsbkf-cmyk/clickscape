'use strict';
/* =========================================================
   CLICKSCAPE v3 content — Herblore, Crafting, Fletching,
   Thieving, Agility, Ranged & Magic, Barrows, clues, logs,
   achievements, challenges, stars, events, GE
   ========================================================= */
function act3(o) { ACTIONS[o.id] = o; (STATION_ACTIONS[o.st] ||= []).push(o); }
const cap1 = s => s[0].toUpperCase() + s.slice(1);

/* ---------- Supplies & secondaries ---------- */
item('vial_of_water', 'Vial of water', 2, { cat: 'herb', kind: 'potion', tint: '#8ac8f0' });
item('eye_of_newt', 'Eye of newt', 3, { cat: 'herb', emoji: '👁️' });
item('limpwurt_root', 'Limpwurt root', 30, { cat: 'herb', kind: 'herb', tint: '#c8a040' });
item('dragon_scale_dust', 'Dragon scale dust', 60, { cat: 'herb', kind: 'ashes', tint: '#4a7ac8' });
item('wine_of_zamorak', 'Wine of Zamorak', 400, { cat: 'herb', emoji: '🍷' });
item('crushed_nest', 'Crushed nest', 120, { cat: 'herb', kind: 'ashes', tint: '#a07a4a' });
item('silk', 'Silk', 30, { cat: 'craft', emoji: '🧵' });
item('flax', 'Flax', 3, { cat: 'craft', emoji: '🌾' });
item('bowstring', 'Bowstring', 10, { cat: 'craft', emoji: '🪢' });
item('leather', 'Leather', 4, { cat: 'craft', kind: 'hide', tint: '#9a6a3a' });
item('blue_dragonhide', 'Blue dragonhide', 600, { cat: 'drop', kind: 'hide', tint: '#3a5ac8' });
item('red_dragonhide', 'Red dragonhide', 900, { cat: 'drop', kind: 'hide', tint: '#b8302a' });
item('black_dragonhide', 'Black dragonhide', 1400, { cat: 'drop', kind: 'hide', tint: '#2a2a2a' });
item('battlestaff', 'Battlestaff', 2500, { cat: 'craft', kind: 'staff', tint: '#7a4a22' });
item('fire_orb', 'Fire orb', 400, { cat: 'craft', kind: 'orb', tint: '#e8501a' });
item('arrow_shaft', 'Arrow shaft', 1, { cat: 'ammo', kind: 'shaft', tint: '#a0703a' });
item('cake', 'Cake', 15, { cat: 'food', emoji: '🍰', heal: 4 });
item('mark_of_grace', 'Mark of grace', 1, { cat: 'misc', emoji: '✨', untradeable: true });
item('stardust', 'Stardust', 1, { cat: 'misc', emoji: '🌠', untradeable: true });
item('xp_lamp', 'Lamp', 1, { cat: 'misc', emoji: '🪔', lamp: true, untradeable: true });
item('crystal_shard', 'Crystal shard', 3000, { cat: 'misc', kind: 'shard', tint: '#9af0ff' });

/* ---------- New crops (herbs, flowers, bushes, flax) ---------- */
const NEW_CROPS = [
  { id: 'flax_crop', out: 'flax', name: 'Flax', emoji: '🌾', lvl: 1, time: 90, pxp: 6, hxp: 7, y: [5, 10], seed: 3 },
  { id: 'tarromin', name: 'Tarromin', herb: '#6aa040', lvl: 19, time: 600, pxp: 15, hxp: 18, y: [2, 5], seed: 60, v: 45 },
  { id: 'harralander', name: 'Harralander', herb: '#8a9a3a', lvl: 26, time: 700, pxp: 22, hxp: 24, y: [2, 5], seed: 150, v: 80 },
  { id: 'limpwurt', out: 'limpwurt_root', name: 'Limpwurt', emoji: '🌼', lvl: 26, time: 480, pxp: 19, hxp: 21, y: [2, 4], seed: 60 },
  { id: 'toadflax', name: 'Toadflax', herb: '#4a8a5a', lvl: 38, time: 1200, pxp: 34, hxp: 38, y: [2, 5], seed: 800, v: 400 },
  { id: 'irit', name: 'Irit leaf', herb: '#5aa05a', lvl: 44, time: 1700, pxp: 43, hxp: 48, y: [2, 5], seed: 900, v: 450 },
  { id: 'avantoe', name: 'Avantoe', herb: '#3a9a6a', lvl: 50, time: 2000, pxp: 54, hxp: 61, y: [2, 5], seed: 1500, v: 700 },
  { id: 'kwuarm', name: 'Kwuarm', herb: '#5a7a2a', lvl: 56, time: 2300, pxp: 69, hxp: 78, y: [2, 5], seed: 2200, v: 1000 },
  { id: 'white_berry', out: 'white_berries', name: 'White berries', emoji: '🫐', lvl: 59, time: 1800, pxp: 78, hxp: 30, y: [3, 6], seed: 800 },
  { id: 'potato_cactus_crop', out: 'potato_cactus', name: 'Potato cactus', emoji: '🌵', lvl: 64, time: 2000, pxp: 68, hxp: 33, y: [3, 6], seed: 1200 },
  { id: 'cadantine', name: 'Cadantine', herb: '#2a7a3a', lvl: 67, time: 3300, pxp: 106, hxp: 120, y: [2, 5], seed: 3500, v: 1500 },
  { id: 'lantadyme', name: 'Lantadyme', herb: '#7a9a4a', lvl: 73, time: 3800, pxp: 134, hxp: 151, y: [2, 5], seed: 4500, v: 1800 },
  { id: 'dwarf_weed', name: 'Dwarf weed', herb: '#3a6a3a', lvl: 79, time: 4500, pxp: 170, hxp: 192, y: [2, 5], seed: 6000, v: 2300 },
];
NEW_CROPS.forEach(c => {
  const outId = c.out || c.id;
  item(c.id + '_seed', c.name.replace(' leaf', '').replace(' berries', ' berry').replace('Potato cactus', 'Cactus') + ' seed', Math.max(1, Math.round(c.seed / 3)), { cat: 'farm', kind: 'seed', tint: c.herb || '#b08a4a' });
  if (!ITEMS[outId]) item(outId, c.out === 'white_berries' ? 'White berries' : c.out === 'potato_cactus' ? 'Potato cactus' : c.name, c.v || 40, c.emoji ? { cat: 'farm', emoji: c.emoji } : { cat: 'farm', kind: 'herb', tint: c.herb });
  CROPS.push({ ...c, cropItem: outId });
  SHOP.seeds.push({ id: c.id + '_seed', price: c.seed });
});
CROPS.forEach(c => { c.cropItem ||= c.id; });
CROPS.sort((a, b) => a.lvl - b.lvl);
SHOP.seeds.sort((a, b) => a.price - b.price);

/* ---------- Herblore: potions ---------- */
const POTIONS = [
  { id: 'attack_potion',   name: 'Attack potion',   lvl: 3,  xp: 25,  herb: 'guam',       sec: 'eye_of_newt',       tint: '#4ac8e8', fx: { atk: [3, 0.10] } },
  { id: 'strength_potion', name: 'Strength potion', lvl: 12, xp: 50,  herb: 'tarromin',   sec: 'limpwurt_root',     tint: '#e8e8e8', fx: { str: [3, 0.10] } },
  { id: 'defence_potion',  name: 'Defence potion',  lvl: 30, xp: 75,  herb: 'ranarr',     sec: 'white_berries',     tint: '#5ae05a', fx: { def: [3, 0.10] } },
  { id: 'super_attack',    name: 'Super attack',    lvl: 45, xp: 100, herb: 'irit',       sec: 'eye_of_newt',       tint: '#2a4ae8', fx: { atk: [5, 0.15] } },
  { id: 'super_strength',  name: 'Super strength',  lvl: 55, xp: 125, herb: 'kwuarm',     sec: 'limpwurt_root',     tint: '#f0f0ff', fx: { str: [5, 0.15] } },
  { id: 'super_defence',   name: 'Super defence',   lvl: 66, xp: 150, herb: 'cadantine',  sec: 'white_berries',     tint: '#e8c030', fx: { def: [5, 0.15] } },
  { id: 'antifire_potion', name: 'Antifire potion', lvl: 69, xp: 157, herb: 'lantadyme',  sec: 'dragon_scale_dust', tint: '#a02ac8', fx: { antifire: 1 } },
  { id: 'ranging_potion',  name: 'Ranging potion',  lvl: 72, xp: 162, herb: 'dwarf_weed', sec: 'wine_of_zamorak',   tint: '#3a8ac8', fx: { rng: [4, 0.10] } },
  { id: 'magic_potion',    name: 'Magic potion',    lvl: 76, xp: 172, herb: 'lantadyme',  sec: 'potato_cactus',     tint: '#e8a020', fx: { mag: [4, 0.10] } },
  { id: 'saradomin_brew',  name: 'Saradomin brew',  lvl: 81, xp: 180, herb: 'toadflax',   sec: 'crushed_nest',      tint: '#f0e080', brew: true },
  { id: 'super_combat',    name: 'Super combat potion', lvl: 90, xp: 150, inp: { torstol: 1, super_attack: 1, super_strength: 1, super_defence: 1 }, tint: '#2a6a2a', fx: { atk: [5, 0.15], str: [5, 0.15], def: [5, 0.15] } },
  { id: 'overload',        name: 'Overload',        lvl: 96, xp: 175, inp: { torstol: 1, super_combat: 1, ranging_potion: 1, magic_potion: 1 }, tint: '#1a1a1a', fx: { atk: [6, 0.16], str: [6, 0.16], def: [6, 0.16], rng: [6, 0.16], mag: [6, 0.16] } },
];
const POT_BY_ID = Object.fromEntries(POTIONS.map(p => [p.id, p]));
const POT_SECONDS = 300;
POTIONS.forEach(p => {
  item(p.id, p.name, Math.round(p.xp * (p.lvl > 80 ? 12 : 5)), p.brew ? { cat: 'food', kind: 'potion', tint: p.tint, heal: 16 } : { cat: 'herb', kind: 'potion', tint: p.tint, potion: p.fx });
  act3({ id: 'h_' + p.id, st: 'herb', name: p.name, lvl: p.lvl, xp: p.xp, hp: 3 + Math.floor(p.lvl / 20),
    inp: p.inp || { vial_of_water: 1, [p.herb]: 1, [p.sec]: 1 }, out: { [p.id]: 1 }, icon: p.id });
});
act3({ id: 'h_crush_nest', st: 'herb', name: "Crush bird's nest", lvl: 1, xp: 2, hp: 2, inp: { bird_nest: 1 }, out: { crushed_nest: 1 }, icon: 'crushed_nest' });
STATION_ACTIONS.herb.sort((a, b) => a.lvl - b.lvl);

/* ---------- Crafting ---------- */
const CUT_GEMS = [['sapphire', 20, 50], ['emerald', 27, 67.5], ['ruby', 34, 85], ['diamond', 43, 107.5], ['dragonstone', 55, 137.5], ['onyx', 67, 167.5]];
CUT_GEMS.forEach(([g, lvl, xp]) => {
  item('cut_' + g, cap1(g), Math.round(ITEMS[g].value * 1.6), { cat: 'gem', kind: 'gem', tint: ITEMS[g].tint, cut: true });
  act3({ id: 'cr_cut_' + g, st: 'craft', name: 'Cut ' + g, lvl, xp, hp: 3 + Math.floor(lvl / 20), inp: { [g]: 1 }, out: { ['cut_' + g]: 1 }, icon: 'cut_' + g });
});
item('zenyte', 'Zenyte', 15000000, { cat: 'gem', kind: 'gem', tint: '#f09030', rare: true });
act3({ id: 'cr_zenyte', st: 'craft', name: 'Fuse zenyte', lvl: 89, xp: 200, hp: 10, inp: { zenyte_shard: 1, cut_onyx: 1 }, out: { zenyte: 1 }, icon: 'zenyte' });
// jewellery moves from the furnace to Crafting
JEWELLERY.forEach(j => { delete ACTIONS['s_' + j.id]; });
STATION_ACTIONS.furnace = STATION_ACTIONS.furnace.filter(a => ACTIONS[a.id]);
gear('amulet_of_magic', 'Amulet of magic', 'neck', [0, 0, 0], null, { kind: 'amulet', tint: '#2a4ad8', matk: 10, rare: false, value: 900 });
gear('amulet_of_accuracy', 'Amulet of accuracy', 'neck', [6, 0, 0], null, { kind: 'amulet', tint: '#1ea050', ratk: 6, rare: false, value: 1100 });
gear('necklace_of_anguish', 'Necklace of anguish', 'neck', [0, 0, 5], { ranged: 75 }, { kind: 'amulet', tint: '#f09030', ratk: 15, rstr: 5, value: 14000000 });
gear('tormented_bracelet', 'Tormented bracelet', 'hands', [0, 0, 0], { magic: 75 }, { kind: 'gloves', tint: '#f09030', matk: 10, mdmg: 5, value: 12000000 });
gear('ring_of_suffering', 'Ring of suffering', 'ring', [0, 0, 20], { defence: 75 }, { kind: 'ring', tint: '#f09030', reduce: 0.05, value: 9000000 });
[['amulet_of_magic', 'cut_sapphire', 24, 65], ['amulet_of_accuracy', 'cut_emerald', 31, 70], ['amulet_of_strength', 'cut_ruby', 50, 85], ['amulet_of_power', 'cut_diamond', 70, 100],
 ['amulet_of_glory', 'cut_dragonstone', 80, 150], ['ring_of_wealth', 'cut_dragonstone', 82, 150], ['amulet_of_fury', 'cut_onyx', 90, 165],
 ['ring_of_suffering', 'zenyte', 89, 200], ['necklace_of_anguish', 'zenyte', 92, 200], ['tormented_bracelet', 'zenyte', 93, 200], ['amulet_of_torture', 'zenyte', 95, 200]]
  .forEach(([out, gem, lvl, xp]) => act3({ id: 'cr_' + out, st: 'craft', name: ITEMS[out].name, lvl, xp, hp: 6, inp: { gold_bar: 1, [gem]: 1 }, out: { [out]: 1 }, icon: out }));
act3({ id: 'cr_bowstring', st: 'craft', name: 'Spin bowstring', lvl: 10, xp: 15, hp: 2, inp: { flax: 1 }, out: { bowstring: 1 }, icon: 'bowstring' });
act3({ id: 'cr_leather', st: 'craft', name: 'Tan leather', lvl: 1, xp: 2, hp: 1, inp: { cowhide: 1 }, out: { leather: 1 }, icon: 'leather' });

/* Ranged armour (leather & dragonhide) */
const rgear = (id, name, slot, ratk, def, req, kind, tint, extra = {}) => gear(id, name, slot, [0, 0, def], req, { kind, tint, ratk, rare: false, ...extra });
rgear('leather_coif', 'Coif', 'head', 2, 4, { ranged: 20 }, 'coif', '#9a6a3a', { value: 60 });
rgear('leather_body', 'Leather body', 'body', 8, 10, null, 'dhidebody', '#9a6a3a', { value: 50 });
rgear('leather_chaps', 'Leather chaps', 'legs', 4, 6, null, 'chaps', '#9a6a3a', { value: 40 });
rgear('leather_vambraces', 'Leather vambraces', 'hands', 4, 2, null, 'gloves', '#9a6a3a', { value: 30 });
[['leather_gloves', 1, 13.8, 1], ['leather_boots', 7, 16.3, 1], ['leather_vambraces', 11, 22, 1], ['leather_body', 14, 25, 1], ['leather_chaps', 18, 27, 1], ['leather_coif', 38, 37, 1]]
  .forEach(([out, lvl, xp, q]) => act3({ id: 'cr_' + out, st: 'craft', name: ITEMS[out].name, lvl, xp, hp: 2, inp: { leather: q }, out: { [out]: 1 }, icon: out }));
const DHIDES = [
  { c: 'green', hide: 'green_dragonhide', lvls: [57, 60, 63], xp: 62, req: 40, st: [8, 11, 15], def: [3, 12, 30], tint: '#3a8a3a' },
  { c: 'blue',  hide: 'blue_dragonhide',  lvls: [66, 68, 71], xp: 70, req: 50, st: [9, 14, 20], def: [4, 16, 40], tint: '#3a5ac8' },
  { c: 'red',   hide: 'red_dragonhide',   lvls: [73, 75, 77], xp: 78, req: 60, st: [10, 14, 25], def: [5, 20, 50], tint: '#b8302a' },
  { c: 'black', hide: 'black_dragonhide', lvls: [79, 82, 84], xp: 86, req: 70, st: [11, 17, 30], def: [6, 25, 58], tint: '#2e2e2e' },
];
DHIDES.forEach(d => {
  [['vambraces', 'hands', 'gloves', 1], ['chaps', 'legs', 'chaps', 2], ['body', 'body', 'dhidebody', 3]].forEach(([p, slot, kind, hides], i) => {
    const id = d.c + '_dhide_' + p, name = cap1(d.c) + " d'hide " + (p === 'body' ? 'body' : p);
    rgear(id, name, slot, d.st[i], d.def[i], { ranged: d.req }, kind, d.tint, { value: ITEMS[d.hide].value * hides * 1.4 | 0 });
    act3({ id: 'cr_' + id, st: 'craft', name, lvl: d.lvls[i], xp: d.xp * hides, hp: 3 + hides, inp: { [d.hide]: hides }, out: { [id]: 1 }, icon: id });
  });
});
/* Mage robes */
const mgear = (id, name, slot, matk, def, req, kind, tint, extra = {}) => gear(id, name, slot, [0, 0, def], req, { kind, tint, matk, rare: false, ...extra });
mgear('wizard_hat', 'Wizard hat', 'head', 2, 0, null, 'hat', '#2a3a9a', { value: 20 });
mgear('wizard_robe', 'Wizard robe', 'body', 3, 0, null, 'robe', '#2a3a9a', { value: 30 });
mgear('wizard_skirt', 'Wizard robe skirt', 'legs', 2, 0, null, 'robeskirt', '#2a3a9a', { value: 25 });
mgear('mystic_hat', 'Mystic hat', 'head', 4, 2, { magic: 40, defence: 20 }, 'hat', '#2a4ab8', { value: 6000 });
mgear('mystic_robe_top', 'Mystic robe top', 'body', 20, 20, { magic: 40, defence: 20 }, 'robe', '#2a4ab8', { value: 50000 });
mgear('mystic_robe_bottom', 'Mystic robe bottom', 'legs', 15, 15, { magic: 40, defence: 20 }, 'robeskirt', '#2a4ab8', { value: 40000 });
mgear('mystic_gloves', 'Mystic gloves', 'hands', 5, 2, { magic: 40, defence: 20 }, 'gloves', '#2a4ab8', { value: 5000 });
mgear('mystic_boots', 'Mystic boots', 'feet', 3, 2, { magic: 40, defence: 20 }, 'boots', '#2a4ab8', { value: 5000 });
[['mystic_gloves', 44, 1], ['mystic_hat', 46, 2], ['mystic_boots', 47, 1], ['mystic_robe_bottom', 52, 4], ['mystic_robe_top', 56, 5]]
  .forEach(([out, lvl, silk]) => act3({ id: 'cr_' + out, st: 'craft', name: ITEMS[out].name, lvl, xp: 45 * silk, hp: 3 + silk, inp: { silk: silk * 3 }, out: { [out]: 1 }, icon: out }));
/* Magic weapons (staves) */
const staff = (id, name, matk, mdmg, req, kind, tint, extra = {}) => gear(id, name, 'weapon', [0, 0, 0], req, { kind: kind || 'staff', tint, matk, mdmg, wclass: 'magic', cast: 'spell', spd: 1.25, rare: false, ...extra });
staff('staff_of_fire', 'Staff of fire', 8, 0, null, 'staff', '#d04010', { value: 500 });
staff('fire_battlestaff', 'Fire battlestaff', 12, 0, { magic: 30 }, 'staff', '#e05a10', { value: 4000 });
staff('mystic_fire_staff', 'Mystic fire staff', 15, 5, { magic: 40 }, 'staff', '#ff7a2a', { value: 15000 });
staff('ahrims_staff', "Ahrim's staff", 15, 5, { magic: 70, attack: 70 }, 'staff', '#4a4a5a', { rare: true, value: 300000, set: 'ahrim' });
staff('staff_of_the_dead', 'Staff of the dead', 17, 15, { magic: 75, attack: 75 }, 'staff', '#3a8a3a', { rare: true, value: 6000000 });
staff('trident_of_the_seas', 'Trident of the seas', 25, 0, { magic: 75 }, 'trident', '#2a8ac8', { rare: true, cast: 'trident', spd: 1, value: 2000000 });
act3({ id: 'cr_fire_battlestaff', st: 'craft', name: 'Fire battlestaff', lvl: 62, xp: 125, hp: 6, inp: { battlestaff: 1, fire_orb: 1 }, out: { fire_battlestaff: 1 }, icon: 'fire_battlestaff' });
act3({ id: 'cr_mystic_fire_staff', st: 'craft', name: 'Mystic fire staff', lvl: 78, xp: 200, hp: 8, inp: { fire_battlestaff: 1, cut_dragonstone: 1 }, out: { mystic_fire_staff: 1 }, icon: 'mystic_fire_staff' });
gear('occult_necklace', 'Occult necklace', 'neck', [0, 0, 0], { magic: 70 }, { kind: 'amulet', tint: '#e85a1a', matk: 12, mdmg: 10, value: 600000 });
gear('seers_ring', 'Seers ring', 'ring', [0, 0, 0], null, { kind: 'ring', tint: '#5a8ac8', matk: 6, value: 200000 });
gear('archers_ring', 'Archers ring', 'ring', [0, 0, 0], null, { kind: 'ring', tint: '#5a8a3a', ratk: 6, value: 2000000 });
STATION_ACTIONS.craft.sort((a, b) => a.lvl - b.lvl);

/* Spells cast by staves (best one your Magic level allows) */
const SPELLS = [[1, 'Wind Strike', 2], [13, 'Fire Strike', 8], [35, 'Fire Bolt', 12], [59, 'Fire Blast', 16], [75, 'Fire Wave', 20], [95, 'Fire Surge', 24]];

/* ---------- Fletching & ammo ---------- */
const ARROWS = [['bronze', 1, 7, 1, 1.3], ['iron', 15, 10, 2, 2.5], ['steel', 30, 16, 3, 5], ['mithril', 45, 22, 4, 7.5], ['adamant', 60, 31, 5, 10], ['rune', 75, 49, 6, 12.5], ['dragon', 90, 60, 7, 15]];
ARROWS.forEach(([m, lvl, rstr, tier, xp]) => {
  const tint = m === 'dragon' ? DRAGON_TINT : METALS.find(x => x.id === m).tint;
  item(m + '_arrowtips', cap1(m) + ' arrowtips', Math.max(1, Math.round(tier * tier * 2)), { cat: 'ammo', kind: 'arrowtips', tint, rare: m === 'dragon' });
  item(m + '_arrow', cap1(m) + ' arrow', Math.max(1, Math.round(tier * tier * 3)), { cat: 'ammo', kind: 'arrow', tint, ammo: 'arrow', rstr, tier });
  act3({ id: 'fl_' + m + '_arrow', st: 'fletch', name: cap1(m) + ' arrows', lvl, xp, hp: 1, inp: { arrow_shaft: 1, feather: 1, [m + '_arrowtips']: 1 }, out: { [m + '_arrow']: 1 }, icon: m + '_arrow' });
  if (m !== 'dragon') {
    const mt = METALS.find(x => x.id === m);
    act3({ id: 'a_' + m + '_arrowtips', st: 'anvil', metal: m, name: cap1(m) + ' arrowtips (×15)', lvl: Math.min(99, mt.lvl + 5), xp: mt.fxp, hp: 2 + mt.tier, inp: { [m + '_bar']: 1 }, out: { [m + '_arrowtips']: 15 }, icon: m + '_arrowtips' });
  }
});
const BOLTS = [['steel', 33, 44, 3], ['mithril', 53, 54, 4], ['adamant', 73, 65, 5], ['rune', 88, 80, 6], ['dragon', 0, 95, 7]];
BOLTS.forEach(([m, lvl, rstr, tier]) => {
  const tint = m === 'dragon' ? DRAGON_TINT : METALS.find(x => x.id === m).tint;
  item(m + '_bolts', cap1(m) + ' bolts', Math.round(tier * tier * 5), { cat: 'ammo', kind: 'bolt', tint, ammo: 'bolt', rstr, tier, rare: m === 'dragon' });
  if (lvl) { const mt = METALS.find(x => x.id === m); act3({ id: 'a_' + m + '_bolts', st: 'anvil', metal: m, name: cap1(m) + ' bolts (×10)', lvl: Math.min(99, lvl), xp: mt.fxp, hp: 2 + mt.tier, inp: { [m + '_bar']: 1 }, out: { [m + '_bolts']: 10 }, icon: m + '_bolts' }); }
});
[['logs', 1, 5, 15], ['oak_logs', 15, 10, 30], ['willow_logs', 30, 15, 45], ['maple_logs', 45, 20, 60], ['yew_logs', 60, 25, 75], ['magic_logs', 75, 30, 90]]
  .forEach(([log, lvl, xp, q]) => act3({ id: 'fl_shafts_' + log, st: 'fletch', name: `Arrow shafts (${ITEMS[log].name})`, lvl, xp, hp: 2, inp: { [log]: 1 }, out: { arrow_shaft: q }, icon: 'arrow_shaft' }));
const BOWS = [
  { w: 'logs', n: '', lvl: 5, xp: 10, ratk: 8, req: 1, cap: 2 }, { w: 'oak_logs', n: 'Oak ', lvl: 20, xp: 33, ratk: 14, req: 5, cap: 3 },
  { w: 'willow_logs', n: 'Willow ', lvl: 35, xp: 66, ratk: 20, req: 20, cap: 4 }, { w: 'maple_logs', n: 'Maple ', lvl: 50, xp: 100, ratk: 29, req: 30, cap: 5 },
  { w: 'yew_logs', n: 'Yew ', lvl: 65, xp: 135, ratk: 47, req: 40, cap: 6 }, { w: 'magic_logs', n: 'Magic ', lvl: 80, xp: 166, ratk: 69, req: 50, cap: 6 },
];
BOWS.forEach(b => {
  const tint = ITEMS[b.w].tint;
  [['shortbow', 0, 0.9, 0], ['longbow', 5, 1.2, 6]].forEach(([k, plus, spd, rs]) => {
    const id = (b.n ? b.n.trim().toLowerCase() + '_' : '') + k;
    gear(id, b.n + k, 'weapon', [0, 0, 0], { ranged: b.req }, { kind: k, tint, ratk: b.ratk + plus, rstr: rs, wclass: 'ranged', ammo: 'arrow', ammoCap: b.cap, spd, twoHanded: true, rare: false, value: Math.round(b.xp * 8 + ITEMS[b.w].value) });
    act3({ id: 'fl_' + id, st: 'fletch', name: b.n + k, lvl: b.lvl + plus, xp: b.xp * (k === 'longbow' ? 1.1 : 1), hp: 3 + Math.floor(b.lvl / 25), inp: { [b.w]: 1, bowstring: 1 }, out: { [id]: 1 }, icon: id });
  });
});
gear('rune_crossbow', 'Rune crossbow', 'weapon', [0, 0, 0], { ranged: 61 }, { kind: 'crossbow', tint: '#3aa4b4', ratk: 90, wclass: 'ranged', ammo: 'bolt', ammoCap: 6, spd: 1.25, rare: false, value: 16000 });
act3({ id: 'fl_rune_crossbow', st: 'fletch', name: 'Rune crossbow', lvl: 69, xp: 135, hp: 6, inp: { yew_logs: 1, rune_bar: 1, bowstring: 1 }, out: { rune_crossbow: 1 }, icon: 'rune_crossbow' });
gear('dark_bow', 'Dark bow', 'weapon', [0, 0, 0], { ranged: 60 }, { kind: 'longbow', tint: '#2a1a3a', ratk: 95, wclass: 'ranged', ammo: 'arrow', ammoCap: 7, spd: 1.5, twoHanded: true, doubleShot: true, value: 1500000 });
gear('armadyl_crossbow', 'Armadyl crossbow', 'weapon', [0, 0, 0], { ranged: 70 }, { kind: 'crossbow', tint: GOD_TINT.armadyl, ratk: 100, wclass: 'ranged', ammo: 'bolt', ammoCap: 7, spd: 1.25, value: 25000000 });
STATION_ACTIONS.fletch.sort((a, b) => a.lvl - b.lvl);
STATION_ACTIONS.anvil.sort((a, b) => a.lvl - b.lvl);

/* ---------- Barrows ---------- */
const BARROWS = [
  { id: 'ahrim',  name: "Ahrim the Blighted", icon: '🧙', hue: 230, style: 'magic',  pieces: [['ahrims_hood', 'hood', 'head', 'hat'], ['ahrims_robetop', 'robetop', 'body', 'robe'], ['ahrims_robeskirt', 'robeskirt', 'legs', 'robeskirt'], ['ahrims_staff']],
    eff: '25% chance to hit 30% harder (magic)' },
  { id: 'dharok', name: 'Dharok the Wretched', icon: '🧟', style: 'melee', pieces: [['dharoks_helm', 'helm', 'head', 'full_helm'], ['dharoks_platebody', 'platebody', 'body', 'platebody'], ['dharoks_platelegs', 'platelegs', 'legs', 'platelegs'], ['dharoks_greataxe', 'greataxe', 'weapon', 'battleaxe']],
    eff: 'Hits harder the lower your health' },
  { id: 'guthan', name: 'Guthan the Infested', icon: '🧟', hue: 90, style: 'melee', pieces: [['guthans_helm', 'helm', 'head', 'full_helm'], ['guthans_platebody', 'platebody', 'body', 'platebody'], ['guthans_chainskirt', 'chainskirt', 'legs', 'platelegs'], ['guthans_warspear', 'warspear', 'weapon', 'spear']],
    eff: '25% chance to heal the damage you deal' },
  { id: 'karil',  name: 'Karil the Tainted', icon: '🧝', hue: 0, style: 'ranged', pieces: [['karils_coif', 'coif', 'head', 'coif'], ['karils_leathertop', 'leathertop', 'body', 'dhidebody'], ['karils_leatherskirt', 'leatherskirt', 'legs', 'chaps'], ['karils_crossbow', 'crossbow', 'weapon', 'crossbow']],
    eff: '25% chance to fire a second bolt' },
  { id: 'torag',  name: 'Torag the Corrupted', icon: '🧟', hue: 200, style: 'melee', pieces: [['torags_helm', 'helm', 'head', 'full_helm'], ['torags_platebody', 'platebody', 'body', 'platebody'], ['torags_platelegs', 'platelegs', 'legs', 'platelegs'], ['torags_hammers', 'hammers', 'weapon', 'maul']],
    eff: 'Take 10% less damage' },
  { id: 'verac',  name: 'Verac the Defiled', icon: '🧟', hue: 300, style: 'melee', pieces: [['veracs_helm', 'helm', 'head', 'full_helm'], ['veracs_brassard', 'brassard', 'body', 'platebody'], ['veracs_plateskirt', 'plateskirt', 'legs', 'platelegs'], ['veracs_flail', 'flail', 'weapon', 'maul']],
    eff: '25% chance for a hit to ignore defence' },
];
const BARROWS_TINT = { ahrim: '#4a4a5e', dharok: '#4e4a40', guthan: '#4a5a40', karil: '#5a4a3a', torag: '#50505a', verac: '#4e3e4e' };
BARROWS.forEach(b => {
  const t = BARROWS_TINT[b.id], who = b.name.split(' ')[0] + "'s ";
  b.pieces.forEach(([id, part, slot, kind]) => {
    if (id === 'ahrims_staff') return;
    const nm = who + part;
    if (slot === 'weapon') {
      const W = { dharoks_greataxe: [103, 105, 1.4, true], guthans_warspear: [75, 75, 1.1, true], torags_hammers: [68, 72, 1.0, true], veracs_flail: [68, 72, 1.0, false] }[id];
      if (id === 'karils_crossbow') gear(id, nm, 'weapon', [0, 0, 0], { ranged: 70 }, { kind, tint: t, ratk: 84, wclass: 'ranged', ammo: 'bolt', ammoCap: 7, spd: 0.85, twoHanded: true, set: b.id, value: 400000 });
      else gear(id, nm, 'weapon', [W[0], W[1], 0], { attack: 70, strength: 70 }, { kind, tint: t, spd: W[2], twoHanded: W[3], set: b.id, spear: id === 'guthans_warspear', value: 500000 });
    } else if (b.style === 'magic') gear(id, nm, slot, [0, 0, { head: 15, body: 52, legs: 33 }[slot]], { magic: 70, defence: 70 }, { kind, tint: t, matk: { head: 6, body: 30, legs: 22 }[slot], set: b.id, value: 400000 });
    else if (b.style === 'ranged') gear(id, nm, slot, [0, 0, { head: 18, body: 60, legs: 34 }[slot]], { ranged: 70, defence: 70 }, { kind, tint: t, ratk: { head: 7, body: 30, legs: 17 }[slot], set: b.id, value: 400000 });
    else gear(id, nm, slot, [0, 0, { head: 45, body: 82, legs: 79 }[slot]], { defence: 70 }, { kind, tint: t, set: b.id, value: 600000 });
  });
});
const BARROWS_PIECES = BARROWS.flatMap(b => b.pieces.map(p => p[0]));
BARROWS.forEach((b, i) => MONSTERS.push({ id: 'barrows_' + b.id, name: b.name, icon: b.icon, hue: b.hue, lvl: [98, 115, 115, 98, 115, 115][i], hp: 100, atk: 100, def: 100, mh: 22 + (i % 3), spd: 2.4,
  area: 'minigames', barrows: b.id, weak: b.style === 'magic' ? 'melee' : b.style === 'ranged' ? 'magic' : 'magic', drops: [] }));

/* ---------- Thieving ---------- */
const THIEVING = [
  { id: 'man', name: 'Pickpocket man', lvl: 1, xp: 8, hp: 3, coins: [3, 3], icon: '🧑', loot: [] , clue: ['easy', 1 / 150] },
  { id: 'cake_stall', name: 'Cake stall', lvl: 5, xp: 16, hp: 4, icon: '🍰', loot: [['cake', 1, 1, 1]] },
  { id: 'farmer', name: 'Pickpocket farmer', lvl: 10, xp: 14.5, hp: 4, coins: [9, 9], icon: '🧑‍🌾', loot: [['potato_seed', 1 / 2, 1, 2], ['flax_crop_seed', 1 / 3, 1, 3]] },
  { id: 'silk_stall', name: 'Silk stall', lvl: 20, xp: 24, hp: 5, icon: '🧵', loot: [['silk', 1, 1, 1]] },
  { id: 'master_farmer', name: 'Pickpocket master farmer', lvl: 38, xp: 43, hp: 6, icon: '👨‍🌾', loot: [['seedtable', 1, 1, 1]], clue: ['medium', 1 / 250] },
  { id: 'guard_pp', name: 'Pickpocket guard', lvl: 40, xp: 46.8, hp: 6, coins: [30, 30], icon: '💂', loot: [], clue: ['medium', 1 / 200] },
  { id: 'silver_stall', name: 'Silver stall', lvl: 50, xp: 54, hp: 7, icon: '🥈', loot: [['silver_ore', 1, 1, 1], ['silver_bar', 1 / 10, 1, 1]] },
  { id: 'knight', name: 'Pickpocket knight', lvl: 55, xp: 84, hp: 7, coins: [50, 50], icon: '🤺', loot: [], clue: ['medium', 1 / 150] },
  { id: 'paladin', name: 'Pickpocket paladin', lvl: 70, xp: 151, hp: 9, coins: [80, 80], icon: '🛡️', loot: [['fire_orb', 1 / 40, 1, 1]], clue: ['hard', 1 / 300] },
  { id: 'gem_stall', name: 'Gem stall', lvl: 75, xp: 160, hp: 10, icon: '💎', loot: [['gemtable', 1, 1, 1]] },
  { id: 'hero', name: 'Pickpocket hero', lvl: 80, xp: 275, hp: 11, coins: [200, 300], icon: '🦸', loot: [['diamond', 1 / 50, 1, 1], ['dragonstone', 1 / 200, 1, 1], ['wine_of_zamorak', 1 / 30, 1, 1]], clue: ['hard', 1 / 200] },
  { id: 'elf', name: 'Pickpocket elf', lvl: 85, xp: 353, hp: 12, coins: [280, 350], icon: '🧝', loot: [['crystal_shard', 1 / 40, 1, 1], ['dragonstone', 1 / 100, 1, 1]], clue: ['elite', 1 / 400] },
  { id: 'tzhaar', name: 'Pickpocket TzHaar-Hur', lvl: 90, xp: 250, hp: 13, coins: [150, 600], icon: '🌋', loot: [['onyx', 1 / 2000, 1, 1], ['cut_ruby', 1 / 20, 1, 1]], clue: ['elite', 1 / 300] },
];
THIEVING.forEach(t => item('__' + t.id, t.name, 0, { emoji: t.icon, hidden: true, untradeable: true }));
item('__ag', 'Agility lap', 0, { emoji: '🏃', hidden: true, untradeable: true });
const ROGUE = [['rogue_mask', 'Rogue mask', 'head', 'hat'], ['rogue_top', 'Rogue top', 'body', 'robe'], ['rogue_trousers', 'Rogue trousers', 'legs', 'robeskirt'], ['rogue_gloves', 'Rogue gloves', 'hands', 'gloves'], ['rogue_boots', 'Rogue boots', 'feet', 'boots']];
ROGUE.forEach(([id, n, slot, kind]) => gear(id, n, slot, [0, 0, 0], null, { kind, tint: '#2a2a2a', set: 'rogue', untradeable: true, value: 1 }));
THIEVING.forEach(t => act3({ id: 't_' + t.id, st: 'thieve', name: t.name, lvl: t.lvl, xp: t.xp, hp: t.hp, out: {}, thieve: t, icon: '__' + t.id }));
const SEED_TABLE = [['potato_seed', 20], ['guam_seed', 30], ['tarromin_seed', 20], ['harralander_seed', 14], ['ranarr_seed', 6], ['toadflax_seed', 6], ['irit_seed', 4], ['avantoe_seed', 3], ['kwuarm_seed', 2.5], ['snapdragon_seed', 1], ['cadantine_seed', 1], ['lantadyme_seed', 0.8], ['dwarf_weed_seed', 0.6], ['torstol_seed', 0.3], ['limpwurt_seed', 8], ['white_berry_seed', 3]];
const GEM_TABLE = [['sapphire', 60], ['emerald', 25], ['ruby', 10], ['diamond', 5]];

/* ---------- Agility ---------- */
const COURSES = [
  { id: 'gnome', name: 'Gnome Stronghold course', lvl: 1, xp: 86, hp: 10, mark: 1 / 40 }, { id: 'draynor', name: 'Draynor rooftops', lvl: 10, xp: 120, hp: 12, mark: 1 / 20 },
  { id: 'alkharid', name: 'Al Kharid rooftops', lvl: 20, xp: 180, hp: 14, mark: 1 / 18 }, { id: 'varrock', name: 'Varrock rooftops', lvl: 30, xp: 238, hp: 16, mark: 1 / 15 },
  { id: 'canifis', name: 'Canifis rooftops', lvl: 40, xp: 240, hp: 15, mark: 1 / 7 }, { id: 'falador', name: 'Falador rooftops', lvl: 50, xp: 440, hp: 22, mark: 1 / 12 },
  { id: 'seers', name: "Seers' Village rooftops", lvl: 60, xp: 570, hp: 24, mark: 1 / 10 }, { id: 'pollnivneach', name: 'Pollnivneach rooftops', lvl: 70, xp: 890, hp: 30, mark: 1 / 9 },
  { id: 'rellekka', name: 'Rellekka rooftops', lvl: 80, xp: 780, hp: 28, mark: 1 / 8 }, { id: 'ardougne', name: 'Ardougne rooftops', lvl: 90, xp: 890, hp: 30, mark: 1 / 6 },
];
COURSES.forEach(c => act3({ id: 'ag_' + c.id, st: 'course', name: c.name, lvl: c.lvl, xp: c.xp, hp: c.hp, out: {}, course: c, icon: '__ag' }));
const GRACEFUL = [['graceful_hood', 'Graceful hood', 'head', 'hat', 35], ['graceful_cape', 'Graceful cape', 'cape', 'cape', 40], ['graceful_top', 'Graceful top', 'body', 'robe', 55],
  ['graceful_legs', 'Graceful legs', 'legs', 'robeskirt', 60], ['graceful_gloves', 'Graceful gloves', 'hands', 'gloves', 30], ['graceful_boots', 'Graceful boots', 'feet', 'boots', 40]];
GRACEFUL.forEach(([id, n, slot, kind, cost]) => gear(id, n, slot, [0, 0, 0], null, { kind, tint: '#3ab8b8', set: 'graceful', untradeable: true, marks: cost, value: 1 }));

/* ---------- Clue scrolls ---------- */
const CLUE_TIERS = {
  easy:   { name: 'Easy',   tint: '#8ab84a', steps: 2, rolls: [2, 4], rare: 1 / 30, n: 5 },
  medium: { name: 'Medium', tint: '#4aa0d8', steps: 3, rolls: [3, 5], rare: 1 / 25, n: 10 },
  hard:   { name: 'Hard',   tint: '#a04ad8', steps: 3, rolls: [4, 6], rare: 1 / 20, n: 20 },
  elite:  { name: 'Elite',  tint: '#e8c030', steps: 4, rolls: [5, 7], rare: 1 / 15, n: 30 },
};
Object.entries(CLUE_TIERS).forEach(([k, t]) => item('clue_' + k, `Clue scroll (${k})`, 1, { cat: 'misc', kind: 'scroll', tint: t.tint, clue: k, untradeable: true }));
const cosmetic = (id, name, slot, kind, tint, stats = [0, 0, 0], o = {}) => gear(id, name, slot, stats, o.req || null, { kind, tint, cosmetic: true, rare: true, value: o.value || 50000, ...o });
// Easy
cosmetic('highwayman_mask', 'Highwayman mask', 'head', 'hat', '#2a2a2a');
cosmetic('blue_beret', 'Blue beret', 'head', 'hat', '#2a4ab8');
cosmetic('bobs_shirt', "Bob's red shirt", 'body', 'robe', '#c8302a');
cosmetic('team_cape', 'Team cape', 'cape', 'cape', '#2a8a3a');
cosmetic('black_cane', 'Black cane', 'weapon', 'staff', '#1a1a1a', [4, 4, 0], { value: 30000 });
// Medium
cosmetic('ranger_boots', 'Ranger boots', 'feet', 'boots', '#3a7a3a', [0, 0, 4], { ratk: 8, value: 4000000 });
cosmetic('wizard_boots', 'Wizard boots', 'feet', 'boots', '#2a3a9a', [0, 0, 2], { matk: 5, value: 2000000 });
cosmetic('red_headband', 'Red headband', 'head', 'hat', '#c8302a');
cosmetic('adamant_platebody_g', 'Adamant platebody (g)', 'body', 'platebody', '#2e6a3a', [0, 0, 45], { req: { defence: 30 }, trim: '#e8c030', value: 1000000 });
cosmetic('adamant_kiteshield_g', 'Adamant kiteshield (g)', 'shield', 'kiteshield', '#2e6a3a', [0, 0, 25], { req: { defence: 30 }, trim: '#e8c030', value: 600000 });
// Hard
cosmetic('robin_hood_hat', 'Robin hood hat', 'head', 'hat', '#4a8a2a', [0, 0, 4], { ratk: 8, req: { ranged: 40 }, value: 6000000 });
cosmetic('rune_full_helm_g', 'Rune full helm (g)', 'head', 'full_helm', '#3aa4b4', [0, 0, 18], { req: { defence: 40 }, trim: '#e8c030', value: 3000000 });
cosmetic('rune_platebody_g', 'Rune platebody (g)', 'body', 'platebody', '#3aa4b4', [0, 0, 54], { req: { defence: 40 }, trim: '#e8c030', value: 8000000 });
cosmetic('rune_platelegs_g', 'Rune platelegs (g)', 'legs', 'platelegs', '#3aa4b4', [0, 0, 36], { req: { defence: 40 }, trim: '#e8c030', value: 6000000 });
cosmetic('rune_kiteshield_g', 'Rune kiteshield (g)', 'shield', 'kiteshield', '#3aa4b4', [0, 0, 30], { req: { defence: 40 }, trim: '#e8c030', value: 5000000 });
cosmetic('pirate_hat', 'Pirate hat', 'head', 'hat', '#2a2a2a');
// Elite
cosmetic('third_age_full_helmet', '3rd age full helmet', 'head', 'full_helm', '#e8e8f0', [0, 0, 47], { req: { defence: 65 }, trim: '#e8c030', value: 120000000 });
cosmetic('third_age_platebody', '3rd age platebody', 'body', 'platebody', '#e8e8f0', [0, 0, 96], { req: { defence: 65 }, trim: '#e8c030', value: 300000000 });
cosmetic('third_age_platelegs', '3rd age platelegs', 'legs', 'platelegs', '#e8e8f0', [0, 0, 78], { req: { defence: 65 }, trim: '#e8c030', value: 250000000 });
cosmetic('third_age_kiteshield', '3rd age kiteshield', 'shield', 'kiteshield', '#e8e8f0', [0, 0, 63], { req: { defence: 65 }, trim: '#e8c030', value: 400000000 });
cosmetic('third_age_range_top', '3rd age range top', 'body', 'dhidebody', '#e8e8f0', [0, 0, 55], { ratk: 30, req: { ranged: 65, defence: 45 }, trim: '#3a7ab8', value: 200000000 });
cosmetic('third_age_robe_top', '3rd age robe top', 'body', 'robe', '#e8e8f0', [0, 0, 26], { matk: 24, req: { magic: 65, defence: 30 }, trim: '#3a7ab8', value: 150000000 });
cosmetic('third_age_pickaxe', '3rd age pickaxe', 'pickaxe', 'pickaxe', '#e8e8f0', [0, 0, 0], { cat: 'tool', mult: 11, req: { mining: 61 }, trim: '#e8c030', value: 1000000000 });
cosmetic('gilded_scimitar', 'Gilded scimitar', 'weapon', 'scimitar', '#e8c030', [45, 44, 0], { req: { attack: 40 }, value: 20000000 });
const CLUE_UNIQUES = {
  easy: ['highwayman_mask', 'blue_beret', 'bobs_shirt', 'team_cape', 'black_cane'],
  medium: ['ranger_boots', 'wizard_boots', 'red_headband', 'adamant_platebody_g', 'adamant_kiteshield_g'],
  hard: ['robin_hood_hat', 'rune_full_helm_g', 'rune_platebody_g', 'rune_platelegs_g', 'rune_kiteshield_g', 'pirate_hat'],
  elite: ['third_age_full_helmet', 'third_age_platebody', 'third_age_platelegs', 'third_age_kiteshield', 'third_age_range_top', 'third_age_robe_top', 'third_age_pickaxe', 'gilded_scimitar'],
};
const CLUE_COMMON = {
  easy: [['coins', 50, 400], ['bronze_arrow', 20, 60], ['shrimp', 5, 10], ['casket', 1, 1], ['sapphire', 1, 2]],
  medium: [['coins', 300, 2000], ['mithril_arrow', 20, 60], ['lobster', 5, 12], ['emerald', 1, 3], ['ranarr_seed', 1, 2]],
  hard: [['coins', 2000, 9000], ['rune_arrow', 30, 80], ['shark', 6, 14], ['diamond', 1, 3], ['snapdragon_seed', 1, 2], ['rune_bar', 2, 5]],
  elite: [['coins', 10000, 40000], ['dragon_arrow', 20, 50], ['manta_ray', 8, 16], ['dragonstone', 1, 3], ['torstol_seed', 1, 3], ['rune_bar', 5, 10], ['mystery_box', 1, 2]],
};
const RIDDLES = [
  ['Two ores share the furnace and a beginner\'s metal is born. Which bar?', ['Bronze', 'Iron', 'Steel', 'Mithril']],
  ['Steel needs one iron ore. How many coal does it take?', ['2', '1', '4', '8']],
  ['I rule the Bandos stronghold of the God Wars Dungeon. Who am I?', ['General Graardor', "Kree'arra", 'Commander Zilyana', "K'ril Tsutsaroth"]],
  ['My hide is so tough that only a leaf-shaped blade will cut it.', ['Kurask', 'Gargoyle', 'Banshee', 'Nechryael']],
  ['Without me, a dragon\'s breath burns three times as hot.', ['Anti-dragon shield', 'Mirror shield', 'Spirit shield', 'Kiteshield']],
  ['I crumble only to the blow of a rock hammer.', ['Gargoyle', 'Jelly', 'Bloodveld', 'Dust Devil']],
  ['Look at my gaze directly and you are stone. Bring a mirror.', ['Basilisk', 'Pyrefiend', 'Turoth', 'Rockslug']],
  ['Beat me in the Fight Caves and I leave a burning cape behind.', ['TzTok-Jad', 'TzKal-Zuk', 'Cerberus', 'Kraken']],
  ['The toughest Slayer master, found only by the strongest.', ['Duradel', 'Turael', 'Vannaka', 'Chaeldar']],
  ['Four key pieces open my ancient prison.', ['Nex', 'Corporeal Beast', 'Dagannoth Rex', 'Alchemical Hydra']],
  ['I am Barrows\' greatest gambler: the lower my health, the harder I swing.', ['Dharok', 'Guthan', 'Verac', 'Torag']],
  ['My warspear heals me as it wounds you.', ['Guthan', 'Karil', 'Ahrim', 'Dharok']],
  ['Only a spear wounds me fully; everything else glances off.', ['Corporeal Beast', 'General Graardor', 'Kraken', 'Nex']],
  ['You trade me for graceful clothing on the rooftops.', ['Marks of grace', 'Slayer points', 'Stardust', 'Coins']],
  ['Flax becomes me at the spinning wheel, and bows can\'t do without me.', ['Bowstring', 'Silk', 'Leather', 'Arrow shaft']],
  ['Feathers are easiest to pluck from me.', ['Chicken', 'Cow', 'Goblin', 'Guard']],
  ['Lantadyme and dragon scale dust brew a potion against my fire.', ['Dragons', 'Demons', 'Giants', 'Spectres']],
  ['Which gem must be cut before a ring of wealth can be made?', ['Dragonstone', 'Onyx', 'Ruby', 'Sapphire']],
  ['Shards, a blade and a hilt from the bird god make me.', ['Armadyl godsword', 'Bandos godsword', 'Saradomin sword', 'Dragon claws']],
  ['I am the cape you are handed for reaching 99 in every skill.', ['Max cape', 'Fire cape', 'Infernal cape', 'Team cape']],
  ['Rangers fear my dark beasts\' twin-arrow bow drop.', ['Dark bow', 'Magic shortbow', 'Armadyl crossbow', 'Rune crossbow']],
  ['Herbs, a vial and an eye of newt make the simplest of potions.', ['Attack potion', 'Strength potion', 'Defence potion', 'Antifire']],
  ['I drop the smouldering stone that sets dragon tools ablaze.', ['Cerberus', 'Kraken', 'Hydra', 'Corporeal Beast']],
  ['Kill my followers forty times before you may enter my chamber.', ['A God Wars general', 'A Slayer master', 'A Barrows brother', 'TzTok-Jad']],
];

/* ---------- Monster additions & tweaks for ranged/magic ---------- */
const MB = id => MONSTERS.find(m => m.id === id);
MONSTERS.push({ id: 'red_dragon', name: 'Red Dragon', icon: '🐉', hue: 330, lvl: 152, hp: 140, atk: 130, def: 130, mh: 14, spd: 3, coins: [200, 2000], area: 'overworld', dragon: true, weak: 'ranged',
  drops: [['dragon_bones', 1, 1, 1], ['red_dragonhide', 1, 1, 1], ['dragon_scale_dust', 1 / 2, 1, 2], ['dragonstone', 1 / 50, 1, 1], ['dragon_arrowtips', 1 / 30, 5, 15]] });
MONSTERS.push({ id: 'giant_spider', name: 'Giant Spider', icon: '🕷️', lvl: 27, hp: 32, atk: 25, def: 22, mh: 4, spd: 2.4, coins: [5, 60], area: 'overworld', weak: 'magic', drops: [['eye_of_newt', 1 / 3, 1, 3], ['clue_easy', 1 / 60, 1, 1]] });
[['green_dragon', 'ranged'], ['blue_dragon', 'ranged'], ['black_dragon', 'ranged'], ['elder_wyrm', 'ranged'], ['lesser_demon', 'magic'], ['greater_demon', 'magic'], ['black_demon', 'magic'],
 ['abyssal_demon', 'magic'], ['kril', 'magic'], ['hill_giant', 'magic'], ['moss_giant', 'magic'], ['fire_giant', 'ranged'], ['bandos_ork', 'magic'], ['graardor', 'magic'],
 ['jad', 'magic'], ['zuk', 'ranged'], ['hydra', 'ranged'], ['cerberus', 'magic'], ['kraken', 'magic'], ['corp', 'melee'], ['dust_devil', 'magic'], ['gargoyle', 'ranged'], ['kurask', 'magic'], ['turoth', 'magic']]
  .forEach(([id, w]) => { const m = MB(id); if (m) m.weak = w; });
['kreearra', 'aviansie', 'kraken'].forEach(id => { MB(id).noMelee = true; });
const addDrop = (id, d) => MB(id)?.drops.push(d);
addDrop('blue_dragon', ['blue_dragonhide', 1, 1, 1]); addDrop('blue_dragon', ['dragon_scale_dust', 1 / 2, 1, 2]);
addDrop('black_dragon', ['black_dragonhide', 1, 1, 1]); addDrop('black_dragon', ['dragon_scale_dust', 1 / 2, 1, 3]); addDrop('black_dragon', ['dragon_arrowtips', 1 / 20, 10, 25]);
addDrop('hill_giant', ['limpwurt_root', 1 / 4, 1, 1]); addDrop('moss_giant', ['limpwurt_root', 1 / 3, 1, 2]);
addDrop('hellhound', ['wine_of_zamorak', 1 / 10, 1, 1]); addDrop('kril', ['wine_of_zamorak', 1 / 3, 1, 3]); addDrop('kril', ['staff_of_the_dead', 1 / 128, 1, 1]);
addDrop('zilyana', ['armadyl_crossbow', 1 / 120, 1, 1]); addDrop('kraken', ['trident_of_the_seas', 1 / 200, 1, 1]);
addDrop('smoke_devil', ['occult_necklace', 1 / 300, 1, 1]); addDrop('dark_beast', ['dark_bow', 1 / 300, 1, 1]);
addDrop('dagannoth_rex', ['seers_ring', 1 / 128, 1, 1]); addDrop('dagannoth_rex', ['archers_ring', 1 / 128, 1, 1]);
addDrop('pyrefiend', ['fire_orb', 1 / 6, 1, 1]); addDrop('infernal_mage', ['fire_orb', 1 / 5, 1, 2]); addDrop('infernal_mage', ['wizard_hat', 1 / 30, 1, 1]);
addDrop('hydra', ['dragon_arrowtips', 1 / 10, 20, 50]); addDrop('elder_wyrm', ['dragon_bolts', 1 / 6, 20, 60]);
addDrop('cow', ['cowhide', 1 / 2, 1, 1]);
const AREAS3 = [['overworld', '🌄 World'], ['slayer', '💀 Slayer'], ['gwd', '⚔️ GWD'], ['bosses', '👑 Bosses'], ['minigames', '⚱️ Barrows']];
AREAS.length = 0; AREAS.push(...AREAS3);

/* ---------- Shop additions ---------- */
SHOP.supplies = [
  ['vial_of_water', 5], ['eye_of_newt', 4], ['battlestaff', 7000], ['flax_crop_seed', 3], ['staff_of_fire', 1500], ['wizard_hat', 60], ['wizard_robe', 90], ['wizard_skirt', 75],
  ['shortbow', 80], ['bronze_arrow', 3], ['iron_arrow', 6], ['leather_body', 150], ['leather_chaps', 120], ['leather_vambraces', 90], ['leather_coif', 180], ['silk', 90],
].map(([id, price]) => ({ id, price }));

/* ---------- Pets ---------- */
Object.assign(PETS, {
  rocky: { name: 'Rocky the Raccoon', icon: '🦝', st: 'thieve', chance: 1 / 4000, desc: '+10% Thieving speed' },
  giant_squirrel: { name: 'Giant Squirrel', icon: '🐿️', st: 'course', chance: 1 / 2500, desc: '+10% Agility speed' },
  herbi: { name: 'Herbi', icon: '🦔', st: 'herb', chance: 1 / 4000, desc: '+10% Herblore speed' },
  phoenix_eggling: { name: 'Fletchling', icon: '🦜', st: 'fletch', chance: 1 / 4000, desc: '+10% Fletching speed' },
  tangle: { name: 'Loomling', icon: '🕸️', st: 'craft', chance: 1 / 4000, desc: '+10% Crafting speed' },
});

/* ---------- Shooting stars ---------- */
const STAR_SHOP = [['celestial_ring', 2000], ['mystery_box', 250], ['clue_medium', 400], ['clue_hard', 900], ['dragonstone', 150], ['xp_lamp', 600]];
gear('celestial_ring', 'Celestial ring', 'ring', [0, 0, 0], null, { kind: 'ring', tint: '#c8d8ff', starRing: true, untradeable: true, value: 1 });
act3({ id: 'm_star', st: 'mine', name: 'Crashed star', lvl: 10, xp: 30, hp: 6, out: { stardust: 1 }, star: true, icon: 'stardust' });

/* ---------- Seasonal events ---------- */
const SEASONS = [
  { id: 'halloween', name: 'Halloween', icon: '🎃', token: 'pumpkin', from: [10, 15], to: [11, 7],
    shop: [['skeleton_mask', 60], ['skeleton_shirt', 90], ['skeleton_leggings', 80], ['skeleton_gloves', 40], ['skeleton_boots', 40], ['halloween_mask_red', 150], ['halloween_mask_green', 150], ['halloween_mask_blue', 150], ['scythe_cosmetic', 400]] },
  { id: 'christmas', name: 'Christmas', icon: '🎄', token: 'present', from: [12, 1], to: [12, 31],
    shop: [['santa_hat', 120], ['reindeer_hat', 90], ['christmas_jumper', 100], ['snow_globe', 60], ['candy_cane', 200]] },
];
item('pumpkin', 'Pumpkin', 1, { cat: 'misc', emoji: '🎃', untradeable: true });
item('present', 'Present', 1, { cat: 'misc', emoji: '🎁', untradeable: true });
[['skeleton_mask', 'Skeleton mask', 'head', 'hat'], ['skeleton_shirt', 'Skeleton shirt', 'body', 'robe'], ['skeleton_leggings', 'Skeleton leggings', 'legs', 'robeskirt'], ['skeleton_gloves', 'Skeleton gloves', 'hands', 'gloves'], ['skeleton_boots', 'Skeleton boots', 'feet', 'boots']]
  .forEach(([id, n, slot, kind]) => cosmetic(id, n, slot, kind, '#e8e4d8', [0, 0, 0], { untradeable: true, set: 'skeleton' }));
[['red', '#c8302a'], ['green', '#3a9a3a'], ['blue', '#2a4ab8']].forEach(([c, t]) => cosmetic('halloween_mask_' + c, cap1(c) + " h'ween mask", 'head', 'hat', t, [0, 0, 0], { untradeable: true, value: 500000000 }));
cosmetic('scythe_cosmetic', 'Scythe', 'weapon', 'scythe', '#c8c8d0', [8, 12, 0], { twoHanded: true, untradeable: true });
cosmetic('santa_hat', 'Santa hat', 'head', 'hat', '#d0201a', [0, 0, 0], { untradeable: true, value: 300000000 });
cosmetic('reindeer_hat', 'Reindeer hat', 'head', 'hat', '#8a5a2a', [0, 0, 0], { untradeable: true });
cosmetic('christmas_jumper', 'Christmas jumper', 'body', 'robe', '#2a8a3a', [0, 0, 0], { untradeable: true });
cosmetic('snow_globe', 'Snow globe', 'shield', 'orb', '#cfe8ff', [0, 0, 0], { untradeable: true });
cosmetic('candy_cane', 'Candy cane', 'weapon', 'staff', '#e83a3a', [2, 2, 0], { untradeable: true });

/* ---------- Untradeables on the GE ---------- */
['fire_cape', 'infernal_cape', 'slayer_helmet', 'max_cape', 'frozen_key', 'bandos_key_piece', 'armadyl_key_piece', 'saradomin_key_piece', 'zamorak_key_piece', 'mystery_box']
  .forEach(id => { if (ITEMS[id]) ITEMS[id].untradeable = true; });
SKILL_ORDER.forEach(s => { if (ITEMS[s + '_cape']) ITEMS[s + '_cape'].untradeable = true; });

/* ---------- Achievements ---------- */
const ACHIEVEMENTS = [];
const ach = (id, name, desc, icon, test, ap = 1) => ACHIEVEMENTS.push({ id, name, desc, icon, test, ap });
SKILL_ORDER.forEach(s => {
  ach('lvl50_' + s, `${SKILLS[s].name} adept`, `Reach level 50 ${SKILLS[s].name}`, SKILLS[s].icon, g => g.LV[s] >= 50, 1);
  ach('lvl99_' + s, `${SKILLS[s].name} master`, `Reach level 99 ${SKILLS[s].name}`, SKILLS[s].icon, g => g.LV[s] >= 99, 5);
});
[100, 500, 1000, 1500, 2000].forEach(t => ach('total' + t, `Total level ${t}`, `Reach a total level of ${t}`, '📈', g => g.total >= t, t >= 1500 ? 5 : 2));
ach('maxed', 'Maxed out', 'Reach 99 in every skill', '🏆', g => SKILL_ORDER.every(s => g.LV[s] >= 99), 25);
[100, 1000, 10000, 100000].forEach(k => ach('kills' + k, `${k.toLocaleString()} kills`, `Kill ${k.toLocaleString()} monsters (lifetime)`, '⚔️', g => g.S.lifetime.kills >= k, k >= 10000 ? 3 : 1));
[1e6, 1e8, 1e9].forEach(c => ach('coins' + c, `${c >= 1e9 ? '1B' : c >= 1e8 ? '100M' : '1M'} club`, `Earn ${c.toLocaleString()} coins (lifetime)`, '🪙', g => g.S.lifetime.earned >= c, c >= 1e9 ? 5 : 2));
['graardor', 'kreearra', 'zilyana', 'kril', 'nex', 'dagannoth_rex', 'kraken', 'cerberus', 'hydra', 'corp', 'jad', 'zuk', 'elder_wyrm'].forEach(id =>
  ach('boss_' + id, `${MB(id).name} slain`, `Defeat ${MB(id).name}`, '👑', g => (g.S.kills[id] || 0) >= 1, id === 'zuk' || id === 'nex' ? 5 : 2));
[1, 10, 100].forEach(n => ach('tasks' + n, `${n} Slayer task${n > 1 ? 's' : ''}`, `Complete ${n} Slayer task${n > 1 ? 's' : ''}`, '💀', g => g.S.slayer.done >= n, n >= 100 ? 4 : 1));
Object.keys(CLUE_TIERS).forEach(t => ach('clue_' + t, `${cap1(t)} treasure`, `Complete a ${t} clue scroll`, '📜', g => (g.S.clues.done[t] || 0) >= 1, t === 'elite' ? 3 : 1));
ach('clue50', 'Treasure hunter', 'Complete 50 clue scrolls', '🗺️', g => Object.values(g.S.clues.done).reduce((a, b) => a + b, 0) >= 50, 4);
ach('barrows1', 'Crypt raider', 'Open the Barrows chest', '⚱️', g => (g.S.barrows.chests || 0) >= 1, 2);
ach('barrows_set', 'Full set', 'Wear a complete Barrows set', '🧟', g => g.fullBarrows, 3);
ach('pet1', 'Something is following you', 'Get your first pet', '🐾', g => Object.keys(g.S.pets).length >= 1, 2);
ach('pet10', 'Menagerie', 'Own 10 pets', '🦁', g => Object.keys(g.S.pets).length >= 10, 5);
ach('godsword', 'Divine weapon', 'Assemble a godsword', '🗡️', g => g.owns(i => i.kind === 'godsword'), 3);
ach('torva', 'Torva-ture', 'Wear full Torva', '🛡️', g => ['torva_full_helm', 'torva_platebody', 'torva_platelegs'].every(i => Object.values(g.S.equip).includes(i)), 5);
ach('graceful', 'Light as a feather', 'Wear full graceful', '🪶', g => GRACEFUL.every(([i]) => Object.values(g.S.equip).includes(i)), 2);
ach('rogue', 'Master of disguise', 'Wear the full rogue outfit', '🦹', g => ROGUE.every(([i]) => Object.values(g.S.equip).includes(i)), 3);
ach('star1', 'Starstruck', 'Mine stardust from a crashed star', '🌠', g => (g.S.lifetime.stardust || 0) >= 1, 1);
ach('laps1000', 'Free runner', 'Run 1,000 agility laps', '🏃', g => (g.S.lifetime.laps || 0) >= 1000, 3);
ach('perfect100', 'Perfect form', 'Land 100 perfect agility jumps', '✨', g => (g.S.lifetime.perfect || 0) >= 100, 2);
ach('pots100', 'Potion addict', 'Drink 100 potions', '🧪', g => (g.S.lifetime.pots || 0) >= 100, 2);
ach('clog25', 'Collector', 'Complete 25% of the collection log', '📒', g => g.clogPct >= 25, 3);
ach('clog100', 'Completionist', 'Complete the entire collection log', '📕', g => g.clogPct >= 100, 25);
ach('daily10', 'Daily grind', 'Claim 10 daily challenges', '📅', g => (g.S.lifetime.dailies || 0) >= 10, 2);
ach('ge_flip', 'Merchant', 'Earn 1M profit from Grand Exchange flips', '📈', g => (g.S.lifetime.geProfit || 0) >= 1e6, 3);
ach('streak50', 'Unstoppable', 'Reach a 50-task Slayer streak', '🔥', g => g.S.slayer.streak >= 50, 4);

/* =========================================================
   v3.1 — 120 levels, primal tier, smithable fishing & dig tools,
   artifact restoration, post-99 content
   ========================================================= */
const CAP99 = ['attack', 'strength', 'defence', 'hitpoints', 'ranged', 'magic', 'prayer'];
const MAX_LVL = Object.fromEntries(SKILL_ORDER.map(s => [s, CAP99.includes(s) ? 99 : 120]));
SKILL_STATIONS.archaeology = ['dig', 'restore'];

/* Primal: a smithable tier beyond dragon (Mining/Smithing 100+) */
item('primal_ore', 'Primal ore', 900, { cat: 'ore', kind: 'ore', tint: '#e0782a' });
item('primal_bar', 'Primal bar', 4200, { cat: 'bar', kind: 'bar', tint: '#d0782a' });
act3({ id: 'm_primal_ore', st: 'mine', name: 'Primal rock', lvl: 100, xp: 170, hp: effort(170, 9), out: { primal_ore: 1 }, icon: 'primal_ore' });
act3({ id: 's_primal', st: 'furnace', name: 'Primal bar', lvl: 100, xp: 70, hp: 6, inp: { primal_ore: 1, coal: 10 }, out: { primal_bar: 1 }, icon: 'primal_bar' });
const PRIMAL = { id: 'primal', name: 'Primal', tint: '#d0782a', lvl: 100, tier: 8, eq: 70, bv: 4200, fxp: 95 };
TOOL_MULT[8] = 12;
SMITH_ITEMS.forEach(si => {
  item('primal_' + si.k, 'Primal ' + si.name, Math.round(si.bars * PRIMAL.bv * 1.25), {
    cat: si.tool ? 'tool' : 'gear', kind: si.k, tint: PRIMAL.tint, slot: si.slot, tier: 8, spd: si.k === 'dagger' ? 0.85 : undefined,
    mult: si.tool ? 12 : undefined, ...gearStats(si, 8), req: si.tool ? { [si.tool]: 85 } : gearReq(si, 70), rare: true,
  });
  act3({ id: 'a_primal_' + si.k, st: 'anvil', metal: 'primal', name: 'Primal ' + si.name, lvl: Math.min(120, 100 + si.off), xp: si.bars * PRIMAL.fxp, hp: si.bars * 2 + 8, inp: { primal_bar: si.bars }, out: { ['primal_' + si.k]: 1 }, icon: 'primal_' + si.k });
});
METALS.push(PRIMAL);

/* Harpoons & mattocks at every metal tier (Smithing) */
[...METALS].forEach(m => {
  const hid = m.id + '_harpoon';
  item(hid, m.name + ' harpoon', Math.round(2 * m.bv * 1.25), { cat: 'tool', kind: 'harpoon', tint: m.tint, slot: 'rod', tier: m.tier, mult: TOOL_MULT[m.tier], req: { fishing: m.id === 'primal' ? 85 : Math.max(1, m.eq + 5) }, rare: m.id === 'primal' });
  act3({ id: 'a_' + hid, st: 'anvil', metal: m.id, name: m.name + ' harpoon', lvl: Math.min(120, m.lvl + 8), xp: 2 * m.fxp, hp: 4 + m.tier, inp: { [m.id + '_bar']: 2 }, out: { [hid]: 1 }, icon: hid });
  const mid = m.id + '_mattock';
  if (!ITEMS[mid]) item(mid, m.name + ' mattock', Math.round(2 * m.bv * 1.25), { cat: 'tool', kind: 'mattock', tint: m.tint, slot: 'mattock', mult: TOOL_MULT[m.tier], req: { archaeology: 85 }, rare: true });
  act3({ id: 'a_' + mid, st: 'anvil', metal: m.id, name: m.name + ' mattock', lvl: Math.min(120, m.lvl + 10), xp: 2 * m.fxp, hp: 4 + m.tier, inp: { [m.id + '_bar']: 2 }, out: { [mid]: 1 }, icon: mid });
  if (SHOP.tools.find(x => x.id === m.id + '_pickaxe') && !SHOP.tools.find(x => x.id === hid) && m.tier <= 6) SHOP.tools.push({ id: hid, price: ITEMS[hid].value * 3 });
});
SHOP.tools.sort((a, b) => a.price - b.price);

/* Post-99 content */
item('emagic_logs', 'Eternal magic logs', 2400, { cat: 'log', kind: 'log', tint: '#4ad0e0' });
act3({ id: 'w_emagic_logs', st: 'forest', name: 'Eternal magic tree', lvl: 100, xp: 380, hp: effort(380, 8), out: { emagic_logs: 1 }, icon: 'emagic_logs' });
act3({ id: 'f_emagic_logs', st: 'fire', name: 'Burn eternal magic logs', lvl: 100, xp: 520, hp: 6, inp: { emagic_logs: 1 }, out: { ashes: 2 }, icon: 'emagic_logs' });
act3({ id: 'fl_shafts_emagic_logs', st: 'fletch', name: 'Arrow shafts (Eternal magic logs)', lvl: 100, xp: 40, hp: 2, inp: { emagic_logs: 1 }, out: { arrow_shaft: 120 }, icon: 'arrow_shaft' });
gear('eternal_shortbow', 'Eternal shortbow', 'weapon', [0, 0, 0], { ranged: 75 }, { kind: 'shortbow', tint: '#4ad0e0', ratk: 90, rstr: 8, wclass: 'ranged', ammo: 'arrow', ammoCap: 7, spd: 0.85, twoHanded: true, value: 3000000 });
act3({ id: 'fl_eternal_shortbow', st: 'fletch', name: 'Eternal shortbow', lvl: 105, xp: 250, hp: 9, inp: { emagic_logs: 1, bowstring: 1 }, out: { eternal_shortbow: 1 }, icon: 'eternal_shortbow' });
item('raw_sailfish', 'Raw sailfish', 700, { cat: 'fish', kind: 'fish', tint: '#3a7ad8' });
item('sailfish', 'Sailfish', 1300, { cat: 'food', kind: 'cookedfish', tint: '#3a7ad8', heal: 28 });
act3({ id: 'fi_sailfish', st: 'fish', name: 'Deep sea (sailfish)', lvl: 100, xp: 190, hp: effort(190, 9), out: { raw_sailfish: 1 }, icon: 'raw_sailfish' });
act3({ id: 'c_sailfish', st: 'range', name: 'Cook sailfish', lvl: 100, xp: 290, hp: 6, inp: { raw_sailfish: 1 }, out: { sailfish: 1 }, burn: 118, icon: 'sailfish' });
COURSES.push({ id: 'prif', name: 'Prifddinas course', lvl: 100, xp: 1350, hp: 34, mark: 1 / 5 });
act3({ id: 'ag_prif', st: 'course', name: 'Prifddinas course', lvl: 100, xp: 1350, hp: 34, out: {}, course: COURSES[COURSES.length - 1], icon: '__ag' });
const ELF_LORD = { id: 'elf_lord', name: 'Pickpocket elf lord', lvl: 100, xp: 460, hp: 14, coins: [500, 900], icon: '🧝‍♂️', loot: [['crystal_shard', 1 / 20, 1, 2], ['onyx', 1 / 1500, 1, 1]], clue: ['elite', 1 / 250] };
THIEVING.push(ELF_LORD); item('__elf_lord', ELF_LORD.name, 0, { emoji: ELF_LORD.icon, hidden: true, untradeable: true });
act3({ id: 't_elf_lord', st: 'thieve', name: ELF_LORD.name, lvl: 100, xp: 460, hp: 14, out: {}, thieve: ELF_LORD, icon: '__elf_lord' });
MONSTERS.push({ id: 'ripper_demon', name: 'Ripper Demon', icon: '👹', hue: 200, lvl: 287, sl: 105, hp: 320, atk: 240, def: 210, mh: 22, spd: 2.4, coins: [600, 5000], area: 'slayer', weak: 'magic',
  drops: [['ashes', 1, 2, 4], ['primal_ore', 1 / 4, 3, 8], ['zenyte_shard', 1 / 400, 1, 1], ['dragon_claws', 1 / 600, 1, 1]] });
MONSTERS.push({ id: 'primal_golem', name: 'Primal Golem', icon: '🗿', hue: 20, lvl: 190, hp: 230, atk: 170, def: 260, mh: 18, spd: 3, coins: [400, 3000], area: 'overworld', weak: 'magic',
  drops: [['primal_ore', 1 / 2, 2, 5], ['primal_bar', 1 / 30, 1, 2], ['clue_hard', 1 / 100, 1, 1]] });

/* Archaeology: damaged artifacts → restore → museum */
DIGSITES.push({ id: 'senntisten', name: 'Senntisten Temple', lvl: 110, xp: 650, mat: ['senntisten_relic', 'Senntisten relic', 700], tint: '#c8a8e8',
  arts: [['zarosian_idol', 'Zarosian idol'], ['ancient_censer', 'Ancient censer'], ['zaros_crest', 'Crest of Zaros']], buff: { type: 'luck', mult: 1.1, desc: 'Rare drops 10% more likely' } });
{ const d = DIGSITES[DIGSITES.length - 1]; d.hp = effort(d.xp, 8);
  item(d.mat[0], d.mat[1], d.mat[2], { cat: 'arch', kind: 'material', tint: d.tint });
  d.arts.forEach(([id, name]) => item(id, name, d.mat[2] * 60, { cat: 'arch', kind: 'artifact', tint: d.tint, rare: true }));
  act3({ id: 'd_' + d.id, st: 'dig', site: d.id, name: d.name, lvl: d.lvl, xp: d.xp, hp: d.hp, out: { [d.mat[0]]: 1 }, icon: d.arts[0][0] }); }
DIGSITES.forEach((d, i) => d.arts.forEach(([id, name]) => {
  item('damaged_' + id, 'Damaged ' + name.toLowerCase(), Math.round(ITEMS[id].value * 0.2), { cat: 'arch', kind: 'artifact', tint: mixHexSafe(d.tint, '#3a3026', 0.55) });
  act3({ id: 'r_' + id, st: 'restore', name: 'Restore ' + name.toLowerCase(), lvl: d.lvl, xp: d.xp * 5, hp: 4 + i * 2, inp: { ['damaged_' + id]: 1, [d.mat[0]]: 4 + i * 2 }, out: { [id]: 1 }, icon: id });
}));
function mixHexSafe(a, b, t) { const p = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }; const A = p(a), B = p(b); return '#' + A.map((v, k) => Math.round(v + (B[k] - v) * t).toString(16).padStart(2, '0')).join(''); }
STATION_ACTIONS.restore.sort((a, b) => a.lvl - b.lvl);
['mine', 'forest', 'fish', 'range', 'fire', 'fletch', 'dig', 'furnace', 'anvil', 'thieve', 'course'].forEach(st => STATION_ACTIONS[st].sort((a, b) => a.lvl - b.lvl));
SKILL_ORDER.filter(s => MAX_LVL[s] === 120).forEach(s => ach('lvl120_' + s, `True ${SKILLS[s].name.toLowerCase()} master`, `Reach level 120 ${SKILLS[s].name}`, SKILLS[s].icon, g => g.LV[s] >= 120, 8));

/* Re-index monsters added in this file */
for (const m of MONSTERS) MONSTER_BY_ID[m.id] = m;
