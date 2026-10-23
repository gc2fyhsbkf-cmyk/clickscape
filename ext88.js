'use strict';
/* =========================================================
   CLICKSCAPE v9.69 — crowbars look like crowbars, treasure maps drop a little less often, and
   map solvers: tiered drops that solve a treasure map of their tier instantly (straight to the chest)
   ========================================================= */

/* ---------- crowbar icon: a metal bar with a curled claw and an angled chisel end ---------- */
SHAPES.mattock = t => `<path d="M6.5 24.5 L9 28.5 L22.5 8.5 Q24.5 4.5 28.5 6 Q31 8 28 11.5" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6.5 24.5 L9 28.5 L22.5 8.5 Q24.5 4.5 28.5 6 Q31 8 28 11.5" fill="none" stroke="${t}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 26 L22 8.8" stroke="${shade(t, .45)}" stroke-width="1" stroke-linecap="round"/><path d="M26.6 6.9 L28.3 10" stroke="#000" stroke-width="1.1" stroke-linecap="round"/>`;
for (const id in _iconCache) if (ITEMS[id]?.kind === 'mattock' || ITEMS[id]?.slot === 'mattock') delete _iconCache[id];

/* ---------- treasure maps: ~30% rarer from every steady source ---------- */
// monsters 1/128 → 1/180 (bosses 1/60 → 1/85), gathering 1/3000 → 1/4200 (see systems.js / game.js), thieving ×0.7
for (const a of STATION_ACTIONS.thieve || []) if (a.thieve?.clue && !a.thieve._clue70) { a.thieve.clue[1] *= 0.7; a.thieve._clue70 = 1; }

/* ---------- map solvers ---------- */
const SOLVE_TIERS = ['easy', 'medium', 'hard', 'elite', 'master'].filter(t => ITEMS['clue_' + t] && ITEMS['casket_' + t]);
const SOLVE_LV = { easy: 1, medium: 30, hard: 80, elite: 150, master: 400 };
for (const t of SOLVE_TIERS) item('solver_' + t, `Map solver (${t})`, 50 * (1 + SOLVE_TIERS.indexOf(t)) ** 3, { cat: 'misc', kind: 'solver', tint: CLUE_TIERS[t]?.tint || '#c03a3a', solves: t,
  desc: `Solves one ${t} treasure map instantly: the map goes straight to its treasure chest.` });
SHAPES.solver = t => `<circle cx="16" cy="16" r="11" fill="#e8d8a8" stroke="#000" stroke-width="1.6"/><circle cx="16" cy="16" r="8" fill="none" stroke="${t}" stroke-width="2"/>
  <path d="M16 7 L19 16 L16 25 L13 16 Z" fill="${t}" stroke="#000" stroke-width="1"/><path d="M16 7 L19 16 L13 16 Z" fill="#c02020"/><circle cx="16" cy="16" r="1.6" fill="#000"/>`;
// solvers climb with monster tiers like everything else
LADDERS.solver = {}; for (const t of SOLVE_TIERS) LADDERS.solver['solver_' + t] = SOLVE_LV[t];
LADDER_ORDER.solver = SOLVE_TIERS.map(t => 'solver_' + t);
const solverFor = m => m.boss && m.lvl >= 400 && SOLVE_TIERS.includes('master') ? 'master' : m.lvl >= 150 || m.boss ? 'elite' : m.lvl >= 80 ? 'hard' : m.lvl >= 30 ? 'medium' : 'easy';
// on monsters that don't already have a signature weapon, armour or tool to chase (plus master solvers on the top bosses)
(function () {
  for (const m of MONSTERS) {
    if (NO_TOUCH(m) || !m.d0?.length || m.lvl < 3) continue;
    const t = solverFor(m); if (!SOLVE_TIERS.includes(t)) continue;
    // 'special' = a signature piece (drop-only gear, Wyrm tier) or a tool to chase; the very top bosses always carry master solvers
    const special = m.d0.some(d => { const it = ITEMS[d[0]]; return it && d[1] < 1 && (isSig(d[0]) || it.cat === 'tool'); });
    if (special && t !== 'master') continue;
    const id = 'solver_' + t, p = t === 'master' ? 1 / 150 : m.boss ? 1 / 60 : 1 / 220;
    m.d0.push([id, p, 1, 1]); m.tierV = -1; const src = SOURCES[id] ||= []; if (src.length < 10) src.push(`${m.name} (1/${Math.round(1 / p)})`);
  }
})();
function solveMaps(t, n = 1) {
  const k = Math.min(n, have('solver_' + t), have('clue_' + t)); if (k <= 0) return 0;
  remove('solver_' + t, k); remove('clue_' + t, k); add('casket_' + t, k); logItem('casket_' + t, k);
  S.clues.done[t] = (S.clues.done[t] || 0) + k; S.lifetime.solved = (S.lifetime.solved || 0) + k;
  toast(`🧭 Solved ${k} ${t} treasure map${k > 1 ? 's' : ''}: ${k} treasure chest${k > 1 ? 's' : ''} added to your bank.`, 'rare', 4000);
  return k;
}
// buttons on the solver and on the map
openItemModal = (orig => function (id) {
  const r = orig.apply(this, arguments); const it = ITEMS[id]; const t = it?.solves || (it?.clue && SOLVE_TIERS.includes(it.clue) ? it.clue : null); if (!t) return r;
  const n = Math.min(have('solver_' + t), have('clue_' + t)), box = document.querySelector('#modal .item-modal') || document.querySelector('#modal .modal-card');
  const html = `<div class="panel small solver-row">🧭 <b>Map solvers</b>: ${fmt(have('solver_' + t))} ${t} solver${have('solver_' + t) === 1 ? '' : 's'} · ${fmt(have('clue_' + t))} ${t} map${have('clue_' + t) === 1 ? '' : 's'}${n ? `<div class="row-btns"><button class="btn" data-act="solve" data-id="${t}" data-q="1">Solve 1</button>${n > 1 ? `<button class="btn" data-act="solve" data-id="${t}" data-q="${n}">Solve all ${n}</button>` : ''}</div>` : `<br><small class="muted">You need a ${t} map and a ${t} solver.</small>`}</div>`;
  box?.insertAdjacentHTML('beforeend', html); return r;
})(openItemModal);
document.addEventListener('click', e => { const b = e.target.closest('[data-act="solve"]'); if (!b) return; e.stopImmediatePropagation(); const t = b.dataset.id; solveMaps(t, +b.dataset.q || 1); closeModal(); openItemModal('casket_' + t); UI.force = true; render(); }, true);

function boot88() { boot87(); for (const m of MONSTERS) m.tierV = -1; applyBossScale(); UI.force = true; render(); }
boot88();
