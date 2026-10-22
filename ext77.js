'use strict';
/* =========================================================
   CLICKSCAPE v9.54 — SALVAGING replaces Archaeology.
   The Salvage yard breaks down what you have too much of (outclassed gear, piles of logs, crops,
   fish, gems, bones, runes, potions) into five components. The Workshop turns components into
   gadgets that speed up your other skills for a while, and still restores artefacts for the
   museum and shrines (salvaging turns up damaged artefacts as you go).
   ========================================================= */

/* ---------- branding ---------- */
SKILLS.archaeology.name = 'Salvaging'; SKILLS.archaeology.icon = '♻️';
Object.assign(STATIONS.dig, { name: 'Salvage yard', verb: 'Salvage', worker: 'Scrapper', wicon: '🧑‍🏭', upg: "Scrapper's" });
Object.assign(STATIONS.restore, { name: 'Workshop', verb: 'Tinker', worker: 'Tinkerer', wicon: '🧑‍🔧', upg: "Tinkerer's" });

/* ---------- components ---------- */
const COMPS = [
  ['metal_scrap', 'Metal scrap', '🔩', '#9aa4b0'],
  ['fibre_bundle', 'Fibre bundle', '🧶', '#a8c060'],
  ['render_oil', 'Render oil', '🛢️', '#d8a040'],
  ['gem_dust', 'Gem dust', '✨', '#c890e8'],
  ['arcane_essence', 'Arcane essence', '🔮', '#6a8ae8'],
];
for (const [id, name, emoji, tint] of COMPS) item(id, name, 2, { cat: 'arch', kind: 'component', emoji, tint, desc: 'A salvaged component. The Workshop builds gadgets from it.' });
const COMP_IDS = COMPS.map(c => c[0]);

/* ---------- what each salvage job eats ---------- */
const SALV_KEEP = () => S.settings.salvKeep ?? 1000;
const isRune = id => /_rune$/.test(id);
const SALV = [
  { id: 'sv_scrap', name: 'Scrap old metal', lvl: 1, hp: 3, comp: 'metal_scrap', icon: 'metal_scrap', what: 'outclassed gear and tools, spare ores and bars',
    gear: true, take: it => it.cat === 'ore' || it.cat === 'bar' },
  { id: 'sv_fibre', name: 'Strip plant fibre', lvl: 5, hp: 4, comp: 'fibre_bundle', icon: 'fibre_bundle', what: 'spare logs, crops, flax and herbs',
    take: it => it.cat === 'log' || (it.cat === 'farm' && !/_seed$/.test(it.id)) || it.id === 'flax' || (it.cat === 'herb' && it.kind === 'herb') },
  { id: 'sv_oil', name: 'Render fish oil', lvl: 15, hp: 6, comp: 'render_oil', icon: 'render_oil', what: 'spare raw and burnt fish',
    take: it => it.cat === 'fish' },
  { id: 'sv_dust', name: 'Grind to dust', lvl: 25, hp: 8, comp: 'gem_dust', icon: 'gem_dust', what: 'spare gems, bones, hides, old dig-site materials',
    take: it => it.cat === 'gem' || it.cat === 'drop' || (it.cat === 'arch' && it.kind === 'material') },
  { id: 'sv_arcane', name: 'Distil arcane essence', lvl: 40, hp: 12, comp: 'arcane_essence', icon: 'arcane_essence', what: 'spare runes, potions and essence',
    take: it => it.kind === 'rune' || isRune(it.id) || it.kind === 'potion' || (/essence$/.test(it.id) && it.id !== 'arcane_essence') },
];
for (const s of SALV) {
  const a = { id: s.id, st: 'dig', name: s.name, lvl: s.lvl, xp: Math.round(s.hp * 2.5), hp: s.hp, out: { [s.comp]: 1 }, icon: s.icon, salv: s };
  ACTIONS[a.id] = a;
}
STATION_ACTIONS.dig = SALV.map(s => ACTIONS[s.id]);

