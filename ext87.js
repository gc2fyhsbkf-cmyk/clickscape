'use strict';
/* =========================================================
   CLICKSCAPE v9.68 — combat is no longer a tapping contest.
   • Fights run on their own (turn-based auto-attacks); tapping the monster no longer hits it
     (it still starts a fight, and still dodges a boss's wind-up)
   • Active play is rewarded with things to click instead: a 🎯 weak spot pops up every few
     seconds on any monster (tap it for a 3× critical) and each one you catch builds 🔥 Focus
     (+10% damage per stack, up to 5, fades if you stop catching them)
   • Combat XP ×3 so idle fighting levels at a healthy pace without spamming
   ========================================================= */
const CB_XP = 3, WS_EVERY = [5000, 9000], WS_FOR = 2200, FOCUS_MAX = 5, FOCUS_FADE = 20000;
const WS = { next: 0, until: 0, x: 50, y: 40, on: false };
const focusN = () => (S.combat.focus && Date.now() < S.combat.focus.until) ? S.combat.focus.n : 0;
function addFocus() { const f = S.combat.focus && Date.now() < S.combat.focus.until ? S.combat.focus : { n: 0 }; S.combat.focus = { n: Math.min(FOCUS_MAX, f.n + 1), until: Date.now() + FOCUS_FADE }; }

// 1) taps don't hit any more
tapMonster = function () {
  const C = S.combat; if (!C.fighting) { startFight(); UI.force = true; return; }
  const el = document.querySelector('#mstage .mon'); if (el) { el.classList.remove('nudge'); void el.offsetWidth; el.classList.add('nudge'); }
};
// 2) XP and focus
recalc4 = (orig => function () { orig(); if (M.cxp) M.cxp *= CB_XP; })(recalc4);
maxHit = (orig => function (tap, m) { const h = orig(tap, m); const n = focusN(); return n ? Math.round(h * (1 + 0.1 * n)) : h; })(maxHit);
// boss weak spots and dodges build focus too
document.addEventListener('click', e => { if (e.target.closest('[data-act="bm-weak"]')) addFocus(); }, true);

// 3) weak spots on every (non-boss) monster, only while you're watching
function wsLayer() { const st = document.getElementById('mstage'); if (!st) return null; let el = st.querySelector('.ws-layer'); if (!el) { el = document.createElement('div'); el.className = 'ws-layer'; st.appendChild(el); } return el; }
function wsRender() {
  const el = wsLayer(), n = focusN();
  const h = (WS.on ? `<button class="ws-spot" data-act="ws-hit" style="left:${WS.x}%;top:${WS.y}%"><span>🎯</span><i style="animation-duration:${WS_FOR}ms"></i></button>` : '') + (n ? `<div class="ws-focus">🔥 Focus ×${n} <small>+${n * 10}% dmg</small></div>` : '');
  if (el && el._h !== h) { el._h = h; el.innerHTML = h; }
  const mini = document.querySelector('.cb-mini'); if (mini) { let b = mini.querySelector('.cbm-ws'); if (!b) { mini.querySelector('.cbm-btns')?.insertAdjacentHTML('afterbegin', '<button class="btn small cbm-ws" data-act="ws-hit">🎯</button>'); b = mini.querySelector('.cbm-ws'); } if (b) b.style.visibility = WS.on ? 'visible' : 'hidden'; }
}
setInterval(() => {
  const C = S?.combat, m = C && curMon();
  if (UI.view !== 'combat' || document.hidden || OFF || !C?.fighting || !m || m.boss || C.mhp <= 0) { if (WS.on) { WS.on = false; } WS.next = 0; wsRender(); return; }
  const t = Date.now();
  if (!WS.next) WS.next = t + WS_EVERY[0] + Math.random() * (WS_EVERY[1] - WS_EVERY[0]);
  if (WS.on && t > WS.until) { WS.on = false; WS.next = t + WS_EVERY[0] + Math.random() * (WS_EVERY[1] - WS_EVERY[0]); }
  if (!WS.on && t > WS.next) { WS.on = true; WS.until = t + WS_FOR; WS.x = 20 + Math.random() * 60; WS.y = 12 + Math.random() * 50; }
  wsRender();
}, 150);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="ws-hit"]'); if (!t) return; e.stopImmediatePropagation();
  if (!WS.on || !S.combat.fighting) return; WS.on = false; WS.next = Date.now() + WS_EVERY[0] + Math.random() * (WS_EVERY[1] - WS_EVERY[0]);
  addFocus(); const d = playerAttack(false, 3, 10); // a caught weak spot never misses
  try { const r = t.getBoundingClientRect(); floater(r.left + r.width / 2, r.top, `CRIT ${fmt(d || 0)}!`, 'good'); } catch (er) {}
  wsRender(); liveUpdate();
}, true);
// weak spots must not count as a tap on the stage
document.addEventListener('pointerdown', e => { if (e.target.closest('[data-act="ws-hit"]')) e.stopImmediatePropagation(); }, true);

// 4) the arena explains it
viewCombat = (orig => function () {
  return orig().replace(/Tap to strike! Auto-attack every ([\d.]+)s/, 'Auto-battling: a hit every $1s · catch the 🎯 weak spots for crits & 🔥 Focus').replace(/>Tap to attack</, '>Tap to start the fight<');
})(viewCombat);
VIEWS.combat = (orig => function () { return rebrand(orig()); })(viewCombat);

const css87 = document.createElement('style');
css87.textContent = `.ws-layer{position:absolute;inset:0;pointer-events:none;z-index:5}
.ws-spot{position:absolute;transform:translate(-50%,-50%);pointer-events:auto;width:54px;height:54px;border-radius:50%;border:2px solid #ffd84a;background:radial-gradient(rgba(255,216,74,.35),rgba(255,120,40,.15));box-shadow:0 0 16px rgba(255,200,60,.7);font-size:26px;display:flex;align-items:center;justify-content:center;animation:wsPop .18s ease-out;cursor:pointer}
.ws-spot i{position:absolute;inset:-6px;border-radius:50%;border:3px solid rgba(255,216,74,.9);animation:wsRing linear forwards}
@keyframes wsPop{from{transform:translate(-50%,-50%) scale(.4);opacity:0}to{transform:translate(-50%,-50%) scale(1);opacity:1}}
@keyframes wsRing{from{transform:scale(1);opacity:1}to{transform:scale(.55);opacity:.2}}
.ws-focus{position:absolute;left:8px;top:8px;background:rgba(40,20,8,.85);border:1px solid #e88a30;border-radius:8px;padding:2px 7px;font-size:.75rem;color:#ffb060}
#mstage .mon.nudge{animation:monNudge .25s ease}@keyframes monNudge{50%{transform:translateX(3px)}}`;
document.head.appendChild(css87);

function boot87() { boot86(); recalc(); UI.force = true; render(); }
