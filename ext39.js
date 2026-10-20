'use strict';
/* =========================================================
   CLICKSCAPE v9.15 — clear requirements on every monster & boss,
   wave/room tracker in the arena, "boss incoming", loot chests at the end of a run
   ========================================================= */

/* ================= REQUIREMENTS ================= */
// every requirement as a ✔/✖ line with what you have now and how to get there
function reqList(m) {
  const R = [], C = S.combat;
  const rg = regionOf(m), RG = REG_BY_ID[rg];
  if (RG && !RG.event) { const ok = regOpen(rg); R.push({ ok, t: `🗺️ ${RG.name} unlocked`, s: `🗺️ ${RG.name}`, how: ok ? '' : gateText(rg) }); }
  if (m.season) { const ok = activeSeason()?.id === m.season; R.push({ ok, t: `🎉 ${cap1(m.season)} event running`, s: '🎉 Event only', how: ok ? '' : 'Comes back with its seasonal event' }); }
  if (m.ascReq) { const need = Math.max(0, m.ascReq - 2 * (S.trans?.perks?.rift || 0)), ok = S.asc.count >= need; R.push({ ok, t: `🌀 ${need} ascension${need === 1 ? '' : 's'} this cycle`, s: `🌀 AC ${need}`, how: ok ? '' : `You're on AC ${S.asc.count}` }); }
  if (m.transReq) { const ok = tcount() >= m.transReq; R.push({ ok, t: `✴️ ${m.transReq} Transcendence`, s: `✴️ TD ${m.transReq}`, how: ok ? '' : 'Unlocks after your first Transcendence' }); }
  if (m.minCombat) { const ok = combatLevel() >= m.minCombat; R.push({ ok, t: `⚔️ Combat level ${m.minCombat}`, s: `⚔️ Cb ${m.minCombat}`, how: ok ? '' : `You're combat ${combatLevel()}` }); }
  if (m.sl) { const ok = LV.slayer >= m.sl; R.push({ ok, t: `💀 Slayer level ${m.sl}`, s: `💀 Slayer ${m.sl}`, how: ok ? '' : `You're Slayer ${LV.slayer}` }); }
  if (m.needs) {
    const id = m.needs, helm = ITEMS[S.equip.head]?.slayerHelm && ['earmuffs', 'nose_peg', 'facemask'].includes(id);
    const ok = id === 'mirror_shield' ? !!ITEMS[S.equip.shield]?.mirror : helm || have(id) > 0 || Object.values(S.equip).includes(id);
    R.push({ ok, t: `${id === 'mirror_shield' ? 'Equip' : 'Bring'} a ${ITEMS[id].name}`, s: `🎒 ${ITEMS[id].name}`, how: ok ? '' : 'Buy it from the Slayer shop or make it' });
  }
  if (m.leaf) { const ok = !!ITEMS[S.equip.weapon]?.leaf; R.push({ ok, t: 'Leaf-bladed weapon equipped', s: '🍃 Leaf blade', how: ok ? '' : 'Only leaf-bladed weapons can hurt it' }); }
  if (m.noMelee) { const ok = wclass() !== 'melee'; R.push({ ok, t: 'Ranged or Magic weapon', s: '🏹 No melee', how: ok ? '' : 'It flies out of reach of melee' }); }
  if (m.god) { const k = S.kc[m.god] || 0, ok = k >= GWD_KC || C.paid === m.id; R.push({ ok, t: `${GWD_KC} ${GODS[m.god]} kill count`, s: `${GWD_KC} ${GODS[m.god]} KC`, how: ok ? '' : `You have ${fmt(k)}: kill ${GODS[m.god]}'s soldiers in God Wars` }); }
  if (m.sacrifice) { const ok = have(m.sacrifice) > 0 || C.paid === m.id; R.push({ ok, t: `Sacrifice a ${ITEMS[m.sacrifice].name}`, s: `🔥 ${ITEMS[m.sacrifice].name}`, how: ok ? '' : 'It is used up when you enter' }); }
  // anything else canFight knows about (spell scrolls, ammo, …)
  const err = canFight(m);
  if (err && R.every(r => r.ok)) R.push({ ok: false, t: String(err).replace(/^🗺️ /, ''), s: '🔒 ' + String(err).replace(/^🗺️ /, '').split(':')[0].slice(0, 22), how: '' });
  return R;
}
const reqHTML = (m, cls = '') => { const R = reqList(m); return R.length ? `<div class="reqs-list ${cls}">${R.map(r => `<div class="${r.ok ? 'ok' : 'bad'}"><span>${r.ok ? '✔' : '✖'}</span><div><b>${r.t}</b>${r.how ? `<small>${r.how}</small>` : ''}</div></div>`).join('')}</div>` : ''; };

