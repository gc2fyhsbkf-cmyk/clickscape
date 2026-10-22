'use strict';
/* =========================================================
   CLICKSCAPE v9.66
   • Signature drops are tier-forged: a monster's special drops (Wyrm gear, unique weapons, the Wyrm
     crowbar…) keep their name at higher monster tiers and gain that tier's stats (e.g. "Wyrm crowbar ✴️2")
   • No more ascension / transcendence starter kits: carry gear forward with essence perks or start bare
   • AC9 unlocks a second free boon reroll; AC10 is the Transcendence milestone
   • Herbs drop from monsters, climb with monster tiers, and the Salvage yard can shred seeds & crops into herbs
   • Monster lists show a tiered monster's real level ("level-95 → 209 ✴️2")
   • Loot / level pop-ups merge repeats: "Uncut diamond ×55"
   ========================================================= */

/* ================= tier-forged signature items ================= */
const isSig = id => { const it = ITEMS[id]; if (!it?.slot || it.cosmetic) return false; return DROP_ONLY.has(id) || famOf(id)?.metal === 'dragon'; };
// how a stat grows with level, read from the smithed ladders
const CURVE = {};
function curveOf(kind) {
  if (CURVE[kind]) return CURVE[kind];
  const pts = [];
  for (const m of MT_ORDER) { if (m === 'dragon') continue; const it = ITEMS[`${m}_${kind[0]}`]; const v = it?.[kind[1]]; if (v > 0) pts.push([MT_LV[m], v]); }
  return (CURVE[kind] = pts);
}
function curveAt(pts, lv) { if (!pts.length) return 1; if (lv <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (lv <= pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return va + (vb - va) * (lv - a) / (b - a); } const [a, va] = pts[pts.length - 2] || pts[0], [b, vb] = pts[pts.length - 1]; return vb * Math.pow(vb / Math.max(1e-9, va), (lv - b) / Math.max(1, b - a)); }
const sigBaseLv = it => famOf(it.id)?.lv ?? Math.max(1, ...Object.values(it.req || {}).filter(v => typeof v === 'number'));
function tierItem(id, V, add) {
  if (!V || !add) return id;
  const nid = `${id}__t${V}`; if (ITEMS[nid]) return nid;
  const b = ITEMS[id]; if (!b) return id;
  const L = sigBaseLv(b), kind = b.cat === 'tool' ? [b.slot === 'rod' ? 'harpoon' : b.slot === 'mattock' ? 'mattock' : b.slot, 'mult'] : b.slot === 'weapon' ? ['scimitar', 'atk'] : ['platebody', 'def'];
  const pts = curveOf(kind), f = Math.max(1, curveAt(pts, L + add) / Math.max(1e-9, curveAt(pts, L)));
  const it = JSON.parse(JSON.stringify(b)); it.id = nid; it.name = `${b.name} ✴️${V}`; it.tierOf = id; it.tierV = V;
  for (const k of ['atk', 'str', 'def', 'ratk', 'rstr', 'matk', 'mdmg', 'mult']) if (typeof it[k] === 'number' && it[k] > 0) it[k] = +(it[k] * f).toFixed(k === 'mult' ? 2 : 0);
  if (it.req) for (const k in it.req) if (typeof it.req[k] === 'number') it.req[k] = Math.min(1999, it.req[k] + add);
  it.value = Math.round((b.value || 1) * f * f); it.desc = `${b.desc ? b.desc + ' ' : ''}Tier-forged ✴️${V}: stats ×${f.toFixed(2)}.`;
  ITEMS[nid] = it; DROP_ONLY.add(nid);
  return nid;
}
const tierBase = id => { const m = /^(.*)__t(\d+)(__q\d)?$/.exec(id); return m ? [m[1], +m[2]] : null; };
// rebuild tiered items in a save before it loads (so they aren't thrown away as unknown)
function preTier(txt) { if (!txt) return; const re = /"([a-z0-9_]+?)__t(\d+)/g; let m; while ((m = re.exec(txt))) if (ITEMS[m[1]]) { const V = +m[2]; tierItem(m[1], V, tierAdd(V)); } }
load = (orig => function () { try { preTier(localStorage.getItem(SAVE_KEY)); } catch (e) {} return orig.apply(this, arguments); })(load);
// monster tables: signature pieces become tier-forged instead of swapping to a plain metal
tierDrops = (orig => function (m, V) {
  if (!V || NO_TOUCH(m)) return orig(m, V);
  const add = tierAdd(V), top = Math.max(0, ...m.d0.filter(d => ITEMS[d[0]]?.slot && famOf(d[0])).map(d => famOf(d[0]).lv)), gearAdd = Math.max(0, Math.min(add, gearCeil(m, add) - top));
  if (!gearAdd || !m.d0.some(d => isSig(d[0]))) return orig(m, V);
  const d0 = m.d0; m.d0 = d0.map(d => isSig(d[0]) ? [tierItem(d[0], V, gearAdd), d[1], d[2], d[3]] : d);
  try { return orig(m, V); } finally { m.d0 = d0; }
})(tierDrops);

/* ================= no starter kits on ascending / transcending ================= */
giveKit = function () { S.kitGear = []; return { items: {}, coins: 0 }; };

/* ================= AC9 / AC10 on the unlock ladder ================= */
RUN_UNLOCKS.push([9, 'reroll2', '🎲 A second free boon reroll every ascension'], [10, 'tdmile', '✴️ Transcendence: reset everything for an edict and higher level caps']);
rollBoons = (orig => function () { orig(); if (runOpen('reroll2')) S.boonReroll = 2; })(rollBoons);

/* ================= herbs ================= */
LADDERS.herb = {};
try { for (const c of CROPS) if (c.herb && !c.livestock) { const id = c.cropItem || c.id; if (ITEMS[id] && c.lvl != null) LADDERS.herb[id] = c.lvl; } } catch (e) {}
LADDER_ORDER.herb = Object.keys(LADDERS.herb).sort((a, b) => LADDERS.herb[a] - LADDERS.herb[b]);
const herbFor = lv => { let best = null; for (const id of LADDER_ORDER.herb) if (LADDERS.herb[id] <= lv) best = id; return best || LADDER_ORDER.herb[0]; };
(function herbDrops() {
  for (const m of MONSTERS) {
    if (NO_TOUCH(m) || !m.d0?.length || m.lvl < 5) continue;
    if (m.d0.some(d => LADDERS.herb[d[0]] != null)) continue;
    const id = herbFor(Math.max(1, m.lvl * 0.6)); if (!id) continue;
    m.d0.push([id, m.boss ? 1 / 6 : 1 / 14, m.boss ? 2 : 1, m.boss ? 4 : 2]); (SOURCES[id] ||= []).length < 12 && SOURCES[id].push(`${m.name} (1/${m.boss ? 6 : 14})`);
    m.tierV = -1;
  }
})();
// Salvage yard: shred seeds & crops into herbs (herbs themselves are no longer shredded for fibre)
SALV.find(s => s.id === 'sv_fibre').take = it => it.cat === 'log' || it.id === 'flax';
SALV.find(s => s.id === 'sv_fibre').what = 'spare logs and flax';
const plantJob = { id: 'sv_plant', name: 'Shred plant matter', lvl: 10, hp: 5, comp: herbFor(1), icon: herbFor(1), what: 'spare seeds and crops you grew or looted (never herbs or shop seeds)',
  take: it => (/_seed$/.test(it.id) || it.kind === 'seed' || it.cat === 'farm') && LADDERS.herb[it.id] == null && !SHOPPED.has(it.id), // shop seeds can't be turned into herbs
  herbOut: n => { // weighted toward the best herbs your Farming level knows
    const L = LADDER_ORDER.herb.filter(id => LADDERS.herb[id] <= (LV.farming || 1)); const pool = L.length ? L : LADDER_ORDER.herb.slice(0, 1);
    const w = pool.map(id => 1 + LADDERS.herb[id]), tw = w.reduce((a, b) => a + b, 0), got = {};
    n = Math.max(1, Math.round(n / 3)); const draws = Math.min(n, 300), per = n / draws;
    for (let i = 0; i < draws; i++) { let r = Math.random() * tw, k = 0; while ((r -= w[k]) > 0 && k < pool.length - 1) k++; got[pool[k]] = (got[pool[k]] || 0) + per; }
    for (const id in got) add(id, Math.max(1, Math.round(got[id])));
  } };
SALV.push(plantJob);
ACTIONS.sv_plant = { id: 'sv_plant', st: 'dig', name: plantJob.name, lvl: plantJob.lvl, xp: 12, hp: plantJob.hp, out: { [plantJob.comp]: 1 }, icon: plantJob.icon, salv: plantJob };
STATION_ACTIONS.dig.splice(2, 0, ACTIONS.sv_plant);

/* ================= tiered monster levels ================= */
const effLvl = m => Math.round(m.lvl * (m.scale || 1));
viewCombat = (orig => function () {
  let h = orig(); if (!tcount()) return h;
  return h.replace(/(data-act="mon" data-id="([a-z0-9_]+)">[\s\S]*?)level-(\d+)( <span class="mtier">✴️\d+<\/span>)?/g, (m0, pre, id, lv, badge) => { const m = MONSTER_BY_ID[id]; return m?.tierV ? `${pre}level-${lv} → <b>${effLvl(m)}</b> <span class="mtier">✴️${m.tierV}</span>` : m0; });
})(viewCombat);
VIEWS.combat = (orig => function () { return rebrand(orig()); })(viewCombat);
openMonsterInfo = (orig => function (id) {
  orig(id); const m = MONSTER_BY_ID[id]; if (!m?.tierV) return; const p = document.querySelector('#modal .mon-info .mi-head p');
  if (p) p.innerHTML = p.innerHTML.replace(/Level (\d+)/, (x, lv) => `Level ${lv} → <b>${effLvl(m)}</b> (✴️ tier ${m.tierV})`);
})(openMonsterInfo);

/* ================= merged pop-ups ================= */
flushFeed = function () {
  feedFlushT = null;
  for (const cls of ['lvlup', 'rare']) {
    const b = FEED_BUF[cls]; if (!b.length) continue; FEED_BUF[cls] = [];
    // group identical messages, adding up "N × item" amounts
    const G = new Map();
    for (const raw of b) {
      const s = String(raw), q = +(/<b>([\d,]+) × /.exec(s)?.[1] || '1').replace(/,/g, ''), key = s.replace(/<b>[\d,]+ × /, '<b>');
      const g = G.get(key) || { html: key, n: 0, q: 0, last: s }; g.n++; g.q += q; g.last = s; G.set(key, g);
    }
    const groups = [...G.values()].sort((a, c) => c.q - a.q);
    const show = g => cls === 'lvlup' ? g.last : (g.q > 1 ? g.html.replace(/<\/b>/, ` ×${fmt(g.q)}</b>`) : g.html);
    const head = show(groups[0]);
    const rest = groups.slice(1, 4).map(g => { const nm = /<b>([^<]+)<\/b>/.exec(g.html)?.[1] || ''; return nm ? `${nm}${g.q > 1 ? ' ×' + fmt(g.q) : ''}` : ''; }).filter(Boolean);
    const more = groups.length - 1 - rest.length;
    toastRaw(rest.length ? `${head} <small class="muted">· ${rest.join(' · ')}${more > 0 ? ` +${more} more` : ''}</small>` : head, cls, groups.length > 1 || groups[0].n > 1 ? 4500 : 3500);
  }
};

function boot85() { boot84(); for (const m of MONSTERS) m.tierV = -1; applyBossScale(); UI.force = true; render(); }
boot85();
