'use strict';
/* =========================================================
   CLICKSCAPE v9.58 — choices at every reset.
   • BOONS: each Ascension offers 3 boons, pick 1. Small, stacking buffs that last for the rest of the
     Transcendence. Five boons of one family unlock that family's set bonus (and each 5 more, again).
   • EDICTS: each Transcendence offers 3 edicts, pick 1. Big, game-changing and permanent (until Apotheosis).
   ========================================================= */

/* ================= BOONS ================= */
const BOON_FAM = {
  gather: { name: 'Gathering', icon: '⛏️', sts: ['mine', 'forest', 'fish', 'hunt', 'harbour', 'dig'] },
  craft: { name: 'Crafting', icon: '🔨', sts: ['furnace', 'anvil', 'craft', 'fletch', 'herb', 'range', 'fire', 'sawmill', 'workbench', 'runealtar', 'altar', 'restore'] },
  combat: { name: 'Combat', icon: '⚔️' },
  fortune: { name: 'Fortune', icon: '🍀' },
  mind: { name: 'Mind', icon: '📚' },
  crew: { name: 'Crew', icon: '👷' },
};
// [id, family, rarity, name, icon, effects {key: amount}, text]
// keys: gat/cra = gathering/crafting speed, crew = worker speed, tap = tap power, xp, cxp = combat XP, dmg, luck, sell, sig = sigils per ascension, grow = crop speed
const BOONS = [
  ['strongback', 'gather', 'c', 'Strong back', '💪', { gat: 0.05 }, 'Gathering +5%'],
  ['keeneye', 'gather', 'r', 'Keen eye', '👁️', { gat: 0.10 }, 'Gathering +10%'],
  ['greenthumb', 'gather', 'c', 'Green thumb', '🌱', { grow: 0.06, gat: 0.02 }, 'Crops grow 6% faster, Gathering +2%'],
  ['motherlode', 'gather', 'e', 'Motherlode', '💎', { gat: 0.18, luck: 0.03 }, 'Gathering +18%, rare drops +3%'],
  ['steadyhands', 'craft', 'c', 'Steady hands', '🖐️', { cra: 0.05 }, 'Crafting stations +5%'],
  ['masterstouch', 'craft', 'r', "Master's touch", '🔨', { cra: 0.10 }, 'Crafting stations +10%'],
  ['hotforge', 'craft', 'c', 'Hot forge', '🔥', { cra: 0.04, tap: 0.04 }, 'Crafting +4%, tap power +4%'],
  ['grandmaster', 'craft', 'e', 'Grandmaster', '🏅', { cra: 0.18, xp: 0.03 }, 'Crafting +18%, all XP +3%'],
  ['whetstone', 'combat', 'c', 'Whetstone', '🗡️', { dmg: 0.05 }, 'Damage +5%'],
  ['battlehard', 'combat', 'r', 'Battle-hardened', '🛡️', { dmg: 0.08, cxp: 0.06 }, 'Damage +8%, combat XP +6%'],
  ['drillmaster', 'combat', 'c', 'Drill master', '🎯', { cxp: 0.07 }, 'Combat XP +7%'],
  ['warborn', 'combat', 'e', 'Warborn', '🐉', { dmg: 0.16, cxp: 0.10 }, 'Damage +16%, combat XP +10%'],
  ['luckycoin', 'fortune', 'c', 'Lucky coin', '🍀', { luck: 0.04 }, 'Rare drops +4%'],
  ['merchant', 'fortune', 'c', 'Merchant', '🪙', { sell: 0.06 }, 'Sell prices +6%'],
  ['sigilecho', 'fortune', 'r', 'Sigil echo', '🔆', { sig: 0.08 }, 'Sigils per ascension +8%'],
  ['treasure', 'fortune', 'e', 'Treasure sense', '🗝️', { luck: 0.10, sell: 0.08 }, 'Rare drops +10%, sell prices +8%'],
  ['studious', 'mind', 'c', 'Studious', '📖', { xp: 0.03 }, 'All XP +3%'],
  ['prodigy', 'mind', 'r', 'Prodigy', '🧠', { xp: 0.06 }, 'All XP +6%'],
  ['focus', 'mind', 'c', 'Focus', '🧘', { tap: 0.08 }, 'Tap power +8%'],
  ['enlightened', 'mind', 'e', 'Enlightened', '✨', { xp: 0.10, tap: 0.06 }, 'All XP +10%, tap power +6%'],
  ['whistle', 'crew', 'c', "Foreman's whistle", '📯', { crew: 0.05 }, 'Workers +5% speed'],
  ['unionrep', 'crew', 'r', 'Union rep', '🤝', { crew: 0.10 }, 'Workers +10% speed'],
  ['shiftbell', 'crew', 'c', 'Shift bell', '🔔', { crew: 0.03, gat: 0.02, cra: 0.02 }, 'Workers +3%, every station +2%'],
  ['guildcharter', 'crew', 'e', 'Guild charter', '📜', { crew: 0.18 }, 'Workers +18% speed'],
].map(([id, fam, rar, name, icon, fx, txt]) => ({ id, fam, rar, name, icon, fx, txt }));
const BOON_BY = Object.fromEntries(BOONS.map(b => [b.id, b]));
const RAR = { c: ['Common', '#b8b8b8', 70], r: ['Rare', '#5aa8ff', 25], e: ['Epic', '#c070ff', 5] };
const boons = () => (S.boons ||= {});
const famCount = f => Object.entries(boons()).reduce((a, [id, n]) => a + (BOON_BY[id]?.fam === f ? n : 0), 0);
const famSets = f => Math.floor(famCount(f) / 5);
const boonPow = () => edictOn('mastery') ? 1.5 : 1;
function boonTotals() {
  const T = {};
  for (const [id, n] of Object.entries(boons())) { const b = BOON_BY[id]; if (!b) continue; const set = 1 + 0.25 * famSets(b.fam); for (const k in b.fx) T[k] = (T[k] || 0) + b.fx[k] * n * set * boonPow(); }
  return T;
}
function rollBoons() {
  const n = edictOn('mastery') ? 4 : 3, out = [], pool = BOONS.slice();
  while (out.length < n && pool.length) {
    let r = Math.random() * 100; const rar = r < RAR.e[2] ? 'e' : r < RAR.e[2] + RAR.r[2] ? 'r' : 'c';
    const opts = pool.filter(b => b.rar === rar && !out.includes(b.id)); const pick = (opts.length ? opts : pool.filter(b => !out.includes(b.id)))[Math.floor(Math.random() * (opts.length || pool.length))];
    if (!pick) break; out.push(pick.id); pool.splice(pool.indexOf(pick), 1);
  }
  S.boonOffer = out; S.boonReroll = 1;
}
function pickBoon(id) {
  if (!S.boonOffer?.includes(id)) return; const b = BOON_BY[id]; const before = famSets(b.fam);
  boons()[id] = (boons()[id] || 0) + 1; S.boonOffer = null; recalc();
  if (!OFF) { toast(`${b.icon} <b>${b.name}</b>: ${b.txt}.`, 'rare', 3500); if (famSets(b.fam) > before) toast(`${BOON_FAM[b.fam].icon} <b>${BOON_FAM[b.fam].name} set ${famSets(b.fam)}</b>: your ${BOON_FAM[b.fam].name.toLowerCase()} boons are now ×${(1 + 0.25 * famSets(b.fam)).toFixed(2)} as strong!`, 'pet', 5000); }
}
// unattended (auto-ascend, or you ascend again without choosing): take the best rarity, preferring the family you've built most
function autoPickBoon() {
  if (!S.boonOffer?.length) return; const rank = { e: 3, r: 2, c: 1 };
  const id = S.boonOffer.slice().sort((a, b) => (rank[BOON_BY[b].rar] - rank[BOON_BY[a].rar]) || (famCount(BOON_BY[b].fam) - famCount(BOON_BY[a].fam)))[0];
  const was = OFF; OFF = true; try { pickBoon(id); } finally { OFF = was; }
}
recalc4 = (orig => function () {
  orig(); if (!S?.asc) return; const T = boonTotals();
  for (const st of STATION_ORDER) {
    let f = 1; if (BOON_FAM.gather.sts.includes(st)) f *= 1 + (T.gat || 0); if (BOON_FAM.craft.sts.includes(st)) f *= 1 + (T.cra || 0);
    if (M.rate[st] !== undefined) M.rate[st] *= f * (1 + (T.crew || 0)); if (M.tap?.[st] !== undefined) M.tap[st] *= f * (1 + (T.tap || 0));
  }
  M.xp *= 1 + (T.xp || 0); M.cxp *= 1 + (T.cxp || 0); M.dmg *= 1 + (T.dmg || 0); M.luck *= 1 + (T.luck || 0); M.sell *= 1 + (T.sell || 0);
  if (T.grow) M.grow /= 1 + T.grow;
})(recalc4);
sigilGain = (orig => function () { const T = boonTotals(); return Math.floor(orig() * (1 + (T.sig || 0)) * (edictOn('echo') ? 1.5 : 1)); })(sigilGain);

