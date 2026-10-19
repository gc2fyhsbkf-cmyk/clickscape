'use strict';
/* =========================================================
   CLICKSCAPE — engine + UI
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = Math.random;
const randInt = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function fmt(n) {
  n = Math.floor(n || 0);
  if (Math.abs(n) < 100000) return n.toLocaleString('en-US');
  const u = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
  let i = 0, x = n;
  while (Math.abs(x) >= 1000 && i < u.length - 1) { x /= 1000; i++; }
  return (x < 10 ? x.toFixed(2) : x < 100 ? x.toFixed(1) : Math.floor(x)) + u[i];
}
const fmtD = n => n < 10 ? (Math.round(n * 10) / 10).toString() : fmt(n);
function fmtTime(s) {
  s = Math.max(0, Math.ceil(s));
  if (s < 60) return s + 's';
  if (s < 3600) return Math.floor(s / 60) + 'm ' + String(s % 60).padStart(2, '0') + 's';
  return Math.floor(s / 3600) + 'h ' + String(Math.floor(s % 3600 / 60)).padStart(2, '0') + 'm';
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- XP table (classic formula) ---------- */
const XP_TABLE = [0, 0];
{ let pts = 0; for (let l = 1; l < 150; l++) { pts += Math.floor(l + 300 * Math.pow(2, l / 7)); XP_TABLE[l + 1] = Math.floor(pts / 4); } }
function levelOf(xp, cap = 99) { let l = 1; while (l < cap && xp >= XP_TABLE[l + 1]) l++; return l; }

/* ---------- State ---------- */
const SAVE_KEY = 'clickscape_save_v1';
let S;            // saved state
let LV = {};      // cached levels
let OFF = false;  // offline simulation running
let SIMNOW = null;
let OFFLOG = [];
const now = () => SIMNOW ?? Date.now();
const CROP_BY_ID = Object.fromEntries(CROPS.map(c => [c.id, c]));
const SITE_BY_ID = Object.fromEntries(DIGSITES.map(d => [d.id, d]));
const FOODS = Object.values(ITEMS).filter(i => i.heal > 0).sort((a, b) => b.heal - a.heal).map(i => i.id);

function newState(keep = {}) {
  const xp = {}; SKILL_ORDER.forEach(s => xp[s] = 0); xp.hitpoints = XP_TABLE[10];
  return {
    v: 1, coins: 25, xp, bank: {},
    equip: { weapon: null, head: null, body: null, legs: null, shield: null, cape: null, neck: null, ring: null, hands: null, feet: null, pickaxe: 'bronze_pickaxe', hatchet: 'bronze_hatchet', rod: 'basic_rod', mattock: 'bronze_mattock' },
    workers: {}, prog: {},
    target: { mine: 'm_copper_ore', forest: 'w_logs', fish: 'fi_shrimp', dig: 'd_quarry', furnace: 's_bronze', anvil: 'a_bronze_dagger', range: 'c_shrimp', fire: 'f_logs' },
    upgrades: {}, plots: [null, null], useAshes: true,
    combat: { mon: 'chicken', style: 'attack', food: null, ammo: null, pots: [null, null, null], boost: {}, fighting: false, hp: 10, mhp: 0, mmax: 0, pT: 0, mT: 0, respawn: 0, regen: 0, spec: 100, paid: null, sup: false, nextSup: false, drain: 0 },
    kc: { bandos: 0, armadyl: 0, saradomin: 0, zamorak: 0 },
    kills: {}, clues: { active: null, done: {} }, barrows: { killed: [], chests: 0 },
    clog: keep.clog || {}, ach: keep.ach || {}, ch: {}, ge: keep.ge || { f: {}, hist: {}, t: 0, news: [], watch: [] },
    star: null, nextStar: Date.now() + 12 * 60000, prevMine: null, loadouts: keep.loadouts || [null, null, null, null], cosmetic: keep.cosmetic || {}, locked: keep.locked || {},
    slayer: { master: null, mon: null, left: 0, total: 0, streak: 0, points: 0, done: 0, unlocks: {} },
    museum: keep.museum || {}, pets: keep.pets || {}, asc: keep.asc || { points: 0, count: 0 },
    lifetime: keep.lifetime || { xp: 0, kills: 0, taps: 0, earned: 0 },
    settings: keep.settings || { vibrate: true, sound: true, volume: 0.6, autoLock: true },
    stats: { taps: 0, kills: 0, earned: 0, events: 0, xpRun: 0, rares: 0, started: Date.now() },
    buffs: { frenzy: 0 }, nextEvent: Date.now() + 75000, last: Date.now(), loot: [],
  };
}
function mergeDeep(def, sv) {
  if (sv === undefined || sv === null) return def;
  if (typeof def !== 'object' || def === null || Array.isArray(def)) return sv;
  const out = { ...def };
  for (const k in sv) out[k] = (k in def) ? mergeDeep(def[k], sv[k]) : sv[k];
  return out;
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    S = raw ? mergeDeep(newState(), JSON.parse(raw)) : newState();
  } catch (e) { console.warn(e); S = newState(); }
  // migrate old saves
  if (S.bank.shadow_whip) { add('abyssal_whip', S.bank.shadow_whip); delete S.bank.shadow_whip; }
  if (S.equip.weapon === 'shadow_whip') S.equip.weapon = 'abyssal_whip';
  for (const k in S.equip) if (S.equip[k] && !ITEMS[S.equip[k]]) S.equip[k] = null;
  for (const k in S.bank) if (!ITEMS[k] || !(S.bank[k] > 0)) delete S.bank[k];
  if (!MONSTER_BY_ID[S.combat.mon]) S.combat.mon = 'chicken';
  for (const st of STATION_ORDER) if (!ACTIONS[S.target[st]]) S.target[st] = STATION_ACTIONS[st][0].id;
  S.house ||= {}; S.unlocks ||= {}; S.raids ||= {}; S.well ||= {}; S.guild ||= 0; S.asc.essence ??= S.asc.points || 0; S.asc.perks ||= {};
  applyCaps(); refreshLevels(); recalc();
}
let SAVE_LOCK = false;
function save() {
  if (SAVE_LOCK || !S) return;
  S.last = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { console.warn('save failed', e); }
}
function refreshLevels() { SKILL_ORDER.forEach(s => LV[s] = levelOf(S.xp[s], MAX_LVL[s])); }
const lvl = s => LV[s];
const totalLevel = () => SKILL_ORDER.reduce((a, s) => a + LV[s], 0);
const combatLevel = () => Math.floor(0.25 * (LV.defence + LV.hitpoints + Math.floor(LV.prayer / 2)) + 0.325 * Math.max(LV.attack + LV.strength, Math.floor(LV.ranged * 1.5), Math.floor(LV.magic * 1.5)));
const maxHp = () => LV.hitpoints;
const has = id => !!S.upgrades[id];

/* ---------- Bank ---------- */
const have = id => S.bank[id] || 0;
let bankKeysChanged = true;
function add(id, n = 1) {
  if (n <= 0) return;
  if (!S.bank[id]) { bankKeysChanged = true; if (S.settings?.autoLock && ITEMS[id]?.rare && !(id in S.locked)) S.locked[id] = 1; }
  S.bank[id] = (S.bank[id] || 0) + n;
}
function remove(id, n = 1) {
  if (!(n > 0) || !id) return n === 0;
  if (have(id) < n) return false;
  S.bank[id] -= n;
  if (S.bank[id] <= 0) { delete S.bank[id]; bankKeysChanged = true; }
  return true;
}
function gainCoins(n) { n = Math.floor(n); S.coins += n; S.stats.earned += n; S.lifetime.earned += n; track('coins', '*', n); }

/* ---------- Multipliers (cached; recalc on change) ---------- */
let M = {};
const GEAR_SLOTS = ['head', 'cape', 'neck', 'ring', 'hands', 'weapon', 'body', 'shield', 'legs', 'feet'];
function upgMult(type, pred) {
  let m = 1;
  for (const id in S.upgrades) { const u = UPGRADE_BY_ID[id]; if (u && u.eff.type === type && (!pred || pred(u.eff))) m *= u.eff.mult; }
  return m;
}
function museumBuff(pred) { let m = 1; for (const d of DIGSITES) if (S.museum[d.id] && pred(d.buff)) m *= d.buff.mult; return m; }
function recalc() {
  const asc = S.asc.points;
  M.asc = 1 + 0.05 * asc;
  M.xp = upgMult('xp') * museumBuff(b => b.type === 'xp') * (1 + 0.02 * asc);
  M.cxp = upgMult('cxp');
  M.sell = upgMult('sell') * museumBuff(b => b.type === 'sell') * (1 + 0.02 * asc);
  M.luck = upgMult('luck') * museumBuff(b => b.type === 'luck');
  M.grow = upgMult('grow') * museumBuff(b => b.type === 'grow');
  M.yield = upgMult('yield') * (S.pets.snail ? 1.1 : 1);
  M.dmg = upgMult('damage') * museumBuff(b => b.type === 'damage') * (S.pets.wyrmling ? 1.1 : 1);
  M.tapdmg = upgMult('tapdmg');
  M.aspd = 2.4; for (const id in S.upgrades) { const e = UPGRADE_BY_ID[id]?.eff; if (e?.type === 'aspd') M.aspd = Math.min(M.aspd, e.val); }
  M.events = upgMult('events');
  const cape = ITEMS[S.equip.cape]; const perk = cape?.perk;
  const pk = s => perk === 'max' || perk === s;
  if (pk('farming')) M.yield *= 1.25;
  M.capeAcc = pk('attack') ? 1.05 : 1; M.capeDmg = pk('strength') ? 1.05 : 1; M.capeDef = pk('defence') ? 1.05 : 1;
  M.regen = pk('hitpoints') ? 2 : 1; M.capePray = pk('prayer') ? 0.1 : 0; M.slayPts = pk('slayer') ? 1.1 : 1;
  M.luck *= ITEMS[S.equip.ring]?.luck || 1;
  M.gemx = ITEMS[S.equip.neck]?.gemx || 1;
  M.sxp = upgMult('sxp');
  let bossPets = 0; for (const p in S.pets) if (PETS[p]?.st === 'combat' && p !== 'wyrmling') bossPets++;
  M.dmg *= Math.pow(1.03, bossPets);
  const cs = clogStats(); M.clogPages = cs.pages;
  const ap = achPoints();
  M.xp *= (1 + 0.01 * cs.pages) * (1 + 0.01 * Math.floor(ap / 10));
  M.dmg *= 1 + 0.01 * cs.pages;
  M.sell *= 1 + 0.01 * Math.floor(ap / 10);
  const worn = new Set(Object.values(S.equip).filter(Boolean));
  const grace = GRACEFUL.filter(g => worn.has(g[0])).length;
  M.grace = grace; M.rogue = ROGUE.filter(r => worn.has(r[0])).length;
  M.crewGlobal = (1 + LV.agility * 0.003) * (1 + grace * 0.02 + (grace === 6 ? 0.08 : 0));
  const starRing = !!ITEMS[S.equip.ring]?.starRing;
  M.tap = {}; M.rate = {};
  const tapAll = upgMult('tapall'), crewAll = upgMult('crewall');
  for (const st of STATION_ORDER) {
    const S0 = STATIONS[st];
    const L = LV[S0.skill];
    const lvlM = 1 + L * 0.01;
    const tool = toolMult(st);
    let sm = M.asc * museumBuff(b => (b.type === 'station' && b.st === st) || (b.type === 'stations' && b.sts.includes(st)));
    sm *= upgMult('station', e => e.st === st) * upgMult('stations', e => e.sts.includes(st));
    for (const p in S.pets) if (PETS[p]?.st === st) sm *= 1.1;
    if (pk(S0.skill)) sm *= 1.25;
    if (st === 'mine' && starRing) sm *= 1.1;
    M.tap[st] = lvlM * tool * sm * upgMult('tap', e => e.st === st) * tapAll;
    M.rate[st] = (S.workers[st] || 0) * 0.2 * lvlM * tool * sm * upgMult('crew', e => e.st === st) * crewAll * M.crewGlobal;
  }
  const G = { atk: 0, str: 0, def: 0, ratk: 0, rstr: 0, matk: 0, mdmg: 0 };
  M.reduceGear = 0;
  for (const slot of GEAR_SLOTS) { const it = ITEMS[S.equip[slot]]; if (it) { for (const k in G) G[k] += it[k] || 0; M.reduceGear += it.reduce || 0; } }
  M.gear = G;
  const w = ITEMS[S.equip.weapon];
  M.wclass = w?.wclass || 'melee';
  if (!STYLES[M.wclass].some(x => x[0] === S.combat.style)) S.combat.style = STYLES[M.wclass][0][0];
  M.set = null;
  for (const b of BARROWS) if (b.pieces.every(p => worn.has(p[0]))) M.set = b.id;
  M.wspd = w?.spd || 1; M.spec = w?.spec ? SPECS[w.spec] : null;
  M.antifire = !!ITEMS[S.equip.shield]?.antifire;
  recalc4();
}
function toolMult(st) {
  const slot = STATIONS[st].tool;
  if (!slot) return 1;
  const it = ITEMS[S.equip[slot]];
  return it ? it.mult : 0.25;
}
const SKILL_XP_RATE = 0.6;   // skilling XP is slowed vs early versions (120 is the new cap)
const WORKER_XP = 0.35;      // workers earn 35% of the XP a tap would
const frenzy = () => now() < S.buffs.frenzy ? 7 : 1;

/* ---------- XP ---------- */
function gainXP(skill, amt) {
  if (amt <= 0) return;
  amt *= M.xp * (COMBAT_SKILLS.includes(skill) ? M.cxp : SKILL_XP_RATE);
  amt *= skillXpMult(skill);
  S.xp[skill] = Math.min(1e300, S.xp[skill] + amt);
  S.stats.xpRun += amt; S.lifetime.xp += amt;
  const L = levelOf(S.xp[skill], MAX_LVL[skill]);
  if (L > LV[skill]) {
    const old = LV[skill]; LV[skill] = L; recalc();
    if (!OFF) levelUpToast(skill, L);
  }
  return amt;
}

