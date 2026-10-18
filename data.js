'use strict';
/* =========================================================
   CLICKSCAPE — game data
   Everything tunable lives here: skills, items, actions,
   monsters, shop, upgrades. Edit numbers to rebalance.
   ========================================================= */

const SKILLS = {
  attack:      { name: 'Attack',      icon: '⚔️' },
  hitpoints:   { name: 'Hitpoints',   icon: '❤️' },
  mining:      { name: 'Mining',      icon: '⛏️' },
  strength:    { name: 'Strength',    icon: '💪' },
  agility:     { name: 'Agility',     icon: '🏃' },
  smithing:    { name: 'Smithing',    icon: '🔨' },
  defence:     { name: 'Defence',     icon: '🛡️' },
  herblore:    { name: 'Herblore',    icon: '🧪' },
  fishing:     { name: 'Fishing',     icon: '🎣' },
  ranged:      { name: 'Ranged',      icon: '🎯' },
  thieving:    { name: 'Thieving',    icon: '🦹' },
  cooking:     { name: 'Cooking',     icon: '🍳' },
  prayer:      { name: 'Prayer',      icon: '🙏' },
  crafting:    { name: 'Crafting',    icon: '🧵' },
  firemaking:  { name: 'Firemaking',  icon: '🔥' },
  magic:       { name: 'Magic',       icon: '🔮' },
  fletching:   { name: 'Fletching',   icon: '🏹' },
  woodcutting: { name: 'Woodcutting', icon: '🪓' },
  archaeology: { name: 'Archaeology', icon: '🏺' },
  slayer:      { name: 'Slayer',      icon: '💀' },
  farming:     { name: 'Farming',     icon: '🌱' },
};
const SKILL_ORDER = Object.keys(SKILLS);
const COMBAT_SKILLS = ['attack', 'strength', 'defence', 'hitpoints', 'slayer', 'ranged', 'magic'];

/* Stations are the "machines" you tap and hire workers for. */
const STATIONS = {
  mine:    { skill: 'mining',      name: 'Mine',      verb: 'Mine',     tool: 'pickaxe', worker: 'Dwarf Miner',      wicon: '🧔', wbase: 15, upg: "Prospector's" },
  furnace: { skill: 'smithing',    name: 'Furnace',   verb: 'Smelt',    worker: 'Furnace Stoker',   wicon: '👨‍🏭', wbase: 40, upg: 'Bellows' },
  anvil:   { skill: 'smithing',    name: 'Anvil',     verb: 'Smith',    worker: 'Apprentice Smith', wicon: '👷', wbase: 80, upg: "Hammer" },
  forest:  { skill: 'woodcutting', name: 'Forest',    verb: 'Chop',     tool: 'hatchet', worker: 'Lumberjack',       wicon: '🧑', wbase: 15, upg: "Lumberjack's" },
  fire:    { skill: 'firemaking',  name: 'Fire pit',  verb: 'Burn',     worker: 'Fire Tender',      wicon: '🧒', wbase: 30, upg: 'Kindling' },
  fish:    { skill: 'fishing',     name: 'Fishing spot', verb: 'Fish',  tool: 'rod',     worker: 'Fisherman',        wicon: '🧓', wbase: 25, upg: "Angler's" },
  range:   { skill: 'cooking',     name: 'Range',     verb: 'Cook',     worker: 'Cook',             wicon: '🧑‍🍳', wbase: 30, upg: "Chef's" },
  altar:   { skill: 'prayer',      name: 'Gilded altar', verb: 'Offer', worker: 'Acolyte',          wicon: '🧑‍🦲', wbase: 50, upg: 'Devotion' },
  herb:    { skill: 'herblore',    name: 'Apothecary', verb: 'Mix',   worker: 'Herbalist',        wicon: '🧑‍⚕️', wbase: 60, upg: "Herbalist's" },
  craft:   { skill: 'crafting',    name: 'Crafting table', verb: 'Craft', worker: 'Artisan',      wicon: '🧑‍🎨', wbase: 50, upg: "Artisan's" },
  fletch:  { skill: 'fletching',   name: 'Fletching bench', verb: 'Fletch', worker: 'Fletcher',   wicon: '🧝', wbase: 40, upg: "Fletcher's" },
  thieve:  { skill: 'thieving',    name: 'Marketplace', verb: 'Steal', worker: 'Apprentice thief', wicon: '🥷', wbase: 30, upg: "Rogue's" },
  course:  { skill: 'agility',     name: 'Agility course', verb: 'Run', worker: 'Pacer',          wicon: '🏃', wbase: 45, upg: "Runner's" },
  restore: { skill: 'archaeology', name: 'Restoration bench', verb: 'Restore', worker: 'Conservator', wicon: '🧑‍🔧', wbase: 80, upg: "Conservator's" },
  dig:     { skill: 'archaeology', name: 'Dig site',  verb: 'Excavate', tool: 'mattock', worker: 'Field Assistant',  wicon: '🧑‍🔬', wbase: 60, upg: "Excavator's" },
};
const STATION_ORDER = ['mine', 'forest', 'fish', 'dig', 'restore', 'thieve', 'course', 'furnace', 'anvil', 'craft', 'fletch', 'herb', 'range', 'fire', 'altar'];
const SKILL_STATIONS = {};
for (const [id, s] of Object.entries(STATIONS)) (SKILL_STATIONS[s.skill] ||= []).push(id);

/* ---------- Items ---------- */
const ITEMS = {};
function item(id, name, value, o = {}) { ITEMS[id] = { id, name, value, cat: 'misc', ...o }; return ITEMS[id]; }

/* Ores */
const ORES = [
  { id: 'copper_ore',     name: 'Copper ore',     rock: 'Copper rock',     lvl: 1,  xp: 17.5, hp: 4,  v: 3,   tint: '#c8743a' },
  { id: 'tin_ore',        name: 'Tin ore',        rock: 'Tin rock',        lvl: 1,  xp: 17.5, hp: 4,  v: 3,   tint: '#b7b7b0' },
  { id: 'iron_ore',       name: 'Iron ore',       rock: 'Iron rock',       lvl: 15, xp: 35,   hp: 8,  v: 12,  tint: '#8a4433' },
  { id: 'silver_ore',     name: 'Silver ore',     rock: 'Silver rock',     lvl: 20, xp: 40,   hp: 12, v: 30,  tint: '#e6e6ee' },
  { id: 'coal',           name: 'Coal',           rock: 'Coal rock',       lvl: 30, xp: 50,   hp: 14, v: 20,  tint: '#151515' },
  { id: 'gold_ore',       name: 'Gold ore',       rock: 'Gold rock',       lvl: 40, xp: 65,   hp: 18, v: 45,  tint: '#ffc62e' },
  { id: 'mithril_ore',    name: 'Mithril ore',    rock: 'Mithril rock',    lvl: 55, xp: 80,   hp: 30, v: 70,  tint: '#4747e6' },
  { id: 'adamantite_ore', name: 'Adamantite ore', rock: 'Adamantite rock', lvl: 70, xp: 95,   hp: 50, v: 150, tint: '#3c9c4c' },
  { id: 'runite_ore',     name: 'Runite ore',     rock: 'Runite rock',     lvl: 85, xp: 125,  hp: 90, v: 450, tint: '#47c8d8' },
];
// Higher tiers take more effort but give slightly more XP per unit of effort.
const effort = (xp, tier) => Math.max(3, Math.round(xp / (3 + tier * 0.6)));
ORES.forEach((o, i) => { o.hp = effort(o.xp, Math.max(0, i - 1)); });
ORES.forEach(o => item(o.id, o.name, o.v, { cat: 'ore', kind: 'ore', tint: o.tint }));

/* Metals: smelt ores -> bars, then anvil bars -> gear at each tier */
const METALS = [
  { id: 'bronze',  name: 'Bronze',  tint: '#a8703a', lvl: 1,  tier: 1, eq: 1,  ores: { copper_ore: 1, tin_ore: 1 },     sxp: 6.2,  bv: 12,   fxp: 12.5 },
  { id: 'iron',    name: 'Iron',    tint: '#6a6462', lvl: 15, tier: 2, eq: 1,  ores: { iron_ore: 1 },                  sxp: 12.5, bv: 30,   fxp: 25 },
  { id: 'steel',   name: 'Steel',   tint: '#a6abb2', lvl: 30, tier: 3, eq: 5,  ores: { iron_ore: 1, coal: 2 },         sxp: 17.5, bv: 80,   fxp: 37.5 },
  { id: 'mithril', name: 'Mithril', tint: '#3a3ab4', lvl: 50, tier: 4, eq: 20, ores: { mithril_ore: 1, coal: 4 },      sxp: 30,   bv: 260,  fxp: 50 },
  { id: 'adamant', name: 'Adamant', tint: '#2e6a3a', lvl: 70, tier: 5, eq: 30, ores: { adamantite_ore: 1, coal: 6 },   sxp: 37.5, bv: 600,  fxp: 62.5 },
  { id: 'rune',    name: 'Rune',    tint: '#3aa4b4', lvl: 85, tier: 6, eq: 40, ores: { runite_ore: 1, coal: 8 },       sxp: 50,   bv: 1900, fxp: 75 },
];
const PRECIOUS = [
  { id: 'silver', name: 'Silver', tint: '#dcdce6', lvl: 20, ores: { silver_ore: 1 }, sxp: 13.7, bv: 70 },
  { id: 'gold',   name: 'Gold',   tint: '#f0b81e', lvl: 40, ores: { gold_ore: 1 },   sxp: 22.5, bv: 110 },
];
[...METALS, ...PRECIOUS].forEach(m => item(m.id + '_bar', m.name + ' bar', m.bv, { cat: 'bar', kind: 'bar', tint: m.tint }));

const TOOL_MULT = [0, 1, 1.5, 2, 3, 4.5, 7, 10]; // by tier; 7 = dragon
const SMITH_ITEMS = [
  { k: 'dagger',     name: 'dagger',     bars: 1, off: 0,  slot: 'weapon', atk: 4, str: 3 },
  { k: 'hatchet',    name: 'hatchet',    bars: 1, off: 1,  slot: 'hatchet', tool: 'woodcutting' },
  { k: 'scimitar',   name: 'scimitar',   bars: 2, off: 5,  slot: 'weapon', atk: 8, str: 7 },
  { k: 'pickaxe',    name: 'pickaxe',    bars: 2, off: 6,  slot: 'pickaxe', tool: 'mining' },
  { k: 'full_helm',  name: 'full helm',  bars: 2, off: 7,  slot: 'head',   def: 3 },
  { k: 'kiteshield', name: 'kiteshield', bars: 3, off: 12, slot: 'shield', def: 5 },
  { k: 'platelegs',  name: 'platelegs',  bars: 3, off: 16, slot: 'legs',   def: 6 },
  { k: 'platebody',  name: 'platebody',  bars: 5, off: 18, slot: 'body',   def: 9 },
];
function gearStats(si, tier) {
  const f = tier === 7 ? 7.5 : tier;
  return { atk: Math.round((si.atk || 0) * f), str: Math.round((si.str || 0) * f), def: Math.round((si.def || 0) * f) };
}
function gearReq(si, eqLvl) {
  if (si.tool) return { [si.tool]: eqLvl };
  return { [si.slot === 'weapon' ? 'attack' : 'defence']: eqLvl };
}
METALS.forEach(m => SMITH_ITEMS.forEach(si => {
  const name = m.name + ' ' + si.name;
  item(m.id + '_' + si.k, name, Math.round(si.bars * m.bv * 1.25), {
    cat: si.tool ? 'tool' : 'gear', kind: si.k, tint: m.tint, slot: si.slot, tier: m.tier, spd: si.k === 'dagger' ? 0.85 : undefined,
    mult: si.tool ? TOOL_MULT[m.tier] : undefined,
    ...gearStats(si, m.tier), req: gearReq(si, m.eq),
  });
}));
/* Dragon tier — drop only */
const DRAGON_TINT = '#b3261e';
SMITH_ITEMS.forEach(si => {
  item('dragon_' + si.k, 'Dragon ' + si.name, Math.round(si.bars * 30000), {
    cat: si.tool ? 'tool' : 'gear', kind: si.k, tint: DRAGON_TINT, slot: si.slot, tier: 7, rare: true, spd: si.k === 'dagger' ? 0.85 : undefined,
    mult: si.tool ? TOOL_MULT[7] : undefined, ...gearStats(si, 7), req: gearReq(si, 60),
  });
});


