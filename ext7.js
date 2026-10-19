'use strict';
/* =========================================================
   CLICKSCAPE v5.0 (part 1) — new skills & content
   Runecrafting, Construction, Hunter, skilling bosses & outfits,
   Wilderness, Theatre of Blood, Slayer bosses & block list
   ========================================================= */

/* ---------- helpers to bolt on skills & stations ---------- */
function addSkill(id, name, icon, tint) {
  SKILLS[id] = { name, icon }; SKILL_ORDER.push(id); MAX_LVL[id] = 120;
  gear(id + '_cape', name + ' cape', 'cape', [0, 0, 9], { [id]: 99 }, { kind: 'cape', tint, perk: id, rare: false, value: 99000 });
  SHOP.capes.splice(SHOP.capes.length - 1, 0, { id: id + '_cape', price: 99000 });
}
function addStation(st, def, after) {
  STATIONS[st] = def; STATION_ORDER.splice(STATION_ORDER.indexOf(after) + 1, 0, st);
  (SKILL_STATIONS[def.skill] ||= []).push(st); STATION_ACTIONS[st] ||= [];
  const R = ['I', 'II', 'III', 'IV', 'V'];
  [5, 15, 30, 50, 75].forEach((lv, i) => UPGRADES.push({ id: `${st}_tap${i}`, name: `${def.upg} Insight ${R[i]}`, icon: SKILLS[def.skill].icon, desc: `Tap power at the ${def.name} ×2`, cost: Math.round(def.wbase * 8 * Math.pow(12, i)), req: { skill: def.skill, lvl: lv }, eff: { type: 'tap', st, mult: 2 } }));
  [1, 5, 15, 30, 50].forEach((n, i) => UPGRADES.push({ id: `${st}_crew${i}`, name: `${def.worker} Training ${R[i]}`, icon: def.wicon, desc: `${def.worker}s work twice as fast`, cost: Math.round(def.wbase * 12 * Math.pow(14, i)), req: { workers: st, n }, eff: { type: 'crew', st, mult: 2 } }));
}
const A7 = o => { act3(o); STATION_ACTIONS[o.st].sort((a, b) => a.lvl - b.lvl); return o; };
const it7 = (id, name, value, kind, tint, o = {}) => item(id, name, value, { kind, tint, ...o });

/* ---------- new icon shapes ---------- */
Object.assign(SHAPES, {
  rune: t => `<path d="M6 10 C 6 5, 26 5, 26 10 L26 22 C 26 27, 6 27, 6 22 Z" fill="#8a8478" ${K}/><path d="M16 9 L20 16 L16 23 L12 16 Z" fill="${t}" ${K}/><circle cx="16" cy="16" r="2" fill="${shade(t, .5)}"/>`,
  essence: t => `<path d="M7 20 L11 9 L21 7 L26 15 L22 25 L12 26 Z" fill="${t}" ${K}/><path d="M11 9 L16 17 L26 15 M16 17 L12 26" stroke="${shade(t, -.25)}" fill="none"/>`,
  plank: t => `<path d="M3 13 L27 7 L29 12 L5 18 Z" fill="${t}" ${K}/><path d="M3 20 L27 14 L29 19 L5 25 Z" fill="${shade(t, -.12)}" ${K}/><path d="M7 15 L24 11 M7 22 L24 18" stroke="${shade(t, -.35)}" stroke-width=".8"/>`,
  furniture: t => `<path d="M7 14 L25 14 L25 18 L7 18 Z" fill="${t}" ${K}/><path d="M9 18 L9 28 M23 18 L23 28" stroke="#000" stroke-width="3.4"/><path d="M9 18 L9 28 M23 18 L23 28" stroke="${shade(t, -.2)}" stroke-width="2"/><path d="M9 14 L9 4 L23 4 L23 14" fill="none" stroke="#000" stroke-width="3.4"/><path d="M9 14 L9 4 L23 4 L23 14" fill="none" stroke="${t}" stroke-width="2"/>`,
  jar: t => `<path d="M11 4 L21 4 L21 8 C 26 10, 27 15, 27 20 C 27 26, 22 29, 16 29 C 10 29, 5 26, 5 20 C 5 15, 6 10, 11 8 Z" fill="#cfe8f4" fill-opacity=".5" ${K}/><circle cx="16" cy="19" r="5" fill="${t}"/><path d="M12 17 L9 13 M20 17 L23 13" stroke="${t}" stroke-width="1.5"/><rect x="10" y="3" width="12" height="3" fill="#7a5a3a" ${K}/>`,
  chin: t => `<ellipse cx="16" cy="19" rx="10" ry="8" fill="${t}" ${K}/><circle cx="10" cy="11" r="3.5" fill="${t}" ${K}/><circle cx="22" cy="11" r="3.5" fill="${t}" ${K}/><circle cx="13" cy="17" r="1.4" fill="#000"/><circle cx="19" cy="17" r="1.4" fill="#000"/><path d="M14 22 L18 22" stroke="#000"/>`,
  crate: t => `<path d="M4 10 L16 5 L28 10 L28 24 L16 29 L4 24 Z" fill="${t}" ${K}/><path d="M4 10 L16 15 L28 10 M16 15 L16 29" stroke="${shade(t, -.35)}" fill="none"/><path d="M7 13 L13 16 M7 18 L13 21" stroke="${shade(t, .3)}"/>`,
  ether: t => `<path d="M16 3 C 22 10, 26 15, 26 20 C 26 26, 21 29, 16 29 C 11 29, 6 26, 6 20 C 6 15, 10 10, 16 3 Z" fill="${t}" ${K}/><path d="M11 18 C 11 15, 13 12, 15 10" stroke="${shade(t, .5)}" fill="none" stroke-width="1.5"/>`,
  emblem: t => `<circle cx="16" cy="16" r="11" fill="${t}" ${K}/><circle cx="16" cy="16" r="7" fill="none" stroke="${shade(t, -.35)}" stroke-width="1.5"/><path d="M16 9 L18 15 L24 16 L18 17 L16 23 L14 17 L8 16 L14 15 Z" fill="${shade(t, .45)}"/>`,
  scythe2: t => `<path d="M10 30 L20 4" stroke="#000" stroke-width="3.6" stroke-linecap="round"/><path d="M10 30 L20 4" stroke="#5a1a1a" stroke-width="2" stroke-linecap="round"/><path d="M20 4 C 10 2, 3 7, 2 14 C 8 9, 13 8, 19 9 Z" fill="${t}" ${K}/>`,
});
for (const id in _iconCache) delete _iconCache[id];

