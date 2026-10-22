'use strict';
/* =========================================================
   CLICKSCAPE v9.60 — run features unlock as you ascend (lifetime ascensions), so every early
   ascension opens something new: omens → challenges → relics → more challenges → weekly trial
   ========================================================= */
const RUN_UNLOCKS = [
  [1, 'perks', '✨ Essence perks, the Trading Post and the Combat academy'],
  [2, 'omens', '🔮 Omens: pick a world event for each run'],
  [3, 'chal1', '🏁 Challenges: Frugal, Glass Cannon, Minimalist'],
  [4, 'chal2', '🏁 Challenges: Ironman, Pacifist, Warrior\'s Path'],
  [5, 'relics', '🔮 Relics: powerful run bonuses as your total level climbs'],
  [6, 'chal3', '🏁 Challenges: Lone Wolf, Hourglass, Purist'],
  [7, 'trial', '🏁 The weekly trial'],
  [8, 'chal4', '🏁 Challenges: Hardcore, Speedrun'],
];
const CHAL_AT = { frugal: 3, glass: 3, minimal: 3, ironman: 4, pacifist: 4, warrior: 4, lonewolf: 6, hourglass: 6, purist: 6, hardcore: 8, speedrun: 8 };
const runAt = k => (RUN_UNLOCKS.find(u => u[1] === k) || [0])[0];
const runOpen = k => tcount() > 0 || apoCount() > 0 || lifeAsc() >= runAt(k);
const chalOpen = id => tcount() > 0 || apoCount() > 0 || lifeAsc() >= (CHAL_AT[id] || 3);
const nextRunUnlock = () => RUN_UNLOCKS.find(u => lifeAsc() < u[0] && !tcount() && !apoCount());
const runLockNote = (cls, k, what) => `<div class="panel ${cls} small muted">🔒 ${what} unlock${what.endsWith('s') ? '' : 's'} at ascension ${runAt(k)} <small>(you have ${lifeAsc()})</small></div>`;

// relics
relicPanel = (orig => function () { return runOpen('relics') ? orig() : runLockNote('relics', 'relics', 'Relics'); })(relicPanel);
// omens
rollOmen = (orig => function () { orig(); if (!runOpen('omens')) { S.omen = null; S.omenOffer = null; } })(rollOmen);
// weekly trial
trialPanel = (orig => function () { return runOpen('trial') ? orig() : ''; })(trialPanel);
// challenges: locked ones show when they open
chalPanel = (orig => function () {
  if (!CHALLENGES.some(c => chalOpen(c.id))) return runLockNote('chal-lock', 'chal1', 'Challenges');
  let h = orig();
  for (const c of CHALLENGES) if (!chalOpen(c.id)) h = h.replace(new RegExp(`<button class="btn small[^"]*" data-act="chal-pick" data-id="${c.id}">[^<]*</button>`), `<span class="small muted">🔒 Ascension ${CHAL_AT[c.id] || 3}</span>`);
  return h;
})(chalPanel);
document.addEventListener('click', e => { const t = e.target.closest('[data-act="chal-pick"]'); if (t && !chalOpen(t.dataset.id)) { e.stopImmediatePropagation(); toast(`🔒 That challenge unlocks at ascension ${CHAL_AT[t.dataset.id]}.`, 'warn'); } }, true);
// anything picked before it was open is cleared
function runLockFix() { if (S.nextChal && !chalOpen(S.nextChal)) S.nextChal = null; if (!runOpen('relics') && S.relic?.picks) S.relic.picks = {}; if (!runOpen('omens')) { S.omenOffer = null; S.omen = null; } }

// what's next, on the Ascend tab, and a toast when something opens
viewAscension = (orig => function () {
  const h = orig(), n = nextRunUnlock(); if (!n) return h;
  return h.replace('<div class="ctabs asc-tabs">', `<div class="panel small unlock-next">🔓 <b>Next ascension unlock</b> (ascension ${n[0]}): ${n[2]}</div><div class="ctabs asc-tabs">`);
})(viewAscension);
VIEWS.ascension = (orig => function () { return rebrand(orig()); })(viewAscension);
ascend = (orig => function () {
  const n0 = lifeAsc(); const r = orig.apply(this, arguments); const n1 = lifeAsc();
  if (n1 > n0 && !tcount() && !apoCount()) { runLockFix(); const u = RUN_UNLOCKS.filter(x => x[0] > n0 && x[0] <= n1); if (u.length && !OFF) setTimeout(() => toast(`🔓 Unlocked: ${u.map(x => x[2]).join(' · ')}`, 'pet', 8000), 2500); }
  return r;
})(ascend);

function boot81() { boot80(); runLockFix(); UI.force = true; render(); }
