'use strict';
/* =========================================================
   CLICKSCAPE v9.23 — station pages tidied: the tap stage + workers stay pinned at the top,
   info panels fold into a row of chips (one open at a time), the action list sits right below.
   ========================================================= */

const SK_SKIP = () => UI.skill === 'farming' || UI.skill === 'sailing' || COMBAT_SKILLS.includes(UI.skill);
function skClassify(el) {
  const c = el.className || '', t = (el.textContent || '').trim();
  if (c.includes('skill-head')) return 'head';
  if (c === 'tabs' || c.startsWith('tabs')) return 'tabs';
  if (c.includes('stage')) return 'stage';
  if (c.includes('worker-row')) return 'worker';
  if (c === 'list') return 'list';
  if (c === 'chips') return 'chips';
  if (c.includes('milestones') || c.includes('prestige-row') || c.includes('next-lvl')) return 'prog';
  if (c.includes('outfit-row')) return 'outfit';
  if (c.includes('spec-panel')) return 'spec';
  if (c.includes('tool-row')) return 'tool';
  if (c.includes('worker-note') || /Auto-supply/.test(t)) return 'work';
  if (/shooting star|Shooting star|🌠/.test(t)) return 'star';
  if (/Bird house/.test(t)) return 'bird';
  if (c.includes('museum')) return 'museum';
  return 'info';
}
const SK_LABEL = {
  spec: el => `⭐ ${(el.textContent.match(/(\d+)\/3/) || [, 0])[1]}/3`,
  tool: el => `🛠️ Tool ×${(el.textContent.match(/×\s?([\d.]+)/) || [, 1])[1]}`,
  outfit: el => `👕 ${(el.textContent.match(/(\d)\/4/) || [, 0])[1]}/4`,
  prog: () => '📈 Progress',
  work: el => `👷 Cap ${(el.textContent.match(/Worker cap (\d+)/) || [, workerCap()])[1]}`,
  star: () => '🌠 Star',
  bird: () => '🏠 Bird houses',
  museum: () => '🏛️ Museum',
  info: () => '💡 Tips',
};
const SK_ORDER = ['spec', 'tool', 'star', 'bird', 'museum', 'work', 'outfit', 'prog', 'info'];
viewSkill = (orig => function () {
  const h = orig(); if (SK_SKIP()) return h;
  const tpl = document.createElement('template'); tpl.innerHTML = h;
  const kids = [...tpl.content.children]; if (!kids.some(k => skClassify(k) === 'stage')) return h;
  const listIdx = kids.findIndex(k => skClassify(k) === 'list');
  const G = {}; const top = [], after = [];
  kids.forEach((el, i) => {
    const k = skClassify(el);
    if (k === 'head' || k === 'tabs') top.push(el.outerHTML);
    else if (listIdx >= 0 && i > listIdx) after.push(el.outerHTML);
    else (G[k] ||= []).push(el);
  });
  // compact worker row: the "permanent…" fine print moves into the Workers drawer
  const w = G.worker?.[0]; let fine = '';
  if (w) { w.classList.add('compact'); const tiny = w.querySelector('.tiny'); if (tiny) { fine = `<p class="small muted">${tiny.innerHTML}</p>`; tiny.remove(); } }
  const sticky = `<div class="sk-sticky">${(G.stage || []).map(e => e.outerHTML).join('')}${w ? w.outerHTML : ''}</div>`;
  // drawers
  const keys = SK_ORDER.filter(k => G[k]?.length);
  const open = keys.includes(UI.skDrawer) ? UI.skDrawer : null;
  const chips = keys.map(k => { const el = G[k][0], hot = (k === 'star' && !/No shooting star/.test(el.textContent)) || (k === 'bird' && /ready|Collect/i.test(el.textContent)) || (k === 'spec' && el.querySelector('.glow'));
    return `<button class="skc ${open === k ? 'on' : ''} ${hot ? 'hot' : ''}" data-act="sk-drawer" data-id="${k}">${SK_LABEL[k](el)}</button>`; }).join('');
  const drawers = keys.map(k => `<div class="sk-drawer ${open === k ? 'open' : ''}" data-drawer="${k}">${k === 'work' ? fine : ''}${G[k].map(e => e.outerHTML).join('')}</div>`).join('');
  const chipRow = keys.length ? `<div class="sk-chips">${chips}</div>${drawers}` : '';
  return top.join('') + sticky + chipRow + (G.chips || []).map(e => { e.classList.add('one-row'); return e.outerHTML; }).join('') + (listIdx >= 0 ? kids[listIdx].outerHTML : '') + after.join('');
})(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);
viewSig = (orig => function () { return UI.view === 'skill' ? orig() + '|dr' + (UI.skDrawer || '') : orig(); })(viewSig);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="sk-drawer"]'); if (!t) return;
  e.stopImmediatePropagation(); UI.skDrawer = UI.skDrawer === t.dataset.id ? null : t.dataset.id; UI.force = true; render();
}, true);
function boot47() { boot46(); UI.force = true; render(); }

