'use strict';
/* =========================================================
   CLICKSCAPE v5.0 (part 2) — systems & quality of life
   Quests, diaries, mastery, save files, XP tracker, bulk hire,
   message filters, compact mode, interactive random events,
   login streak, titles, Christmas event
   ========================================================= */

/* ---------- Permanent buffs from quests & diaries ---------- */
// buff: { xp, cxp, luck, sell, dmg, offline, sk: {skill: xpMult}, st: {station: speedMult}, dragon }
function permBuffs() {
  const out = [];
  for (const q of QUESTS) if (S.quests?.[q.id]) out.push(q.buff || {});
  for (const d of DIARIES) d.tiers.forEach((t, i) => { if (S.diary?.[d.id + i]) out.push(t.buff || {}); });
  return out;
}
recalc4 = (orig => function () {
  orig();
  if (!S.asc) return;
  for (const b of permBuffs()) {
    if (b.xp) M.xp *= b.xp; if (b.cxp) M.cxp *= b.cxp; if (b.luck) M.luck *= b.luck; if (b.sell) M.sell *= b.sell; if (b.dmg) M.dmg *= b.dmg;
    if (b.st) for (const st in b.st) if (M.rate[st] !== undefined) { M.rate[st] *= b.st[st]; M.tap[st] *= b.st[st]; }
    if (b.allst) for (const st of STATION_ORDER) { M.rate[st] *= b.allst; }
  }
  for (const st of STATION_ORDER) { const m = 1 + 0.01 * masteryLvl(STATIONS[st].skill); M.rate[st] *= m; M.tap[st] *= m; }
})(recalc4);
skillXpMult = (orig => function (skill) { let m = orig(skill); for (const b of permBuffs()) if (b.sk?.[skill]) m *= b.sk[skill]; return m; })(skillXpMult);
offlineHours = (orig => function () { return orig() + permBuffs().reduce((a, b) => a + (b.offline || 0), 0); })(offlineHours);
weaponVs = (orig => function (m) { let f = orig(m); if (m?.dragon) for (const b of permBuffs()) if (b.dragon) f *= b.dragon; return f; })(weaponVs);

/* ---------- Skill mastery (XP beyond the level cap) ---------- */
function masteryLvl(sk) { if (!S?.xp || !LV[sk] || LV[sk] < MAX_LVL[sk]) return 0; const ex = S.xp[sk] - XP_TABLE[MAX_LVL[sk]]; return ex > 0 ? Math.min(50, Math.floor(Math.sqrt(ex / 250000))) : 0; }
function masteryXp(sk) { return 1 + 0.01 * masteryLvl(sk); }
skillHead = (orig => function (sk) {
  const h = orig(sk);
  if (LV[sk] < MAX_LVL[sk]) return h;
  const L = masteryLvl(sk), ex = Math.max(0, S.xp[sk] - XP_TABLE[MAX_LVL[sk]]), next = Math.pow(L + 1, 2) * 250000;
  return h + `<div class="panel glow small">⭐ <b>${SKILLS[sk].name} mastery ${L}/50</b> · +${L}% speed & XP · ${L >= 50 ? 'MAXED' : `${fmt(Math.max(0, next - ex))} XP to mastery ${L + 1}`}</div>`;
})(skillHead);

