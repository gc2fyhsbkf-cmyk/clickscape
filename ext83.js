'use strict';
/* =========================================================
   CLICKSCAPE v9.64 — on a skill page, once the header scrolls away a compact level & XP strip
   appears at the top of the pinned tap area, so your level is always in view while you pick
   a resource further down the list. Tap the strip to jump back to the top.
   ========================================================= */
viewSkill = (orig => function () {
  const h = orig(), sk = UI.skill; if (!SKILLS[sk] || h.indexOf('<div class="sk-sticky">') < 0) return h;
  const strip = `<button class="sk-mini" data-act="sk-top"><span class="skm-ico">${SKILLS[sk].icon}</span><b>${SKILLS[sk].name}</b> <span class="lvlnum" data-lvl="${sk}">${LV[sk]}</span><span class="skm-bar">${xpBar(sk)}</span></button>`;
  return h.replace('<div class="sk-sticky">', '<div class="sk-sticky">' + strip);
})(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);
// show the strip only once the full header has scrolled out of view
function skMiniCheck() {
  const main = document.querySelector('main'), head = document.querySelector('.skill-head');
  const on = !!(main && head && head.getBoundingClientRect().bottom < main.getBoundingClientRect().top + 4);
  document.body.classList.toggle('sk-scrolled', on);
}
document.addEventListener('scroll', skMiniCheck, true);
render = (orig => function () { const r = orig.apply(this, arguments); try { skMiniCheck(); } catch (e) {} return r; })(render);
document.addEventListener('click', e => { const t = e.target.closest('[data-act="sk-top"]'); if (!t) return; e.stopImmediatePropagation(); const main = document.querySelector('main'); if (main) main.scrollTo({ top: 0, behavior: 'smooth' }); else window.scrollTo({ top: 0, behavior: 'smooth' }); }, true);

const css83 = document.createElement('style');
css83.textContent = `.sk-mini{display:none;width:100%;align-items:center;gap:6px;margin:0 0 6px;padding:5px 10px;border-radius:10px;border:1px solid rgba(232,192,96,.35);background:rgba(30,24,16,.96);color:inherit;font:inherit;font-size:.85rem;text-align:left;cursor:pointer}
.sk-mini b{color:var(--gold,#e8c060)}.sk-mini .lvlnum{font-weight:800;color:#ffe066;margin-right:4px}.sk-mini .skm-ico{font-size:18px}
.sk-mini .skm-bar{flex:1;min-width:0}.sk-mini .skm-bar .xpbar,.sk-mini .skm-bar>*{margin:0!important;height:14px;font-size:.66rem}
body.sk-scrolled .sk-mini{display:flex}`;
document.head.appendChild(css83);

function boot83() { boot82(); UI.force = true; render(); }
