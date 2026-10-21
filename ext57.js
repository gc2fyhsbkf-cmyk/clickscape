'use strict';
/* =========================================================
   CLICKSCAPE v9.33 — every skill gets an outfit (they drop while the skill is worked and are
   kept forever), three fun alternate costumes (Shark, Ent, Golem), bank tabs you can reorder
   and hide, and a speed pass (faster screens and faster offline catch-up)
   ========================================================= */

/* ================= SPEED PASS ================= */
// 1) rebrand: one pass over the text only (icons are skipped), same results as before
const RB_OLD = rebrand;
const TM_MAP = new Map([['📜 Clue scrolls', '🗺️ Treasure maps'], ['📜 Clue scroll', '🗺️ Treasure map'], ['Clue scrolls', 'Treasure maps'], ['Clue scroll', 'Treasure map'], ['clue scrolls', 'treasure maps'], ['clue scroll', 'treasure map'],
  ['Reward caskets', 'Treasure chests'], ['Reward casket', 'Treasure chest'], ['reward caskets', 'treasure chests'], ['reward casket', 'treasure chest'], ['📜 Treasure map', '🗺️ Treasure map'],
  ['treasure trail', 'treasure hunt'], ['Treasure trail', 'Treasure hunt'], ['clues', 'maps'], ['clue', 'map'], ['Clues', 'Maps'], ['Clue', 'Map']]);
const TM_RE = /📜 Clue scrolls|📜 Clue scroll|Clue scrolls|Clue scroll|clue scrolls|clue scroll|Reward caskets|Reward casket|reward caskets|reward casket|📜 Treasure map|treasure trail|Treasure trail|(?<=[\s>(])(?:clues|clue)(?=[\s<.,)!:;])|(?<=[\s>(\d])(?:Clues|Clue)(?=[\s<.,)!:;])/g;
const rbText = s => s.replace(RB_RE, m => RB_MAP.get(m)).replace(RBL_RE, m => RBL_MAP.get(m)).replace(RB_RE2, m => RB_MAP.get(m) || m).replace(TM_RE, m => TM_MAP.get(m));
rebrand = function (s) {
  if (typeof s !== 'string') return s;
  if (s.length < 2000 || s.indexOf('<svg') < 0) return rbText(s);
  const P = s.split(/(<svg[\s\S]*?<\/svg>)/); for (let i = 0; i < P.length; i += 2) if (P[i]) P[i] = rbText(P[i]); return P.join('');
};
// 2) pets: look up only the pets of the station being worked
let PET_BY_ST = null;
rollPet = function (st, n) {
  if (!PET_BY_ST) { PET_BY_ST = {}; for (const [pid, p] of Object.entries(PETS)) if (p.st && p.chance) (PET_BY_ST[p.st] ||= []).push(pid); }
  const L = PET_BY_ST[st]; if (!L) return;
  for (const pid of L) { if (S.pets[pid]) continue; if (rollCount(n, PETS[pid].chance * M.luck) > 0) givePet(pid); }
};
// 3) outfit counts and quest buffs are worked out once per tick instead of on every XP drop
let OCM = {}, PBM = null;
const clearMemo = () => { OCM = {}; PBM = null; };
outfitCount = (orig => function (k) { const v = OCM[k]; return v !== undefined ? v : (OCM[k] = orig(k)); })(outfitCount);
permBuffs = (orig => function () { return PBM || (PBM = orig()); })(permBuffs);
recalc = (orig => function () { clearMemo(); return orig.apply(this, arguments); })(recalc);
tickCore = (orig => function (dt) { clearMemo(); return orig(dt); })(tickCore);
add = (orig => function (id) { if (ITEMS[id]?.outfit) OCM = {}; return orig.apply(this, arguments); })(add);
remove = (orig => function (id) { if (ITEMS[id]?.outfit) OCM = {}; return orig.apply(this, arguments); })(remove);
document.addEventListener('click', clearMemo, true);