/* ================= EDICTS ================= */
const EDICTS = [
  { id: 'harvest', icon: '🌾', name: 'Edict of Plenty', desc: 'Every gathering station works 2× as fast', st: BOON_FAM.gather.sts, mult: 2 },
  { id: 'artisan', icon: '🏛️', name: 'Edict of the Artisan', desc: 'Every crafting station works 2× as fast', st: BOON_FAM.craft.sts, mult: 2 },
  { id: 'legion', icon: '👷', name: 'Edict of the Legion', desc: 'Workers work 2× as fast and your crew never needs meals' },
  { id: 'war', icon: '⚔️', name: 'Edict of War', desc: 'Damage ×2 and combat XP ×2' },
  { id: 'scholar', icon: '📚', name: 'Edict of the Scholar', desc: 'All XP ×1.75' },
  { id: 'gold', icon: '👑', name: 'Edict of Gold', desc: 'Sell prices ×3' },
  { id: 'fortune', icon: '🍀', name: 'Edict of Fortune', desc: 'Rare drops ×2' },
  { id: 'echo', icon: '🔆', name: 'Edict of Echoes', desc: 'Ascensions give +50% sigils' },
  { id: 'swift', icon: '🌀', name: 'Edict of the Swift', desc: 'Ascension requirement −12%' },
  { id: 'mastery', icon: '🌟', name: 'Edict of Mastery', desc: 'Ascensions offer 4 boons instead of 3, and all boons are 50% stronger' },
  { id: 'legacy', icon: '🎖️', name: 'Edict of Legacy', desc: 'Every ascension starts your skills at 30% of their cap' },
  { id: 'hands', icon: '🧤', name: 'Edict of Hands', desc: 'Tap power ×4' },
];
const EDICT_BY = Object.fromEntries(EDICTS.map(e => [e.id, e]));
const edicts = () => (S.edicts ||= []);
const edictOn = id => !!S?.edicts?.includes(id);
function rollEdicts() { const left = EDICTS.filter(e => !edicts().includes(e.id)).sort(() => Math.random() - 0.5); S.edictOffer = left.slice(0, 3).map(e => e.id); if (!S.edictOffer.length) S.edictOffer = null; }
function pickEdict(id) { if (!S.edictOffer?.includes(id)) return; edicts().push(id); S.edictOffer = null; applyCaps(); refreshLevels(); recalc(); if (!OFF) toast(`${EDICT_BY[id].icon} <b>${EDICT_BY[id].name}</b> is law: ${EDICT_BY[id].desc}.`, 'pet', 6000); }
function autoPickEdict() { if (S.edictOffer?.length) { const was = OFF; OFF = true; try { pickEdict(S.edictOffer[0]); } finally { OFF = was; } } }
recalc4 = (orig => function () {
  orig(); if (!S?.edicts?.length) return;
  for (const e of EDICTS) if (e.st && edictOn(e.id)) for (const st of e.st) { if (M.rate[st] !== undefined) M.rate[st] *= e.mult; if (M.tap?.[st] !== undefined) M.tap[st] *= e.mult; }
  if (edictOn('legion')) for (const st of STATION_ORDER) if (M.rate[st] !== undefined) M.rate[st] *= 2;
  if (edictOn('hands')) for (const st of STATION_ORDER) if (M.tap?.[st] !== undefined) M.tap[st] *= 4;
  if (edictOn('war')) { M.dmg *= 2; M.cxp *= 2; } if (edictOn('scholar')) M.xp *= 1.75; if (edictOn('gold')) M.sell *= 3; if (edictOn('fortune')) M.luck *= 2;
})(recalc4);
if (typeof mealRate === 'function') mealRate = (orig => function () { return edictOn('legion') ? 0 : orig(); })(mealRate);
ascReqCalc = (orig => function () { return Math.round(orig() * (edictOn('swift') ? 0.88 : 1)); })(ascReqCalc);

