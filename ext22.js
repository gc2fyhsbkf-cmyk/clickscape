'use strict';
/* =========================================================
   CLICKSCAPE v8.0 — big-number progression
   Level caps 99/120 +6 per ascension +60 per Transcendence (to 599), XP curve to 600,
   depth power, near-cap ascension requirement, metal tiers every 50 levels with
   steep bar counts & imbuing fees, scaled costs, farming/herblore catch-up,
   prayer "cash offerings", huge-number formatting
   ========================================================= */

/* ---------- tunables (set by the pacing bot) ---------- */
const PW = { prod: 1.2, xp: 1.2, money: 1.2, cxp: 1.4, d0: 5 };
const PWT = { prod: 1.45, xp: 1.45, money: 1.45, cxp: 0.35 }; // extra per Transcendence (first five)
const PWT2 = { prod: 1.45, xp: 1.45, money: 1.45, cxp: 1.15 }; // …and beyond, once Pantheon perks are maxed
const tcount = () => S?.trans?.count || 0;
const pw = k => Math.pow(PW[k], pdepth()) * Math.pow(PWT[k], Math.min(5, tcount())) * Math.pow(PWT2[k], Math.max(0, tcount() - 5)) * (k === 'money' ? 1 : freshBoost());
const SIGIL_K = 0.1;
// fresh start after a Transcendence: ×2 production & XP on ascension 0, fading by ascension 5
const freshBoost = () => tcount() ? 1 + Math.max(0, 5 - (S.asc?.count || 0)) / 5 : 1;
const depth = () => (S?.asc?.count || 0) + 10 * (S?.trans?.count || 0);
const pdepth = () => Math.max(0, depth() - PW.d0); // power starts compounding once runs reach the cap wall

/* ================= NUMBERS ================= */
const NUM_U = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'UDc', 'DDc', 'TDc'];
fmt = function (n) {
  n = Math.floor(n || 0);
  if (!isFinite(n)) return '∞';
  if (Math.abs(n) < 100000) return n.toLocaleString('en-US');
  let i = 0, x = n;
  while (Math.abs(x) >= 1000 && i < NUM_U.length - 1) { x /= 1000; i++; }
  if (Math.abs(x) >= 1000) return n.toExponential(2).replace('e+', 'e');
  return (x < 10 ? x.toFixed(2) : x < 100 ? x.toFixed(1) : Math.floor(x)) + NUM_U[i];
};
levelOf = function (xp, cap = 99) {
  let lo = 1, hi = Math.min(cap, XP_TABLE.length - 2);
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (xp >= XP_TABLE[mid]) lo = mid; else hi = mid - 1; }
  return lo;
};

/* ================= ASCENSION: near-cap requirement ================= */
ascReqCalc = function () {
  const n = SKILL_ORDER.length, d = depth();
  const avgCap = SKILL_ORDER.reduce((a, k) => a + (MAX_LVL[k] || 99), 0) / n;
  const pan = S?.trans?.perks?.pantheon || 0;
  return Math.round(n * Math.min((d ? 60 + 30 * d : 30) * (1 - 0.1 * pan), avgCap - 12 - 4 * pan));
};
// sigils & essence grow with the log of XP earned, so huge numbers don't explode them
ascendGain = (orig => function () {
  const o = orig(), c = S.asc.count || 0, xr = S.stats.xpRun || 0;
  const oldBase = Math.floor(Math.sqrt(xr / 40000) * (1 + 0.1 * c)), mult = oldBase > 0 ? o / oldBase : 1;
  const nb = 40 * Math.log10(Math.max(1, xr / 1e5)) * (1 + 0.1 * c);
  return Math.floor(nb * mult);
})(ascendGain);