/* Fishing rods & archaeology mattocks (shop) */
const RODS = [
  { id: 'basic_rod',       name: 'Fishing rod',     lvl: 1,  mult: 1,   price: 10,      tint: '#8a5a2b', kind: 'rod' },
  { id: 'fly_rod',         name: 'Fly fishing rod', lvl: 20, mult: 1.5, price: 400,     tint: '#a0703a', kind: 'rod' },
  { id: 'harpoon',         name: 'Harpoon',         lvl: 35, mult: 2.5, price: 3000,    tint: '#9aa0a8', kind: 'harpoon' },
  { id: 'barbed_harpoon',  name: 'Barbed harpoon',  lvl: 55, mult: 4,   price: 30000,   tint: '#3a3ab4', kind: 'harpoon' },
  { id: 'crystal_harpoon', name: 'Crystal harpoon', lvl: 75, mult: 7,   price: 400000,  tint: '#7fe0ff', kind: 'harpoon' },
  { id: 'dragon_harpoon',  name: 'Dragon harpoon',  lvl: 61, mult: 10,  price: 0,       tint: DRAGON_TINT, kind: 'harpoon', rare: true },
];
RODS.forEach(r => item(r.id, r.name, Math.max(5, Math.round(r.price / 3) || 40000), { cat: 'tool', kind: r.kind, tint: r.tint, slot: 'rod', mult: r.mult, req: { fishing: r.lvl }, rare: r.rare }));
const MATTOCKS = [
  { m: 'bronze', lvl: 1, mult: 1, price: 15 }, { m: 'iron', lvl: 15, mult: 1.5, price: 500 },
  { m: 'steel', lvl: 30, mult: 2, price: 3000 }, { m: 'mithril', lvl: 45, mult: 3, price: 25000 },
  { m: 'adamant', lvl: 60, mult: 4.5, price: 150000 }, { m: 'rune', lvl: 75, mult: 7, price: 900000 },
];
MATTOCKS.forEach(t => {
  const metal = METALS.find(x => x.id === t.m);
  item(t.m + '_mattock', metal.name + ' mattock', Math.round(t.price / 3), { cat: 'tool', kind: 'mattock', tint: metal.tint, slot: 'mattock', mult: t.mult, req: { archaeology: t.lvl }, price: t.price });
});

/* Logs */
const TREES = [
  { id: 'logs',        tree: 'Tree',        name: 'Logs',        lvl: 1,  xp: 25,   hp: 5,   v: 4,   fxp: 40,  tint: '#8a5a2b' },
  { id: 'oak_logs',    tree: 'Oak tree',    name: 'Oak logs',    lvl: 15, xp: 37.5, hp: 10,  v: 12,  fxp: 60,  tint: '#a8783e' },
  { id: 'willow_logs', tree: 'Willow tree', name: 'Willow logs', lvl: 30, xp: 67.5, hp: 16,  v: 18,  fxp: 90,  tint: '#7d8a3e' },
  { id: 'maple_logs',  tree: 'Maple tree',  name: 'Maple logs',  lvl: 45, xp: 100,  hp: 26,  v: 35,  fxp: 135, tint: '#c0602a' },
  { id: 'yew_logs',    tree: 'Yew tree',    name: 'Yew logs',    lvl: 60, xp: 175,  hp: 45,  v: 90,  fxp: 202, tint: '#5a3a1e' },
  { id: 'magic_logs',  tree: 'Magic tree',  name: 'Magic logs',  lvl: 75, xp: 250,  hp: 80,  v: 320, fxp: 303, tint: '#3e6cc0' },
  { id: 'elder_logs',  tree: 'Elder tree',  name: 'Elder logs',  lvl: 90, xp: 325,  hp: 140, v: 900, fxp: 450, tint: '#8a2a5e' },
];
TREES.forEach((t, i) => { t.hp = effort(t.xp, i); item(t.id, t.name, t.v, { cat: 'log', kind: 'log', tint: t.tint }); });
item('ashes', 'Ashes', 2, { cat: 'farm', kind: 'ashes', tint: '#888' });

/* Fish */
const FISH = [
  { id: 'shrimp',    name: 'Shrimps',   spot: 'Net fishing (shrimps)',  lvl: 1,  xp: 10,  hp: 5,  v: 3,   clvl: 1,  cxp: 30,  heal: 3,  stop: 34, tint: '#f28a7a' },
  { id: 'sardine',   name: 'Sardine',   spot: 'Bait fishing (sardine)', lvl: 5,  xp: 20,  hp: 6,  v: 5,   clvl: 1,  cxp: 40,  heal: 4,  stop: 38, tint: '#9fb4c8' },
  { id: 'trout',     name: 'Trout',     spot: 'Fly fishing (trout)',    lvl: 20, xp: 50,  hp: 10, v: 12,  clvl: 15, cxp: 70,  heal: 7,  stop: 50, tint: '#a8b890' },
  { id: 'salmon',    name: 'Salmon',    spot: 'Fly fishing (salmon)',   lvl: 30, xp: 70,  hp: 14, v: 20,  clvl: 25, cxp: 90,  heal: 9,  stop: 58, tint: '#e89a7a' },
  { id: 'lobster',   name: 'Lobster',   spot: 'Cage fishing (lobster)', lvl: 40, xp: 90,  hp: 20, v: 45,  clvl: 40, cxp: 120, heal: 12, stop: 74, tint: '#c8443a' },
  { id: 'swordfish', name: 'Swordfish', spot: 'Harpoon (swordfish)',    lvl: 50, xp: 100, hp: 28, v: 80,  clvl: 45, cxp: 140, heal: 14, stop: 86, tint: '#6a8ab8' },
  { id: 'monkfish',  name: 'Monkfish',  spot: 'Net fishing (monkfish)', lvl: 62, xp: 120, hp: 36, v: 120, clvl: 62, cxp: 150, heal: 16, stop: 92, tint: '#8a7a6a' },
  { id: 'shark',     name: 'Shark',     spot: 'Harpoon (shark)',        lvl: 76, xp: 110, hp: 50, v: 260, clvl: 80, cxp: 210, heal: 20, stop: 99, tint: '#7a8a9a' },
  { id: 'manta_ray', name: 'Manta ray', spot: 'Deep sea trawling (manta ray)', lvl: 81, xp: 140, v: 400, clvl: 91, cxp: 216, heal: 22, stop: 99, tint: '#3a4a6a' },
  { id: 'anglerfish', name: 'Anglerfish', spot: 'Bait fishing (anglerfish)', lvl: 82, xp: 150, v: 500, clvl: 84, cxp: 230, heal: 24, stop: 99, tint: '#8a6a4a' },
];
FISH.forEach((f, i) => {
  f.hp = effort(f.xp, i);
  item('raw_' + f.id, 'Raw ' + f.name.toLowerCase(), f.v, { cat: 'fish', kind: 'fish', tint: f.tint });
  item(f.id, f.name, Math.round(f.v * 1.8) + 1, { cat: 'food', kind: 'cookedfish', tint: f.tint, heal: f.heal });
});
item('burnt_fish', 'Burnt food', 1, { cat: 'food', kind: 'burnt', tint: '#2a1a10' });
item('raw_chicken', 'Raw chicken', 2, { cat: 'fish', emoji: '🍗' });
item('cooked_chicken', 'Cooked chicken', 4, { cat: 'food', emoji: '🍗', heal: 3 });
item('raw_beef', 'Raw beef', 2, { cat: 'fish', emoji: '🥩' });
item('cooked_meat', 'Cooked meat', 4, { cat: 'food', emoji: '🍖', heal: 3 });

/* Farming */
const CROPS = [
  { id: 'potato',     name: 'Potato',     emoji: '🥔', lvl: 1,  time: 60,   pxp: 8,     hxp: 9,     y: [3, 6], seed: 2,     v: 3 },
  { id: 'onion',      name: 'Onion',      emoji: '🧅', lvl: 5,  time: 120,  pxp: 9.5,   hxp: 10.5,  y: [3, 6], seed: 5,     v: 6 },
  { id: 'cabbage',    name: 'Cabbage',    emoji: '🥬', lvl: 7,  time: 180,  pxp: 10,    hxp: 11.5,  y: [3, 7], seed: 8,     v: 8 },
  { id: 'guam',       name: 'Guam leaf',  herb: '#4caf50', lvl: 9, time: 480, pxp: 11, hxp: 12.5, y: [2, 5], seed: 25, v: 30 },
  { id: 'tomato',     name: 'Tomato',     emoji: '🍅', lvl: 12, time: 300,  pxp: 12.5,  hxp: 14,    y: [3, 7], seed: 20,    v: 15 },
  { id: 'strawberry', name: 'Strawberry', emoji: '🍓', lvl: 31, time: 900,  pxp: 26,    hxp: 29,    y: [4, 8], seed: 120,   v: 55 },
  { id: 'ranarr',     name: 'Ranarr weed', herb: '#2e7d32', lvl: 32, time: 1500, pxp: 27, hxp: 30.5, y: [2, 5], seed: 600, v: 300 },
  { id: 'watermelon', name: 'Watermelon', emoji: '🍉', lvl: 47, time: 1800, pxp: 48.5,  hxp: 54.5,  y: [4, 8], seed: 500,   v: 180 },
  { id: 'snapdragon', name: 'Snapdragon', herb: '#c2185b', lvl: 62, time: 3000, pxp: 87.5, hxp: 98.5, y: [2, 5], seed: 4000, v: 1500 },
  { id: 'torstol',    name: 'Torstol',    herb: '#6a1b9a', lvl: 85, time: 6000, pxp: 199.5, hxp: 224.5, y: [2, 5], seed: 25000, v: 7000 },
];
CROPS.forEach(c => {
  item(c.id + '_seed', c.name.replace(' leaf', '').replace(' weed', '') + ' seed', Math.max(1, Math.round(c.seed / 3)), { cat: 'farm', kind: 'seed', tint: c.herb || '#b08a4a' });
  item(c.id, c.name, c.v, c.emoji ? { cat: 'farm', emoji: c.emoji, heal: c.emoji ? 2 : 0 } : { cat: 'farm', kind: 'herb', tint: c.herb });
});
const PLOT_COSTS = [0, 0, 1000, 5000, 25000, 100000, 500000, 2000000];

