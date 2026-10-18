'use strict';
/* =========================================================
   CLICKSCAPE v4 content — ascension realm, raids, bosses,
   house, more items & clue loot
   ========================================================= */
const MON = o => { MONSTERS.push(o); return o; };

/* ---------- New specs ---------- */
Object.assign(SPECS, {
  dwh: { name: 'Smash', cost: 50, hits: 1, dmg: 1.5, acc: 1, drainPct: 0.3 },
  emaul: { name: 'Hammer Blow', cost: 50, hits: 1, dmg: 1.25, acc: 1.25, drainPct: 0.35 },
  blowpipe: { name: 'Toxic Siphon', cost: 50, hits: 1, dmg: 1.5, acc: 2, heal: 0.5 },
  tbow: { name: 'Wind Shear', cost: 50, hits: 2, dmg: 0.9, acc: 1.3 },
  celestial: { name: 'Starfall', cost: 50, hits: 3, dmg: 1, acc: 2 },
});

/* ---------- Defenders (Cyclopes in the Warriors' Guild) ---------- */
[['bronze', 1, [3, 2, 3]], ['iron', 5, [5, 3, 5]], ['steel', 10, [7, 4, 7]], ['mithril', 20, [10, 5, 10]], ['adamant', 30, [13, 6, 13]], ['rune', 40, [20, 6, 20]], ['dragon', 60, [25, 6, 25]]]
  .forEach(([m, lvl, st]) => gear(m + '_defender', cap1(m) + ' defender', 'shield', st, { defence: lvl, attack: lvl }, { kind: 'defender', tint: m === 'dragon' ? DRAGON_TINT : METALS.find(x => x.id === m).tint, rare: m === 'dragon', value: Math.round((st[0] + st[2]) ** 2 * 40) }));
gear('avernic_defender', 'Avernic defender', 'shield', [30, 8, 30], { defence: 70, attack: 70 }, { kind: 'defender', tint: '#a02a1a', value: 60000000 });

/* ---------- New gear ---------- */
gear('dragon_warhammer', 'Dragon warhammer', 'weapon', [0, 85, 0], { strength: 60 }, { kind: 'maul', tint: DRAGON_TINT, atk: 0, spd: 1.25, spec: 'dwh', value: 40000000 });
gear('dragon_2h_sword', 'Dragon 2h sword', 'weapon', [92, 93, 0], { attack: 60 }, { kind: 'godsword', tint: DRAGON_TINT, twoHanded: true, spd: 1.3, value: 200000 });
gear('dragon_hunter_lance', 'Dragon hunter lance', 'weapon', [85, 70, 0], { attack: 78 }, { kind: 'spear', tint: '#5a7a3a', dragonbane: 1.2, spear: true, value: 60000000 });
gear('dragon_hunter_crossbow', 'Dragon hunter crossbow', 'weapon', [0, 0, 0], { ranged: 65 }, { kind: 'crossbow', tint: '#5a7a3a', ratk: 95, wclass: 'ranged', ammo: 'bolt', ammoCap: 7, spd: 1.25, dragonbane: 1.25, value: 70000000 });
gear('toxic_blowpipe', 'Toxic blowpipe', 'weapon', [0, 0, 0], { ranged: 75 }, { kind: 'blowpipe', tint: '#3a9a3a', ratk: 60, rstr: 40, wclass: 'ranged', spd: 0.66, twoHanded: true, spec: 'blowpipe', value: 5000000 });
gear('trident_of_the_swamp', 'Trident of the swamp', 'weapon', [0, 0, 0], { magic: 75 }, { kind: 'trident', tint: '#3a9a3a', matk: 25, mdmg: 0, wclass: 'magic', cast: 'swamp', spd: 1, value: 4000000 });
gear('serpentine_helm', 'Serpentine helm', 'head', [5, 5, 52], { defence: 75 }, { kind: 'full_helm', tint: '#3a8a3a', ratk: 5, matk: 5, value: 3000000 });
gear('dragonbone_necklace', 'Dragonbone necklace', 'neck', [4, 4, 4], { prayer: 80 }, { kind: 'amulet', tint: '#e8e0b0', reduce: 0.05, value: 3000000 });
gear('dragon_chainbody_kq', 'Dragon chainbody (KQ)', 'body', [0, 0, 64], { defence: 60 }, { kind: 'chainbody', tint: '#c03020', value: 5000000 });
gear('mole_slippers', 'Mole slippers', 'feet', [0, 0, 2], null, { kind: 'boots', tint: '#4a3a2a', cosmetic: true, value: 100000 });
gear('twisted_buckler', 'Twisted buckler', 'shield', [0, 0, 36], { ranged: 75, defence: 75 }, { kind: 'kiteshield', tint: '#8a7a50', ratk: 18, rstr: 2, value: 20000000 });
gear('dinhs_bulwark', "Dinh's bulwark", 'shield', [0, 0, 120], { defence: 75, attack: 75 }, { kind: 'kiteshield', tint: '#7a7a7a', reduce: 0.05, value: 30000000 });
gear('ancestral_hat', 'Ancestral hat', 'head', [0, 0, 12], { magic: 75, defence: 65 }, { kind: 'hat', tint: '#3a2a5a', matk: 8, mdmg: 2, value: 40000000 });
gear('ancestral_robe_top', 'Ancestral robe top', 'body', [0, 0, 42], { magic: 75, defence: 65 }, { kind: 'robe', tint: '#3a2a5a', matk: 35, mdmg: 2, value: 120000000 });
gear('ancestral_robe_bottom', 'Ancestral robe bottom', 'legs', [0, 0, 27], { magic: 75, defence: 65 }, { kind: 'robeskirt', tint: '#3a2a5a', matk: 26, mdmg: 2, value: 90000000 });
gear('elder_maul', 'Elder maul', 'weapon', [135, 147, 0], { attack: 75, strength: 75 }, { kind: 'maul', tint: '#9a8a6a', twoHanded: true, spd: 1.4, spec: 'emaul', value: 60000000 });
gear('kodai_wand', 'Kodai wand', 'weapon', [0, 0, 0], { magic: 75 }, { kind: 'wand', tint: '#5a3a8a', matk: 28, mdmg: 15, wclass: 'magic', cast: 'spell', spd: 1.25, value: 80000000 });
gear('twisted_bow', 'Twisted bow', 'weapon', [0, 0, 0], { ranged: 75 }, { kind: 'longbow', tint: '#6a5a3a', ratk: 70, rstr: 20, wclass: 'ranged', ammo: 'arrow', ammoCap: 7, spd: 1.25, twoHanded: true, tbow: true, spec: 'tbow', value: 1200000000 });
['dexterous', 'arcane'].forEach(k => item(k + '_prayer_scroll', cap1(k) + ' prayer scroll', 25000000, { cat: 'misc', kind: 'scroll', tint: k === 'arcane' ? '#5a3ac8' : '#3a8a3a', rare: true, open: true, prayerScroll: k === 'dexterous' ? 'rigour' : 'augury' }));
item('superior_dragon_bones', 'Superior dragon bones', 9000, { cat: 'drop', kind: 'bone', tint: '#a8c8e8' });
item('celestial_bones', 'Celestial bones', 40000, { cat: 'drop', kind: 'bone', tint: '#c8b8ff' });
[['superior_dragon_bones', 525], ['celestial_bones', 1500]].forEach(([id, xp]) => { BONES.push([id, '', 0, xp]); BONE_XP[id] = xp; act3({ id: 'p_' + id, st: 'altar', name: 'Offer ' + ITEMS[id].name.toLowerCase(), lvl: id === 'celestial_bones' ? 100 : 1, xp, hp: 2, inp: { [id]: 1 }, out: {}, icon: id }); });
[['kbd_heads', 'KBD heads', '🐲'], ['kq_head', 'Kalphite queen head', '🪲'], ['vorkath_head', "Vorkath's head", '💀'], ['mole_skin', 'Mole skin', '🟫'], ['serpentine_visage', 'Serpentine visage', '🐍'], ['tanzanite_fang', 'Tanzanite fang', '🦷'], ['magic_fang', 'Magic fang', '🦷'], ['jar_of_dirt', 'Jar of dirt', '🫙'], ['jar_of_sand', 'Jar of sand', '🫙'], ['jar_of_swamp', 'Jar of swamp', '🫙'], ['jar_of_decay', 'Jar of decay', '🫙']]
  .forEach(([id, n, e]) => item(id, n, 2000000, { cat: 'misc', emoji: e, rare: true }));