/* ================= RUNECRAFTING ================= */
addSkill('runecrafting', 'Runecrafting', '🌀', '#d8b878');
addStation('runealtar', { skill: 'runecrafting', name: 'Runic altars', verb: 'Craft', worker: 'Essence runner', wicon: '🧙', wbase: 45, upg: "Runecrafter's" }, 'altar');
it7('pure_essence', 'Pure essence', 4, 'essence', '#e8e4f0', { cat: 'ore' });
A7({ id: 'm_essence', st: 'mine', name: 'Essence mine', lvl: 1, xp: 6, hp: 4, out: { pure_essence: 1 }, icon: 'pure_essence' });
const RUNES = [['air', 1, 5, '#e8f0f8', 4], ['mind', 2, 5.5, '#e8a030', 4], ['water', 5, 6, '#3a7ad8', 5], ['earth', 9, 6.5, '#7a5a2a', 5], ['fire', 14, 7, '#e83a1a', 6], ['body', 20, 7.5, '#3a3ad8', 8],
  ['cosmic', 27, 8, '#e8d83a', 30], ['chaos', 35, 8.5, '#e8a01a', 60], ['astral', 40, 8.7, '#c8c8e8', 90], ['nature', 44, 9, '#3aa83a', 120], ['law', 54, 9.5, '#3a3ae8', 150],
  ['death', 65, 10, '#e8e8e8', 200], ['blood', 77, 23.8, '#c81a1a', 300], ['soul', 90, 29.7, '#8a3ad8', 300], ['wrath', 95, 8, '#8a1a3a', 400], ['rift', 120, 60, '#7a3ad8', 4000]];
RUNES.forEach(([r, lvl, xp, tint, val]) => {
  it7(r + '_rune', cap1(r) + ' rune', val, 'rune', tint, { cat: 'craft', rune: r });
  A7({ id: 'rc_' + r, st: 'runealtar', name: cap1(r) + ' altar', lvl, xp, hp: 2 + Math.floor(lvl / 20), inp: r === 'rift' ? { pure_essence: 1, rift_essence: 1 } : { pure_essence: 1 }, out: { [r + '_rune']: 1 }, icon: r + '_rune', rcMulti: r !== 'rift' });
});
SHOP.supplies.push({ id: 'pure_essence', price: 12 }, { id: 'air_rune', price: 16 }, { id: 'mind_rune', price: 16 }, { id: 'fire_rune', price: 24 });
PETS.rift_guardian = { name: 'Rift guardian', icon: '🌀', st: 'runealtar', chance: 1 / 4000, desc: '+10% Runecrafting speed' };
// Spells use runes: with the right runes in your bank, spells hit 30% harder and use 1 of each per cast.
const SPELL_RUNES = { 'Wind Strike': ['air', 'mind'], 'Fire Strike': ['fire', 'mind'], 'Fire Bolt': ['fire', 'chaos'], 'Fire Blast': ['fire', 'death'], 'Fire Wave': ['fire', 'blood'], 'Fire Surge': ['fire', 'wrath'] };
function spellRunes() { const w = ITEMS[S.equip.weapon]; if (wclass() !== 'magic' || (w?.cast && w.cast !== 'spell')) return null; return SPELL_RUNES[spellFor()[1]] || null; }
const runesReady = () => { const r = spellRunes(); return !!r && r.every(x => have(x + '_rune')); };
maxHit = (orig => function (tap, m) { const v = orig(tap, m); return runesReady() ? Math.floor(v * 1.3) : v; })(maxHit);
let runeWarned = false;
playerAttack = (orig => function (tap, mult, acc, noAmmo) {
  const r = spellRunes();
  if (r) { if (r.every(x => have(x + '_rune'))) { r.forEach(x => remove(x + '_rune', 1)); runeWarned = false; } else if (!runeWarned && !OFF) { runeWarned = true; toast(`🌀 Out of ${r.map(x => x).join(' / ')} runes: spells hit 30% softer. Craft runes with Runecrafting.`, 'warn', 5000); } }
  return orig(tap, mult, acc, noAmmo);
})(playerAttack);

/* ================= CONSTRUCTION ================= */
addSkill('construction', 'Construction', '🔨', '#a87a4a');
addStation('sawmill', { skill: 'construction', name: 'Sawmill', verb: 'Saw', worker: 'Sawyer', wicon: '🪚', wbase: 40, upg: "Sawyer's" }, 'runealtar');
addStation('workbench', { skill: 'construction', name: 'Workbench', verb: 'Build', worker: 'Carpenter', wicon: '👷', wbase: 70, upg: "Carpenter's" }, 'sawmill');
const PLANKS = [['plank', 'Plank', 'logs', 1, 3, '#b08050', 30], ['oak_plank', 'Oak plank', 'oak_logs', 15, 6, '#c8924a', 80], ['teak_plank', 'Teak plank', 'maple_logs', 35, 9, '#9a6230', 180],
  ['mahogany_plank', 'Mahogany plank', 'yew_logs', 50, 13, '#7a3a22', 400], ['magic_plank', 'Enchanted plank', 'magic_logs', 75, 18, '#3a8a7a', 900], ['elder_plank', 'Elder plank', 'elder_logs', 95, 25, '#c8a83a', 2500]];
PLANKS.forEach(([id, name, log, lvl, xp, tint, val]) => { it7(id, name, val, 'plank', tint, { cat: 'craft' }); if (ITEMS[log]) A7({ id: 'sw_' + id, st: 'sawmill', name, lvl, xp, hp: 2 + Math.floor(lvl / 25), inp: { [log]: 1 }, out: { [id]: 1 }, icon: id }); });
[['crude_chair', 'Crude chair', 1, { plank: 2 }, 66, '#b08050'], ['wooden_bookcase', 'Wooden bookcase', 4, { plank: 4 }, 115, '#a07040'], ['oak_chair', 'Oak chair', 19, { oak_plank: 2 }, 120, '#c8924a'],
  ['oak_dining_table', 'Oak dining table', 22, { oak_plank: 4 }, 240, '#c8924a'], ['carved_oak_bench', 'Carved oak bench', 31, { oak_plank: 6 }, 360, '#b8823a'], ['teak_table', 'Teak table', 38, { teak_plank: 4 }, 360, '#9a6230'],
  ['teak_garden_bench', 'Teak garden bench', 44, { teak_plank: 6 }, 540, '#8a5226'], ['mahogany_wardrobe', 'Mahogany wardrobe', 60, { mahogany_plank: 3 }, 420, '#7a3a22'],
  ['gilded_throne', 'Gilded throne', 72, { mahogany_plank: 4, gold_bar: 2 }, 900, '#d8a83a'], ['enchanted_portal_frame', 'Enchanted portal frame', 85, { magic_plank: 4, law_rune: 20 }, 1200, '#3a8a7a'],
  ['elder_ornate_throne', 'Elder ornate throne', 105, { elder_plank: 5, gold_bar: 5 }, 2600, '#c8a83a']]
  .forEach(([id, name, lvl, inp, xp, tint]) => { const v = Object.entries(inp).reduce((a, [i, q]) => a + (ITEMS[i]?.value || 0) * q, 0); it7(id, name, Math.round(v * 1.5 + xp), 'furniture', tint, { cat: 'craft' }); A7({ id: 'b_' + id, st: 'workbench', name, lvl, xp, hp: 4 + Math.floor(lvl / 12), inp, out: { [id]: 1 }, icon: id }); });