/* Archaeology dig sites, materials & artifact collections */
const DIGSITES = [
  { id: 'quarry',  name: 'Ancient Quarry',     lvl: 1,  xp: 8,   hp: 6,   mat: ['clay_shard', 'Clay shard', 4],                   tint: '#b5835a',
    arts: [['chipped_arrowhead', 'Chipped arrowhead'], ['clay_idol', 'Clay idol'], ['rusty_coin', 'Rusty coin']],
    buff: { type: 'station', st: 'mine', mult: 1.25, desc: '+25% Mining speed' } },
  { id: 'sunken',  name: 'Sunken Village',     lvl: 20, xp: 25,  hp: 15,  mat: ['coral_fragment', 'Coral fragment', 10],          tint: '#e07a6a',
    arts: [['fishermans_charm', "Fisherman's charm"], ['net_weight', 'Old net weight'], ['barnacled_bell', 'Barnacled bell']],
    buff: { type: 'station', st: 'fish', mult: 1.25, desc: '+25% Fishing speed' } },
  { id: 'grove',   name: 'Druidic Grove',      lvl: 35, xp: 45,  hp: 25,  mat: ['druid_amber', 'Druid amber', 20],                tint: '#e0a030',
    arts: [['mossy_totem', 'Mossy totem'], ['druid_sickle', 'Druid sickle'], ['seed_pouch', 'Ancient seed pouch']],
    buff: { type: 'grow', mult: 0.8, desc: 'Crops grow 20% faster' } },
  { id: 'tomb',    name: 'Desert Tomb',        lvl: 50, xp: 80,  hp: 40,  mat: ['sandstone_tablet', 'Sandstone tablet', 40],      tint: '#d8b878',
    arts: [['scarab_amulet', 'Scarab amulet'], ['golden_mask', 'Golden mask'], ['canopic_jar', 'Canopic jar']],
    buff: { type: 'sell', mult: 1.15, desc: '+15% coins from selling' } },
  { id: 'forge',   name: 'Dwarven Forge',      lvl: 65, xp: 130, hp: 60,  mat: ['dwarven_alloy', 'Dwarven alloy', 80],            tint: '#c86a2a',
    arts: [['ancestral_hammer', 'Ancestral hammer'], ['runed_ingot', 'Runed ingot'], ['forge_seal', 'Forge seal']],
    buff: { type: 'stations', sts: ['furnace', 'anvil'], mult: 1.3, desc: '+30% Furnace & Anvil speed' } },
  { id: 'sanctum', name: 'Dragonkin Sanctum',  lvl: 80, xp: 220, hp: 100, mat: ['scale_fragment', 'Dragonkin scale fragment', 160], tint: '#9a2a2a',
    arts: [['dragonkin_tablet', 'Dragonkin tablet'], ['wyrm_idol', 'Wyrm-fang idol'], ['elder_scale', 'Elder scale']],
    buff: { type: 'damage', mult: 1.15, desc: '+15% combat max hit' } },
  { id: 'rift',    name: 'Primordial Rift',    lvl: 95, xp: 400, hp: 160, mat: ['void_dust', 'Void dust', 350],                   tint: '#7a4ac8',
    arts: [['star_shard', 'Star shard'], ['void_lens', 'Void lens'], ['first_rune', 'The First Rune']],
    buff: { type: 'xp', mult: 1.1, desc: '+10% XP in all skills' } },
];
DIGSITES.forEach((d, i) => {
  d.hp = effort(d.xp, i);
  item(d.mat[0], d.mat[1], d.mat[2], { cat: 'arch', kind: 'material', tint: d.tint });
  d.arts.forEach(([id, name]) => item(id, name, d.mat[2] * 60, { cat: 'arch', kind: 'artifact', tint: d.tint, rare: true }));
});

/* Gems, bones, misc drops */
[['sapphire', 'Uncut sapphire', 60, '#2a4ad8'], ['emerald', 'Uncut emerald', 120, '#1ea050'], ['ruby', 'Uncut ruby', 250, '#d0202a'], ['diamond', 'Uncut diamond', 800, '#e8f4ff'], ['dragonstone', 'Uncut dragonstone', 2500, '#a040e0'], ['onyx', 'Uncut onyx', 60000, '#2a2a2a']]
  .forEach(([id, n, v, t]) => item(id, n, v, { cat: 'gem', kind: 'gem', tint: t }));
item('bones', 'Bones', 3, { cat: 'drop', kind: 'bone', tint: '#eee6d0' });
item('big_bones', 'Big bones', 20, { cat: 'drop', kind: 'bone', tint: '#e6dcbc' });
item('wolf_bones', 'Wolf bones', 35, { cat: 'drop', kind: 'bone', tint: '#d8d8d8' });
item('dragon_bones', 'Dragon bones', 600, { cat: 'drop', kind: 'bone', tint: '#c8d878' });
item('feather', 'Feather', 1, { cat: 'drop', emoji: '🪶' });
item('cowhide', 'Cowhide', 8, { cat: 'drop', kind: 'hide', tint: '#e8e0d0' });
item('green_dragonhide', 'Green dragonhide', 400, { cat: 'drop', kind: 'hide', tint: '#3a8a3a' });
item('casket', 'Casket', 50, { cat: 'misc', emoji: '🧰', open: true });
item('bird_nest', "Bird's nest", 30, { cat: 'misc', emoji: '🪺', open: true });
item('mystery_box', 'Mystery box', 500, { cat: 'misc', emoji: '🎁', open: true });

/* =========================================================
   EXPANSION GEAR — beyond rune: dragon → god armour → Torva
   ========================================================= */
// gear(id, name, slot, [atk, str, def], req, extra)
function gear(id, name, slot, [atk, str, def], req, o = {}) {
  return item(id, name, o.value ?? Math.round(400 + Math.pow(atk + str + def, 2) * 8), { cat: 'gear', slot, atk, str, def, req, rare: true, ...o });
}
const GOD_TINT = { bandos: '#8a7440', armadyl: '#e0cc80', saradomin: '#dcdcec', zamorak: '#a02a20', ancient: '#6a3a9a' };

/* Special attacks: cost % energy, hits, damage ×, accuracy × and extras */
const SPECS = {
  dagger: { name: 'Puncture', cost: 25, hits: 2, dmg: 1.15, acc: 1.25 },
  sever:  { name: 'Sever', cost: 55, hits: 1, dmg: 1, acc: 1.25 },
  whip:   { name: 'Energy Drain', cost: 50, hits: 1, dmg: 1, acc: 1.25 },
  claws:  { name: 'Slice and Dice', cost: 50, hits: 4, dmg: 0.75, acc: 1.2 },
  maul:   { name: 'Quick Smash', cost: 50, hits: 1, dmg: 1, acc: 1, instant: true },
  ags:    { name: 'The Judgement', cost: 50, hits: 1, dmg: 1.5, acc: 2 },
  bgs:    { name: 'Warstrike', cost: 50, hits: 1, dmg: 1.21, acc: 2, drain: true },
  sgs:    { name: 'Healing Blade', cost: 50, hits: 1, dmg: 1.1, acc: 2, heal: 0.5 },
  zgs:    { name: 'Ice Cleave', cost: 50, hits: 1, dmg: 1.1, acc: 2, freeze: true },
  ancient:{ name: 'Blood Sacrifice', cost: 50, hits: 1, dmg: 1.1, acc: 2, bleed: 25 },
  sarasword: { name: "Saradomin's Lightning", cost: 100, hits: 1, dmg: 1.5, acc: 1.5 },
  spear:  { name: 'Shove', cost: 25, hits: 1, dmg: 1, acc: 1.5, freeze: true },
  reap:   { name: 'Soul Reap', cost: 50, hits: 3, dmg: 0.8, acc: 1.4 },
};
ITEMS.dragon_dagger.spec = 'dagger';
ITEMS.dragon_scimitar.spec = 'sever';

/* Weapons */
gear('abyssal_whip', 'Abyssal whip', 'weapon', [82, 82, 0], { attack: 70 }, { kind: 'whip', tint: '#3e2a62', spec: 'whip' });
gear('abyssal_dagger', 'Abyssal dagger', 'weapon', [75, 75, 0], { attack: 70 }, { kind: 'dagger', tint: '#4a3a70', spd: 0.85, spec: 'dagger' });
gear('abyssal_tentacle', 'Abyssal tentacle', 'weapon', [90, 86, 0], { attack: 75 }, { kind: 'whip', tint: '#2e6a40', spec: 'whip' });
gear('leaf_bladed_sword', 'Leaf-bladed sword', 'weapon', [67, 71, 0], { attack: 50 }, { kind: 'sword', tint: '#6e8c3a', leaf: true, value: 25000 });
gear('leaf_bladed_battleaxe', 'Leaf-bladed battleaxe', 'weapon', [72, 92, 0], { attack: 65 }, { kind: 'battleaxe', tint: '#6e8c3a', leaf: true, spd: 1.15 });
gear('granite_maul', 'Granite maul', 'weapon', [60, 79, 0], { strength: 50 }, { kind: 'maul', tint: '#8a8a86', spd: 1.2, twoHanded: true, spec: 'maul' });
gear('dragon_claws', 'Dragon claws', 'weapon', [57, 56, 0], { attack: 60 }, { kind: 'claws', tint: DRAGON_TINT, spd: 0.85, spec: 'claws', value: 40000000 });
gear('saradomin_sword', 'Saradomin sword', 'weapon', [82, 82, 0], { attack: 70 }, { kind: 'sword', tint: '#e8e8f4', twoHanded: true, spd: 1.1, spec: 'sarasword' });
gear('zamorakian_spear', 'Zamorakian spear', 'weapon', [85, 75, 0], { attack: 70 }, { kind: 'spear', tint: '#8a1a14', twoHanded: true, spear: true, spec: 'spear' });
[['bandos', 'bgs'], ['armadyl', 'ags'], ['saradomin', 'sgs'], ['zamorak', 'zgs'], ['ancient', 'ancient']].forEach(([g, sp]) =>
  gear(g + '_godsword', g[0].toUpperCase() + g.slice(1) + ' godsword', 'weapon', [132, 132, 0], { attack: 75 }, { kind: 'godsword', tint: GOD_TINT[g], twoHanded: true, spd: 1.25, spec: sp, value: g === 'armadyl' ? 30000000 : 15000000 }));
gear('soulreaper_axe', 'Soulreaper axe', 'weapon', [115, 121, 0], { attack: 80 }, { kind: 'battleaxe', tint: '#5a1010', spec: 'reap', value: 80000000 });

/* Armour */
gear('dragon_chainbody', 'Dragon chainbody', 'body', [0, 0, 60], { defence: 60 }, { kind: 'chainbody', tint: DRAGON_TINT });
gear('bandos_chestplate', 'Bandos chestplate', 'body', [0, 4, 98], { defence: 65 }, { kind: 'platebody', tint: GOD_TINT.bandos, value: 18000000 });
gear('bandos_tassets', 'Bandos tassets', 'legs', [0, 2, 71], { defence: 65 }, { kind: 'platelegs', tint: GOD_TINT.bandos, value: 25000000 });
gear('bandos_boots', 'Bandos boots', 'feet', [0, 2, 20], { defence: 65 }, { kind: 'boots', tint: GOD_TINT.bandos });
gear('armadyl_helmet', 'Armadyl helmet', 'head', [0, 0, 26], { defence: 70, ranged: 70 }, { kind: 'coif', tint: GOD_TINT.armadyl, ratk: 10, value: 8000000 });
gear('armadyl_chestplate', 'Armadyl chestplate', 'body', [0, 0, 56], { defence: 70, ranged: 70 }, { kind: 'dhidebody', tint: GOD_TINT.armadyl, ratk: 33, value: 30000000 });
gear('armadyl_chainskirt', 'Armadyl chainskirt', 'legs', [0, 0, 32], { defence: 70, ranged: 70 }, { kind: 'chaps', tint: GOD_TINT.armadyl, ratk: 20, value: 30000000 });
gear('torva_full_helm', 'Torva full helm', 'head', [8, 8, 62], { defence: 80 }, { kind: 'full_helm', tint: '#43404e', value: 120000000 });
gear('torva_platebody', 'Torva platebody', 'body', [12, 8, 120], { defence: 80 }, { kind: 'platebody', tint: '#43404e', value: 180000000 });
gear('torva_platelegs', 'Torva platelegs', 'legs', [8, 6, 88], { defence: 80 }, { kind: 'platelegs', tint: '#43404e', value: 150000000 });
gear('helm_of_neitiznot', 'Helm of Neitiznot', 'head', [0, 3, 31], { defence: 55 }, { kind: 'full_helm', tint: '#b0b0b8', rare: false, value: 16000 });
gear('neitiznot_faceguard', 'Neitiznot faceguard', 'head', [0, 6, 40], { defence: 70 }, { kind: 'full_helm', tint: '#5a6a6e', value: 30000000 });
gear('slayer_helmet', 'Slayer helmet', 'head', [0, 0, 30], { defence: 10 }, { kind: 'full_helm', tint: '#1e1e22', slayerHelm: true, value: 1 });
gear('anti_dragon_shield', 'Anti-dragon shield', 'shield', [0, 0, 7], null, { kind: 'kiteshield', tint: '#c4c4c4', antifire: true, rare: false, value: 600 });
gear('dragonfire_shield', 'Dragonfire shield', 'shield', [0, 0, 70], { defence: 75 }, { kind: 'kiteshield', tint: '#6e3a28', antifire: true, value: 9000000 });
gear('mirror_shield', 'Mirror shield', 'shield', [0, 0, 10], { defence: 20 }, { kind: 'kiteshield', tint: '#dfe8f0', mirror: true, rare: false, value: 1600 });
gear('spirit_shield', 'Spirit shield', 'shield', [0, 0, 39], { defence: 45 }, { kind: 'kiteshield', tint: '#7aa0c4', value: 50000 });
gear('blessed_spirit_shield', 'Blessed spirit shield', 'shield', [0, 0, 53], { defence: 70 }, { kind: 'kiteshield', tint: '#a8c8e8', value: 1500000 });
gear('spectral_spirit_shield', 'Spectral spirit shield', 'shield', [0, 0, 63], { defence: 75 }, { kind: 'kiteshield', tint: '#4a8ab8', value: 30000000 });
gear('elysian_spirit_shield', 'Elysian spirit shield', 'shield', [0, 0, 63], { defence: 75 }, { kind: 'kiteshield', tint: '#f0d050', reduce: 0.15, value: 600000000 });

