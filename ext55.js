'use strict';
/* =========================================================
   CLICKSCAPE v9.31 — a proper "Welcome back" report, a slim pinned goal with ETA,
   your name + title in the top bar, and titles for the newer systems
   ========================================================= */

/* ================= WELCOME BACK ================= */
simulateOffline = (orig => function () {
  if (!S?.last) return orig();
  const away = (Date.now() - S.last) / 1000;
  const b0 = { ...S.bank }, c0 = S.coins, xp0 = { ...S.xp }, lv0 = { ...LV }, k0 = S.stats?.kills || 0, a0 = lifeAsc(), t0 = tcount(), con0 = S.lifetime.conDone || 0, wg0 = S.lifetime.wages || 0, wb0 = S.lifetime.wb?.dmg || 0, ch0 = (S.runChests || []).length;
  orig();
  const box = $('#modal'); if (!box || box.hidden || !/Welcome back/.test(box.innerHTML)) return;
  const cap = offlineHours() * 3600, capped = away > cap;
  const gains = []; for (const id of new Set([...Object.keys(b0), ...Object.keys(S.bank)])) { const d = have(id) - (b0[id] || 0); if (d > 0 && ITEMS[id]) gains.push([id, d, d * Math.max(1, ITEMS[id].value || 1)]); }
  const used = []; for (const id of Object.keys(b0)) { const d = (b0[id] || 0) - have(id); if (d > 0 && ITEMS[id]) used.push([id, d]); }
  gains.sort((a, b) => b[2] - a[2]);
  const lv = SKILL_ORDER.filter(s => LV[s] > lv0[s]).map(s => [s, lv0[s], LV[s]]);
  const xpTot = SKILL_ORDER.reduce((a, s) => a + Math.max(0, (S.xp[s] || 0) - (xp0[s] || 0)), 0);
  const coins = S.coins - c0, kills = (S.stats?.kills || 0) - k0, lvls = lv.reduce((a, [, x, y]) => a + y - x, 0);
  const value = gains.reduce((a, g) => a + g[2], 0);
  const best = gains.find(([id]) => ITEMS[id].rare) || gains[0];
  const tiles = [['🪙', 'Coins', coins], ['💰', 'Loot value', value], ['✨', 'XP', xpTot], ['📈', 'Levels', lvls], ['⚔️', 'Kills', kills], ['🌀', 'Ascensions', lifeAsc() - a0], ['📜', 'Contracts', (S.lifetime.conDone || 0) - con0], ['🎁', 'Chests', (S.runChests || []).length - ch0]].filter(t => t[2] > 0);
  const wg = (S.lifetime.wages || 0) - wg0; if (wg > 0) tiles.push(['💸', 'Wages paid', -wg]);
  const afford = UPGRADES.filter(u => !has(u.id) && upgUnlocked(u) && typeof canAffordUpg === 'function' && canAffordUpg(u)).length;
  const log = [...box.querySelectorAll('.offlog > div')].map(d => d.innerHTML);
  box.innerHTML = `<div class="modal-card panel wb2"><button class="x" data-act="close">✕</button>
    <h2>Welcome back!</h2><p class="muted small">You were away <b>${fmtTime(away)}</b>${capped ? ` · <span class="y">progress stopped after ${offlineHours()}h</span> (raise it with 🌙 Night shift)` : ''}</p>
    ${tiles.length ? `<div class="wb2-tiles">${tiles.map(([i, n, v]) => `<div><span>${i}</span><b>${v < 0 ? '−' + fmt(-v) : fmt(v)}</b><small>${n}</small></div>`).join('')}</div>` : ''}
    ${best ? `<div class="wb2-best" data-act="info" data-id="${best[0]}">${itemIcon(best[0])}<div><small>Best haul</small><b>${fmt(best[1])} × ${ITEMS[best[0]].name}</b><small>worth 🪙${fmt(best[2])}</small></div></div>` : ''}
    ${lv.length ? `<h3>Level ups</h3><div class="wb2-lv">${lv.slice(0, 12).map(([s, a, b]) => `<span>${SKILLS[s].icon} ${SKILLS[s].name} <b>${a}→${b}</b></span>`).join('')}${lv.length > 12 ? `<span class="muted">+${lv.length - 12} more</span>` : ''}</div>` : ''}
    ${gains.length ? `<h3>Gained</h3><div class="mini-grid">${gains.slice(0, 12).map(([id, n]) => `<div class="mini" data-act="info" data-id="${id}">${itemIcon(id)}<span>+${fmt(n)}</span></div>`).join('')}</div>` : ''}
    ${gains.length > 12 || used.length || log.length ? `<details class="wb2-more"><summary>Everything else${gains.length > 12 ? ` (+${gains.length - 12} items)` : ''}</summary>
      ${gains.length > 12 ? `<div class="mini-grid">${gains.slice(12).map(([id, n]) => `<div class="mini">${itemIcon(id)}<span>+${fmt(n)}</span></div>`).join('')}</div>` : ''}
      ${used.length ? `<h3>Used up</h3><div class="mini-grid">${used.slice(0, 24).map(([id, n]) => `<div class="mini used">${itemIcon(id)}<span>−${fmt(n)}</span></div>`).join('')}</div>` : ''}
      ${log.length ? `<div class="offlog">${log.slice(0, 30).map(l => `<div>${l}</div>`).join('')}</div>` : ''}</details>` : ''}
    <div class="row-btns">${afford ? `<button class="btn" data-act="wb2-spend">⭐ ${afford} upgrade${afford > 1 ? 's' : ''} to buy</button>` : ''}${(S.runChests || []).length ? '<button class="btn" data-act="chest-next">🎁 Open chests</button>' : ''}<button class="btn big" data-act="close">Continue</button></div></div>`;
})(simulateOffline);