PETS.beaver2 = { name: 'Woody', icon: '🦫', st: 'workbench', chance: 1 / 3000, desc: '+10% Construction speed' };
// House rooms now need planks and Construction levels too.
const ROOM_PLANK = l => PLANKS[Math.min(PLANKS.length - 1, Math.floor(l / 2))];
const roomNeeds = l => ({ con: 1 + l * 9, plank: ROOM_PLANK(l)[0], n: 10 * (l + 1) });
buyRoom = (orig => function (id) {
  const l = room(id), r = HOUSE.find(x => x.id === id); if (l >= r.max) return;
  const need = roomNeeds(l);
  if (LV.construction < need.con) return toast(`🔨 You need Construction level ${need.con} to build that.`, 'warn');
  if (have(need.plank) < need.n) return toast(`🔨 You need ${need.n} × ${ITEMS[need.plank].name} (have ${fmt(have(need.plank))}).`, 'warn');
  const c0 = S.coins; orig(id);
  if (room(id) > l) { remove(need.plank, need.n); gainXP('construction', need.n * PLANKS.find(p => p[0] === need.plank)[4] * 10); }
  else S.coins = c0;
})(buyRoom);
viewHouse = (orig => function () {
  return orig().replace(/data-act="house" data-id="(\w+)"([^>]*)>🪙([^<]*)</g, (all, id, rest, c) => { const n = roomNeeds(room(id)); const ok = LV.construction >= n.con && have(n.plank) >= n.n; return `data-act="house" data-id="${id}"${rest}>🪙${c}<small class="${ok ? '' : 'cb-red'}">${n.n} ${ITEMS[n.plank].name.toLowerCase()}s · Con ${n.con}</small><`; })
    .replace('Build and upgrade rooms with coins.', 'Build and upgrade rooms with coins, planks (Construction → Sawmill) and Construction levels. Building gives Construction XP.');
})(viewHouse);

/* ================= HUNTER ================= */
addSkill('hunter', 'Hunter', '🦊', '#6a5a2a');
addStation('hunt', { skill: 'hunter', name: 'Hunting grounds', verb: 'Hunt', worker: 'Tracker', wicon: '🧑‍🌾', wbase: 35, upg: "Tracker's" }, 'course');
STATION_ORDER.splice(STATION_ORDER.indexOf('hunt'), 1); STATION_ORDER.splice(STATION_ORDER.indexOf('dig'), 0, 'hunt');
const IMPS = [['baby', 17, 60, '#d8c8a8'], ['eclectic', 50, 160, '#c83ad8'], ['ninja', 74, 260, '#3a3a3a'], ['dragon', 83, 320, '#c81a1a'], ['crystal', 95, 420, '#8ae8e8']];
IMPS.forEach(([k, , , tint]) => it7(k + '_impling_jar', cap1(k) + ' impling jar', 50, 'jar', tint, { cat: 'misc', open: true }));
[['chinchompa', 'Chinchompa', '#9a9a9a', 600], ['red_chinchompa', 'Red chinchompa', '#c84a2a', 1200], ['black_chinchompa', 'Black chinchompa', '#2a2a2a', 2600]].forEach(([id, n, t, v]) => it7(id, n, v, 'chin', t, { cat: 'drop' }));
it7('kebbit_fur', 'Kebbit fur', 90, 'hide', '#c8a070', { cat: 'craft' });
it7('moonlight_moth', 'Moonlight moth', 6000, 'jar', '#e8e8a8', { cat: 'drop' });
[['h_swift', 'Crimson swifts', 1, 34, 6, { feather: 3 }, 'feather'], ['h_baby_imp', 'Baby implings', 17, 60, 8, { baby_impling_jar: 1 }, 'baby_impling_jar'], ['h_wagtail', 'Tropical wagtails', 19, 95, 9, { feather: 6 }, 'feather'],
  ['h_kebbit', 'Spotted kebbits', 33, 104, 10, { kebbit_fur: 1 }, 'kebbit_fur'], ['h_eclectic_imp', 'Eclectic implings', 50, 160, 14, { eclectic_impling_jar: 1 }, 'eclectic_impling_jar'],
  ['h_grey_chin', 'Grey chinchompas', 53, 198, 15, { chinchompa: 1 }, 'chinchompa'], ['h_red_chin', 'Red chinchompas', 63, 265, 18, { red_chinchompa: 1 }, 'red_chinchompa'],
  ['h_black_chin', 'Black chinchompas', 73, 315, 22, { black_chinchompa: 1 }, 'black_chinchompa'], ['h_ninja_imp', 'Ninja implings', 74, 260, 20, { ninja_impling_jar: 1 }, 'ninja_impling_jar'],
  ['h_dragon_imp', 'Dragon implings', 83, 320, 26, { dragon_impling_jar: 1 }, 'dragon_impling_jar'], ['h_crystal_imp', 'Crystal implings', 95, 420, 30, { crystal_impling_jar: 1 }, 'crystal_impling_jar'],
  ['h_moth', 'Moonlight moths', 110, 620, 40, { moonlight_moth: 1 }, 'moonlight_moth']]
  .forEach(([id, name, lvl, xp, hp, out, icon]) => A7({ id, st: 'hunt', name, lvl, xp, hp, out, icon }));
PETS.baby_chin = { name: 'Baby chinchompa', icon: '🐹', st: 'hunt', chance: 1 / 4000, desc: '+10% Hunter speed' };
const IMP_LOOT = {
  baby: [['coins', 50, 300], ['leather', 1, 3], ['feather', 10, 30], ['cooked_chicken', 1, 3], ['clue_easy', 1, 1, 0.05]],
  eclectic: [['coins', 300, 1500], ['cut_sapphire', 1, 2], ['cut_emerald', 1, 2], ['chaos_rune', 10, 30], ['mithril_bar', 2, 5], ['clue_medium', 1, 1, 0.08]],
  ninja: [['coins', 1000, 5000], ['cut_ruby', 1, 3], ['cut_diamond', 1, 2], ['death_rune', 10, 30], ['rune_arrow', 20, 60], ['clue_hard', 1, 1, 0.08]],
  dragon: [['coins', 4000, 15000], ['dragon_bones', 3, 8], ['dragon_arrowtips', 20, 60], ['dragon_bolts', 10, 30], ['dragonstone', 1, 1, 0.1], ['clue_elite', 1, 1, 0.04]],
  crystal: [['coins', 10000, 40000], ['onyx', 1, 1, 0.02], ['cut_dragonstone', 1, 2], ['blood_rune', 20, 60], ['torstol_seed', 1, 3], ['clue_elite', 1, 1, 0.08]],
};