/* ================= DEPTH POWER ================= */
const powP = () => pw('prod'), powM = () => pw('money');
recalc4 = (orig => function () {
  orig(); if (!S?.asc) return;
  const pp = pw('prod');
  // sigils: diminishing (log) bonus instead of +5% each, so depth power drives the curve
  const sp = S.asc.points || 0, rr = 1 + 0.5 * (S.trans?.perks?.runes || 0);
  const oldA = 1 + 0.05 * sp * rr, newA = 1 + SIGIL_K * rr * Math.log(1 + sp / 10);
  const fx = newA / oldA;
  for (const st of STATION_ORDER) { M.rate[st] *= fx; M.tap[st] *= fx; }
  M.asc = newA; M.sigil = newA;
  M.xp *= (1 + 0.1 * Math.log(1 + sp / 10)) / (1 + 0.02 * sp);
  M.sell *= (1 + 0.1 * Math.log(1 + sp / 10)) / (1 + 0.02 * sp);
  M.xp *= pw('xp') * (1 + 0.06 * (S.asc.count || 0)); // replaces the old per-ascension XP slowdown
  M.cxp *= pw('cxp');
  for (const st of STATION_ORDER) { M.rate[st] *= pp; M.tap[st] *= pp; }
  M.depthPow = pp;
  M.rate.harbour = 0; M.tap.harbour = 0;
})(recalc4);
// costs that scale with depth
// typical coins earned in one run at a given depth (fitted from the pacing bot)
const estEarn = d => Math.pow(10, d <= 5 ? 6.7 + d : 11.7 + 0.13 * (d - 5));
tributeCoinsCalc = function () { return Math.round(0.15 * estEarn(depth())); };
transCostCalc = function () { return Math.round(estEarn(depth())); };
mktDepthCoins = function () { return Math.max(3e9, 0.005 * estEarn(depth())); };

