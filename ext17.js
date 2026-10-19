'use strict';
/* =========================================================
   CLICKSCAPE v7.2 — early & mid run pacing
   Past-life momentum, auto-supply, starter kits, beginner boost
   ========================================================= */

/* ---------- 1) Past-life momentum: fast catch-up to your best-ever level ---------- */
function peakLvl(sk) { return S.lifetime.peak?.[sk] || 0; }
ASC_PERKS.push({ id: 'memory', name: 'Past-life memory', icon: '⚡', max: 5, cost: l => 6 * (l + 1) ** 2, desc: l => l ? `Skills below half your best-ever level earn ×${fmtD(1 + 0.2 * l)} XP` : 'Re-level faster towards your best-ever levels' });
function momentum(sk) { const l = perk('memory'), p = peakLvl(sk); if (!l || !p || LV[sk] >= p * 0.5) return 1; return 1 + 0.2 * l; }
function trackPeaks() { const P = S.lifetime.peak ||= {}; for (const s of SKILL_ORDER) if ((LV[s] || 0) > (P[s] || 0)) P[s] = LV[s]; }
skillXpMult = (orig => function (sk) { return orig(sk) * momentum(sk); })(skillXpMult);
gainXP = (orig => function (sk, amt) { const r = orig(sk, amt); const P = S.lifetime.peak ||= {}; if (LV[sk] > (P[sk] || 0)) P[sk] = LV[sk]; return r; })(gainXP);
skillHead = (orig => function (sk) {
  const h = orig(sk), m = momentum(sk);
  return m > 1 ? h + `<div class="momentum">⚡ Past-life memory ×${fmtD(m)} XP <small>(until level ${Math.ceil(peakLvl(sk) * 0.5)} · best ever ${peakLvl(sk)})</small></div>` : h;
})(skillHead);

/* ---------- 2) Auto-supply: buy missing inputs from the Trading Post ---------- */
const autoOn = st => !!S.autoSupply?.[st];
function autoSupplyTick() {
  if (!S.autoSupply || activeChal() === 'ironman') return;
  for (const st in S.autoSupply) {
    if (!S.autoSupply[st]) continue;
    const a = ACTIONS[S.target[st]]; if (!a?.inp) continue;
    const rate = (M.rate[st] || 0) / Math.max(1, a.hp); // actions per second (approx)
    const want = Math.max(10, Math.ceil(rate * 60)); // keep ~1 minute of inputs
    for (const [id, q] of Object.entries(a.inp)) {
      const need = q * want - have(id); if (need <= 0 || !GE_SET.has(id)) continue;
      const price = geBuyPrice(id), budget = Math.floor(S.coins * 0.25 / price), n = Math.min(need, budget);
      if (n > 0) { S.coins -= n * price; add(id, n); (S.bought ||= {})[id] = (S.bought[id] || 0) + n; S.lifetime.autoSpent = (S.lifetime.autoSpent || 0) + n * price; }
    }
  }
}
let asT = 0;
tickCore = (orig => function (dt) { orig(dt); asT += dt; if (asT >= 5) { asT = 0; autoSupplyTick(); } })(tickCore);
viewSkill = (orig => function () {
  const h = orig(), st = UI.curStation, a = st && ACTIONS[S.target[st]];
  if (!st || !(STATION_ACTIONS[st] || []).some(x => x.inp)) return h;
  const on = autoOn(st), iron = activeChal() === 'ironman';
  const panel = `<div class="panel autosup row-between"><div><b>🛒 Auto-supply</b><br><small class="muted">${iron ? 'Disabled during the Ironman challenge' : on ? 'Buying missing ingredients from the Trading Post (spends up to 25% of your coins at a time)' : 'Automatically buy this recipe’s missing ingredients'}</small></div>
    <button class="btn ${on ? 'danger' : ''} ${iron ? 'disabled' : ''}" data-act="autosup" data-id="${st}">${on ? 'On' : 'Off'}</button></div>`;
  return h.replace('<div class="list">', panel + '<div class="list">');
})(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);