// monster rows: show the unmet requirements in plain words
monRow = (orig => function (x, champ) {
  const h = orig(x, champ); const bad = reqList(x).filter(r => !r.ok);
  if (!bad.length) return h;
  return h.replace(/<small class="reqs bad">[\s\S]*?<\/small>/, `<small class="reqs bad">🔒 ${bad.map(r => r.t + (r.how && !/^Kill /.test(r.how) ? ` <i>(${r.how.replace(/^You('re| have) /, '')})</i>` : r.how ? ` <i>(${r.how})</i>` : '')).join(' · ')}</small>`);
})(monRow);
// boss tiles: the first thing standing in your way, right on the tile
bossTile = (orig => function (x) {
  const h = orig(x), bad = reqList(x).filter(r => !r.ok);
  return bad.length ? h.replace('<span class="bt-lock">🔒</span>', `<span class="bt-lock">🔒</span><small class="bt-req">${bad[0].s}${bad.length > 1 ? ` +${bad.length - 1}` : ''}</small>`) : h;
})(bossTile);
// monster info window: a requirements checklist, and a locked Fight button that says why
openMonsterInfo = (orig => function (id) {
  orig(id); const m = MONSTER_BY_ID[id]; if (!m) return;
  const box = $('#modal .mon-info'); if (!box) return;
  const R = reqList(m), err = canFight(m);
  if (R.length) box.querySelector('.mi-head')?.insertAdjacentHTML('afterend', `<h3>Requirements</h3>${reqHTML(m)}`);
  box.querySelector('p.small.reqs')?.remove();
  const btn = box.querySelector('[data-act="mon-go"]');
  if (btn && err) { btn.outerHTML = `<button class="btn big disabled" disabled>🔒 Locked</button>`; }
  const run = typeof runOf === 'function' ? runOf(m) : null;
  if (run && !err) box.querySelector('h3')?.insertAdjacentHTML('beforebegin', `<p class="small y">${run.icon} Part of ${run.name} (${run.unit.toLowerCase()} ${run.idx + 1}/${run.list.length}). Start it from Activities.</p>`);
})(openMonsterInfo);
// activity cards: list every requirement, not just the first
actCard = (orig => function (A) {
  const h = orig(A), m = MONSTER_BY_ID[A.first]; if (!m) return h;
  const bad = reqList(m).filter(r => !r.ok), need = A.need?.();
  const parts = [...(need ? [need] : []), ...bad.map(r => r.t + (r.how ? ` <i>(${r.how})</i>` : ''))];
  return parts.length && !actBusy(A) ? h.replace(/<div class="ac-meta">[\s\S]*?<\/div>/, `<div class="ac-meta bad">🔒 ${parts.join(' · ')}</div>`) : h;
})(actCard);

/* ================= RUN TRACKER ================= */
const RUN_UNIT = { caves: 'Wave', inferno: 'Wave', ba: 'Wave', pc: 'Portal', gauntlet: 'Stage', cgauntlet: 'Stage' };
function runOf(m) {
  if (!m) return null;
  if (m.barrows) { const list = BARROWS.map(b => 'barrows_' + b.id); return { key: 'barrows', name: 'Barrows', icon: '⚱️', list, idx: Math.min(list.length - 1, S.barrows.killed.length), unit: 'Brother' }; }
  if (!m.raid) return null;
  const A = ACTS.find(a => (a.raid || a.k) === m.raid); if (!A?.list) return null;
  return { key: m.raid, name: A.name, icon: A.icon, list: A.list, idx: m.order || 0, unit: RUN_UNIT[m.raid] || 'Room', A };
}
viewCombat = (orig => function () {
  let h = orig(); const m = curMon(), run = runOf(m); if (!run) return h;
  const n = run.list.length, i = run.idx, last = i === n - 1, boss = MONSTER_BY_ID[run.list[n - 1]];
  const dots = run.list.map((id, k) => `<i class="${k < i ? 'done' : k === i ? 'cur' : ''} ${k === n - 1 ? 'boss' : ''}">${k === n - 1 ? '👑' : ''}</i>`).join('');
  const warn = last ? `<div class="boss-warn final">👑 Final ${run.key === 'barrows' ? 'brother' : 'boss'}: ${boss.name}</div>` : i === n - 2 ? `<div class="boss-warn">⚠️ Boss next: ${boss.name}</div>` : '';
  const key = run.key + ':' + JSON.stringify([S.raids?.[run.key] || 0, S.pc?.games || 0, S.barrows?.chests || 0]);
  let splash = '';
  if (last && S.combat.fighting && UI._bossSplash !== key) { UI._bossSplash = key; UI._bossSplashT = Date.now(); }
  const el = Date.now() - (UI._bossSplashT || 0);
  if (last && UI._bossSplash === key && el < 2800) splash = `<div class="boss-splash" style="animation-delay:-${el}ms"><span>⚠️ BOSS INCOMING ⚠️</span><b>${boss.icon} ${boss.name}</b></div>`;
  const strip = `<div class="run-strip"><div><b>${run.icon} ${run.name}</b> · ${run.unit} ${i + 1}/${n}</div><div class="run-dots">${dots}</div>${warn}</div>`;
  return h.replace(/(<div class="mstage[^>]*>)/, `$1${strip}${splash}`);
})(viewCombat);

/* ================= LOOT CHESTS ================= */
const runSig = () => JSON.stringify([S.raids || {}, S.pc?.games || 0, S.barrows?.chests || 0]);
const chestWrap = orig => function (m) {
  const sig = runSig(), b0 = { ...S.bank }, c0 = S.coins, run = runOf(m), T = toast, cap = [];
  if (!OFF) toast = (...a) => { cap.push(a); };
  let r; try { r = orig.apply(this, arguments); } finally { toast = T; }
  if (run && runSig() !== sig) {
    const items = []; for (const id of new Set([...Object.keys(b0), ...Object.keys(S.bank)])) { const d = have(id) - (b0[id] || 0); if (d > 0 && ITEMS[id]) items.push([id, d]); }
    const uniq = new Set(run.A?.uniques?.() || (run.key === 'barrows' ? BARROWS.flatMap(b => b.pieces.map(p => p[0])) : []));
    items.sort((a, b) => (uniq.has(b[0]) - uniq.has(a[0])) || (ITEMS[b[0]].value * b[1] - ITEMS[a[0]].value * a[1]));
    const notes = cap.map(a => String(a[0])).filter(t => /pet|Pet|follow/.test(t));
    const Q = S.runChests ||= []; Q.push({ k: run.key, name: run.name, icon: run.icon, n: run.key === 'barrows' ? S.barrows.chests : run.key === 'pc' ? S.pc?.games : S.raids?.[run.key], coins: Math.max(0, S.coins - c0), items, purple: items.some(([id]) => uniq.has(id) || ITEMS[id].rare), notes });
    if (Q.length > 30) Q.splice(0, Q.length - 30);
    if (!OFF) { const p = Q[Q.length - 1].purple; T(`🎁 ${run.icon} ${run.name} complete!${p ? ' <b class="y">Something shiny inside…</b>' : ''} Tap the chest to open it.`, p ? 'pet' : 'rare', 5000); }
  } else cap.forEach(a => T(...a));
  return r;
};
raidKill = chestWrap(raidKill);
barrowsKill = chestWrap(barrowsKill);

function chestModal(all) {
  const Q = S.runChests || []; if (!Q.length) return closeModal();
  const list = all ? Q.splice(0) : [Q.shift()];
  const coins = list.reduce((a, c) => a + c.coins, 0), items = {};
  list.forEach(c => c.items.forEach(([id, q]) => items[id] = (items[id] || 0) + q));
  const purple = list.some(c => c.purple), c0 = list[0], rest = Q.length;
  const rows = Object.entries(items).sort((a, b) => (ITEMS[b[0]].rare ? 1 : 0) - (ITEMS[a[0]].rare ? 1 : 0) || ITEMS[b[0]].value * b[1] - ITEMS[a[0]].value * a[1]);
  const notes = list.flatMap(c => c.notes || []);
  openModal(`<div class="item-modal chest-modal ${purple ? 'purple' : ''}"><h2>${all && list.length > 1 ? `🎁 ${list.length} chests` : `${c0.icon} ${c0.name}`}</h2>
    <p class="muted small">${all && list.length > 1 ? 'All your unopened chests' : `Clear #${fmt(c0.n || 0)}`}</p>
    <div class="chest-anim"><span>${purple ? '💜' : '🎁'}</span></div>
    <div class="chest-loot">${coins ? `<div class="cl-row" style="--d:0"><span class="emo">🪙</span><b>${fmt(coins)} coins</b></div>` : ''}
      ${rows.map(([id, q], k) => `<div class="cl-row ${ITEMS[id].rare ? 'purple' : ''}" style="--d:${k + 1}" data-act="info" data-id="${id}">${itemIcon(id)}<b>${q > 1 ? fmt(q) + ' × ' : ''}${ITEMS[id].name}</b></div>`).join('')}
      ${notes.map((t, k) => `<div class="cl-row purple" style="--d:${rows.length + k + 1}">${t}</div>`).join('')}
      ${!coins && !rows.length ? '<div class="cl-row muted" style="--d:0">Just glory this time.</div>' : ''}</div>
    <div class="row-btns">${rest ? `<button class="btn big" data-act="chest-next">Open next (${rest})</button>${rest > 1 ? `<button class="btn" data-act="chest-all">Open all</button>` : ''}` : '<button class="btn big" data-act="close">Collect</button>'}</div>
    <p class="tiny muted">The loot is already in your bank: the chest just shows you what the run gave.</p></div>`);
  if (purple) SFX.play('pet'); else SFX.play('coin');
  UI.force = true;
}
viewCombat = (orig => function () {
  const n = (S.runChests || []).length; const h = orig(); if (!n) return h;
  const p = S.runChests.some(c => c.purple);
  return h.replace('<div class="fight-btns">', `<div class="fight-btns"><button class="btn chest-btn ${p ? 'purple' : ''}" data-act="chest-next" title="Open your run chests">🎁<b>${n}</b></button>`);
})(viewCombat);
VIEWS.combat = (orig => function () { return rebrand(orig()); })(viewCombat);
viewSig = (orig => function () { return UI.view === 'combat' ? orig() + '|c' + (S.runChests || []).length + S.combat.mon + (curMon().order ?? '') + S.barrows.killed.length : orig(); })(viewSig);

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
  if (a === 'chest-next' || a === 'chest-all') { e.stopImmediatePropagation(); chestModal(a === 'chest-all'); }
}, true);
function boot39() { boot38(); UI.force = true; render(); }

// guard: an unknown skill id (e.g. a stale link) falls back to the skills page instead of throwing
viewSkill = (orig => function () { const sk = UI.skill; if (sk !== 'farming' && !COMBAT_SKILLS.includes(sk) && !SKILL_STATIONS[sk]) { UI.view = 'skills'; return VIEWS.skills(); } return orig(); })(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);
