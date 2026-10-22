'use strict';
/* =========================================================
   CLICKSCAPE v9.10 — the Journey (a guided path through every system),
   pet levels, clue milestones
   ========================================================= */

/* ================= THE JOURNEY ================= */
// after the first tutorial, a few objectives at a time walk new players through each system
const JOURNEY = [
  ['w10', '👷 Hire 10 workers at one station', 'Workers keep a station running on its own, even while you are away.', () => Object.values(S.workers).some(n => n >= 10)],
  ['tl250', '📈 Reach total level 250', 'Every skill counts toward your total level, which is what ascending needs.', () => totalLevel() >= 250],
  ['farm', '🌱 Harvest a crop', 'Plant seeds in your patches on the Farming page; herbs feed Herbalism.', () => (S.lifetime.harvests || 0) >= 1 || LV.farming >= 5],
  ['asc1', '🌀 Ascend for the first time', 'Reach the total level target and pay the tribute on the Ascension page. You restart stronger, with sigils.', () => lifeAsc() >= 1],
  ['perk', '✨ Buy an essence perk', 'Ascending gives essence: spend it on permanent perks in the Ascension page’s Perks tab.', () => Object.values(S.asc.perks || {}).some(l => l > 0), () => lifeAsc() >= 1],
  ['omen', '🔮 Run with an omen', 'After ascending you can pick an omen: it bends the run and gives bonus sigils.', () => !!S.omen, () => lifeAsc() >= 1],
  ['ge', '📈 Sell something on the Trading Post', 'Prices drift every 10 minutes: sell when an item trades above the shop price.', () => (S.lifetime.geProfit || 0) > 0 || (S.lifetime.geSold || 0) > 0, () => lifeAsc() >= 1],
  ['acad', '🎓 Hire a combat trainer', 'The Combat academy trains combat skills in the background for a wage.', () => Object.values(S.academy?.t || {}).some(n => n > 0), () => lifeAsc() >= 1],
  ['land', '🌾 Buy a farmland', 'Farmlands grow crops non-stop with hired hands: the easy way to get lots of herbs.', () => (S.farmlands || []).length > 0, () => lifeAsc() >= 1],
  ['exp', '🧭 Send an expedition', 'Expeditions (Menu) bring back loot for your tier after a real-time trip.', () => (S.lifetime.exped || 0) > 0 || (S.exped || []).some(Boolean), () => lifeAsc() >= 1],
  ['shrine', '⚙️ Build a contraption', 'Salvaged components build permanent contraptions at the Workshop.', () => Object.keys(S.museum || {}).length > 0, () => LV.archaeology >= 10],
  ['asc3', '🌀 Ascend 3 times', 'Each ascension raises your level caps and gives more sigils.', () => lifeAsc() >= 3, () => lifeAsc() >= 1],
  ['chal', '🏁 Complete a challenge', 'Pick a challenge on the Run tab for your next ascension: finish it for a permanent reward.', () => Object.values(S.lifetime.chal || {}).some(n => n > 0), () => lifeAsc() >= 2],
  ['set', '🛡️ Wear a full metal set', 'Helm, body, legs and shield of one metal give a set bonus.', () => !!M.setBonus, () => lifeAsc() >= 1],
  ['td', '✴️ Discover what lies beyond', 'Gather enough sigils and a deeper reset reveals itself…', () => tcount() >= 1, () => transRevealed()],
];
const jReward = () => Math.round(2000 * Math.pow(3, Math.min(10, lifeAsc())));
function journeyPanel() {
  const J = S.lifetime.journey ||= {};
  if (!S.lifetime.tut?.done && !lifeAsc() && !tcount()) return ''; // the first tutorial comes first
  JOURNEY.forEach(([id, n, , test]) => { if (!J[id] && test()) { J[id] = 1; const r = jReward(); gainCoins(r); if (!OFF) toast(`🧭 Journey: ${n} · +🪙${fmt(r)}`, 'pet', 6000); } });
  const open = JOURNEY.filter(([id, , , , when]) => !J[id] && (!when || when())).slice(0, 3);
  if (!open.length || S.settings?.hideJourney) return '';
  const done = JOURNEY.filter(([id]) => J[id]).length;
  return `<div class="panel journey"><div class="row-between"><h3>🧭 Your journey <small class="muted">${done}/${JOURNEY.length}</small></h3><button class="btn small" data-act="j-hide">Hide</button></div>
    ${open.map(([, n, hint]) => `<div class="trib"><b>${n}</b><br><small class="muted">${hint}</small></div>`).join('')}<small class="muted">Each step pays 🪙${fmt(jReward())}.</small></div>`;
}
viewSkills = (orig => function () { const h = orig(); return journeyPanel() + h; })(viewSkills);
VIEWS.skills = (orig => function () { return rebrand(orig()); })(viewSkills);
harvest = (orig => function (i) { const y = orig(i); if (y) S.lifetime.harvests = (S.lifetime.harvests || 0) + 1; return y; })(harvest);
geSell = (orig => function (id, q) { const c0 = S.coins; const r = orig(id, q); if (S.coins > c0) S.lifetime.geSold = (S.lifetime.geSold || 0) + 1; return r; })(geSell);
viewSettings = (orig => function () { return orig().replace('<div class="panel"><h3>💾 Save</h3>', `<div class="panel row-between"><div><b>🧭 Journey guide</b><br><small class="muted">Step-by-step objectives on the Skills page</small></div><button class="btn" data-act="j-toggle">${S.settings?.hideJourney ? 'Show' : 'Hide'}</button></div><div class="panel"><h3>💾 Save</h3>`); })(viewSettings);
VIEWS.settings = (orig => function () { return rebrand(orig()); })(viewSettings);

