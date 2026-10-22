'use strict';
/* =========================================================
   CLICKSCAPE v9.57 — the new progression loop.
   • Level caps no longer rise with ascensions: 99 combat / 120 skills, raised only by Transcendence
   • An ascension needs a share of your max total level, creeping up each ascension (see ascReqCalc)
   • A Transcendence needs 10 ascensions, then 15, 20, … (see transTarget)
   • Anything beyond your caps is hidden, except the very next tier, shown as a teaser
   ========================================================= */

/* ---------- what's reachable this Transcendence ---------- */
const baseCap = s => CAP99.includes(s) ? 99 : 120;
// the Transcendence that first lets a skill reach this level (with what you have now otherwise)
function tdFor(lvl, sk) {
  const t0 = tcount(), cur = MAX_LVL[sk] || baseCap(sk); if (lvl <= cur) return t0;
  for (let t = t0 + 1; t < t0 + 400; t++) if (cur + capTrans(t) - capTrans(t0) >= lvl) return t;
  return t0 + 400;
}
function maxCombat() {
  const L0 = {}; for (const s of CAP99) { L0[s] = LV[s]; LV[s] = MAX_LVL[s] || 99; }
  try { return combatLevel(); } finally { Object.assign(LV, L0); }
}
const tdTag = t => `✴️ Transcendence ${t}`;

/* ---------- skill lists: hide tiers above the cap, tease the next one ---------- */
function visibleActs(st, list) {
  const sk = STATIONS[st]?.skill, cap = MAX_LVL[sk] || 120; if (!sk) return list;
  const inCap = list.filter(a => (a.lvl || 1) <= cap);
  const next = list.filter(a => (a.lvl || 1) > cap).sort((a, b) => a.lvl - b.lvl)[0];
  return next ? [...inCap, next] : inCap;
}
let TEASE = {};
viewSkill = (orig => function () {
  const sk = UI.skill, sts = SKILL_STATIONS?.[sk] || [], saved = {}, metals = METALS.slice(); TEASE = {};
  try {
    for (const st of sts) { const L = STATION_ACTIONS[st]; if (!L) continue; saved[st] = L; const v = visibleActs(st, L); STATION_ACTIONS[st] = v; for (const a of v) if (a.lvl > (MAX_LVL[sk] || 120)) TEASE[a.id] = tdFor(a.lvl, sk); }
    if (sts.includes('anvil')) { const cap = MAX_LVL.smithing; const nx = metals.filter(m => m.lvl > cap).sort((a, b) => a.lvl - b.lvl)[0]; METALS.length = 0; METALS.push(...metals.filter(m => m.lvl <= cap || m === nx)); }
    let h = orig();
    for (const id in TEASE) h = h.replace(new RegExp(`(data-id="${id}">[\\s\\S]*?)(🔒 )?Lv (\\d+)`), (m, pre, l, lv) => `${pre}🔒 Lv ${lv} · <b class="tease">${tdTag(TEASE[id])}</b>`);
    return h;
  } finally { for (const st in saved) STATION_ACTIONS[st] = saved[st]; METALS.length = 0; METALS.push(...metals); }
})(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);

/* ---------- monsters: hide the ones that need a combat level you can't reach yet ---------- */
viewCombat = (orig => function () {
  const all = MONSTERS.slice(), mx = maxCombat();
  const out = all.filter(m => (m.minCombat || 0) > mx).sort((a, b) => a.minCombat - b.minCombat);
  const tease = out.length ? out.filter(m => m.minCombat === out[0].minCombat) : [];
  try {
    MONSTERS.length = 0; MONSTERS.push(...all.filter(m => !((m.minCombat || 0) > mx) || tease.includes(m)));
    let h = orig();
    for (const m of tease) { let t = tcount(); while (t < tcount() + 50) { t++; const L0 = {}; for (const s of CAP99) { L0[s] = LV[s]; LV[s] = (MAX_LVL[s] || 99) + capTrans(t) - capTrans(tcount()); } const c = combatLevel(); Object.assign(LV, L0); if (c >= m.minCombat) break; }
      h = h.replace(new RegExp(`(data-act="mon" data-id="${m.id}">[\\s\\S]*?<small class="reqs[^"]*">)`), `$1<b class="tease">${tdTag(t)}</b> · `); }
    return h;
  } finally { MONSTERS.length = 0; MONSTERS.push(...all); }
})(viewCombat);
VIEWS.combat = (orig => function () { return rebrand(orig()); })(viewCombat);

/* ---------- shop: no tools or gear you can't use until a later Transcendence ---------- */
const reqOver = it => it?.req && Object.entries(it.req).some(([s, l]) => typeof l === 'number' && MAX_LVL[s] && l > MAX_LVL[s]);
viewShop = (orig => function () {
  const k = UI.shopCat, L = SHOP[k]; if (!Array.isArray(L)) return orig();
  const keep = L.slice();
  try { L.length = 0; L.push(...keep.filter(x => !reqOver(ITEMS[x.id]))); return orig(); } finally { L.length = 0; L.push(...keep); }
})(viewShop);
VIEWS.shop = (orig => function () { return rebrand(orig()); })(viewShop);

/* ---------- Pantheon wording ---------- */
{ const p = TRANS_PERKS.find(x => x.id === 'pantheon'); if (p) p.desc = l => `Ascension requirement −${l * 5}%`;
  const c = TRANS_PERKS.find(x => x.id === 'caps'); if (c) c.desc = l => `Level caps +${l * 5}`; }

/* ---------- a welcome note for the fresh start ---------- */
function loopIntro() {
  if (S.lifetime.loop957) return; S.lifetime.loop957 = 1;
  if ((S.lifetime.ascs || 0) || tcount()) return;
  setTimeout(() => openModal(`<div class="item-modal"><h2>🌀 A fresh start</h2><p>Clickscape has a new progression loop, so this is a brand-new game.</p>
    <ul class="small"><li><b>Level caps</b> are 99 (combat) and 120 (skills). Only a <b>Transcendence</b> raises them.</li>
    <li><b>Ascending</b> needs a share of your max total level that creeps up each time, but every ascension makes you stronger, so they get quicker.</li>
    <li><b>Transcending</b> needs 10 ascensions (then 15, 20…), resets everything, and lifts your caps for new tiers.</li>
    <li>Things beyond your caps stay hidden until you can reach them.</li></ul><button class="btn big" data-act="close">Let's go</button></div>`), 1200);
}
const css79 = document.createElement('style');
css79.textContent = `.tease{color:#c8a0ff;font-weight:600}`;
document.head.appendChild(css79);

function boot79() { boot78(); applyCaps(); refreshLevels(); recalc(); loopIntro(); UI.force = true; render(); }