// never salvaged: equipped, carried, locked, favourite, rare, untradeable, quality copies, components, your food
function salvSafe(id) {
  const it = ITEMS[id]; if (!it || !have(id)) return false;
  if (S.locked?.[id] || S.fav?.[id] || it.rare || it.untradeable || it.cosmetic || it.outfit || it.perk || (it.hidden && it.kind !== 'rune')) return false;
  if (String(id).includes('__q') || COMP_IDS.includes(id) || it.kind === 'artifact' || /^damaged_/.test(id)) return false;
  if (id === S.combat?.food || id === S.combat?.bag?.id) return false;
  if (Object.values(S.equip || {}).includes(id) || (typeof isCarried === 'function' && isCarried(id))) return false;
  return true;
}
// how much of each item the yard leaves alone. You can set any item yourself; otherwise stacks keep your
// default amount, and anything a station is working with right now keeps 10× that
const KEEP_ALL = -1;
function salvUsedBy(id) {
  const out = [];
  for (const st in (S.target || {})) { const a = ACTIONS[S.target[st]]; if (a?.inp?.[id] && STATIONS[st]) out.push(rebrand(SKILLS[STATIONS[st].skill]?.name || st)); }
  return [...new Set(out)];
}
function salvKeepFor(id) {
  const k = S.salvKeep?.[id]; if (k != null) return k === KEEP_ALL ? Infinity : k;
  if (ITEMS[id]?.slot) return 0;
  return salvUsedBy(id).length ? SALV_KEEP() * 10 : SALV_KEEP();
}
function salvKeepWhy(id) {
  const k = S.salvKeep?.[id]; if (k != null) return k === KEEP_ALL ? 'never salvaged (your setting)' : `keep ${fmt(k)} (your setting)`;
  if (ITEMS[id]?.slot) return 'outclassed: all copies go';
  const u = salvUsedBy(id); return u.length ? `keep ${fmt(SALV_KEEP() * 10)} · used by ${u.join(', ')}` : `keep ${fmt(SALV_KEEP())} (default)`;
}
// everything a job could eat that you own: [[id, have, spare]]
function salvAll(s) {
  const out = [], seen = new Set();
  if (s.gear) { try { for (const id of outclassed()) if (salvSafe(id)) { out.push(id); seen.add(id); } } catch (e) {} }
  for (const id in S.bank) { const it = ITEMS[id]; if (!it || it.slot || seen.has(id) || !s.take(it) || !salvSafe(id)) continue; out.push(id); }
  return out.map(id => [id, have(id), Math.max(0, have(id) - salvKeepFor(id))]);
}
// what a job would take, biggest spare value first: [[id, spare]]
function salvCands(s) {
  return salvAll(s).filter(r => r[2] > 0).map(r => [r[0], r[2]]).sort((x, y) => y[1] * (ITEMS[y[0]].value || 1) - x[1] * (ITEMS[x[0]].value || 1));
}
// each job processes a load worth about this many coins (grows with level)
const salvLoad = () => 20 * Math.pow(1 + (LV.archaeology || 1) / 10, 2);
const salvXp = (a, w) => a.hp * 3 * (1 + (LV.archaeology || 1) / 80) * (1 + Math.log10(1 + w)) / 2;
let SALV_LAST = {}; const SALV_CACHE = {};
function salvYield(st, a, n, xpScale = 1) {
  const s = a.salv, L = salvLoad(); let left = n, comps = 0, xp = 0; const took = {};
  const C = SALV_CACHE[s.id]; let list;
  if (C && Math.abs(GT - C.t) < 5) list = C.list; else { list = salvCands(s); SALV_CACHE[s.id] = { t: GT, list }; }
  for (const row of list) {
    const id = row[0], spare = Math.min(row[1], Math.max(0, have(id) - salvKeepFor(id)));
    if (left <= 0) break;
    const V = Math.max(1, ITEMS[id].value || 1), per = ITEMS[id].slot ? 1 : Math.max(1, Math.ceil(L / V));
    const k = Math.min(left, Math.ceil(spare / per)); if (k <= 0) continue;
    const units = Math.min(spare, k * per), w = units / k * V;
    remove(id, units); row[1] -= units; took[id] = units; left -= k;
    comps += k * Math.max(1, Math.round(2 * Math.log10(1 + w)));
    xp += k * salvXp(a, w);
  }
  // nothing spare: the yard stands idle (no components, no XP)
  const done = n - left; if (done <= 0) { SALV_LAST[a.id] = { took: {}, comps: 0, t: GT, idle: true }; return 0; }
  add(s.comp, comps); gainXP('archaeology', xp * (xpScale ?? 1));
  track('yield', st, done); track('act', a.id, done);
  SALV_LAST[a.id] = { took, comps, t: GT };
  S.lifetime.salvaged = (S.lifetime.salvaged || 0) + Object.values(took).reduce((x, y) => x + y, 0);
  // damaged artefacts turn up in the junk
  const sites = DIGSITES.filter(d => d.lvl <= (LV.archaeology || 1) && d.arts?.length);
  const k = sites.length ? rollCount(done, (1 / 15) * (M.luck || 1)) : 0;
  for (let i = 0; i < Math.min(k, 50); i++) { const d = sites[Math.min(sites.length - 1, Math.floor(Math.pow(Math.random(), 0.6) * sites.length))]; const id = 'damaged_' + d.arts[randInt(0, d.arts.length - 1)][0]; if (ITEMS[id]) { rareGet(id, 1, 'artifact'); logItem(id, 1); } }
  rollPet(st, done);
  return done;
}