/* Hands / feet / neck / ring / cape */
gear('leather_gloves', 'Leather gloves', 'hands', [0, 0, 1], null, { kind: 'gloves', tint: '#8a5a2b', rare: false, value: 6 });
gear('leather_boots', 'Leather boots', 'feet', [0, 0, 1], null, { kind: 'boots', tint: '#8a5a2b', rare: false, value: 6 });
gear('barrows_gloves', 'Barrows gloves', 'hands', [12, 12, 12], { defence: 41 }, { kind: 'gloves', tint: '#c8a040', value: 130000 });
gear('ferocious_gloves', 'Ferocious gloves', 'hands', [16, 14, 0], { attack: 80, defence: 80 }, { kind: 'gloves', tint: '#4a6a2a', value: 20000000 });
gear('zaryte_vambraces', 'Zaryte vambraces', 'hands', [18, 2, 8], { defence: 80 }, { kind: 'gloves', tint: '#6a3a8a', value: 60000000 });
gear('rune_boots', 'Rune boots', 'feet', [0, 0, 12], { defence: 40 }, { kind: 'boots', tint: '#3aa4b4', value: 9000 });
gear('dragon_boots', 'Dragon boots', 'feet', [0, 4, 16], { defence: 60 }, { kind: 'boots', tint: DRAGON_TINT, value: 300000 });
gear('primordial_boots', 'Primordial boots', 'feet', [2, 5, 22], { defence: 75, strength: 75 }, { kind: 'boots', tint: '#b02818', value: 30000000 });
gear('amulet_of_strength', 'Amulet of strength', 'neck', [0, 10, 0], null, { kind: 'amulet', tint: '#d0202a', rare: false, value: 1200 });
gear('amulet_of_power', 'Amulet of power', 'neck', [6, 6, 6], null, { kind: 'amulet', tint: '#e8f4ff', rare: false, value: 3000 });
gear('amulet_of_glory', 'Amulet of glory', 'neck', [10, 6, 3], null, { kind: 'amulet', tint: '#a040e0', gemx: 2, value: 12000 });
gear('amulet_of_fury', 'Amulet of fury', 'neck', [10, 8, 15], null, { kind: 'amulet', tint: '#2a2a2a', value: 3000000 });
gear('amulet_of_torture', 'Amulet of torture', 'neck', [15, 10, 5], { attack: 75 }, { kind: 'amulet', tint: '#f09030', value: 15000000 });
gear('warrior_ring', 'Warrior ring', 'ring', [8, 0, 0], null, { kind: 'ring', tint: '#9a6a3a', value: 100000 });
gear('berserker_ring', 'Berserker ring', 'ring', [0, 6, 0], null, { kind: 'ring', tint: '#7a4a3a', value: 3000000 });
gear('ring_of_wealth', 'Ring of wealth', 'ring', [0, 0, 0], null, { kind: 'ring', tint: '#a040e0', luck: 1.25, value: 15000 });
gear('fire_cape', 'Fire cape', 'cape', [1, 4, 11], null, { kind: 'cape', tint: '#e8601a', value: 1 });
gear('infernal_cape', 'Infernal cape', 'cape', [2, 8, 12], null, { kind: 'cape', tint: '#b8180c', value: 1 });
const CAPE_TINT = { attack: '#8a1a14', hitpoints: '#d8d8d8', mining: '#2e5a6a', strength: '#1e7a3a', smithing: '#5a5a5a', woodcutting: '#6a8a2a', defence: '#3a5ab8',
  fishing: '#3a7ab8', firemaking: '#e08020', prayer: '#f0f0f0', cooking: '#6a2a8a', farming: '#3a8a3a', slayer: '#1e1e1e', archaeology: '#b8823a',
  agility: '#2a3a8a', herblore: '#2a7a2a', ranged: '#5a6a2a', thieving: '#5a2a5a', crafting: '#8a6a3a', magic: '#3a3ab8', fletching: '#1e5a5a' };
SKILL_ORDER.forEach(s => gear(s + '_cape', SKILLS[s].name + ' cape', 'cape', [0, 0, 9], { [s]: 99 }, { kind: 'cape', tint: CAPE_TINT[s], perk: s, rare: false, value: 99000 }));
gear('max_cape', 'Max cape', 'cape', [5, 5, 12], Object.fromEntries(SKILL_ORDER.map(s => [s, 99])), { kind: 'cape', tint: '#7a1a1a', perk: 'max', value: 2277000 });

/* Slayer equipment */
item('earmuffs', 'Earmuffs', 70, { cat: 'tool', emoji: '🎧' });
item('nose_peg', 'Nose peg', 70, { cat: 'tool', emoji: '📎' });
item('facemask', 'Facemask', 70, { cat: 'tool', emoji: '😷' });
item('rock_hammer', 'Rock hammer', 160, { cat: 'tool', emoji: '🔨' });

/* Drop-only & infernal tools */
item('dragon_mattock', 'Dragon mattock', 3000000, { cat: 'tool', kind: 'mattock', tint: DRAGON_TINT, slot: 'mattock', mult: 10, req: { archaeology: 75 }, rare: true });
item('infernal_pickaxe', 'Infernal pickaxe', 6000000, { cat: 'tool', kind: 'pickaxe', tint: '#e0501a', slot: 'pickaxe', mult: 14, req: { mining: 61, smithing: 85 }, rare: true, bonus: { skill: 'smithing', frac: 0.25, desc: 'Smelts some ore as you mine: +25% of Mining XP as Smithing XP' } });
item('infernal_axe', 'Infernal axe', 6000000, { cat: 'tool', kind: 'hatchet', tint: '#e0501a', slot: 'hatchet', mult: 14, req: { woodcutting: 61, firemaking: 85 }, rare: true, bonus: { skill: 'firemaking', frac: 0.5, desc: 'Burns some logs as you chop: +50% of Woodcutting XP as Firemaking XP' } });
item('infernal_harpoon', 'Infernal harpoon', 6000000, { cat: 'tool', kind: 'harpoon', tint: '#e0501a', slot: 'rod', mult: 14, req: { fishing: 75, cooking: 85 }, rare: true, bonus: { skill: 'cooking', frac: 0.5, desc: 'Cooks some fish as you catch them: +50% of Fishing XP as Cooking XP' } });

/* Components, keys, uniques */
const comp = (id, name, value, kind, tint) => item(id, name, value, { cat: 'misc', kind, tint, rare: true });
[1, 2, 3].forEach(n => comp('godsword_shard_' + n, 'Godsword shard ' + n, 1500000, 'shard', '#c8c8d8'));
comp('godsword_blade', 'Godsword blade', 5000000, 'sword', '#d4d4e2');
['bandos', 'armadyl', 'saradomin', 'zamorak', 'ancient'].forEach(g => comp(g + '_hilt', g[0].toUpperCase() + g.slice(1) + ' hilt', 10000000, 'hilt', GOD_TINT[g]));
['bandos', 'armadyl', 'saradomin', 'zamorak'].forEach(g => comp(g + '_key_piece', g[0].toUpperCase() + g.slice(1) + ' key piece', 50000, 'key', GOD_TINT[g]));
comp('frozen_key', 'Frozen key', 200000, 'key', '#9ad8ff');
comp('smouldering_stone', 'Smouldering stone', 5000000, 'orb', '#e05a10');
comp('primordial_crystal', 'Primordial crystal', 30000000, 'orb', '#d02020');
comp('kraken_tentacle', 'Kraken tentacle', 1000000, 'tentacle', '#2e7a5a');
comp('hydra_leather', 'Hydra leather', 20000000, 'hide', '#4a6a2a');
comp('hydra_claw', "Hydra's claw", 50000000, 'bone', '#7a9a4a');
comp('basilisk_jaw', 'Basilisk jaw', 25000000, 'bone', '#b0a880');
comp('holy_elixir', 'Holy elixir', 1500000, 'orb', '#f4f4ff');
comp('spectral_sigil', 'Spectral sigil', 30000000, 'orb', '#4a8ab8');
comp('elysian_sigil', 'Elysian sigil', 600000000, 'orb', '#f0d040');
comp('draconic_visage', 'Draconic visage', 5000000, 'material', '#8a3a2a');
comp('zenyte_shard', 'Zenyte shard', 8000000, 'shard', '#f09030');

/* More bones (Prayer) */
const BONES = [ // id, name, value, altar xp
  ['bones', '', 3, 15.75], ['wolf_bones', '', 35, 15.75], ['big_bones', '', 20, 52.5], ['dragon_bones', '', 600, 252],
  ['dagannoth_bones', 'Dagannoth bones', 2500, 437.5], ['hydra_bones', 'Hydra bones', 2200, 385], ['ourg_bones', 'Ourg bones', 3000, 490],
];
BONES.forEach(([id, name, v]) => { if (!ITEMS[id]) item(id, name, v, { cat: 'drop', kind: 'bone', tint: '#d8cca0' }); });

/* Jewellery made at the furnace (gold bar + gem) */
const JEWELLERY = [
  { id: 'amulet_of_strength', gem: 'ruby', lvl: 50, xp: 85 },
  { id: 'amulet_of_power', gem: 'diamond', lvl: 70, xp: 100 },
  { id: 'amulet_of_glory', gem: 'dragonstone', lvl: 80, xp: 150 },
  { id: 'ring_of_wealth', gem: 'dragonstone', lvl: 82, xp: 150 },
  { id: 'amulet_of_fury', gem: 'onyx', lvl: 90, xp: 165 },
  { id: 'amulet_of_torture', gem: 'zenyte_shard', lvl: 95, xp: 200 },
];

