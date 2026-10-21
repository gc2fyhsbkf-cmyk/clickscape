'use strict';
/* =========================================================
   CLICKSCAPE v9.18 — Worker specialists: some hires turn out to be named specialists
   with a trait. They level up while their station works, and at level 10 one per station
   can be promoted to Foreman (trait doubled). Specialists stay with you forever.
   ========================================================= */

const SPEC_NAMES = ['Bram', 'Elsa', 'Tobin', 'Mira', 'Hask', 'Wren', 'Odo', 'Fen', 'Ilsa', 'Corin', 'Maud', 'Pip', 'Rook', 'Tamsin', 'Garrick', 'Nell', 'Osric', 'Dara', 'Bryn', 'Ivo', 'Juno', 'Ketter', 'Lark', 'Agnes', 'Bertil', 'Cass', 'Dunstan', 'Edda', 'Fitch', 'Greta', 'Hob', 'Isolde', 'Jory', 'Kit', 'Leofric', 'Mab', 'Ned', 'Orla', 'Percival', 'Quill', 'Rosamund', 'Silas', 'Thea', 'Ulf', 'Vesna', 'Wat', 'Yara', 'Zeb'];
const TRAITS = {
  swift:     { icon: '⚡', name: 'Swift',     w: 5, desc: v => `+${fmt(v * 100)}% speed at this station`, val: l => 0.10 + 0.02 * l },
  mentor:    { icon: '📘', name: 'Mentor',    w: 4, desc: v => `+${fmt(v * 100)}% XP in this skill`, val: l => 0.05 + 0.015 * l },
  handson:   { icon: '👆', name: 'Hands-on',  w: 3, desc: v => `+${fmt(v * 100)}% tap power at this station`, val: l => 0.2 + 0.04 * l },
  inspiring: { icon: '📣', name: 'Inspiring', w: 3, desc: v => `+${fmtD(v * 100)}% speed per worker here (up to +30%)`, val: l => 0.003 + 0.0005 * l },
  lucky:     { icon: '🍀', name: 'Lucky',     w: 2, desc: v => `+${fmtD(v * 100)}% rare drops everywhere`, val: l => 0.02 + 0.005 * l },
  haggler:   { icon: '🪙', name: 'Haggler',   w: 2, desc: v => `+${fmtD(v * 100)}% sell prices`, val: l => 0.02 + 0.005 * l },
  nightowl:  { icon: '🦉', name: 'Night owl', w: 1, desc: v => `+${fmtD(v)}h offline limit`, val: l => 0.25 + 0.05 * l },
};
const SPEC_MAX = 3;
const specs = st => (S.lifetime.spec ||= {})[st] ||= [];
const specLvl = sp => Math.min(10, 1 + Math.floor(Math.sqrt((sp.xp || 0) / 1200)));
const specVal = sp => TRAITS[sp.tr].val(specLvl(sp)) * (sp.fore ? 1.5 : 1);
const specActive = st => (S.workers?.[st] || 0) > 0;          // they work alongside your workers
const specTitle = sp => `${sp.n} the ${TRAITS[sp.tr].name}`;
function rollSpec(st) {
  const tot = Object.values(TRAITS).reduce((a, t) => a + t.w, 0); let r = Math.random() * tot, tr = 'swift';
  for (const [k, t] of Object.entries(TRAITS)) { if ((r -= t.w) <= 0) { tr = k; break; } }
  const used = new Set(Object.values(S.lifetime.spec || {}).flat().map(s => s.n));
  const names = SPEC_NAMES.filter(n => !used.has(n)); const n = (names.length ? names : SPEC_NAMES)[Math.floor(Math.random() * (names.length || SPEC_NAMES.length))];
  return { n, tr, xp: 0, fore: false, st };
}
// each worker you hire has a small chance to be a specialist (rarer once a station already has some)
hire = (orig => function (st, k) {
  const n0 = S.workers[st] || 0; const r = orig(st, k); const got = (S.workers[st] || 0) - n0;
  if (got > 0 && STATIONS[st] && specs(st).length < SPEC_MAX) {
    const p = 0.02 / (1 + specs(st).length), chance = 1 - Math.pow(1 - p, got);
    if (Math.random() < chance) {
      const sp = rollSpec(st); specs(st).push(sp); recalc();
      const T = TRAITS[sp.tr], msg = `${T.desc(specVal(sp))} at the ${STATIONS[st].name}`;
      if (typeof fanBanner === 'function') fanBanner('<span class="emo">⭐</span>', `Specialist hired: ${specTitle(sp)}!`, msg); else toast(`⭐ Specialist hired: ${specTitle(sp)}! ${msg}`, 'pet', 6000);
      UI.force = true;
    }
  }
  return r;
})(hire);