/* ================= METAL TIERS EVERY 50 LEVELS ================= */
const TIER_REMAP = { ascended: 150, exalted: 200, divine: 250, eternal: 300, godforged: 350 };
(function () {
  for (const T of ATIERS) {
    const nl = TIER_REMAP[T.id], dl = nl - T.lvl; if (!dl) continue;
    const gi = new Set(['ore', 'bar', 'logs', 'fish', 'bow', 'staff', 'harpoon', 'mattock', ...SMITH_ITEMS.map(s => s.k)].map(k => T.id + '_' + k)); gi.add('raw_' + T.id + '_fish');
    const ga = new Set(['m_' + T.id + '_ore', 's_' + T.id, 'w_' + T.id + '_logs', 'f_' + T.id + '_logs', 'sw_' + T.id + '_plank', 'fi_' + T.id, 'c_' + T.id, 'fl_' + T.id + '_bow', 'cr_' + T.id + '_staff', ...[...gi].map(i => 'a_' + i)]);
    T.gi = gi;
    const seen = new Set();
    for (const st in STATION_ACTIONS) for (const a of STATION_ACTIONS[st]) if ((ga.has(a.id) || a.metal === T.id) && !seen.has(a)) { seen.add(a); a.lvl += dl; }
    for (const id of gi) { const it = ITEMS[id]; if (it?.req) for (const k in it.req) it.req[k] += dl; }
    for (const m of MONSTERS) if (m.area === 'beyond' && m.lvl) {} // monster combat levels stay
    const me = METALS.find(m => m.id === T.id); if (me) { me.lvl = nl; me.eq = nl - 20; }
    T.lvl = nl;
  }
  // tier values climb ×10 every 50 levels
  ATIERS.forEach(T => {
    const nbv = Math.round(1e5 * Math.pow(10, (T.lvl - 150) / 50)), f = nbv / T.bv;
    for (const id of T.gi || []) if (ITEMS[id]?.value) ITEMS[id].value = Math.round(ITEMS[id].value * f);
    T.bv = nbv;
  });
})();
// three new tiers: 400, 450, 500
const NEW_TIERS = [
  { id: 'starmetal', name: 'Starmetal', tint: '#7ad8ff', trim: '#e8faff', lvl: 400, tier: 16, f: 56, mult: 120, fxp: 1150, extra: { star_coral: 1 } },
  { id: 'voidsteel', name: 'Voidsteel', tint: '#5a2ab8', trim: '#c8a8ff', lvl: 450, tier: 17, f: 70, mult: 170, fxp: 1500, extra: { leviathan_scale: 2 } },
  { id: 'primordial', name: 'Primordial', tint: '#ffffff', trim: '#ffd84a', lvl: 500, tier: 18, f: 88, mult: 240, fxp: 2000, extra: { leviathan_scale: 3, star_coral: 2 } },
];
NEW_TIERS.forEach((T, j) => {
  const i = ATIERS.length; T.bv = Math.round(1e5 * Math.pow(10, (T.lvl - 150) / 50));
  ATIERS.push(T); TOOL_MULT[T.tier] = T.mult;
  item(T.id + '_ore', T.name + ' ore', Math.round(T.bv / 6), { cat: 'ore', kind: 'ore', tint: T.tint });
  item(T.id + '_bar', T.name + ' bar', Math.round(T.bv / 2), { cat: 'bar', kind: 'bar', tint: T.tint });
  A7({ id: 'm_' + T.id + '_ore', st: 'mine', name: T.name + ' rock', lvl: T.lvl, xp: 300 + i * 160, hp: effort(300 + i * 160, 12 + i), out: { [T.id + '_ore']: 1 }, icon: T.id + '_ore' });
  A7({ id: 's_' + T.id, st: 'furnace', name: T.name + ' bar', lvl: T.lvl, xp: 140 + i * 70, hp: 8 + i, inp: { [T.id + '_ore']: 1, ...T.extra }, out: { [T.id + '_bar']: 1 }, icon: T.id + '_bar' });
  SMITH_ITEMS.forEach(si => {
    const id = T.id + '_' + si.k;
    item(id, T.name + ' ' + si.name, Math.round(si.bars * T.bv * 1.5), { cat: si.tool ? 'tool' : 'gear', kind: si.k, tint: T.tint, trim: T.trim, slot: si.slot, tier: T.tier, rare: true, spd: si.k === 'dagger' ? 0.85 : undefined,
      mult: si.tool ? T.mult : undefined, atk: Math.round((si.atk || 0) * T.f), str: Math.round((si.str || 0) * T.f), def: Math.round((si.def || 0) * T.f), req: si.tool ? { [si.tool]: T.lvl - 15 } : gearReq(si, T.lvl - 20) });
    A7({ id: 'a_' + id, st: 'anvil', metal: T.id, name: T.name + ' ' + si.name, lvl: T.lvl + si.off, xp: si.bars * T.fxp, hp: si.bars * 3 + 12 + i * 2, inp: { [T.id + '_bar']: si.bars }, out: { [id]: 1 }, icon: id });
  });
  [['harpoon', 'rod', 'fishing'], ['mattock', 'mattock', 'archaeology']].forEach(([k, slot, sk]) => {
    const id = T.id + '_' + k;
    item(id, T.name + ' ' + k, Math.round(3 * T.bv), { cat: 'tool', kind: k, tint: T.tint, trim: T.trim, slot, tier: T.tier, mult: T.mult, req: { [sk]: T.lvl - 15 }, rare: true });
    A7({ id: 'a_' + id, st: 'anvil', metal: T.id, name: T.name + ' ' + k, lvl: T.lvl + 8, xp: 2 * T.fxp, hp: 14 + i * 2, inp: { [T.id + '_bar']: 2 }, out: { [id]: 1 }, icon: id });
  });
  item(T.id + '_logs', T.name + ' logs', Math.round(T.bv / 8), { cat: 'log', kind: 'log', tint: T.tint });
  A7({ id: 'w_' + T.id + '_logs', st: 'forest', name: T.name + ' tree', lvl: T.lvl, xp: 600 + i * 300, hp: effort(600 + i * 300, 11 + i), out: { [T.id + '_logs']: 1 }, icon: T.id + '_logs' });
  A7({ id: 'f_' + T.id + '_logs', st: 'fire', name: 'Burn ' + T.name.toLowerCase() + ' logs', lvl: T.lvl, xp: 800 + i * 400, hp: 8 + i, inp: { [T.id + '_logs']: 1 }, out: { ashes: 4 }, icon: T.id + '_logs' });
  if (STATIONS.sawmill) A7({ id: 'sw_' + T.id + '_plank', st: 'sawmill', name: T.name + ' plank', lvl: T.lvl, xp: 40 + i * 20, hp: 6 + i, inp: { [T.id + '_logs']: 1 }, out: { elder_plank: 2 }, icon: 'elder_plank' });
  item('raw_' + T.id + '_fish', 'Raw ' + T.name.toLowerCase() + ' eel', Math.round(T.bv / 10), { cat: 'fish', kind: 'fish', tint: T.tint });
  item(T.id + '_fish', T.name + ' eel', Math.round(T.bv / 6), { cat: 'food', kind: 'cookedfish', tint: T.tint, heal: 60 + i * 25 });
  A7({ id: 'fi_' + T.id, st: 'fish', name: T.name + ' eel spot', lvl: T.lvl, xp: 520 + i * 260, hp: effort(520 + i * 260, 11 + i), out: { ['raw_' + T.id + '_fish']: 1 }, icon: 'raw_' + T.id + '_fish' });
  A7({ id: 'c_' + T.id, st: 'range', name: 'Cook ' + T.name.toLowerCase() + ' eel', lvl: T.lvl, xp: 600 + i * 300, hp: 8 + i, inp: { ['raw_' + T.id + '_fish']: 1 }, out: { [T.id + '_fish']: 1 }, icon: T.id + '_fish' });
  FOODS.push(T.id + '_fish');
  const lv = T.lvl - 20, s = 1 + i * 0.35;
  gear(T.id + '_bow', T.name + ' bow', 'weapon', [0, 0, 0], { ranged: lv }, { kind: 'longbow', tint: T.tint, trim: T.trim, wclass: 'ranged', ratk: Math.round(130 * s), rstr: Math.round(110 * s), spd: 1.0, twoHanded: true, rare: true, value: T.bv * 8 });
  gear(T.id + '_staff', T.name + ' staff', 'weapon', [0, 0, 0], { magic: lv }, { kind: 'staff', tint: T.tint, trim: T.trim, wclass: 'magic', cast: 'celestial', matk: Math.round(32 * s), mdmg: Math.round(18 * s), spd: 1.0, twoHanded: true, rare: true, value: T.bv * 8 });
  A7({ id: 'fl_' + T.id + '_bow', st: 'fletch', name: T.name + ' bow', lvl: T.lvl, xp: 500 + i * 300, hp: 12 + i * 2, inp: { [T.id + '_logs']: 4, bowstring: 2, [T.id + '_bar']: 1 }, out: { [T.id + '_bow']: 1 }, icon: T.id + '_bow' });
  A7({ id: 'cr_' + T.id + '_staff', st: 'craft', name: T.name + ' staff', lvl: T.lvl, xp: 500 + i * 300, hp: 12 + i * 2, inp: { [T.id + '_logs']: 3, [T.id + '_bar']: 2 }, out: { [T.id + '_staff']: 1 }, icon: T.id + '_staff' });
  METALS.push({ id: T.id, name: T.name, tint: T.tint, lvl: T.lvl, tier: T.tier, eq: T.lvl - 20, bv: T.bv, fxp: T.fxp });
  (SOURCES[T.id + '_ore'] ||= []).push(`Mining ${T.lvl} (needs raised level caps)`);
  (SOURCES[T.id + '_bar'] ||= []).push(`Furnace: ${T.name} ore + ${Object.entries(T.extra).map(([k, q]) => `${q} ${ITEMS[k]?.name}`).join(' + ')}`);
  ['_ore', '_bar'].forEach(s2 => { NOBUY.add(T.id + s2); });
});
FOODS.sort((a, b) => ITEMS[b].heal - ITEMS[a].heal);