/* ================= SKILLING BOSSES & OUTFITS ================= */
const OUTFITS = { prospector: ['mining', '#c8a83a', 'Prospector'], lumberjack: ['woodcutting', '#6a8a3a', 'Lumberjack'], angler: ['fishing', '#3a7aa8', 'Angler'], pyromancer: ['firemaking', '#d84a1a', 'Pyromancer'], carpenter: ['construction', '#a87a4a', 'Carpenter'] };
const OUTFIT_PIECES = [['helm', 'head', 'hat'], ['top', 'body', 'robe'], ['legs', 'legs', 'robeskirt'], ['boots', 'feet', 'boots']];
for (const [k, [sk, tint, name]] of Object.entries(OUTFITS)) OUTFIT_PIECES.forEach(([p, slot, kind]) => gear(`${k}_${p}`, `${name} ${p}`, slot, [0, 0, 0], null, { kind, tint, outfit: k, untradeable: true, value: 50000, rare: true }));
function outfitCount(k) { return OUTFIT_PIECES.filter(([p]) => have(`${k}_${p}`) || Object.values(S.equip).includes(`${k}_${p}`) || Object.values(S.cosmetic || {}).includes(`${k}_${p}`)).length; }
skillXpMult = (orig => function (skill) {
  let m = orig(skill);
  for (const [k, [sk]] of Object.entries(OUTFITS)) if (sk === skill) { const n = outfitCount(k); m *= 1 + 0.025 * n + (n === 4 ? 0.025 : 0); }
  return m * masteryXp(skill);
})(skillXpMult);
it7('supply_crate', 'Supply crate', 1, 'crate', '#8a5a2a', { cat: 'misc', open: true });
it7('reward_pool', 'Tempoross reward pool', 1, 'crate', '#3a6a8a', { cat: 'misc', open: true });
it7('zalcano_cache', 'Zalcano cache', 1, 'crate', '#6a6a7a', { cat: 'misc', open: true });
it7('tool_crate', 'Carpenter crate', 1, 'crate', '#a87a4a', { cat: 'misc', open: true });
A7({ id: 'f_wintertodt', st: 'fire', name: '❄️ Subdue the Wintertodt', lvl: 50, xp: 95, hp: 12, out: { ashes: 1 }, icon: 'supply_crate', crate: ['supply_crate', 1 / 12] });
A7({ id: 'fi_tempoross', st: 'fish', name: '🌊 Fight Tempoross', lvl: 35, xp: 70, hp: 11, out: { raw_salmon: 1 }, icon: 'reward_pool', crate: ['reward_pool', 1 / 12] });
A7({ id: 'm_zalcano', st: 'mine', name: '🔥 Smash Zalcano', lvl: 70, xp: 120, hp: 18, out: { coal: 1 }, icon: 'zalcano_cache', crate: ['zalcano_cache', 1 / 12] });
A7({ id: 'b_mahogany_homes', st: 'workbench', name: '🏡 Mahogany Homes contract', lvl: 20, xp: 110, hp: 14, inp: { plank: 2 }, out: { crude_chair: 1 }, icon: 'tool_crate', crate: ['tool_crate', 1 / 10] });
Object.assign(PETS, {
  phoenix: { name: 'Phoenix', icon: '🐦‍🔥', st: null, chance: 0, desc: '+5% Firemaking XP (Wintertodt pet)' },
  tiny_tempor: { name: 'Tiny Tempor', icon: '🐟', st: null, chance: 0, desc: '+5% Fishing XP (Tempoross pet)' },
  smolcano: { name: 'Smolcano', icon: '🌋', st: null, chance: 0, desc: '+5% Mining XP (Zalcano pet)' },
});
const CRATES = {
  supply_crate: { outfit: 'pyromancer', also: 'lumberjack', pet: 'phoenix', loot: [['coins', 200, 2000], ['yew_logs', 5, 20], ['magic_logs', 2, 8], ['ranarr_seed', 1, 2], ['cut_ruby', 1, 2], ['raw_shark', 3, 8], ['dragon_axe_piece', 0, 0]] },
  reward_pool: { outfit: 'angler', pet: 'tiny_tempor', loot: [['coins', 200, 2000], ['raw_shark', 5, 15], ['raw_swordfish', 5, 15], ['feather', 50, 200], ['clue_medium', 1, 1], ['raw_manta_ray', 2, 6]] },
  zalcano_cache: { outfit: 'prospector', pet: 'smolcano', loot: [['coins', 400, 3000], ['runite_ore', 2, 6], ['adamantite_ore', 5, 15], ['coal', 20, 60], ['gold_bar', 3, 8], ['cut_diamond', 1, 2], ['onyx', 0, 0]] },
  tool_crate: { outfit: 'carpenter', loot: [['coins', 300, 2500], ['oak_plank', 5, 15], ['teak_plank', 3, 10], ['mahogany_plank', 2, 6], ['steel_bar', 3, 8], ['clue_easy', 1, 1]] },
};
doYield = (orig => function (st, a, n, xpScale) {
  const done = orig(st, a, n, xpScale);
  if (done > 0 && a.crate) { const k = rollCount(done, a.crate[1] * M.luck); if (k) { add(a.crate[0], k); if (!OFF && k) toast(`📦 You earn ${k > 1 ? k + ' × ' : 'a '}${ITEMS[a.crate[0]].name}!`, 'rare'); } }
  if (done > 0 && a.rcMulti) { const extra = Math.floor(done * Math.max(0, LV.runecrafting - a.lvl) / 22); if (extra) add(Object.keys(a.out)[0], extra); }
  return done;
})(doYield);

/* ================= WILDERNESS ================= */
AREAS.push(['wild', '☠️ Wilderness']);
it7('revenant_ether', 'Revenant ether', 180, 'ether', '#3ae8a0', { cat: 'drop' });
[['ancient_emblem', 'Ancient emblem', 500000, '#c8a83a'], ['ancient_totem', 'Ancient totem', 1000000, '#a8c83a'], ['ancient_statuette', 'Ancient statuette', 3000000, '#e8c83a'], ['ancient_relic', 'Ancient relic', 16000000, '#ffd84a']]
  .forEach(([id, n, v, t]) => it7(id, n, v, 'emblem', t, { cat: 'drop', rare: true }));