/* ================= AN OUTFIT FOR EVERY SKILL ================= */
const NEW_OUTFITS = {
  headchef: ['cooking', '#e8e4d8', 'Head chef', '#c02020'], devotee: ['prayer', '#e8d890', 'Devotee', '#ffffff'], alchemist: ['herblore', '#4aa84a', 'Alchemist', '#c8e86a'],
  artisan: ['crafting', '#b85ab8', 'Artisan', '#ffd84a'], bowyer: ['fletching', '#6a8a2a', 'Bowyer', '#c8a060'], nightshade: ['thieving', '#34344a', 'Nightshade', '#8a6ad8'],
  windrunner: ['agility', '#3ab8d8', 'Windrunner', '#ffffff'], excavator: ['archaeology', '#a8743a', 'Excavator', '#e8c070'], tracker: ['hunter', '#6a5a32', 'Tracker', '#a8c060'],
  corsair: ['sailing', '#2a4a8a', 'Corsair', '#e8c040'],
};
for (const [k, [sk, tint, name, trim]] of Object.entries(NEW_OUTFITS)) {
  if (!SKILLS[sk] || OUTFITS[k] || Object.values(OUTFITS).some(o => o[0] === sk)) continue;
  OUTFITS[k] = [sk, tint, name];
  OUTFIT_PIECES.forEach(([p, slot, kind]) => { const id = `${k}_${p}`; if (ITEMS[id]) return; gear(id, `${name} ${p}`, slot, [0, 0, 0], null, { kind, tint, trim, outfit: k, untradeable: true, value: 50000, rare: true }); ITEM_ORDER[id] = 1e6 + Object.keys(ITEM_ORDER).length; });
}
// every skill's outfit (old and new) now also drops while that skill is being worked:
// about one piece per 24 hours a station is busy (workers or you), faster with rare-drop luck
const OUT_SEC = 24 * 3600;
let GT = 0; const LASTY = {};
doYield = (orig => function (st) { const d = orig.apply(this, arguments); if (d > 0) LASTY[st] = GT; return d; })(doYield);
const outfitOf = sk => Object.keys(OUTFITS).find(k => OUTFITS[k][0] === sk && k !== 'treasure');
const dropLuck = () => Math.min(2, Math.sqrt(M.luck || 1));
for (const [k] of Object.entries(OUTFITS)) if (k !== 'treasure') OUTFIT_PIECES.forEach(([p]) => { const id = `${k}_${p}`; if (!ITEMS[id]) return; const L = (SOURCES[id] ||= []); if (!L.some(s => /while the skill is worked/.test(s))) L.push(`Rare while ${SKILLS[OUTFITS[k][0]]?.name || 'the skill'} is worked (by you or your workers) · +5% XP each, full set +10% XP & +25% speed · kept forever`); });

// outfit pieces in the Costume room are now kept through ascension, transcendence and apotheosis
const keepOutfits = fn => (orig => function (...a) {
  const old = S, kept = {}; for (const id in (S.costume || {})) if (ITEMS[id]?.outfit && S.costume[id] > 0) kept[id] = S.costume[id];
  for (const id in (S.bank || {})) if (ITEMS[id]?.outfit && have(id) > 0) kept[id] = (kept[id] || 0) + have(id);
  const r = orig.apply(this, a);
  if (S !== old) { const C = S.costume ||= {}; for (const id in kept) C[id] = Math.max(C[id] || 0, 1); OCM = {}; recalc(); }
  return r;
})(fn);
ascend = keepOutfits(ascend);
if (typeof transcend === 'function') transcend = keepOutfits(transcend);
if (typeof transcend2 === 'function') transcend2 = keepOutfits(transcend2);
if (typeof apotheosis === 'function') apotheosis = keepOutfits(apotheosis);

skillHead = (orig => function (sk) { return orig.apply(this, arguments).replace('Rare from this skill’s reward crates', 'Drops rarely while this skill is worked'); })(skillHead);
// piece fanfare: a banner rather than a toast
rollOutfitPiece = (orig => function (set) {
  OCM = {}; const before = outfitCount(set); if (before >= 4 || OFF || typeof fanBanner !== 'function') { orig(set); OCM = {}; if (OFF && outfitCount(set) > before) OFFLOG.push(`👷 ${rebrand(OUTFITS[set][2])} outfit piece! (${outfitCount(set)}/4) · kept forever`); return; }
  const tt = toast; toast = () => {}; try { orig(set); } finally { toast = tt; } OCM = {}; const after = outfitCount(set);
  if (after > before) { const id = OUTFIT_PIECES.map(([p]) => `${set}_${p}`).find(i => S.costume?.[i] > 0 || have(i)); fanBanner(itemIcon(id || `${set}_top`), `👷 ${rebrand(OUTFITS[set][2])} outfit ${after}/4`, after === 4 ? 'Full set! +30% XP & +25% speed in ' + SKILLS[OUTFITS[set][0]].name : `+${after * 5}% ${SKILLS[OUTFITS[set][0]].name} XP · kept forever`); }
})(rollOutfitPiece);