/* ---------- bar counts climb steeply; top gear needs an imbuing fee ---------- */
const barMult = L => L <= 85 ? Math.pow(8, L / 85) : 8 * Math.pow(10, (L - 85) / 75);
const SMITH_KINDS = new Set([...SMITH_ITEMS.map(s => s.k), 'harpoon', 'mattock']);
(function () {
  const metalLvl = Object.fromEntries(METALS.map(m => [m.id, m.lvl]));
  for (const a of Object.values(ACTIONS)) {
    if (a.st !== 'anvil' || !a.inp || !a.out) continue;
    const metal = a.metal || Object.keys(metalLvl).find(m => a.id.startsWith('a_' + m + '_'));
    const oid = Object.keys(a.out)[0], it = ITEMS[oid];
    if (!metal || !it || !SMITH_KINDS.has(it.kind) || metalLvl[metal] == null) continue;
    const bar = Object.keys(a.inp).find(k => k.endsWith('_bar')); if (!bar) continue;
    const m = barMult(metalLvl[metal]); if (m <= 1.01) continue;
    const nb = Math.max(1, Math.round(a.inp[bar] * m)), f = nb / a.inp[bar];
    a.inp[bar] = nb; a.xp *= f; a.hp = Math.round(a.hp * f); it.value = Math.round(it.value * f);
    if (metalLvl[metal] >= 150) a.imbue = Math.round(it.value * 2);
  }
})();
canMakeOne = (orig => function (a) { return orig(a) && (!a.imbue || S.coins >= a.imbue); })(canMakeOne);
doYield = (orig => function (st, a, n, xpScale) {
  if (a.imbue) n = Math.min(n, Math.floor(S.coins / a.imbue));
  if (n <= 0) return 0;
  const d = orig(st, a, n, xpScale);
  if (a.imbue && d > 0) S.coins -= d * a.imbue;
  return d;
})(doYield);
inputsText = (orig => function (a) { const t = orig(a); return a.imbue ? `${t} + 🪙${fmt(a.imbue)} imbuing` : t; })(inputsText);
// shop: armour up to rune, at a steep price
(function () {
  ['adamant', 'rune'].forEach(m => ['dagger', 'scimitar', 'full_helm', 'kiteshield', 'platelegs', 'platebody'].forEach(k => { const id = m + '_' + k; if (ITEMS[id] && !SHOP.gear.some(g => g.id === id)) SHOP.gear.push({ id, price: 0 }); }));
  SHOP.gear.forEach(g => { if (/^(bronze|iron|steel|mithril|adamant|rune)_/.test(g.id)) g.price = Math.round(ITEMS[g.id].value * 15); });
  SHOP.gear.sort((a, b) => a.price - b.price);
})();