/* ---------- Production ---------- */
function rollCount(n, p) {
  if (p <= 0) return 0;
  if (n <= 40) { let k = 0; for (let i = 0; i < n; i++) if (rnd() < p) k++; return k; }
  return Math.floor(n * p + rnd());
}
function pickWeighted(table) {
  const tot = table.reduce((a, r) => a + r[1], 0);
  let x = rnd() * tot;
  for (const r of table) { if ((x -= r[1]) <= 0) return r[0]; }
  return table[0][0];
}
function canMakeOne(a) { if (!a.inp) return true; for (const id in a.inp) if (have(id) < a.inp[id]) return false; return true; }
function burnChance(a) {
  const stop = a.burn - (has('gauntlets') ? 10 : 0) - 2 * (S.house?.kitchen || 0);
  const L = LV.cooking;
  if (L >= stop) return 0;
  return clamp(0.6 * (stop - L) / Math.max(1, stop - a.lvl), 0, 0.6);
}
function doYield(st, a, n, xpScale = 1) {
  if (a.thieve) return thieveYield(st, a, n, xpScale);
  if (a.course) return courseYield(st, a, n, xpScale);
  if (a.star) return starYield(st, a, n, xpScale);
  if (a.inp) {
    for (const id in a.inp) n = Math.min(n, Math.floor(have(id) / a.inp[id]));
    if (n <= 0) return 0;
    for (const id in a.inp) remove(id, a.inp[id] * n);
  }
  const sk = STATIONS[st].skill;
  let ok = n;
  if (a.burn) {
    const burnt = rollCount(n, burnChance(a));
    ok = n - burnt;
    if (burnt) add('burnt_fish', burnt);
    LAST_BURNT = burnt;
  }
  for (const id in a.out) add(id, a.out[id] * ok);
  gainXP(sk, a.xp * ok * xpScale);
  track('yield', st, ok); track('act', a.id, ok);
  if (['mine', 'forest', 'fish', 'dig'].includes(st)) { const k = rollCount(ok, (1 / 3000) * M.luck); if (k) { const t = clueTierFor(LV[sk] * 1.6); add('clue_' + t, k); if (!OFF) { toast(`📜 You find a <b>${t}</b> clue scroll while skilling!`, 'rare'); SFX.play('clue'); } } }
  const tslot = STATIONS[st].tool, tool = tslot && ITEMS[S.equip[tslot]];
  if (tool?.bonus && ok > 0) gainXP(tool.bonus.skill, a.xp * ok * xpScale * tool.bonus.frac);
  // bonus drops
  const bd = BONUS_DROPS[st];
  const batch = (k, pick, why) => {
    if (!k) return;
    const got = {};
    for (let i = 0; i < Math.min(k, 200); i++) { const id = pick(); got[id] = (got[id] || 0) + 1; }
    const scale = k > 200 ? k / 200 : 1;
    for (const id in got) { const q = Math.round(got[id] * scale); rareGet(id, q, why); logItem(id, q); }
  };
  if (st === 'restore') for (const id in a.out) logItem(id, ok);
  if (bd) batch(rollCount(n, bd.chance * M.luck * (st === 'mine' ? M.gemx : 1)), () => pickWeighted(bd.table), 'skill');
  if (st === 'dig') {
    const site = SITE_BY_ID[a.site];
    batch(rollCount(n, (1 / 12) * M.luck), () => 'damaged_' + site.arts[randInt(0, 2)][0], 'artifact');
  }
  rollPet(st, n);
  return n;
}
let LAST_BURNT = 0;
function rollPet(st, n) {
  for (const [pid, p] of Object.entries(PETS)) {
    if (p.st !== st || S.pets[pid] || !p.chance) continue;
    if (rollCount(n, p.chance * M.luck) > 0) givePet(pid);
  }
}
function givePet(pid) {
  if (S.pets[pid]) return;
  S.pets[pid] = true; logItem('pet:' + pid); recalc();
  const p = PETS[pid];
  const msg = `${p.icon} You have a funny feeling like you're being followed… <b>${p.name}</b> joined you! (${p.desc})`;
  if (OFF) OFFLOG.push(msg); else { toast(msg, 'pet', 7000); buzz([60, 40, 120]); SFX.play('pet'); }
}
function rareGet(id, q, why) {
  add(id, q);
  const it = ITEMS[id];
  const msg = why === 'artifact' ? `🏺 You found an artifact: <b>${q > 1 ? q + ' × ' : ''}${it.name}</b>` : `✨ ${why === 'drop' ? 'Rare drop' : 'You found'}: <b>${q > 1 ? q + ' × ' : ''}${it.name}</b>`;
  S.stats.rares += q;
  if (OFF) OFFLOG.push(msg); else { toast(itemIcon(id) + '<span>' + msg + '</span>', 'rare', 4500); buzz(40); SFX.play('rare'); }
}
function produce(st, clicks, xpScale = 1) {
  const a = ACTIONS[S.target[st]];
  if (a?.star && !starActive()) { S.target.mine = S.prevMine || 'm_copper_ore'; return -1; }
  if (!a || LV[STATIONS[st].skill] < a.lvl) return -1;
  if (!canMakeOne(a)) return -2;
  S.prog[st] = (S.prog[st] || 0) + clicks;
  if (S.prog[st] < a.hp) return 0;
  const n = Math.floor(S.prog[st] / a.hp);
  const d = doYield(st, a, n, xpScale);
  S.prog[st] = d < n ? 0 : S.prog[st] - n * a.hp;
  return d;
}
let lastNeedToast = 0;
function tapStation(st, x, y) {
  let power = M.tap[st] * frenzy();
  if (st === 'thieve' && Date.now() < (UI.stunUntil || 0)) { floater(x, y, 'Stunned!', 'bad'); return; }
  if (st === 'course') {
    const j = agiJudge();
    if (j === 'perfect') { power *= 3; S.lifetime.perfect = (S.lifetime.perfect || 0) + 1; floater(x, y - 30, 'PERFECT!', 'good'); SFX.play('perfect'); }
    else if (j === 'good') { power *= 1.5; floater(x, y - 30, 'Good', 'tap'); }
    else { floater(x, y - 30, 'You slip!', 'bad'); SFX.play('slip'); return; }
  }
  S.stats.taps++; S.lifetime.taps++;
  SFX.play(STATION_SFX[st] || 'click');
  const r = produce(st, power);
  if (st === 'thieve' && r > 0 && LAST_FAIL >= r) { UI.stunUntil = Date.now() + 1500; floater(x, y, 'Caught! Stunned…', 'bad'); SFX.play('hurt'); return; }
  const a = ACTIONS[S.target[st]];
  if (r === -2) {
    floater(x, y, 'Need materials!', 'bad');
    if (Date.now() - lastNeedToast > 4000) { lastNeedToast = Date.now(); toast(`You don't have the materials: ${inputsText(a)}`, 'warn'); }
    return;
  }
  if (r === -1) return;
  if (r > 0) {
    const outId = Object.keys(a.out)[0];
    if (!outId) floater(x, y, a.thieve ? (LAST_LOOT ? `+${LAST_LOOT}` : 'Success!') : a.course ? `+${r} lap${r > 1 ? 's' : ''}` : `+${fmtD(a.xp * r)} xp`, 'good');
    else if (a.burn && LAST_BURNT === r) floater(x, y, 'You burn it!', 'bad');
    else floater(x, y, `+${r} ${ITEMS[outId].name}`, 'good');
  } else floater(x, y, '+' + fmtD(power), 'tap');
  const el = $('.stage'); if (el) { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
}
function inputsText(a) { return Object.entries(a.inp || {}).map(([id, q]) => `${q} × ${ITEMS[id].name}`).join(', '); }

/* ---------- Workers ---------- */
const plural = (w, n) => n === 1 ? w : /man$/.test(w) ? w.replace(/man$/, 'men') : w + 's';
const hireCost = (st, k = 1) => { const b = STATIONS[st].wbase, n = S.workers[st] || 0; return Math.ceil(20 * b * Math.pow(1.3, n) * (Math.pow(1.3, k) - 1) / 0.3); };
function hire(st, k) {
  if (k === 'max') { k = 0; while (hireCost(st, k + 1) <= S.coins && k < 500) k++; if (!k) k = 1; }
  const c = hireCost(st, k);
  if (S.coins < c) return toast("You don't have enough coins.", 'warn');
  S.coins -= c; S.workers[st] = (S.workers[st] || 0) + k; recalc();
  toast(`${STATIONS[st].wicon} Hired ${k} ${plural(STATIONS[st].worker, k)}.`); SFX.play('coin');
}

/* ---------- Farming ---------- */
const growTime = c => c.time * M.grow;
function plant(i, cropId, quiet) {
  const c = CROP_BY_ID[cropId];
  if (S.plots[i]) return false;
  if (LV.farming < c.lvl) { if (!quiet) toast(`You need Farming level ${c.lvl}.`, 'warn'); return false; }
  if (!remove(cropId + '_seed', 1)) { if (!quiet) toast(`You have no ${ITEMS[cropId + '_seed'].name}s.`, 'warn'); return false; }
  let b = false;
  if (S.useAshes && have('ashes') >= 3) { remove('ashes', 3); b = true; }
  S.plots[i] = { c: cropId, t0: now(), dur: growTime(c) * 1000, b };
  gainXP('farming', c.pxp);
  return true;
}
const plotReady = p => p && now() >= p.t0 + p.dur;
function harvest(i) {
  const p = S.plots[i];
  if (!plotReady(p)) return 0;
  const c = CROP_BY_ID[p.c];
  const y = Math.max(1, Math.round(randInt(c.y[0], c.y[1]) * M.yield * (p.b ? 1.5 : 1)));
  add(c.cropItem || c.id, y); gainXP('farming', c.hxp * y); track('yield', 'farm', y);
  S.plots[i] = null;
  rollPet('farm', 1);
  return y;
}
function farmTick() {
  if (!has('gardener')) return;
  S.plots.forEach((p, i) => { if (plotReady(p)) { const c = p.c; harvest(i); plant(i, c, true); } });
}

/* ---------- Combat ---------- */
const STYLES = {
  melee: [['attack', 'Accurate', '⚔️'], ['strength', 'Aggressive', '💪'], ['defence', 'Defensive', '🛡️']],
  ranged: [['r_acc', 'Accurate', '🎯'], ['r_rapid', 'Rapid', '⚡'], ['r_long', 'Longrange', '🛡️']],
  magic: [['m_std', 'Standard', '🔮'], ['m_def', 'Defensive', '🛡️']],
};
const styleBonus = s => S.combat.style === s ? 3 : 0;
/* Prayer: passive boosts unlocked by level + protection that reduces damage taken */
function prayerBoost() {
  const P = LV.prayer;
  if (P >= 77 && (S.unlocks?.rigour || S.unlocks?.augury)) return { n: 'Piety' + (S.unlocks.rigour ? ' · Rigour' : '') + (S.unlocks.augury ? ' · Augury' : ''), a: 1.2, s: 1.23, d: 1.25, r: S.unlocks.rigour ? 1.2 : 1.15, m: S.unlocks.augury ? 1.25 : 1.15 };
  if (P >= 70) return { n: 'Piety', a: 1.2, s: 1.23, d: 1.25, r: 1.15, m: 1.15 };
  if (P >= 60) return { n: 'Chivalry', a: 1.15, s: 1.18, d: 1.2, r: 1.15, m: 1.15 };
  if (P >= 44) return { n: 'Eagle Eye · Mystic Might', a: 1.15, s: 1.15, d: 1.15, r: 1.15, m: 1.15 };
  if (P >= 31) return { n: 'Ultimate Strength', a: 1.15, s: 1.15, d: 1.15, r: 1.1, m: 1.1 };
  if (P >= 13) return { n: 'Superhuman Strength', a: 1.1, s: 1.1, d: 1.1, r: 1.05, m: 1.05 };
  if (P >= 4) return { n: 'Burst of Strength', a: 1.05, s: 1.05, d: 1.05, r: 1, m: 1 };
  return { n: 'None', a: 1, s: 1, d: 1, r: 1, m: 1 };
}
function reduction() {
  const P = LV.prayer;
  const prot = P >= 43 ? 0.25 + (P - 43) / 56 * 0.15 : 0;
  return Math.min(0.65, prot + M.capePray + M.reduceGear + (M.set === 'torag' ? 0.1 : 0));
}
/* Potion boosts: S.combat.boost = { atk: {f, p, t}, ..., antifire: t } */
const BOOST_KEY = { attack: 'atk', strength: 'str', defence: 'def', ranged: 'rng', magic: 'mag' };
function boosted(sk) {
  const L = LV[sk], b = S.combat.boost?.[BOOST_KEY[sk]];
  return b && b.t > 0 ? L + b.f + Math.floor(L * b.p) : L;
}
function drinkPotion(id, quiet) {
  const fx = ITEMS[id]?.potion;
  if (!fx || !remove(id, 1)) return false;
  const B = S.combat.boost ||= {};
  for (const k in fx) {
    if (k === 'antifire') B.antifire = POT_SECONDS;
    else B[k] = { f: fx[k][0], p: fx[k][1], t: POT_SECONDS };
  }
  S.lifetime.pots = (S.lifetime.pots || 0) + 1;
  track('pot', id, 1);
  if (!quiet && !OFF) { toast(`🧪 You drink the ${ITEMS[id].name}.`); SFX.play('drink'); }
  return true;
}
function potionNeeded(id) {
  const fx = ITEMS[id]?.potion, B = S.combat.boost || {};
  if (!fx) return false;
  return Object.keys(fx).some(k => k === 'antifire' ? !(B.antifire > 0) : !(B[k]?.t > 0));
}
function potTick(dt) {
  const C = S.combat, B = C.boost ||= {};
  for (const k in B) { if (k === 'antifire') B.antifire = Math.max(0, B.antifire - dt); else if (B[k]) B[k].t = Math.max(0, B[k].t - dt); }
  for (const id of C.pots || []) if (id && have(id) && potionNeeded(id)) drinkPotion(id, true);
}
const curMon = () => MONSTER_BY_ID[S.combat.mon];
const onTask = m => S.slayer.mon === m.id && S.slayer.left > 0;
const helmBonus = m => onTask(m) && ITEMS[S.equip.head]?.slayerHelm ? 7 / 6 : 1;
const wclass = () => M.wclass || 'melee';
function ammoOk() {
  const w = ITEMS[S.equip.weapon];
  if (!w?.ammo) return true;
  const a = ITEMS[S.combat.ammo];
  return !!(a && a.ammo === w.ammo && have(a.id) && a.tier <= (w.ammoCap || 9));
}
function bestAmmo() {
  const w = ITEMS[S.equip.weapon];
  if (!w?.ammo) return null;
  return Object.keys(S.bank).filter(id => ITEMS[id].ammo === w.ammo && ITEMS[id].tier <= (w.ammoCap || 9)).sort((a, b) => ITEMS[b].rstr - ITEMS[a].rstr)[0] || null;
}
function spellFor() {
  let s = SPELLS[0];
  for (const sp of SPELLS) if (LV.magic >= sp[0]) s = sp;
  return s;
}
function maxHit(tap, m = curMon()) {
  const cls = wclass(), pb = prayerBoost();
  let base;
  if (cls === 'ranged') {
    const eff = Math.floor(boosted('ranged') * pb.r) + 8 + styleBonus('r_acc');
    const ammo = ITEMS[S.combat.ammo];
    base = 0.5 + eff * (M.gear.rstr + (ammoOk() && ammo ? ammo.rstr : 0) + 64) / 640;
  } else if (cls === 'magic') {
    const w = ITEMS[S.equip.weapon];
    const lvl = Math.floor(boosted('magic') * pb.m);
    const raw = w?.cast === 'trident' ? Math.max(1, Math.floor(lvl / 3) - 5) : w?.cast === 'swamp' ? Math.max(1, Math.floor(lvl / 3) - 2) : w?.cast === 'celestial' ? Math.floor(lvl / 2.5) : spellFor()[2];
    base = raw * (1 + M.gear.mdmg / 100);
  } else {
    const eff = Math.floor(boosted('strength') * pb.s) + 8 + styleBonus('strength');
    base = 0.5 + eff * (M.gear.str + 64) / 640;
  }
  return Math.max(1, Math.floor(base * M.dmg * M.capeDmg * helmBonus(m) * weaponVs(m) * (tap ? M.tapdmg : 1)));
}
function chanceFormula(A, D) { return A > D ? 1 - (D + 2) / (2 * (A + 1)) : A / (2 * (D + 1)); }
function hitChance(m, acc = 1) {
  const cls = wclass(), pb = prayerBoost();
  let A;
  if (cls === 'ranged') A = (Math.floor(boosted('ranged') * pb.r) + 8 + styleBonus('r_acc')) * (M.gear.ratk + 64);
  else if (cls === 'magic') A = (Math.floor(boosted('magic') * pb.m) + 8 + (S.combat.style === 'm_std' ? 2 : 0)) * (M.gear.matk + 64);
  else A = (Math.floor(boosted('attack') * pb.a) + 8 + styleBonus('attack')) * (M.gear.atk + 64);
  A *= M.capeAcc * helmBonus(m) * acc;
  let def = Math.max(0, m.def - (S.combat.mon === m.id ? S.combat.drain || 0 : 0));
  if (m.weak === cls) def *= 0.6;
  return chanceFormula(A, (def + 9) * 64);
}
const enemyHitChance = m => chanceFormula((m.atk + 9) * 64, (Math.floor(boosted('defence') * prayerBoost().d) + 8 + styleBonus('defence') + styleBonus('r_long') + styleBonus('m_def')) * (M.gear.def + 64) * M.capeDef);
function dragonfireMult() {
  const pot = (S.combat.boost?.antifire || 0) > 0;
  return M.antifire ? 1 : pot ? 1.5 : 3;
}
const enemyMaxHit = m => Math.round(m.mh * (m.dragon ? dragonfireMult() : 1));

function canFight(m) {
  if (m.ascReq && S.asc.count < m.ascReq) return `Requires ${m.ascReq} ascension${m.ascReq > 1 ? 's' : ''}`;
  if (m.sl && LV.slayer < m.sl) return `Requires Slayer level ${m.sl}`;
  if (m.minCombat && combatLevel() < m.minCombat) return `Requires combat level ${m.minCombat}`;
  if (m.needs) {
    const id = m.needs;
    const helm = ITEMS[S.equip.head]?.slayerHelm && ['earmuffs', 'nose_peg', 'facemask'].includes(id);
    if (id === 'mirror_shield') { if (!ITEMS[S.equip.shield]?.mirror) return 'Equip a Mirror shield (its gaze petrifies)'; }
    else if (!helm && !have(id) && !Object.values(S.equip).includes(id)) return `Requires a ${ITEMS[id].name}`;
  }
  if (m.leaf && !ITEMS[S.equip.weapon]?.leaf) return 'Only a leaf-bladed weapon can hurt it';
  if (m.noMelee && wclass() === 'melee') return 'It flies out of reach: use Ranged or Magic';
  if (wclass() === 'ranged' && !ammoOk()) { const b = bestAmmo(); if (b) S.combat.ammo = b; else return `You need ${ITEMS[S.equip.weapon].ammo === 'bolt' ? 'bolts' : 'arrows'} your weapon can fire`; }
  if (m.god && S.combat.paid !== m.id && (S.kc[m.god] || 0) < GWD_KC) return `Requires ${GWD_KC} ${GODS[m.god]} kill count`;
  if (m.sacrifice && S.combat.paid !== m.id && !have(m.sacrifice)) return `Sacrifice a ${ITEMS[m.sacrifice].name} to enter`;
  return null;
}
function monReqs(m) {
  const r = [];
  if (m.sl) r.push(`Slayer ${m.sl}`);
  if (m.minCombat) r.push(`Combat ${m.minCombat}`);
  if (m.needs) r.push(ITEMS[m.needs].name);
  if (m.leaf) r.push('Leaf-bladed weapon');
  if (m.noMelee) r.push('Ranged/Magic only');
  if (m.god) r.push(`${GWD_KC} ${GODS[m.god]} KC`);
  if (m.faction) r.push(`+1 ${GODS[m.faction]} KC`);
  if (m.sacrifice) r.push(`Sacrifice ${ITEMS[m.sacrifice].name}`);
  if (m.dragon) r.push('🔥 Dragonfire');
  if (m.corp) r.push('½ dmg unless spear');
  if (m.weak) r.push(`Weak to ${m.weak}`);
  if (m.ascReq) r.push(`🌀 ${m.ascReq} ascension${m.ascReq > 1 ? 's' : ''}`);
  if (m.raid) r.push(`Raid room ${m.order + 1}/5`);
  return r;
}
const STYLE_XP = { attack: [['attack', 4]], strength: [['strength', 4]], defence: [['defence', 4]], r_acc: [['ranged', 4]], r_rapid: [['ranged', 4]], r_long: [['ranged', 2], ['defence', 2]], m_std: [['magic', 4]], m_def: [['magic', 2.6], ['defence', 1.4]] };
function playerAttack(tap, mult = 1, acc = 1, noAmmo) {
  const C = S.combat, m = curMon();
  if (C.mhp <= 0) return 0;
  const cls = wclass();
  if (cls === 'ranged' && !noAmmo && ITEMS[S.equip.weapon]?.ammo) {
    if (!ammoOk()) { const b = bestAmmo(); if (!b) { retreat(); if (!OFF) { toast('You have run out of ammo!', 'warn'); UI.force = true; } return 0; } C.ammo = b; }
    const shots = ITEMS[S.equip.weapon].doubleShot ? 2 : 1;
    const used = rollCount(shots, 0.2); if (used) remove(C.ammo, Math.min(used, have(C.ammo)));
  }
  let max = Math.max(1, Math.floor(maxHit(tap, m) * mult));
  if (M.set === 'dharok') max = Math.floor(max * (1 + Math.max(0, maxHp() - C.hp) / maxHp()));
  if (M.set === 'ahrim' && rnd() < 0.25) max = Math.floor(max * 1.3);
  const hits = M.set === 'verac' && rnd() < 0.25;
  let dmg = hits || rnd() < hitChance(m, acc) ? randInt(1, max) : 0;
  if (m.corp && !ITEMS[S.equip.weapon]?.spear) dmg = Math.floor(dmg / 2);
  const d = Math.min(dmg, C.mhp);
  C.mhp -= d;
  if (d > 0) {
    for (const [sk, x] of STYLE_XP[C.style] || STYLE_XP.attack) gainXP(sk, d * x);
    gainXP('hitpoints', d * 1.33);
    if (M.set === 'guthan' && rnd() < 0.25) C.hp = Math.min(maxHp(), C.hp + d);
  }
  if (!OFF) { splat('m', dmg); SFX.play(dmg ? 'hit' : 'miss'); }
  if (C.mhp <= 0) { killMonster(m); return d; }
  if (cls === 'ranged' && !noAmmo) {
    if (ITEMS[S.equip.weapon].doubleShot) return d + playerAttack(tap, mult, acc, true);
    if (M.set === 'karil' && rnd() < 0.25) return d + playerAttack(tap, mult * 0.5, acc, true);
  }
  return d;
}
function doSpec() {
  const C = S.combat, sp = M.spec, m = curMon();
  if (!sp || !C.fighting || C.mhp <= 0 || C.spec < sp.cost) return false;
  C.spec -= sp.cost;
  let total = 0;
  for (let i = 0; i < sp.hits && C.mhp > 0; i++) total += playerAttack(false, sp.dmg, sp.acc);
  if (sp.heal) C.hp = Math.min(maxHp(), C.hp + Math.floor(total * sp.heal));
  if (sp.drain) C.drain = (C.drain || 0) + total;
  if (sp.drainPct && total > 0) C.drain = (C.drain || 0) + Math.round(m.def * sp.drainPct);
  if (sp.freeze) C.mT += m.spd;
  if (sp.bleed && C.mhp > 0) { const b = Math.min(C.mhp, sp.bleed); C.mhp -= b; if (!OFF) splat('m', b); if (C.mhp <= 0) killMonster(m); }
  if (!OFF) { floaterOn('#mstage', sp.name + '!', 'tap'); SFX.play('spec'); }
  return true;
}
function killMonster(m) {
  const C = S.combat;
  S.stats.kills++; S.lifetime.kills++;
  S.kills[m.id] = (S.kills[m.id] || 0) + 1;
  C.respawn = 1.2;
  if (m.faction) S.kc[m.faction] = (S.kc[m.faction] || 0) + 1;
  const sup = C.sup;
  const task = onTask(m);
  track('kill', m.id, 1);
  if (m.boss) track('boss', m.id, 1);
  if (task) {
    track('task', m.id, 1);
    gainXP('slayer', m.hp * (sup ? 10 : 1) * M.sxp);
    S.slayer.left--;
    if (S.slayer.left <= 0) completeTask();
    else if (S.slayer.unlocks.bigger && !m.boss && rnd() < 1 / 120) { C.nextSup = true; if (!OFF) toast('😤 A superior foe has appeared…', 'pet', 4000); }
  }
  clueStepKill(m);
  const got = [];
  if (m.coins) { const c = randInt(m.coins[0], m.coins[1]) * (sup ? 3 : 1); gainCoins(c); got.push('🪙' + fmt(c)); }
  for (let roll = 0; roll < (sup ? 4 : 1); roll++) for (const [id, ch, a, b] of m.drops) {
    const p = ch >= 1 ? 1 : ch * M.luck;
    if (rnd() >= p) continue;
    if (id.startsWith('pet:')) { givePet(id.slice(4)); continue; }
    const q = randInt(a, b);
    if (has('bonecrusher') && BONE_XP[id]) { gainXP('prayer', BONE_XP[id] * q * 0.5); continue; }
    if (ch <= 1 / 50) rareGet(id, q, 'drop');
    else add(id, q);
    logItem(id, q);
    got.push((q > 1 ? q + '× ' : '') + ITEMS[id].name);
  }
  const extra = monsterExtras(m);
  got.push(...extra);
  if (m.barrows) barrowsKill(m);
  if (m.raid) raidKill(m);
  if (!OFF) {
    S.loot.unshift(`${m.icon} ${sup ? 'Superior ' : ''}${m.name}: ${got.join(', ') || 'nothing'}`);
    S.loot.length = Math.min(S.loot.length, 8);
    const ms = $('#mstage'); if (ms && C.mhp <= 0) ms.classList.add('dead');
  }
}
function monsterAttack() {
  const C = S.combat, m = curMon();
  let dmg = rnd() < enemyHitChance(m) ? randInt(1, enemyMaxHit(m)) : 0;
  if (dmg) dmg = Math.round(dmg * (1 - reduction()));
  C.hp -= dmg;
  if (!OFF) { splat('p', dmg); if (dmg) SFX.play('hurt'); }
  for (let k = 0; k < 3 && C.hp > 0 && C.hp <= maxHp() * 0.5; k++) if (!autoEat()) break;
  if (C.hp <= 0) die();
}
function autoEat() {
  const C = S.combat;
  const f = C.food && have(C.food) ? C.food : FOODS.find(id => have(id));
  if (!f) return false;
  remove(f, 1);
  C.hp = Math.min(maxHp(), C.hp + ITEMS[f].heal);
  if (!OFF) { floaterOn('#php', `+${ITEMS[f].heal} 🍖`, 'good'); SFX.play('eat'); }
  return true;
}
function die() {
  const C = S.combat;
  C.fighting = false; C.hp = maxHp(); C.mhp = 0; C.paid = null;
  const msg = `💀 Oh dear, you are dead! You were defeated by ${curMon().name}. Bring food, potions, better armour and a higher Prayer level.`;
  if (OFF) OFFLOG.push(msg); else { toast(msg, 'warn', 6000); SFX.play('death'); UI.force = true; }
}
function startFight(quiet) {
  const C = S.combat, m = curMon();
  const err = canFight(m);
  if (err) { C.fighting = false; if (!quiet && !OFF) toast('🔒 ' + err, 'warn'); return false; }
  if (C.paid !== m.id) {
    C.paid = null;
    if (m.god) { S.kc[m.god] -= GWD_KC; C.paid = m.id; if (!OFF) toast(`You spend ${GWD_KC} ${GODS[m.god]} kill count and enter ${m.name}'s chamber.`); }
    if (m.sacrifice) { remove(m.sacrifice, 1); C.paid = m.id; if (!OFF) toast(`You sacrifice your ${ITEMS[m.sacrifice].name} and step into the Inferno…`, 'warn'); }
  }
  Object.assign(C, { fighting: true, sup: false, nextSup: false, drain: 0, mmax: m.hp, mhp: m.hp, pT: 0.6, mT: m.spd, respawn: 0 });
  if (C.hp <= 0) C.hp = maxHp();
  return true;
}
function retreat() { const C = S.combat; C.fighting = false; C.mhp = 0; C.paid = null; }
function combatTick(dt) {
  const C = S.combat;
  C.regen += dt * M.regen;
  if (C.regen >= 8) { C.regen = 0; C.hp = Math.min(maxHp(), C.hp + 1); }
  C.spec = Math.min(100, (C.spec ?? 100) + dt / 3 * (M.specRegen || 1));
  if (!C.fighting) return;
  potTick(dt);
  const m = curMon();
  if (C.mhp <= 0) {
    C.respawn -= dt;
    if (C.respawn <= 0) {
      const mm = curMon();
      const err = canFight(mm);
      if (err) { retreat(); if (!OFF) { toast('🔒 ' + err, 'warn'); UI.force = true; } return; }
      C.sup = C.nextSup; C.nextSup = false; C.drain = 0;
      C.mmax = Math.round(mm.hp * (C.sup ? 2.5 : 1)); C.mhp = C.mmax; C.pT = attackInterval(); C.mT = mm.spd;
      if (!OFF) { $('#mstage')?.classList.remove('dead'); UI.force = true; }
    }
    return;
  }
  if (has('auto_spec') && M.spec && C.spec >= M.spec.cost) doSpec();
  C.pT -= dt;
  while (C.pT <= 0 && C.mhp > 0 && C.fighting) { playerAttack(false); C.pT += attackInterval(); }
  if (C.mhp > 0 && C.fighting) { C.mT -= dt; while (C.mT <= 0 && C.fighting) { monsterAttack(); C.mT += m.spd; } }
}
const attackInterval = () => M.aspd * M.wspd * (S.combat.style === 'r_rapid' ? 0.83 : 1);

/* ---------- Slayer ---------- */
function taskPool(ms) {
  return MONSTERS.filter(m => {
    if (['chicken', 'cow', 'jad', 'zuk', 'nex'].includes(m.id)) return false;
    if ((m.sl || 1) > LV.slayer) return false;
    if (m.boss) return !!(ms.boss && S.slayer.unlocks.boss);
    return m.lvl >= ms.range[0] && m.lvl <= ms.range[1];
  });
}
function assignTask(mid, quiet) {
  const ms = SLAYER_MASTERS.find(x => x.id === mid), sl = S.slayer;
  if (combatLevel() < ms.cb) return toast(`${ms.name} only teaches adventurers with combat level ${ms.cb}+.`, 'warn');
  if (LV.slayer < ms.sl) return toast(`${ms.name} requires Slayer level ${ms.sl}.`, 'warn');
  if (sl.left > 0) {
    if (mid !== 'turael') return toast('You already have a task. Finish it, cancel it in the Slayer shop, or ask Turael for an easier one (resets your streak).', 'warn');
    sl.streak = 0;
  }
  const pool = taskPool(ms);
  if (!pool.length) return toast(`${ms.name} has nothing suitable for you yet.`, 'warn');
  const m = pickWeighted(pool.map(x => [x, x.area === 'slayer' ? 3 : x.boss ? 0.7 : 1]));
  const amt = m.boss ? randInt(3, 12) : randInt(ms.amt[0], ms.amt[1]);
  Object.assign(sl, { master: mid, mon: m.id, left: amt, total: amt });
  if (!quiet && !OFF) toast(`${ms.icon} ${ms.name}: “Your new task is to kill <b>${amt} × ${m.name}</b>.”`, 'rare', 5000);
  UI.force = true;
}
function completeTask() {
  const sl = S.slayer, ms = SLAYER_MASTERS.find(x => x.id === sl.master);
  sl.streak++; sl.done++;
  const mult = sl.streak % 100 === 0 ? 25 : sl.streak % 50 === 0 ? 15 : sl.streak % 10 === 0 ? 5 : 1;
  const pts = Math.round((ms ? ms.pts : 0) * mult * M.slayPts);
  sl.points += pts;
  const old = sl.mon; sl.mon = null; sl.left = 0;
  const msg = `💀 Task complete! ${sl.streak} in a row · +${pts} Slayer points (${sl.points} total).`;
  if (OFF) OFFLOG.push(msg); else { toast(msg, 'pet', 5000); buzz(40); }
  if (sl.unlocks.autopilot && ms) {
    assignTask(ms.id, true);
    const nm = MONSTER_BY_ID[sl.mon];
    if (nm && S.combat.mon === old) {
      const prev = S.combat.mon;
      S.combat.mon = nm.id;
      if (!startFight(true)) { S.combat.mon = prev; }
      else if (!OFF) toast(`💍 New task: ${sl.left} × ${nm.name}. Teleporting there now.`, 'rare', 4000);
    }
  }
  UI.force = true;
}
function slayerBuy(id) {
  const it = SLAYER_SHOP.find(x => x.id === id), sl = S.slayer;
  if (it.unlock && sl.unlocks[id]) return;
  if (sl.points < it.pts) return toast(`You need ${it.pts} Slayer points.`, 'warn');
  if (id === 'skip') { if (sl.left <= 0) return toast('You have no task to cancel.', 'warn'); sl.left = 0; sl.mon = null; }
  else if (it.item) add(id, 1);
  else sl.unlocks[id] = true;
  sl.points -= it.pts;
  toast(`💀 Bought: ${it.name}`, 'rare');
}

let lastCombatTap = 0;
function tapMonster(x, y) {
  const C = S.combat;
  if (!C.fighting) { startFight(); UI.force = true; return; }
  if (C.mhp <= 0) return;
  const t = Date.now();
  if (t - lastCombatTap < 220) return;
  lastCombatTap = t;
  S.stats.taps++; S.lifetime.taps++;
  playerAttack(true);
  const el = $('#mstage .mon'); if (el) { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
}

/* ---------- Items: sell, equip, eat, open ---------- */
function sellPrice(id) { return Math.max(1, Math.floor(ITEMS[id].value * M.sell)); }
function saleTake(id, q, p) { return p * q; } // overridden in ext21 (market depth)
function sell(id, q) {
  if (S.locked[id]) return toast(`${ITEMS[id].name} is locked. Unlock it first.`, 'warn');
  q = Math.min(q, have(id));
  if (q <= 0) return;
  const got = saleTake(id, q, sellPrice(id)); remove(id, q);
  gainCoins(got);
  toast(`Sold ${fmt(q)} × ${ITEMS[id].name} for 🪙${fmt(got)}`); SFX.play('coin');
}
function reqOk(req) { return !req || Object.entries(req).every(([s, l]) => LV[s] >= l); }
function reqText(req) { return Object.entries(req || {}).map(([s, l]) => `${SKILLS[s].name} ${l}`).join(', '); }
function equip(id) {
  const it = ITEMS[id];
  if (!it?.slot || !have(id)) return;
  if (!reqOk(it.req)) return toast(`You need ${reqText(it.req)} to wear that.`, 'warn');
  remove(id, 1);
  if (S.equip[it.slot]) add(S.equip[it.slot], 1);
  if (it.slot === 'weapon' && it.twoHanded && S.equip.shield) { add(S.equip.shield, 1); S.equip.shield = null; }
  if (it.slot === 'shield' && ITEMS[S.equip.weapon]?.twoHanded) { add(S.equip.weapon, 1); S.equip.weapon = null; }
  S.equip[it.slot] = id; recalc();
  toast(`${itemIcon(id)}<span>Equipped ${it.name}</span>`);
}
function unequip(slot) {
  if (!S.equip[slot]) return;
  add(S.equip[slot], 1); S.equip[slot] = null; recalc();
}
function eat(id) {
  const it = ITEMS[id];
  if (!it.heal || !remove(id, 1)) return;
  S.combat.hp = Math.min(maxHp(), S.combat.hp + it.heal);
  toast(`You eat the ${it.name}. It heals some health.`);
}
function openItem(id, q = 1) {
  if (ITEMS[id].clue) return readClue(ITEMS[id].clue);
  if (ITEMS[id].lamp) return openLampPicker();
  q = Math.min(q, have(id)); if (q <= 0) return;
  remove(id, q);
  const got = {}; let coins = 0;
  const give = (i, n) => { got[i] = (got[i] || 0) + n; add(i, n); };
  for (let k = 0; k < q; k++) {
    if (id === 'casket') {
      coins += randInt(20, 600);
      if (rnd() < 0.3) give(pickWeighted([['sapphire', 50], ['emerald', 30], ['ruby', 15], ['diamond', 5]]), 1);
      if (rnd() < 0.2) give(randomSeed(), randInt(1, 3));
    } else if (id === 'bird_nest') {
      give(randomSeed(), randInt(1, 3));
    } else if (id === 'mystery_box') {
      const r = pickWeighted([['coins', 30], ['gem', 25], ['bar', 15], ['seed', 20], ['casket', 10]]);
      if (r === 'coins') coins += randInt(400, 3000);
      else if (r === 'gem') give(pickWeighted([['ruby', 60], ['diamond', 40]]), randInt(1, 3));
      else if (r === 'bar') give(pickWeighted([['mithril_bar', 50], ['adamant_bar', 35], ['rune_bar', 15]]), randInt(2, 6));
      else if (r === 'seed') give(pickWeighted([['ranarr_seed', 50], ['snapdragon_seed', 35], ['torstol_seed', 15]]), randInt(1, 3));
      else give('casket', 3);
    }
  }
  if (coins) gainCoins(coins);
  const parts = Object.entries(got).map(([i, n]) => `${n} × ${ITEMS[i].name}`);
  if (coins) parts.unshift('🪙' + fmt(coins));
  toast(`You open the ${ITEMS[id].name}${q > 1 ? 's' : ''}: ${parts.join(', ') || 'it was empty'}`, 'rare', 5000);
}
function randomSeed() { return pickWeighted(CROPS.map(c => [c.id + '_seed', 1 / Math.sqrt(c.seed)])); }

/* ---------- Upgrades ---------- */
function upgUnlocked(u) {
  const r = u.req;
  if (r.skill && LV[r.skill] < r.lvl) return false;
  if (r.workers && (S.workers[r.workers] || 0) < r.n) return false;
  if (r.total && totalLevel() < r.total) return false;
  if (r.earned && S.stats.earned < r.earned) return false;
  if (r.kills && S.stats.kills < r.kills) return false;
  if (r.combat && combatLevel() < r.combat) return false;
  if (r.events && S.stats.events < r.events) return false;
  if (r.workersTotal && Object.values(S.workers).reduce((a, b) => a + b, 0) < r.workersTotal) return false;
  return true;
}
function upgReqText(u) {
  const r = u.req;
  if (r.skill) return `${SKILLS[r.skill].name} level ${r.lvl}`;
  if (r.workers) return `${r.n} ${STATIONS[r.workers].worker}${r.n > 1 ? 's' : ''}`;
  if (r.total) return `Total level ${r.total}`;
  if (r.earned) return `Earn 🪙${fmt(r.earned)} this run`;
  if (r.kills) return `${fmt(r.kills)} kills`;
  if (r.combat) return `Combat level ${r.combat}`;
  if (r.events) return `Catch ${r.events} random events`;
  if (r.workersTotal) return `${r.workersTotal} workers total`;
  return '';
}
function canAffordUpg(u) {
  if (S.coins < u.cost) return false;
  for (const id in u.items || {}) if (have(id) < u.items[id]) return false;
  return true;
}
function buyUpgrade(id) {
  const u = UPGRADE_BY_ID[id];
  if (!u || has(id) || !upgUnlocked(u)) return;
  if (!canAffordUpg(u)) return toast('You can\'t afford that yet.', 'warn');
  S.coins -= u.cost;
  for (const i in u.items || {}) remove(i, u.items[i]);
  S.upgrades[id] = true; recalc();
  toast(`${u.icon} Upgrade bought: <b>${u.name}</b> — ${u.desc}`, 'rare');
  if (u.eff.type === 'grow') S.plots.forEach(p => { if (p && !plotReady(p)) { const left = p.t0 + p.dur - now(); p.dur -= left * (1 - u.eff.mult); } });
}

/* ---------- Ascension (prestige) ---------- */
function ascendGain() { return Math.floor(Math.sqrt(S.stats.xpRun / 40000)); }
function ascend() {
  const g = ascendGain();
  if (totalLevel() < ascReqTotal() || g < 1) return;
  const keep = { museum: S.museum, pets: S.pets, asc: { points: S.asc.points + g, count: S.asc.count + 1 }, lifetime: S.lifetime, settings: S.settings, clog: S.clog, ach: S.ach, ge: S.ge, loadouts: S.loadouts, cosmetic: S.cosmetic, locked: S.locked };
  S = newState(keep); refreshLevels(); recalc(); save();
  closeModal(); go('skills');
  toast(`🌀 You ascend! You now hold <b>${S.asc.points}</b> Ancient Runes.`, 'pet', 7000);
}

/* ---------- Random events (golden cookie) ---------- */
const EVENTS = [
  { icon: '🧞', name: 'Genie' }, { icon: '🧙', name: 'Mysterious Old Man' },
  { icon: '🐸', name: 'Frog Prince' }, { icon: '🍺', name: 'Drunken Dwarf' }, { icon: '📦', name: 'Supply Drop' },
];
let activeEvent = null;
function scheduleEvent() { S.nextEvent = Date.now() + randInt(300, 600) * 1000 * M.events * (M.eventFreq || 1); }
function spawnEvent() {
  if (activeEvent || document.hidden) return;
  const se = activeSeason();
  const ev = se && rnd() < 0.5 ? { icon: se.icon, name: se.name + ' spirit' } : EVENTS[randInt(0, EVENTS.length - 1)];
  const b = document.createElement('button');
  b.className = 'rand-event'; b.innerHTML = ev.icon; b.title = ev.name; b.setAttribute('aria-label', ev.name);
  const W = window.innerWidth, H = window.innerHeight;
  b.style.left = randInt(20, Math.max(30, W - 90)) + 'px';
  b.style.top = randInt(90, Math.max(100, H - 180)) + 'px';
  b.addEventListener('click', () => claimEvent(ev, b));
  document.body.appendChild(b);
  activeEvent = b;
  setTimeout(() => { if (activeEvent === b) { b.remove(); activeEvent = null; } }, 14000);
  scheduleEvent();
}
function claimEvent(ev, b) {
  b.remove(); activeEvent = null; S.stats.events++;
  const se = activeSeason();
  if (se) { const k = randInt(3, 8); add(se.token, k); toast(`${se.icon} You also receive <b>${k} ${ITEMS[se.token].name.toLowerCase()}s</b> for the ${se.name} event!`, 'rare', 5000); }
  const r = pickWeighted([['frenzy', 40], ['lamp', 25], ['coins', 25], ['box', 10]]);
  if (r === 'frenzy') { S.buffs.frenzy = Date.now() + 45000; toast(`${ev.icon} The ${ev.name} grants you a <b>FRENZY</b>! All production ×7 for 45 seconds!`, 'pet', 5000); }
  else if (r === 'lamp') {
    const sk = SKILL_ORDER.reduce((a, s) => LV[s] < LV[a] ? s : a, 'mining');
    const xp = 10 * LV[sk] * LV[sk] + 150;
    const got = gainXP(sk, xp);
    toast(`${ev.icon} The ${ev.name} hands you a lamp: <b>${fmt(got)} ${SKILLS[sk].name} XP</b>!`, 'pet', 5000);
  } else if (r === 'coins') {
    const c = Math.floor(Math.min(400 * totalLevel(), Math.max(25 * totalLevel(), S.coins * 0.04)));
    gainCoins(c); toast(`${ev.icon} The ${ev.name} drops a pouch of <b>🪙${fmt(c)}</b>!`, 'pet', 5000);
  } else { add('mystery_box', 1); toast(`${ev.icon} The ${ev.name} gives you a 🎁 <b>Mystery box</b>! Open it in your bank.`, 'pet', 5000); }
  buzz(30); SFX.play('rare');
}

/* ---------- Main tick ---------- */
function tickCore(dt) {
  const f = frenzy();
  for (const st of STATION_ORDER) { const r = M.rate[st]; if (r > 0) produce(st, r * f * dt, WORKER_XP); }
  combatTick(dt);
  farmTick();
  starTick();
  geTick();
}
function simulateOffline() {
  const t = Date.now();
  let dt = (t - S.last) / 1000;
  if (dt < 30) return;
  const cap = offlineHours() * 3600;
  const capped = dt > cap;
  dt = Math.min(dt, cap);
  OFF = true; OFFLOG = [];
  const bank0 = { ...S.bank }, coins0 = S.coins, kills0 = S.stats.kills, xp0 = { ...S.xp }, lv0 = { ...LV };
  const step = dt > 7200 ? 2 : 1;
  const start = S.last;
  for (let s = 0; s < dt; s += step) { SIMNOW = start + s * 1000; tickCore(step); }
  SIMNOW = null; OFF = false;
  S.last = Date.now();
  const gains = [], losses = [];
  const ids = new Set([...Object.keys(bank0), ...Object.keys(S.bank)]);
  for (const id of ids) { const d = have(id) - (bank0[id] || 0); if (d > 0) gains.push([id, d]); else if (d < 0) losses.push([id, -d]); }
  SKILL_ORDER.forEach(sk => { if (LV[sk] > lv0[sk]) OFFLOG.unshift(`${SKILLS[sk].icon} ${SKILLS[sk].name} level <b>${lv0[sk]} → ${LV[sk]}</b>`); });
  const xpg = SKILL_ORDER.map(s => [s, S.xp[s] - xp0[s]]).filter(x => x[1] > 0.5);
  if (!gains.length && !xpg.length && S.coins === coins0) return;
  gains.sort((a, b) => b[1] * ITEMS[b[0]].value - a[1] * ITEMS[a[0]].value);
  openModal(`<h2>Welcome back!</h2>
    <p class="muted">You were away for <b>${fmtTime((t - start) / 1000)}</b>${capped ? ` (progress capped at ${cap / 3600}h)` : ''}. Your workers kept busy:</p>
    ${OFFLOG.length ? `<div class="offlog">${OFFLOG.slice(0, 12).map(l => `<div>${l}</div>`).join('')}</div>` : ''}
    ${xpg.length ? `<h3>Experience</h3><div class="chips">${xpg.map(([s, x]) => `<span class="chip">${SKILLS[s].icon} +${fmt(x)} xp</span>`).join('')}</div>` : ''}
    ${S.coins !== coins0 ? `<p>🪙 +${fmt(S.coins - coins0)} coins</p>` : ''}
    ${S.stats.kills > kills0 ? `<p>⚔️ ${fmt(S.stats.kills - kills0)} kills</p>` : ''}
    ${gains.length ? `<h3>Gained</h3><div class="mini-grid">${gains.slice(0, 24).map(([id, n]) => `<div class="mini">${itemIcon(id)}<span>+${fmt(n)}</span></div>`).join('')}</div>` : ''}
    ${losses.length ? `<h3>Used up</h3><div class="mini-grid">${losses.slice(0, 12).map(([id, n]) => `<div class="mini used">${itemIcon(id)}<span>−${fmt(n)}</span></div>`).join('')}</div>` : ''}
    <button class="btn big" data-act="close">Continue</button>`);
}

/* =========================================================
   UI
   ========================================================= */
const UI = { view: 'skills', skill: null, station: {}, bankFilter: 'all', shopCat: 'tools', anvilMetal: null, force: true, sig: '', modal: false };
const NAV = [
  ['skills', '📜', 'Skills'], ['combat', '⚔️', 'Combat'], ['bank', '💰', 'Bank'],
  ['shop', '🏪', 'Shop'], ['upgrades', '⭐', 'Upgrades'], ['menu', '☰', 'More'],
];
function go(view, extra = {}) { Object.assign(UI, { view }, extra); UI.force = true; $('#view').scrollTop = 0; window.scrollTo(0, 0); render(); }

function xpBar(sk) {
  return `<div class="xpbar"><i data-xp="${sk}"></i><span data-xptext="${sk}"></span></div>`;
}
function xpProgress(sk) {
  const L = LV[sk];
  if (L >= MAX_LVL[sk]) return [1, `${fmt(S.xp[sk])} xp · MAX`];
  const a = XP_TABLE[L], b = XP_TABLE[L + 1];
  return [(S.xp[sk] - a) / (b - a), `${fmt(S.xp[sk])} / ${fmt(b)} xp`];
}
function skillHead(sk, back = 'skills') {
  return `<div class="skill-head panel">
    <button class="btn back" data-nav="${back}">‹</button>
    <div class="sh-icon">${SKILLS[sk].icon}</div>
    <div class="sh-main"><div class="sh-title">${SKILLS[sk].name} <span class="lvlnum" data-lvl="${sk}">${LV[sk]}</span></div>${xpBar(sk)}</div>
  </div>`;
}

/* --- Skills grid --- */
function viewSkills() {
  const cells = SKILL_ORDER.map(s => `<button class="skill-cell" data-act="skill" data-id="${s}">
      <span class="sc-icon">${SKILLS[s].icon}</span>
      <span class="sc-lvl"><span>${LV[s]}</span><span class="slash">/</span><span>${LV[s]}</span></span>
      <span class="sc-bar"><i data-xp="${s}"></i></span>
      <span class="sc-name">${SKILLS[s].name}</span></button>`).join('');
  const cellsTotal = cells + `<div class="skill-cell total"><span class="sc-name">Total level</span><span class="sc-lvl">${totalLevel()}</span></div>`;
  const working = STATION_ORDER.filter(st => S.workers[st]).map(st => {
    const a = ACTIONS[S.target[st]];
    return `<div class="work-line">${STATIONS[st].wicon} <b>${S.workers[st]}</b> × ${STATIONS[st].worker} → ${itemIcon(a.icon)} ${a.name} <span class="status" data-status="${st}"></span></div>`;
  }).join('');
  return `<div class="panel title-panel"><div class="tp-row"><span>Total level: <b class="y">${totalLevel()}</b></span><span>Combat: <b class="y">${combatLevel()}</b></span>${S.asc.points ? `<span>🌀 <b class="y">${S.asc.points}</b></span>` : ''}</div></div>
    <div class="skill-grid">${cellsTotal}</div>
    <div class="panel"><h3>Your workforce</h3>${working || '<p class="muted">No workers yet. Open a skill and hire some help — they keep working even while you\'re away.</p>'}</div>
    ${FARM_SUMMARY()}`;
}
function FARM_SUMMARY() {
  const ready = S.plots.filter(plotReady).length;
  return ready ? `<div class="panel glow" data-act="skill" data-id="farming">🌱 <b>${ready}</b> crop${ready > 1 ? 's are' : ' is'} ready to harvest! Tap to go.</div>` : '';
}

/* --- Station skill view --- */
function stationTabs(sk, cur) {
  const sts = SKILL_STATIONS[sk];
  if (sts.length < 2) return '';
  return `<div class="tabs">${sts.map(st => `<button class="tab ${st === cur ? 'on' : ''}" data-act="station" data-st="${st}">${STATIONS[st].name}</button>`).join('')}</div>`;
}
function viewSkill() {
  const sk = UI.skill;
  if (sk === 'farming') return viewFarming();
  if (COMBAT_SKILLS.includes(sk)) {
    return skillHead(sk) + `<div class="panel"><p>${SKILLS[sk].name} is trained by fighting monsters in the <b>Combat</b> tab.</p>
      <p class="muted">${sk === 'slayer' ? 'Get a task from a Slayer master in Combat → 💀 Slayer. Only kills on your task give Slayer XP, and many monsters need a Slayer level before you can damage them.' : sk === 'hitpoints' ? 'You gain Hitpoints XP from every hit you land. Each level is +1 max HP.' : `Pick the <b>${{ attack: 'Accurate', strength: 'Aggressive', defence: 'Defensive' }[sk]}</b> combat style to train ${SKILLS[sk].name}.`}</p>
      <button class="btn big" data-act="gocombat" data-id="${sk === 'slayer' ? 'slayer' : ''}">Go fight ⚔️</button></div>`;
  }
  const sts = SKILL_STATIONS[sk];
  const st = sts.includes(UI.station[sk]) ? UI.station[sk] : sts[0];
  UI.curStation = st;
  const S0 = STATIONS[st];
  const a = ACTIONS[S.target[st]];
  const n = S.workers[st] || 0;
  let list = STATION_ACTIONS[st];
  let metalChips = '';
  if (st === 'anvil') {
    const unlocked = METALS.filter(m => LV.smithing >= m.lvl);
    const cur = UI.anvilMetal || a.metal || unlocked[unlocked.length - 1].id;
    metalChips = `<div class="chips">${METALS.map(m => `<button class="chip ${m.id === cur ? 'on' : ''} ${LV.smithing < m.lvl ? 'locked' : ''}" data-act="metal" data-id="${m.id}"><i class="dot" style="background:${m.tint}"></i>${m.name}</button>`).join('')}</div>`;
    list = list.filter(x => x.metal === cur);
  }
  const tool = S0.tool ? ITEMS[S.equip[S0.tool]] : null;
  const toolRow = S0.tool ? `<div class="panel tool-row">${tool ? itemIcon(tool.id) : '<span class="emo">🚫</span>'}<div><b>${tool ? tool.name : 'No ' + S0.tool + ' equipped!'}</b><div class="muted">Tool power ×${tool ? tool.mult : 0.25} · ${S0.tool === 'pickaxe' || S0.tool === 'hatchet' ? 'Forge better ones at the Anvil or buy in the Shop' : 'Buy better ones in the Shop'}</div></div></div>` : '';
  const rows = list.map(x => {
    const locked = LV[sk] < x.lvl, on = S.target[st] === x.id;
    const inp = x.inp ? Object.entries(x.inp).map(([id, q]) => `<span class="need">${itemIcon(id)}${q}<small>(<span data-count="${id}">${fmt(have(id))}</span>)</small></span>`).join('') : '';
    const outId = Object.keys(x.out)[0] || Object.keys(x.inp)[0];
    const extra = x.burn ? ` · stops burning at ${x.burn - (has('gauntlets') ? 10 : 0)}` : '';
    return `<button class="act-row ${on ? 'on' : ''} ${locked ? 'locked' : ''}" data-act="target" data-st="${st}" data-id="${x.id}">
      <span class="ar-icon">${itemIcon(x.icon)}</span>
      <span class="ar-main"><b>${x.name}</b><small>${locked ? '🔒 ' : ''}Lv ${x.lvl} · ${fmtD(x.xp)} xp${extra}</small>${inp ? `<span class="needs">${inp}</span>` : ''}</span>
      <span class="ar-have">${itemIcon(outId)}<span data-count="${outId}">${fmt(have(outId))}</span></span>
    </button>`;
  }).join('');
  const stageIn = a.inp ? `<div class="stage-in">${S0.verb}s: ${Object.entries(a.inp).map(([id, q]) => `${q}× ${ITEMS[id].name}`).join(' + ')}</div>` : '';
  return skillHead(sk) + stationTabs(sk, st) + `
    <div class="stage" data-tap="${st}">
      <div class="stage-bg ${st}"></div>
      <div class="stage-icon">${itemIcon(a.icon)}</div>
      <div class="stage-name">${a.name}</div>${stageIn}
      <div class="bar big"><i data-prog="${st}"></i></div>
      <div class="stage-sub">TAP to ${S0.verb.toLowerCase()} · power <b data-tappower="${st}"></b> / ${a.hp} <span class="status" data-status="${st}"></span></div>
    </div>
    <div class="panel worker-row">
      <div class="w-icon">${S0.wicon}</div>
      <div class="w-main"><b>${n} ${S0.worker}${n === 1 ? '' : 's'}</b><div class="muted"><span data-rate="${st}"></span> power/s · ~<span data-ipm="${st}"></span> per min</div></div>
      <div class="w-btns">
        <button class="btn" data-act="hire" data-st="${st}" data-k="1">Hire<small data-hire="${st}:1"></small></button>
        <button class="btn" data-act="hire" data-st="${st}" data-k="10">×10<small data-hire="${st}:10"></small></button>
        <button class="btn" data-act="hire" data-st="${st}" data-k="max">Max</button>
      </div>
    </div>
    ${toolRow}${metalChips}
    <div class="list">${rows}</div>
    ${st === 'dig' ? museumPanel() : ''}`;
}
function museumPanel() {
  return `<div class="panel"><h3>🏛️ Museum collections</h3><p class="muted">Donate one of each artifact from a site to complete its collection and earn a permanent bonus that survives Ascension.</p>
  ${DIGSITES.map(d => {
    const done = S.museum[d.id];
    const can = !done && d.arts.every(([id]) => have(id) > 0);
    return `<div class="coll ${done ? 'done' : ''}"><div class="coll-head"><b>${d.name}</b><span class="muted">${d.buff.desc}</span></div>
      <div class="coll-arts">${d.arts.map(([id, nm]) => `<span class="art ${have(id) || done ? 'got' : ''}" title="${esc(nm)}">${itemIcon(id)}<small>${done ? '✔' : have(id)}</small></span>`).join('')}
      ${done ? '<span class="y">✔ Complete</span>' : `<button class="btn ${can ? '' : 'disabled'}" data-act="donate" data-id="${d.id}">Donate</button>`}</div></div>`;
  }).join('')}</div>`;
}

/* --- Farming --- */
function viewFarming() {
  const plots = S.plots.map((p, i) => {
    if (!p) return `<button class="plot empty" data-act="plot" data-i="${i}"><span class="pl-icon">🟫</span><span>Empty patch</span><small>Tap to plant</small></button>`;
    const c = CROP_BY_ID[p.c];
    const icon = itemIcon(c.id);
    return `<button class="plot ${plotReady(p) ? 'ready' : 'growing'}" data-act="plot" data-i="${i}">
      <span class="pl-icon">${icon}</span><span>${c.name}${p.b ? ' 🌫️' : ''}</span><div class="bar"><i data-plot="${i}"></i></div><small data-plottime="${i}"></small></button>`;
  }).join('');
  const next = S.plots.length < 8 ? PLOT_COSTS[S.plots.length] : null;
  const seeds = CROPS.map(c => `<div class="act-row static ${LV.farming < c.lvl ? 'locked' : ''}"><span class="ar-icon">${itemIcon(c.id + '_seed')}</span>
      <span class="ar-main"><b>${c.name}</b><small>Lv ${c.lvl} · ${fmtTime(growTime(c))} · ${c.y[0]}-${c.y[1]} crops · ${fmtD(c.hxp)} xp each</small></span>
      <span class="ar-have">${itemIcon(c.id + '_seed')}<span data-count="${c.id}_seed">${fmt(have(c.id + '_seed'))}</span></span></div>`).join('');
  return skillHead('farming') + `
    <div class="panel"><div class="farm-actions"><button class="btn" data-act="harvestall">Harvest all</button><button class="btn" data-act="replant">Replant empty</button>
      <label class="toggle"><input type="checkbox" data-act="ashes" ${S.useAshes ? 'checked' : ''}> Use 3 ashes per plant (+50% yield) · have <span data-count="ashes">${fmt(have('ashes'))}</span></label></div>
      ${has('gardener') ? '<p class="muted">👩‍🌾 Your gardener auto-harvests and replants.</p>' : ''}</div>
    <div class="plots">${plots}${next !== null ? `<button class="plot buy" data-act="buyplot"><span class="pl-icon">➕</span><span>New patch</span><small data-afford="${next}">🪙${fmt(next)}</small></button>` : ''}</div>
    <div class="panel"><h3>Seeds</h3><p class="muted">Buy seeds in the Shop, find them in bird's nests, or loot them from monsters. Crops grow in real time — even when the app is closed.</p></div>
    <div class="list">${seeds}</div>`;
}
function openSeedPicker(i) {
  const opts = CROPS.filter(c => have(c.id + '_seed') && LV.farming >= c.lvl);
  if (!opts.length) return openModal(`<h2>No seeds</h2><p>You have no seeds you can plant. Buy some in the Shop.</p><button class="btn big" data-act="gotoshop-seeds">Open seed shop</button>`);
  openModal(`<h2>Plant a seed</h2><div class="list">${opts.map(c => `<button class="act-row" data-act="plant" data-i="${i}" data-id="${c.id}">
    <span class="ar-icon">${itemIcon(c.id + '_seed')}</span><span class="ar-main"><b>${c.name}</b><small>${fmtTime(growTime(c))} · have ${fmt(have(c.id + '_seed'))}</small></span><span class="ar-have">${itemIcon(c.id)}</span></button>`).join('')}</div>
    <p class="muted">Tip: “Replant empty” reuses the last seed you planted.</p>`);
}

/* --- Combat --- */
function taskBar() {
  const sl = S.slayer;
  if (!sl.mon || sl.left <= 0) return `<div class="panel task">💀 <span>No Slayer task.</span> <button class="btn small" data-act="area" data-id="slayer">Get a task</button></div>`;
  const m = MONSTER_BY_ID[sl.mon];
  const here = S.combat.mon === m.id && S.combat.fighting;
  return `<div class="panel task on">💀 <span>Task: <b>${m.name}</b> · <b class="y" data-live="taskleft">${sl.left}</b> / ${sl.total} left</span>
    ${here ? '<span class="pill">On task</span>' : '<button class="btn small" data-act="fighttask">Fight task</button>'}</div>`;
}
function viewCombat() {
  const C = S.combat, m = curMon();
  const area = UI.area || m.area;
  const foodOpts = FOODS.filter(id => have(id));
  const styles = [['attack', 'Accurate', '⚔️'], ['strength', 'Aggressive', '💪'], ['defence', 'Defensive', '🛡️']];
  const pb = prayerBoost(), red = reduction();
  const mons = MONSTERS.filter(x => x.area === area).map(x => {
    const diff = x.lvl - combatLevel();
    const col = diff > 10 ? 'red' : diff > 0 ? 'orange' : diff > -10 ? 'yellow' : 'green';
    const err = canFight(x);
    const req = monReqs(x);
    const task = onTask(x);
    return `<button class="act-row ${x.id === C.mon ? 'on' : ''} ${err ? 'locked' : ''}" data-act="mon" data-id="${x.id}">
      <span class="ar-icon emo-big" style="${monFilter(x)}">${x.icon}</span>
      <span class="ar-main"><b>${x.name}${x.boss ? ' 👑' : ''}${task ? ' <span class="pill">TASK</span>' : ''}</b><small><span class="cb-${col}">level-${x.lvl}</span> · ${x.hp} HP · max hit ${enemyMaxHit(x)}</small>
        ${req.length ? `<small class="reqs ${err ? 'bad' : ''}">${err ? '🔒 ' : ''}${req.join(' · ')}</small>` : ''}</span>
      <span class="ar-have small">${x.drops.filter(d => d[1] <= 1 / 50 && !d[0].startsWith('pet')).slice(-3).map(d => itemIcon(d[0])).join('')}</span></button>`;
  }).join('');
  let areaPanel = '';
  if (area === 'slayer') {
    const sl = S.slayer;
    areaPanel = `<div class="panel"><h3>Slayer masters <small class="muted">· ${fmt(sl.points)} points · streak ${sl.streak}</small></h3>
      <div class="masters">${SLAYER_MASTERS.map(ms => {
        const lock = combatLevel() < ms.cb || LV.slayer < ms.sl;
        return `<button class="master ${lock ? 'locked' : ''} ${sl.master === ms.id ? 'on' : ''}" data-act="master" data-id="${ms.id}"><span>${ms.icon}</span><b>${ms.name}</b><small>${lock ? `🔒 Combat ${ms.cb}${ms.sl > 1 ? ' · Slayer ' + ms.sl : ''}` : `${ms.pts} pts / task`}</small></button>`;
      }).join('')}</div>
      <p class="muted small">Tap a master for a task. Only task kills give Slayer XP (XP = the monster's HP). Every 10th task gives 5× points.</p>
      <button class="btn big" data-act="slshop">💀 Slayer shop</button></div>`;
  } else if (area === 'gwd') {
    areaPanel = `<div class="panel"><h3>God Wars kill count</h3><div class="kc-grid">${Object.entries(GODS).map(([g, n]) => `<div class="kc"><span class="dot" style="background:${GOD_TINT[g]}"></span>${n}<b data-live="kc-${g}">${fmt(S.kc[g] || 0)}</b><small>/ ${GWD_KC}</small></div>`).join('')}</div>
      <p class="muted small">Kill a god's followers to build kill count. Entering a general's chamber costs ${GWD_KC} KC; you stay inside until you retreat or die. Nex needs a Frozen key, made from the four key pieces the generals drop.</p></div>`;
  }
  const sp = M.spec;
  const name = (C.fighting && C.sup ? 'Superior ' : '') + m.name;
  return taskBar() + `<div class="arena panel ${C.fighting && C.sup ? 'superior' : ''}">
      <div class="fighter" id="php"><div class="f-name">You <small>(level-${combatLevel()})</small></div>
        <div class="hpbar"><i data-live="php"></i><span data-live="phptext"></span></div><div class="splats" id="psplat"></div>
        <div class="f-stats">Max hit <b>${maxHit(false, m)}</b> · Accuracy <b>${Math.round(hitChance(m) * 100)}%</b> · Dodge <b>${Math.round((1 - enemyHitChance(m)) * 100)}%</b>${red ? ` · 🙏 −${Math.round(red * 100)}% dmg` : ''}</div>
        ${sp ? `<div class="spec-row"><div class="specbar"><i data-live="spec"></i><span data-live="spectext"></span></div><button class="btn small" data-act="spec" data-live="specbtn">${sp.name} (${sp.cost}%)</button></div>` : ''}</div>
      <div class="mstage ${C.fighting && C.mhp <= 0 ? 'dead' : ''}" id="mstage" data-tap="combat">
        <div class="mon" style="${monFilter(m)}">${m.icon}</div><div class="splats" id="msplat"></div>
        <div class="f-name">${name} <small>(level-${m.lvl})</small></div>
        <div class="hpbar enemy"><i data-live="mhp"></i><span data-live="mhptext"></span></div>
        <div class="muted small">${C.fighting ? `Tap to strike! Auto-attack every ${fmtD(M.aspd * M.wspd)}s` : 'Tap to attack'}${m.dragon && !M.antifire ? ' · <span class="cb-red">no anti-dragon shield: dragonfire ×3!</span>' : ''}</div>
      </div>
      <div class="fight-btns"><button class="btn big ${C.fighting ? 'danger' : ''}" data-act="fight">${C.fighting ? 'Retreat' : 'Fight!'}</button></div>
    </div>
    <div class="tabs">${AREAS.map(([k, n]) => `<button class="tab ${area === k ? 'on' : ''}" data-act="area" data-id="${k}">${n}</button>`).join('')}</div>
    ${areaPanel}
    <div class="list">${mons}</div>
    <div class="panel"><h3>Combat style</h3><div class="chips">${styles.map(([s, n, i]) => `<button class="chip ${C.style === s ? 'on' : ''}" data-act="style" data-id="${s}">${i} ${n}</button>`).join('')}</div>
      <p class="small">🙏 Prayer: <b>${pb.n}</b>${pb.a > 1 ? ` (+${Math.round((pb.a - 1) * 100)}% atk, +${Math.round((pb.s - 1) * 100)}% str, +${Math.round((pb.d - 1) * 100)}% def)` : ''}${LV.prayer >= 43 ? ' · Protect from Melee' : ' · <span class="muted">Protect from Melee at 43</span>'}</p>
      <h3>Auto-eat food <small class="muted">(eats below 50% HP)</small></h3>
      <div class="chips">${foodOpts.length ? foodOpts.map(id => `<button class="chip ${C.food === id ? 'on' : ''}" data-act="food" data-id="${id}">${itemIcon(id)} ${ITEMS[id].name} <small>+${ITEMS[id].heal} · <span data-count="${id}">${fmt(have(id))}</span></small></button>`).join('') : '<span class="muted">No food! Cook fish or buy some in the Shop.</span>'}</div>
      <div class="gear-sum">Gear: ⚔️ +${M.gear.atk} · 💪 +${M.gear.str} · 🛡️ +${M.gear.def} <button class="btn small" data-nav="bank">Equipment</button></div></div>
    <div class="panel"><h3>Loot</h3><div id="lootlog" class="lootlog"></div></div>`;
}
function openSlayerShop() {
  const sl = S.slayer;
  openModal(`<h2>💀 Slayer shop</h2><p>You have <b class="y">${fmt(sl.points)}</b> Slayer points.</p>
    <div class="list">${SLAYER_SHOP.map(it => {
      const owned = it.unlock && sl.unlocks[it.id];
      return `<div class="upg"><div class="upg-icon">${it.item ? itemIcon(it.id) : it.icon}</div><div class="upg-main"><b>${it.name}</b><small>${it.desc}</small><small class="cost">${owned ? '✔ Unlocked' : it.pts + ' points'}</small></div>
        ${owned ? '' : `<button class="btn ${sl.points < it.pts ? 'poor' : ''}" data-act="slbuy" data-id="${it.id}">Buy</button>`}</div>`;
    }).join('')}</div>
    <h3>Slayer equipment</h3><div class="list">${SLAYER_GEAR_SHOP.map(([id, price]) => `<div class="upg"><div class="upg-icon">${itemIcon(id)}</div><div class="upg-main"><b>${ITEMS[id].name}</b><small>Own ${fmt(have(id))}</small></div>
      <button class="btn ${S.coins < price ? 'poor' : ''}" data-act="slgear" data-id="${id}">🪙${fmt(price)}</button></div>`).join('')}</div>`);
}
function monFilter(m) {
  const f = [];
  if (m.hue) f.push(`hue-rotate(${m.hue}deg)`);
  if (m.bright) f.push(`brightness(${m.bright})`);
  return f.length ? `filter:${f.join(' ')}` : '';
}
function splat(who, dmg) {
  const box = $(who === 'm' ? '#msplat' : '#psplat');
  if (!box) return;
  const s = document.createElement('div');
  s.className = 'splat ' + (dmg > 0 ? 'hit' : 'miss');
  s.textContent = dmg;
  s.style.left = (35 + rnd() * 30) + '%'; s.style.top = (20 + rnd() * 40) + '%';
  box.appendChild(s);
  setTimeout(() => s.remove(), 900);
}

/* --- Bank --- */
const BANK_FILTERS = [['all', 'All'], ['ore', 'Ores & bars'], ['gear', 'Gear & tools'], ['food', 'Food & fish'], ['farm', 'Farming'], ['other', 'Other']];
function bankCat(it) {
  if (['ore', 'bar'].includes(it.cat)) return 'ore';
  if (['gear', 'tool'].includes(it.cat)) return 'gear';
  if (['food', 'fish'].includes(it.cat)) return 'food';
  if (it.cat === 'farm' || it.cat === 'log') return it.cat === 'log' ? 'other' : 'farm';
  return 'other';
}
const ITEM_ORDER = Object.fromEntries(Object.keys(ITEMS).map((k, i) => [k, i]));
function viewBank() {
  const slots = [['head', '⛑️'], ['cape', '🧣'], ['neck', '📿'], ['ring', '💍'], ['hands', '🧤'], ['weapon', '🗡️'], ['body', '🦺'], ['shield', '🛡️'], ['legs', '👖'], ['feet', '👢'], ['pickaxe', '⛏️'], ['hatchet', '🪓'], ['rod', '🎣'], ['mattock', '⛏']];
  const eq = slots.map(([s, ph]) => {
    const id = S.equip[s];
    return `<button class="eq-slot ${id ? '' : 'empty'}" data-act="${id ? 'item-eq' : ''}" data-slot="${s}">${id ? itemIcon(id) : `<span class="emo ph">${ph}</span>`}<small>${s}</small></button>`;
  }).join('');
  const ids = Object.keys(S.bank).filter(id => UI.bankFilter === 'all' || bankCat(ITEMS[id]) === UI.bankFilter).sort((a, b) => ITEM_ORDER[a] - ITEM_ORDER[b]);
  const value = Object.entries(S.bank).reduce((a, [id, n]) => a + sellPrice(id) * n, 0);
  return `<div class="panel"><h3>Worn equipment</h3><div class="eq-grid">${eq}</div>
      <div class="gear-sum">⚔️ Attack +${M.gear.atk} · 💪 Strength +${M.gear.str} · 🛡️ Defence +${M.gear.def}</div></div>
    <div class="chips">${BANK_FILTERS.map(([k, n]) => `<button class="chip ${UI.bankFilter === k ? 'on' : ''}" data-act="bankfilter" data-id="${k}">${n}</button>`).join('')}</div>
    <div class="bank-grid">${ids.map(id => `<button class="tile ${ITEMS[id].rare ? 'rare' : ''}" data-act="item" data-id="${id}">${itemIcon(id)}<span class="qty" data-count="${id}" data-qty>${qtyText(have(id))}</span></button>`).join('') || '<p class="muted pad">Nothing here yet. Go gather something!</p>'}</div>
    ${combinePanel()}
    <div class="panel muted small">Bank value: 🪙${fmt(value)} · ${Object.keys(S.bank).length} item types</div>`;
}
function recipeRow(r, i) {
  const ok = Object.entries(r.inp).every(([id, q]) => have(id) >= q);
  return `<div class="recipe">${Object.keys(r.inp).map(id => `<span class="rc-in ${have(id) ? 'got' : ''}" title="${esc(ITEMS[id].name)}">${itemIcon(id)}</span>`).join('<b>+</b>')}<b>→</b>
    <span class="rc-out">${itemIcon(r.out)}</span><span class="rc-name">${ITEMS[r.out].name}</span><button class="btn small ${ok ? '' : 'disabled'}" data-act="combine" data-i="${i}">Make</button></div>`;
}
function combinePanel() {
  const rel = RECIPES.map((r, i) => [r, i]).filter(([r]) => Object.keys(r.inp).some(id => have(id)));
  if (!rel.length) return '';
  return `<div class="panel"><h3>🔧 Combine items</h3><p class="muted small">Parts must be in your bank (not worn).</p>${rel.map(([r, i]) => recipeRow(r, i)).join('')}</div>`;
}
function makeRecipe(i) {
  const r = RECIPES[i];
  if (!Object.entries(r.inp).every(([id, q]) => have(id) >= q)) return toast('You are missing some parts (unequip them first if you are wearing them).', 'warn');
  for (const [id, q] of Object.entries(r.inp)) remove(id, q);
  add(r.out, 1);
  toast(`${itemIcon(r.out)}<span>You combine the parts into <b>${ITEMS[r.out].name}</b>!</span>`, 'rare', 4500); burst();
}
function qtyText(n) { return n >= 1e7 ? Math.floor(n / 1e6) + 'M' : n >= 1e5 ? Math.floor(n / 1e3) + 'K' : String(n); }
function qtyClass(n) { return n >= 1e7 ? 'q-m' : n >= 1e5 ? 'q-k' : ''; }
function itemDesc(it) {
  const b = [];
  if (it.slot && (it.atk || it.str || it.def)) b.push(`⚔️ +${it.atk || 0} · 💪 +${it.str || 0} · 🛡️ +${it.def || 0}`);
  if (it.slot === 'weapon') b.push(`Attack speed ×${it.spd || 1}${it.twoHanded ? ' · two-handed' : ''}`);
  if (it.spec) { const sp = SPECS[it.spec]; b.push(`⚡ Special: <b>${sp.name}</b> (${sp.cost}% energy)`); }
  if (it.leaf) b.push('🍃 Can damage Turoth and Kurask');
  if (it.spear) b.push('Full damage against the Corporeal Beast');
  if (it.antifire) b.push('🔥 Protects against dragonfire');
  if (it.mirror) b.push('🪞 Lets you fight Cockatrice and Basilisks');
  if (it.reduce) b.push(`Reduces damage taken by ${it.reduce * 100}%`);
  if (it.luck) b.push(`Rare drops ×${it.luck}`);
  if (it.gemx) b.push(`Gems found while mining ×${it.gemx}`);
  if (it.slayerHelm) b.push('+16.7% accuracy & damage on Slayer task · works as earmuffs, nose peg & facemask');
  if (it.perk) b.push(it.perk === 'max' ? 'Grants every skillcape perk' : `Perk: ${SKILLS[it.perk].name} ${['attack', 'strength', 'defence'].includes(it.perk) ? '+5%' : it.perk === 'hitpoints' ? 'regen ×2' : it.perk === 'prayer' ? '−10% damage taken' : it.perk === 'slayer' ? '+10% Slayer points' : it.perk === 'farming' ? '+25% crop yield' : '+25% speed'}`);
  if (it.bonus) b.push(it.bonus.desc);
  if (it.mult) b.push(`Tool power ×${it.mult}`);
  if (it.req) b.push(`Requires ${reqText(it.req)}`);
  if (it.heal) b.push(`Heals ${it.heal}`);
  if (it.cat === 'arch' && it.kind === 'artifact') b.push('Donate at the Museum (Archaeology) for a permanent bonus, or sell to a collector.');
  if (it.open) b.push('Can be opened.');
  return b.join('<br>');
}
function openItemModal(id, fromSlot) {
  const it = ITEMS[id];
  const n = have(id);
  const p = sellPrice(id);
  const btns = [];
  if (fromSlot) btns.push(`<button class="btn big" data-act="unequip" data-slot="${fromSlot}">Remove</button>`);
  else {
    if (it.slot) btns.push(`<button class="btn big" data-act="equip" data-id="${id}">${it.cat === 'tool' ? 'Wield tool' : 'Wear'}</button>`);
    if (it.heal) btns.push(`<button class="btn" data-act="eat" data-id="${id}">Eat</button>`);
    if (it.open) btns.push(`<button class="btn big" data-act="open" data-id="${id}" data-q="1">Open</button><button class="btn" data-act="open" data-id="${id}" data-q="${n}">Open all</button>`);
    btns.push(`<button class="btn" data-act="sell" data-id="${id}" data-q="1">Sell 1<small>🪙${fmt(p)}</small></button>`);
    if (n >= 10) btns.push(`<button class="btn" data-act="sell" data-id="${id}" data-q="10">Sell 10<small>🪙${fmt(p * 10)}</small></button>`);
    if (n > 1) btns.push(`<button class="btn" data-act="sell" data-id="${id}" data-q="${n - 1}">All but 1</button>`);
    btns.push(`<button class="btn danger" data-act="sell" data-id="${id}" data-q="${n}">Sell all<small>🪙${fmt(p * n)}</small></button>`);
  }
  const recs = RECIPES.map((r, i) => [r, i]).filter(([r]) => r.inp[id] || r.out === id);
  openModal(`<div class="item-modal"><div class="im-icon">${itemIcon(id)}</div><h2>${it.name}</h2>
    <p class="muted">${fromSlot ? 'Equipped' : `You have ${fmt(n)}`} · worth 🪙${fmt(p)} each</p><p class="small">${itemDesc(it)}</p>
    <div class="im-btns">${btns.join('')}</div>${recs.length ? `<h3>Combinations</h3>${recs.map(([r, i]) => recipeRow(r, i)).join('')}` : ''}</div>`);
}

/* --- Shop --- */
const SHOP_CATS = [['tools', '⛏️ Tools'], ['gear', '🛡️ Gear'], ['food', '🍖 Food'], ['seeds', '🌱 Seeds'], ['capes', '🧣 Capes']];
function viewShop() {
  const items = SHOP[UI.shopCat];
  const rows = items.map(({ id, price }) => {
    const it = ITEMS[id];
    const multi = UI.shopCat === 'food' || UI.shopCat === 'seeds';
    if (UI.shopCat === 'capes') {
      const ok = reqOk(it.req);
      return `<div class="act-row static ${ok ? '' : 'locked'}"><span class="ar-icon">${itemIcon(id)}</span><span class="ar-main"><b>${it.name}</b><small>${ok ? '' : '🔒 '}${it.perk === 'max' ? 'Every skill at 99' : SKILLS[it.perk].name + ' 99'} · ${itemDesc(it).split('<br>').filter(x => x.startsWith('Perk') || x.startsWith('Grants')).join('')}</small></span>
        <span class="shop-btns"><button class="btn ${ok ? '' : 'disabled'}" data-act="buy" data-id="${id}" data-q="1" data-afford="${price}">🪙${fmt(price)}</button></span></div>`;
    }
    const crop = CROP_BY_ID[id.replace('_seed', '')];
    const sub = it.req ? `Req ${reqText(it.req)}` : crop ? `Farming ${crop.lvl}` : it.heal ? `Heals ${it.heal}` : '';
    const st = it.slot ? (it.mult ? ` · ×${it.mult}` : ` · ⚔️${it.atk} 💪${it.str} 🛡️${it.def}`) : '';
    return `<div class="act-row static"><span class="ar-icon">${itemIcon(id)}</span>
      <span class="ar-main"><b>${it.name}</b><small>${sub}${st} · own <span data-count="${id}">${fmt(have(id))}</span></small></span>
      <span class="shop-btns"><button class="btn" data-act="buy" data-id="${id}" data-q="1" data-afford="${price}">🪙${fmt(price)}</button>
      ${multi ? `<button class="btn" data-act="buy" data-id="${id}" data-q="10" data-afford="${price * 10}">×10</button>` : ''}</span></div>`;
  }).join('');
  return `<div class="panel shop-head"><h2>🏪 General Store</h2><p class="muted">“Welcome! Buy something or sell your goods from your bank.”</p></div>
    <div class="tabs">${SHOP_CATS.map(([k, n]) => `<button class="tab ${UI.shopCat === k ? 'on' : ''}" data-act="shopcat" data-id="${k}">${n}</button>`).join('')}</div>
    <div class="list">${rows}</div>
    <div class="panel"><h3>Quick sell</h3><p class="muted">Sell all of a category in one tap (keeps gear, tools, seeds, artifacts &amp; food).</p>
      <div class="chips"><button class="chip" data-act="quicksell" data-id="ore">Ores & bars</button><button class="chip" data-act="quicksell" data-id="log">Logs</button>
      <button class="chip" data-act="quicksell" data-id="drop">Bones & hides</button><button class="chip" data-act="quicksell" data-id="gem">Gems</button><button class="chip" data-act="quicksell" data-id="smith">Smithed gear (not worn)</button><button class="chip" data-act="quicksell" data-id="junk">Burnt food & ashes</button></div></div>`;
}
function buy(id, q, price) {
  const cost = price * q;
  if (S.coins < cost) return toast("You don't have enough coins.", 'warn');
  if (ITEMS[id].perk && !reqOk(ITEMS[id].req)) return toast(`Only those with ${reqText(ITEMS[id].req).split(',').length > 2 ? 'every skill at 99' : reqText(ITEMS[id].req)} may buy this cape.`, 'warn');
  S.coins -= cost; add(id, q);
  toast(`${itemIcon(id)}<span>Bought ${q} × ${ITEMS[id].name}</span>`);
}
function quickSell(kind) {
  let total = 0, count = 0;
  for (const id of Object.keys(S.bank)) {
    const it = ITEMS[id];
    let ok = false;
    if (kind === 'ore') ok = it.cat === 'ore' || it.cat === 'bar';
    else if (kind === 'log') ok = it.cat === 'log';
    else if (kind === 'drop') ok = it.cat === 'drop';
    else if (kind === 'gem') ok = it.cat === 'gem';
    else if (kind === 'smith') ok = (it.cat === 'gear' || it.cat === 'tool') && it.tier && it.tier < 7;
    else if (kind === 'junk') ok = id === 'burnt_fish' || id === 'ashes';
    if (!ok || S.locked[id]) continue;
    const n = have(id); total += saleTake(id, n, sellPrice(id)); count += n; remove(id, n);
  }
  if (!count) return toast('Nothing to sell.', 'warn');
  gainCoins(total);
  toast(`Sold ${fmt(count)} items for 🪙${fmt(total)}`);
}

/* --- Upgrades --- */
function viewUpgrades() {
  const avail = UPGRADES.filter(u => !has(u.id) && upgUnlocked(u)).sort((a, b) => a.cost - b.cost);
  const soon = UPGRADES.filter(u => !has(u.id) && !upgUnlocked(u)).sort((a, b) => a.cost - b.cost).slice(0, 4);
  const owned = UPGRADES.filter(u => has(u.id));
  const card = u => `<div class="upg"><div class="upg-icon">${u.icon}</div><div class="upg-main"><b>${u.name}</b><small>${u.desc}</small>
      <small class="cost">🪙${fmt(u.cost)}${Object.entries(u.items || {}).map(([id, q]) => ` + ${q}× ${ITEMS[id].name} (<span data-count="${id}">${fmt(have(id))}</span>)`).join('')}</small></div>
      <button class="btn" data-act="upg" data-id="${u.id}" data-afford="${u.cost}" ${u.items ? 'data-items="' + esc(JSON.stringify(u.items)) + '"' : ''}>Buy</button></div>`;
  const g = ascendGain();
  const canAsc = totalLevel() >= ascReqTotal() && g >= 1;
  return `<div class="panel"><h2>⭐ Upgrades</h2><p class="muted">Upgrades unlock as you level, hire workers and fight. Each one is permanent for this run.</p></div>
    ${now() < S.buffs.frenzy ? '<div class="panel glow">🔥 FRENZY active! ×7 production</div>' : ''}
    <div class="list">${avail.map(card).join('') || '<p class="muted pad">No upgrades available right now — keep training!</p>'}</div>
    ${soon.length ? `<div class="panel"><h3>Coming up</h3>${soon.map(u => `<div class="upg locked"><div class="upg-icon">❔</div><div class="upg-main"><b>???</b><small>Unlocks at: ${upgReqText(u)}</small></div></div>`).join('')}</div>` : ''}
    <div class="panel asc"><h3>🌀 Ascension</h3>
      <p>Reset your levels, items, coins, workers and upgrades to earn <b>Ancient Runes</b>. Each rune permanently gives <b>+5%</b> production and <b>+2%</b> XP &amp; sell prices.</p>
      <p class="muted">Museum collections, pets and runes are kept. Requires total level ${ascReqTotal()}.</p>
      <p>You hold <b class="y">${S.asc.points}</b> runes · ascending now grants <b class="y">+${g}</b></p>
      <button class="btn big ${canAsc ? '' : 'disabled'}" data-act="ascend">${canAsc ? 'Ascend…' : `Total level ${totalLevel()}/${ascReqTotal()}`}</button></div>
    ${owned.length ? `<details class="panel"><summary>Owned upgrades (${owned.length})</summary>${owned.map(u => `<div class="owned">${u.icon} <b>${u.name}</b> <small class="muted">${u.desc}</small></div>`).join('')}</details>` : ''}`;
}

/* --- Menu --- */
let deferredInstall = null;
function viewMenu() {
  const st = S.stats, lt = S.lifetime;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return `<div class="panel"><h2>☰ More</h2></div>
    ${!standalone ? `<div class="panel glow"><h3>📲 Install as an app</h3>${deferredInstall ? '<button class="btn big" data-act="install">Install Clickscape</button>' :
      isIOS ? '<p>In Safari tap the <b>Share</b> button, then <b>Add to Home Screen</b>.</p>' : '<p>Open your browser menu (⋮) and choose <b>Install app</b> or <b>Add to Home screen</b>.</p>'}
      <p class="muted small">Once installed it runs full-screen and works offline.</p></div>` : ''}
    <div class="panel"><h3>🐾 Pets</h3><div class="pet-grid">${Object.entries(PETS).map(([id, p]) => `<div class="pet ${S.pets[id] ? 'got' : ''}"><span>${S.pets[id] ? p.icon : '❔'}</span><small>${S.pets[id] ? p.name : '???'}</small><small class="muted">${p.desc}</small></div>`).join('')}</div></div>
    <div class="panel"><h3>📊 Stats</h3><div class="stats">
      <div>Taps (run / all)</div><b>${fmt(st.taps)} / ${fmt(lt.taps)}</b>
      <div>Kills (run / all)</div><b>${fmt(st.kills)} / ${fmt(lt.kills)}</b>
      <div>Coins earned (run)</div><b>🪙${fmt(st.earned)}</b>
      <div>Total XP (run / all)</div><b>${fmt(st.xpRun)} / ${fmt(lt.xp)}</b>
      <div>Rare finds</div><b>${fmt(st.rares)}</b>
      <div>Random events</div><b>${fmt(st.events)}</b>
      <div>Ascensions</div><b>${S.asc.count}</b>
      <div>Workers</div><b>${Object.values(S.workers).reduce((a, b) => a + b, 0)}</b></div></div>
    <div class="panel"><h3>💾 Save</h3><p class="muted small">Your game autosaves on this device. Export a backup code to move it to another phone.</p>
      <div class="chips"><button class="chip" data-act="export">Export save</button><button class="chip" data-act="import">Import save</button><button class="chip" data-act="savenow">Save now</button></div>
      <label class="toggle"><input type="checkbox" data-act="vibrate" ${S.settings.vibrate ? 'checked' : ''}> Vibrate on rare drops</label>
      <button class="btn danger" data-act="wipe">Delete save &amp; restart</button></div>
    <div class="panel muted small"><h3>How to play</h3>
      <p>⛏️ <b>Tap</b> a skill's stage to gather or craft. Mine ore → smelt bars at the <b>Furnace</b> → smith gear at the <b>Anvil</b>.</p>
      <p>👷 <b>Hire workers</b> — they produce automatically, even while the app is closed (8h cap, upgradable).</p>
      <p>⭐ Buy <b>Upgrades</b> to multiply everything. Catch the wandering 🧞 <b>random events</b> for frenzies, lamps and loot.</p>
      <p>⚔️ Fight monsters for XP, coins and rare drops. Bring cooked food — you auto-eat below 50% HP.</p>
      <p>🏺 Dig up artifact sets and donate them to the Museum for permanent bonuses. Then <b>Ascend</b> for Ancient Runes.</p>
      <p>💀 Get <b>Slayer tasks</b> from masters. Higher Slayer levels unlock tougher monsters, some needing special kit (earmuffs, mirror shield, leaf-bladed weapons, rock hammer).</p>
      <p>⚔️ In the <b>God Wars Dungeon</b>, kill followers for kill count, then face the generals for Bandos, Armadyl and godsword pieces. Combine parts in your bank.</p>
      <p>🙏 Offer bones at the altar. Prayer boosts your combat and, from level 43, protects you from melee.</p>
      <p>A fan-made idle game inspired by classic MMO skilling. Not affiliated with any game company.</p></div>`;
}

/* --- Modal & toasts --- */
function openModal(html) { const m = $('#modal'); m.innerHTML = `<div class="modal-card panel"><button class="x" data-act="close">✕</button>${html}</div>`; m.hidden = false; UI.modal = true; }
function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; UI.modal = false; UI.force = true; }
function levelUpToast(sk, L) {
  toast(`<span class="lu-icon">${SKILLS[sk].icon}</span><span><b>Congratulations!</b> You've just advanced a ${SKILLS[sk].name} level. You are now level <b>${L}</b>.${L === 99 ? ' 🏆 MAX LEVEL! 🏆' : ''}</span>`, 'lvlup', 3200);
  burst();
  buzz(25); SFX.play('level');
  UI.force = true;
}
function burst() {
  const box = $('#floaters');
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('div'); s.className = 'firework';
    s.style.left = (window.innerWidth / 2) + 'px'; s.style.top = '120px';
    s.style.setProperty('--dx', (rnd() * 240 - 120) + 'px'); s.style.setProperty('--dy', (rnd() * 160 - 40) + 'px');
    s.style.background = ['#ff981f', '#ffff00', '#00ff80', '#ff4040'][i % 4];
    box.appendChild(s); setTimeout(() => s.remove(), 900);
  }
}
function floater(x, y, text, cls) {
  const box = $('#floaters');
  if (box.children.length > 30) return;
  const f = document.createElement('div');
  f.className = 'floater ' + (cls || ''); f.textContent = text;
  f.style.left = (x + (rnd() * 30 - 15)) + 'px'; f.style.top = (y - 10) + 'px';
  box.appendChild(f); setTimeout(() => f.remove(), 900);
}
function floaterOn(sel, text, cls) { const el = $(sel); if (!el) return; const r = el.getBoundingClientRect(); floater(r.left + r.width / 2, r.top + 20, text, cls); }
function buzz(p) { if (S.settings.vibrate && navigator.vibrate) try { navigator.vibrate(p); } catch (e) { } }

