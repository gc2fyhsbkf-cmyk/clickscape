'use strict';
/* =========================================================
   CLICKSCAPE v7.1 — the Beyond (content for ascended tiers)
   + rebrand pass 1 (original names for skills, metals, bosses…)
   Display names only: internal ids & saves are unchanged.
   ========================================================= */

/* ================= THE BEYOND: monsters & bosses for every ascended tier ================= */
AREAS.push(['beyond', '🌠 Beyond']);
const BEYOND = [
  ['astral_stalker', 'Astral stalker', '🦊', 0, 320, 600, 520, 420, 45], ['gilded_sentinel', 'Gilded sentinel', '🗿', 0, 380, 760, 640, 560, 52],
  ['tidebreaker', 'Tidebreaker', '🐙', 1, 480, 1000, 820, 700, 62], ['jade_colossus', 'Jade colossus', '🗿', 1, 560, 1250, 960, 860, 70],
  ['sunborn_seraph', 'Sunborn seraph', '👼', 2, 700, 1600, 1150, 1050, 82], ['halo_drake', 'Halo drake', '🐉', 2, 820, 1900, 1300, 1200, 90],
  ['nightveil_wraith', 'Nightveil wraith', '👻', 3, 980, 2400, 1500, 1400, 104], ['entropy_hound', 'Entropy hound', '🐺', 3, 1150, 2900, 1700, 1650, 115],
  ['ember_titan', 'Ember titan', '🔥', 4, 1400, 3600, 2000, 1900, 130], ['worldforge_golem', 'Worldforge golem', '🪨', 4, 1650, 4400, 2300, 2200, 145]];
BEYOND.forEach(([id, name, icon, ti, lvl, hp, atk, def, mh]) => { const T = ATIERS[ti]; MON({ id, name, icon, hue: (ti * 70) % 360, lvl, hp, atk, def, mh, spd: 3, area: 'beyond', minCombat: 115 + ti * 20, coins: [lvl * 20, lvl * 120],
  drops: [[T.id + '_ore', 1, 2 + ti, 6 + ti * 2], [T.id + '_bar', 1 / 4, 1, 3], [T.id + '_logs', 1 / 5, 2, 5], ['raw_' + T.id + '_fish', 1 / 5, 2, 5], ...Object.entries(T.extra).filter(([k]) => ITEMS[k]).map(([k]) => [k, 1 / 3, 1, 2]), ['echo_shard', 1 / 6, 1, 3], [T.id + '_scimitar', 1 / 400, 1, 1], ['clue_master', 1 / 120, 1, 1]] }); });
const BEYOND_BOSSES = [
  ['aurelion', 'Aurelion, the Gilded Lion', '🦁', 0, 900, 2400, 900, 800, 70, 'ring'], ['maelstrom', 'The Maelstrom Queen', '🌀', 1, 1250, 3400, 1200, 1100, 85, 'amulet'],
  ['solarch', 'Solarch the Radiant', '☀️', 2, 1700, 4800, 1500, 1400, 100, 'ring'], ['umbra', 'Umbra, Eater of Stars', '🌑', 3, 2300, 6800, 1900, 1800, 118, 'amulet'], ['primeval', 'The Primeval Forge', '⚒️', 4, 3100, 9500, 2400, 2300, 140, 'cape']];
BEYOND_BOSSES.forEach(([id, name, icon, ti, lvl, hp, atk, def, mh, uslot]) => {
  const T = ATIERS[ti], uid = `${id}_${uslot}`, mult = 1 + ti * 0.6;
  gear(uid, `${name.split(/[ ,]/)[0]}'s ${uslot === 'cape' ? 'mantle' : uslot}`, uslot === 'cape' ? 'cape' : uslot === 'ring' ? 'ring' : 'neck', [Math.round(14 * mult), Math.round(12 * mult), Math.round(8 * mult)], null, { kind: uslot, tint: T.tint, trim: T.trim, ratk: Math.round(12 * mult), rstr: Math.round(5 * mult), matk: Math.round(12 * mult), mdmg: Math.round(4 * mult), rare: true, value: T.bv * 30 });
  PETS[id + '_pet'] = { name: `Little ${name.split(/[ ,]/)[0]}`, icon, st: 'combat', chance: 0, desc: '+3% combat max hit' };
  MON({ id, name, icon, hue: (ti * 70) % 360, boss: true, lvl, hp, atk, def, mh, spd: 3, area: 'beyond', minCombat: 125 + ti * 22, coins: [lvl * 100, lvl * 500],
    drops: [[T.id + '_bar', 1, 3 + ti, 8 + ti * 2], ...Object.entries(T.extra).filter(([k]) => ITEMS[k]).map(([k]) => [k, 1, 2, 5]), ['echo_shard', 1 / 2, 3, 8], [uid, 1 / 250, 1, 1], [T.id + '_platebody', 1 / 150, 1, 1], ['clue_master', 1 / 30, 1, 1], [`pet:${id}_pet`, 1 / 2000, 1, 1]] });
});