/* Combine recipes (made from the bank) */
const RECIPES = [
  { out: 'godsword_blade', inp: { godsword_shard_1: 1, godsword_shard_2: 1, godsword_shard_3: 1 } },
  ...['bandos', 'armadyl', 'saradomin', 'zamorak', 'ancient'].map(g => ({ out: g + '_godsword', inp: { godsword_blade: 1, [g + '_hilt']: 1 } })),
  { out: 'frozen_key', inp: { bandos_key_piece: 1, armadyl_key_piece: 1, saradomin_key_piece: 1, zamorak_key_piece: 1 } },
  { out: 'infernal_pickaxe', inp: { dragon_pickaxe: 1, smouldering_stone: 1 } },
  { out: 'infernal_axe', inp: { dragon_hatchet: 1, smouldering_stone: 1 } },
  { out: 'infernal_harpoon', inp: { dragon_harpoon: 1, smouldering_stone: 1 } },
  { out: 'abyssal_tentacle', inp: { abyssal_whip: 1, kraken_tentacle: 1 } },
  { out: 'blessed_spirit_shield', inp: { spirit_shield: 1, holy_elixir: 1 } },
  { out: 'spectral_spirit_shield', inp: { blessed_spirit_shield: 1, spectral_sigil: 1 } },
  { out: 'elysian_spirit_shield', inp: { blessed_spirit_shield: 1, elysian_sigil: 1 } },
  { out: 'dragonfire_shield', inp: { anti_dragon_shield: 1, draconic_visage: 1 } },
  { out: 'primordial_boots', inp: { dragon_boots: 1, primordial_crystal: 1 } },
  { out: 'ferocious_gloves', inp: { hydra_leather: 1 } },
  { out: 'neitiznot_faceguard', inp: { helm_of_neitiznot: 1, basilisk_jaw: 1 } },
];

/* God Wars factions */
const GODS = { bandos: 'Bandos', armadyl: 'Armadyl', saradomin: 'Saradomin', zamorak: 'Zamorak' };
const GWD_KC = 40;

/* Slayer */
const SLAYER_MASTERS = [
  { id: 'turael',   name: 'Turael',   icon: '🧔', cb: 1,   sl: 1,  range: [1, 60],     amt: [10, 30],  pts: 0 },
  { id: 'vannaka',  name: 'Vannaka',  icon: '🥷', cb: 40,  sl: 1,  range: [13, 130],   amt: [25, 60],  pts: 4 },
  { id: 'chaeldar', name: 'Chaeldar', icon: '🧚', cb: 70,  sl: 1,  range: [37, 200],   amt: [40, 90],  pts: 10 },
  { id: 'nieve',    name: 'Nieve',    icon: '🧝‍♀️', cb: 85, sl: 1, range: [60, 300],   amt: [60, 120], pts: 12, boss: true },
  { id: 'duradel',  name: 'Duradel',  icon: '🧙‍♂️', cb: 100, sl: 50, range: [76, 1000], amt: [80, 150], pts: 15, boss: true },
];
const SLAYER_SHOP = [
  { id: 'skip', name: 'Cancel task', icon: '❌', pts: 30, desc: 'Cancel your current task without losing your streak.' },
  { id: 'autopilot', name: 'Slayer Ring Network', icon: '💍', pts: 100, unlock: true, desc: 'When a task ends, your master assigns a new one and you head straight to it.' },
  { id: 'bigger', name: 'Bigger and Badder', icon: '😤', pts: 150, unlock: true, desc: 'Superior versions of task monsters can appear: 2.5× HP, 10× Slayer XP, 4 drop rolls.' },
  { id: 'boss', name: 'Like a Boss', icon: '👑', pts: 200, unlock: true, desc: 'Nieve and Duradel can assign boss tasks.' },
  { id: 'slayer_helmet', name: 'Slayer helmet', icon: '⛑️', pts: 400, item: true, desc: '+16.7% accuracy & damage on task. Counts as earmuffs, nose peg and facemask.' },
];
const SLAYER_GEAR_SHOP = [['earmuffs', 200], ['nose_peg', 200], ['facemask', 200], ['rock_hammer', 500], ['mirror_shield', 5000], ['leaf_bladed_sword', 68000]];

/* ---------- Actions ---------- */
const ACTIONS = {};
function act(o) { ACTIONS[o.id] = o; }
ORES.forEach(o => act({ id: 'm_' + o.id, st: 'mine', name: o.rock, lvl: o.lvl, xp: o.xp, hp: o.hp, out: { [o.id]: 1 }, icon: o.id }));
[...METALS, ...PRECIOUS].sort((a, b) => a.lvl - b.lvl).forEach(m => act({
  id: 's_' + m.id, st: 'furnace', name: m.name + ' bar', lvl: m.lvl, xp: m.sxp, hp: 2 + Math.floor(m.lvl / 25), inp: m.ores, out: { [m.id + '_bar']: 1 }, icon: m.id + '_bar',
}));
METALS.forEach(m => SMITH_ITEMS.forEach(si => act({
  id: 'a_' + m.id + '_' + si.k, st: 'anvil', metal: m.id, name: m.name + ' ' + si.name, lvl: Math.min(99, m.lvl + si.off),
  xp: si.bars * m.fxp, hp: si.bars * 2 + m.tier, inp: { [m.id + '_bar']: si.bars }, out: { [m.id + '_' + si.k]: 1 }, icon: m.id + '_' + si.k,
})));
TREES.forEach(t => act({ id: 'w_' + t.id, st: 'forest', name: t.tree, lvl: t.lvl, xp: t.xp, hp: t.hp, out: { [t.id]: 1 }, icon: t.id }));
TREES.forEach(t => act({ id: 'f_' + t.id, st: 'fire', name: 'Burn ' + t.name.toLowerCase(), lvl: t.lvl, xp: t.fxp, hp: 2 + Math.floor(t.lvl / 30), inp: { [t.id]: 1 }, out: { ashes: 1 }, icon: t.id }));
FISH.forEach(f => act({ id: 'fi_' + f.id, st: 'fish', name: f.spot, lvl: f.lvl, xp: f.xp, hp: f.hp, out: { ['raw_' + f.id]: 1 }, icon: 'raw_' + f.id }));
act({ id: 'c_chicken', st: 'range', name: 'Cook chicken', lvl: 1, xp: 30, hp: 2, inp: { raw_chicken: 1 }, out: { cooked_chicken: 1 }, burn: 34, icon: 'cooked_chicken' });
act({ id: 'c_beef', st: 'range', name: 'Cook meat', lvl: 1, xp: 30, hp: 2, inp: { raw_beef: 1 }, out: { cooked_meat: 1 }, burn: 34, icon: 'cooked_meat' });
FISH.forEach(f => act({ id: 'c_' + f.id, st: 'range', name: 'Cook ' + f.name.toLowerCase(), lvl: f.clvl, xp: f.cxp, hp: 2 + Math.floor(f.clvl / 30), inp: { ['raw_' + f.id]: 1 }, out: { [f.id]: 1 }, burn: f.stop, icon: f.id }));
DIGSITES.forEach(d => act({ id: 'd_' + d.id, st: 'dig', site: d.id, name: d.name, lvl: d.lvl, xp: d.xp, hp: d.hp, out: { [d.mat[0]]: 1 }, icon: d.arts[0][0] }));
BONES.forEach(([id, , , xp]) => act({ id: 'p_' + id, st: 'altar', name: 'Offer ' + ITEMS[id].name.toLowerCase(), lvl: 1, xp, hp: 2, inp: { [id]: 1 }, out: {}, icon: id }));
JEWELLERY.forEach(j => act({ id: 's_' + j.id, st: 'furnace', name: ITEMS[j.id].name, lvl: j.lvl, xp: j.xp, hp: 6, inp: { gold_bar: 1, [j.gem]: 1 }, out: { [j.id]: 1 }, icon: j.id }));
const BONE_XP = Object.fromEntries(BONES.map(b => [b[0], b[3]]));
const STATION_ACTIONS = {};
for (const a of Object.values(ACTIONS)) (STATION_ACTIONS[a.st] ||= []).push(a);
for (const k in STATION_ACTIONS) STATION_ACTIONS[k].sort((a, b) => a.lvl - b.lvl);

/* Skilling bonus drops (per successful gather) */
const BONUS_DROPS = {
  mine:   { chance: 1 / 180, table: [['sapphire', 50], ['emerald', 30], ['ruby', 15], ['diamond', 5], ['dragonstone', 1.5]] },
  forest: { chance: 1 / 220, table: [['bird_nest', 1]] },
  fish:   { chance: 1 / 220, table: [['casket', 1]] },
};

/* ---------- Pets (permanent +10% to a station) ---------- */
const PETS = {
  rock_golem:  { name: 'Pebble the Golem', icon: '🗿', st: 'mine',    chance: 1 / 4000, desc: '+10% Mining speed' },
  beaver:      { name: 'Chompy Beaver',    icon: '🦫', st: 'forest',  chance: 1 / 4000, desc: '+10% Woodcutting speed' },
  heron:       { name: 'Sir Heron',        icon: '🦩', st: 'fish',    chance: 1 / 4000, desc: '+10% Fishing speed' },
  mole:        { name: 'Digby the Mole',   icon: '🦔', st: 'dig',     chance: 1 / 3000, desc: '+10% Archaeology speed' },
  salamander:  { name: 'Ember Salamander', icon: '🦎', st: 'furnace', chance: 1 / 4000, desc: '+10% Furnace speed' },
  golem:       { name: 'Tinker Golem',     icon: '🤖', st: 'anvil',   chance: 1 / 3000, desc: '+10% Anvil speed' },
  phoenix:     { name: 'Phoenix Chick',    icon: '🐤', st: 'fire',    chance: 1 / 4000, desc: '+10% Firemaking speed' },
  kitchen_rat: { name: 'Remy the Rat',     icon: '🐭', st: 'range',   chance: 1 / 4000, desc: '+10% Cooking speed' },
  snail:       { name: 'Sprout Snail',     icon: '🐌', st: 'farm',    chance: 1 / 300,  desc: '+10% crop yield' },
  wyrmling:    { name: 'Wyrmling',         icon: '🐉', st: 'combat',  chance: 0,        desc: '+10% combat max hit' },
  spirit_dove: { name: 'Spirit Dove',      icon: '🕊️', st: 'altar',   chance: 1 / 3000, desc: '+10% Prayer speed' },
  graardor_jr: { name: 'General Graardor Jr.', icon: '🐗', st: 'combat', chance: 0, desc: '+3% combat max hit' },
  kreearra_jr: { name: "Kree'arra Jr.",    icon: '🦅', st: 'combat',  chance: 0, desc: '+3% combat max hit' },
  zilyana_jr:  { name: 'Zilyana Jr.',      icon: '👼', st: 'combat',  chance: 0, desc: '+3% combat max hit' },
  kril_jr:     { name: "K'ril Jr.",        icon: '😈', st: 'combat',  chance: 0, desc: '+3% combat max hit' },
  nexling:     { name: 'Nexling',          icon: '👾', st: 'combat',  chance: 0, desc: '+3% combat max hit' },
  rex_jr:      { name: 'Pet Dagannoth Rex', icon: '🦖', st: 'combat', chance: 0, desc: '+3% combat max hit' },
  hellpuppy:   { name: 'Hellpuppy',        icon: '🐕', st: 'combat',  chance: 0, desc: '+3% combat max hit' },
  pet_kraken:  { name: 'Pet Kraken',       icon: '🦑', st: 'combat',  chance: 0, desc: '+3% combat max hit' },
  ikkle_hydra: { name: 'Ikkle Hydra',      icon: '🐍', st: 'combat',  chance: 0, desc: '+3% combat max hit' },
  dark_core:   { name: 'Pet Dark Core',    icon: '⚫', st: 'combat',  chance: 0, desc: '+3% combat max hit' },
  tzrek_jad:   { name: 'TzRek-Jad',        icon: '🌋', st: 'combat',  chance: 0, desc: '+3% combat max hit' },
  jal_nib_rek: { name: 'Jal-Nib-Rek',      icon: '☄️', st: 'combat',  chance: 0, desc: '+3% combat max hit' },
};