/* ---------- the Workshop: restoring uses components now ---------- */
const SITE_COMP = {};
DIGSITES.forEach((d, i) => { SITE_COMP[d.mat[0]] = COMP_IDS[i % COMP_IDS.length]; });
for (const a of STATION_ACTIONS.restore || []) {
  if (!a.inp) continue;
  for (const id of Object.keys(a.inp)) if (SITE_COMP[id]) { const q = a.inp[id]; delete a.inp[id]; a.inp[SITE_COMP[id]] = (a.inp[SITE_COMP[id]] || 0) + q; }
}
if (typeof SHRINES !== 'undefined') for (const s of SHRINES) if (SITE_COMP[s.mat]) s.mat = SITE_COMP[s.mat];

/* ---------- gadgets: timed boosts built from components ---------- */
const GADGETS = [
  { g: 'gather', name: "Gatherer's harness", emoji: '🎒', lvl: 1, inp: { metal_scrap: 12, fibre_bundle: 12 }, desc: '+25% Mining, Woodcutting, Fishing, Hunter & Sailing speed', sts: ['mine', 'forest', 'fish', 'hunt', 'harbour'], mult: 1.25 },
  { g: 'hearth', name: 'Hearth bellows', emoji: '🔥', lvl: 10, inp: { render_oil: 15, fibre_bundle: 8 }, desc: '+25% Cooking, Herbalism, Firemaking, Prayer & Glyphcraft speed', sts: ['range', 'herb', 'fire', 'altar', 'runealtar'], mult: 1.25 },
  { g: 'forge', name: 'Forge regulator', emoji: '⚙️', lvl: 25, inp: { metal_scrap: 20, render_oil: 10 }, desc: '+25% Smelting, Smithing, Crafting, Fletching & Carpentry speed', sts: ['furnace', 'anvil', 'craft', 'fletch', 'sawmill', 'workbench'], mult: 1.25 },
  { g: 'war', name: 'War whetstone', emoji: '🗡️', lvl: 40, inp: { metal_scrap: 15, gem_dust: 15 }, desc: '+15% combat damage', dmg: 1.15 },
  { g: 'luck', name: 'Lucky compass', emoji: '🧭', lvl: 60, inp: { gem_dust: 20, arcane_essence: 20 }, desc: 'Rare drops 20% more likely', luck: 1.2 },
];
const GADGET_SEC = 60, GADGET_CAP = 8 * 3600;
const gadgetCost = () => 1 + Math.floor((LV.archaeology || 1) / 25);
for (const G of GADGETS) {
  item('gadget_' + G.g, G.name, 0, { emoji: G.emoji, hidden: true, untradeable: true, desc: G.desc });
  const a = { id: 'wk_' + G.g, st: 'restore', name: `${G.emoji} Build ${G.name.toLowerCase()}`, lvl: G.lvl, xp: 20 + G.lvl * 3, hp: 5 + Math.floor(G.lvl / 8), inp: { ...G.inp }, out: {}, icon: 'gadget_' + G.g, gadget: G };
  ACTIONS[a.id] = a;
}
STATION_ACTIONS.restore = [...GADGETS.map(G => ACTIONS['wk_' + G.g]), ...(STATION_ACTIONS.restore || []).filter(a => !a.gadget)];
const gadgets = () => (S.gadgets ||= {});
function syncGadgetCost() { const k = gadgetCost(); for (const G of GADGETS) { const a = ACTIONS['wk_' + G.g]; for (const id in G.inp) a.inp[id] = G.inp[id] * k; } }