/* ---------- ranged & magic weapons for every ascended tier ---------- */
ATIERS.forEach((T, i) => {
  const lv = T.lvl - 20, s = 1 + i * 0.35;
  gear(T.id + '_bow', T.name + ' bow', 'weapon', [0, 0, 0], { ranged: lv }, { kind: 'longbow', tint: T.tint, trim: T.trim, wclass: 'ranged', ratk: Math.round(130 * s), rstr: Math.round(110 * s), spd: 1.0, twoHanded: true, rare: true, value: T.bv * 8 });
  gear(T.id + '_staff', T.name + ' staff', 'weapon', [0, 0, 0], { magic: lv }, { kind: 'staff', tint: T.tint, trim: T.trim, wclass: 'magic', cast: 'celestial', matk: Math.round(32 * s), mdmg: Math.round(18 * s), spd: 1.0, twoHanded: true, rare: true, value: T.bv * 8 });
  A7({ id: 'fl_' + T.id + '_bow', st: 'fletch', name: T.name + ' bow', lvl: T.lvl, xp: 500 + i * 300, hp: 12 + i * 2, inp: { [T.id + '_logs']: 4, bowstring: 2, [T.id + '_bar']: 1 }, out: { [T.id + '_bow']: 1 }, icon: T.id + '_bow' });
  A7({ id: 'cr_' + T.id + '_staff', st: 'craft', name: T.name + ' staff', lvl: T.lvl, xp: 500 + i * 300, hp: 12 + i * 2, inp: { [T.id + '_logs']: 3, [T.id + '_bar']: 2 }, out: { [T.id + '_staff']: 1 }, icon: T.id + '_staff' });
});
(function () {
  CLOG.push({ id: 'beyond', name: 'The Beyond', icon: '🌠', cat: 'Bosses', items: [...BEYOND_BOSSES.map(b => `${b[0]}_${b[10]}`), ...BEYOND_BOSSES.map(b => `pet:${b[0]}_pet`)] });
  CLOG.flatMap(p => p.items).forEach(i => CLOG_ITEMS.add(i));
  BEYOND_BOSSES.forEach(b => (SOURCES[`${b[0]}_${b[10]}`] ||= []).push(`${b[1]} (1/250)`));
  ach('beyond_1', 'Beyond the Veil', 'Defeat a boss of the Beyond', '🌠', g => BEYOND_BOSSES.some(b => g.S.kills[b[0]]), 30);
  ach('beyond_all', 'Master of the Beyond', 'Defeat every boss of the Beyond', '🌌', g => BEYOND_BOSSES.every(b => g.S.kills[b[0]]), 75);
})();
for (const m of MONSTERS) MONSTER_BY_ID[m.id] = m;
Object.keys(ITEMS).forEach(id => { if (!(id in ITEM_ORDER)) ITEM_ORDER[id] = Object.keys(ITEM_ORDER).length; });
for (const id of Object.keys(ITEMS)) { const it = ITEMS[id]; if (!it.hidden && !it.untradeable && !it.open && it.value >= 1 && !GE_SET.has(id)) { GE_ITEMS.push(id); GE_SET.add(id); } }

