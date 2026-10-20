'use strict';
/* =========================================================
   CLICKSCAPE v9.6 — reward caskets for clues, nav badges, tribute-safe selling,
   small tidy-ups
   ========================================================= */

/* ================= CLUES GIVE A REWARD CASKET ================= */
Object.keys(CLUE_TIERS).forEach(t => {
  const T = CLUE_TIERS[t];
  item('casket_' + t, `Reward casket (${t})`, 1, { cat: 'misc', emoji: '🧰', tint: T.tint, open: true, untradeable: true, casketTier: t });
  (SOURCES['casket_' + t] ||= []).push(`Complete a ${t} clue scroll`);
});
function rollCasket(tier) {
  const T = CLUE_TIERS[tier]; let coins = 0; const got = {};
  const rolls = randInt(T.rolls[0], T.rolls[1]);
  for (let i = 0; i < rolls; i++) {
    if (rnd() < T.rare * M.luck) { const u = CLUE_UNIQUES[tier][randInt(0, CLUE_UNIQUES[tier].length - 1)]; got[u] = (got[u] || 0) + 1; }
    else { const [id, a, b] = CLUE_COMMON[tier][randInt(0, CLUE_COMMON[tier].length - 1)]; if (id === 'coins') coins += randInt(a, b); else got[id] = (got[id] || 0) + randInt(a, b); }
  }
  if (coins) gainCoins(coins);
  for (const id in got) if (ITEMS[id]) { add(id, got[id]); logItem(id, got[id]); }
  track('clue', tier, 1);
  return Object.keys(got).some(id => CLUE_UNIQUES[tier].includes(id));
}
finishClue = function (tier) {
  S.clues.active = null; S.clues.done[tier] = (S.clues.done[tier] || 0) + 1;
  add('casket_' + tier, 1); logItem('casket_' + tier, 1);
  if (OFF) { OFFLOG.push(`📜 Completed a ${tier} clue scroll: a reward casket awaits!`); return; }
  SFX.play('clue'); closeModal();
  openModal(`<div class="item-modal whoop"><h2>📜 ${CLUE_TIERS[tier].name} treasure trail complete!</h2><div class="whoop-icon">${itemIcon('casket_' + tier)}</div>
    <p>You receive a <b class="y">Reward casket (${tier})</b>. You have completed ${fmt(S.clues.done[tier])} ${tier} clue${S.clues.done[tier] > 1 ? 's' : ''}.</p>
    <button class="btn big" data-act="open" data-id="casket_${tier}" data-q="1">Open it</button>${have('casket_' + tier) > 1 ? `<button class="btn" data-act="open" data-id="casket_${tier}" data-q="${have('casket_' + tier)}">Open all ${have('casket_' + tier)}</button>` : ''}<button class="btn" data-act="close">Save it for later</button></div>`);
  UI.force = true;
};
openItem = (orig => function (id, q = 1) {
  const t = ITEMS[id]?.casketTier; if (!t) return orig(id, q);
  q = Math.min(q, have(id)); if (q <= 0) return;
  remove(id, q); let rare = false;
  for (let k = 0; k < q; k++) rare = rollCasket(t) || rare;
  if (!OFF) SFX.play(rare ? 'rare' : 'clue');
  UI.force = true;
})(openItem);

/* ================= NAV BADGES: something waiting for you ================= */
function navAlerts() {
  const a = {};
  const relic = !freshAccount() && S.relic && RELIC_TIERS.some((n, i) => totalLevel() >= n && !S.relic.picks[i]);
  const plots = S.plots.some(p => plotReady(p)) && !fhN();
  if (S.omenOffer?.length || relic || plots) a.skills = true;
  if (S.slayer && !S.slayer.task && LV.slayer > 1) a.combat = true;
  if (UPGRADES.some(u => !has(u.id) && upgUnlocked(u) && canAffordUpg(u))) a.upgrades = true;
  const casks = Object.keys(CLUE_TIERS).some(t => have('casket_' + t)) || Object.keys(S.bank).some(id => ITEMS[id]?.clue);
  if (casks) a.bank = true;
  return a;
}
let navT = 0;
liveUpdate = (orig => function () {
  orig(); if (Date.now() - navT < 1500) return; navT = Date.now();
  const a = navAlerts();
  document.querySelectorAll('#nav [data-nav]').forEach(b => b.classList.toggle('alert', !!a[b.dataset.nav]));
})(liveUpdate);

/* ================= TRIBUTE-SAFE SELLING ================= */
// selling never dips below what the current ascension tribute still needs
const tribNeed = id => { const it = S.tribute?.items?.find(([i]) => i === id); return it ? it[1] : 0; };
sell = (orig => function (id, q) {
  const need = tribNeed(id); if (need) { const keep = Math.min(need, have(id)); q = Math.min(q, have(id) - keep); if (q <= 0) return toast(`Kept for your ascension tribute (${fmt(need)} needed).`, 'warn'); }
  return orig(id, q);
})(sell);
geSell = (orig => function (id, q) {
  const need = tribNeed(id); if (need) { q = Math.min(q, have(id) - Math.min(need, have(id))); if (q <= 0) return toast(`Kept for your ascension tribute (${fmt(need)} needed).`, 'warn'); }
  return orig(id, q);
})(geSell);
openItemModal = (orig => function (id, fromSlot) {
  orig(id, fromSlot); const need = tribNeed(id), box = $('#modal'); if (!need || !box || fromSlot) return;
  const p = box.querySelector('.item-modal p, p'); if (p) p.insertAdjacentHTML('afterend', `<p class="small y">🌀 Needed for your ascension tribute: ${fmt(need)} (selling keeps these back)</p>`);
})(openItemModal);

/* ================= TIDY-UPS ================= */
// level-up toasts show the time to the next level when a skill is moving fast
viewSkill = (orig => function () {
  const h = orig(), sk = UI.skill; if (!sk || COMBAT_SKILLS.includes(sk)) return h;
  const nxt = XP_TABLE[LV[sk] + 1]; if (!nxt || LV[sk] >= MAX_LVL[sk]) return h;
  const left = nxt - S.xp[sk];
  return h.replace('<div class="list">', `<div class="panel small muted next-lvl">⏭️ ${fmt(left)} XP to level ${LV[sk] + 1}</div><div class="list">`);
})(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);

function boot29() { boot27(); UI.force = true; render(); }