doYield = (orig => function (st, a, n, xpScale) {
  if (a?.salv) { const d = salvYield(st, a, n, xpScale); if (d > 0 && typeof LASTY !== 'undefined') LASTY[st] = GT; return d; }
  if (a?.gadget) {
    const G = a.gadget, t = gadgets()[G.g] || 0; const room = Math.floor((GADGET_CAP - t) / GADGET_SEC); if (room <= 0) return 0;
    const d = orig.call(this, st, a, Math.min(n, room), xpScale); if (!(d > 0)) return d;
    gadgets()[G.g] = t + d * GADGET_SEC; if (!t) recalc(); return d;
  }
  return orig.apply(this, arguments);
})(doYield);

recalc4 = (orig => function () {
  orig(); if (!S?.gadgets) return;
  for (const G of GADGETS) {
    if (!(S.gadgets[G.g] > 0)) continue;
    if (G.sts) for (const st of G.sts) { if (M.rate[st] !== undefined) M.rate[st] *= G.mult; if (M.tap?.[st] !== undefined) M.tap[st] *= G.mult; }
    if (G.dmg) M.dmg *= G.dmg; if (G.luck) M.luck *= G.luck;
  }
})(recalc4);
let GAD_T = 0;
tickCore = (orig => function (dt) {
  orig(dt); GAD_T += dt; if (GAD_T < 5) return; const s = GAD_T; GAD_T = 0;
  const g = gadgets(); let flip = false;
  for (const G of GADGETS) if (g[G.g] > 0) { g[G.g] = Math.max(0, g[G.g] - s); if (!g[G.g]) flip = true; }
  if (flip) recalc();
})(tickCore);