/* ================= FARMING & HERBLORE ================= */
// farmhands: crops scale with your overall production power so Farming keeps pace
const FARM_K = 0.35;
const farmMult = () => { const g = ['mine', 'forest', 'fish'].map(st => M.rate[st] || 0); return Math.max(1, FARM_K * g.reduce((a, b) => a + b, 0) / 3); };
harvest = (orig => function (i) {
  const p = S.plots[i]; if (!plotReady(p)) return 0;
  const c = CROP_BY_ID[p.c], fm = farmMult(), xp0 = S.xp.farming, h0 = have(c.cropItem || c.id);
  const y = orig(i); if (!y) return y;
  const extra = Math.floor(y * (fm - 1)); if (extra > 0) add(c.cropItem || c.id, extra);
  const gained = S.xp.farming - xp0; if (gained > 0 && fm > 1) S.xp.farming = Math.min(1e300, S.xp.farming + gained * (fm - 1));
  return y + Math.max(0, extra);
})(harvest);
plant = (orig => function (i, cropId, quiet) { const xp0 = S.xp.farming, r = orig(i, cropId, quiet); if (r) { const g = S.xp.farming - xp0, fm = farmMult(); if (g > 0 && fm > 1) S.xp.farming += g * (fm - 1); } return r; })(plant);
// every metal tier also grows a herb that brews a stronger elixir
const TIER_HERBS = [];
ATIERS.forEach((T, i) => {
  const id = T.id + '_herb', name = { ascended: 'Dawnleaf', exalted: 'Skyroot', divine: 'Halo moss', eternal: 'Everbloom', godforged: 'Emberthorn', starmetal: 'Starpetal', voidsteel: 'Voidcap', primordial: 'First seed' }[T.id] || T.name + ' herb';
  item(id + '_seed', name + ' seed', Math.round(T.bv / 5), { cat: 'farm', kind: 'seed', tint: T.tint });
  item(id, name, Math.round(T.bv / 4), { cat: 'farm', kind: 'herb', tint: T.tint });
  const c = { id, name, emoji: '🌿', herb: T.tint, lvl: T.lvl, time: 7200 + 600 * i, pxp: Math.round(450 * Math.pow(1.5, i + 1)), hxp: Math.round(500 * Math.pow(1.5, i + 1)), y: [2, 5], seed: Math.round(T.bv), v: Math.round(T.bv / 4), cropItem: id };
  CROPS.push(c); CROP_BY_ID[id] = c; SHOP.seeds.push({ id: id + '_seed', price: c.seed });
  const prev = i ? ATIERS[i - 1].id + '_elixir' : 'overload';
  item(T.id + '_elixir', T.name + ' elixir', Math.round(T.bv * 1.2), { cat: 'potion', kind: 'potion', tint: T.tint });
  A7({ id: 'h_' + T.id + '_elixir', st: 'herb', name: T.name + ' elixir', lvl: T.lvl, xp: Math.round(800 * Math.pow(1.4, i)), hp: 10 + i, inp: { vial_of_water: 1, [id]: 1, [prev]: 1 }, out: { [T.id + '_elixir']: 1 }, icon: T.id + '_elixir' });
  (SOURCES[id] ||= []).push(`Farming ${T.lvl} (seed from the shop)`); TIER_HERBS.push(id);
});