/* ================= PINNED GOAL ================= */
const goal = () => S.lifetime.goal || null;
function goalInfo(g) {
  if (!g) return null;
  if (g.t === 'skill') { const cur = S.xp[g.sk] || 0, tgt = XP_TABLE[g.lvl] || XP_TABLE[XP_TABLE.length - 1], base = g.x0 ?? 0; return { name: `${SKILLS[g.sk]?.icon || ''} ${SKILLS[g.sk]?.name} ${g.lvl}`, v: cur, tgt, pct: Math.min(1, (cur - base) / Math.max(1, tgt - base)), done: LV[g.sk] >= g.lvl }; }
  if (g.t === 'item') { const cur = have(g.id) + (S.costume?.[g.id] || 0); return { name: `${ITEMS[g.id]?.name || g.id} ×${fmt(g.n)}`, v: cur, tgt: g.n, pct: Math.min(1, cur / g.n), done: cur >= g.n, icon: g.id }; }
  if (g.t === 'coins') return { name: `🪙 ${fmt(g.n)} coins`, v: S.coins, tgt: g.n, pct: Math.min(1, S.coins / g.n), done: S.coins >= g.n };
  return null;
}
const GRATE = []; // samples for ETA
setInterval(() => {
  const g = goal(), I = goalInfo(g); if (!I) return; GRATE.push([Date.now(), I.v]); while (GRATE.length > 40) GRATE.shift();
  if (I.done && !g.doneShown) { g.doneShown = true; if (typeof fanLegend === 'function') fanLegend({ kind: '📌 GOAL REACHED 📌', icon: g.t === 'item' ? itemIcon(g.id) : '<span class="emo">🏁</span>', name: I.name, sub: 'Pin a new goal from any skill or item.' }); }
  renderGoal();
}, 3000);
function goalEta(I) {
  if (GRATE.length < 3 || I.done) return ''; const [t0, v0] = GRATE[0], [t1, v1] = GRATE[GRATE.length - 1]; const r = (v1 - v0) / Math.max(1, (t1 - t0) / 1000);
  return r > 0 ? `~${fmtTime((I.tgt - I.v) / r)}` : '';
}
function renderGoal() {
  const g = goal(), I = goalInfo(g); let el = $('#goalbar');
  if (!I || S.settings?.hideGoal) { if (el) el.remove(); document.body.classList.remove('has-goal'); return; }
  if (!el) { el = document.createElement('div'); el.id = 'goalbar'; el.dataset.act = 'goal-open'; document.body.appendChild(el); }
  document.body.classList.add('has-goal');
  const h = `<span class="gb-name">📌 ${I.name}</span><span class="gb-bar"><i style="width:${(I.pct * 100).toFixed(1)}%"></i></span><span class="gb-pct">${I.done ? '✔ done' : `${Math.floor(I.pct * 100)}%${goalEta(I) ? ' · ' + goalEta(I) : ''}`}</span>`;
  if (el._h !== h) { el._h = h; el.innerHTML = h; }
}
function setGoal(g) { if (g.t === 'skill') g.x0 = S.xp[g.sk] || 0; S.lifetime.goal = g; GRATE.length = 0; renderGoal(); toast('📌 Goal pinned. Tap the bar under the header to change it.', 'rare', 3500); }
function goalModal() {
  const g = goal(), I = goalInfo(g);
  openModal(`<div class="item-modal"><h2>📌 Your goal</h2>${I ? `<p><b>${I.name}</b> · ${Math.floor(I.pct * 100)}%${goalEta(I) ? ` · ${goalEta(I)} at your current pace` : ''}</p>` : '<p class="muted">No goal pinned.</p>'}
    <p class="small muted">Pin a goal from the 📌 button on any skill page or in any item window. It shows as a thin bar under the header.</p>
    <div class="chips">${[1e6, 1e8, 1e10, 1e12].filter(n => n > S.coins).slice(0, 3).map(n => `<button class="chip" data-act="goal-coins" data-n="${n}">🪙 ${fmt(n)}</button>`).join('')}</div>
    <div class="row-btns">${g ? '<button class="btn danger" data-act="goal-clear">Unpin</button>' : ''}<button class="btn big" data-act="close">Close</button></div></div>`);
}
function skillGoalModal(sk) {
  const L = LV[sk], cap = MAX_LVL?.[sk] || 99;
  const opts = [...new Set([Math.ceil((L + 1) / 5) * 5, Math.ceil((L + 1) / 10) * 10, 50, 75, 99, 120, cap].filter(x => x > L && x <= Math.max(cap, 99)))].sort((a, b) => a - b).slice(0, 6);
  openModal(`<div class="item-modal"><h2>📌 ${SKILLS[sk].icon} ${SKILLS[sk].name} goal</h2><p class="small muted">Pick a target level. It shows as a thin bar under the header with your ETA.</p>
    <div class="chips">${opts.map(l => `<button class="chip" data-act="goal-skill" data-sk="${sk}" data-l="${l}">Level ${l}</button>`).join('')}</div><button class="btn big" data-act="close">Cancel</button></div>`);
}
skillHead = (orig => function (sk, back) {
  return orig(sk, back).replace(/(<button class="btn[^"]*"[^>]*data-act="guide"[^>]*>)/, `<button class="btn small pin-btn" data-act="goal-skillpick" data-sk="${sk}" title="Pin a goal">📌</button>$1`);
})(skillHead);
openItemModal = (orig => function (id, fromSlot) {
  orig(id, fromSlot); if (fromSlot) return; const box = $('#modal .item-modal'); if (!box) return;
  const n = have(id) + (S.costume?.[id] || 0), tg = n < 1 ? 1 : Math.pow(10, Math.ceil(Math.log10(n + 1)));
  box.insertAdjacentHTML('beforeend', `<div class="row-btns"><button class="btn small" data-act="goal-item" data-id="${id}" data-n="${tg}">📌 Goal: ${fmt(tg)} ${ITEMS[id].name}</button></div>`);
})(openItemModal);

/* ================= NAME & TITLES ================= */
TITLES.push(
  ['exalted', 'the Exalted', () => typeof FACTIONS !== 'undefined' && FACTIONS.some(f => tierOf(f.id) >= 4)],
  ['codex', 'the Bestiarist', () => (S.lifetime.codexSets || 0) >= 3],
  ['trophy', 'the Trophy Hunter', () => typeof trophyBosses === 'function' && trophyBosses().some(m => trophyOf(m) >= 2)],
  ['ward', 'the Fashionable', () => typeof wardOwned === 'function' && wardOwned().length >= 15],
  ['giant', 'the Giantslayer', () => (S.lifetime.wb?.kills || 0) >= 1],
  ['treasure', 'the Treasure Hunter', () => outfitCount('treasure') >= 4],
  ['legend', 'the Legendary', () => Object.keys(S.bank).concat(Object.values(S.equip)).some(id => /__q4$/.test(id || ''))],
  ['elder', 'the Beastmaster', () => Object.values(S.lifetime.evo || {}).some(e => e >= 2)],
  ['contractor', 'the Contractor', () => (S.lifetime.conDone || 0) >= 50],
  ['wyrm', 'the Wyrmbane', () => Object.keys(S.bank).concat(Object.values(S.equip)).some(id => /_dbward$/.test(id || ''))],
);
renderTitle = function () {
  const el = $('#ptitle') || (() => { const s = document.createElement('small'); s.id = 'ptitle'; $('#top .brand')?.appendChild(s); return s; })();
  const name = (S.lifetime.name || '').trim(), t = curTitle(), txt = name ? `${name}${t ? (/^the /.test(t) ? ' ' : ', ') + t : ''}` : t;
  if (el && el.textContent !== txt) el.textContent = txt;
};
viewCharacter = (orig => function () {
  const h = orig();
  return h.replace('<div class="panel"><h3>🏷️ Titles</h3>', `<div class="panel"><h3>🪪 Your name</h3><div class="name-row"><input id="pname" class="btab-input" maxlength="16" placeholder="Your name" value="${esc(S.lifetime.name || '')}" autocomplete="off"><button class="btn" data-act="name-save">Save</button></div><small class="muted">Shown with your title at the top of the screen and on your run card.</small></div><div class="panel"><h3>🏷️ Titles</h3>`);
})(viewCharacter);
VIEWS.character = (orig => function () { return rebrand(orig()); })(viewCharacter);

/* ---------- clicks & boot ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
  if (a === 'wb2-spend') { e.stopImmediatePropagation(); closeModal(); go('upgrades'); }
  if (a === 'goal-open') { e.stopImmediatePropagation(); goalModal(); }
  if (a === 'goal-clear') { e.stopImmediatePropagation(); S.lifetime.goal = null; closeModal(); renderGoal(); }
  if (a === 'goal-coins') { e.stopImmediatePropagation(); setGoal({ t: 'coins', n: +t.dataset.n }); closeModal(); }
  if (a === 'goal-skillpick') { e.stopImmediatePropagation(); skillGoalModal(t.dataset.sk); }
  if (a === 'goal-skill') { e.stopImmediatePropagation(); setGoal({ t: 'skill', sk: t.dataset.sk, lvl: +t.dataset.l }); closeModal(); }
  if (a === 'goal-item') { e.stopImmediatePropagation(); setGoal({ t: 'item', id: t.dataset.id, n: +t.dataset.n }); closeModal(); }
  if (a === 'name-save') { e.stopImmediatePropagation(); S.lifetime.name = ($('#pname')?.value || '').trim().slice(0, 16); renderTitle(); toast('🪪 Name saved.'); }
}, true);
function boot55() { boot54(); renderTitle(); renderGoal(); UI.force = true; render(); }

