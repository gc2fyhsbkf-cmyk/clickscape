'use strict';
/* =========================================================
   CLICKSCAPE v9.4 — more challenges (5 stacks), ascension milestones,
   bosses & raids that scale with your depth
   ========================================================= */

/* ================= CHALLENGES ================= */
[{ id: 'frugal', icon: '🪙', name: 'Frugal', desc: 'No upgrades may be bought.', reward: '+15% production (stacks ×5)', mult: 1.75 },
 { id: 'glass', icon: '🥂', name: 'Glass Cannon', desc: 'No food may be eaten.', reward: '+10% max hit (stacks ×5)', mult: 1.75 },
 { id: 'speedrun', icon: '⏱️', name: 'Speedrun', desc: 'Ascend within 3 hours of starting the run.', reward: 'Echo engine +25% (stacks ×5)', mult: 2.5 },
 { id: 'minimal', icon: '🧺', name: 'Minimalist', desc: 'Only 5 workers per station.', reward: 'Worker cap +5 (stacks ×5)', mult: 2 },
 { id: 'purist', icon: '🕯️', name: 'Purist', desc: 'No relics and no omen this run.', reward: '+10% sigils (stacks ×5)', mult: 1.5 },
].forEach(c => { if (!CHALLENGES.some(x => x.id === c.id)) CHALLENGES.push(c); });
CHALLENGES.forEach(c => { c.reward = c.reward.replace('stacks ×3', 'stacks ×5'); });
const chalN = id => Math.min(5, S.lifetime.chal?.[id] || 0);
const timedOk = c => c === 'speedrun' ? now() - (S.chal?.t || 0) <= 3 * 3600e3 : c === 'hourglass' ? now() - (S.chal?.t || 0) <= 12 * 3600e3 : true;
// challenges multiply sigils as well as essence
sigilGain = (orig => function () { const c = activeChal(); let g = orig(); if (c && timedOk(c)) g *= chalDef(c).mult; g *= 1 + 0.1 * chalN('purist'); return Math.floor(g); })(sigilGain);
// speedrun is timed like hourglass: mark it failed when time runs out so it isn't credited
ascend = (orig => function () { if (activeChal() === 'speedrun' && !timedOk('speedrun')) chalFail('over 3 hours'); return orig(); })(ascend);
// rules
buyUpgrade = (orig => function (id) { if (activeChal() === 'frugal') return toast('🪙 Frugal challenge: no upgrades this run.', 'warn'); return orig(id); })(buyUpgrade);
eat = (orig => function (id) { if (activeChal() === 'glass') return toast('🥂 Glass Cannon challenge: no eating this run.', 'warn'); return orig(id); })(eat);
autoEat = (orig => function () { if (activeChal() === 'glass') return; return orig(); })(autoEat);
workerCap = (orig => function () { return activeChal() === 'minimal' ? 5 : orig() + 5 * chalN('minimal'); })(workerCap);
relicNeed = (orig => function (i) { return activeChal() === 'purist' ? 1e9 : orig(i); })(relicNeed);
rollOmen = (orig => function () { orig(); if (S.chal?.id === 'purist' || S.nextChal === 'purist') { S.omen = null; S.omenOffer = null; } })(rollOmen);
// rewards (stacks 1-3 of the original six are handled in v6; this adds stacks 4-5 and the new ones)
recalc4 = (orig => function () {
  orig(); if (!S?.asc) return;
  const C = S.lifetime.chal || {}, x = id => Math.max(0, Math.min(5, C[id] || 0) - 3);
  if (x('ironman')) M.luck *= 1 + 0.1 * x('ironman');
  if (x('lonewolf')) for (const st of STATION_ORDER) M.tap[st] *= 1 + x('lonewolf');
  if (x('pacifist')) M.xp *= 1 + 0.1 * x('pacifist');
  if (x('warrior')) M.dmg *= 1 + 0.1 * x('warrior');
  if (x('hourglass')) for (const st of STATION_ORDER) M.rate[st] *= 1 + 0.2 * x('hourglass');
  if (x('hardcore')) { M.dmg *= 1 + 0.05 * x('hardcore'); M.luck *= 1 + 0.05 * x('hardcore'); }
  if (chalN('frugal')) for (const st of STATION_ORDER) { M.rate[st] *= 1 + 0.15 * chalN('frugal'); M.tap[st] *= 1 + 0.15 * chalN('frugal'); }
  if (chalN('glass')) M.dmg *= 1 + 0.1 * chalN('glass');
})(recalc4);
engineRate = (orig => function () { return orig() * (1 + 0.25 * chalN('speedrun')); })(engineRate);
// make the old stack limit text match
chalPanel = (orig => function () { return orig().replace(/runes &amp; essence|runes & essence/gi, 'sigils & essence').replace(/Runes & essence/g, 'Sigils & essence'); })(chalPanel);