/* ---------- the Salvaging page ---------- */
function salvPanel() {
  const keep = SALV_KEEP(), opts = [100, 1000, 10000, 100000];
  const g = gadgets(), act = GADGETS.filter(G => g[G.g] > 0);
  const onYard = (UI.station?.archaeology || 'dig') === 'dig';
  const tgt = ACTIONS[S.target?.dig];
  let list = '';
  if (onYard && tgt?.salv) {
    const rows = salvAll(tgt.salv).sort((x, y) => y[2] - x[2] || y[1] - x[1]), spare = rows.filter(r => r[2] > 0).length;
    const shown = UI.salvAll ? rows : rows.slice(0, 8);
    list = `<h4 class="salv-h">${esc(tgt.name)}: what happens to each pile</h4>
      ${spare ? '' : `<div class="salv-idle">⚠️ <b>Idle:</b> nothing to salvage. Every pile this job eats is at or under what you keep, so it makes nothing.</div>`}
      <div class="salv-rows">${shown.map(([id, q, sp]) => `<button class="salv-row ${sp ? 'go' : ''}" data-act="salv-item" data-id="${id}">${itemIcon(id)}<span class="sr-main"><b>${esc(ITEMS[id].name)}</b><small>${fmt(q)} owned · ${salvKeepWhy(id)}</small></span><span class="sr-out">${sp ? `♻️ ${fmt(sp)}` : '<small class="muted">kept</small>'}</span></button>`).join('') || `<small class="muted">You own nothing this job eats (${tgt.salv.what}).</small>`}</div>
      ${rows.length > 8 ? `<button class="btn small" data-act="salv-all">${UI.salvAll ? 'Show fewer' : `Show all ${rows.length}`}</button>` : ''}`;
  }
  return `<div class="panel small salv-panel"><b>♻️ Salvaging</b> <small class="muted">only ever eats the amount above what you keep. Tap any item to set its own keep amount. Locked, favourite, equipped, carried and rare items are never touched.</small>
    ${onYard ? `<div class="row-btns">Default keep: ${opts.map(o => `<button class="btn small ${o === keep ? 'on' : ''}" data-act="salv-keep" data-v="${o}">${fmt(o)}</button>`).join('')}</div><small class="muted">Items a station is working with right now keep 10× the default unless you set them.</small>` : ''}
    ${list}
    <div class="salv-comps">${COMP_IDS.map(id => `<span class="salv-chip" title="${esc(ITEMS[id].name)}">${itemIcon(id)}<small data-count="${id}">${fmt(have(id))}</small></span>`).join('')}</div>
    <div class="salv-gad">${act.length ? act.map(G => `<span class="gad-on">${G.emoji} <b>${G.name}</b> <small>${fmtTime(g[G.g])}</small></span>`).join('') : '<small class="muted">No gadgets running: build them at the Workshop.</small>'}</div></div>`;
}
let SSIG = { t: -9, v: '' };
function salvSig() { if (Math.abs(GT - SSIG.t) < 2) return SSIG.v; const tg = ACTIONS[S.target?.dig]; SSIG = { t: GT, v: tg?.salv ? salvAll(tg.salv).map(r => r[2] > 0 ? 1 : 0).join('') : '' }; return SSIG.v; }
function salvItemModal(id) {
  const cur = S.salvKeep?.[id], opts = [[0, 'Salvage all'], [100, '100'], [1000, '1,000'], [10000, '10,000'], [100000, '100,000'], [KEEP_ALL, 'Never salvage']];
  openModal(`<div class="item-modal"><h2>${itemIcon(id)} ${esc(ITEMS[id].name)}</h2><p class="small">You own <b>${fmt(have(id))}</b>. Now: ${salvKeepWhy(id)}.</p><p class="small muted">How many should the Salvage yard always leave?</p>
    <div class="row-btns wrap">${opts.map(([v, l]) => `<button class="btn ${cur === v ? 'on' : ''}" data-act="salv-set" data-id="${id}" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="row-btns"><input type="number" min="0" step="1" id="salv-num" placeholder="Other amount" style="width:9em"><button class="btn" data-act="salv-set" data-id="${id}" data-v="num">Set</button></div>
    <div class="row-btns"><button class="btn ${cur == null ? 'on' : ''}" data-act="salv-set" data-id="${id}" data-v="def">Use default</button><button class="btn" data-act="close">Done</button></div></div>`);
}
viewSkill = (orig => function () {
  let h = orig(); if (UI.skill !== 'archaeology') return h;
  h = h.replace(/(<div class="list">)/, salvPanel() + '$1');
  // each job says what it eats; each gadget what it does
  h = h.replace(/(data-act="target" data-st="dig" data-id="(sv_[a-z]+)">[\s\S]*?<span class="ar-main">[\s\S]*?<\/small>)/g, (m, all, id) => { const s = ACTIONS[id]?.salv; return s ? `${all}<span class="ar-loot">Eats ${s.what}</span>` : m; });
  h = h.replace(/(data-act="target" data-st="restore" data-id="(wk_[a-z]+)">[\s\S]*?<span class="ar-main">[\s\S]*?<\/small>)/g, (m, all, id) => { const G = ACTIONS[id]?.gadget; return G ? `${all}<span class="ar-loot">${G.desc} · +1 min per build${gadgets()[G.g] ? ` · <b class="y">${fmtTime(gadgets()[G.g])} left</b>` : ''}</span>` : m; });
  return h;
})(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);
viewSig = (orig => function () { return UI.view === 'skill' && UI.skill === 'archaeology' ? orig() + '|sv' + SALV_KEEP() + JSON.stringify(S.salvKeep || {}) + !!UI.salvAll + (S.target?.dig || '') + salvSig() + Object.values(gadgets()).map(t => t > 0 ? Math.ceil(t / 60) : 0).join() : orig(); })(viewSig);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act^="salv-"]'); if (!t) return; const a = t.dataset.act;
  if (!['salv-keep', 'salv-item', 'salv-set', 'salv-all'].includes(a)) return; e.stopImmediatePropagation();
  for (const k in SALV_CACHE) delete SALV_CACHE[k]; SSIG.t = -9;
  if (a === 'salv-keep') S.settings.salvKeep = +t.dataset.v;
  else if (a === 'salv-all') UI.salvAll = !UI.salvAll;
  else if (a === 'salv-item') return salvItemModal(t.dataset.id);
  else { const id = t.dataset.id, v = t.dataset.v; S.salvKeep ||= {};
    if (v === 'def') delete S.salvKeep[id];
    else if (v === 'num') { const n = Math.floor(+($('#salv-num')?.value)); if (!(n >= 0)) return toast('Type an amount first.', 'warn'); S.salvKeep[id] = n; }
    else S.salvKeep[id] = +v;
    salvItemModal(id); }
  UI.force = true; render();
}, true);
// the action window explains a salvage job
const _actInfo77 = actInfo;
actInfo = function (id) {
  _actInfo77(id); const a = ACTIONS[id], box = $('#modal .act-info'); if (!box || !(a?.salv || a?.gadget)) return;
  const s = a.salv, G = a.gadget;
  box.insertAdjacentHTML('beforeend', s ? `<h3>How salvaging works</h3><p class="small">Eats ${s.what}, biggest pile first, only the amount above what you keep (tap items on the Salvage yard to set each one). With nothing spare it stands idle. Each job breaks down about 🪙${fmt(salvLoad())} worth and gives ${itemIcon(s.comp)} ${ITEMS[s.comp].name}: more for pricier junk. About 1 job in 15 turns up a damaged artefact for the Workshop.</p>`
    : `<h3>Gadget</h3><p class="small">${G.desc}. Each build adds 1 minute (stacks up to 8 hours). Costs grow every 25 Salvaging levels.</p>`);
};

/* ---------- migration & boot ---------- */
function migrateSalv() {
  const t = S.target || {}; if (t.dig && !ACTIONS[t.dig]?.salv) t.dig = 'sv_scrap';
  if (t.restore && !STATION_ACTIONS.restore.some(a => a.id === t.restore)) t.restore = 'wk_gather';
}
let SALV_LV = 0;
tickCore = (orig => function (dt) { orig(dt); if ((LV.archaeology || 1) !== SALV_LV) { SALV_LV = LV.archaeology || 1; syncGadgetCost(); } })(tickCore);

const css77 = document.createElement('style');
css77.textContent = `.salv-panel .row-btns{margin:6px 0;gap:4px;align-items:center}.salv-panel .btn.on{outline:2px solid var(--gold,#e8c060)}
.salv-next,.salv-comps,.salv-gad{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:4px}
.salv-chip{display:inline-flex;align-items:center;gap:2px}.salv-chip small{font-variant-numeric:tabular-nums}
.salv-h{margin:8px 0 4px}.salv-idle{background:rgba(232,120,60,.15);border-radius:8px;padding:6px 8px;margin:4px 0}.salv-rows{display:flex;flex-direction:column;gap:4px}.salv-row{display:flex;align-items:center;gap:8px;text-align:left;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:5px 8px;color:inherit;font:inherit}.salv-row.go{border-color:rgba(120,200,120,.35)}.sr-main{flex:1;display:flex;flex-direction:column;min-width:0}.sr-main small{opacity:.75}.sr-out{font-variant-numeric:tabular-nums;white-space:nowrap}.row-btns.wrap{flex-wrap:wrap}
.gad-on{background:rgba(232,192,96,.12);border-radius:8px;padding:2px 6px}
.fish-cnt{display:inline-flex;align-items:center;gap:1px;margin-right:4px}.fish-cnt small{font-variant-numeric:tabular-nums;opacity:.85}`;
document.head.appendChild(css77);

function boot77() { boot76(); migrateSalv(); syncGadgetCost(); recalc(); UI.force = true; render(); }
boot77();