gear('craws_bow', "Craw's bow", 'weapon', [0, 0, 0], { ranged: 60 }, { kind: 'longbow', tint: '#3ae8a0', wclass: 'ranged', ratk: 75, rstr: 60, spd: 1.0, wild: 1.5, value: 12000000 });
gear('viggoras_chainmace', "Viggora's chainmace", 'weapon', [82, 92, 0], { attack: 60 }, { kind: 'maul', tint: '#3ae8a0', spd: 1.0, wild: 1.5, value: 12000000 });
gear('thammarons_sceptre', "Thammaron's sceptre", 'weapon', [0, 0, 0], { magic: 60 }, { kind: 'wand', tint: '#3ae8a0', wclass: 'magic', cast: 'trident', matk: 25, mdmg: 15, spd: 1.0, wild: 1.5, value: 12000000 });
gear('tyrannical_ring', 'Tyrannical ring', 'ring', [8, 6, 0], null, { kind: 'ring', tint: '#c83a3a', value: 2000000 });
gear('treasonous_ring', 'Treasonous ring', 'ring', [16, 4, 0], null, { kind: 'ring', tint: '#3ac83a', value: 2000000 });
gear('ring_of_the_gods', 'Ring of the gods', 'ring', [0, 0, 8], null, { kind: 'ring', tint: '#e8c83a', reduce: 0.04, value: 4000000 });
gear('voidwaker', 'Voidwaker', 'weapon', [115, 110, 0], { attack: 80 }, { kind: 'sword', tint: '#9a3ae8', spd: 1.0, value: 50000000 });
Object.assign(PETS, {
  callisto_cub: { name: 'Callisto cub', icon: '🐻', st: 'combat', chance: 0, desc: '+3% combat max hit' },
  venenatis_spiderling: { name: 'Venenatis spiderling', icon: '🕷️', st: 'combat', chance: 0, desc: '+3% combat max hit' },
  vetion_jr: { name: "Vet'ion Jr.", icon: '💀', st: 'combat', chance: 0, desc: '+3% combat max hit' },
  scorpias_offspring: { name: "Scorpia's offspring", icon: '🦂', st: 'combat', chance: 0, desc: '+3% combat max hit' },
});
const REV = [['ancient_emblem', 1 / 60, 1, 1], ['ancient_totem', 1 / 150, 1, 1], ['ancient_statuette', 1 / 400, 1, 1], ['ancient_relic', 1 / 2500, 1, 1]];
const REVW = l => [['craws_bow', 1 / (12000 / l * 10), 1, 1], ['viggoras_chainmace', 1 / (12000 / l * 10), 1, 1], ['thammarons_sceptre', 1 / (12000 / l * 10), 1, 1]];
MON({ id: 'rev_goblin', name: 'Revenant goblin', icon: '👻', hue: 120, lvl: 28, hp: 40, atk: 25, def: 22, mh: 5, spd: 2.4, coins: [20, 200], area: 'wild', drops: [['revenant_ether', 1, 2, 6], ['bones', 1, 1, 1], ...REV.map(([i, c, a, b]) => [i, c / 2, a, b])] });
MON({ id: 'rev_hobgoblin', name: 'Revenant hobgoblin', icon: '👻', hue: 60, lvl: 60, hp: 72, atk: 55, def: 45, mh: 9, spd: 2.4, coins: [40, 400], area: 'wild', drops: [['revenant_ether', 1, 4, 10], ['big_bones', 1, 1, 1], ...REV, ...REVW(60)] });
MON({ id: 'rev_knight', name: 'Revenant knight', icon: '👻', hue: 200, lvl: 126, hp: 143, atk: 110, def: 95, mh: 15, spd: 2.4, coins: [100, 1200], area: 'wild', drops: [['revenant_ether', 1, 8, 20], ['big_bones', 1, 1, 1], ...REV.map(([i, c, a, b]) => [i, c * 1.5, a, b]), ...REVW(126)] });
MON({ id: 'rev_dragon', name: 'Revenant dragon', icon: '🐉', hue: 120, lvl: 135, hp: 140, atk: 120, def: 110, mh: 17, spd: 3, coins: [200, 2000], area: 'wild', dragon: true, drops: [['revenant_ether', 1, 10, 25], ['dragon_bones', 1, 1, 1], ...REV.map(([i, c, a, b]) => [i, c * 1.6, a, b]), ...REVW(135)] });
MON({ id: 'chaos_fanatic', name: 'Chaos Fanatic', icon: '🧙‍♂️', hue: 300, boss: true, lvl: 202, hp: 225, atk: 160, def: 120, mh: 22, spd: 3, coins: [1000, 8000], area: 'wild', weak: 'ranged', noMelee: false, drops: [['big_bones', 1, 1, 1], ['ancient_emblem', 1 / 30, 1, 1], ['tyrannical_ring', 1 / 128, 1, 1], ['treasonous_ring', 1 / 128, 1, 1], ['clue_elite', 1 / 50, 1, 1], ['pet:scorpias_offspring', 1 / 3000, 1, 1]] });
MON({ id: 'scorpia', name: 'Scorpia', icon: '🦂', hue: 0, boss: true, lvl: 225, hp: 200, atk: 210, def: 140, mh: 24, spd: 2.4, coins: [1000, 8000], area: 'wild', weak: 'melee', drops: [['big_bones', 1, 1, 1], ['ancient_totem', 1 / 40, 1, 1], ['ring_of_the_gods', 1 / 256, 1, 1], ['pet:scorpias_offspring', 1 / 2000, 1, 1]] });
MON({ id: 'venenatis', name: 'Venenatis', icon: '🕷️', hue: 100, boss: true, lvl: 464, hp: 420, atk: 320, def: 260, mh: 38, spd: 3, coins: [5000, 25000], area: 'wild', weak: 'melee', minCombat: 95, drops: [['dragon_bones', 1, 2, 2], ['treasonous_ring', 1 / 128, 1, 1], ['ancient_statuette', 1 / 60, 1, 1], ['voidwaker', 1 / 900, 1, 1], ['clue_elite', 1 / 40, 1, 1], ['pet:venenatis_spiderling', 1 / 1500, 1, 1]] });
MON({ id: 'callisto', name: 'Callisto', icon: '🐻', hue: 20, boss: true, lvl: 470, hp: 450, atk: 340, def: 240, mh: 42, spd: 3, coins: [5000, 25000], area: 'wild', weak: 'ranged', minCombat: 95, drops: [['dragon_bones', 1, 2, 2], ['tyrannical_ring', 1 / 128, 1, 1], ['ancient_statuette', 1 / 60, 1, 1], ['voidwaker', 1 / 900, 1, 1], ['clue_elite', 1 / 40, 1, 1], ['pet:callisto_cub', 1 / 1500, 1, 1]] });
MON({ id: 'vetion', name: "Vet'ion", icon: '💀', hue: 260, boss: true, lvl: 454, hp: 440, atk: 330, def: 280, mh: 40, spd: 3, coins: [5000, 25000], area: 'wild', weak: 'melee', minCombat: 95, drops: [['dragon_bones', 1, 2, 2], ['ring_of_the_gods', 1 / 128, 1, 1], ['ancient_relic', 1 / 600, 1, 1], ['voidwaker', 1 / 900, 1, 1], ['clue_elite', 1 / 40, 1, 1], ['pet:vetion_jr', 1 / 1500, 1, 1]] });
weaponVs = (orig => function (m) { const w = ITEMS[S.equip.weapon]; return orig(m) * (w?.wild && m?.area === 'wild' ? w.wild : 1); })(weaponVs);
die = (orig => function () {
  const m = curMon(), wild = m?.area === 'wild';
  orig();
  if (wild) { const lost = Math.floor(Math.min(S.coins * 0.1, 50000000)); S.coins -= lost; const msg = `☠️ A player-killer loots your corpse: you lose 🪙${fmt(lost)} (10% of your coins).`; if (OFF) OFFLOG.push(msg); else toast(msg, 'warn', 6000); }
})(die);

