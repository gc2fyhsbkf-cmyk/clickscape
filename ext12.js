'use strict';
/* =========================================================
   CLICKSCAPE v6.1 — smooth screens with huge production
   ========================================================= */
// 1) Only redraw a page when something on THAT page changes (not when any skill levels up).
viewSig = (orig => function () {
  const s = orig(), lv = SKILL_ORDER.map(k => LV[k]).join(',');
  if (UI.view === 'skill' && s.startsWith(lv)) return LV[UI.skill] + '|' + msCount?.(UI.skill) + s.slice(lv.length);
  if (UI.view === 'combat' && s.startsWith(lv)) return ['attack', 'strength', 'defence', 'hitpoints', 'ranged', 'magic', 'prayer', 'slayer'].map(k => LV[k]).join(',') + s.slice(lv.length);
  if (UI.view === 'skills' && s.startsWith(lv)) return Math.floor(totalLevel() / 5) + s.slice(lv.length);
  return s;
})(viewSig);

// 2) Never redraw while you're touching or scrolling; at most ~1 redraw per second otherwise.
let rTouch = false, rScroll = 0, rClick = 0, rLast = 0;
addEventListener('touchstart', () => { rTouch = true; }, { passive: true, capture: true });
addEventListener('touchend', () => { rTouch = false; rScroll = Date.now(); }, { passive: true, capture: true });
addEventListener('touchcancel', () => { rTouch = false; }, { passive: true, capture: true });
addEventListener('scroll', () => { rScroll = Date.now(); }, { passive: true });
addEventListener('click', () => { rClick = Date.now(); }, true);
render = (orig => function () {
  const t = Date.now(), byTap = t - rClick < 400;
  if (!byTap && (rTouch || t - rScroll < 600)) return;           // keep UI.force; we'll draw once you stop
  if (!byTap && t - rLast < (UI.force ? 700 : 1500)) return;
  if (UI.sig === viewSig() && !UI.force) return;
  rLast = t;
  const y = window.scrollY;
  orig();
  if (Math.abs(window.scrollY - y) > 2) window.scrollTo(0, y);
})(render);

go = (orig => function (v, x) { rClick = Date.now(); return orig(v, x); })(go);

// 3) The "Running low" bar no longer flickers in and out: only shows when you can't afford 5 more actions.
viewSkill = (orig => function () {
  const st = UI.curStation, a = st && ACTIONS[S.target[st]];
  return orig().replace(/<div class="panel buybar">[\s\S]*?<\/div>/, m => (a?.inp && Object.entries(a.inp).some(([id, q]) => have(id) < q * 5)) ? m : '');
})(viewSkill);
VIEWS.skill = viewSkill;