/* ---------- Monsters ---------- */
// drops: [itemId, chance, min, max]
const MONSTERS = [
  { id: 'chicken', name: 'Chicken', icon: '🐔', lvl: 1, hp: 3, atk: 1, def: 1, mh: 1, spd: 2.4,
    drops: [['bones', 1, 1, 1], ['raw_chicken', 1, 1, 1], ['feather', 1, 5, 15]] },
  { id: 'cow', name: 'Cow', icon: '🐄', lvl: 2, hp: 8, atk: 1, def: 1, mh: 1, spd: 2.4,
    drops: [['bones', 1, 1, 1], ['cowhide', 1, 1, 1], ['raw_beef', 1, 1, 1]] },
  { id: 'goblin', name: 'Goblin', icon: '👺', lvl: 5, hp: 12, atk: 4, def: 4, mh: 2, spd: 2.4, coins: [1, 15],
    drops: [['bones', 1, 1, 1], ['potato_seed', 1 / 6, 2, 4], ['bronze_dagger', 1 / 20, 1, 1], ['bronze_full_helm', 1 / 40, 1, 1]] },
  { id: 'skeleton', name: 'Skeleton', icon: '💀', lvl: 13, hp: 18, atk: 12, def: 10, mh: 3, spd: 2.4, coins: [5, 40],
    drops: [['bones', 1, 1, 1], ['iron_ore', 1 / 8, 1, 3], ['guam_seed', 1 / 20, 1, 2], ['iron_dagger', 1 / 30, 1, 1], ['iron_scimitar', 1 / 80, 1, 1]] },
  { id: 'guard', name: 'Guard', icon: '💂', lvl: 21, hp: 22, atk: 18, def: 18, mh: 4, spd: 2.4, coins: [10, 60],
    drops: [['bones', 1, 1, 1], ['tomato_seed', 1 / 12, 1, 3], ['iron_full_helm', 1 / 30, 1, 1], ['steel_dagger', 1 / 40, 1, 1], ['steel_scimitar', 1 / 120, 1, 1]] },
  { id: 'hill_giant', name: 'Hill Giant', icon: '🧌', lvl: 28, hp: 35, atk: 18, def: 26, mh: 5, spd: 2.4, coins: [10, 120],
    drops: [['big_bones', 1, 1, 1], ['iron_ore', 1 / 6, 2, 5], ['strawberry_seed', 1 / 25, 1, 2], ['steel_full_helm', 1 / 60, 1, 1], ['ranarr_seed', 1 / 128, 1, 1]] },
  { id: 'moss_giant', name: 'Moss Giant', icon: '🧌', hue: 70, lvl: 42, hp: 60, atk: 30, def: 30, mh: 7, spd: 2.4, coins: [20, 200],
    drops: [['big_bones', 1, 1, 1], ['coal', 1 / 5, 3, 8], ['watermelon_seed', 1 / 35, 1, 2], ['ranarr_seed', 1 / 80, 1, 1], ['mithril_full_helm', 1 / 128, 1, 1], ['mithril_scimitar', 1 / 200, 1, 1]] },
  { id: 'ice_wolf', name: 'Ice Wolf', icon: '🐺', hue: 180, lvl: 57, hp: 70, atk: 45, def: 40, mh: 8, spd: 1.8, coins: [30, 300],
    drops: [['wolf_bones', 1, 1, 1], ['mithril_ore', 1 / 6, 2, 4], ['raw_shark', 1 / 20, 1, 3], ['snapdragon_seed', 1 / 200, 1, 1], ['adamant_full_helm', 1 / 150, 1, 1]] },
  { id: 'green_dragon', name: 'Green Dragon', icon: '🐉', lvl: 79, hp: 75, atk: 68, def: 68, mh: 10, spd: 3, coins: [50, 500],
    drops: [['dragon_bones', 1, 1, 1], ['green_dragonhide', 1, 1, 1], ['adamant_platebody', 1 / 200, 1, 1], ['rune_scimitar', 1 / 400, 1, 1]] },
  { id: 'lesser_demon', name: 'Lesser Demon', icon: '👹', lvl: 82, hp: 79, atk: 68, def: 71, mh: 9, spd: 2.4, coins: [100, 800],
    drops: [['ashes', 1, 1, 3], ['adamant_bar', 1 / 20, 1, 2], ['rune_full_helm', 1 / 256, 1, 1], ['dragon_dagger', 1 / 600, 1, 1]] },
  { id: 'greater_demon', name: 'Greater Demon', icon: '👿', lvl: 92, hp: 87, atk: 76, def: 81, mh: 11, spd: 2.4, coins: [150, 1200],
    drops: [['ashes', 1, 1, 3], ['rune_bar', 1 / 30, 1, 1], ['rune_full_helm', 1 / 128, 1, 1], ['torstol_seed', 1 / 300, 1, 1], ['dragon_scimitar', 1 / 256, 1, 1]] },
  { id: 'black_demon', name: 'Black Demon', icon: '😈', bright: 0.45, lvl: 172, hp: 157, atk: 145, def: 152, mh: 16, spd: 2.4, coins: [300, 3000],
    drops: [['ashes', 1, 2, 5], ['snapdragon_seed', 1 / 60, 1, 1], ['torstol_seed', 1 / 120, 1, 1], ['rune_platelegs', 1 / 80, 1, 1], ['dragon_hatchet', 1 / 512, 1, 1], ['dragon_dagger', 1 / 200, 1, 1]] },
  { id: 'elder_wyrm', name: 'Elder Wyrm', icon: '🐲', boss: true, lvl: 276, hp: 255, atk: 240, def: 240, mh: 25, spd: 3, coins: [2000, 15000],
    drops: [['dragon_bones', 1, 3, 3], ['runite_ore', 1 / 4, 5, 15], ['dragon_pickaxe', 1 / 150, 1, 1], ['dragon_full_helm', 1 / 180, 1, 1], ['dragon_kiteshield', 1 / 200, 1, 1],
      ['dragon_platelegs', 1 / 200, 1, 1], ['dragon_platebody', 1 / 250, 1, 1], ['dragon_harpoon', 1 / 300, 1, 1], ['pet:wyrmling', 1 / 400, 1, 1]] },
];
/* ---------- Expansion monsters ---------- */
MONSTERS.forEach(m => { m.area = m.boss ? 'bosses' : 'overworld'; });
MONSTERS.find(m => m.id === 'green_dragon').dragon = true;
Object.assign(MONSTERS.find(m => m.id === 'elder_wyrm'), { dragon: true });
const GOD_DROPS = (g, set, extra = []) => [
  [g === 'bandos' ? 'ourg_bones' : 'big_bones', 1, 1, 1], ['rune_bar', 1 / 4, 1, 3],
  ...set.map(id => [id, 1 / 80, 1, 1]), [g + '_hilt', 1 / 250, 1, 1],
  ['godsword_shard_1', 1 / 256, 1, 1], ['godsword_shard_2', 1 / 256, 1, 1], ['godsword_shard_3', 1 / 256, 1, 1],
  [g + '_key_piece', 1 / 40, 1, 1], ...extra,
];
MONSTERS.push(
  // Overworld
  { id: 'rock_crab', name: 'Rock Crab', icon: '🦀', lvl: 13, hp: 50, atk: 1, def: 1, mh: 1, spd: 2.4, area: 'overworld',
    drops: [['raw_lobster', 1 / 8, 1, 1], ['casket', 1 / 100, 1, 1]] },
  { id: 'fire_giant', name: 'Fire Giant', icon: '🧌', hue: 330, lvl: 86, hp: 111, atk: 65, def: 65, mh: 11, spd: 2.4, coins: [50, 600], area: 'overworld',
    drops: [['big_bones', 1, 1, 1], ['coal', 1 / 5, 5, 10], ['ranarr_seed', 1 / 60, 1, 1], ['rune_scimitar', 1 / 200, 1, 1]] },
  { id: 'blue_dragon', name: 'Blue Dragon', icon: '🐉', hue: 190, lvl: 111, hp: 105, atk: 95, def: 95, mh: 10, spd: 3, coins: [100, 900], area: 'overworld', dragon: true,
    drops: [['dragon_bones', 1, 1, 1], ['dragonstone', 1 / 60, 1, 1], ['rune_full_helm', 1 / 150, 1, 1]] },
  { id: 'black_dragon', name: 'Black Dragon', icon: '🐉', bright: 0.35, lvl: 227, hp: 190, atk: 200, def: 200, mh: 18, spd: 3, coins: [300, 3000], area: 'overworld', dragon: true,
    drops: [['dragon_bones', 1, 1, 1], ['dragonstone', 1 / 30, 1, 1], ['rune_platelegs', 1 / 100, 1, 1], ['draconic_visage', 1 / 400, 1, 1]] },

  // Slayer monsters (need Slayer level to damage)
  { id: 'crawling_hand', name: 'Crawling Hand', icon: '✋', lvl: 8, sl: 5, hp: 16, atk: 8, def: 8, mh: 2, spd: 2.4, coins: [5, 50], area: 'slayer',
    drops: [['bones', 1, 1, 1], ['leather_gloves', 1 / 20, 1, 1]] },
  { id: 'cave_crawler', name: 'Cave Crawler', icon: '🐛', lvl: 23, sl: 10, hp: 22, atk: 20, def: 18, mh: 3, spd: 2.4, area: 'slayer',
    drops: [['guam_seed', 1 / 10, 1, 2], ['ranarr_seed', 1 / 200, 1, 1]] },
  { id: 'banshee', name: 'Banshee', icon: '👻', lvl: 23, sl: 15, hp: 22, atk: 22, def: 18, mh: 3, spd: 2.4, coins: [10, 100], area: 'slayer', needs: 'earmuffs',
    drops: [['ranarr_seed', 1 / 80, 1, 1], ['casket', 1 / 60, 1, 1]] },
  { id: 'rockslug', name: 'Rockslug', icon: '🐌', hue: 30, lvl: 29, sl: 20, hp: 27, atk: 25, def: 30, mh: 3, spd: 2.4, area: 'slayer',
    drops: [['iron_ore', 1 / 4, 2, 5], ['coal', 1 / 6, 2, 4]] },
  { id: 'cockatrice', name: 'Cockatrice', icon: '🐓', hue: 120, lvl: 37, sl: 25, hp: 37, atk: 30, def: 30, mh: 4, spd: 2.4, coins: [10, 150], area: 'slayer', needs: 'mirror_shield',
    drops: [['mithril_ore', 1 / 6, 1, 3], ['casket', 1 / 80, 1, 1]] },
  { id: 'pyrefiend', name: 'Pyrefiend', icon: '🔥', lvl: 43, sl: 30, hp: 45, atk: 40, def: 40, mh: 5, spd: 2.4, coins: [20, 200], area: 'slayer',
    drops: [['ashes', 1, 1, 2], ['steel_bar', 1 / 8, 1, 2]] },
  { id: 'basilisk', name: 'Basilisk', icon: '🦎', hue: 60, lvl: 61, sl: 40, hp: 75, atk: 55, def: 70, mh: 8, spd: 2.4, coins: [20, 300], area: 'slayer', needs: 'mirror_shield',
    drops: [['bones', 1, 1, 1], ['mithril_bar', 1 / 10, 1, 1], ['basilisk_jaw', 1 / 300, 1, 1]] },
  { id: 'infernal_mage', name: 'Infernal Mage', icon: '🧙', hue: 300, lvl: 66, sl: 45, hp: 60, atk: 45, def: 45, mh: 8, spd: 2.4, coins: [50, 500], area: 'slayer',
    drops: [['ranarr_seed', 1 / 40, 1, 1], ['rune_bar', 1 / 60, 1, 1]] },
  { id: 'bloodveld', name: 'Bloodveld', icon: '👅', lvl: 76, sl: 50, hp: 120, atk: 75, def: 30, mh: 9, spd: 2.4, coins: [30, 400], area: 'slayer',
    drops: [['big_bones', 1, 1, 1], ['snapdragon_seed', 1 / 200, 1, 1]] },
  { id: 'jelly', name: 'Jelly', icon: '🫧', lvl: 78, sl: 52, hp: 75, atk: 45, def: 120, mh: 8, spd: 2.4, coins: [30, 400], area: 'slayer',
    drops: [['coal', 1 / 4, 3, 6], ['rune_full_helm', 1 / 128, 1, 1]] },
  { id: 'turoth', name: 'Turoth', icon: '🦖', hue: 60, lvl: 87, sl: 55, hp: 76, atk: 70, def: 75, mh: 9, spd: 2.4, coins: [40, 500], area: 'slayer', leaf: true,
    drops: [['snapdragon_seed', 1 / 150, 1, 1], ['leaf_bladed_sword', 1 / 500, 1, 1]] },
  { id: 'aberrant_spectre', name: 'Aberrant Spectre', icon: '👻', hue: 90, lvl: 96, sl: 60, hp: 90, atk: 80, def: 90, mh: 11, spd: 2.4, coins: [40, 500], area: 'slayer', needs: 'nose_peg',
    drops: [['ranarr_seed', 1 / 30, 1, 2], ['snapdragon_seed', 1 / 100, 1, 1], ['torstol_seed', 1 / 400, 1, 1]] },
  { id: 'dust_devil', name: 'Dust Devil', icon: '🌪️', lvl: 93, sl: 65, hp: 105, atk: 105, def: 40, mh: 10, spd: 2.4, coins: [50, 600], area: 'slayer', needs: 'facemask',
    drops: [['adamant_bar', 1 / 10, 1, 2], ['dragonstone', 1 / 120, 1, 1], ['dragon_chainbody', 1 / 400, 1, 1]] },
  { id: 'kurask', name: 'Kurask', icon: '🦎', hue: 140, lvl: 106, sl: 70, hp: 97, atk: 105, def: 105, mh: 12, spd: 2.4, coins: [60, 800], area: 'slayer', leaf: true,
    drops: [['big_bones', 1, 1, 1], ['rune_kiteshield', 1 / 100, 1, 1], ['leaf_bladed_battleaxe', 1 / 400, 1, 1]] },
  { id: 'gargoyle', name: 'Gargoyle', icon: '🗿', lvl: 111, sl: 75, hp: 105, atk: 75, def: 107, mh: 12, spd: 2.4, coins: [100, 1200], area: 'slayer', needs: 'rock_hammer',
    drops: [['gold_bar', 1 / 6, 2, 5], ['rune_platelegs', 1 / 150, 1, 1], ['granite_maul', 1 / 200, 1, 1]] },
  { id: 'nechryael', name: 'Nechryael', icon: '😈', hue: 160, lvl: 115, sl: 80, hp: 105, atk: 90, def: 105, mh: 13, spd: 2.4, coins: [200, 2000], area: 'slayer',
    drops: [['ranarr_seed', 1 / 40, 1, 1], ['rune_boots', 1 / 120, 1, 1]] },
  { id: 'spiritual_mage', name: 'Spiritual Mage', icon: '🧙', lvl: 121, sl: 83, hp: 75, atk: 80, def: 80, mh: 14, spd: 2.4, coins: [100, 900], area: 'slayer',
    drops: [['bones', 1, 1, 1], ['dragon_boots', 1 / 128, 1, 1]] },
  { id: 'abyssal_demon', name: 'Abyssal Demon', icon: '👿', hue: 250, lvl: 124, sl: 85, hp: 150, atk: 97, def: 135, mh: 8, spd: 2.4, coins: [200, 2000], area: 'slayer',
    drops: [['ashes', 1, 1, 1], ['abyssal_whip', 1 / 400, 1, 1], ['abyssal_dagger', 1 / 600, 1, 1]] },
  { id: 'smoke_devil', name: 'Smoke Devil', icon: '💨', lvl: 160, sl: 93, hp: 185, atk: 140, def: 150, mh: 16, spd: 2.4, coins: [300, 3000], area: 'slayer', needs: 'facemask',
    drops: [['torstol_seed', 1 / 150, 1, 1], ['dragon_chainbody', 1 / 300, 1, 1]] },
  { id: 'dark_beast', name: 'Dark Beast', icon: '🦬', bright: 0.4, lvl: 182, sl: 90, hp: 220, atk: 160, def: 170, mh: 17, spd: 2.4, coins: [300, 3000], area: 'slayer',
    drops: [['big_bones', 1, 1, 1], ['rune_platebody', 1 / 150, 1, 1], ['dragon_mattock', 1 / 300, 1, 1]] },

  // God Wars Dungeon — minions give kill count, generals need 40 KC to enter
  { id: 'bandos_ork', name: 'Ork', icon: '👹', hue: 40, lvl: 76, hp: 80, atk: 70, def: 60, mh: 9, spd: 2.4, coins: [20, 300], area: 'gwd', faction: 'bandos', drops: [['big_bones', 1, 1, 1]] },
  { id: 'aviansie', name: 'Aviansie', icon: '🦅', lvl: 79, hp: 70, atk: 75, def: 65, mh: 9, spd: 2.4, coins: [20, 300], area: 'gwd', faction: 'armadyl', drops: [['bones', 1, 1, 1], ['feather', 1, 5, 20]] },
  { id: 'saradomin_knight', name: 'Knight of Saradomin', icon: '🤺', lvl: 80, hp: 75, atk: 80, def: 70, mh: 9, spd: 2.4, coins: [20, 300], area: 'gwd', faction: 'saradomin', drops: [['bones', 1, 1, 1]] },
  { id: 'hellhound', name: 'Hellhound', icon: '🐕', hue: 330, lvl: 122, hp: 116, atk: 105, def: 102, mh: 11, spd: 2.4, coins: [20, 300], area: 'gwd', faction: 'zamorak', drops: [['bones', 1, 1, 1]] },
  { id: 'graardor', name: 'General Graardor', icon: '🦏', boss: true, lvl: 624, hp: 255, atk: 280, def: 250, mh: 35, spd: 3.6, coins: [3000, 20000], area: 'gwd', god: 'bandos',
    drops: GOD_DROPS('bandos', ['bandos_chestplate', 'bandos_tassets', 'bandos_boots'], [['pet:graardor_jr', 1 / 500, 1, 1]]) },
  { id: 'kreearra', name: "Kree'arra", icon: '🦅', hue: 40, boss: true, lvl: 580, hp: 255, atk: 300, def: 230, mh: 32, spd: 3, coins: [3000, 20000], area: 'gwd', god: 'armadyl',
    drops: GOD_DROPS('armadyl', ['armadyl_helmet', 'armadyl_chestplate', 'armadyl_chainskirt'], [['pet:kreearra_jr', 1 / 500, 1, 1]]) },
  { id: 'zilyana', name: 'Commander Zilyana', icon: '👼', boss: true, lvl: 596, hp: 255, atk: 320, def: 220, mh: 30, spd: 2, coins: [3000, 20000], area: 'gwd', god: 'saradomin',
    drops: GOD_DROPS('saradomin', ['saradomin_sword'], [['pet:zilyana_jr', 1 / 500, 1, 1]]) },
  { id: 'kril', name: "K'ril Tsutsaroth", icon: '😈', hue: 340, boss: true, lvl: 650, hp: 255, atk: 300, def: 240, mh: 40, spd: 3, coins: [3000, 20000], area: 'gwd', god: 'zamorak',
    drops: GOD_DROPS('zamorak', ['zamorakian_spear'], [['pet:kril_jr', 1 / 500, 1, 1]]) },
  { id: 'nex', name: 'Nex', icon: '🧛‍♀️', boss: true, lvl: 1001, hp: 600, atk: 600, def: 330, mh: 45, spd: 2.4, coins: [10000, 60000], area: 'gwd', needs: 'frozen_key',
    drops: [['big_bones', 1, 1, 1], ['torva_full_helm', 1 / 100, 1, 1], ['torva_platebody', 1 / 100, 1, 1], ['torva_platelegs', 1 / 100, 1, 1], ['zaryte_vambraces', 1 / 80, 1, 1],
      ['ancient_hilt', 1 / 250, 1, 1], ['dragon_claws', 1 / 200, 1, 1], ['soulreaper_axe', 1 / 400, 1, 1], ['pet:nexling', 1 / 500, 1, 1]] },

  // Bosses
  { id: 'dagannoth_rex', name: 'Dagannoth Rex', icon: '🦖', boss: true, lvl: 303, hp: 255, atk: 250, def: 220, mh: 26, spd: 4, coins: [1000, 8000], area: 'bosses',
    drops: [['dagannoth_bones', 1, 1, 1], ['berserker_ring', 1 / 128, 1, 1], ['warrior_ring', 1 / 128, 1, 1], ['dragon_hatchet', 1 / 128, 1, 1], ['pet:rex_jr', 1 / 500, 1, 1]] },
  { id: 'kraken', name: 'Kraken', icon: '🦑', boss: true, lvl: 291, sl: 87, hp: 255, atk: 150, def: 150, mh: 22, spd: 3, coins: [2000, 10000], area: 'bosses',
    drops: [['raw_shark', 1 / 3, 5, 15], ['kraken_tentacle', 1 / 250, 1, 1], ['pet:pet_kraken', 1 / 1000, 1, 1]] },
  { id: 'cerberus', name: 'Cerberus', icon: '🐕', hue: 330, bright: 0.7, boss: true, lvl: 318, sl: 91, hp: 600, atk: 220, def: 100, mh: 28, spd: 3, coins: [3000, 15000], area: 'bosses',
    drops: [['ashes', 1, 5, 10], ['smouldering_stone', 1 / 128, 1, 1], ['primordial_crystal', 1 / 128, 1, 1], ['pet:hellpuppy', 1 / 500, 1, 1]] },
  { id: 'hydra', name: 'Alchemical Hydra', icon: '🐍', hue: 90, boss: true, lvl: 426, sl: 95, hp: 1100, atk: 300, def: 150, mh: 33, spd: 3, coins: [5000, 30000], area: 'bosses',
    drops: [['hydra_bones', 1, 1, 1], ['hydra_leather', 1 / 150, 1, 1], ['zenyte_shard', 1 / 200, 1, 1], ['hydra_claw', 1 / 500, 1, 1], ['pet:ikkle_hydra', 1 / 600, 1, 1]] },
  { id: 'corp', name: 'Corporeal Beast', icon: '👁️', boss: true, lvl: 785, hp: 2000, atk: 350, def: 310, mh: 50, spd: 3, coins: [10000, 50000], area: 'bosses', corp: true,
    drops: [['spirit_shield', 1 / 40, 1, 1], ['holy_elixir', 1 / 150, 1, 1], ['spectral_sigil', 1 / 300, 1, 1], ['elysian_sigil', 1 / 600, 1, 1], ['pet:dark_core', 1 / 600, 1, 1]] },
  { id: 'jad', name: 'TzTok-Jad', icon: '🌋', boss: true, lvl: 702, hp: 250, atk: 500, def: 480, mh: 60, spd: 4.8, coins: [8000, 16000], area: 'bosses', minCombat: 85,
    drops: [['fire_cape', 1, 1, 1], ['onyx', 1 / 8, 1, 1], ['pet:tzrek_jad', 1 / 200, 1, 1]] },
  { id: 'zuk', name: 'TzKal-Zuk', icon: '☄️', boss: true, lvl: 1400, hp: 1200, atk: 700, def: 600, mh: 70, spd: 6, coins: [50000, 100000], area: 'bosses', minCombat: 110, sacrifice: 'fire_cape',
    drops: [['infernal_cape', 1, 1, 1], ['onyx', 1 / 2, 1, 1], ['zenyte_shard', 1 / 10, 1, 1], ['pet:jal_nib_rek', 1 / 100, 1, 1]] },
);
const AREAS = [['overworld', '🌄 Overworld'], ['slayer', '💀 Slayer'], ['gwd', '⚔️ God Wars'], ['bosses', '👑 Bosses']];