/* ================= THEATRE OF BLOOD ================= */
gear('scythe_of_vitur', 'Scythe of vitur', 'weapon', [125, 145, 0], { attack: 80, strength: 90 }, { kind: 'scythe2', tint: '#c8c8d8', twoHanded: true, spd: 1.0, multiHit: true, value: 150000000 });
gear('ghrazi_rapier', 'Ghrazi rapier', 'weapon', [94, 89, 0], { attack: 80 }, { kind: 'sword', tint: '#c81a2a', spd: 0.9, value: 30000000 });
gear('sanguinesti_staff', 'Sanguinesti staff', 'weapon', [0, 0, 0], { magic: 82 }, { kind: 'staff', tint: '#c81a2a', wclass: 'magic', cast: 'swamp', matk: 25, mdmg: 15, sang: true, spd: 1.0, value: 60000000 });
gear('justiciar_faceguard', 'Justiciar faceguard', 'head', [0, 0, 60], { defence: 75 }, { kind: 'full_helm', tint: '#e8d8a0', reduce: 0.02, value: 20000000 });
gear('justiciar_chestguard', 'Justiciar chestguard', 'body', [0, 0, 132], { defence: 75 }, { kind: 'platebody', tint: '#e8d8a0', reduce: 0.03, value: 20000000 });
gear('justiciar_legguards', 'Justiciar legguards', 'legs', [0, 0, 95], { defence: 75 }, { kind: 'platelegs', tint: '#e8d8a0', reduce: 0.02, value: 20000000 });
PETS.lil_zik = { name: "Lil' Zik", icon: '🕷️', st: 'combat', chance: 0, desc: '+3% combat max hit (ToB pet)' };
const RAID_TOB = ['tob_maiden', 'tob_bloat', 'tob_nylocas', 'tob_sotetseg', 'tob_xarpus', 'tob_verzik'];
[['tob_maiden', 'The Maiden of Sugadinti', '🩸', 540, 500, 350, 200, 34, 3, 'magic'], ['tob_bloat', 'Pestilent Bloat', '🧟', 420, 400, 300, 100, 30, 2.4, 'melee'], ['tob_nylocas', 'Nylocas Vasilias', '🕷️', 800, 500, 340, 220, 32, 2.4, 'ranged'],
  ['tob_sotetseg', 'Sotetseg', '🦂', 995, 600, 380, 250, 38, 3, 'melee'], ['tob_xarpus', 'Xarpus', '🦗', 960, 550, 360, 250, 36, 3, 'ranged'], ['tob_verzik', 'Verzik Vitur', '🕸️', 1520, 1400, 450, 250, 46, 3, 'magic']]
  .forEach(([id, name, icon, lvl, hp, atk, def, mh, spd, weak], i) => MON({ id, name, icon, lvl, hp, atk, def, mh, spd, weak, area: 'raids', raid: 'tob', order: i, boss: id === 'tob_verzik', minCombat: 110, drops: [] }));
const TOB_UNIQUES = [['avernic_defender', 8], ['ghrazi_rapier', 2], ['sanguinesti_staff', 2], ['justiciar_faceguard', 2], ['justiciar_chestguard', 2], ['justiciar_legguards', 2], ['scythe_of_vitur', 1]];
const TOB_COMMON = [['coins', 30000, 100000], ['blood_rune', 100, 400], ['death_rune', 200, 600], ['rune_bar', 8, 20], ['dragon_bones', 8, 20], ['cut_dragonstone', 2, 5]];
raidKill = (orig => function (m) {
  if (m.raid !== 'tob') return orig(m);
  const R = S.raids ||= {};
  if (m.id !== 'tob_verzik') { S.combat.mon = RAID_TOB[m.order + 1]; UI.force = true; return; }
  R.tob = (R.tob || 0) + 1; track('raid', 'tob', 1);
  const got = [];
  if (rnd() < (1 / 9) * M.luck) { const u = pickWeighted(TOB_UNIQUES); rareGet(u, 1, 'drop'); logItem(u, 1); got.push('💜 ' + ITEMS[u].name); R.tobPurples = (R.tobPurples || 0) + 1; if (rnd() < 1 / 65) givePet('lil_zik'); }
  else for (let i = 0; i < 2; i++) { const [id, a, b] = TOB_COMMON[randInt(0, TOB_COMMON.length - 1)]; if (id === 'coins') { const c = randInt(a, b); gainCoins(c); got.push('🪙' + fmt(c)); } else { const q = randInt(a, b); add(id, q); got.push(`${q} × ${ITEMS[id].name}`); } }
  if (rnd() < 1 / 10) { add('clue_elite', 1); got.push('Clue scroll (elite)'); }
  const msg = `🩸 Theatre of Blood complete (${R.tob}): ${got.join(', ')}`;
  if (OFF) OFFLOG.push(msg); else { toast(msg, got[0]?.startsWith('💜') ? 'pet' : 'rare', 7000); SFX.play(got[0]?.startsWith('💜') ? 'pet' : 'clue'); }
  S.combat.mon = RAID_TOB[0]; UI.force = true;
})(raidKill);
raidPanel = (orig => function () {
  const R = S.raids || {}, cur = curMon(), at = cur.raid === 'tob' ? cur.order : -1;
  return orig() + `<div class="panel"><h3>🩸 Theatre of Blood <small class="muted">· ${fmt(R.tob || 0)} completions · ${fmt(R.tobPurples || 0)} purples</small></h3>
    <div class="chips">${RAID_TOB.map((id, i) => `<span class="chip ${i < at ? 'on' : ''}">${MONSTER_BY_ID[id].icon} ${MONSTER_BY_ID[id].name.replace(/^The /, '').split(' ')[0]}${i < at ? ' ✔' : ''}</span>`).join('')}</div>
    <p class="muted small">Six rooms ending with Verzik Vitur. 1/9 purple chance: Avernic defender hilt, Ghrazi rapier, Sanguinesti staff (heals you), Justiciar armour or the Scythe of vitur (hits up to 3 times). Requires combat level 110.</p>
    <button class="btn big" data-act="tob-start">${S.combat.fighting && cur.raid === 'tob' ? 'Raid in progress…' : 'Enter the Theatre'}</button></div>`;
})(raidPanel);
playerAttack = (orig => function (tap, mult, acc, noAmmo) {
  const C = S.combat, before = C.mhp, w = ITEMS[S.equip.weapon];
  const d = orig(tap, mult, acc, noAmmo);
  if (w?.sang && d > 0 && rnd() < 1 / 6) C.hp = Math.min(maxHp(), C.hp + Math.ceil(d / 2));
  if (w?.multiHit && !noAmmo && C.mhp > 0 && C.fighting && curMon().hp >= 60) { let extra = orig(tap, (mult || 1) * 0.5, acc, true); if (C.mhp > 0 && curMon().hp >= 120) extra += orig(tap, (mult || 1) * 0.25, acc, true); return d + extra; }
  return d;
})(playerAttack);