/* ---------- Quests ---------- */
const QUESTS = [
  { id: 'cook', name: "Cook's Assistant", icon: '🍳', qp: 1, req: { skills: { cooking: 5 } }, give: { egg: 0 }, cost: { raw_chicken: 0 }, xp: { cooking: 300 }, buff: { sk: { cooking: 1.05 } }, txt: '+5% Cooking XP' },
  { id: 'doric', name: "Doric's Quest", icon: '⛏️', qp: 1, req: { skills: { mining: 15 } }, cost: { copper_ore: 6, iron_ore: 4 }, xp: { mining: 1300 }, coins: 1800, buff: { st: { anvil: 1.05 } }, txt: "Doric's anvil: +5% Anvil speed" },
  { id: 'rune_myst', name: 'Rune Mysteries', icon: '🌀', qp: 1, req: { skills: { runecrafting: 1 } }, cost: { pure_essence: 25 }, xp: { runecrafting: 250 }, buff: { st: { runealtar: 1.1 } }, txt: 'Air talisman: +10% Runecrafting speed' },
  { id: 'waterfall', name: 'Waterfall Quest', icon: '💧', qp: 1, req: { skills: { attack: 20 } }, cost: { rope: 0 }, xp: { attack: 13750, strength: 13750 }, give: { cut_diamond: 2, gold_bar: 2 }, txt: 'Diamonds, gold bars & big Attack/Strength XP' },
  { id: 'witch', name: "Witch's House", icon: '🏚️', qp: 4, req: { skills: { hitpoints: 25 } }, xp: { hitpoints: 6325 }, txt: 'Hitpoints XP' },
  { id: 'eagle', name: "Eagles' Peak", icon: '🦅', qp: 2, req: { skills: { hunter: 27 } }, cost: { feather: 50 }, xp: { hunter: 2500 }, buff: { st: { hunt: 1.1 } }, txt: '+10% Hunter speed' },
  { id: 'lostcity', name: 'Lost City', icon: '🧚', qp: 3, req: { skills: { crafting: 31, woodcutting: 36 } }, xp: { crafting: 2000 }, buff: { luck: 1.05 }, txt: 'Zanaris: rare drops +5% more likely' },
  { id: 'dragon1', name: 'Dragon Slayer I', icon: '🐉', qp: 2, req: { qp: 10, combat: 40, kills: { green_dragon: 1 } }, cost: { anti_dragon_shield: 0 }, xp: { strength: 18650, defence: 18650 }, buff: { dragon: 1.05 }, txt: '+5% damage against dragons' },
  { id: 'mm1', name: 'Monkey Madness I', icon: '🐒', qp: 3, req: { qp: 15, skills: { agility: 30 }, combat: 50 }, xp: { attack: 35000, defence: 35000 }, give: { dragon_scimitar: 1 }, buff: { cxp: 1.05 }, txt: 'Dragon scimitar · +5% combat XP' },
  { id: 'fairy2', name: 'Fairytale II', icon: '🍄', qp: 2, req: { qp: 15, skills: { farming: 49, herblore: 57 } }, xp: { farming: 3500, herblore: 3500 }, buff: { offline: 2 }, txt: 'Fairy rings: +2h offline progress' },
  { id: 'dt1', name: 'Desert Treasure I', icon: '🏜️', qp: 3, req: { qp: 20, skills: { magic: 50, thieving: 53, firemaking: 50, slayer: 10 }, kills: { dagannoth_rex: 1 } }, cost: { blood_rune: 50, death_rune: 100 }, xp: { magic: 20000 }, buff: { ancients: true }, txt: 'Ancient Magicks: magic max hit +15%' },
  { id: 'rfd', name: 'Recipe for Disaster', icon: '🍲', qp: 10, req: { qp: 25, skills: { cooking: 70, agility: 48, mining: 50, fishing: 53, thieving: 53, herblore: 25, magic: 59, smithing: 40, firemaking: 50, ranged: 40, crafting: 40, fletching: 10, woodcutting: 36 } }, xp: { cooking: 20000 }, give: { barrows_gloves: 1 }, buff: { st: { range: 1.1 } }, txt: 'Barrows gloves · +10% Cooking speed' },
  { id: 'lunar', name: 'Lunar Diplomacy', icon: '🌙', qp: 2, req: { qp: 30, skills: { magic: 65, crafting: 61, mining: 60, woodcutting: 55, firemaking: 49, defence: 40, herblore: 5 } }, cost: { astral_rune: 50 }, xp: { magic: 5000, runecrafting: 5000 }, buff: { sk: { herblore: 1.1, farming: 1.1 } }, txt: 'Lunar spells: +10% Herblore & Farming XP' },
  { id: 'construct', name: 'Love Story', icon: '🏡', qp: 2, req: { qp: 20, skills: { construction: 68, crafting: 67, magic: 77 } }, cost: { mahogany_plank: 20 }, xp: { construction: 15000 }, buff: { st: { workbench: 1.15, sawmill: 1.15 } }, txt: '+15% Construction speed' },
  { id: 'dt2', name: 'Desert Treasure II', icon: '💀', qp: 5, req: { qp: 45, skills: { firemaking: 75, magic: 75, thieving: 70, herblore: 62, runecrafting: 60, construction: 60 }, combat: 100 }, cost: { blood_rune: 500, soul_rune: 500 }, xp: { magic: 60000, slayer: 30000 }, buff: { dmg: 1.05 }, txt: '+5% damage with everything' },
  { id: 'ds2', name: 'Dragon Slayer II', icon: '🐲', qp: 5, req: { qp: 50, skills: { magic: 75, smithing: 70, mining: 68, crafting: 62, agility: 60, thieving: 60, construction: 50, hitpoints: 50 }, kills: { vorkath: 1 } }, xp: { smithing: 25000, mining: 18000, agility: 15000 }, coins: 250000, buff: { dragon: 1.15 }, txt: '+15% damage against dragons' },
  { id: 'sote', name: 'Song of the Elves', icon: '🧝', qp: 1, req: { qp: 55, skills: { agility: 70, construction: 70, farming: 70, herblore: 70, hunter: 70, mining: 70, smithing: 70, woodcutting: 70 } }, xp: { agility: 20000, construction: 20000, farming: 20000, herblore: 20000, hunter: 20000, mining: 20000, smithing: 20000, woodcutting: 20000 }, buff: { allst: 1.1 }, txt: 'Prifddinas: every worker +10% faster' },
];
gear('quest_cape', 'Quest point cape', 'cape', [0, 0, 9], null, { kind: 'cape', tint: '#2a5ad8', trim: '#e8e8e8', untradeable: true, value: 1 });
const QP_TOTAL = QUESTS.reduce((a, q) => a + q.qp, 0);
const questPoints = () => QUESTS.reduce((a, q) => a + (S.quests?.[q.id] ? q.qp : 0), 0);
maxHit = (orig => function (tap, m) { const v = orig(tap, m); return S.quests?.dt1 && wclass() === 'magic' ? Math.floor(v * 1.15) : v; })(maxHit);
function questReqs(q) {
  const r = [], R = q.req || {};
  if (R.qp) r.push([`${R.qp} quest points`, questPoints() >= R.qp]);
  if (R.combat) r.push([`Combat ${R.combat}`, combatLevel() >= R.combat]);
  for (const s in R.skills || {}) r.push([`${SKILLS[s].icon} ${SKILLS[s].name} ${R.skills[s]}`, LV[s] >= R.skills[s]]);
  for (const id in R.kills || {}) if (MONSTER_BY_ID[id]) r.push([`Defeat ${MONSTER_BY_ID[id].name}`, (S.kills[id] || 0) >= R.kills[id]]);
  for (const id in q.cost || {}) if (q.cost[id] > 0 && ITEMS[id]) r.push([`${q.cost[id]} × ${ITEMS[id].name}`, have(id) >= q.cost[id]]);
  return r;
}
function doQuest(id) {
  const q = QUESTS.find(x => x.id === id); if (!q || S.quests[id]) return;
  if (!questReqs(q).every(r => r[1])) return toast('You don’t meet the requirements yet.', 'warn');
  for (const i in q.cost || {}) if (q.cost[i] > 0) remove(i, q.cost[i]);
  S.quests[id] = Date.now();
  for (const s in q.xp || {}) gainXP(s, q.xp[s] / (M.xp * (COMBAT_SKILLS.includes(s) ? M.cxp : SKILL_XP_RATE)));
  for (const i in q.give || {}) if (q.give[i] > 0 && ITEMS[i]) { add(i, q.give[i]); logItem(i, q.give[i]); }
  if (q.coins) gainCoins(q.coins);
  if (questPoints() >= QP_TOTAL && !have('quest_cape')) { add('quest_cape', 1); logItem('quest_cape', 1); }
  recalc(); SFX.play('ach'); burst();
  openModal(`<div class="item-modal"><h2>${q.icon} Quest complete!</h2><p>Congratulations, you have completed <b>${q.name}</b>.</p><p class="y">+${q.qp} quest point${q.qp > 1 ? 's' : ''} (${questPoints()}/${QP_TOTAL})</p><p class="small">${q.txt}</p>${questPoints() >= QP_TOTAL ? '<p>🧣 You earned the <b>Quest point cape</b>!</p>' : ''}<button class="btn big" data-act="close">Excellent!</button></div>`);
}
function viewQuests() {
  const qp = questPoints();
  return subHead('🗺️ Quests') + `<div class="panel"><p>Quest points: <b class="y">${qp}/${QP_TOTAL}</b>. Quests give XP, items and <b>permanent bonuses</b>. They stay complete through ascension.</p></div>
    <div class="list">${QUESTS.map(q => { const done = S.quests?.[q.id], rs = questReqs(q), ok = rs.every(r => r[1]);
      return `<div class="upg ${done ? 'got' : ok ? '' : 'locked'}"><div class="upg-icon">${q.icon}</div><div class="upg-main"><b>${q.name} <small class="muted">· ${q.qp} QP</small></b><small>🎁 ${q.txt}</small>
        ${done ? '' : `<small>${rs.map(([t, k]) => `<span class="${k ? 'cb-green' : 'cb-red'}">${k ? '✔' : '✗'} ${t}</span>`).join(' · ') || 'No requirements'}</small>`}</div>
        ${done ? '<span class="y">✔ Done</span>' : `<button class="btn ${ok ? '' : 'poor'}" data-act="quest" data-id="${q.id}">Start</button>`}</div>`; }).join('')}</div>`;
}