RECIPES.push(
  { out: 'toxic_blowpipe', inp: { tanzanite_fang: 1 } },
  { out: 'trident_of_the_swamp', inp: { magic_fang: 1, trident_of_the_seas: 1 } },
  { out: 'serpentine_helm', inp: { serpentine_visage: 1 } },
);

/* ---------- New overworld & slayer monsters ---------- */
const metalDragon = (m, lvl, hp, atk, def, mh, bars) => MON({ id: m + '_dragon', name: cap1(m) + ' Dragon', icon: '🐉', hue: { bronze: 30, iron: 0, steel: 200, mithril: 230, adamant: 120, rune: 180 }[m], bright: m === 'iron' ? 0.6 : 1,
  lvl, hp, atk, def, mh, spd: 3, coins: [lvl * 3, lvl * 20], area: 'overworld', dragon: true, weak: 'ranged',
  drops: [['dragon_bones', 1, 1, 1], [m + '_bar', 1, bars[0], bars[1]], ['dragonstone', 1 / 60, 1, 1], ['clue_hard', 1 / 100, 1, 1], ...(m === 'rune' ? [['dragon_arrowtips', 1 / 10, 10, 30], ['dragon_2h_sword', 1 / 400, 1, 1]] : [])] });
metalDragon('bronze', 131, 122, 112, 140, 12, [3, 5]); metalDragon('iron', 189, 165, 165, 165, 16, [3, 6]); metalDragon('steel', 246, 210, 215, 215, 20, [3, 6]);
metalDragon('mithril', 304, 255, 268, 268, 24, [3, 6]); metalDragon('adamant', 338, 295, 280, 290, 28, [2, 5]); metalDragon('rune', 380, 330, 300, 310, 32, [2, 4]);
MON({ id: 'minotaur', name: 'Minotaur', icon: '🐂', lvl: 27, hp: 22, atk: 20, def: 20, mh: 4, spd: 2.4, coins: [5, 60], area: 'overworld', weak: 'magic', drops: [['bones', 1, 1, 1], ['iron_arrow', 1 / 3, 5, 15], ['clue_easy', 1 / 64, 1, 1]] });
MON({ id: 'cyclops', name: 'Cyclops', icon: '👁️', hue: 40, lvl: 56, hp: 55, atk: 45, def: 40, mh: 7, spd: 2.4, coins: [20, 200], area: 'overworld', weak: 'ranged',
  drops: [['big_bones', 1, 1, 1], ['bronze_defender', 1 / 20, 1, 1], ['iron_defender', 1 / 25, 1, 1], ['steel_defender', 1 / 30, 1, 1], ['mithril_defender', 1 / 40, 1, 1], ['adamant_defender', 1 / 50, 1, 1], ['rune_defender', 1 / 60, 1, 1], ['dragon_defender', 1 / 150, 1, 1]] });
MON({ id: 'ogre', name: 'Ogre', icon: '🧌', hue: 30, lvl: 53, hp: 60, atk: 43, def: 43, mh: 8, spd: 2.4, coins: [10, 200], area: 'overworld', weak: 'magic', drops: [['big_bones', 1, 1, 1], ['limpwurt_root', 1 / 6, 1, 1]] });
MON({ id: 'troll', name: 'Mountain Troll', icon: '🧌', hue: 190, lvl: 69, hp: 90, atk: 60, def: 60, mh: 9, spd: 2.4, coins: [30, 300], area: 'overworld', weak: 'magic', drops: [['big_bones', 1, 1, 1], ['coal', 1 / 4, 2, 6], ['ranarr_seed', 1 / 60, 1, 1]] });
MON({ id: 'ankou', name: 'Ankou', icon: '💀', hue: 260, lvl: 95, hp: 100, atk: 80, def: 60, mh: 11, spd: 2.4, coins: [50, 600], area: 'overworld', weak: 'melee', drops: [['bones', 1, 1, 1], ['torstol_seed', 1 / 300, 1, 1], ['rune_bar', 1 / 30, 1, 1], ['clue_hard', 1 / 120, 1, 1]] });
MON({ id: 'brutal_black_dragon', name: 'Brutal Black Dragon', icon: '🐉', bright: 0.3, hue: 300, lvl: 318, hp: 315, atk: 280, def: 300, mh: 26, spd: 3, coins: [500, 5000], area: 'overworld', dragon: true, weak: 'ranged',
  drops: [['dragon_bones', 1, 1, 2], ['black_dragonhide', 1, 2, 2], ['dragon_arrowtips', 1 / 6, 10, 30], ['draconic_visage', 1 / 300, 1, 1], ['clue_elite', 1 / 150, 1, 1]] });
MON({ id: 'skeletal_wyvern', name: 'Skeletal Wyvern', icon: '🦴', lvl: 140, sl: 72, hp: 210, atk: 140, def: 150, mh: 13, spd: 2.4, coins: [100, 1500], area: 'slayer', needs: 'anti_dragon_shield', weak: 'melee',
  drops: [['wyvern_bones', 1, 1, 1], ['adamant_bar', 1 / 8, 2, 4], ['granite_maul', 1 / 300, 1, 1], ['draconic_visage', 1 / 1000, 1, 1]] });
item('wyvern_bones', 'Wyvern bones', 2000, { cat: 'drop', kind: 'bone', tint: '#c8c8b0' });
BONES.push(['wyvern_bones', '', 0, 252]); BONE_XP.wyvern_bones = 252; act3({ id: 'p_wyvern_bones', st: 'altar', name: 'Offer wyvern bones', lvl: 1, xp: 252, hp: 2, inp: { wyvern_bones: 1 }, out: {}, icon: 'wyvern_bones' });
MON({ id: 'lizardman_shaman', name: 'Lizardman Shaman', icon: '🦎', hue: 80, lvl: 150, sl: 0, hp: 150, atk: 130, def: 140, mh: 22, spd: 2.4, coins: [200, 2000], area: 'slayer', weak: 'ranged',
  drops: [['big_bones', 1, 1, 1], ['dragon_warhammer', 1 / 500, 1, 1], ['ranarr_seed', 1 / 30, 1, 1]] });
