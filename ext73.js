'use strict';
/* =========================================================
   CLICKSCAPE v9.51 (part 2) — fewer, pricier upgrades, endless Guild Mastery tiers priced off your
   income, and wages that keep pace with what your stations produce
   ========================================================= */

/* ================= hourly production value (used by the sinks below) ================= */
var PROD_VALUE_H = 0, WAGE_INC_SCALE = 0, INCOME_H = 0; let INC_LAST = null;
function prodValueH() {
  let v = 0;
  for (const st of STATION_ORDER) { const a = ACTIONS[S.target?.[st]]; if (!a || !(M.rate?.[st] > 0)) continue; const per = M.rate[st] / Math.max(1, a.hp) * 3600; let g = 0; for (const id in a.out || {}) g += (ITEMS[id] ? sellPrice(id) : 0) * a.out[id]; v += g * per; }
  return v;
}
let pvT = 0;
tickCore = (orig => function (dt) {
  orig(dt); pvT += dt; if (pvT < 10) return; pvT = 0;
  PROD_VALUE_H = prodValueH();
  // coins actually earned per hour (smoothed over about an hour)
  const e = S.lifetime.earned || 0; if (INC_LAST !== null && e >= INC_LAST) { const r = (e - INC_LAST) / 10 * 3600; INCOME_H = INCOME_H ? INCOME_H * 0.9972 + r * 0.0028 : r; } INC_LAST = e;
  // wages: from your 3rd ascension the whole crew costs at least 5% of the coins you earn, spread by crew size
  const w = STATION_ORDER.reduce((a, st) => { const x = Math.max(0, Math.min(S.workers?.[st] || 0, workerCap())); return a + x * x * (STATIONS[st]?.wbase || 20); }, 0);
  WAGE_INC_SCALE = w > 0 && lifeAsc() >= 3 ? 0.05 * INCOME_H / w : 0;
})(tickCore);

/* ================= upgrades: pairs merged into one bigger, pricier upgrade ================= */
const MERGE = [
  ['golden_gloves', 'diamond_gloves', { id: 'master_gloves', name: "Master's Gloves", icon: '🧤', desc: 'All tap power ×6', cost: 6e6, req: { total: 300 }, eff: { type: 'tapall', mult: 6 } }],
  ['guild_contract', 'union_charter', { id: 'workers_charter', name: "Workers' Charter", icon: '🏛️', desc: 'All workers ×3 speed', cost: 1.2e7, req: { workersTotal: 120 }, eff: { type: 'crewall', mult: 3 } }],
  ['merchant1', 'merchant2', { id: 'merchant_seat', name: 'Merchant Seat', icon: '⚖️', desc: '+56% coins from selling', cost: 1.5e6, req: { earned: 1.5e6 }, eff: { type: 'sell', mult: 1.56 } }],
  ['wise1', 'wise2', { id: 'grand_tome', name: 'Grand Tome', icon: '📕', desc: '+32% XP in all skills', cost: 4e6, req: { total: 350 }, eff: { type: 'xp', mult: 1.32 } }],
  ['lucky_charm', 'ring_wealth', { id: 'fortune_charm', name: 'Charm of Fortune', icon: '🍀', desc: 'Rare drops, artifacts & pets 87% more likely', cost: 8e6, req: { kills: 1500 }, eff: { type: 'luck', mult: 1.875 } }],
];
for (const [a, b, n] of (false ? MERGE : [])) {
  for (const id of [a, b]) { const i = UPGRADES.findIndex(u => u.id === id); if (i >= 0) UPGRADES.splice(i, 1); if (UPGRADE_BY_ID[id]) UPGRADE_BY_ID[id] = { ...UPGRADE_BY_ID[id], eff: { type: 'none', mult: 1 } }; }
  UPGRADES.push(n); UPGRADE_BY_ID[n.id] = n;
}
// the five Guild Mastery tiers cost 3× more
for (const u of UPGRADES) if (/^guild_mastery[0-4]$/.test(u.id)) u.cost *= 2;
function convertMerged() { if (!S?.upgrades) return; for (const [a, b, n] of []) if (S.upgrades[a] || S.upgrades[b]) { delete S.upgrades[a]; delete S.upgrades[b]; S.upgrades[n.id] = true; } }

/* ================= Guild Mastery VI and beyond ================= */
// endless: each tier is +25% tap power and worker speed, and costs about 45 minutes of your coin
// income, rising 60% per tier (at least 1.2B × 4ⁿ). Re-bought each run like the others.
const gmxOwned = () => Object.keys(S.upgrades || {}).filter(id => /^guild_mastery(\d+)$/.test(id) && +id.slice(13) >= 5).length;
const ROMAN2 = n => { const R = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, r] of R) while (n >= v) { s += r; n -= v; } return s; };
let GMX = null;
function syncGMX() {
  if (!S?.upgrades) return; const k = gmxOwned(), idx = 5 + k, id = `guild_mastery${idx}`;
  const cost = Math.round(Math.max(1.2e9 * Math.pow(4, k), 0.75 * INCOME_H * Math.pow(1.6, k)));
  if (!GMX || GMX.id !== id) {
    if (GMX) { const i = UPGRADES.indexOf(GMX); if (i >= 0) UPGRADES.splice(i, 1); }
    GMX = { id, name: `Guild Mastery ${ROMAN2(idx + 1)}`, icon: '🏅', desc: '+25% tap power and worker speed everywhere (endless; price follows your income)', cost, req: { total: 1000 + 150 * k }, eff: { type: 'tapall', mult: 1.25, gmx: true } };
    UPGRADES.push(GMX); UPGRADE_BY_ID[id] = GMX;
  } else GMX.cost = cost;
  for (let i = 5; i < idx; i++) UPGRADE_BY_ID[`guild_mastery${i}`] ||= { id: `guild_mastery${i}`, name: `Guild Mastery ${ROMAN2(i + 1)}`, icon: '🏅', desc: '', cost: 0, req: {}, eff: { type: 'tapall', mult: 1.25, gmx: true } };
}
recalc4 = (orig => function () { orig(); if (!S?.upgrades) return; const k = gmxOwned(); if (k) { const f = Math.pow(1.25, k); for (const st of STATION_ORDER) if (M.rate[st] !== undefined) M.rate[st] *= f; } })(recalc4);
buyUpgrade = (orig => function (id) { const r = orig.apply(this, arguments); if (/^guild_mastery\d+$/.test(id)) { syncGMX(); UI.force = true; } return r; })(buyUpgrade);
let gmT = 0;
tickCore = (orig => function (dt) { orig(dt); gmT += dt; if (gmT >= 10) { gmT = 0; syncGMX(); } })(tickCore);
ascend = (orig => function () { const r = orig.apply(this, arguments); syncGMX(); return r; })(ascend);

function boot73() { boot72(); convertMerged(); PROD_VALUE_H = prodValueH(); syncGMX(); recalc(); UI.force = true; render(); }