/* --- Render & live updates --- */
const VIEWS = { skills: viewSkills, skill: viewSkill, combat: viewCombat, bank: viewBank, shop: viewShop, upgrades: viewUpgrades, menu: viewMenu };
function viewSig() {
  const lv = SKILL_ORDER.map(s => LV[s]).join(',');
  switch (UI.view) {
    case 'skills': return lv + JSON.stringify(S.workers) + JSON.stringify(S.target) + S.plots.filter(plotReady).length;
    case 'skill': return lv + UI.skill + JSON.stringify(UI.station) + JSON.stringify(S.target) + JSON.stringify(S.workers) + JSON.stringify(S.equip) + UI.anvilMetal + JSON.stringify(S.museum) + (UI.skill === 'archaeology' ? DIGSITES.map(d => d.arts.map(a => have(a[0]) > 0 ? 1 : 0).join('')).join('') : '') + (UI.skill === 'farming' ? S.plots.map(p => p ? p.c + plotReady(p) : '-').join() + S.useAshes + has('gardener') : '');
    case 'combat': { const C = S.combat, sl = S.slayer; return lv + C.mon + C.fighting + C.style + C.food + JSON.stringify(S.equip) + FOODS.filter(id => have(id)).join() + M.aspd + UI.area + C.sup + sl.mon + sl.master + sl.points + JSON.stringify(sl.unlocks) + MONSTERS.filter(m => m.area === (UI.area || curMon().area)).map(m => canFight(m) ? 0 : 1).join(''); }
    case 'bank': return Object.keys(S.bank).join() + JSON.stringify(S.equip) + UI.bankFilter;
    case 'shop': return UI.shopCat;
    case 'upgrades': return UPGRADES.filter(u => !has(u.id) && upgUnlocked(u)).map(u => u.id).join() + Object.keys(S.upgrades).length + S.asc.points + totalLevel() + (now() < S.buffs.frenzy);
    case 'menu': return JSON.stringify(S.pets) + !!deferredInstall;
  }
  return '';
}
let LIVE = [];
function render() {
  const sig = viewSig();
  if (!UI.force && sig === UI.sig) return;
  UI.force = false; UI.sig = sig;
  const v = $('#view');
  const y = window.scrollY;
  const fa = document.activeElement, fid = fa && fa.id && v.contains(fa) ? fa.id : null, sel = fid ? [fa.selectionStart, fa.selectionEnd] : null;
  v.innerHTML = VIEWS[UI.view]();
  window.scrollTo(0, y);
  if (fid) { const n = document.getElementById(fid); if (n) { n.focus(); try { n.setSelectionRange(sel[0], sel[1]); } catch (e) { } } }
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.nav === UI.view || (UI.view === 'skill' && b.dataset.nav === 'skills')));
  LIVE = {
    prog: $$('[data-prog]', v), count: $$('[data-count]', v), xp: $$('[data-xp]', v), xpt: $$('[data-xptext]', v),
    tp: $$('[data-tappower]', v), rate: $$('[data-rate]', v), ipm: $$('[data-ipm]', v), hire: $$('[data-hire]', v),
    afford: $$('[data-afford]', v), status: $$('[data-status]', v), plot: $$('[data-plot]', v), plott: $$('[data-plottime]', v), live: $$('[data-live]', v),
  };
  postRender();
  liveUpdate();
}
const setT = (e, v) => { if (e._v !== v) { e._v = v; e.textContent = v; } };
function liveUpdate() {
  setT($('#coins'), fmt(S.coins));
  const fr = now() < S.buffs.frenzy;
  const bf = $('#buffs');
  const bh = fr ? `<span class="buff">🔥×7 ${Math.ceil((S.buffs.frenzy - now()) / 1000)}s</span>` : ''; if (bf._h !== bh) { bf._h = bh; bf.innerHTML = bh; }
  const L = LIVE;
  if (!L.prog) return;
  L.prog.forEach(e => { const st = e.dataset.prog, a = ACTIONS[S.target[st]]; e.style.width = clamp((S.prog[st] || 0) / a.hp * 100, 0, 100) + '%'; });
  L.count.forEach(e => { const n = have(e.dataset.count); if (e.dataset.qty !== undefined) { setT(e, qtyText(n)); const c = 'qty ' + qtyClass(n); if (e.className !== c) e.className = c; } else setT(e, fmt(n)); });
  L.xp.forEach(e => e.style.width = xpProgress(e.dataset.xp)[0] * 100 + '%');
  L.xpt.forEach(e => setT(e, xpProgress(e.dataset.xptext)[1]));
  L.tp.forEach(e => setT(e, fmtD(M.tap[e.dataset.tappower] * frenzy())));
  L.rate.forEach(e => setT(e, fmtD(M.rate[e.dataset.rate] * frenzy())));
  L.ipm.forEach(e => { const st = e.dataset.ipm, a = ACTIONS[S.target[st]]; setT(e, fmtD(M.rate[st] * frenzy() / a.hp * 60)); });
  L.hire.forEach(e => { const [st, k] = e.dataset.hire.split(':'); const c = hireCost(st, +k); setT(e, '🪙' + fmt(c)); const poor = S.coins < c; if (e.parentElement._p !== poor) { e.parentElement._p = poor; e.parentElement.classList.toggle('poor', poor); } });
  L.afford.forEach(e => {
    let ok = S.coins >= +e.dataset.afford;
    if (ok && e.dataset.items) { const it = JSON.parse(e.dataset.items); for (const id in it) if (have(id) < it[id]) ok = false; }
    if (e._p !== !ok) { e._p = !ok; e.classList.toggle('poor', !ok); }
  });
  L.status.forEach(e => {
    const st = e.dataset.status, a = ACTIONS[S.target[st]];
    setT(e, !canMakeOne(a) ? '⚠ out of materials' : '');
  });
  L.plot.forEach(e => { const p = S.plots[e.dataset.plot]; if (p) e.style.width = clamp((now() - p.t0) / p.dur * 100, 0, 100) + '%'; });
  liveExtra(L);
  L.plott.forEach(e => { const p = S.plots[e.dataset.plottime]; if (p) { const left = (p.t0 + p.dur - now()) / 1000; setT(e, left > 0 ? fmtTime(left) : 'Ready! Tap to harvest'); } });
  if (UI.view === 'combat') {
    const C = S.combat, m = MONSTER_BY_ID[C.mon];
    L.live.forEach(e => {
      const k = e.dataset.live;
      if (k === 'php') e.style.width = clamp(C.hp / maxHp() * 100, 0, 100) + '%';
      if (k === 'phptext') setT(e, `${Math.max(0, C.hp)} / ${maxHp()}`);
      const mx = C.fighting && C.mmax ? C.mmax : m.hp;
      if (k === 'mhp') e.style.width = clamp((C.fighting ? C.mhp : mx) / mx * 100, 0, 100) + '%';
      if (k === 'mhptext') setT(e, `${C.fighting ? Math.max(0, C.mhp) : mx} / ${mx}`);
      if (k === 'spec') e.style.width = C.spec + '%';
      if (k === 'spectext') setT(e, `Special ${Math.floor(C.spec)}%`);
      if (k === 'specbtn') { const pr = !M.spec || C.spec < M.spec.cost || !C.fighting; if (e._p !== pr) { e._p = pr; e.classList.toggle('poor', pr); } }
      if (k === 'taskleft') setT(e, String(S.slayer.left));
      if (k.startsWith('kc-')) setT(e, fmt(S.kc[k.slice(3)] || 0));
    });
    liveCombatExtra(L);
    const ll = $('#lootlog');
    if (ll) { const h = S.loot.map(l => `<div>${esc(l)}</div>`).join('') || '<span class="muted">Kill something!</span>'; if (ll._h !== h) { ll.innerHTML = h; ll._h = h; } }
  }
}