/* ================= SLAYER BOSSES & BLOCK LIST ================= */
gear('abyssal_bludgeon', 'Abyssal bludgeon', 'weapon', [102, 141, 0], { attack: 70, strength: 70 }, { kind: 'maul', tint: '#5a3a5a', twoHanded: true, spd: 1.0, value: 20000000 });
gear('smoke_battlestaff', 'Smoke battlestaff', 'weapon', [0, 0, 0], { magic: 75 }, { kind: 'staff', tint: '#9a9a9a', wclass: 'magic', cast: 'spell', matk: 20, mdmg: 10, spd: 1.0, value: 10000000 });
gear('granite_ring', 'Granite ring', 'ring', [6, 6, 6], null, { kind: 'ring', tint: '#8a8a8a', value: 1500000 });
gear('granite_hammer', 'Granite hammer', 'weapon', [69, 74, 0], { attack: 50, strength: 50 }, { kind: 'maul', tint: '#8a8a8a', spd: 1.0, value: 6000000 });
Object.assign(PETS, {
  abyssal_orphan: { name: 'Abyssal orphan', icon: '👶', st: 'combat', chance: 0, desc: '+3% combat max hit' },
  pet_smoke_devil: { name: 'Pet smoke devil', icon: '💨', st: 'combat', chance: 0, desc: '+3% combat max hit' },
  noon: { name: 'Noon', icon: '🗿', st: 'combat', chance: 0, desc: '+3% combat max hit' },
});
MON({ id: 'grotesque_guardians', name: 'Grotesque Guardians', icon: '🗿', hue: 0, boss: true, sl: 75, lvl: 328, hp: 450, atk: 220, def: 180, mh: 30, spd: 3, coins: [3000, 15000], area: 'slayer', weak: 'ranged', drops: [['granite_hammer', 1 / 300, 1, 1], ['granite_ring', 1 / 250, 1, 1], ['granite_maul', 1 / 250, 1, 1], ['clue_elite', 1 / 60, 1, 1], ['pet:noon', 1 / 3000, 1, 1]] });
MON({ id: 'abyssal_sire', name: 'Abyssal Sire', icon: '👁️', hue: 280, boss: true, sl: 85, lvl: 350, hp: 400, atk: 200, def: 250, mh: 32, spd: 3, coins: [3000, 15000], area: 'slayer', weak: 'melee', drops: [['abyssal_bludgeon', 1 / 200, 1, 1], ['abyssal_dagger', 1 / 200, 1, 1], ['abyssal_whip', 1 / 100, 1, 1], ['clue_elite', 1 / 60, 1, 1], ['pet:abyssal_orphan', 1 / 2500, 1, 1]] });
MON({ id: 'thermy', name: 'Thermonuclear smoke devil', icon: '💨', hue: 0, boss: true, sl: 93, lvl: 301, hp: 240, atk: 180, def: 200, mh: 28, spd: 2.4, coins: [3000, 15000], area: 'slayer', weak: 'ranged', needs: 'facemask', drops: [['occult_necklace', 1 / 350, 1, 1], ['smoke_battlestaff', 1 / 500, 1, 1], ['dragon_chainbody', 1 / 2000, 1, 1], ['clue_elite', 1 / 60, 1, 1], ['pet:pet_smoke_devil', 1 / 3000, 1, 1]] });
SLAYER_SHOP.push({ id: 'blocklist', name: 'Block list', icon: '🚫', pts: 200, unlock: true, desc: 'Lets you block up to 6 monsters so masters never assign them (100 points per block).' },
  { id: 'extend', name: 'Longer tasks', icon: '⏳', pts: 250, unlock: true, desc: 'Tasks are 50% longer: more kills, more Slayer XP, same points.' });
taskPool = (orig => function (ms) { const b = S.slayer.blocked || []; const p = orig(ms); const f = p.filter(m => !b.includes(m.id)); return f.length ? f : p; })(taskPool);
assignTask = (orig => function (mid, quiet) { const before = S.slayer.total; const r = orig(mid, quiet); const sl = S.slayer; if (sl.unlocks.extend && sl.left > 0 && sl.left === sl.total && !MONSTER_BY_ID[sl.mon]?.boss) { sl.left = sl.total = Math.round(sl.total * 1.5); } return r; })(assignTask);
openSlayerShop = (orig => function () {
  orig();
  const sl = S.slayer; if (!sl.unlocks.blocklist) return;
  const b = sl.blocked ||= [];
  $('#modal').insertAdjacentHTML('beforeend', `<div class="panel"><h3>🚫 Block list ${b.length}/6</h3>${b.map(id => `<span class="chip">${MONSTER_BY_ID[id]?.icon || ''} ${MONSTER_BY_ID[id]?.name || id} <button class="btn small" data-act="slunblock" data-id="${id}">✕</button></span>`).join(' ') || '<p class="muted small">Nothing blocked.</p>'}
    ${sl.left > 0 && b.length < 6 ? `<button class="btn" data-act="slblock">Block current task (${MONSTER_BY_ID[sl.mon].name}) · 100 pts</button>` : ''}</div>`);
})(openSlayerShop);