const MONSTER_BY_ID = Object.fromEntries(MONSTERS.map(m => [m.id, m]));

/* ---------- Shop ---------- */
const SHOP = { tools: [], gear: [], food: [], seeds: [] };
METALS.forEach(m => { SHOP.tools.push({ id: m.id + '_pickaxe', price: ITEMS[m.id + '_pickaxe'].value * 3 }); SHOP.tools.push({ id: m.id + '_hatchet', price: ITEMS[m.id + '_hatchet'].value * 3 }); });
RODS.filter(r => r.price).forEach(r => SHOP.tools.push({ id: r.id, price: r.price }));
MATTOCKS.forEach(t => SHOP.tools.push({ id: t.m + '_mattock', price: t.price }));
SHOP.tools.sort((a, b) => a.price - b.price);
['bronze', 'iron', 'steel', 'mithril'].forEach(m => ['dagger', 'scimitar', 'full_helm', 'kiteshield', 'platelegs', 'platebody'].forEach(k => SHOP.gear.push({ id: m + '_' + k, price: ITEMS[m + '_' + k].value * 3 })));
['shrimp', 'trout', 'salmon', 'lobster', 'swordfish', 'shark', 'manta_ray'].forEach(f => SHOP.food.push({ id: f, price: ITEMS[f].value * 4 }));
CROPS.forEach(c => SHOP.seeds.push({ id: c.id + '_seed', price: c.seed }));
[['anti_dragon_shield', 2000], ['leather_gloves', 60], ['leather_boots', 60], ['helm_of_neitiznot', 50000], ['barrows_gloves', 2000000], ['amulet_of_strength', 30000]].forEach(([id, price]) => SHOP.gear.unshift({ id, price }));
SHOP.gear.sort((a, b) => a.price - b.price);
SHOP.capes = [...SKILL_ORDER.map(s => ({ id: s + '_cape', price: 99000 })), { id: 'max_cape', price: 2277000 }];