MON({ id: 'dagannoth_supreme', name: 'Dagannoth Supreme', icon: '🦖', hue: 200, boss: true, lvl: 303, hp: 255, atk: 250, def: 160, mh: 26, spd: 4, coins: [1000, 8000], area: 'bosses', weak: 'melee',
  drops: [['dagannoth_bones', 1, 1, 1], ['archers_ring', 1 / 128, 1, 1], ['seers_ring', 1 / 300, 1, 1], ['dragon_hatchet', 1 / 128, 1, 1]] });

/* ---------- New bosses ---------- */
MON({ id: 'kbd', name: 'King Black Dragon', icon: '🐲', bright: 0.4, boss: true, lvl: 276, hp: 240, atk: 240, def: 240, mh: 25, spd: 3, coins: [1000, 10000], area: 'bosses', dragon: true, weak: 'ranged',
  drops: [['dragon_bones', 1, 1, 1], ['black_dragonhide', 1, 2, 2], ['dragon_pickaxe', 1 / 1000, 1, 1], ['draconic_visage', 1 / 500, 1, 1], ['kbd_heads', 1 / 128, 1, 1], ['clue_elite', 1 / 300, 1, 1], ['pet:prince_black_dragon', 1 / 1000, 1, 1]] });
MON({ id: 'kalphite_queen', name: 'Kalphite Queen', icon: '🪲', boss: true, lvl: 333, hp: 510, atk: 300, def: 300, mh: 31, spd: 3, coins: [2000, 12000], area: 'bosses', weak: 'magic',
  drops: [['ashes', 1, 2, 4], ['dragon_chainbody_kq', 1 / 128, 1, 1], ['dragon_2h_sword', 1 / 256, 1, 1], ['kq_head', 1 / 128, 1, 1], ['jar_of_sand', 1 / 2000, 1, 1], ['pet:kalphite_princess', 1 / 1000, 1, 1]] });
MON({ id: 'giant_mole', name: 'Giant Mole', icon: '🦔', hue: 30, boss: true, lvl: 230, hp: 200, atk: 200, def: 200, mh: 21, spd: 2.4, coins: [500, 3000], area: 'bosses', weak: 'melee',
  drops: [['big_bones', 1, 1, 1], ['mole_skin', 1 / 3, 1, 3], ['mole_slippers', 1 / 200, 1, 1], ['jar_of_dirt', 1 / 1000, 1, 1], ['pet:baby_mole', 1 / 3000, 1, 1]] });
MON({ id: 'chaos_elemental', name: 'Chaos Elemental', icon: '🌀', boss: true, lvl: 305, hp: 250, atk: 270, def: 270, mh: 28, spd: 2.4, coins: [2000, 15000], area: 'bosses', weak: 'ranged',
  drops: [['ashes', 1, 1, 1], ['dragon_pickaxe', 1 / 256, 1, 1], ['dragon_2h_sword', 1 / 128, 1, 1], ['pet:chaos_elemental_jr', 1 / 300, 1, 1]] });
MON({ id: 'sarachnis', name: 'Sarachnis', icon: '🕷️', hue: 300, boss: true, lvl: 318, hp: 400, atk: 300, def: 150, mh: 31, spd: 3, coins: [3000, 15000], area: 'bosses', weak: 'melee',
  drops: [['eye_of_newt', 1, 10, 30], ['ranarr_seed', 1 / 4, 1, 3], ['dragon_hunter_lance', 1 / 2000, 1, 1], ['clue_elite', 1 / 50, 1, 1], ['pet:sraracha', 1 / 3000, 1, 1]] });
MON({ id: 'vorkath', name: 'Vorkath', icon: '🐉', hue: 180, bright: 0.8, boss: true, lvl: 732, hp: 750, atk: 560, def: 214, mh: 32, spd: 3, coins: [10000, 40000], area: 'bosses', dragon: true, weak: 'ranged', minCombat: 100,
  drops: [['superior_dragon_bones', 1, 2, 2], ['blue_dragonhide', 1, 2, 2], ['dragonbone_necklace', 1 / 1000, 1, 1], ['vorkath_head', 1 / 50, 1, 1], ['draconic_visage', 1 / 5000, 1, 1], ['dragon_arrowtips', 1 / 5, 20, 50], ['clue_elite', 1 / 65, 1, 1], ['pet:vorki', 1 / 3000, 1, 1]] });
MON({ id: 'zulrah', name: 'Zulrah', icon: '🐍', hue: 130, boss: true, lvl: 725, hp: 500, atk: 400, def: 300, mh: 41, spd: 3, coins: [8000, 30000], area: 'bosses', weak: 'magic', noMelee: true, minCombat: 90,
  drops: [['zulrahs_scales', 1, 100, 300], ['tanzanite_fang', 1 / 512, 1, 1], ['magic_fang', 1 / 512, 1, 1], ['serpentine_visage', 1 / 512, 1, 1], ['jar_of_swamp', 1 / 3000, 1, 1], ['onyx', 1 / 512, 1, 1], ['pet:snakeling', 1 / 4000, 1, 1]] });
item('zulrahs_scales', "Zulrah's scales", 150, { cat: 'drop', kind: 'material', tint: '#3a8a3a' });
Object.assign(PETS, {
  prince_black_dragon: { name: 'Prince Black Dragon', icon: '🐲', st: 'combat', chance: 0, desc: '+3% combat max hit' },
  kalphite_princess: { name: 'Kalphite Princess', icon: '🪲', st: 'combat', chance: 0, desc: '+3% combat max hit' },
  baby_mole: { name: 'Baby Mole', icon: '🦔', st: 'combat', chance: 0, desc: '+3% combat max hit' },
  chaos_elemental_jr: { name: 'Chaos Elemental Jr.', icon: '🌀', st: 'combat', chance: 0, desc: '+3% combat max hit' },
  sraracha: { name: 'Sraracha', icon: '🕷️', st: 'combat', chance: 0, desc: '+3% combat max hit' },
  vorki: { name: 'Vorki', icon: '🐉', st: 'combat', chance: 0, desc: '+3% combat max hit' },
  snakeling: { name: 'Snakeling', icon: '🐍', st: 'combat', chance: 0, desc: '+3% combat max hit' },
  olmlet: { name: 'Olmlet', icon: '🦎', st: 'combat', chance: 0, desc: '+3% combat max hit' },
  bloodhound: { name: 'Bloodhound', icon: '🐕', st: 'combat', chance: 0, desc: '+3% combat max hit (clue pet)' },
  ascendling: { name: 'Ascendling', icon: '🌟', st: 'combat', chance: 0, desc: '+3% combat max hit (ascension pet)' },
  voidling: { name: 'Voidling', icon: '🌑', st: 'combat', chance: 0, desc: '+3% combat max hit' },
});

