'use strict';
/* =========================================================
   CLICKSCAPE v9.47 — boss mechanics that ask for skill (tap race, sequence pads, prayer call,
   weak spot; enrage makes them come faster and hit harder), the crypt chest less generous,
   and bosses drop the next crafted metal tiers so higher levels have loot worth chasing
   ========================================================= */

/* ================= LOOT ================= */
// Crypt (Barrows) chest: a piece was 1 in 12 × your full luck, so 10 quick chests meant a pile of
// level-70 armour. Now 1 in 18, and luck counts at its square root for this roll
barrowsKill = (orig => function () { const L = M.luck; M.luck = Math.sqrt(L || 1) * 12 / 18; try { return orig.apply(this, arguments); } finally { M.luck = L; } })(barrowsKill);
// bosses drop the next crafted metal for their level: a weapon (1/300) and an armour piece (1/400)
(function () {
  const BAND = [[175, 300, 'primal'], [300, 600, 'void'], [600, 1000, 'ascended'], [1000, 1600, 'exalted'], [1600, 2400, 'divine'], [2400, 4000, 'eternal']];
  const ARM = ['full_helm', 'platelegs', 'kiteshield', 'platebody']; let i = 0;
  for (const m of MONSTERS) {
    if (!m.boss || m.raid || m.season || !(m.drops || []).length) continue;
    const band = BAND.find(([lo, hi]) => m.lvl >= lo && m.lvl < hi); if (!band) continue; const metal = band[2];
    if (m.drops.some(d => d[0].startsWith(metal + '_'))) continue;
    const w = `${metal}_scimitar`, a = `${metal}_${ARM[i++ % 4]}`;
    if (ITEMS[w]) { m.drops.push([w, 1 / 300, 1, 1]); (SOURCES[w] ||= []).push(`${m.name} (1/300)`); }
    if (ITEMS[a]) { m.drops.push([a, 1 / 400, 1, 1]); (SOURCES[a] ||= []).push(`${m.name} (1/400)`); }
  }
})();