/* ================= PRAYER: bones beat "cash offerings" ================= */
for (const a of Object.values(ACTIONS)) if (a.st === 'altar' && /^p_/.test(a.id)) a.xp *= 4;
{ const pa = TRANS_PERKS.find(p => p.id === 'pantheon'); if (pa) pa.desc = l => `Ascension needs ${4 * l} fewer levels per skill`; }
ACAD_NAMES.prayer = 'Collection plate';
if (!ACAD_SKILLS.includes('slayer')) { ACAD_SKILLS.push('slayer'); ACAD_NAMES.slayer = 'Slayer mentor'; }
const ACAD_PRAY_XP = 0.35, ACAD_PRAY_WAGE = 3;
academyTick = function (dt) {
  const A = S.academy; if (!A || A.on === false) return;
  const tot = acadTotals(); if (!tot.wage) return;
  const due = tot.wage * dt;
  if (S.coins < due) { if (!acadPoor) { acadPoor = true; if (!OFF) toast('🎓 Your combat trainers stop: you can’t pay their wages.', 'warn', 5000); } return; }
  acadPoor = false;
  A.owed = (A.owed || 0) + due;
  if (A.owed >= 1) { const c = Math.floor(A.owed); S.coins -= c; A.owed -= c; S.stats.wages = (S.stats.wages || 0) + c; }
  let melee = 0;
  for (const sk of ACAD_SKILLS) {
    const n = acadN(sk); if (!n) continue;
    const x = n * acadBase(sk) * acadMult() * dt * (sk === 'prayer' ? ACAD_PRAY_XP : 1);
    gainXP(sk, x); if (sk !== 'prayer' && sk !== 'slayer') melee += x;
  }
  if (melee) gainXP('hitpoints', melee / 3);
};
acadTotals = function () {
  let xp = 0, wage = 0; const pm = powM();
  for (const sk of ACAD_SKILLS) { const n = acadN(sk); if (n) { xp += n * acadBase(sk) * acadMult() * (sk === 'prayer' ? ACAD_PRAY_XP : 1); wage += n * acadWage(sk) * pm * (sk === 'prayer' ? ACAD_PRAY_WAGE : 1); } }
  return { xp, wage };
};
viewAcademy = (orig => function () {
  let h = orig(); const pm = powM();
  for (const sk of ACAD_SKILLS) {
    const n = acadN(sk); if (!n) continue;
    const xph = n * acadBase(sk) * acadMult() * 3600 * (sk === 'prayer' ? ACAD_PRAY_XP : 1), wh = n * acadWage(sk) * 3600 * pm * (sk === 'prayer' ? ACAD_PRAY_WAGE : 1);
    h = h.replace(new RegExp(`(<b>${SKILLS[sk].name} \\d+ · [^<]*</b><small>)\\+[^<]*?XP/h · 🪙[^<]*?/h wages`), `$1+${fmt(xph)} XP/h · 🪙${fmt(wh)}/h wages`);
  }
  return h.replace('</p>', ' <br><span class="small">🙏 Prayer can be “trained” with cash offerings to the Collection plate: it’s pricey and slow, because the gods much prefer bones at the altar (4× XP).</span></p>');
})(viewAcademy);
VIEWS.academy = (orig => function () { return rebrand(orig()); })(viewAcademy);

/* ================= UI notes ================= */
viewAscension = (orig => function () {
  const d = depth(), q = pdepth();
  return orig().replace(/\(\+5% production each\)/g, '(diminishing bonus to production & XP)').replace('<div class="ctabs asc-tabs">', `<div class="panel small depth-note">🌌 Depth <b>${d}</b> · production ×${fmt(pw('prod'))} · XP ×${fmt(pw('xp'))} <span class="muted">(grows with every ascension and Transcendence)</span></div><div class="ctabs asc-tabs">`);
})(viewAscension);
VIEWS.ascension = (orig => function () { return rebrand(orig()); })(viewAscension);

/* ---------- boot ---------- */
(function () {
  for (const it of Object.values(ITEMS)) it.name = rebrand(it.name);
  Object.keys(ITEMS).forEach(id => { if (!(id in ITEM_ORDER)) ITEM_ORDER[id] = Object.keys(ITEM_ORDER).length; });
  for (const id of Object.keys(ITEMS)) { const it = ITEMS[id]; if (!it.hidden && !it.untradeable && it.value >= 1 && !GE_SET.has(id)) { GE_ITEMS.push(id); GE_SET.add(id); } }
  ach('depth_20', 'Deep diver', 'Reach depth 20', '🌌', () => depth() >= 20, 25);
  ach('lvl_300', 'Beyond mortal', 'Reach level 300 in any skill', '🔱', g => SKILL_ORDER.some(s => g.LV[s] >= 300), 40);
})();
function boot22() { boot21(); applyCaps(); refreshLevels(); recalc(); UI.force = true; render(); }
boot22();
