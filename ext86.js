'use strict';
/* =========================================================
   CLICKSCAPE v9.67 — a Home screen. The game opens on Home: events, contracts, things to collect,
   boosts, boon/edict offers, getting-started goals, your workforce and totals. The Skills tab is
   now just your skills.
   ========================================================= */
const SKILLS_FULL = VIEWS.skills;
const GRID_KEEP = el => el.classList.contains('skill-grid') || el.classList.contains('title-panel');
function splitSkills() {
  const t = document.createElement('template'); t.innerHTML = SKILLS_FULL();
  const home = [], grid = [], title = [];
  for (const el of [...t.content.children]) { if (el.classList.contains('title-panel')) { title.push(el.outerHTML); grid.push(el.outerHTML); } else if (GRID_KEEP(el)) grid.push(el.outerHTML); else home.push(el.outerHTML); }
  return { home, grid, title };
}
VIEWS.skills = function () { return splitSkills().grid.join(''); };
VIEWS.home = function () {
  const { home, title } = splitSkills();
  const quick = `<div class="home-quick"><button class="btn" data-nav="ascension">🌀 Ascension</button><button class="btn" data-nav="house">🏰 House</button><button class="btn" data-nav="msglog">📜 Messages</button></div>`;
  return `<div class="panel home-head"><h2>🏠 Home</h2><small class="muted">Everything that needs you, in one place.</small></div>` + title.join('') + home.join('') + quick;
};
// home re-renders when the skills page would
viewSig = (orig => function () { if (UI.view !== 'home') return orig(); const v = UI.view; UI.view = 'skills'; try { return 'home|' + orig(); } finally { UI.view = v; } })(viewSig);
// a red dot on Home when something is ready to collect, hand in or choose
navAlerts = (orig => function () {
  const a = orig() || {};
  try { const h = splitSkills().home.join(''); a.home = /ready|Hand in|Collect|Choose a boon|Proclaim/i.test(h); } catch (e) {}
  return a;
})(navAlerts);
if (!NAV.some(n => n[0] === 'home')) NAV.unshift(['home', '🏠', 'Home']);
function renderNav() {
  const nav = document.getElementById('nav'); if (!nav) return;
  nav.innerHTML = NAV.map(([k, i, n]) => `<button data-nav="${k}" class="${UI.view === k ? 'on' : ''}"><span>${i}</span><small>${n}</small></button>`).join('');
}

const css86 = document.createElement('style');
css86.textContent = `#nav{gap:2px;grid-template-columns:repeat(7,1fr)}#nav button small{font-size:.58rem;letter-spacing:-.01em}
.home-head{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}.home-head h2{margin:0}
.home-quick{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:6px 0 10px}`;
document.head.appendChild(css86);

function boot86() { boot85(); renderNav(); UI.view = 'home'; UI.force = true; render(); }
boot86();