/* ---------- effects ---------- */
function specSum(tr) { let v = 0; for (const st in (S.lifetime?.spec || {})) if (specActive(st)) for (const sp of S.lifetime.spec[st]) if (sp.tr === tr) v += specVal(sp); return v; }
recalc4 = (orig => function () {
  orig(); if (!S?.lifetime?.spec) return;
  for (const st in S.lifetime.spec) {
    if (!specActive(st) || M.rate[st] === undefined) continue;
    const r0 = M.rate[st];
    for (const sp of S.lifetime.spec[st]) {
      const v = specVal(sp);
      if (sp.tr === 'swift') M.rate[st] *= 1 + v;
      else if (sp.tr === 'handson' && M.tap?.[st] !== undefined) M.tap[st] *= 1 + v;
      else if (sp.tr === 'inspiring') M.rate[st] *= 1 + Math.min(0.3, v * (S.workers[st] || 0));
    }
    if (r0 > 0) M.rate[st] = Math.min(M.rate[st], r0 * 1.6); // specialists add at most +60% speed per station
  }
  M.luck *= 1 + Math.min(0.3, specSum('lucky'));
  M.sell *= 1 + Math.min(0.2, specSum('haggler'));
})(recalc4);
gainXP = (orig => function (skill, amt) {
  const SP = S?.lifetime?.spec; if (SP) { let k = 0; for (const st in SP) if (STATIONS[st]?.skill === skill && specActive(st)) for (const sp of SP[st]) if (sp.tr === 'mentor') k += specVal(sp); if (k) amt *= 1 + k; }
  return orig(skill, amt);
})(gainXP);
offlineHours = (orig => function () { return Math.min(OFF_MAX, orig() + Math.min(4, specSum('nightowl'))); })(offlineHours);
offlineParts = (orig => function () { const P = orig(); const v = Math.min(4, specSum('nightowl')); if (v) P.push(['🦉 Night owls', +v.toFixed(2)]); return P; })(offlineParts);

// specialists learn on the job: faster with a bigger crew
let specT = 0;
tickCore = (orig => function (dt) {
  orig(dt); specT += dt; if (specT < 10) return; const d = specT; specT = 0;
  const SP = S.lifetime?.spec; if (!SP) return; let up = false;
  for (const st in SP) {
    if (!specActive(st) || !(M.rate?.[st] > 0)) continue;
    for (const sp of SP[st]) {
      const l0 = specLvl(sp); if (l0 >= 10) continue;
      sp.xp = (sp.xp || 0) + d * (1 + (S.workers[st] || 0) / 20);
      const l1 = specLvl(sp); if (l1 > l0) { up = true; const msg = `⭐ ${specTitle(sp)} reached level ${l1}${l1 === 10 ? ': ready to be promoted to Foreman!' : ''}`; if (OFF) OFFLOG.push(msg); else toast(msg, l1 === 10 ? 'pet' : 'rare', 5000); }
    }
  }
  if (up) recalc();
})(tickCore);