/* ---------- Chambers of Xeric (raid) ---------- */
const RAID_COX = ['cox_tekton', 'cox_vasa', 'cox_vespula', 'cox_muttadile', 'cox_olm'];
[['cox_tekton', 'Tekton', '🔨', 205, 400, 300, 205, 32, 3.6, 'magic'], ['cox_vasa', 'Vasa Nistirio', '💎', 230, 450, 250, 175, 28, 3, 'melee'], ['cox_vespula', 'Vespula', '🐝', 206, 320, 220, 190, 24, 2.4, 'ranged'],
 ['cox_muttadile', 'Muttadile', '🐊', 294, 450, 260, 175, 30, 3, 'magic'], ['cox_olm', 'Great Olm', '🦎', 1043, 1300, 400, 175, 40, 3, 'ranged']]
  .forEach(([id, name, icon, lvl, hp, atk, def, mh, spd, weak], i) => MON({ id, name, icon, lvl, hp, atk, def, mh, spd, weak, area: 'raids', raid: 'cox', order: i, boss: id === 'cox_olm', minCombat: 100, drops: [] }));
const COX_UNIQUES = [['dexterous_prayer_scroll', 20], ['arcane_prayer_scroll', 20], ['twisted_buckler', 4], ['dragon_hunter_crossbow', 4], ['dinhs_bulwark', 3], ['ancestral_hat', 3],
  ['ancestral_robe_top', 2], ['ancestral_robe_bottom', 2], ['dragon_claws', 3], ['elder_maul', 2], ['kodai_wand', 2], ['twisted_bow', 2]];
const COX_COMMON = [['coins', 20000, 80000], ['dragon_bones', 5, 15], ['torstol', 3, 8], ['lantadyme', 5, 15], ['rune_bar', 5, 15], ['dragon_arrowtips', 20, 60], ['onyx', 1, 1]];

/* ---------- Clue expansion: more uniques, master tier ---------- */
const g = (id, n, slot, kind, tint, st, o = {}) => cosmetic(id, n, slot, kind, tint, st, o);
g('black_beret', 'Black beret', 'head', 'hat', '#1a1a1a'); g('white_beret', 'White beret', 'head', 'hat', '#e8e8e8');
g('bronze_platebody_t', 'Bronze platebody (t)', 'body', 'platebody', '#a8703a', [0, 0, 9], { trim: '#1a1a1a' }); g('iron_platebody_t', 'Iron platebody (t)', 'body', 'platebody', '#6a6462', [0, 0, 18], { trim: '#1a1a1a' });
g('flared_trousers', 'Flared trousers', 'legs', 'robeskirt', '#8a4ac8'); g('amulet_of_magic_t', 'Amulet of magic (t)', 'neck', 'amulet', '#2a4ad8', [0, 0, 0], { matk: 10, trim: '#e8c030' });
g('mithril_platebody_g', 'Mithril platebody (g)', 'body', 'platebody', '#3a3ab4', [0, 0, 36], { req: { defence: 20 }, trim: '#e8c030' });
g('leprechaun_hat', 'Leprechaun hat', 'head', 'hat', '#2a8a3a'); g('cat_mask', 'Cat mask', 'head', 'hat', '#3a3a3a');
g('climbing_boots_g', 'Climbing boots (g)', 'feet', 'boots', '#8a5a2b', [0, 2, 3], { trim: '#e8c030' }); g('spiked_manacles', 'Spiked manacles', 'feet', 'boots', '#6a6a6a', [0, 4, 0]);
g('saradomin_platebody', 'Saradomin platebody', 'body', 'platebody', '#e8e8f0', [0, 0, 60], { req: { defence: 40 }, trim: '#3a7ab8' });
g('zamorak_platebody', 'Zamorak platebody', 'body', 'platebody', '#8a1a14', [0, 0, 60], { req: { defence: 40 }, trim: '#e8c030' });
g('guthix_platebody', 'Guthix platebody', 'body', 'platebody', '#3a8a3a', [0, 0, 60], { req: { defence: 40 }, trim: '#e8e8e8' });
g('blue_dhide_body_g', "Blue d'hide body (g)", 'body', 'dhidebody', '#3a5ac8', [0, 0, 40], { ratk: 20, req: { ranged: 50 }, trim: '#e8c030' });
g('cavalier_hat', 'Cavalier', 'head', 'hat', '#5a2a2a');
g('black_dhide_body_t', "Black d'hide body (t)", 'body', 'dhidebody', '#2e2e2e', [0, 0, 58], { ratk: 30, req: { ranged: 70 }, trim: '#e8e8e8' });
g('rangers_tunic', "Ranger's tunic", 'body', 'robe', '#3a7a3a', [0, 0, 20], { ratk: 20, req: { ranged: 40 } });
g('lava_dragon_mask', 'Lava dragon mask', 'head', 'full_helm', '#c03a1a');
g('ring_of_coins', 'Ring of coins', 'ring', 'ring', '#f0c030', [0, 0, 0], { luck: 1.05 });
g('third_age_druidic_robe_top', '3rd age druidic robe top', 'body', 'robe', '#e8e8f0', [0, 0, 20], { matk: 10, trim: '#3a8a3a', value: 400000000 });
g('third_age_longsword', '3rd age longsword', 'weapon', 'sword', '#e8e8f0', [85, 82, 0], { req: { attack: 65 }, trim: '#e8c030', value: 1200000000 });
g('third_age_bow', '3rd age bow', 'weapon', 'longbow', '#e8e8f0', [0, 0, 0], { ratk: 80, wclass: 'ranged', ammo: 'arrow', ammoCap: 7, spd: 1.1, twoHanded: true, req: { ranged: 65 }, trim: '#3a7ab8', value: 1500000000 });
g('third_age_wand', '3rd age wand', 'weapon', 'wand', '#e8e8f0', [0, 0, 0], { matk: 22, mdmg: 8, wclass: 'magic', cast: 'spell', spd: 1.25, req: { magic: 65 }, trim: '#3a7ab8', value: 1300000000 });
g('bucket_helm_g', 'Bucket helm (g)', 'head', 'full_helm', '#e8c030');
g('ornate_top', 'Ornate top', 'body', 'robe', '#e8c030', [0, 0, 0]); g('ornate_gloves', 'Ornate gloves', 'hands', 'gloves', '#e8c030', [0, 0, 0]);
CLUE_TIERS.master = { name: 'Master', tint: '#c03a3a', steps: 5, rolls: [6, 8], rare: 1 / 12, n: 40 };
item('clue_master', 'Clue scroll (master)', 1, { cat: 'misc', kind: 'scroll', tint: '#c03a3a', clue: 'master', untradeable: true });
CLUE_UNIQUES.easy.push('black_beret', 'white_beret', 'bronze_platebody_t', 'iron_platebody_t', 'flared_trousers', 'amulet_of_magic_t');
CLUE_UNIQUES.medium.push('mithril_platebody_g', 'leprechaun_hat', 'cat_mask', 'climbing_boots_g', 'spiked_manacles');
CLUE_UNIQUES.hard.push('saradomin_platebody', 'zamorak_platebody', 'guthix_platebody', 'blue_dhide_body_g', 'cavalier_hat');
CLUE_UNIQUES.elite.push('black_dhide_body_t', 'rangers_tunic', 'lava_dragon_mask', 'ring_of_coins');
CLUE_UNIQUES.master = ['third_age_druidic_robe_top', 'third_age_longsword', 'third_age_bow', 'third_age_wand', 'bucket_helm_g', 'ornate_top', 'ornate_gloves', 'third_age_platebody', 'third_age_pickaxe'];
CLUE_COMMON.easy.push(['cut_sapphire', 1, 2], ['potato_seed', 5, 15], ['iron_arrow', 20, 50], ['clue_easy', 1, 1]);
CLUE_COMMON.medium.push(['cut_emerald', 1, 3], ['steel_bar', 5, 15], ['tarromin_seed', 3, 8], ['vial_of_water', 20, 50], ['clue_medium', 1, 1]);
CLUE_COMMON.hard.push(['cut_ruby', 2, 4], ['adamant_bar', 5, 12], ['irit_seed', 2, 6], ['super_attack', 2, 5], ['xp_lamp', 1, 1], ['clue_hard', 1, 1]);
CLUE_COMMON.elite.push(['cut_diamond', 2, 5], ['onyx', 1, 1], ['dwarf_weed_seed', 2, 5], ['super_combat', 2, 4], ['xp_lamp', 1, 2], ['dragon_bolts', 20, 60], ['clue_elite', 1, 1]);
CLUE_COMMON.master = [['coins', 50000, 200000], ['onyx', 1, 2], ['zenyte_shard', 1, 1], ['overload', 2, 5], ['xp_lamp', 2, 3], ['dragon_arrow', 50, 150], ['mystery_box', 2, 4], ['torstol_seed', 3, 6]];