/* ================= hooks into the resets ================= */
ascend = (orig => function () {
  const old = S, n0 = S.asc?.count || 0; if (S.boonOffer?.length) autoPickBoon();
  const keepB = S.boons, keepE = S.edicts, keepEO = S.edictOffer;
  const r = orig.apply(this, arguments);
  if (S !== old && (S.asc?.count || 0) > n0) {
    S.boons = keepB || {}; S.edicts = keepE || []; S.edictOffer = keepEO || null;
    if (edictOn('legacy')) SKILL_ORDER.forEach(s => { const l = Math.max(1, Math.floor(0.3 * (MAX_LVL[s] || 99))); S.xp[s] = Math.max(S.xp[s] || 0, XP_TABLE[l] || 0); });
    rollBoons(); refreshLevels(); recalc();
    if (!OFF && !S.trans?.perks?.autoasc) setTimeout(() => toast('🌟 Choose a boon for this Transcendence: see the Ascension page.', 'rare', 5000), 1500);
  }
  return r;
})(ascend);
transcend2 = (orig => function (auto) {
  const t0 = tcount(), keepE = S.edicts; if (S.edictOffer?.length) autoPickEdict();
  const keep2 = S.edicts; orig(auto);
  if (tcount() > t0) { S.edicts = (keep2 || keepE || []).slice(); S.boons = {}; S.boonOffer = null; rollEdicts(); applyCaps(); refreshLevels(); recalc(); if (auto) autoPickEdict(); }
})(transcend2);

