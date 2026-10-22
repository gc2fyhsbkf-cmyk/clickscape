'use strict';
function fmtRange(lo, hi) { return lo === hi ? fmt(lo) : `${fmt(lo)}–${fmt(hi)}`; }
/* =========================================================
   CLICKSCAPE v9.46 — every skill action explains itself (ⓘ: what it needs, makes and can drop,
   with loot tables for thieving, implings and crates), loot previews on thieving & impling rows,
   implings toned down, and skill/combat pages stop redrawing on every level-up (the flicker)
   ========================================================= */

/* ---------- 1) no more flicker: pages only redraw when something on them actually changes ---------- */
// the skill and combat pages redrew completely whenever ANY skill levelled up, which at high speed
// is every few seconds (the chips and drawers under the stage flickered). Levels shown on screen
// update live anyway; the page now only redraws when this skill unlocks something new.
const LV_STR = () => SKILL_ORDER.map(s => LV[s]).join(',');
viewSig = (orig => function () {
  const s = orig(); if (UI.view !== 'skill' && UI.view !== 'combat') return s;
  const lv = LV_STR(); if (!s.startsWith(lv)) return s;
  let key;
  if (UI.view === 'skill') { const sk = UI.skill, nx = typeof nextUnlock === 'function' ? nextUnlock(sk) : null; key = `${sk}:${nx ? nx.lvl : 'max'}:${prest(sk)}`; }
  else key = `c${combatLevel()}:${LV.slayer}:${Math.floor(LV.prayer / 5)}`;
  return key + s.slice(lv.length);
})(viewSig);

/* ---------- 2) implings were paying far more than any other gathering ---------- */
(function () {
  const T = IMP_LOOT, set = (k, id, a, b) => { const r = T[k]?.find(x => x[0] === id); if (r) { r[1] = a; r[2] = b; } };
  set('crystal', 'coins', 4000, 15000); set('dragon', 'coins', 2000, 7000); set('ninja', 'coins', 600, 3000);
  for (const k of ['crystal', 'dragon']) for (const r of T[k] || []) if (/^scroll_/.test(r[0])) { r[1] = Math.max(1, Math.round(r[1] / 2)); r[2] = Math.max(2, Math.round(r[2] / 2)); }
})();