/* ================= REBRAND PASS 1 ================= */
// Metals: bronze / iron / steel stay; the rest get original names.
const METAL_RENAME = { mithril: 'Bluesteel', adamant: 'Ancient', adamantite: 'Ancient', rune: 'Volcanic', runite: 'Volcanic', primal: 'Primal', void: 'Voidforged' };
for (const it of Object.values(ITEMS)) {
  const m = it.id.match(/^(mithril|adamantite|adamant|runite|rune)_/);
  if (m && !/_rune$/.test(it.id)) it.name = it.name.replace(/^(Mithril|Adamantite|Adamant|Runite|Rune)\b/, METAL_RENAME[m[1]]);
}
const RB = [
  // skills & core terms
  ['Hitpoints', 'Vitality'], ['Herblore', 'Herbalism'], ['Runecrafting', 'Glyphcraft'], ['Runecrafter', 'Glyphcrafter'], ['Construction', 'Carpentry'], ['Archaeology', 'Salvaging'], ['Excavation', 'Salvaging'], ['Slayer', 'Bounty'],
  ['Grand Exchange', 'Trading Post'], ['Run bounties', 'Run goals'], ['Mithril', 'Bluesteel'], ['Adamant Dragon', 'Ancient Dragon'], ['Rune Dragon', 'Volcanic Dragon'], ['Adamantite', 'Ancient'], ['Runite', 'Volcanic'], ['Ancient Runes', 'Ascension Sigils'], ['Ancient Magicks', 'Elder Magicks'],
  // gods, factions & places
  ['Saradomin', 'Solarion'], ['Zamorak', 'Zarvok'], ['Bandos', 'Gorath'], ['Armadyl', 'Aviel'], ['Guthix', 'Verdant'], ['Zaros', 'Nyxar'], ['God Wars', 'Divine War'], ['GWD', 'Divine War'],
  ['Lumbridge', 'Riverton'], ['Varrock', 'Ironhold'], ['Falador', 'Whitecrest'], ['Kandarin', 'Westmarch'], ['Morytania', 'Shadowfen'], ['Karamja', 'Palm Isles'], ['Prifddinas', 'the Elven City'], ['Zanaris', 'the Hidden Glade'],
  // bosses & monsters
  ['General Graardor', 'Warlord Grukk'], ["Kree'arra", 'Skyreaver'], ['Commander Zilyana', 'Seraph Lyra'], ["K'ril Tsutsaroth", 'Krazh the Infernal'], ['Nexling', 'Nyxling'], ['Nex', 'Nyxara'],
  ['TzTok-Jad', 'Magmor the Obsidian'], ['TzKal-Zuk', 'Pyraxis, Inferno King'], ['TzRek-Jad', 'Little Magmor'], ['Jal-Nib-Rek', 'Little Pyraxis'], ['TzHaar', 'Obsidian'], ['Tz-Kih', 'Cinder bat'], ['Tz-Kek', 'Magma blob'], ['Tok-Xil', 'Obsidian archer'], ['Yt-MejKot', 'Obsidian brute'], ['Ket-Zek', 'Obsidian mage'],
  ['Jal-Nib', 'Pyre-nibbler'], ['Jal-MejRah', 'Pyre-bat'], ['Jal-Ak', 'Pyre-blob'], ['Jal-ImKot', 'Pyre-brute'], ['Jal-Xil', 'Pyre-archer'], ['Jal-Zek', 'Pyre-mage'], ['Fight Caves', 'Magma Caves'],
  ['Zulrah', 'Serpenta'], ['Snakeling', 'Serpentling'], ['Vorkath', 'Rimewyrm'], ['Vorki', 'Rimeling'], ['Sarachnis', 'Broodmother Saraxa'], ['Sraracha', 'Saraxling'], ['Corporeal Beast', 'Spectral Behemoth'], ['Pet Dark Core', 'Behemoth core'],
  ['Kalphite Queen', 'Hive Queen'], ['Kalphite Princess', 'Hive Princess'], ['Kalphite', 'Hiveling'], ['King Black Dragon', 'Black Wyrm King'], ['Prince Black Dragon', 'Black Wyrm Prince'], ['Dagannoth', 'Deepkin'],
  ['Venenatis', 'Venomira'], ["Vet'ion", 'Bonelord Vethor'], ['Callisto', 'Ursa Prime'], ['Scorpia', 'Scorpix'], ['Chaos Fanatic', 'Mad Zealot'], ['Abyssal Sire', 'Void Sovereign'], ['Thermonuclear smoke devil', 'Smoke Tyrant'],
  ['Grotesque Guardians', 'Gargoyle Twins'], ['The Nightmare', 'The Dread Dreamer'], ['Little nightmare', 'Little Dreamer'], ['Crystalline Hunllef', 'Prism Warden'], ['Corrupted Hunllef', 'Corrupted Prism Warden'], ['Youngllef', 'Prismling'],
  ['Nechryael', 'Plaguespawn'], ['Kurask', 'Thornback'], ['Turoth', 'Bramblebeast'], ['Aviansie', 'Harpy'], ['Ankou', 'Grave knight'], ['Penance', 'Horde'], ['Lizardman', 'Lizardfolk'],
  ['Great Olm', 'Ancient Basilisk'], ['Tekton', 'Forgemaster'], ['Vasa Nistirio', 'Crystal Shrine'], ['Vespula', 'Wasp Matriarch'], ['Muttadile', 'Swampjaw'], ['Olmlet', 'Basiliskling'],
  ['The Maiden of Sugadinti', 'The Blood Maiden'], ['Pestilent Bloat', 'Plague Bloat'], ['Nylocas Vasilias', 'Nyl Spider-king'], ['Sotetseg', 'Soulweaver'], ['Xarpus', 'Blightwing'], ['Verzik Vitur', 'Countess Vexra'], ["Lil' Zik", 'Little Vexra'],
  ['Zebak', 'Sobekar'], ['Kephri', 'Scarabis'], ['Ba-Ba', 'Baboonar'], ['Akkha', 'Akhenon'], ['Elidinis & Tumeken', 'The Twin Sun Wardens'], ["Tumeken's guardian", 'Sun cat'],
  ['Ahrim', 'Aldric'], ['Dharok', 'Dorran'], ['Guthan', 'Gustav'], ['Karil', 'Kerran'], ['Torag', 'Thorne'], ['Verac', 'Varek'], ['Barrows', 'Crypt'],
  ['Wintertodt', 'Frostheart'], ['Tempoross', 'Stormspirit'], ['Tiny Tempor', 'Tiny Storm'], ['Zalcano', 'Magma Titan'], ['Smolcano', 'Magmling'], ['Guardians of the Rift', 'Rift Wardens'], ["Giants' Foundry", 'Titan Forge'], ['Kovac', 'Brakk'],
  ['Mahogany Homes', 'Home Commissions'], ['Pest Control', 'Portal Siege'], ['Void Knight', 'Warden Knight'], ['Void knight', 'Warden knight'], ['Barbarian Assault', 'Horde Assault'],
  ['Chambers of Xeric', 'Sunken Citadel'], ['Theatre of Blood', 'Crimson Theatre'], ['Tombs of Amascut', 'Tombs of the Sun'], ['The Gauntlet', 'The Crystal Trial'], ['Corrupted Gauntlet', 'Corrupted Trial'], ['Gauntlet', 'Crystal Trial'],
  ['Turael', 'Rowan'], ['Vannaka', 'Brannoc'], ['Chaeldar', 'Elowen'], ['Nieve', 'Sable'], ['Duradel', 'Morrigan'],
  // signature items
  ['Abyssal whip', 'Void lash'], ['Abyssal tentacle', 'Void tendril'], ['Abyssal bludgeon', 'Void bludgeon'], ['Abyssal dagger', 'Void dagger'], ['Abyssal demon', 'Void demon'], ['godsword', 'warblade'], ['Godsword', 'Warblade'],
  ['Torva', "Titan's"], ['Ancestral', 'Elder'], ['Masori', 'Sunscale'], ['Justiciar', 'Arbiter'], ["Tumeken's shadow", 'Shadow of the Sun'], ["Osmumten's fang", "Pharaoh's fang"], ["Elidinis' ward", "Tidecaller's ward"],
  ['Twisted bow', 'Warped bow'], ['twisted bow', 'warped bow'], ['Twisted buckler', 'Warped buckler'], ['Kodai wand', "Arcanist's wand"], ["Dinh's bulwark", 'Bastion bulwark'], ['Barrows gloves', "Champion's gloves"],
  ['Fire cape', 'Molten cape'], ['Infernal cape', 'Inferno cape'], ['Scythe of vitur', 'Blood scythe'], ['Ghrazi rapier', 'Crimson rapier'], ['Sanguinesti staff', 'Sanguine staff'], ['Avernic defender', 'Hellforged defender'],
  ['Blade of saeldor', 'Crystal blade'], ['Bow of faerdhinen', 'Bow of the Prism'], ["Craw's bow", 'Ghast bow'], ["Viggora's chainmace", 'Ghast chainmace'], ["Thammaron's sceptre", 'Ghast sceptre'], ['Tokkul', 'Obsidian coin'],
  ['Helm of neitiznot', 'Northman helm'], ['Neitiznot faceguard', 'Northman faceguard'], ['Elysian spirit shield', 'Seraphic ward'], ['Spectral spirit shield', 'Phantom ward'], ['Blessed spirit shield', 'Blessed ward'], ['Spirit shield', 'Spirit ward'],
  ['Zenyte', 'Sunstone'], ['Saradomin brew', 'Holy brew'], ['Graceful', 'Swiftfoot'], ['graceful', 'swiftfoot'], ['Piety', 'Zeal'], ['Rigour', 'Precision'], ['Augury', 'Insight'],
  // quests & diaries
  ["Doric's Quest", "The Dwarf's Errand"], ['Rune Mysteries', 'Glyph Mysteries'], ['Dragon Slayer II', 'Wyrmslayer II'], ['Dragon Slayer I', 'Wyrmslayer'], ['Monkey Madness II', 'Jungle Madness II'], ['Monkey Madness I', 'Jungle Madness'],
  ['Desert Treasure II', 'Sands of Fortune II'], ['Desert Treasure I', 'Sands of Fortune'], ['Recipe for Disaster', 'Feast of Ruin'], ['Lunar Diplomacy', 'Moonlit Pact'], ['Song of the Elves', 'Elven Requiem'], ['Fairytale II', 'Fairy Ring Woes'],
  ['Lost City', 'The Hidden Glade'], ['The Fremennik Trials', 'The Northmen Trials'], ['Sins of the Father', 'Sins of the Bloodline'], ['While Guthix Sleeps', 'While the Balance Sleeps'], ['Love Story', 'A Builder’s Tale'],
];
const RB_LOWER = [['slayer', 'bounty'], ['hitpoints', 'vitality'], ['herblore', 'herbalism'], ['runecrafting', 'glyphcraft'], ['barrows', 'crypt'], ['tokkul', 'obsidian coins']];
const esc_ = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RB_MAP = new Map(RB);
const RB_RE = new RegExp('(?<![\\w\'-])(' + RB.map(r => r[0]).sort((a, b) => b.length - a.length).map(esc_).join('|') + ')(?![\\w])', 'g');
const RBL_MAP = new Map(RB_LOWER);
const RBL_RE = new RegExp('(?<=[\\s>(])(' + RB_LOWER.map(r => esc_(r[0])).join('|') + ')(?=[\\s<.,)!:;])', 'g');
function rebrand(s) { return typeof s === 'string' ? s.replace(RB_RE, m => RB_MAP.get(m)).replace(RBL_RE, m => RBL_MAP.get(m)) : s; }
// apply to every data name/description
(function () {
  const fix = (o, keys = ['name', 'desc', 'txt', 'reward']) => { if (!o) return; for (const k of keys) if (typeof o[k] === 'string') o[k] = rebrand(o[k]); };
  Object.values(ITEMS).forEach(i => fix(i)); MONSTERS.forEach(m => fix(m)); Object.values(ACTIONS).forEach(a => fix(a)); Object.values(SKILLS).forEach(s => fix(s));
  Object.values(STATIONS).forEach(s => fix(s, ['name', 'worker', 'verb', 'upg'])); Object.values(PETS).forEach(p => fix(p)); CLOG.forEach(p => fix(p)); QUESTS.forEach(q => fix(q)); DIARIES.forEach(d => fix(d));
  DIARIES.forEach(d => d.tiers.forEach(t => { fix(t); t.tasks.forEach(task => task[0] = rebrand(task[0])); }));
  SLAYER_MASTERS.forEach(m => fix(m)); SLAYER_SHOP.forEach(s => fix(s)); UPGRADES.forEach(u => fix(u)); ACHIEVEMENTS.forEach(a => fix(a)); AREAS.forEach(a => a[1] = rebrand(a[1]));
  Object.values(RUNS).forEach(r => fix(r)); RELICS.flat().forEach(r => fix(r)); CHALLENGES.forEach(c => fix(c)); HOUSE.forEach(h => fix(h)); TRANS_PERKS.forEach(p => fix(p)); OMENS.forEach(o => fix(o));
  for (const k in SOURCES) SOURCES[k] = SOURCES[k].map(rebrand);
  TITLES.forEach(t => t[1] = rebrand(t[1]));
  const dev = TRANS_PERKS.find(p => p.id === 'devotion'); if (dev) dev.name = 'Sanctity';
})();
// apply to everything drawn on screen (pages, pop-ups, messages)
for (const k of Object.keys(VIEWS)) VIEWS[k] = (orig => function () { return rebrand(orig.apply(this, arguments)); })(VIEWS[k]);
openModal = (orig => function (html, ...a) { return orig(rebrand(html), ...a); })(openModal);
toast = (orig => function (html, ...a) { return orig(rebrand(html), ...a); })(toast);

function boot16() { boot15(); UI.force = true; render(); }