/* ---------- Achievement diaries ---------- */
const kc = id => S.kills[id] || 0, lt = k => S.lifetime[k] || 0;
const DIARIES = [
  { id: 'lumb', name: 'Lumbridge', icon: '🏰', tiers: [
    { tasks: [['Kill 25 cows', () => kc('cow') >= 25], ['Reach Cooking 15', () => LV.cooking >= 15], ['Reach Woodcutting 15', () => LV.woodcutting >= 15]], coins: 5000, buff: { sk: { cooking: 1.03 } }, txt: '+3% Cooking XP' },
    { tasks: [['Reach Runecrafting 20', () => LV.runecrafting >= 20], ['Reach Firemaking 40', () => LV.firemaking >= 40], ['Complete Rune Mysteries', () => S.quests?.rune_myst]], coins: 25000, buff: { st: { runealtar: 1.05 } }, txt: '+5% Runecrafting speed' },
    { tasks: [['Reach Cooking 70', () => LV.cooking >= 70], ['Reach Woodcutting 70', () => LV.woodcutting >= 70], ['Complete Recipe for Disaster', () => S.quests?.rfd]], coins: 150000, buff: { st: { range: 1.1, forest: 1.05 } }, txt: '+10% Cooking & +5% Woodcutting speed' },
    { tasks: [['Reach Runecrafting 77', () => LV.runecrafting >= 77], ['Reach Woodcutting 99', () => LV.woodcutting >= 99], ['Reach Cooking 99', () => LV.cooking >= 99]], coins: 1000000, buff: { allst: 1.05 }, txt: 'Explorer’s ring 4: every worker +5%' }] },
  { id: 'varrock', name: 'Varrock', icon: '⚒️', tiers: [
    { tasks: [['Reach Mining 15', () => LV.mining >= 15], ['Reach Smithing 15', () => LV.smithing >= 15], ['Complete Doric’s Quest', () => S.quests?.doric]], coins: 5000, buff: { st: { furnace: 1.05 } }, txt: 'Varrock armour 1: +5% Furnace speed' },
    { tasks: [['Reach Smithing 40', () => LV.smithing >= 40], ['Reach Thieving 25', () => LV.thieving >= 25], ['Smelt or smith 2,000 items', () => lt('smith') >= 2000 || LV.smithing >= 50]], coins: 25000, buff: { st: { furnace: 1.1 } }, txt: 'Varrock armour 2: +10% Furnace speed' },
    { tasks: [['Reach Smithing 70', () => LV.smithing >= 70], ['Reach Mining 70', () => LV.mining >= 70], ['Reach Construction 50', () => LV.construction >= 50]], coins: 150000, buff: { st: { furnace: 1.15, anvil: 1.1 } }, txt: 'Varrock armour 3: +15% Furnace, +10% Anvil' },
    { tasks: [['Reach Smithing 99', () => LV.smithing >= 99], ['Reach Mining 99', () => LV.mining >= 99], ['Reach Construction 85', () => LV.construction >= 85]], coins: 1000000, buff: { st: { furnace: 1.2, anvil: 1.2, mine: 1.1 } }, txt: 'Varrock armour 4: +20% smithing, +10% mining' }] },
  { id: 'kandarin', name: 'Kandarin', icon: '🎣', tiers: [
    { tasks: [['Reach Fishing 20', () => LV.fishing >= 20], ['Reach Fletching 20', () => LV.fletching >= 20], ['Reach Agility 15', () => LV.agility >= 15]], coins: 5000, buff: { st: { fish: 1.05 } }, txt: '+5% Fishing speed' },
    { tasks: [['Reach Fishing 46', () => LV.fishing >= 46], ['Reach Hunter 40', () => LV.hunter >= 40], ['Fight Tempoross 50 times', () => (S.clog.reward_pool || 0) >= 1 || LV.fishing >= 60]], coins: 25000, buff: { st: { fish: 1.1, hunt: 1.05 } }, txt: '+10% Fishing, +5% Hunter speed' },
    { tasks: [['Reach Fishing 76', () => LV.fishing >= 76], ['Reach Fletching 75', () => LV.fletching >= 75], ['Reach Agility 60', () => LV.agility >= 60]], coins: 150000, buff: { st: { fletch: 1.1, course: 1.1 } }, txt: '+10% Fletching & Agility speed' },
    { tasks: [['Reach Fishing 99', () => LV.fishing >= 99], ['Reach Fletching 99', () => LV.fletching >= 99], ['Reach Hunter 90', () => LV.hunter >= 90]], coins: 1000000, buff: { sk: { fishing: 1.1, fletching: 1.1, hunter: 1.1 } }, txt: '+10% XP in Fishing, Fletching & Hunter' }] },
  { id: 'morytania', name: 'Morytania', icon: '🦇', tiers: [
    { tasks: [['Reach Slayer 15', () => LV.slayer >= 15], ['Reach Prayer 20', () => LV.prayer >= 20], ['Kill 50 monsters', () => S.stats.kills >= 50]], coins: 5000, buff: { sk: { prayer: 1.05 } }, txt: '+5% Prayer XP' },
    { tasks: [['Reach Slayer 50', () => LV.slayer >= 50], ['Open 5 Barrows chests', () => (S.barrows?.chests || 0) >= 5], ['Reach Herblore 40', () => LV.herblore >= 40]], coins: 25000, buff: { sk: { slayer: 1.05 } }, txt: '+5% Slayer XP' },
    { tasks: [['Reach Slayer 75', () => LV.slayer >= 75], ['Open 25 Barrows chests', () => (S.barrows?.chests || 0) >= 25], ['Complete a Theatre of Blood', () => (S.raids?.tob || 0) >= 1]], coins: 150000, buff: { luck: 1.05 }, txt: 'Morytania legs 3: +5% rare drops' },
    { tasks: [['Reach Slayer 95', () => LV.slayer >= 95], ['Kill the Abyssal Sire', () => kc('abyssal_sire') >= 1], ['Complete 25 Theatres', () => (S.raids?.tob || 0) >= 25]], coins: 1000000, buff: { dmg: 1.05, luck: 1.05 }, txt: '+5% damage & +5% rare drops' }] },
  { id: 'wildy', name: 'Wilderness', icon: '☠️', tiers: [
    { tasks: [['Kill a Revenant goblin', () => kc('rev_goblin') >= 1], ['Reach combat 30', () => combatLevel() >= 30], ['Reach Magic 20', () => LV.magic >= 20]], coins: 5000, buff: { sell: 1.02 }, txt: '+2% sell prices' },
    { tasks: [['Kill 25 revenants', () => kc('rev_goblin') + kc('rev_hobgoblin') + kc('rev_knight') + kc('rev_dragon') >= 25], ['Kill the Chaos Fanatic', () => kc('chaos_fanatic') >= 1], ['Reach combat 70', () => combatLevel() >= 70]], coins: 25000, buff: { luck: 1.03 }, txt: '+3% rare drops' },
    { tasks: [['Kill Scorpia', () => kc('scorpia') >= 1], ['Kill a Revenant dragon', () => kc('rev_dragon') >= 1], ['Reach combat 100', () => combatLevel() >= 100]], coins: 150000, buff: { dmg: 1.03 }, txt: '+3% damage' },
    { tasks: [["Kill Callisto, Venenatis & Vet'ion", () => ['callisto', 'venenatis', 'vetion'].every(id => kc(id))], ['Kill 500 revenants', () => kc('rev_knight') + kc('rev_dragon') + kc('rev_hobgoblin') >= 500], ['Reach combat 120', () => combatLevel() >= 120]], coins: 1000000, buff: { luck: 1.1 }, txt: 'Wilderness sword 4: +10% rare drops' }] },
];
const TIER_N = ['Easy', 'Medium', 'Hard', 'Elite'];
function diaryClaim(id, i) {
  const d = DIARIES.find(x => x.id === id), t = d?.tiers[i]; if (!t || S.diary[id + i]) return;
  if (i > 0 && !S.diary[id + (i - 1)]) return toast('Finish the previous tier first.', 'warn');
  if (!t.tasks.every(([, f]) => { try { return f(); } catch (e) { return false; } })) return toast('Not every task is done yet.', 'warn');
  S.diary[id + i] = Date.now(); gainCoins(t.coins); add('xp_lamp', i + 1); recalc();
  toast(`${d.icon} ${d.name} ${TIER_N[i]} diary complete! ${t.txt} · 🪙${fmt(t.coins)} · ${i + 1} lamp${i ? 's' : ''}`, 'pet', 7000); SFX.play('ach');
}
function viewDiaries() {
  const done = Object.keys(S.diary || {}).length, tot = DIARIES.length * 4;
  return subHead('📔 Achievement diaries') + `<div class="panel small">Finish every task in a tier to claim coins, XP lamps and a <b>permanent bonus</b>. ${done}/${tot} tiers complete. Diaries stay complete through ascension.</div>` +
    DIARIES.map(d => `<div class="panel"><h3>${d.icon} ${d.name}</h3>${d.tiers.map((t, i) => { const got = S.diary?.[d.id + i], st = t.tasks.map(([n, f]) => { let ok = false; try { ok = !!f(); } catch (e) { } return [n, ok]; }), all = st.every(x => x[1]);
      return `<div class="diary ${got ? 'got' : ''}"><div class="row-between"><b>${TIER_N[i]}</b>${got ? '<span class="y">✔ Claimed</span>' : `<button class="btn small ${all ? '' : 'poor'}" data-act="diary" data-id="${d.id}" data-i="${i}">Claim</button>`}</div>
        <small>${st.map(([n, ok]) => `<span class="${ok || got ? 'cb-green' : 'muted'}">${ok || got ? '✔' : '○'} ${n}</span>`).join('<br>')}</small><small class="y">🎁 ${t.txt} · 🪙${fmt(t.coins)}</small></div>`; }).join('')}</div>`).join('');
}