/* ---------- Ascension realm: the Rift ---------- */
item('rift_essence', 'Rift essence', 20000, { cat: 'misc', kind: 'orb', tint: '#7a3ad8', rare: true });
item('void_ore', 'Void ore', 6000, { cat: 'ore', kind: 'ore', tint: '#5a2a9a' });
item('void_bar', 'Void bar', 40000, { cat: 'bar', kind: 'bar', tint: '#4a2a8a' });
item('celestial_core', 'Celestial core', 300000000, { cat: 'misc', kind: 'orb', tint: '#f0e0ff', rare: true });
const VOID = { id: 'void', name: 'Voidforged', tint: '#4a2a8a', lvl: 125, tier: 10, eq: 99, bv: 40000, fxp: 160 };
TOOL_MULT[10] = 16;
SMITH_ITEMS.forEach(si => {
  const id = 'void_' + si.k, f = 14;
  item(id, 'Voidforged ' + si.name, Math.round(si.bars * VOID.bv * 1.5), {
    cat: si.tool ? 'tool' : 'gear', kind: si.k, tint: VOID.tint, trim: '#c8a0ff', slot: si.slot, tier: 10, spd: si.k === 'dagger' ? 0.85 : undefined, rare: true,
    mult: si.tool ? 16 : undefined, atk: Math.round((si.atk || 0) * f), str: Math.round((si.str || 0) * f), def: Math.round((si.def || 0) * f), req: si.tool ? { [si.tool]: 110 } : gearReq(si, 99),
  });
  act3({ id: 'a_void_' + si.k, st: 'anvil', metal: 'void', name: 'Voidforged ' + si.name, lvl: Math.min(150, 125 + si.off), xp: si.bars * VOID.fxp, hp: si.bars * 3 + 12, inp: { void_bar: si.bars }, out: { [id]: 1 }, icon: id });
});
METALS.push(VOID);
act3({ id: 'm_void_ore', st: 'mine', name: 'Void rock', lvl: 125, xp: 260, hp: effort(260, 11), out: { void_ore: 1 }, icon: 'void_ore' });
act3({ id: 's_void', st: 'furnace', name: 'Void bar', lvl: 125, xp: 120, hp: 8, inp: { void_ore: 1, rift_essence: 1 }, out: { void_bar: 1 }, icon: 'void_bar' });
item('starwood_logs', 'Starwood logs', 9000, { cat: 'log', kind: 'log', tint: '#c8b8ff' });
act3({ id: 'w_starwood_logs', st: 'forest', name: 'Starwood tree', lvl: 125, xp: 520, hp: effort(520, 10), out: { starwood_logs: 1 }, icon: 'starwood_logs' });
act3({ id: 'f_starwood_logs', st: 'fire', name: 'Burn starwood logs', lvl: 125, xp: 700, hp: 7, inp: { starwood_logs: 1 }, out: { ashes: 3 }, icon: 'starwood_logs' });
gear('starwood_bow', 'Starwood bow', 'weapon', [0, 0, 0], { ranged: 99 }, { kind: 'shortbow', tint: '#c8b8ff', trim: '#f0e0ff', ratk: 115, rstr: 15, wclass: 'ranged', ammo: 'arrow', ammoCap: 7, spd: 0.85, twoHanded: true, value: 150000000 });
act3({ id: 'fl_starwood_bow', st: 'fletch', name: 'Starwood bow', lvl: 130, xp: 600, hp: 12, inp: { starwood_logs: 2, bowstring: 1, rift_essence: 2 }, out: { starwood_bow: 1 }, icon: 'starwood_bow' });
item('raw_abyssal_eel', 'Raw abyssal eel', 3000, { cat: 'fish', kind: 'fish', tint: '#5a3a8a' });
item('abyssal_eel', 'Abyssal eel', 6000, { cat: 'food', kind: 'cookedfish', tint: '#5a3a8a', heal: 36 });
act3({ id: 'fi_abyssal_eel', st: 'fish', name: 'Rift pool (abyssal eel)', lvl: 125, xp: 260, hp: effort(260, 11), out: { raw_abyssal_eel: 1 }, icon: 'raw_abyssal_eel' });
act3({ id: 'c_abyssal_eel', st: 'range', name: 'Cook abyssal eel', lvl: 125, xp: 380, hp: 7, inp: { raw_abyssal_eel: 1 }, out: { abyssal_eel: 1 }, burn: 140, icon: 'abyssal_eel' });
POTIONS.push({ id: 'divine_overload', name: 'Divine overload', lvl: 130, xp: 400, inp: { overload: 1, rift_essence: 1 }, tint: '#7a3ad8', fx: { atk: [8, 0.2], str: [8, 0.2], def: [8, 0.2], rng: [8, 0.2], mag: [8, 0.2], antifire: 1 } });
item('divine_overload', 'Divine overload', 60000, { cat: 'herb', kind: 'potion', tint: '#7a3ad8', potion: POTIONS[POTIONS.length - 1].fx });
act3({ id: 'h_divine_overload', st: 'herb', name: 'Divine overload', lvl: 130, xp: 400, hp: 10, inp: { overload: 1, rift_essence: 1 }, out: { divine_overload: 1 }, icon: 'divine_overload' });
gear('celestial_amulet', 'Celestial amulet', 'neck', [20, 15, 10], { attack: 99 }, { kind: 'amulet', tint: '#f0e0ff', ratk: 20, rstr: 8, matk: 20, mdmg: 8, value: 200000000 });
act3({ id: 'cr_celestial_amulet', st: 'craft', name: 'Celestial amulet', lvl: 130, xp: 700, hp: 12, inp: { zenyte: 1, rift_essence: 5, gold_bar: 1 }, out: { celestial_amulet: 1 }, icon: 'celestial_amulet' });
const RIFT_MERCHANT = { id: 'rift_merchant', name: 'Pickpocket rift merchant', lvl: 125, xp: 900, hp: 16, coins: [2000, 4500], icon: '🧙‍♂️', loot: [['rift_essence', 1 / 8, 1, 1]], clue: ['master', 1 / 600] };
THIEVING.push(RIFT_MERCHANT); item('__rift_merchant', RIFT_MERCHANT.name, 0, { emoji: '🧙‍♂️', hidden: true, untradeable: true });
act3({ id: 't_rift_merchant', st: 'thieve', name: RIFT_MERCHANT.name, lvl: 125, xp: 900, hp: 16, out: {}, thieve: RIFT_MERCHANT, icon: '__rift_merchant' });
COURSES.push({ id: 'celestial', name: 'Celestial rooftops', lvl: 125, xp: 2600, hp: 42, mark: 1 / 3 });
act3({ id: 'ag_celestial', st: 'course', name: 'Celestial rooftops', lvl: 125, xp: 2600, hp: 42, out: {}, course: COURSES[COURSES.length - 1], icon: '__ag' });
const STARBLOOM = { id: 'starbloom', name: 'Starbloom', herb: '#d8c8ff', lvl: 125, time: 7200, pxp: 400, hxp: 450, y: [2, 5], seed: 200000, v: 60000, cropItem: 'starbloom' };
item('starbloom_seed', 'Starbloom seed', 60000, { cat: 'farm', kind: 'seed', tint: '#d8c8ff' }); item('starbloom', 'Starbloom', 60000, { cat: 'farm', kind: 'herb', tint: '#d8c8ff' });
CROPS.push(STARBLOOM); SHOP.seeds.push({ id: 'starbloom_seed', price: 200000 });
DIGSITES.push({ id: 'rift_ruins', name: 'Rift Ruins', lvl: 125, xp: 900, mat: ['rift_fragment', 'Rift fragment', 2000], tint: '#9a6ae8',
  arts: [['void_compass', 'Void compass'], ['star_chart', 'Ascendant star chart'], ['shattered_crown', 'Shattered crown']], buff: { type: 'stations', sts: STATION_ORDER, mult: 1.1, desc: '+10% speed at every station' } });
{ const d = DIGSITES[DIGSITES.length - 1]; d.hp = effort(d.xp, 10);
  item(d.mat[0], d.mat[1], d.mat[2], { cat: 'arch', kind: 'material', tint: d.tint });
  d.arts.forEach(([id, name]) => { item(id, name, d.mat[2] * 60, { cat: 'arch', kind: 'artifact', tint: d.tint, rare: true });
    item('damaged_' + id, 'Damaged ' + name.toLowerCase(), Math.round(d.mat[2] * 12), { cat: 'arch', kind: 'artifact', tint: '#4a3a5a' });
    act3({ id: 'r_' + id, st: 'restore', name: 'Restore ' + name.toLowerCase(), lvl: d.lvl, xp: d.xp * 5, hp: 20, inp: { ['damaged_' + id]: 1, [d.mat[0]]: 20 }, out: { [id]: 1 }, icon: id }); });
  act3({ id: 'd_' + d.id, st: 'dig', site: d.id, name: d.name, lvl: d.lvl, xp: d.xp, hp: d.hp, out: { [d.mat[0]]: 1 }, icon: d.arts[0][0] }); }

