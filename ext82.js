'use strict';
/* =========================================================
   CLICKSCAPE v9.61 — drop tables make sense, and monsters grow with you.
   1) Clean-up: no crowbars/mattocks on drop tables; gathering tools and tier gear are "signature"
      drops on a few monsters each (not on every table); within any table a higher tier is always rarer.
   2) Monster tiers: every Transcendence lifts every monster a tier: tougher stats, and its metal,
      ore, log, fish, scroll, seed and coin drops climb to match your new caps (so a chicken still drops something useful at
      TD4). In a monster's window you can choose to fight any lower tier, down to its base version.
   ========================================================= */

/* ---------- tiers of things ---------- */
const MT_LV = Object.fromEntries(METALS.map(m => [m.id, m.lvl])); MT_LV.dragon = 92;
const MT_ORDER = LADDER.filter(m => MT_LV[m] != null).sort((a, b) => MT_LV[a] - MT_LV[b]);
const MT_PREFIX = MT_ORDER.slice().sort((a, b) => b.length - a.length); // voidsteel before void
// ladders of other things that climb: logs, ores, raw fish, spell scrolls and seeds (by the level that makes them)
const LADDERS = { log: {}, ore: {}, fish: {}, scroll: {}, seed: {} };
for (const a of Object.values(ACTIONS)) {
  if (!a.out || a.lvl == null) continue;
  for (const id in a.out) {
    const k = a.st === 'forest' && /logs$/.test(id) ? 'log' : a.st === 'mine' && /_ore$/.test(id) ? 'ore' : a.st === 'fish' && /^raw_/.test(id) && !a.spot ? 'fish' : a.st === 'runealtar' && /^scroll_/.test(id) ? 'scroll' : null;
    if (k && LADDERS[k][id] == null) LADDERS[k][id] = a.lvl;
  }
}
try { for (const c of CROPS) if (!c.livestock && ITEMS[c.id + '_seed'] && c.lvl != null) LADDERS.seed[c.id + '_seed'] = c.lvl; } catch (e) {}
const LADDER_ORDER = Object.fromEntries(Object.entries(LADDERS).map(([k, L]) => [k, Object.keys(L).sort((a, b) => L[a] - L[b])]));
const LOG_LV = LADDERS.log, LOG_ORDER = LADDER_ORDER.log;
function famOf(id) {
  for (const k in LADDERS) if (LADDERS[k][id] != null) return { fam: k, lv: LADDERS[k][id] };
  for (const m of MT_PREFIX) if (id.startsWith(m + '_')) return { fam: 'metal', metal: m, rest: id.slice(m.length + 1), lv: MT_LV[m] };
  return null;
}
// the same kind of item, `add` levels higher (never past what exists)
function shiftId(id, add, maxLv = Infinity) {
  if (!add) return id; const f = famOf(id); if (!f) return id; const L = Math.max(f.lv, Math.min(f.lv + add, maxLv));
  if (f.fam !== 'metal') { const Lv = LADDERS[f.fam]; let best = id; for (const l of LADDER_ORDER[f.fam]) if (Lv[l] <= L && Lv[l] >= f.lv && ITEMS[l]) best = l; return best; }
  let best = id; for (const m of MT_ORDER) { if (MT_LV[m] < f.lv || MT_LV[m] > L) continue; if (m === 'dragon' && f.metal !== 'dragon') continue; const n = m + '_' + f.rest; if (ITEMS[n]) best = n; }
  return best;
}

/* ---------- the Fourth-age crowbar: an elite clue treasure ---------- */
item('fourth_age_crowbar', '4th age crowbar', 1500000000, { cat: 'tool', kind: 'mattock', slot: 'mattock', tint: '#e8e8f0', trim: '#e8c030', mult: 14, req: { archaeology: 70 }, rare: true, untradeable: false,
  desc: 'A crowbar from an age not yet begun. The best salvaging tool short of the high tiers.' });