/* --- Input --- */
document.addEventListener('pointerdown', e => {
  const t = e.target.closest('[data-tap]');
  if (!t || UI.modal) return;
  e.preventDefault();
  const k = t.dataset.tap;
  if (k === 'combat') tapMonster(e.clientX, e.clientY);
  else tapStation(k, e.clientX, e.clientY);
  liveUpdate();
}, { passive: false });
document.addEventListener('contextmenu', e => { if (e.target.closest('[data-tap]')) e.preventDefault(); });

document.addEventListener('click', e => {
  const nav = e.target.closest('[data-nav]');
  if (nav) { closeModal(); return go(nav.dataset.nav); }
  if (e.target.id === 'modal') return closeModal();
  const t = e.target.closest('[data-act]');
  if (!t) return;
  const d = t.dataset, id = d.id;
  switch (d.act) {
    case 'close': closeModal(); break;
    case 'skill': go('skill', { skill: id }); break;
    case 'station': UI.station[UI.skill] = d.st; UI.force = true; break;
    case 'metal': UI.anvilMetal = id; UI.force = true; break;
    case 'target': {
      const a = ACTIONS[id];
      if (LV[STATIONS[a.st].skill] < a.lvl) { toast(`You need ${SKILLS[STATIONS[a.st].skill].name} level ${a.lvl} for that.`, 'warn'); break; }
      S.target[d.st] = id; S.prog[d.st] = 0; break;
    }
    case 'hire': hire(d.st, d.k === 'max' ? 'max' : +d.k); break;
    case 'donate': {
      const site = SITE_BY_ID[id];
      if (S.museum[id] || !site.arts.every(([a]) => have(a))) { toast('You need one of each artifact from this site.', 'warn'); break; }
      site.arts.forEach(([a]) => remove(a, 1)); S.museum[id] = true; recalc();
      toast(`🏛️ Collection complete: <b>${site.name}</b>! ${site.buff.desc} (permanent)`, 'pet', 6000); burst(); UI.force = true; break;
    }
    case 'plot': {
      const i = +d.i, p = S.plots[i];
      if (!p) openSeedPicker(i);
      else if (plotReady(p)) { const c = p.c; const y = harvest(i); toast(`${itemIcon(c)}<span>You harvest ${y} × ${CROP_BY_ID[c].name}</span>`); UI.lastSeed = c; }
      else toast(`${CROP_BY_ID[p.c].name} is still growing.`);
      break;
    }
    case 'plant': if (plant(+d.i, id)) { UI.lastSeed = id; closeModal(); } break;
    case 'harvestall': { let n = 0; S.plots.forEach((p, i) => { if (plotReady(p)) { UI.lastSeed = p.c; n += harvest(i); } }); toast(n ? `Harvested ${n} crops.` : 'Nothing is ready yet.'); break; }
    case 'replant': {
      const seed = UI.lastSeed || CROPS.filter(c => have(c.id + '_seed') && LV.farming >= c.lvl).pop()?.id;
      if (!seed) { toast('You have no seeds to plant.', 'warn'); break; }
      let n = 0; S.plots.forEach((p, i) => { if (!p && plant(i, seed, true)) n++; });
      toast(n ? `Planted ${n} × ${CROP_BY_ID[seed].name}.` : 'No empty patches or no seeds.'); break;
    }
    case 'ashes': S.useAshes = t.checked; break;
    case 'vibrate': S.settings.vibrate = t.checked; break;
    case 'buyplot': {
      const c = PLOT_COSTS[S.plots.length];
      if (S.coins < c) { toast("You don't have enough coins.", 'warn'); break; }
      S.coins -= c; S.plots.push(null); toast('🌱 You bought a new farming patch!'); UI.force = true; break;
    }
    case 'gotoshop-seeds': closeModal(); go('shop', { shopCat: 'seeds' }); break;
    case 'fight': if (S.combat.fighting) retreat(); else startFight(); UI.force = true; break;
    case 'mon': {
      if (S.combat.mon !== id) { if (S.combat.fighting) retreat(); S.combat.mon = id; }
      const err = canFight(MONSTER_BY_ID[id]); if (err) toast('🔒 ' + err, 'warn');
      UI.force = true; break;
    }
    case 'area': UI.area = id; UI.force = true; break;
    case 'gocombat': go('combat', { area: id || UI.area }); break;
    case 'master': assignTask(id); break;
    case 'fighttask': { const m = MONSTER_BY_ID[S.slayer.mon]; if (!m) break; if (S.combat.fighting) retreat(); S.combat.mon = m.id; UI.area = m.area; startFight(); UI.force = true; break; }
    case 'slshop': openSlayerShop(); break;
    case 'slbuy': slayerBuy(id); openSlayerShop(); break;
    case 'slgear': { const pr = SLAYER_GEAR_SHOP.find(x => x[0] === id)[1]; buy(id, 1, pr); openSlayerShop(); break; }
    case 'spec': if (!doSpec()) toast(M.spec ? 'Not enough special attack energy.' : 'Your weapon has no special attack.', 'warn'); break;
    case 'combine': makeRecipe(+d.i); if (UI.modal) closeModal(); break;
    case 'style': S.combat.style = id; recalc(); UI.force = true; break;
    case 'food': S.combat.food = id; break;
    case 'bankfilter': UI.bankFilter = id; break;
    case 'item': openItemModal(id); break;
    case 'item-eq': openItemModal(S.equip[d.slot], d.slot); break;
    case 'equip': equip(id); closeModal(); break;
    case 'unequip': unequip(d.slot); closeModal(); break;
    case 'eat': eat(id); if (!have(id)) closeModal(); else openItemModal(id); break;
    case 'open': openItem(id, +d.q); if (!have(id)) closeModal(); else openItemModal(id); break;
    case 'sell': sell(id, +d.q); if (!have(id)) closeModal(); else openItemModal(id); break;
    case 'shopcat': UI.shopCat = id; break;
    case 'buy': { const it = SHOP[UI.shopCat].find(x => x.id === id); if (it) buy(id, +d.q, it.price); break; }
    case 'quicksell': quickSell(id); break;
    case 'upg': buyUpgrade(id); break;
    case 'ascend': {
      if (totalLevel() < ascReqTotal() || ascendGain() < 1) { toast(`Reach total level ${ascReqTotal()} to ascend.`, 'warn'); break; }
      openModal(`<h2>🌀 Ascend?</h2><p>You will gain <b class="y">${ascendGain()}</b> Ancient Runes (total ${S.asc.points + ascendGain()}).</p>
        <p>Everything except museum collections, pets and runes will be reset.</p><button class="btn big danger" data-act="ascend-yes">Yes, ascend</button><button class="btn" data-act="close">Not yet</button>`);
      break;
    }
    case 'ascend-yes': ascend(); break;
    case 'install': if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; UI.force = true; } break;
    case 'export': {
      save();
      const code = btoa(unescape(encodeURIComponent(localStorage.getItem(SAVE_KEY))));
      openModal(`<h2>Export save</h2><p class="muted">Copy this code somewhere safe.</p><textarea class="code" readonly>${code}</textarea><button class="btn big" data-act="copy">Copy</button>`);
      break;
    }
    case 'copy': { const ta = $('#modal textarea'); ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length); navigator.clipboard?.writeText(ta.value).then(() => toast('Copied!'), () => document.execCommand('copy')); break; }
    case 'import': openModal(`<h2>Import save</h2><textarea class="code" placeholder="Paste your save code"></textarea><button class="btn big" data-act="import-go">Load save</button>`); break;
    case 'import-go': {
      try {
        const raw = $('#modal textarea').value.trim();
        let json;
        if (raw.startsWith('{')) json = raw;
        else {
          let b = raw.replace(/[^A-Za-z0-9+/=_-]/g, '').replace(/-/g, '+').replace(/_/g, '/');
          while (b.length % 4) b += '=';
          json = decodeURIComponent(escape(atob(b)));
        }
        const data = JSON.parse(json);
        if (!data || typeof data !== 'object' || !data.xp) throw new Error('not a save');
        SAVE_LOCK = true;
        localStorage.setItem(SAVE_KEY, json);
        toast('💾 Save imported, reloading…');
        setTimeout(() => location.reload(), 300);
      } catch (err) { toast('That save code is not valid.', 'warn'); }
      break;
    }
    case 'savenow': save(); toast('💾 Game saved.'); break;
    case 'wipe': openModal(`<h2>Delete everything?</h2><p>This permanently deletes your save on this device, including runes and pets.</p><button class="btn big danger" data-act="wipe-yes">Delete save</button><button class="btn" data-act="close">Cancel</button>`); break;
    case 'wipe-yes': SAVE_LOCK = true; localStorage.removeItem(SAVE_KEY); location.reload(); break;
  }
  if (!['close', 'skill'].includes(d.act)) { render(); liveUpdate(); }
});

/* --- Boot --- */
function boot() {
  load();
  $('#nav').innerHTML = NAV.map(([k, i, n]) => `<button data-nav="${k}"><span>${i}</span><small>${n}</small></button>`).join('');
  simulateOffline();
  render();
  let lastT = performance.now();
  setInterval(() => {
    const t = performance.now();
    const dt = (t - lastT) / 1000;
    lastT = t;
    if (dt > 30) simulateOffline();               // phone woke up after a long sleep
    else if (dt > 2) for (let s = 0; s < dt; s++) tickCore(Math.min(1, dt - s));
    else tickCore(dt);
    S.last = Date.now();
    if (Date.now() >= S.nextEvent) spawnEvent();
    if (!UI.modal) render();
    liveUpdate();
  }, 100);
  setInterval(save, 15000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) save();
    else { simulateOffline(); UI.force = true; lastT = performance.now(); }
  });
  window.addEventListener('pagehide', save);
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; UI.force = true; });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
}
