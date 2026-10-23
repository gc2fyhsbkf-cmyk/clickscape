'use strict';
/* =========================================================
   CLICKSCAPE v9.65 — combat page: once the big arena scrolls away, a compact fight bar pins to the
   top (your HP, the monster's HP, tap the monster row to strike, Fight / Retreat), so you can browse
   monsters, gear and loot without losing the fight
   ========================================================= */
viewCombat = (orig => function () {
  const h = orig(), C = S.combat, m = MONSTER_BY_ID[C.mon]; if (!m || h.indexOf('class="arena') < 0) return h;
  const name = (C.fighting && C.sup ? 'Superior ' : '') + m.name;
  const bar = `<div class="cb-mini">
    <div class="cbm-row"><span class="cbm-l">🧍 You</span><div class="hpbar"><i data-live="php"></i><span data-live="phptext"></span></div></div>
    <div class="cbm-row cbm-mon" data-tap="combat"><span class="cbm-l"><span style="${monFilter(m)}">${m.icon}</span> ${esc(name)}</span><div class="hpbar enemy"><i data-live="mhp"></i><span data-live="mhptext"></span></div></div>
    <div class="cbm-btns"><button class="btn small ${C.fighting ? 'danger' : ''}" data-act="fight">${C.fighting ? 'Retreat' : 'Fight!'}</button><button class="btn small" data-act="cb-top">⬆</button></div>
  </div>`;
  return h + bar;
})(viewCombat);
VIEWS.combat = (orig => function () { return rebrand(orig()); })(viewCombat);
function cbMiniCheck() {
  const el = document.querySelector('.cb-mini'); if (!el) { document.body.classList.remove('cb-scrolled'); return; }
  const main = document.querySelector('main'), arena = document.querySelector('.arena');
  if (!main || !arena) return;
  const mr = main.getBoundingClientRect(), ab = arena.getBoundingClientRect().bottom, was = document.body.classList.contains('cb-scrolled');
  const on = was ? ab < mr.top + 50 : ab < mr.top + 20; // hysteresis: no flicker at the edge
  if (on !== was) document.body.classList.toggle('cb-scrolled', on);
  {
    const hb = document.getElementById('top')?.getBoundingClientRect().bottom || 0, top = Math.max(hb, mr.top);
    el.style.top = (top + 4) + 'px'; el.style.left = (mr.left + 8) + 'px'; el.style.width = (mr.width - 16) + 'px';
    const pt = parseFloat(getComputedStyle(main).paddingTop) || 0; document.documentElement.style.setProperty('--cbm-h', Math.max(0, top + 4 + el.offsetHeight + 4 - mr.top - pt) + 'px');
  }
}
document.addEventListener('scroll', cbMiniCheck, { capture: true, passive: true });
window.addEventListener('resize', cbMiniCheck);
render = (orig => function () { const r = orig.apply(this, arguments); try { cbMiniCheck(); } catch (e) {} return r; })(render);
document.addEventListener('click', e => { const t = e.target.closest('[data-act="cb-top"]'); if (!t) return; e.stopImmediatePropagation(); const main = document.querySelector('main'); (main || window).scrollTo({ top: 0, behavior: 'smooth' }); }, true);

const css84 = document.createElement('style');
css84.textContent = `.cb-mini{display:grid;opacity:0;transform:translateY(-10px);pointer-events:none;transition:opacity .22s ease,transform .22s ease;will-change:opacity,transform;position:fixed;z-index:40;padding:6px 8px;border-radius:12px;border:1px solid rgba(232,192,96,.4);background:rgba(28,22,15,.97);box-shadow:0 4px 14px rgba(0,0,0,.5);grid-template-columns:1fr auto;gap:4px 8px;align-items:center}
body.cb-scrolled .cb-mini{opacity:1;transform:none;pointer-events:auto}
.ctabs{transition:top .22s ease}body.cb-scrolled .ctabs{top:var(--cbm-h,0)}
.cb-mini .cbm-row{grid-column:1;display:grid;grid-template-columns:110px 1fr;align-items:center;gap:6px;font-size:.78rem}
.cb-mini .cbm-l{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cb-mini .hpbar{margin:0;height:14px}.cb-mini .hpbar span{font-size:.65rem;line-height:14px}
.cb-mini .cbm-mon{cursor:pointer;border-radius:6px}.cb-mini .cbm-mon:active{background:rgba(255,255,255,.08)}
.cb-mini .cbm-btns{grid-column:2;grid-row:1 / span 2;display:flex;flex-direction:column;gap:4px}`;
document.head.appendChild(css84);

function boot84() { boot83(); UI.force = true; render(); }