/* ---------- 3) what does this action do? ---------- */
const nm = id => ITEMS[id]?.name || id;
const ic = id => ITEMS[id] ? itemIcon(id) : '<span class="emo">❔</span>';
const oneIn = p => p >= 1 ? 'always' : `1 in ${fmt(Math.max(1, Math.round(1 / p)))}`;
function blurb(id) {
  const it = ITEMS[id]; if (!it) return '';
  if (it.heal) return `heals ${it.heal}`;
  if (it.potion) return 'combat potion';
  if (it.cat === 'tool' && it.mult) return `${it.slot} · power ×${it.mult}`;
  if (it.slot) { const s = [['atk', 'atk'], ['str', 'str'], ['def', 'def'], ['ratk', 'rng'], ['matk', 'mag']].filter(([k]) => it[k] > 0).map(([k, n]) => `+${fmt(it[k])} ${n}`).join(' '); return `${it.slot}${s ? ' · ' + s : ''}`; }
  if (it.open) return 'open it for loot';
  return `worth 🪙${fmt(it.value || 0)}`;
}
const itemLine = (id, q, extra) => `<button class="ai-row" data-act="info" data-id="${id}">${ic(id)}<span><b>${q ? q + ' × ' : ''}${nm(id)}</b><small>${[blurb(id), extra].filter(Boolean).join(' · ')}</small></span>${have(id) ? `<em>own ${fmt(have(id))}</em>` : ''}</button>`;
function lootRows(a) {
  const out = [];
  if (a.thieve) {
    const t = a.thieve;
    if (t.coins) out.push(`<div class="ai-row plain"><span class="emo">🪙</span><span><b>${fmtRange(t.coins[0], t.coins[1])} coins</b><small>every success</small></span></div>`);
    for (const [id, ch, lo, hi] of t.loot || []) {
      if (id === 'seedtable' || id === 'gemtable') { out.push(`<div class="ai-row plain"><span class="emo">${id === 'seedtable' ? '🌱' : '💎'}</span><span><b>A random ${id === 'seedtable' ? 'seed' : 'gem'}</b><small>${oneIn(ch * (M.luck || 1))}</small></span></div>`); continue; }
      out.push(itemLine(id, lo === hi ? lo : `${lo}–${hi}`, oneIn(ch >= 1 ? 1 : ch * (M.luck || 1))));
    }
    out.push(`<div class="ai-row plain"><span class="emo">🦹</span><span><b>Rogue outfit piece</b><small>1 in ${fmt(Math.round(700 / (M.luck || 1)))} successes</small></span></div>`);
    if (t.clue) out.push(itemLine('clue_' + t.clue[0], 0, oneIn(t.clue[1] * (M.luck || 1))));
  }
  const imp = Object.keys(a.out || {}).map(id => /^([a-z]+)_impling_jar$/.exec(id)).find(Boolean);
  if (imp && IMP_LOOT[imp[1]]) { const T = IMP_LOOT[imp[1]]; out.push('<p class="small muted">Each jar you open gives one of these:</p>'); for (const [id, lo, hi, ch] of T) out.push(id === 'coins' ? `<div class="ai-row plain"><span class="emo">🪙</span><span><b>${fmtRange(lo, hi)} coins</b><small>${oneIn((ch || 1) / T.length)}</small></span></div>` : itemLine(id, lo === hi ? lo : `${lo}–${hi}`, oneIn((ch || 1) / T.length))); }
  if (a.crateDef && CRATES[a.crateDef[0]]) { const C = CRATES[a.crateDef[0]]; out.push(`<p class="small muted">Your own taps: ${oneIn(a.crateDef[1] * (M.luck || 1))} per action earns a ${nm(a.crateDef[0])}, which holds two of:</p>`); for (const [id, lo, hi] of C.loot) if (hi > 0) out.push(id === 'coins' ? `<div class="ai-row plain"><span class="emo">🪙</span><span><b>${fmtRange(lo, hi)} coins</b></span></div>` : itemLine(id, lo === hi ? lo : `${lo}–${hi}`)); if (C.outfit) out.push(`<div class="ai-row plain"><span class="emo">👷</span><span><b>${OUTFITS[C.outfit]?.[2] || ''} outfit piece</b><small>very rare</small></span></div>`); }
  return out.join('');
}
function actInfo(id) {
  const a = ACTIONS[id]; if (!a) return; const st = a.st, S0 = STATIONS[st], sk = S0?.skill;
  const perMinute = M.rate[st] > 0 ? M.rate[st] * frenzy() / a.hp * 60 : 0;
  const inp = Object.entries(a.inp || {}), out = Object.entries(a.out || {});
  const bd = BONUS_DROPS[st];
  const pets = Object.entries(PETS).filter(([, p]) => p.st === st && p.chance);
  const loot = lootRows(a);
  openModal(`<div class="item-modal act-info"><h2>${ic(a.icon)} ${a.name}</h2>
    <p class="small muted">${SKILLS[sk]?.icon || ''} ${SKILLS[sk]?.name || ''} level ${a.lvl} · ${fmtD(a.xp)} XP each · effort ${fmt(a.hp)}${perMinute ? ` · your workers: ~${fmt(perMinute)}/min` : ''}${a.thieve ? ` · ${Math.round(thieveChance(a) * 100)}% success` : ''}${a.burn ? ` · stops burning at level ${a.burn - (has('gauntlets') ? 10 : 0)}` : ''}</p>
    ${inp.length ? `<h3>Needs (each)</h3><div class="ai-list">${inp.map(([i, q]) => itemLine(i, q, have(i) < q ? '<span class="r">not enough</span>' : '')).join('')}</div>` : ''}
    ${out.length && !a.thieve ? `<h3>${a.inp ? 'Makes' : 'Gathers'}</h3><div class="ai-list">${out.map(([i, q]) => itemLine(i, q)).join('')}</div>` : ''}
    ${loot ? `<h3>${a.thieve ? 'Loot' : 'Inside'}</h3><div class="ai-list">${loot}</div>` : ''}
    ${bd || pets.length ? `<h3>Also at the ${S0.name}</h3><div class="ai-list">${bd ? bd.table.map(([i]) => itemLine(i, 0, `rare find (${oneIn(bd.chance * (M.luck || 1))} per action)`)).join('') : ''}${pets.map(([, p]) => `<div class="ai-row plain"><span class="emo">${p.icon}</span><span><b>${p.name}</b><small>pet · ${oneIn(p.chance * (M.luck || 1))} · ${p.desc}</small></span></div>`).join('')}</div>` : ''}
    <p class="tiny muted">Tap any item for what it's used for.</p>
    <div class="row-btns"><button class="btn big" data-act="target" data-st="${st}" data-id="${id}">Work on this</button><button class="btn" data-act="close">Close</button></div></div>`);
}
// an ⓘ on every action row, and a loot preview on thieving & impling rows
viewSkill = (orig => function () {
  return orig().replace(/(<button class="act-row[^"]*" data-act="target" data-st="([a-z_]+)" data-id="([a-z0-9_]+)">)([\s\S]*?)(<\/button>)/g, (m, open, st, id, body, close) => {
    const a = ACTIONS[id]; if (!a) return m;
    let prev = '';
    if (a.thieve) { const L = (a.thieve.loot || []).map(x => x[0]).filter(x => ITEMS[x]).slice(0, 6); if (L.length) prev = `<span class="ar-loot">Loot: ${L.map(ic).join('')}${a.thieve.coins ? ' 🪙' : ''}</span>`; }
    const imp = Object.keys(a.out || {}).map(i => /^([a-z]+)_impling_jar$/.exec(i)).find(Boolean);
    if (imp && IMP_LOOT[imp[1]]) prev = `<span class="ar-loot">Jar holds: 🪙 ${IMP_LOOT[imp[1]].filter(x => x[0] !== 'coins' && ITEMS[x[0]]).slice(0, 5).map(x => ic(x[0])).join('')}</span>`;
    if (a.crateDef && CRATES[a.crateDef[0]]) prev = `<span class="ar-loot">Taps earn: ${ic(a.crateDef[0])} ${CRATES[a.crateDef[0]].loot.filter(x => x[0] !== 'coins' && ITEMS[x[0]] && x[2] > 0).slice(0, 4).map(x => ic(x[0])).join('')}</span>`;
    const b2 = prev ? body.replace(/(<\/span>)(\s*)(<span class="ar-have">|$)/, `${prev}$1$2$3`) : body;
    return `${open}${b2.includes('ar-loot') || !prev ? b2 : b2 + prev}<span class="ar-info" data-act="actinfo" data-id="${id}" role="button" aria-label="Details">ⓘ</span>${close}`;
  });
})(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="actinfo"]'); if (!t) return; e.stopImmediatePropagation(); e.preventDefault(); actInfo(t.dataset.id);
}, true);
// the action window's "Work on this" also closes it
document.addEventListener('click', e => { const t = e.target.closest('.act-info [data-act="target"]'); if (t) setTimeout(() => closeModal(), 0); }, true);

function boot67() { boot66(); UI.force = true; render(); }
