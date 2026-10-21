'use strict';
/* =========================================================
   CLICKSCAPE v9.52 — fishing spots (pond → abyssal trench, each with its own fish pool; XP on
   every cast, a fish on about one cast in three, catch & release for extra XP) and worker meals
   (your crew eats cooked food; run out and they slow down)
   ========================================================= */

/* ================= FISHING SPOTS ================= */
const CATCH = 0.35, RELEASE_XP = 1.25;
const SPOTS = [
  ['fs_pond', 'Village pond', '🦆', [['shrimp', 60], ['sardine', 40]]],
  ['fs_river', 'Riverbank', '🏞️', [['trout', 55], ['salmon', 45]]],
  ['fs_lake', 'Mountain lake', '🏔️', [['lobster', 60], ['swordfish', 40]]],
  ['fs_coast', 'Rocky coast', '🪨', [['monkfish', 60], ['shark', 40]]],
  ['fs_deep', 'Deep sea', '🌊', [['manta_ray', 45], ['anglerfish', 40], ['sailfish', 15]]],
  ['fs_abyss', 'Abyssal trench', '🕳️', [['abyssal_eel', 65], ['starlight_ray', 35]]],
];
const fishAct = f => ACTIONS['fi_' + f];
const SPOT_OF = {};
for (const [id, name, icon, pool] of SPOTS) {
  const P = pool.map(([f, w]) => [f, w, fishAct(f)]).filter(x => x[2] && ITEMS['raw_' + x[0]]);
  if (!P.length) continue;
  const lvl = Math.min(...P.map(x => x[2].lvl));
  const tw = P.reduce((a, x) => a + x[1], 0);
  const xp = P.reduce((a, x) => a + x[2].xp * x[1], 0) / tw, hp = Math.round(P.reduce((a, x) => a + x[2].hp * x[1], 0) / tw);
  const a = { id, st: 'fish', name: `${icon} ${name}`, lvl, xp: Math.round(xp), hp: Math.max(2, hp), out: {}, icon: 'raw_' + P[0][0], spot: P.map(x => ['raw_' + x[0], x[1], x[2].lvl]) };
  ACTIONS[id] = a; for (const x of P) SPOT_OF[x[2].id] = id;
}
// the fishing list: spots replace the single-fish actions they cover (tier eel spots and Tempoross stay)
(function () {
  const L = STATION_ACTIONS.fish; const covered = new Set(Object.keys(SPOT_OF));
  const keep = L.filter(a => !covered.has(a.id));
  const spots = SPOTS.map(s => ACTIONS[s[0]]).filter(Boolean);
  L.length = 0; L.push(...spots, ...keep); L.sort((a, b) => a.lvl - b.lvl);
})();
function spotPool(a) { const L = (a.spot || []).filter(([, , lvl]) => LV.fishing >= lvl); return L.length ? L : (a.spot || []).slice(0, 1); }
const releasing = () => !!S.settings.fishRelease;
doYield = (orig => function (st, a, n, xpScale) {
  if (st !== 'fish' || !a || a.crateDef) return orig.apply(this, arguments);
  const out0 = a.out, single = !a.spot ? Object.entries(a.out || {})[0] : null;
  a.out = {}; let done;
  try { done = orig.call(this, st, a, n, (xpScale ?? 1) * (releasing() ? RELEASE_XP : 1)); } finally { a.out = out0; }
  if (!(done > 0) || releasing()) return done;
  const k = rollCount(done, CATCH); if (!k) return done;
  if (single) { add(single[0], single[1] * k); return done; }
  const pool = spotPool(a), tw = pool.reduce((s, x) => s + x[1], 0);
  if (k <= 40) { const got = {}; for (let i = 0; i < k; i++) { let r = Math.random() * tw; const p = pool.find(x => (r -= x[1]) <= 0) || pool[0]; got[p[0]] = (got[p[0]] || 0) + 1; } for (const id in got) add(id, got[id]); }
  else { let left = k; pool.forEach((p, i) => { const q = i === pool.length - 1 ? left : Math.min(left, Math.round(k * p[1] / tw)); if (q > 0) add(p[0], q); left -= q; }); }
  return done;
})(doYield);
// old targets move to their spot
function migrateFishTarget() { const t = S.target?.fish; if (t && SPOT_OF[t]) S.target.fish = SPOT_OF[t]; }
// the spot rows show their fish pool, and a catch & release toggle sits on the fishing page
viewSkill = (orig => function () {
  let h = orig(); if (UI.skill !== 'fishing') return h;
  h = h.replace(/(data-act="target" data-st="fish" data-id="(fs_[a-z]+)">[\s\S]*?<span class="ar-main">[\s\S]*?<\/small>)/g, (m, all, id) => { const a = ACTIONS[id]; if (!a?.spot) return m; return `${all}<span class="ar-loot">Catches: ${a.spot.map(([f, w, lvl]) => `<span class="${LV.fishing >= lvl ? '' : 'locked-fish'}" title="${esc(ITEMS[f].name)} (level ${lvl})">${itemIcon(f)}</span>`).join('')}</span>`; });
  const tog = `<div class="panel small fish-mode"><b>🎣 ${releasing() ? 'Catch & release' : 'Keeping the catch'}</b> <small class="muted">${releasing() ? `no fish, +${Math.round((RELEASE_XP - 1) * 100)}% XP` : `a fish on about 1 cast in 3; XP on every cast`}</small><button class="btn small" data-act="fish-release">${releasing() ? 'Keep fish' : 'Release for XP'}</button></div>`;
  return h.replace(/(<div class="list">)/, tog + '$1');
})(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);
viewSig = (orig => function () { return UI.view === 'skill' && UI.skill === 'fishing' ? orig() + '|rel' + releasing() : orig(); })(viewSig);
document.addEventListener('click', e => { const t = e.target.closest('[data-act="fish-release"]'); if (!t) return; e.stopImmediatePropagation(); S.settings.fishRelease = !releasing(); UI.force = true; render(); }, true);
// the action window explains spots
const _actInfo = actInfo;
actInfo = function (id) {
  _actInfo(id); const a = ACTIONS[id]; if (!a?.spot) return; const box = $('#modal .act-info'); if (!box) return;
  box.querySelector('h3')?.insertAdjacentHTML('beforebegin', `<h3>Fish here</h3><div class="ai-list">${a.spot.map(([f, w, lvl]) => itemLine(f, 0, `${Math.round(w / a.spot.reduce((s, x) => s + x[1], 0) * 100)}% of catches · needs Fishing ${lvl}${LV.fishing < lvl ? ' 🔒' : ''}`)).join('')}</div><p class="small muted">XP on every cast; a fish on about ${Math.round(CATCH * 100)}% of casts (or none with catch & release, for +25% XP).</p>`);
};