/* ================= ALTERNATE COSTUMES ================= */
// pure looks (plus wardrobe points), from the top tier of a gathering skill
const COSTUMES = {
  shark: { sk: 'fishing', st: 'fish', lvl: 70, name: 'Shark', tint: '#5a7a94', trim: '#f4f4f4', head: 'finhood', parts: ['hood', 'suit', 'leggings', 'flippers'], from: 'Fishing at spots of level 70+' },
  ent: { sk: 'woodcutting', st: 'forest', lvl: 60, name: 'Ent', tint: '#6a4a26', trim: '#5ac84a', head: 'leafcap', parts: ['leafcap', 'bark', 'roots', 'stumps'], from: 'Woodcutting trees of level 60+' },
  golem: { sk: 'mining', st: 'mine', lvl: 70, name: 'Golem', tint: '#7a7a82', trim: '#e8a040', head: 'rockhelm', parts: ['brow', 'chest', 'legs', 'feet'], from: 'Mining rocks of level 70+' },
};
const CO_SEC = 30 * 3600;
SHAPES.finhood = (t, tr) => `<path d="M6 26 Q5 12 16 11 Q27 12 26 26 Z" fill="${t}" ${K}/><path d="M13 12 Q15 1 23 3 Q19 7 19 12 Z" fill="${shade(t, -.15)}" ${K}/><path d="M9 22 L11 25 L13 22 L15 25 L17 22 L19 25 L21 22 L23 25" stroke="#fff" stroke-width="1.6" fill="none"/><circle cx="12" cy="17" r="1.6" fill="#111"/>`;
SHAPES.leafcap = (t, tr) => `<path d="M6 25 Q6 14 16 14 Q26 14 26 25 Z" fill="${t}" ${K}/><path d="M8 15 Q4 6 12 7 Q12 12 10 15 Z M14 13 Q14 2 20 4 Q19 10 17 13 Z M20 15 Q25 6 28 11 Q24 14 22 16 Z" fill="${tr || '#5ac84a'}" ${K}/>`;
SHAPES.rockhelm = (t, tr) => `<path d="M5 26 L6 15 L11 9 L18 8 L25 12 L27 20 L26 26 Z" fill="${t}" ${K}/><path d="M9 14 L14 12 M18 11 L23 15 M8 20 L13 19" stroke="${shade(t, -.35)}" stroke-width="1.4"/><circle cx="20" cy="20" r="2" fill="${tr || '#e8a040'}"/>`;
const coId = (k, i) => `${k}_costume_${i}`;
for (const [k, C] of Object.entries(COSTUMES)) {
  const kinds = [C.head, 'robe', 'robeskirt', 'boots'], slots = ['head', 'body', 'legs', 'feet'];
  C.ids = slots.map((sl, i) => { const id = coId(k, i); cosmetic(id, `${C.name} ${C.parts[i]}`, sl, kinds[i], C.tint, [0, 0, 0], { value: 2e6, trim: C.trim, untradeable: true, costumeSet: k }); ITEM_ORDER[id] = 1e6 + Object.keys(ITEM_ORDER).length; (SOURCES[id] ||= []).push(`${C.from} (very rare, a pure look plus wardrobe points)`); if (!WARD_IDS.includes(id)) WARD_IDS.push(id); return id; });
}
const coOwned = k => COSTUMES[k].ids.filter(id => (S.costume?.[id] || 0) > 0 || have(id) > 0).length;
// costume pieces go straight to the Costume room, like outfits
add = (orig => function (id, n = 1) {
  const r = orig.apply(this, arguments); const it = ITEMS[id];
  if (n > 0 && it?.costumeSet && S?.bank && have(id) > 0 && !OUTFIT_MOVE) { const C = S.costume ||= {}; const q = have(id); C[id] = (C[id] || 0) + q; OUTFIT_MOVE = true; try { remove(id, q); } finally { OUTFIT_MOVE = false; } recalc(); }
  return r;
})(add);
function giveCostume(k) {
  const C = COSTUMES[k], miss = C.ids.filter(id => !((S.costume?.[id] || 0) > 0 || have(id) > 0)); if (!miss.length) return;
  const id = miss[randInt(0, miss.length - 1)]; add(id, 1); logItem(id, 1);
  // wear it at that skill straight away unless you've picked something for that slot
  const sl = ITEMS[id].slot, L = (S.lifetime.skLook ||= {})[C.sk] ||= {}; if (!L[sl]) L[sl] = id;
  const n = coOwned(k), msg = `🎭 ${ITEMS[id].name}! ${C.name} costume ${n}/4 · your character wears it while ${SKILLS[C.sk].name.toLowerCase()}`;
  if (OFF) OFFLOG.push(msg); else if (typeof fanLegend === 'function') fanLegend({ kind: '🎭 COSTUME PIECE 🎭', icon: itemIcon(id), name: ITEMS[id].name, sub: `${C.name} costume ${n}/4 · a look for ${SKILLS[C.sk].name} (and wardrobe points, kept forever)` }); else toast(msg, 'pet', 6000);
}