/* ---------- open-item loot for jars & crates ---------- */
openItem = (orig => function (id, q = 1) {
  const imp = IMPS.find(([k]) => id === k + '_impling_jar'), crate = CRATES[id];
  if (!imp && !crate) return orig(id, q);
  q = Math.min(q, have(id)); if (q <= 0) return;
  remove(id, q);
  const table = imp ? IMP_LOOT[imp[0]] : crate.loot;
  for (let k = 0; k < q; k++) {
    for (let r = 0; r < (imp ? 1 : 2); r++) {
      const [iid, a, b, ch] = table[randInt(0, table.length - 1)];
      if (ch && rnd() >= ch) continue;
      if (iid === 'coins') gainCoins(randInt(a, b)); else if (ITEMS[iid] && b > 0) add(iid, randInt(a, b));
    }
    if (crate) {
      if (rnd() < (typeof OUTFIT_RATE === 'number' ? OUTFIT_RATE : 1 / 40) * M.luck) { const set = crate.also && rnd() < 0.4 ? crate.also : crate.outfit; if (typeof rollOutfitPiece === 'function') rollOutfitPiece(set); else { const pid = `${set}_${OUTFIT_PIECES[randInt(0, 3)][0]}`; add(pid, 1); logItem(pid, 1); } }
      if (crate.pet && rnd() < 1 / 1500 * M.luck) givePet(crate.pet);
      if (id === 'zalcano_cache' && rnd() < 1 / 400) add('onyx', 1);
    }
  }
})(openItem);

/* ---------- collection log, sources, achievements ---------- */
(function () {
  const addS = (id, s) => { (SOURCES[id] ||= []).push(s); };
  const page = (id, name, icon, cat, items) => CLOG.push({ id, name, icon, cat, items });
  page('tob', 'Theatre of Blood', '🩸', 'Raids', [...TOB_UNIQUES.map(u => u[0]), 'pet:lil_zik']);
  page('wild', 'Wilderness', '☠️', 'Wilderness', ['craws_bow', 'viggoras_chainmace', 'thammarons_sceptre', 'ancient_emblem', 'ancient_totem', 'ancient_statuette', 'ancient_relic', 'tyrannical_ring', 'treasonous_ring', 'ring_of_the_gods', 'voidwaker', 'pet:callisto_cub', 'pet:venenatis_spiderling', 'pet:vetion_jr', 'pet:scorpias_offspring']);
  page('skillboss', 'Skilling bosses', '❄️', 'Skilling', [...Object.keys(OUTFITS).flatMap(k => OUTFIT_PIECES.map(([p]) => `${k}_${p}`)), 'pet:phoenix', 'pet:tiny_tempor', 'pet:smolcano']);
  page('slayerboss', 'Slayer bosses', '👁️', 'Slayer', ['abyssal_bludgeon', 'smoke_battlestaff', 'granite_hammer', 'granite_ring', 'pet:abyssal_orphan', 'pet:pet_smoke_devil', 'pet:noon']);
  page('hunter', 'Hunter', '🦊', 'Skilling', ['moonlight_moth', 'black_chinchompa', 'pet:baby_chin', 'pet:rift_guardian', 'pet:beaver2']);
  CLOG.flatMap(p => p.items).forEach(i => CLOG_ITEMS.add(i));
  Object.keys(OUTFITS).forEach(k => OUTFIT_PIECES.forEach(([p]) => addS(`${k}_${p}`, { prospector: 'Zalcano caches', lumberjack: 'Wintertodt supply crates', angler: 'Tempoross reward pools', pyromancer: 'Wintertodt supply crates', carpenter: 'Mahogany Homes crates' }[k] + ' · +2.5% XP each (just own it)')));
  TOB_UNIQUES.forEach(([id]) => addS(id, 'Theatre of Blood (raid purple)'));
  addS('pure_essence', 'Mining → Essence mine, General store'); addS('revenant_ether', 'Revenants (Wilderness)');
  IMPS.forEach(([k]) => addS(k + '_impling_jar', 'Hunter: catch implings · open for loot'));
  PLANKS.forEach(([id, n, log]) => addS(id, `Construction → Sawmill (from ${ITEMS[log]?.name.toLowerCase() || log})`));
  [
    ach('rc_50', 'Rune Mysteries', 'Reach Runecrafting 50', '🌀', g => g.LV.runecrafting >= 50, 10), ach('con_50', 'Handyman', 'Reach Construction 50', '🔨', g => g.LV.construction >= 50, 10),
    ach('hunt_50', 'Big Game', 'Reach Hunter 50', '🦊', g => g.LV.hunter >= 50, 10), ach('tob_1', 'Bloodied', 'Complete the Theatre of Blood', '🩸', g => (g.S.raids?.tob || 0) >= 1, 25),
    ach('wild_boss', 'Wilderness Warlord', "Kill Callisto, Venenatis and Vet'ion", '☠️', g => ['callisto', 'venenatis', 'vetion'].every(id => g.S.kills[id]), 25),
    ach('outfit_full', 'Dressed for Work', 'Own a full skilling outfit', '👷', () => Object.keys(OUTFITS).some(k => outfitCount(k) === 4), 15)];
})();
for (const m of MONSTERS) MONSTER_BY_ID[m.id] = m;
Object.assign(UPGRADE_BY_ID, Object.fromEntries(UPGRADES.map(u => [u.id, u])));
Object.keys(ITEMS).forEach(id => { if (!(id in ITEM_ORDER)) ITEM_ORDER[id] = Object.keys(ITEM_ORDER).length; });
for (const id of Object.keys(ITEMS)) if (!ITEMS[id].hidden && !ITEMS[id].untradeable && !GE_SET.has(id) && ITEMS[id].value >= 1 && !ITEMS[id].open) { GE_ITEMS.push(id); GE_SET.add(id); }

document.addEventListener('click', e => {
  if (e.target.closest('[data-nav]')) return;
  const t = e.target.closest('[data-act]'); if (!t) return;
  const d = t.dataset, sl = S.slayer; let h = true;
  switch (d.act) {
    case 'tob-start': { const cur = curMon(); if (S.combat.fighting && cur.raid === 'tob') break; if (S.combat.fighting) retreat(); S.combat.mon = RAID_TOB[0]; startFight(); break; }
    case 'slblock': if (sl.points < 100) { toast('You need 100 Slayer points.', 'warn'); break; } (sl.blocked ||= []).push(sl.mon); sl.points -= 100; sl.left = 0; sl.mon = null; closeModal(); toast('🚫 Task blocked. Masters will never assign it again.', 'rare'); break;
    case 'slunblock': sl.blocked = (sl.blocked || []).filter(x => x !== d.id); closeModal(); openSlayerShop(); break;
    default: h = false;
  }
  if (h) { e.stopImmediatePropagation(); UI.force = true; render(); liveUpdate(); }
}, true);