/* ================= WORKER MEALS ================= */
// past 10 workers your crew starts eating cooked food from the bank, appetite rising to full at 40. Demand grows with how
// fast your workers are, so a few fishermen and cooks can feed a station-full of miners. Short on
// food? Everyone works at 75% speed until there's food again. Your combat food bag is never eaten.
const MEAL_MIN = 10, MEAL_FULL = 40, MEAL_BASE = 0.0015; // HP per worker per second at base speed
// appetite ramps up gently: nothing below 10 workers, then rising to full at 40
const appetite = n => Math.max(0, Math.min(1, (n - MEAL_MIN) / (MEAL_FULL - MEAL_MIN)));
const crewSize = () => STATION_ORDER.reduce((a, st) => a + Math.max(0, S.workers?.[st] || 0), 0);
function mealRate() {
  const n = crewSize(), ap = appetite(n); if (ap <= 0) return 0;
  let r = 0; for (const st of STATION_ORDER) r += M.rate?.[st] || 0;
  const k = Math.max(1, r / Math.max(1, n * 0.2)) * (S.hungry ? 1 / 0.75 : 1);
  return n * MEAL_BASE * Math.pow(k, 0.92) * ap; // HP per second for the whole crew
}
let MEAL_ACC = 0, mealT = 0;
function feedCrew(sec) {
  const need = mealRate() * sec; if (need <= 0) { if (S.hungry) { S.hungry = false; recalc(); } return; }
  MEAL_ACC += need; const keep = S.combat?.food, keepN = 40;
  // eat the lowest-healing food first
  for (const id of FOODS.slice().reverse()) {
    if (MEAL_ACC <= 0) break; const h = ITEMS[id]?.heal || 0; if (!h) continue;
    let q = have(id) - (id === keep ? keepN : 0); if (q <= 0) continue;
    const eat = Math.min(q, Math.ceil(MEAL_ACC / h)); remove(id, eat); MEAL_ACC -= eat * h;
    S.lifetime.mealsHP = (S.lifetime.mealsHP || 0) + eat * h;
  }
  const hungry = MEAL_ACC > 0; if (hungry) MEAL_ACC = Math.min(MEAL_ACC, need); else MEAL_ACC = Math.max(MEAL_ACC, 0);
  if (hungry !== !!S.hungry) { S.hungry = hungry; recalc(); const msg = hungry ? '🍖 Your workers are hungry: they work at 75% speed until there is cooked food in the bank.' : '🍖 Your workers have eaten: back to full speed.'; if (OFF) OFFLOG.push(msg); else toast(msg, hungry ? 'warn' : 'rare', 6000); }
}
tickCore = (orig => function (dt) { orig(dt); mealT += dt; if (mealT >= 30) { const s = mealT; mealT = 0; feedCrew(s); } })(tickCore);
recalc4 = (orig => function () { orig(); if (S?.hungry) for (const st of STATION_ORDER) if (M.rate[st] !== undefined) M.rate[st] *= 0.75; })(recalc4);
// a meals line on the Skills page and the fishing/cooking pages
function mealLine() {
  const r = mealRate(); if (!r) return `<div class="panel small meals">🍖 <b>Worker meals</b> start once you have more than ${MEAL_MIN} workers (now ${crewSize()}), and your crew's appetite grows until ${MEAL_FULL}.</div>`;
  const food = FOODS.reduce((a, id) => a + have(id) * (ITEMS[id]?.heal || 0), 0), hrs = food / (r * 3600);
  return `<div class="panel small meals ${S.hungry ? 'hungry' : ''}">🍖 <b>Worker meals</b>${appetite(crewSize()) < 1 ? ` <small class="muted">(appetite ${Math.round(appetite(crewSize()) * 100)}%, full at ${MEAL_FULL} workers)</small>` : ''} · your crew eats <b>${fmt(r * 3600)} HP</b> of cooked food an hour · ${S.hungry ? '<b class="r">hungry: 75% speed!</b> Cook some fish.' : `food in the bank lasts <b class="y">${hrs > 999 ? '999h+' : fmtTime(hrs * 3600)}</b>`}</div>`;
}
viewSkills = (orig => function () { return mealLine() + orig(); })(viewSkills);
VIEWS.skills = (orig => function () { return rebrand(orig()); })(viewSkills);
viewSkill = (orig => function () { const h = orig(); return ['fishing', 'cooking'].includes(UI.skill) ? h.replace(/(<div class="list">)/, mealLine() + '$1') : h; })(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);
viewSig = (orig => function () { return (UI.view === 'skills' || UI.view === 'skill') ? orig() + '|h' + !!S.hungry + (mealRate() > 0) : orig(); })(viewSig);

function boot74() { boot73(); migrateFishTarget(); recalc(); UI.force = true; render(); }