if (CLUE_UNIQUES?.elite && !CLUE_UNIQUES.elite.includes('fourth_age_crowbar')) CLUE_UNIQUES.elite.push('fourth_age_crowbar');
(SOURCES.fourth_age_crowbar ||= []).push('Elite clue scrolls (very rare)');
try { const pg = CLOG.find(p => p.items?.includes('third_age_pickaxe')); if (pg && !pg.items.includes('fourth_age_crowbar')) pg.items.push('fourth_age_crowbar'); if (typeof CLOG_ITEMS !== 'undefined') CLOG_ITEMS.add?.('fourth_age_crowbar'); } catch (e) {}

/* ---------- 1) clean-up of the base tables ---------- */
const NO_TOUCH = m => m.raid || m.season || m.barrows || ['echo', 'minigames', 'raids', 'event'].includes(m.area);
const champSet = new Set(); try { for (const R of REGIONS) { const c = champion(R.id); if (c) champSet.add(c.id); } } catch (e) {}
const isGather = it => it?.cat === 'tool' && ['pickaxe', 'hatchet', 'rod'].includes(it.slot);
const specialTool = (id, it) => it.untradeable || it.bonus || /third_age|fourth_age|crystal|infernal|_or$|trimmed/.test(id);
const isTierGear = (id, it) => it?.slot && !it.cosmetic && it.cat !== 'tool' && famOf(id)?.fam === 'metal';
const removed = [];
(function cleanDrops() {
  // a) crowbars (mattocks) never drop
  for (const m of MONSTERS) if (m.drops) m.drops = m.drops.filter(d => { const bad = ITEMS[d[0]]?.slot === 'mattock'; if (bad) removed.push([d[0], m]); return !bad; });
  // a2) a few crowbars come back as signature drops: Ancient & Volcanic from two monsters each, the Wyrm crowbar from one boss
  const near = (lv, boss, n) => MONSTERS.filter(m => !NO_TOUCH(m) && !!m.boss === boss && m.drops && !(m.minCombat > 126) && !m.ascReq).sort((a, b) => Math.abs(a.lvl - lv) - Math.abs(b.lvl - lv)).slice(0, n);
  for (const [id, lv, boss, n, p] of [['adamant_mattock', 90, false, 2, 1 / 250], ['rune_mattock', 125, false, 2, 1 / 300], ['dragon_mattock', 320, true, 1, 1 / 500]])
    if (ITEMS[id]) for (const m of near(lv, boss, n)) { m.drops.push([id, p, 1, 1]); (SOURCES[id] ||= []).push(`${m.name} (1/${Math.round(1 / p)})`); m._sigCrow = 1; }
  const holders = {};
  for (const m of MONSTERS) if (!NO_TOUCH(m)) for (const d of m.drops || []) { const it = ITEMS[d[0]]; if (it && (isGather(it) && !specialTool(d[0], it) || isTierGear(d[0], it))) (holders[d[0]] ||= []).push([m, d]); }
  for (const [id, list] of Object.entries(holders)) {
    const it = ITEMS[id], tool = isGather(it), lv = famOf(id).lv, target = tool ? (id.startsWith('dragon_') ? 140 : lv * 1.25 + 10) : null;
    const prio = ([m, d]) => (m.boss ? 4 : 0) + (champSet.has(m.id) ? 2 : 0);
    const keepN = tool ? 2 : 3;
    const order = list.slice().sort((a, b) => tool ? (Math.abs(a[0].lvl - target) + (a[0].boss ? 40 : 0)) - (Math.abs(b[0].lvl - target) + (b[0].boss ? 40 : 0)) : (prio(b) - prio(a)) || (b[1][1] - a[1][1]));
    const keep = []; const areas = new Set();
    for (const x of order) { if (keep.length >= keepN) break; if (areas.has(x[0].area) && order.length > keepN * 2) continue; keep.push(x); areas.add(x[0].area); }
    for (const x of order) if (keep.length < keepN && !keep.includes(x)) keep.push(x);
    for (const [m, d] of list) {
      if (keep.some(k => k[1] === d)) { if (tool) d[1] = (id.startsWith('dragon_') ? 1 / 600 : 1 / 200) * (m.boss ? 2 : 1); continue; }
      m.drops.splice(m.drops.indexOf(d), 1); removed.push([id, m]);
    }
  }
  // c) within a table, a higher tier is always rarer (at most half as likely as anything below it)
  for (const m of MONSTERS) {
    if (NO_TOUCH(m) || !m.drops) continue;
    const tiered = m.drops.filter(d => { const it = ITEMS[d[0]]; return d[1] < 1 && it && (isGather(it) || isTierGear(d[0], it)); }).sort((a, b) => famOf(a[0]).lv - famOf(b[0]).lv);
    for (let i = 0; i < tiered.length; i++) { const lv = famOf(tiered[i][0]).lv; const lower = tiered.filter(d => famOf(d[0]).lv < lv); if (lower.length) tiered[i][1] = Math.min(tiered[i][1], Math.min(...lower.map(d => d[1])) / 2); }
  }
  // d) the same item twice on one table (old rune → scroll swaps) becomes one line
  for (const m of MONSTERS) { if (!m.drops) continue; const seen = {}; m.drops = m.drops.filter(d => { const o = seen[d[0]]; if (!o) { seen[d[0]] = d; return true; } o[1] = Math.min(1, o[1] + d[1]); o[2] = Math.min(o[2], d[2]); o[3] = Math.max(o[3], d[3]); return false; }); }
  // the item window's "where it drops" lines follow
  for (const [id, m] of removed) if (SOURCES[id]) SOURCES[id] = SOURCES[id].filter(s => !s.includes(m.name));
})();
for (const m of MONSTERS) m.d0 = (m.drops || []).map(d => [...d]);
// a few late monsters were far tougher than anything you can have when they first become fightable:
// eased so each is a tough but winnable fight (about ≤10 min, not 'deadly') with the best gear you can smith then
const BAL = {"corp":0.834,"zuk":0.892,"abyssal_leviathan":0.828,"the_unmaker":0.759,"eternal_wyrm":0.531,"avatar_of_ascension":0.53,"aurelion":0.643,"jade_colossus":0.924,"sunborn_seraph":0.796,"halo_drake":0.719,"maelstrom":0.788,"nightveil_wraith":0.677,"entropy_hound":0.602,"ember_titan":0.534,"worldforge_golem":0.476,"solarch":0.758,"umbra":0.658,"primeval":0.61};
for (const [id, x] of Object.entries(BAL)) { const m = MONSTER_BY_ID[id]; if (!m) continue; m.b0 ||= { hp: m.hp, atk: m.atk, def: m.def, mh: m.mh, coins: m.coins ? [...m.coins] : null }; m.b0.hp = Math.round(m.b0.hp * x * x); m.b0.atk = Math.round(m.b0.atk * x); m.b0.def = Math.round(m.b0.def * x); m.b0.mh = Math.max(1, Math.round(m.b0.mh * x)); }