function ensureTargets() { S.target ||= {}; for (const st of STATION_ORDER) if (!ACTIONS[S.target[st]]) S.target[st] = STATION_ACTIONS[st][0].id; }
viewSkill = (orig => function () { ensureTargets(); return orig(); })(viewSkill);
VIEWS.skill = viewSkill;
/* ---------- Ascension keeps quests & diaries ---------- */
ascend = (orig => function () {
  const old = S, n = S.asc.count; orig();
  if (S === old || S.asc.count === n) return;
  S.quests = old.quests || {}; S.diary = old.diary || {}; ensureTargets(); recalc(); save();
})(ascend);

/* ---------- Save as a file ---------- */
function downloadSave() {
  save();
  const blob = new Blob([localStorage.getItem(SAVE_KEY)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `clickscape-save-${dayKey()}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  toast('💾 Save file downloaded.');
}
function loadSaveFile(file) {
  const r = new FileReader();
  r.onload = () => { try { const d = JSON.parse(r.result); if (!d || !d.xp) throw 0; SAVE_LOCK = true; localStorage.setItem(SAVE_KEY, r.result); toast('💾 Save loaded, reloading…'); setTimeout(() => location.reload(), 300); } catch (e) { toast('That file is not a Clickscape save.', 'warn'); } };
  r.readAsText(file);
}
document.addEventListener('change', e => { if (e.target.id === 'savefile' && e.target.files[0]) loadSaveFile(e.target.files[0]); });

/* ---------- Settings: filters, compact, save file ---------- */
const MUTE_KINDS = [['lvlup', '🎉 Level-ups'], ['rare', '✨ Loot & drops'], ['', '💬 General messages']];
toast = (orig => function (html, cls = '', ms) {
  const mute = S?.settings?.mute;
  if (mute && mute[cls || 'gen'] && cls !== 'warn' && cls !== 'pet') return orig(html, cls, 0);
  return orig(html, cls, ms);
})(toast);
viewSettings = (orig => function () {
  const st = S.settings, mute = st.mute || {};
  return orig().replace('<div class="panel"><h3>💾 Save</h3>', `<div class="panel"><h3>🎛️ Display</h3>
      <label class="toggle"><input type="checkbox" data-act="compact" ${st.compact ? 'checked' : ''}> Compact mode (smaller spacing, fewer animations)</label>
      <h3>Bottom message bar</h3><p class="muted small">Hidden messages still appear in More → Game messages.</p>
      ${MUTE_KINDS.map(([k, n]) => `<label class="toggle"><input type="checkbox" data-act="mutekind" data-id="${k || 'gen'}" ${mute[k || 'gen'] ? '' : 'checked'}> Show ${n}</label>`).join('')}</div>
    <div class="panel"><h3>📁 Save file</h3><p class="muted small">Download a backup file, or load one on another device.</p>
      <div class="row-btns"><button class="btn" data-act="savefile-dl">⬇️ Download save file</button><label class="btn">⬆️ Load save file<input type="file" id="savefile" accept=".json,application/json" hidden></label></div></div>
    <div class="panel"><h3>💾 Save</h3>`);
})(viewSettings);
function applyCompact() { document.body.classList.toggle('compact', !!S.settings.compact); }

/* ---------- XP tracker ---------- */
const XPT = { start: Date.now(), x0: null, samples: [] };
function xptSample() { if (!S) return; const x = {}; SKILL_ORDER.forEach(s => x[s] = S.xp[s]); if (!XPT.x0) XPT.x0 = { ...x }; XPT.samples.push({ t: Date.now(), x }); while (XPT.samples.length > 41) XPT.samples.shift(); }
setInterval(xptSample, 30000);
function viewTracker() {
  const now_ = Date.now(), first = XPT.samples[0] || { t: XPT.start, x: XPT.x0 || S.xp }, span = Math.max(30, (now_ - first.t) / 1000);
  const rows = SKILL_ORDER.map(s => { const g = S.xp[s] - (first.x[s] || 0), ses = S.xp[s] - ((XPT.x0 || {})[s] ?? S.xp[s]), ph = g / span * 3600, cap = MAX_LVL[s], L = LV[s], need = L < cap ? XP_TABLE[L + 1] - S.xp[s] : 0; return { s, g, ses, ph, need, L, cap }; })
    .filter(r => r.ses > 0.5 || r.ph > 0.5).sort((a, b) => b.ph - a.ph);
  return subHead('📈 XP tracker') + `<div class="panel small">Rates use the last ${fmtTime(span)} (rolling 20 minutes). Session started ${fmtTime((now_ - XPT.start) / 1000)} ago.</div>
    <div class="list">${rows.map(r => `<div class="upg"><div class="upg-icon">${SKILLS[r.s].icon}</div><div class="upg-main"><b>${SKILLS[r.s].name} ${r.L}</b><small><b class="y">${fmt(r.ph)}</b> XP/h · session +${fmt(r.ses)}</small>
      <small>${r.L >= r.cap ? `⭐ Mastery ${masteryLvl(r.s)}` : `Level ${r.L + 1} in ${r.ph > 0 ? fmtTime(r.need / r.ph * 3600) : '—'} (${fmt(r.need)} XP)`}</small></div></div>`).join('') || '<div class="panel muted">Gain some XP and come back in a minute.</div>'}</div>`;
}

/* ---------- Bulk hire ---------- */
const bulkStations = () => STATION_ORDER.filter(st => (S.workers[st] || 0) > 0 || LV[STATIONS[st].skill] >= (STATION_ACTIONS[st][0]?.lvl || 1));
const bulkCost = k => bulkStations().reduce((a, st) => a + hireCost(st, k), 0);
function bulkHire(k) {
  const c = bulkCost(k); if (S.coins < c) return toast(`You need 🪙${fmt(c)} to hire ${k} at every station.`, 'warn');
  bulkStations().forEach(st => hire(st, k));
  toast(`👷 Hired ${k} worker${k > 1 ? 's' : ''} at ${bulkStations().length} stations.`, 'rare');
}
viewUpgrades = (orig => function () {
  return `<div class="panel row-between"><div><b>👷 Bulk hire</b><br><small class="muted">Hire at every station you can use (${bulkStations().length})</small></div><div class="shop-btns"><button class="btn" data-act="bulkhire" data-k="1" data-afford="${bulkCost(1)}">+1 · 🪙${fmt(bulkCost(1))}</button><button class="btn" data-act="bulkhire" data-k="10" data-afford="${bulkCost(10)}">+10</button></div></div>` + orig();
})(viewUpgrades);

/* ---------- Interactive random events ---------- */
const EV_GAMES = ['sandwich', 'drill', 'quiz'];
let EVP = null;
claimEvent = (orig => function (ev, b) {
  if (OFF || rnd() < 0.4 || UI.modal) return orig(ev, b);
  b.remove(); activeEvent = null;
  const g = EV_GAMES[randInt(0, 2)], fake = document.createElement('i');
  EVP = { ev, orig, fake, g };
  if (g === 'sandwich') {
    const foods = [['🥖', 'baguette'], ['🍫', 'chocolate bar'], ['🍩', 'doughnut'], ['🥧', 'meat pie'], ['🍕', 'pizza'], ['🥨', 'pretzel'], ['🧀', 'cheese'], ['🍌', 'banana']].sort(() => rnd() - 0.5).slice(0, 4);
    EVP.ans = randInt(0, 3);
    openModal(`<div class="item-modal"><h2>🥪 The Sandwich Lady</h2><p>“Have a <b>${foods[EVP.ans][1]}</b>, dearie! Go on, take it!”</p><div class="ev-grid">${foods.map((f, i) => `<button class="btn ev-btn" data-act="evpick" data-i="${i}">${f[0]}</button>`).join('')}</div></div>`);
  } else if (g === 'drill') {
    const ex = [['🏃', 'run on the spot'], ['🤸', 'star jumps'], ['💪', 'push-ups'], ['🦵', 'sit-ups']].sort(() => rnd() - 0.5);
    EVP.ans = randInt(0, 3);
    openModal(`<div class="item-modal"><h2>🪖 Sergeant Damien</h2><p>“Private! Give me <b>${ex[EVP.ans][1]}</b>! NOW!”</p><div class="ev-grid">${ex.map((f, i) => `<button class="btn ev-btn" data-act="evpick" data-i="${i}">${f[0]}<small>${f[1]}</small></button>`).join('')}</div></div>`);
  } else {
    const sets = [['🐟', '🐠', '🦈', '🦐'], ['⚔️', '🗡️', '🪓', '🔪'], ['💎', '💍', '📿', '👑'], ['🍎', '🍌', '🍇', '🍒'], ['🐶', '🐱', '🐭', '🐹']];
    const a = randInt(0, sets.length - 1); let o; do { o = randInt(0, sets.length - 1); } while (o === a);
    const pick = sets[a].slice(0, 3).concat(sets[o][randInt(0, 3)]).sort(() => rnd() - 0.5);
    EVP.ans = pick.findIndex(x => !sets[a].includes(x));
    openModal(`<div class="item-modal"><h2>🎩 The Quiz Master</h2><p>“Which one is the <b>odd one out</b>?”</p><div class="ev-grid">${pick.map((f, i) => `<button class="btn ev-btn" data-act="evpick" data-i="${i}">${f}</button>`).join('')}</div></div>`);
  }
})(claimEvent);
function evPick(i) {
  const P = EVP; if (!P) return; EVP = null; closeModal();
  if (i === P.ans) { P.orig(P.ev, P.fake); P.orig({ icon: P.ev.icon, name: P.ev.name }, document.createElement('i')); toast('🎉 Correct! You earn a double reward.', 'pet'); }
  else { toast('❌ Wrong answer! The event vanishes in a puff of smoke.', 'warn'); S.stats.events++; }
}

/* ---------- Daily login streak ---------- */
const STREAK_REWARDS = [['coins', 1], ['xp_lamp', 1], ['casket', 3], ['coins', 2], ['mystery_box', 1], ['clue_medium', 1], ['chest', 1]];
function checkStreak() {
  if (!S) return;
  const L = S.lifetime, d = dayKey(); L.streak ||= { day: null, n: 0, best: 0 };
  if (L.streak.day === d) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  L.streak.n = L.streak.day === dayKey(y) ? L.streak.n + 1 : 1; L.streak.day = d; L.streak.best = Math.max(L.streak.best, L.streak.n);
  const n = L.streak.n, [kind, q] = STREAK_REWARDS[(n - 1) % 7], mult = 1 + Math.floor((n - 1) / 7) * 0.5;
  let txt;
  if (kind === 'coins') { const c = Math.round(q * 250 * Math.max(50, totalLevel()) * mult); gainCoins(c); txt = `🪙${fmt(c)}`; }
  else if (kind === 'chest') { add('mystery_box', 2); add('clue_hard', 1); add('xp_lamp', 2); txt = '2 mystery boxes, a hard clue and 2 lamps'; }
  else { const k = Math.max(1, Math.round(q * mult)); add(kind, k); txt = `${k} × ${ITEMS[kind].name}`; }
  if (n % 30 === 0) { add('mystery_box', 5); txt += ' + 30-day bonus: 5 mystery boxes!'; }
  const show = h => { if (!$('#modal').hidden) return setTimeout(() => show(h), 2500); openModal(h); };
  setTimeout(() => show(`<div class="item-modal"><h2>📅 Day ${n} login streak!</h2><p>Welcome back! Today's reward: <b>${txt}</b>.</p>
    <div class="streak">${STREAK_REWARDS.map((r, i) => `<span class="${i < ((n - 1) % 7) + 1 ? 'on' : ''}">${i + 1}</span>`).join('')}</div>
    <p class="muted small">Come back tomorrow to keep it going. Rewards grow every week. Best streak: ${L.streak.best}.</p><button class="btn big" data-act="close">Nice!</button></div>`), 1500);
}

/* ---------- Titles ---------- */
const TITLES = [
  ['none', '', () => true], ['novice', 'the Novice', () => totalLevel() >= 100], ['skiller', 'the Skiller', () => totalLevel() >= 750], ['maxed', 'the Maxed', () => SKILL_ORDER.every(s => LV[s] >= 99)],
  ['slayer', 'the Slayer', () => LV.slayer >= 85], ['raider', 'the Raider', () => (S.raids?.cox || 0) + (S.raids?.tob || 0) >= 10], ['dragonslayer', 'Dragonslayer', () => !!S.quests?.dragon1],
  ['hero', 'the Hero', () => questPoints() >= QP_TOTAL], ['explorer', 'the Explorer', () => Object.keys(S.diary || {}).length >= 10], ['wild', 'the Skulled', () => ['callisto', 'venenatis', 'vetion'].every(id => S.kills[id])],
  ['ascended', 'the Ascended', () => S.asc.count >= 1], ['eternal', 'the Eternal', () => S.asc.count >= 10], ['clue', 'the Detective', () => Object.values(S.clues.done).reduce((a, b) => a + b, 0) >= 50],
  ['spooky', 'the Spooky', () => have('pumpkin_head') || Object.values(S.cosmetic || {}).includes('pumpkin_head')], ['rich', 'the Wealthy', () => S.coins >= 1e9], ['petlover', 'the Zookeeper', () => Object.keys(S.pets).length >= 10],
];
const curTitle = () => { const t = TITLES.find(x => x[0] === S.lifetime.title); return t && t[2]() ? t[1] : ''; };
function renderTitle() { const el = $('#ptitle') || (() => { const s = document.createElement('small'); s.id = 'ptitle'; $('#top .brand')?.appendChild(s); return s; })(); const t = curTitle(); if (el && el.textContent !== t) el.textContent = t; }
viewCharacter = (orig => function () {
  return orig() + `<div class="panel"><h3>🏷️ Titles</h3><p class="muted small">Unlock titles by playing. Your title shows at the top of the screen.</p><div class="chips">${TITLES.map(([id, n, f]) => { const ok = f(); return `<button class="chip ${S.lifetime.title === id || (!S.lifetime.title && id === 'none') ? 'on' : ''} ${ok ? '' : 'locked'}" data-act="title" data-id="${id}">${ok ? '' : '🔒 '}${n || 'No title'}</button>`; }).join('')}</div></div>`;
})(viewCharacter);

/* ---------- Christmas event ---------- */
const xmas = SEASONS.find(z => z.id === 'christmas');
cosmetic('ice_crown', 'Crown of the Snow Queen', 'head', 'hat', '#bfe8ff', [0, 0, 0], { untradeable: true, value: 1000000 });
cosmetic('snowman_top', 'Snowman top', 'body', 'robe', '#f4f8ff', [0, 0, 0], { untradeable: true });
cosmetic('candy_cane_staff', 'Candy cane staff', 'weapon', 'staff', '#e83a3a', [0, 0, 0], { untradeable: true });
PETS.snowy = { name: 'Snowy', icon: '☃️', st: 'combat', chance: 0, desc: '+3% combat max hit (Christmas pet)' };
xmas.shop.push(['snowman_top', 150], ['candy_cane_staff', 250], ['ice_crown', 600]);
MON({ id: 'snow_imp', name: 'Snow imp', icon: '❄️', hue: 0, lvl: 24, hp: 30, atk: 20, def: 15, mh: 3, spd: 2.2, coins: [5, 60], area: 'event', season: 'christmas', drops: [['present', 1, 1, 2], ['trick_bag', 1 / 25, 1, 1]] });
MON({ id: 'ice_troll', name: 'Ice troll', icon: '🧌', hue: 180, lvl: 92, hp: 150, atk: 80, def: 70, mh: 12, spd: 2.6, coins: [40, 400], area: 'event', season: 'christmas', weak: 'magic', drops: [['present', 1, 2, 5], ['snowman_top', 1 / 200, 1, 1]] });
MON({ id: 'snow_queen', name: 'The Snow Queen', icon: '👸', hue: 180, boss: true, lvl: 180, hp: 340, atk: 150, def: 120, mh: 19, spd: 3, coins: [400, 4000], area: 'event', season: 'christmas', weak: 'ranged', drops: [['present', 1, 6, 14], ['ice_crown', 1 / 80, 1, 1], ['candy_cane_staff', 1 / 60, 1, 1], ['clue_hard', 1 / 20, 1, 1], ['pet:snowy', 1 / 500, 1, 1]] });
for (const m of MONSTERS) MONSTER_BY_ID[m.id] = m;
(function () {
  const se = activeSeason();
  if (se && !AREAS.some(a => a[0] === 'event') && MONSTERS.some(m => m.season === se.id)) AREAS.push(['event', se.icon + ' Event']);
  CLOG.push({ id: 'christmas', name: 'Christmas', icon: '🎄', cat: 'Events', items: [...xmas.shop.map(x => x[0]), 'pet:snowy'] });
  CLOG.flatMap(p => p.items).forEach(i => CLOG_ITEMS.add(i));
  ['ice_crown', 'snowman_top', 'candy_cane_staff'].forEach(id => (SOURCES[id] ||= []).push('Christmas event'));
  Object.keys(ITEMS).forEach(id => { if (!(id in ITEM_ORDER)) ITEM_ORDER[id] = Object.keys(ITEM_ORDER).length; });
})();

/* ---------- Views, hub tiles, input, boot ---------- */
Object.assign(VIEWS, { quests: viewQuests, diaries: viewDiaries, tracker: viewTracker, upgrades: viewUpgrades, settings: viewSettings, character: viewCharacter });
HUB_VIEWS.push('quests', 'diaries', 'tracker');
viewMenu = (orig => function () {
  const tiles = [['quests', '🗺️', 'Quests', `${questPoints()}/${QP_TOTAL} QP`], ['diaries', '📔', 'Diaries', `${Object.keys(S.diary || {}).length}/${DIARIES.length * 4} tiers`], ['tracker', '📈', 'XP tracker', 'XP/h & time to level']];
  return orig().replace('<button class="hub-tile" data-act="hub" data-id="ascension">', tiles.map(([id, i, n, d]) => `<button class="hub-tile" data-act="hub" data-id="${id}"><span class="ht-icon">${i}</span><b>${n}</b><small>${d}</small></button>`).join('') + '<button class="hub-tile" data-act="hub" data-id="ascension">');
})(viewMenu);
VIEWS.menu = viewMenu;
viewSig = (orig => function () {
  const v = UI.view;
  if (v === 'quests') return JSON.stringify(S.quests) + SKILL_ORDER.map(s => LV[s]).join() + Object.keys(S.bank).length;
  if (v === 'diaries' || v === 'tracker') return v + JSON.stringify(S.diary) + Math.floor(Date.now() / 3000);
  if (v === 'character') return orig() + S.lifetime.title;
  if (v === 'settings') return orig() + JSON.stringify(S.settings);
  if (v === 'upgrades') return orig() + Math.floor(S.coins / Math.max(1, bulkCost(1)) > 1 ? 1 : 0);
  return orig();
})(viewSig);

document.addEventListener('click', e => {
  if (e.target.closest('[data-nav]')) return;
  const t = e.target.closest('[data-act]'); if (!t) return;
  const d = t.dataset; let h = true;
  switch (d.act) {
    case 'quest': doQuest(d.id); break;
    case 'diary': diaryClaim(d.id, +d.i); break;
    case 'savefile-dl': downloadSave(); break;
    case 'compact': S.settings.compact = t.checked; applyCompact(); break;
    case 'mutekind': (S.settings.mute ||= {})[d.id] = !t.checked; break;
    case 'bulkhire': bulkHire(+d.k); break;
    case 'evpick': evPick(+d.i); break;
    case 'title': if (TITLES.find(x => x[0] === d.id)?.[2]()) { S.lifetime.title = d.id; renderTitle(); } else toast('🔒 You haven’t earned that title yet.', 'warn'); break;
    default: h = false;
  }
  if (h) { e.stopImmediatePropagation(); UI.force = true; render(); liveUpdate(); }
}, true);

function boot8() {
  boot5();
  S.quests ||= {}; S.diary ||= {}; ensureTargets();
  applyCompact(); renderTitle(); xptSample(); recalc();
  checkStreak(); setInterval(() => { checkStreak(); renderTitle(); }, 60000);
  UI.force = true; render();
}