/* Ascension-only gear */
gear('celestial_blade', 'Celestial blade', 'weapon', [150, 152, 0], { attack: 99 }, { kind: 'scimitar', tint: '#f0e0ff', trim: '#c8a0ff', spec: 'celestial', value: 2000000000 });
gear('celestial_bow', 'Celestial bow', 'weapon', [0, 0, 0], { ranged: 99 }, { kind: 'longbow', tint: '#f0e0ff', trim: '#c8a0ff', ratk: 150, rstr: 45, wclass: 'ranged', spd: 0.9, twoHanded: true, spec: 'celestial', value: 2000000000 });
gear('celestial_staff', 'Celestial staff', 'weapon', [0, 0, 0], { magic: 99 }, { kind: 'staff', tint: '#f0e0ff', trim: '#c8a0ff', matk: 55, mdmg: 25, wclass: 'magic', cast: 'celestial', spd: 1, spec: 'celestial', value: 2000000000 });
gear('crown_of_ascension', 'Crown of the Ascended', 'head', [20, 10, 60], { defence: 90 }, { kind: 'full_helm', tint: '#f0c030', trim: '#fff6c0', ratk: 20, matk: 20, mdmg: 3, untradeable: true, value: 1 });
gear('ring_of_ascension', 'Ring of Ascension', 'ring', [10, 8, 10], null, { kind: 'ring', tint: '#f0e0ff', ratk: 10, rstr: 4, matk: 10, mdmg: 4, luck: 1.3, untradeable: true, value: 1 });
gear('ascendant_cape', 'Ascendant cape', 'cape', [15, 12, 20], null, { kind: 'cape', tint: '#f0e0ff', trim: '#c8a0ff', ratk: 15, rstr: 6, matk: 15, mdmg: 5, perk: 'max', untradeable: true, value: 1 });
const ASC_CAPE_TINTS = ['#a8703a', '#c0c0c8', '#f0c030', '#4ac8e8', '#3a9a3a', '#c03a3a', '#7a3ad8', '#1a1a1a', '#f0f0ff', '#ff6ad8'];
ASC_CAPE_TINTS.forEach((t, i) => cosmetic('ascension_cape_' + (i + 1), `Ascension cape (tier ${i + 1})`, 'cape', 'cape', t, [i + 1, i + 1, 4 + i * 2], { untradeable: true, trim: i >= 5 ? '#fff6c0' : undefined, value: 1 }));
const RIFT = [
  { id: 'rift_wraith', name: 'Rift Wraith', icon: '👻', hue: 270, asc: 1, lvl: 420, hp: 500, atk: 380, def: 360, mh: 38, spd: 2.4, weak: 'magic',
    drops: [['rift_essence', 1 / 2, 1, 2], ['celestial_bones', 1 / 4, 1, 1], ['void_ore', 1 / 3, 2, 5], ['clue_master', 1 / 200, 1, 1]] },
  { id: 'starborn_colossus', name: 'Starborn Colossus', icon: '🗿', hue: 250, asc: 2, lvl: 600, hp: 900, atk: 450, def: 520, mh: 45, spd: 3, weak: 'ranged',
    drops: [['rift_essence', 1, 1, 3], ['celestial_bones', 1 / 2, 1, 2], ['celestial_core', 1 / 400, 1, 1], ['clue_master', 1 / 120, 1, 1]] },
  { id: 'abyssal_leviathan', name: 'Abyssal Leviathan', icon: '🐋', hue: 230, asc: 4, boss: true, lvl: 850, hp: 1500, atk: 600, def: 600, mh: 55, spd: 3, weak: 'magic',
    drops: [['rift_essence', 1, 3, 6], ['raw_abyssal_eel', 1, 5, 15], ['celestial_bow', 1 / 300, 1, 1], ['celestial_core', 1 / 150, 1, 1], ['pet:voidling', 1 / 800, 1, 1]] },
  { id: 'the_unmaker', name: 'The Unmaker', icon: '🌑', asc: 6, boss: true, lvl: 1200, hp: 2500, atk: 800, def: 750, mh: 65, spd: 3, weak: 'ranged',
    drops: [['rift_essence', 1, 5, 10], ['celestial_blade', 1 / 250, 1, 1], ['celestial_staff', 1 / 250, 1, 1], ['celestial_core', 1 / 100, 1, 1]] },
  { id: 'eternal_wyrm', name: 'Eternal Wyrm', icon: '🐉', hue: 270, asc: 8, boss: true, dragon: true, lvl: 1500, hp: 4000, atk: 1000, def: 900, mh: 80, spd: 3, weak: 'magic',
    drops: [['rift_essence', 1, 8, 15], ['superior_dragon_bones', 1, 3, 6], ['celestial_bow', 1 / 150, 1, 1], ['celestial_blade', 1 / 150, 1, 1], ['celestial_staff', 1 / 150, 1, 1]] },
  { id: 'avatar_of_ascension', name: 'Avatar of Ascension', icon: '🌟', asc: 10, boss: true, lvl: 2000, hp: 8000, atk: 1300, def: 1200, mh: 95, spd: 3,
    drops: [['rift_essence', 1, 15, 30], ['celestial_core', 1 / 20, 1, 1], ['clue_master', 1 / 5, 1, 1], ['pet:ascendling', 1 / 200, 1, 1]] },
];
RIFT.forEach(r => MON({ ...r, area: 'rift', ascReq: r.asc, coins: [r.lvl * 20, r.lvl * 80] }));
RECIPES.push({ out: 'celestial_blade', inp: { celestial_core: 1, void_scimitar: 1 } }, { out: 'celestial_bow', inp: { celestial_core: 1, starwood_bow: 1 } }, { out: 'celestial_staff', inp: { celestial_core: 1, mystic_fire_staff: 1 } });
AREAS.push(['raids', '🏛️ Raids'], ['rift', '🌌 Rift']);