/* ---------- station panel ---------- */
function specPanel(st) {
  const L = specs(st), on = specActive(st);
  const rows = L.map((sp, i) => {
    const T = TRAITS[sp.tr], l = specLvl(sp), nxt = l < 10 ? Math.pow(l, 2) * 1200 : 0, prv = Math.pow(l - 1, 2) * 1200;
    const pct = l >= 10 ? 100 : Math.min(100, 100 * ((sp.xp || 0) - prv) / (nxt - prv));
    const canPro = l >= 10 && !sp.fore && !L.some(x => x.fore);
    return `<div class="spec ${sp.fore ? 'fore' : ''} ${on ? '' : 'off'}"><span class="spec-icon">${T.icon}</span><div class="spec-main"><b>${sp.fore ? '👑 Foreman ' : ''}${specTitle(sp)}</b>
      <small>Lv ${l}/10 · ${T.desc(specVal(sp))}</small><div class="bar"><i style="width:${pct}%"></i></div></div>
      <div class="spec-btns">${canPro ? `<button class="btn small glow" data-act="spec-pro" data-st="${st}" data-i="${i}">Promote</button>` : ''}<button class="btn small" data-act="spec-drop" data-st="${st}" data-i="${i}" title="Dismiss">✕</button></div></div>`;
  }).join('');
  return `<div class="panel spec-panel"><h3>⭐ Specialists <small class="muted">· ${L.length}/${SPEC_MAX} · kept forever</small></h3>
    ${rows || '<p class="small muted">Every worker you hire has a small chance to be a <b>specialist</b> with a trait (Swift, Mentor, Lucky…). They level up while this station works.</p>'}
    ${L.length && !on ? '<p class="small cb-red">Hire at least one worker here to put your specialists back to work.</p>' : ''}
    ${L.length ? '<p class="tiny muted">At level 10, promote one to <b>Foreman</b> for +50% on their trait.</p>' : ''}</div>`;
}
viewSkill = (orig => function () {
  const h = orig(), st = UI.curStation; if (!st || !STATIONS[st] || UI.skill === 'farming' || UI.skill === 'sailing' || COMBAT_SKILLS.includes(UI.skill)) return h;
  const i = h.indexOf('<div class="panel small muted worker-note">');
  return i >= 0 ? h.slice(0, i) + specPanel(st) + h.slice(i) : h.replace('<div class="list">', specPanel(st) + '<div class="list">');
})(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);
viewSig = (orig => function () {
  if (UI.view !== 'skill') return orig();
  const L = S.lifetime?.spec?.[UI.curStation] || []; return orig() + '|sp' + L.map(sp => specLvl(sp) + sp.tr + (sp.fore ? 'F' : '')).join() + specActive(UI.curStation);
})(viewSig);
// roster on the Character page
viewCharacter = (orig => function () {
  const all = Object.entries(S.lifetime?.spec || {}).flatMap(([st, L]) => L.map(sp => [st, sp])); const h = orig(); if (!all.length) return h;
  return h + `<div class="panel"><h3>⭐ Your specialists <small class="muted">· ${all.length}</small></h3>${all.map(([st, sp]) => `<div class="spec small ${specActive(st) ? '' : 'off'}"><span class="spec-icon">${TRAITS[sp.tr].icon}</span><div class="spec-main"><b>${sp.fore ? '👑 ' : ''}${specTitle(sp)}</b><small>${STATIONS[st]?.name} · Lv ${specLvl(sp)} · ${TRAITS[sp.tr].desc(specVal(sp))}</small></div></div>`).join('')}</div>`;
})(viewCharacter);
VIEWS.character = (orig => function () { return rebrand(orig()); })(viewCharacter);

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
  if (a !== 'spec-pro' && a !== 'spec-drop') return;
  e.stopImmediatePropagation(); const L = specs(t.dataset.st), sp = L[+t.dataset.i]; if (!sp) return;
  if (a === 'spec-pro') { if (specLvl(sp) < 10 || L.some(x => x.fore)) return; sp.fore = true; recalc(); if (typeof fanLegend === 'function') fanLegend({ kind: '👑 PROMOTED 👑', icon: `<span class="emo">${TRAITS[sp.tr].icon}</span>`, name: `Foreman ${sp.n}`, sub: `${TRAITS[sp.tr].desc(specVal(sp))} at the ${STATIONS[t.dataset.st].name}` }); }
  else { if (UI.specDrop !== sp.n) { UI.specDrop = sp.n; setTimeout(() => { if (UI.specDrop === sp.n) UI.specDrop = null; }, 3000); return toast(`Tap ✕ again to dismiss ${specTitle(sp)} for good.`, 'warn', 3000); } L.splice(+t.dataset.i, 1); UI.specDrop = null; recalc(); toast(`${sp.n} packs up and leaves.`); }
  UI.force = true; render();
}, true);
function boot42() { boot41(); recalc(); UI.force = true; render(); }