/* ---------- 2) monster tiers ---------- */
const monTier = m => Math.max(0, Math.min(tcount(), S?.monTier?.[m.id] ?? tcount()));
const tierAdd = V => capTrans(V);
var TIER_K = 0.25; // monster stat growth per 30 levels of cap
const tierFactor = (m, V) => 1 + TIER_K * (V === tcount() ? capBonus() : tierAdd(V)) / 30;
// materials climb the full cap increase. Gear and tools climb together, keeping their order, but the best
// piece on a table stays at least ~50 levels under what you can smith at that tier, so drops never
// out-class the anvil (a TD6 Greater demon tops out at Divine, while you can smith Eternal)
function tierDrops(m, V) {
  const add = tierAdd(V), maxGear = 120 + add - 50;
  const top = Math.max(0, ...m.d0.filter(d => ITEMS[d[0]]?.slot && famOf(d[0])).map(d => famOf(d[0]).lv));
  const gearAdd = Math.max(0, Math.min(add, maxGear - top));
  const out = [], seen = {};
  for (const [id, ch, a, b] of m.d0) {
    const n = id.startsWith('pet:') || NO_TOUCH(m) ? id : shiftId(id, ITEMS[id]?.slot ? gearAdd : add);
    if (seen[n]) { seen[n][1] = Math.min(1, seen[n][1] + ch); continue; }
    const row = [n, ch, a, b]; seen[n] = row; out.push(row);
  }
  return out;
}
applyBossScale = function () {
  for (const m of MONSTERS) {
    if (S?.combat?.fighting && m === curMon()) continue;
    const V = monTier(m), f = tierFactor(m, V);
    m.b0 ||= { hp: m.hp, atk: m.atk, def: m.def, mh: m.mh, coins: m.coins ? [...m.coins] : null };
    m.hp = Math.round(m.b0.hp * f * f); m.atk = Math.round(m.b0.atk * f); m.def = Math.round(m.b0.def * f); m.mh = Math.round(m.b0.mh * f);
    if (m.b0.coins) m.coins = m.b0.coins.map(c => Math.round(c * f * f));
    m.scale = f; if (m.tierV !== V) { m.tierV = V; m.drops = V ? tierDrops(m, V) : m.d0.map(d => [...d]); }
  }
};
// the monster window: which tier to fight
const tierBadge = m => m.tierV ? ` <span class="mtier">✴️${m.tierV}</span>` : '';
openMonsterInfo = (orig => function (id) {
  orig(id); const m = MONSTER_BY_ID[id], box = $('#modal .mon-info'); if (!m || !box || !tcount()) return;
  const V = monTier(m), btns = Array.from({ length: tcount() + 1 }, (_, v) => `<button class="chip ${v === V ? 'on' : ''}" data-act="mon-tier" data-id="${id}" data-v="${v}">${v ? `✴️ Tier ${v}` : 'Base'}</button>`).join('');
  box.querySelector('h2')?.insertAdjacentHTML('beforeend', tierBadge(m));
  box.querySelector('.mi-head')?.insertAdjacentHTML('afterend', `<div class="mon-tiers"><small class="muted">Monster tier: each Transcendence lifts monsters a tier (tougher, better metal, ore, log, fish, scroll, seed & coin drops). Pick a lower tier to fight an easier version.</small><div class="chips">${btns}</div></div>`);
})(openMonsterInfo);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="mon-tier"]'); if (!t) return; e.stopImmediatePropagation();
  const id = t.dataset.id, v = +t.dataset.v; S.monTier ||= {};
  if (S.combat.fighting && S.combat.mon === id) { try { retreat(); } catch (er) {} }
  if (v === tcount()) delete S.monTier[id]; else S.monTier[id] = v;
  applyBossScale(); recalc(); closeModal(); openMonsterInfo(id); UI.force = true; render();
}, true);
viewCombat = (orig => function () {
  let h = orig(); if (!tcount()) return h;
  return h.replace(/(data-act="mon" data-id="([a-z0-9_]+)">[\s\S]*?level-\d+)/g, (m0, all, id) => { const m = MONSTER_BY_ID[id]; return m?.tierV ? `${all}${tierBadge(m)}` : m0; });
})(viewCombat);
VIEWS.combat = (orig => function () { return rebrand(orig()); })(viewCombat);
// the monster tier choices survive ascending (they reset when you Transcend, since tiers change)
ascend = (orig => function () { const mt = S.monTier; const r = orig.apply(this, arguments); if (mt && !S.monTier) S.monTier = mt; applyBossScale(); return r; })(ascend);
transcend2 = (orig => function (auto) { orig(auto); S.monTier = {}; applyBossScale(); })(transcend2);

const css82 = document.createElement('style');
css82.textContent = `.mtier{color:#c8a0ff;font-size:.8em;font-weight:700}.mon-tiers{margin:6px 0}.mon-tiers .chips{margin-top:4px}`;
document.head.appendChild(css82);

function boot82() { boot81(); applyBossScale(); recalc(); UI.force = true; render(); }
boot82();