/* ---------- Ascension perk shop (spend Ancient essence) ---------- */
const ASC_PERKS = [
  { id: 'headstart', name: 'Head start', icon: '🪙', max: 5, cost: l => 3 * (l + 1) ** 2, desc: l => `Begin each run with 🪙${fmt([0, 10000, 250000, 5000000, 100000000, 1000000000][l])}` },
  { id: 'veteran', name: 'Veteran', icon: '🎖️', max: 6, cost: l => 5 * (l + 1) ** 2, desc: l => `Every skill starts at level ${[1, 10, 20, 30, 40, 50, 60][l]}` },
  { id: 'loyal', name: 'Loyal workforce', icon: '👷', max: 5, cost: l => 4 * (l + 1) ** 2, desc: l => `Keep ${l * 10}% of your workers when you ascend` },
  { id: 'toolkit', name: 'Heirloom tools', icon: '⛏️', max: 1, cost: () => 10, desc: l => l ? 'Your worn tools come with you' : 'Keep your worn tools when you ascend' },
  { id: 'armoury', name: 'Heirloom armoury', icon: '🛡️', max: 1, cost: () => 25, desc: l => l ? 'Your worn gear comes with you' : 'Keep your worn gear when you ascend' },
  { id: 'lucid', name: 'Lucid mind', icon: '🧠', max: 10, cost: l => 4 * (l + 1) ** 2, desc: l => `+${l * 10}% XP in all skills` },
  { id: 'fortune', name: 'Fortune', icon: '🍀', max: 5, cost: l => 6 * (l + 1) ** 2, desc: l => `Rare drops ×${(1 + l * 0.08).toFixed(2)}` },
  { id: 'tireless', name: 'Tireless', icon: '⏳', max: 4, cost: l => 8 * (l + 1) ** 2, desc: l => `+${l * 6}h offline progress` },
  { id: 'industry', name: 'Industry', icon: '🏭', max: 10, cost: l => 5 * (l + 1) ** 2, desc: l => `All workers +${l * 15}% speed` },
  { id: 'insight', name: 'Ancestral insight', icon: '⭐', max: 1, cost: () => 30, desc: l => l ? 'Station tap upgrades are kept' : 'Keep all station tap & worker upgrades when you ascend' },
  { id: 'slayerkeep', name: 'Eternal Slayer', icon: '💀', max: 1, cost: () => 20, desc: l => l ? 'Slayer unlocks & points are kept' : 'Keep Slayer unlocks and points when you ascend' },
  { id: 'warlord', name: 'Warlord', icon: '⚔️', max: 10, cost: l => 6 * (l + 1) ** 2, desc: l => `+${l * 5}% combat damage` },
];

/* ---------- Player-owned house (coin sinks) ---------- */
const HOUSE = [
  { id: 'library', name: 'Library', icon: '📚', max: 10, base: 500000, desc: l => `+${l * 3}% XP in all skills` },
  { id: 'altar', name: 'Gilded altar', icon: '⛪', max: 5, base: 200000, desc: l => `+${l * 25}% Prayer XP` },
  { id: 'workshop', name: 'Workshop', icon: '🛠️', max: 10, base: 300000, desc: l => `+${l * 6}% Smithing, Crafting & Fletching speed` },
  { id: 'kitchen', name: 'Kitchen', icon: '🍲', max: 5, base: 150000, desc: l => `+${l * 10}% Cooking speed, stop burning ${l * 2} levels sooner` },
  { id: 'garden', name: 'Superior garden', icon: '🌳', max: 5, base: 400000, desc: l => `Crops grow ${l * 6}% faster with +${l * 6}% yield` },
  { id: 'vault', name: 'Treasure vault', icon: '💰', max: 10, base: 1000000, desc: l => `+${l * 3}% coins from selling` },
  { id: 'quarters', name: "Servants' quarters", icon: '🏚️', max: 10, base: 3000000, desc: l => `+${l * 4}% worker speed` },
  { id: 'trophy', name: 'Trophy room', icon: '🏆', max: 10, base: 5000000, desc: l => `+${l * 2}% combat damage` },
  { id: 'menagerie', name: 'Menagerie', icon: '🐾', max: 5, base: 2000000, desc: l => `Every pet gives +${l}% extra` },
  { id: 'pool', name: 'Rejuvenation pool', icon: '⛲', max: 3, base: 10000000, desc: l => `HP regen ×${1 + l}, special attack regen ×${1 + l * 0.5}` },
  { id: 'observatory', name: 'Observatory', icon: '🔭', max: 5, base: 8000000, desc: l => `Shooting stars & random events ${l * 15}% more often` },
  { id: 'portal', name: 'Portal chamber', icon: '🌀', max: 3, base: 25000000, desc: l => `+${l * 8}h offline progress` },
];
const houseCost = (r, l) => Math.round(r.base * Math.pow(4, l));
const guildCost = n => Math.round(1000000 * Math.pow(1.6, n));
const WELL = [
  { id: 'xp', name: 'Wisdom', icon: '📖', desc: '+50% XP for 30 minutes', mult: 1 },
  { id: 'luck', name: 'Fortune', icon: '🍀', desc: 'Rare drops ×1.25 for 30 minutes', mult: 1.2 },
  { id: 'work', name: 'Industry', icon: '👷', desc: 'Workers ×2 speed for 30 minutes', mult: 1.5 },
  { id: 'war', name: 'Valour', icon: '⚔️', desc: '+25% combat damage for 30 minutes', mult: 1.2 },
];