/* ---------- Upgrades (Cookie Clicker style) ---------- */
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const UPGRADES = [];
STATION_ORDER.forEach(st => {
  const S = STATIONS[st];
  [5, 15, 30, 50, 75].forEach((lv, i) => UPGRADES.push({
    id: `${st}_tap${i}`, name: `${S.upg} Insight ${ROMAN[i]}`, icon: SKILLS[S.skill].icon,
    desc: `Tap power at the ${S.name} ×2`, cost: Math.round(S.wbase * 8 * Math.pow(12, i)),
    req: { skill: S.skill, lvl: lv }, eff: { type: 'tap', st, mult: 2 },
  }));
  [1, 5, 15, 30, 50].forEach((n, i) => UPGRADES.push({
    id: `${st}_crew${i}`, name: `${S.worker} Training ${ROMAN[i]}`, icon: S.wicon,
    desc: `${S.worker}s work twice as fast`, cost: Math.round(S.wbase * 12 * Math.pow(14, i)),
    req: { workers: st, n }, eff: { type: 'crew', st, mult: 2 },
  }));
});
UPGRADES.push(
  { id: 'golden_gloves', name: 'Golden Gloves', icon: '🧤', desc: 'All tap power ×2', cost: 2500, req: { total: 40 }, eff: { type: 'tapall', mult: 2 } },
  { id: 'diamond_gloves', name: 'Diamond Gloves', icon: '💎', desc: 'All tap power ×3', cost: 2500000, req: { total: 400 }, eff: { type: 'tapall', mult: 3 } },
  { id: 'guild_contract', name: 'Guild Contract', icon: '📜', desc: 'All workers +50% speed', cost: 50000, req: { workersTotal: 40 }, eff: { type: 'crewall', mult: 1.5 } },
  { id: 'union_charter', name: 'Workers\' Union Charter', icon: '🏛️', desc: 'All workers ×2 speed', cost: 5000000, req: { workersTotal: 150 }, eff: { type: 'crewall', mult: 2 } },
  { id: 'merchant1', name: "Merchant's Guild Pass", icon: '⚖️', desc: '+20% coins from selling', cost: 5000, req: { earned: 20000 }, eff: { type: 'sell', mult: 1.2 } },
  { id: 'merchant2', name: 'Grand Exchange Seat', icon: '🏦', desc: '+30% coins from selling', cost: 300000, req: { earned: 2000000 }, eff: { type: 'sell', mult: 1.3 } },
  { id: 'wise1', name: "Wise Old Tome", icon: '📖', desc: '+10% XP in all skills', cost: 10000, req: { total: 100 }, eff: { type: 'xp', mult: 1.1 } },
  { id: 'wise2', name: "Tome of the Ancients", icon: '📕', desc: '+20% XP in all skills', cost: 1500000, req: { total: 450 }, eff: { type: 'xp', mult: 1.2 } },
  { id: 'long_rest', name: 'Feather Bed', icon: '🛏️', desc: 'Offline progress cap 8h → 24h', cost: 25000, req: { total: 120 }, eff: { type: 'offline', hours: 24 } },
  { id: 'lucky_charm', name: 'Lucky Rabbit Foot', icon: '🍀', desc: 'Rare drops, artifacts & pets 25% more likely', cost: 100000, req: { kills: 200 }, eff: { type: 'luck', mult: 1.25 } },
  { id: 'ring_wealth', name: 'Ring of Fortune', icon: '💍', desc: 'Rare drops 50% more likely', cost: 3000000, req: { kills: 2000 }, eff: { type: 'luck', mult: 1.5 } },
  { id: 'trainer1', name: 'Combat Trainer I', icon: '🥋', desc: 'Auto-attack every 2.0s (was 2.4s)', cost: 2000, req: { combat: 10 }, eff: { type: 'aspd', val: 2.0 } },
  { id: 'trainer2', name: 'Combat Trainer II', icon: '🥋', desc: 'Auto-attack every 1.6s', cost: 60000, req: { combat: 45 }, eff: { type: 'aspd', val: 1.6 } },
  { id: 'trainer3', name: 'Combat Trainer III', icon: '🥋', desc: 'Auto-attack every 1.2s', cost: 1500000, req: { combat: 85 }, eff: { type: 'aspd', val: 1.2 } },
  { id: 'battle_instinct', name: 'Battle Instinct', icon: '⚡', desc: 'Tapping a monster hits +50% harder', cost: 15000, req: { combat: 30 }, eff: { type: 'tapdmg', mult: 1.5 } },
  { id: 'berserk', name: 'Berserker Necklace', icon: '📿', desc: '+20% max hit', cost: 400000, req: { combat: 70 }, eff: { type: 'damage', mult: 1.2 } },
  { id: 'composter', name: 'Compost Bin', icon: '🪣', desc: '+30% crop yield', cost: 5000, req: { skill: 'farming', lvl: 15 }, eff: { type: 'yield', mult: 1.3 } },
  { id: 'gardener', name: 'Hire a Gardener', icon: '👩‍🌾', desc: 'Ready crops are auto-harvested and replanted (if you have seeds)', cost: 40000, req: { skill: 'farming', lvl: 25 }, eff: { type: 'gardener' } },
  { id: 'greenhouse', name: 'Greenhouse', icon: '🏡', desc: 'Crops grow 25% faster', cost: 250000, req: { skill: 'farming', lvl: 50 }, eff: { type: 'grow', mult: 0.75 } },
  { id: 'gauntlets', name: 'Cooking Gauntlets', icon: '🧤', desc: 'Stop burning food 10 levels earlier', cost: 20000, req: { skill: 'cooking', lvl: 30 }, eff: { type: 'burn', val: 10 } },
  { id: 'genie_lamp', name: "Genie's Favour", icon: '🪔', desc: 'Random events appear twice as often', cost: 50000, req: { events: 5 }, eff: { type: 'events', mult: 0.5 } },
  // item-cost upgrades
  { id: 'gilded_pick', name: 'Gilded Pickaxe Handle', icon: '⛏️', desc: 'Mining ×2 (tap & workers)', cost: 50000, items: { gold_bar: 50 }, req: { skill: 'mining', lvl: 45 }, eff: { type: 'station', st: 'mine', mult: 2 } },
  { id: 'runic_anvil', name: 'Runic Anvil', icon: '🔨', desc: 'Anvil ×2 (tap & workers)', cost: 500000, items: { rune_bar: 25 }, req: { skill: 'smithing', lvl: 85 }, eff: { type: 'station', st: 'anvil', mult: 2 } },
  { id: 'blast_furnace', name: 'Blast Furnace', icon: '🏭', desc: 'Furnace ×2 (tap & workers)', cost: 120000, items: { steel_bar: 200 }, req: { skill: 'smithing', lvl: 40 }, eff: { type: 'station', st: 'furnace', mult: 2 } },
  { id: 'eternal_flame', name: 'Eternal Flame', icon: '🕯️', desc: 'Fire pit ×2 and Range ×2', cost: 200000, items: { magic_logs: 100 }, req: { skill: 'firemaking', lvl: 75 }, eff: { type: 'stations', sts: ['fire', 'range'], mult: 2 } },
  { id: 'shark_line', name: 'Shark-tooth Line', icon: '🦈', desc: 'Fishing ×2 (tap & workers)', cost: 300000, items: { raw_shark: 100 }, req: { skill: 'fishing', lvl: 76 }, eff: { type: 'station', st: 'fish', mult: 2 } },
  { id: 'yew_axe', name: 'Yew-wood Haft', icon: '🪵', desc: 'Woodcutting ×2 (tap & workers)', cost: 80000, items: { yew_logs: 150 }, req: { skill: 'woodcutting', lvl: 60 }, eff: { type: 'station', st: 'forest', mult: 2 } },
  { id: 'ancient_brush', name: 'Ancient Brush', icon: '🖌️', desc: 'Archaeology ×2 (tap & workers)', cost: 300000, items: { dwarven_alloy: 200 }, req: { skill: 'archaeology', lvl: 65 }, eff: { type: 'station', st: 'dig', mult: 2 } },
  { id: 'dragonbone_charm', name: 'Dragonbone Charm', icon: '🦴', desc: '+25% combat XP', cost: 300000, items: { dragon_bones: 100 }, req: { skill: 'attack', lvl: 60 }, eff: { type: 'cxp', mult: 1.25 } },
);
UPGRADES.push(
  { id: 'auto_spec', name: 'Weapon Master', icon: '🗡️', desc: 'Automatically fire your special attack whenever you have the energy', cost: 750000, req: { combat: 75 }, eff: { type: 'autospec' } },
  { id: 'bonecrusher', name: 'Bonecrusher', icon: '🦴', desc: 'Bones dropped in combat are crushed for 50% Prayer XP automatically', cost: 200000, req: { skill: 'prayer', lvl: 30 }, eff: { type: 'bonecrusher' } },
  { id: 'slayer_codex', name: 'Slayer Codex', icon: '📘', desc: '+25% Slayer XP', cost: 300000, req: { skill: 'slayer', lvl: 40 }, eff: { type: 'sxp', mult: 1.25 } },
  { id: 'loot_beam', name: 'Ring of Loot', icon: '💫', desc: 'Boss & rare drops 25% more likely', cost: 25000000, req: { kills: 10000 }, eff: { type: 'luck', mult: 1.25 } },
);
const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map(u => [u.id, u]));

const ASCEND_MIN_TOTAL = 350;