/* ================= BOSS MECHANICS 2.0 ================= */
// only while you watch a boss fight. One at a time, every 8–14s (5–8s when enraged):
//  ⚡ Tap race  – the boss charges a big hit; tap the bar fast to drain it. Empty = interrupted (+counter), full = heavy hit
//  🔢 Sequence  – three pads light up numbered; tap them in order for a 3× critical, miss = a hit
//  🙏 Prayer call – the boss shows its style; tap the matching protection in time to block a heavy hit
//  🎯 Weak spot – tap the target for a 3× critical
BM.next = Infinity; // the old wind-up/weak-spot loop is retired
const BM2 = { cur: null, next: 0 };
const bm2Boss = () => { const m = curMon(); return S.combat?.fighting && m?.boss && S.combat.mhp > 0 && S.combat.hp > 0 ? m : null; };
const bm2Rage = () => { const C = S.combat; return !!bm2Boss() && C.mmax > 0 && C.mhp / C.mmax < 0.25; };
function heavyHit(f, label) {
  const C = S.combat, m = curMon(); if (!m) return;
  let dmg = Math.round(enemyMaxHit(m) * f * (bm2Rage() ? 1.5 : 1) * (1 - reduction()));
  dmg = Math.min(dmg, Math.ceil(maxHp() * 0.6)); // never a one-shot from full
  C.hp -= dmg; splat('p', dmg); SFX.play('hurt'); toast(`💥 ${label}: ${fmt(dmg)} damage!`, 'warn', 2200);
  for (let k = 0; k < 3 && C.hp > 0 && C.hp <= maxHp() * 0.5; k++) if (!autoEat()) break;
  if (C.hp <= 0) die();
}
function bm2Win(text, crit) {
  if (crit) { const d = playerAttack(true, 3); toast(`${text} Critical hit for ${fmt(d || 0)}!`, 'rare', 2200); }
  else { BM.counter = Date.now() + 5000; toast(`${text} Counter: +50% damage for 5s.`, 'rare', 2200); }
  try { SFX.play('spec'); } catch (e) {}
}
const BM2_STYLES = [['melee', '🗡️', 'Melee'], ['ranged', '🏹', 'Ranged'], ['magic', '🔮', 'Magic']];
function bm2Start() {
  const m = bm2Boss(); if (!m) return; const t = Date.now(), rage = bm2Rage();
  const pick = ['race', 'seq', 'pray', 'weak'][Math.floor(Math.random() * 4)];
  if (pick === 'race') BM2.cur = { k: 'race', bar: 35, until: t + 6000, last: t };
  if (pick === 'seq') { const o = [0, 1, 2].sort(() => Math.random() - 0.5); BM2.cur = { k: 'seq', order: o, step: 0, until: t + (rage ? 2600 : 3400) }; }
  if (pick === 'pray') BM2.cur = { k: 'pray', style: BM2_STYLES[Math.floor(Math.random() * 3)][0], until: t + (rage ? 2800 : 3600) };
  if (pick === 'weak') BM2.cur = { k: 'weak', x: 18 + Math.random() * 64, y: 20 + Math.random() * 45, until: t + (rage ? 1500 : 1900) };
  BM2.cur.t0 = t; bm2Draw(true);
}
function bm2End(next) { BM2.cur = null; BM2.next = Date.now() + (bm2Rage() ? 5000 + Math.random() * 3000 : 8000 + Math.random() * 6000) + (next || 0); bm2Draw(true); }
function bm2Draw(force) {
  const st = $('#mstage'); if (!st) return; let el = st.querySelector('.bm2'); if (!el) { el = document.createElement('div'); el.className = 'bm2'; st.appendChild(el); force = true; }
  const c = BM2.cur, t = Date.now();
  if (!c) { if (el.innerHTML) el.innerHTML = ''; return; }
  const left = Math.max(0, c.until - t), m = curMon();
  if (c.k === 'race') {
    if (force || !el.querySelector('.bm2-race')) el.innerHTML = `<div class="bm2-panel"><b>⚡ ${m.name} is charging up!</b><small>Tap the bar as fast as you can</small></div><button class="bm2-race" data-bm2="race"><i></i><span>TAP! TAP! TAP!</span></button>`;
    el.querySelector('.bm2-race i').style.width = c.bar + '%'; el.querySelector('.bm2-race').classList.toggle('hot', c.bar > 70);
    return;
  }
  if (!force) return; // the rest are static until something changes
  const timer = `<i class="bm2-timer" style="animation-duration:${left}ms"></i>`;
  if (c.k === 'seq') el.innerHTML = `<div class="bm2-panel"><b>🔢 Strike the runes in order!</b><small>Tap 1 → 2 → 3</small>${timer}</div><div class="bm2-pads">${[0, 1, 2].map(p => { const n = c.order.indexOf(p) + 1, done = c.order.indexOf(p) < c.step; return `<button class="bm2-pad ${done ? 'done' : ''}" data-bm2="pad" data-p="${p}">${done ? '✓' : n}</button>`; }).join('')}</div>`;
  if (c.k === 'pray') { const s = BM2_STYLES.find(x => x[0] === c.style); el.innerHTML = `<div class="bm2-panel pray-${c.style}"><b>${s[1]} ${m.name} readies a ${s[2].toLowerCase()} attack!</b><small>Pray against it</small>${timer}</div><div class="bm2-prays">${BM2_STYLES.map(([k, i, n]) => `<button class="bm2-pr" data-bm2="pray" data-s="${k}"><span>${i}</span><small>Protect from ${n}</small></button>`).join('')}</div>`; }
  if (c.k === 'weak') el.innerHTML = `<button class="bm2-weak" data-bm2="weak" style="left:${c.x}%;top:${c.y}%"><span>🎯</span></button><div class="bm2-tip">Weak spot!</div>`;
}
setInterval(() => {
  if (UI.view !== 'combat' || document.hidden || OFF) { if (BM2.cur) BM2.cur = null; return; }
  BM.next = Infinity; BM.phase = null;
  const m = bm2Boss(), t = Date.now(), c = BM2.cur;
  if (!m) { if (c) { BM2.cur = null; } bm2Draw(); return; }
  if (!BM2.next) BM2.next = t + 6000 + Math.random() * 4000;
  if (!c) { if (t > BM2.next) bm2Start(); else bm2Draw(); return; }
  if (c.k === 'race') {
    const dt = (t - c.last) / 1000; c.last = t; c.bar = Math.min(100, c.bar + dt * (bm2Rage() ? 30 : 22));
    if (c.bar >= 100) { heavyHit(2.5, `${m.name}'s charged blow`); bm2End(); return; }
    if (t > c.until) { bm2Win('⚡ You held it off!'); bm2End(); return; }
  } else if (t > c.until) {
    if (c.k === 'seq') heavyHit(1.8, `${m.name}'s strike`);
    if (c.k === 'pray') heavyHit(2.5, `${m.name}'s ${c.style} attack`);
    bm2End(); return;
  }
  bm2Draw();
}, 100);
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('[data-bm2]'); if (!b) return; e.preventDefault(); e.stopImmediatePropagation();
  const c = BM2.cur; if (!c) return; const k = b.dataset.bm2;
  if (k === 'race' && c.k === 'race') { c.bar = Math.max(0, c.bar - 7); b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); if (c.bar <= 0) { bm2Win('⚡ Interrupted!'); bm2End(); } else bm2Draw(); return; }
  if (k === 'pad' && c.k === 'seq') { const p = +b.dataset.p; if (c.order[c.step] === p) { c.step++; if (c.step >= 3) { bm2Win('🔢 Perfect sequence!', true); bm2End(); } else bm2Draw(true); } else { heavyHit(1.8, 'Wrong rune'); bm2End(); } return; }
  if (k === 'pray' && c.k === 'pray') { if (b.dataset.s === c.style) { BM.counter = Date.now() + 3000; toast('🙏 Blocked! Counter: +50% damage for 3s.', 'rare', 2000); try { SFX.play('spec'); } catch (er) {} } else heavyHit(2.5, `Wrong prayer! ${curMon()?.name || 'The boss'}`); bm2End(); return; }
  if (k === 'weak' && c.k === 'weak') { bm2Win('🎯 Weak spot!', true); bm2End(); }
}, { capture: true, passive: false });
// the taps on the overlay must never count as clicks elsewhere
document.addEventListener('click', e => { if (e.target.closest('[data-bm2]')) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
// the monster window describes the new mechanics
openMonsterInfo = (orig => function (id) {
  orig(id); const p = $('#modal .bm-info'); if (p) p.innerHTML = '⚔️ <b>Boss mechanics</b> (while you watch): ⚡ tap race to stop a charged blow, 🔢 tap three runes in order, 🙏 call the right protection prayer, 🎯 hit the weak spot. Below 25% health it enrages: mechanics come faster and failures hurt more.';
})(openMonsterInfo);

function boot68() { boot67(); }