/* ================= ASCENSION MILESTONES ================= */
// lifetime ascensions unlock permanent boosts: each milestone is another ×1.1 to all production and XP
const ASC_MS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 1e4, 1e5, 1e6];
const msReached = () => ASC_MS.filter(n => lifeAsc() >= n).length;
recalc4 = (orig => function () {
  orig(); if (!S?.asc) return; const k = Math.pow(1.1, msReached());
  if (k > 1) { for (const st of STATION_ORDER) { M.rate[st] *= k; M.tap[st] *= k; } M.xp *= k; }
})(recalc4);
viewAscension = (orig => function () {
  const r = msReached(), next = ASC_MS[r];
  const chips = ASC_MS.map((n, i) => `<span class="chip ${i < r ? 'on' : 'locked'}">${fmt(n)}</span>`).join('');
  return orig().replace('<div class="ctabs asc-tabs">', `<div class="panel small"><b>🏆 Ascension milestones</b> <small class="muted">· ${fmt(lifeAsc())} lifetime ascensions · ×${fmtD(Math.pow(1.1, r))} production & XP${next ? ` · next at ${fmt(next)}` : ''}</small><div class="chips">${chips}</div></div><div class="ctabs asc-tabs">`);
})(viewAscension);
VIEWS.ascension = (orig => function () { return rebrand(orig()); })(viewAscension);

/* ================= BOSSES & RAIDS SCALE WITH YOUR DEPTH ================= */
// big monsters keep up as level caps rise, and pay out more to match
const bossScale = () => 1 + capBonus() / 50;
const scaled = m => m.boss || m.area === 'beyond' || m.raid || m.area === 'gwd' || m.area === 'bosses';
function applyBossScale() {
  const f = bossScale();
  for (const m of MONSTERS) {
    if (!scaled(m)) continue;
    m.b0 ||= { hp: m.hp, atk: m.atk, def: m.def, mh: m.mh, coins: m.coins ? [...m.coins] : null };
    m.hp = Math.round(m.b0.hp * f * f); m.atk = Math.round(m.b0.atk * f); m.def = Math.round(m.b0.def * f); m.mh = Math.round(m.b0.mh * f);
    if (m.b0.coins) m.coins = m.b0.coins.map(c => Math.round(c * f * f));
    m.scale = f;
  }
}
recalc4 = (orig => function () { orig(); if (S?.asc && !(S.combat?.fighting && scaled(curMon() || {}))) applyBossScale(); })(recalc4);

/* ---------- boot ---------- */
(function () {
  ach('chal_5', 'Glutton for punishment', 'Complete any challenge 5 times', '🏁', g => Object.values(g.S.lifetime.chal || {}).some(n => n >= 5), 30);
  ach('ms_100', 'Centurion', 'Reach 100 lifetime ascensions', '🏆', () => lifeAsc() >= 100, 40);
})();
function boot27() { boot26(); applyBossScale(); recalc(); UI.force = true; render(); }