/* ---------- the drop clock ---------- */
const DROP_ST = () => STATION_ORDER.filter(st => STATIONS[st]?.skill && outfitOf(STATIONS[st].skill));
let DST = null;
tickCore = (orig => function (dt) {
  orig(dt); GT += dt; DST ||= DROP_ST();
  const lk = dropLuck();
  for (const st of DST) {
    if (GT - (LASTY[st] ?? -1e9) > 20) continue; // only while the station is producing
    if (Math.random() < dt * lk / OUT_SEC) { const k = outfitOf(STATIONS[st].skill); if (outfitCount(k) < 4) rollOutfitPiece(k); }
  }
  for (const k in COSTUMES) { const C = COSTUMES[k]; if (GT - (LASTY[C.st] ?? -1e9) > 20) continue; if ((ACTIONS[S.target?.[C.st]]?.lvl || 0) < C.lvl) continue; if (Math.random() < dt * lk / CO_SEC) giveCostume(k); }
})(tickCore);

// costume heads on the side-on character
heroSVG = (orig => function () {
  const svg = orig.apply(this, arguments);
  const hid = HERO_LOOK ? HERO_LOOK('head') : lookOf('head'), h = hid && ITEMS[hid]; if (!h || !['finhood', 'leafcap', 'rockhelm'].includes(h.kind)) return svg;
  const O = '#120d08', t = h.tint, tr = h.trim;
  const deco = h.kind === 'finhood' ? `<path d="M45 46 Q42 18 60 18 Q74 18 72 30 L66 30 Q64 24 58 25 Q50 27 52 46 Z" fill="${t}" stroke="${O}" stroke-width="1.7"/><path d="M50 21 Q50 2 64 6 Q58 10 58 19 Z" fill="${dshade(t, -.2)}" stroke="${O}" stroke-width="1.5"/><path d="M64 30 L66 33 L68 30 L70 33 L72 30" stroke="${tr}" stroke-width="1.6" fill="none"/>`
    : h.kind === 'leafcap' ? `<path d="M46 30 Q47 18 59 18 Q71 18 72 28 L46 31 Z" fill="${t}" stroke="${O}" stroke-width="1.6"/><path d="M48 22 Q40 10 50 10 Q52 16 52 20 Z M56 19 Q54 4 62 6 Q62 13 60 18 Z M63 20 Q70 8 74 14 Q70 18 67 21 Z" fill="${tr}" stroke="${O}" stroke-width="1.3"/>`
    : `<path d="M45 32 L47 21 L54 16 L63 16 L71 21 L73 30 L45 33 Z" fill="${t}" stroke="${O}" stroke-width="1.7"/><path d="M52 21 L57 19 M62 19 L67 23" stroke="${dshade(t, -.35)}" stroke-width="1.4"/><circle cx="64" cy="26" r="2" fill="${tr}"/>`;
  return svg.replace(/<g class="h-arm/, deco + '<g class="h-arm');
})(heroSVG);

/* ================= BANK TABS: REORDER & HIDE ================= */
const AUTO_DEFAULT = AUTO_TABS.map(([k]) => k);
function applyTabOrder() {
  const O = S?.settings?.tabOrder; const idx = k => { const i = (O || []).indexOf(k); return i < 0 ? 100 + AUTO_DEFAULT.indexOf(k) : i; };
  AUTO_TABS.sort((a, b) => idx(a[0]) - idx(b[0]));
}
const tabHidden = () => (S.settings.tabHidden ||= {});
viewBank = (orig => function () {
  const hid = tabHidden(); if (hid[UI.bankFilter]) UI.bankFilter = 'all';
  let h = orig();
  for (const k in hid) if (hid[k]) h = h.replace(new RegExp(`<button class="chip[^"]*" data-act="bankfilter" data-id="${k}">[\\s\\S]*?</button>`), '');
  return h.replace(/(<div class="chips one-row auto-tabs">[\s\S]*?)(<\/div>)/, '$1<button class="chip tab-edit" data-act="tabedit" title="Reorder or hide tabs">⚙️</button>$2');
})(viewBank);
VIEWS.bank = (orig => function () { return rebrand(orig()); })(viewBank);
function tabEditModal() {
  const hid = tabHidden(), T = S.settings.bankTabs || [];
  const row = (k, n, i, last, kind) => `<div class="te-row ${hid[k] && kind === 'a' ? 'off' : ''}"><span>${n}</span>
    <button class="btn mini" data-act="te-move" data-kind="${kind}" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''}>▲</button><button class="btn mini" data-act="te-move" data-kind="${kind}" data-i="${i}" data-d="1" ${last ? 'disabled' : ''}>▼</button>
    ${kind === 'a' ? `<button class="btn mini" data-act="te-hide" data-k="${k}">${hid[k] ? '🚫 Hidden' : '👁️ Shown'}</button>` : ''}</div>`;
  openModal(`<div class="item-modal tabedit"><h2>🗂️ Bank tabs</h2><p class="small muted">Items always sort themselves into these tabs. Change the order or hide tabs you don't use (hidden items still show under 🏦 All).</p>
    <div class="te-list">${AUTO_TABS.map(([k, n], i) => row(k, n, i, i === AUTO_TABS.length - 1, 'a')).join('')}</div>
    ${T.length ? `<h3>Your own tabs</h3><div class="te-list">${T.map((t, i) => row('', esc(t.n), i, i === T.length - 1, 'c')).join('')}</div>` : ''}
    <div class="row-btns"><button class="btn" data-act="te-reset">Reset</button><button class="btn big" data-act="close">Done</button></div></div>`);
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
  if (a === 'tabedit') { e.stopImmediatePropagation(); tabEditModal(); return; }
  if (a === 'te-move') {
    e.stopImmediatePropagation(); const i = +t.dataset.i, j = i + +t.dataset.d;
    if (t.dataset.kind === 'a') { const L = AUTO_TABS.map(([k]) => k); if (j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; S.settings.tabOrder = L; applyTabOrder(); }
    else { const T = S.settings.bankTabs || []; if (j < 0 || j >= T.length) return; [T[i], T[j]] = [T[j], T[i]]; UI.bankTab = null; }
    tabEditModal(); UI.force = true; render(); return;
  }
  if (a === 'te-hide') { e.stopImmediatePropagation(); const H = tabHidden(); H[t.dataset.k] = !H[t.dataset.k]; if (!H[t.dataset.k]) delete H[t.dataset.k]; tabEditModal(); UI.force = true; render(); return; }
  if (a === 'te-reset') { e.stopImmediatePropagation(); delete S.settings.tabOrder; S.settings.tabHidden = {}; applyTabOrder(); tabEditModal(); UI.force = true; render(); return; }
}, true);

function boot57() {
  boot56(); applyTabOrder(); PET_BY_ST = null; DST = null;
  // anything outfit-like still sitting in the bank moves to the Costume room
  const C = S.costume ||= {}; for (const id of Object.keys(S.bank)) if (ITEMS[id]?.costumeSet && have(id) > 0) { const q = have(id); C[id] = (C[id] || 0) + q; OUTFIT_MOVE = true; try { remove(id, q); } finally { OUTFIT_MOVE = false; } }
  recalc(); UI.force = true; render();
}
boot57();