/* ---------- Achievements ---------- */
[1, 3, 5, 10, 20].forEach(n => ach('asc' + n, `Ascended ×${n}`, `Ascend ${n} time${n > 1 ? 's' : ''}`, '🌀', gg => gg.S.asc.count >= n, n * 2));
ach('house10', 'Homeowner', 'Own 10 house room levels', '🏠', gg => Object.values(gg.S.house || {}).reduce((a, b) => a + b, 0) >= 10, 2);
ach('house50', 'Mansion', 'Own 50 house room levels', '🏰', gg => Object.values(gg.S.house || {}).reduce((a, b) => a + b, 0) >= 50, 5);
ach('cox1', 'Raider', 'Complete the Chambers of Xeric', '🏛️', gg => (gg.S.raids?.cox || 0) >= 1, 3);
ach('purple', 'Purple!', 'Get a unique from a raid', '💜', gg => (gg.S.raids?.purples || 0) >= 1, 4);
ach('tbow', 'Twisted fate', 'Own a twisted bow', '🏹', gg => gg.owns(i => i.id === 'twisted_bow'), 8);
ach('master_clue', 'Grand master', 'Complete a master clue scroll', '📜', gg => (gg.S.clues.done.master || 0) >= 1, 4);
ach('rift_boss', 'Riftwalker', 'Defeat The Unmaker', '🌑', gg => (gg.S.kills.the_unmaker || 0) >= 1, 8);
ach('avatar', 'Beyond mortal', 'Defeat the Avatar of Ascension', '🌟', gg => (gg.S.kills.avatar_of_ascension || 0) >= 1, 15);
ach('guild25', 'Shareholder', 'Make 25 guild investments', '📊', gg => (gg.S.guild || 0) >= 25, 4);

/* ---------- 130–145 unlocks (reachable only after ascending) ---------- */
act3({ id: 'm_rift_crystal', st: 'mine', name: 'Rift crystal', lvl: 140, xp: 420, hp: effort(420, 12), out: { rift_essence: 1 }, icon: 'rift_essence' });
item('raw_starlight_ray', 'Raw starlight ray', 8000, { cat: 'fish', kind: 'fish', tint: '#c8d8ff' });
item('starlight_ray', 'Starlight ray', 15000, { cat: 'food', kind: 'cookedfish', tint: '#c8d8ff', heal: 44 });
act3({ id: 'fi_starlight_ray', st: 'fish', name: 'Star pool (starlight ray)', lvl: 140, xp: 360, hp: effort(360, 12), out: { raw_starlight_ray: 1 }, icon: 'raw_starlight_ray' });
act3({ id: 'c_starlight_ray', st: 'range', name: 'Cook starlight ray', lvl: 140, xp: 520, hp: 8, inp: { raw_starlight_ray: 1 }, out: { starlight_ray: 1 }, burn: 150, icon: 'starlight_ray' });
item('ancient_starwood_logs', 'Ancient starwood logs', 30000, { cat: 'log', kind: 'log', tint: '#f0e0ff' });
act3({ id: 'w_ancient_starwood', st: 'forest', name: 'Ancient starwood tree', lvl: 140, xp: 760, hp: effort(760, 12), out: { ancient_starwood_logs: 1 }, icon: 'ancient_starwood_logs' });
act3({ id: 'f_ancient_starwood', st: 'fire', name: 'Burn ancient starwood', lvl: 140, xp: 1000, hp: 8, inp: { ancient_starwood_logs: 1 }, out: { ashes: 4 }, icon: 'ancient_starwood_logs' });
COURSES.push({ id: 'astral', name: 'Astral spire', lvl: 140, xp: 4200, hp: 50, mark: 1 / 2 });
act3({ id: 'ag_astral', st: 'course', name: 'Astral spire', lvl: 140, xp: 4200, hp: 50, out: {}, course: COURSES[COURSES.length - 1], icon: '__ag' });
const CELESTIAL_THIEF = { id: 'star_sprite', name: 'Pickpocket star sprite', lvl: 140, xp: 1500, hp: 18, coins: [5000, 9000], icon: '🧚', loot: [['stardust', 1 / 2, 2, 6], ['rift_essence', 1 / 5, 1, 1], ['celestial_core', 1 / 20000, 1, 1]], clue: ['master', 1 / 300] };
THIEVING.push(CELESTIAL_THIEF); item('__star_sprite', CELESTIAL_THIEF.name, 0, { emoji: '🧚', hidden: true, untradeable: true });
act3({ id: 't_star_sprite', st: 'thieve', name: CELESTIAL_THIEF.name, lvl: 140, xp: 1500, hp: 18, out: {}, thieve: CELESTIAL_THIEF, icon: '__star_sprite' });
item('celestial_brew', 'Celestial brew', 50000, { cat: 'food', kind: 'potion', tint: '#f0e0ff', heal: 32 });
act3({ id: 'h_celestial_brew', st: 'herb', name: 'Celestial brew', lvl: 145, xp: 650, hp: 10, inp: { saradomin_brew: 1, starbloom: 1, rift_essence: 1 }, out: { celestial_brew: 1 }, icon: 'celestial_brew' });
gear('astral_boots', 'Astral boots', 'feet', [8, 8, 30], { defence: 99 }, { kind: 'boots', tint: '#c8b8ff', trim: '#f0e0ff', ratk: 8, matk: 8, value: 300000000 });
act3({ id: 'cr_astral_boots', st: 'craft', name: 'Astral boots', lvl: 140, xp: 1200, hp: 14, inp: { black_dragonhide: 5, rift_essence: 10, starbloom: 3 }, out: { astral_boots: 1 }, icon: 'astral_boots' });
for (const m of MONSTERS) MONSTER_BY_ID[m.id] = m;
STATION_ACTIONS.anvil.sort((a, b) => a.lvl - b.lvl); ['mine', 'furnace', 'forest', 'fire', 'fletch', 'fish', 'range', 'herb', 'craft', 'thieve', 'course', 'dig', 'restore', 'altar'].forEach(st => STATION_ACTIONS[st].sort((a, b) => a.lvl - b.lvl));
CROPS.sort((a, b) => a.lvl - b.lvl);