/* ================= PET LEVELS ================= */
// pets grow with you: +1 level per hour together (faster while their station is busy), up to 10
const petLvl = p => Math.min(10, Math.floor(Math.sqrt((S.petxp?.[p] || 0) / 3600)));
let petT = 0;
tickCore = (orig => function (dt) {
  orig(dt); petT += dt; if (petT < 10) return; const d = petT; petT = 0;
  const X = S.petxp ||= {};
  for (const p in S.pets) { const st = PETS[p]?.st, busy = st && (M.rate?.[st] > 0 || st === 'combat' && S.combat?.fighting); const before = petLvl(p); X[p] = (X[p] || 0) + d * (busy ? 3 : 1) * 60; const after = petLvl(p); if (after > before && !OFF) toast(`${PETS[p].icon} ${PETS[p].name} reached level ${after}!`, 'pet', 5000); }
})(tickCore);
recalc4 = (orig => function () {
  orig(); if (!S?.pets) return;
  for (const p in S.pets) { const l = petLvl(p), st = PETS[p]?.st; if (!l) continue; const k = 1 + 0.015 * l; if (st && M.rate[st] !== undefined) { M.rate[st] *= k; M.tap[st] *= k; } else if (st === 'combat') M.dmg *= 1 + 0.003 * l; }
})(recalc4);
viewPets = (orig => function () {
  return orig().replace(/<div class="pet got"><span>([^<]*)<\/span><small>([^<]*)<\/small>/g, (m, ic, name) => { const p = Object.keys(S.pets).find(k => PETS[k]?.name === name); return p ? `${m}<small class="y">Lv ${petLvl(p)}/10</small>` : m; })
    .replace('<div class="panel', '<div class="panel small muted">🐾 Pets level up while they\'re with you (3× faster when their station is busy). Each level adds +1.5% to their station, up to +25% total at level 10.</div><div class="panel');
})(viewPets);
VIEWS.pets = (orig => function () { return rebrand(orig()); })(viewPets);

/* ================= CLUE MILESTONES ================= */
const CLUE_MS = [10, 50, 100, 250, 500];
const clueMsReached = () => Object.keys(CLUE_TIERS).reduce((a, t) => a + CLUE_MS.filter(n => (S.clues.done[t] || 0) >= n).length, 0);
recalc4 = (orig => function () { orig(); if (S?.clues) M.luck *= 1 + 0.02 * clueMsReached(); })(recalc4);
finishClue = (orig => function (tier) {
  const before = S.clues.done[tier] || 0; orig(tier); const after = S.clues.done[tier] || 0;
  const hit = CLUE_MS.find(n => before < n && after >= n);
  if (hit) { add('casket_' + tier, 2); add('xp_lamp', 1); recalc(); if (!OFF) setTimeout(() => toast(`📜 ${fmt(hit)} ${tier} clues! +2 reward caskets, an XP lamp and +2% rare drops forever.`, 'pet', 8000), 600); }
})(finishClue);
viewClue = (orig => function () {
  const rows = Object.keys(CLUE_TIERS).map(t => { const d = S.clues.done[t] || 0, nx = CLUE_MS.find(n => d < n); return `<div class="trib ${!nx ? 'ok' : ''}">${CLUE_TIERS[t].name}: <b>${fmt(d)}</b> <small class="muted">${nx ? `next milestone at ${nx}` : 'all milestones done'}</small></div>`; }).join('');
  return orig() + `<div class="panel"><h3>🏅 Clue milestones <small class="muted">· +2% rare drops each (${clueMsReached()} reached)</small></h3>${rows}</div>`;
})(viewClue);
VIEWS.clue = (orig => function () { return rebrand(orig()); })(viewClue);

/* ---------- clicks & boot ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
  if (a !== 'j-hide' && a !== 'j-toggle') return;
  e.stopImmediatePropagation(); S.settings ||= {}; S.settings.hideJourney = a === 'j-hide' ? true : !S.settings.hideJourney;
  if (a === 'j-hide') toast('🧭 Journey hidden. Turn it back on in Settings.');
  UI.force = true; render();
}, true);
viewSig = (orig => function () { return UI.view === 'skills' ? orig() + JSON.stringify(S.lifetime.journey || {}) : orig(); })(viewSig);
function boot34() { boot33(); UI.force = true; render(); }