/* ================= UI ================= */
const rarTag = r => `<span class="rar" style="color:${RAR[r][1]}">${RAR[r][0]}</span>`;
function boonOfferPanel() {
  if (!S.boonOffer?.length) return '';
  return `<div class="panel glow boon-offer"><h3>🌟 Choose a boon <small class="muted">· lasts for the rest of this Transcendence</small></h3><div class="boon-cards">${S.boonOffer.map(id => { const b = BOON_BY[id], f = BOON_FAM[b.fam], c = famCount(b.fam);
    return `<button class="boon-card rar-${b.rar}" data-act="boon-pick" data-id="${id}"><span class="bc-icon">${b.icon}</span><b>${b.name}</b>${rarTag(b.rar)}<small>${b.txt}${boonPow() > 1 ? ' (×1.5)' : ''}</small><small class="muted">${f.icon} ${f.name} ${c}/${(famSets(b.fam) + 1) * 5} to set ${famSets(b.fam) + 1}</small></button>`; }).join('')}</div>
    ${S.boonReroll ? '<button class="btn small" data-act="boon-reroll">🎲 Reroll (1 free)</button>' : ''}</div>`;
}
function boonListPanel() {
  const own = Object.entries(boons()); if (!own.length && !S.boonOffer?.length) return '';
  const T = boonTotals(), lab = { gat: 'Gathering', cra: 'Crafting', crew: 'Workers', tap: 'Tap power', xp: 'All XP', cxp: 'Combat XP', dmg: 'Damage', luck: 'Rare drops', sell: 'Sell prices', sig: 'Sigils', grow: 'Crop speed' };
  return `<div class="panel small boon-list"><h3>🌟 Your boons <small class="muted">· reset when you Transcend</small></h3>
    <div class="fam-row">${Object.entries(BOON_FAM).map(([k, f]) => { const c = famCount(k); return `<span class="fam ${famSets(k) ? 'on' : ''}">${f.icon} ${f.name} <b>${c}</b>${famSets(k) ? ` · set ${famSets(k)} ×${(1 + 0.25 * famSets(k)).toFixed(2)}` : ` · ${5 - (c % 5)} to set`}</span>`; }).join('')}</div>
    <div class="fam-row">${own.map(([id, n]) => `<span class="chip">${BOON_BY[id]?.icon} ${BOON_BY[id]?.name} ×${n}</span>`).join('') || '<small class="muted">None yet.</small>'}</div>
    <small>${Object.entries(T).map(([k, v]) => `${lab[k] || k} <b class="y">+${Math.round(v * 100)}%</b>`).join(' · ')}</small></div>`;
}
function edictOfferPanel() {
  if (!S.edictOffer?.length) return '';
  return `<div class="panel glow edict-offer"><h3>📜 Proclaim an edict <small class="muted">· permanent through every Transcendence</small></h3><div class="boon-cards">${S.edictOffer.map(id => { const e = EDICT_BY[id];
    return `<button class="boon-card edict" data-act="edict-pick" data-id="${id}"><span class="bc-icon">${e.icon}</span><b>${e.name}</b><small>${e.desc}</small></button>`; }).join('')}</div></div>`;
}
function edictListPanel() {
  if (!edicts().length) return tcount() ? '' : `<div class="panel small muted">📜 Each Transcendence lets you proclaim an <b>edict</b>: a big, permanent, game-changing bonus (choose 1 of 3).</div>`;
  return `<div class="panel small"><h3>📜 Your edicts</h3><div class="list">${edicts().map(id => { const e = EDICT_BY[id]; return `<div class="upg got"><div class="upg-icon">${e.icon}</div><div class="upg-main"><b>${e.name}</b><small>${e.desc}</small></div></div>`; }).join('')}</div></div>`;
}
viewAscension = (orig => function () {
  let h = orig(); const offers = edictOfferPanel() + boonOfferPanel();
  h = h.replace('<div class="ctabs asc-tabs">', boonListPanel() + '<div class="ctabs asc-tabs">');
  if (!offers) return h;
  // offers go near the top: above the omen choice / milestones, whichever comes first
  const marks = ['<div class="panel glow omen-offer">', 'Ascension milestones'].map(m => h.indexOf(m)).filter(i => i >= 0);
  let at = marks.length ? Math.min(...marks) : -1; if (at >= 0 && h.slice(at, at + 5) !== '<div ') at = h.lastIndexOf('<div class="panel', at);
  return at > 0 ? h.slice(0, at) + offers + h.slice(at) : offers + h;
})(viewAscension);
VIEWS.ascension = (orig => function () { return rebrand(orig()); })(viewAscension);
viewTranscend = (orig => function () { const h = orig(); return h.replace(/(<div class="panel"><h3>✴️ The Pantheon)/, edictOfferPanel() + edictListPanel() + '$1'); })(viewTranscend);
VIEWS.transcend = (orig => function () { return rebrand(orig()); })(viewTranscend);
viewSkills = (orig => function () { const h = orig(); return edictOfferPanel() + boonOfferPanel() + h; })(viewSkills);
VIEWS.skills = (orig => function () { return rebrand(orig()); })(viewSkills);
viewSig = (orig => function () { return orig() + '|bo' + (S.boonOffer || []).join() + (S.edictOffer || []).join() + Object.keys(S.boons || {}).length + (S.edicts || []).length + (S.boonReroll || 0); })(viewSig);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="boon-pick"],[data-act="boon-reroll"],[data-act="edict-pick"]'); if (!t) return; e.stopImmediatePropagation();
  const a = t.dataset.act;
  if (a === 'boon-pick') pickBoon(t.dataset.id);
  else if (a === 'boon-reroll') { if (S.boonReroll) { rollBoons(); S.boonReroll = 0; } }
  else pickEdict(t.dataset.id);
  SFX.play?.('ach'); UI.force = true; render();
}, true);
const css80 = document.createElement('style');
css80.textContent = `.boon-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:6px 0}
.boon-card{display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center;padding:10px 8px;border-radius:10px;background:rgba(255,255,255,.05);border:2px solid #777;color:inherit;font:inherit;cursor:pointer}
.boon-card.rar-r{border-color:#5aa8ff}.boon-card.rar-e{border-color:#c070ff;box-shadow:0 0 12px rgba(192,112,255,.35)}.boon-card.edict{border-color:#e8c060;box-shadow:0 0 14px rgba(232,192,96,.35)}
.boon-card .bc-icon{font-size:28px}.boon-card small{opacity:.9}.rar{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.fam-row{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0}.fam{background:rgba(255,255,255,.05);border-radius:8px;padding:2px 7px;font-size:12px}.fam.on{background:rgba(232,192,96,.15)}`;
document.head.appendChild(css80);

function boot80() { boot79(); recalc(); UI.force = true; render(); }