/* ---------- 3) Starter kit each run ---------- */
const KITS = [
  { at: 0, items: { bronze_scimitar: 1, bronze_full_helm: 1, bronze_platebody: 1, shrimp: 40 }, coins: 500 },
  { at: 1, items: { steel_scimitar: 1, steel_full_helm: 1, steel_platebody: 1, steel_platelegs: 1, steel_kiteshield: 1, trout: 80, steel_pickaxe: 1, steel_hatchet: 1 }, coins: 25000 },
  { at: 3, items: { mithril_scimitar: 1, mithril_full_helm: 1, mithril_platebody: 1, mithril_platelegs: 1, mithril_kiteshield: 1, lobster: 150, mithril_pickaxe: 1, mithril_hatchet: 1, mithril_harpoon: 1, strength_potion: 5 }, coins: 250000 },
  { at: 6, items: { adamant_scimitar: 1, adamant_full_helm: 1, adamant_platebody: 1, adamant_platelegs: 1, adamant_kiteshield: 1, swordfish: 250, adamant_pickaxe: 1, adamant_hatchet: 1, adamant_harpoon: 1, super_combat: 5, prayer_potion: 10 }, coins: 2.5e6 },
  { at: 10, items: { rune_scimitar: 1, rune_full_helm: 1, rune_platebody: 1, rune_platelegs: 1, rune_kiteshield: 1, shark: 400, rune_pickaxe: 1, rune_hatchet: 1, rune_harpoon: 1, super_combat: 10, prayer_potion: 25 }, coins: 2.5e7 },
];
function giveKit() {
  const n = S.asc.count + 10 * (S.trans?.count || 0), k = [...KITS].reverse().find(x => n >= x.at);
  for (const [id, q] of Object.entries(k.items)) if (ITEMS[id]) add(id, q);
  gainCoins(k.coins);
  // wear the weapon & armour, use the best tools
  for (const id of Object.keys(k.items)) { const it = ITEMS[id]; if (it?.slot && reqOk(it.req)) equip(id); }
  S.combat.food = Object.keys(k.items).find(id => ITEMS[id]?.heal) || S.combat.food;
  return k;
}
ascend = (orig => function () {
  const old = S, n = S.asc.count; orig();
  if (S === old || S.asc.count === n) return;
  S.autoSupply = old.autoSupply; const k = giveKit(); recalc(); save();
  setTimeout(() => toast(`🎒 Starter kit: ${Object.keys(k.items).length} items and 🪙${fmt(k.coins)} to kick off the run.`, 'rare', 5000), 800);
})(ascend);
transcend = (orig => function () { const t0 = S.trans?.count || 0; orig(); if ((S.trans?.count || 0) > t0) { giveKit(); recalc(); save(); } })(transcend);

/* ---------- 4) Beginner boost: first 2 hours of a brand-new character ---------- */
const BEGIN_MS = 2 * 3600e3;
const beginnerOn = () => !S.asc.count && !(S.trans?.count) && (S.lifetime.played || 0) < BEGIN_MS;
let playT = Date.now();
setInterval(() => { if (!S || document.hidden) { playT = Date.now(); return; } const d = Date.now() - playT; playT = Date.now(); S.lifetime.played = (S.lifetime.played || 0) + d; }, 10000);
recalc4 = (orig => function () { orig(); if (!S.asc || !beginnerOn()) return; M.xp *= 1.5; for (const st of STATION_ORDER) { M.rate[st] *= 2; M.tap[st] *= 2; } })(recalc4);
viewSkills = (orig => function () { const h = orig(); return beginnerOn() ? `<div class="panel glow small">🌱 <b>Beginner boost</b>: double production and +50% XP for your first 2 hours (${fmtTime(Math.max(0, BEGIN_MS - (S.lifetime.played || 0)) / 1000)} left).</div>` + h : h; })(viewSkills);
VIEWS.skills = (orig => function () { return rebrand(orig()); })(viewSkills);

/* ---------- input & boot ---------- */
viewSig = (orig => function () {
  if (UI.view === 'skill') return orig() + JSON.stringify(S.autoSupply || {}) + momentum(UI.skill);
  if (UI.view === 'skills') return orig() + beginnerOn() + Math.floor((S.lifetime.played || 0) / 60000);
  return orig();
})(viewSig);
document.addEventListener('click', e => {
  if (e.target.closest('[data-nav]')) return;
  const t = e.target.closest('[data-act]'); if (!t || t.dataset.act !== 'autosup') return;
  if (activeChal() === 'ironman') { toast('⛓️ Auto-supply is disabled during the Ironman challenge.', 'warn'); }
  else { (S.autoSupply ||= {})[t.dataset.id] = !autoOn(t.dataset.id); }
  e.stopImmediatePropagation(); UI.force = true; render(); liveUpdate();
}, true);
(function () {
  ach('momentum', 'Déjà Vu', 'Learn Past-life memory', '⚡', g => (g.S.asc.perks?.memory || 0) > 0, 10);
})();
function boot17() {
  boot16(); trackPeaks();
  if (!S.lifetime.kitGiven && !S.asc.count && !(S.trans?.count) && totalLevel() < 60) { giveKit(); S.lifetime.kitGiven = 1; }
  recalc(); UI.force = true; render();
}
