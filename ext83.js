'use strict';
/* =========================================================
   CLICKSCAPE v9.64 — on a skill page, once the header scrolls away a compact level & XP strip
   appears at the top of the pinned tap area, so your level is always in view while you pick
   a resource further down the list. Tap the strip to jump back to the top.
   ========================================================= */
viewSkill = (orig => function () {
  const h = orig(), sk = UI.skill; if (!SKILLS[sk] || h.indexOf('<div class="sk-sticky">') < 0) return h;
  // the strip floats just under the header (no layout shift): it slides in and the pinned tap area eases down to make room
  return h + `<button class="sk-mini" data-act="sk-top"><span class="skm-ico">${SKILLS[sk].icon}</span><b>${SKILLS[sk].name}</b> <span class="lvlnum" data-lvl="${sk}">${LV[sk]}</span><span class="skm-bar">${xpBar(sk)}</span></button>`;
})(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);
// show the strip once the full header has scrolled out of view (with a little hysteresis so it never flickers)
let SKM_ON = false;
function skMiniCheck() {
  const main = document.querySelector('main'), head = document.querySelector('.skill-head'), el = document.querySelector('.sk-mini');
  if (!main || !head || !el) { if (SKM_ON) { SKM_ON = false; document.body.classList.remove('sk-scrolled'); } return; }
  const mr = main.getBoundingClientRect(), b = head.getBoundingClientRect().bottom;
  const on = SKM_ON ? b < mr.top + 14 : b < mr.top - 2;
  const hb = document.getElementById('top')?.getBoundingClientRect().bottom || 0, top = Math.max(hb, mr.top);
  el.style.top = (top + 4) + 'px'; el.style.left = (mr.left + 10) + 'px'; el.style.width = (mr.width - 20) + 'px';
  const pt = parseFloat(getComputedStyle(main).paddingTop) || 0;
  document.documentElement.style.setProperty('--skm-h', Math.max(0, top + 4 + el.offsetHeight + 2 - mr.top - pt) + 'px');
  if (on !== SKM_ON) { SKM_ON = on; document.body.classList.toggle('sk-scrolled', on); }
}
document.addEventListener('scroll', skMiniCheck, { capture: true, passive: true });
window.addEventListener('resize', skMiniCheck);
render = (orig => function () { const r = orig.apply(this, arguments); try { skMiniCheck(); } catch (e) {} return r; })(render);
document.addEventListener('click', e => { const t = e.target.closest('[data-act="sk-top"]'); if (!t) return; e.stopImmediatePropagation(); const main = document.querySelector('main'); (main || window).scrollTo({ top: 0, behavior: 'smooth' }); }, true);

const css83 = document.createElement('style');
css83.textContent = `.sk-mini{position:fixed;z-index:30;display:flex;align-items:center;gap:6px;padding:5px 10px;border-radius:10px;border:1px solid rgba(232,192,96,.35);background:rgba(30,24,16,.97);box-shadow:0 4px 12px rgba(0,0,0,.45);color:inherit;font:inherit;font-size:.85rem;text-align:left;cursor:pointer;
  opacity:0;transform:translateY(-10px);pointer-events:none;transition:opacity .22s ease,transform .22s ease;will-change:opacity,transform}
body.sk-scrolled .sk-mini{opacity:1;transform:none;pointer-events:auto}
.sk-mini b{color:var(--gold,#e8c060)}.sk-mini .lvlnum{font-weight:800;color:#ffe066;margin-right:4px}.sk-mini .skm-ico{font-size:18px}
.sk-mini .skm-bar{flex:1;min-width:0}.sk-mini .skm-bar .xpbar,.sk-mini .skm-bar>*{margin:0!important;height:14px;font-size:.66rem}
.sk-sticky{transition:top .22s ease}body.sk-scrolled .sk-sticky{top:calc(var(--skm-h,0px) - 8px)}`;
document.head.appendChild(css83);

function boot83() { boot82(); UI.force = true; render(); }
