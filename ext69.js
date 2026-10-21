'use strict';
/* =========================================================
   CLICKSCAPE v9.48 — three more boss mechanics: ↔️ dodge (tap the safe side), 🛡️ hold the shield
   through a breath attack, 👹 adds (tap the minions away before they heal the boss)
   ========================================================= */
const BM3_KINDS = ['dodge', 'hold', 'adds'];
bm2Start = (orig => function () {
  // 7 mechanics in the mix: the 4 originals and 3 new ones
  if (Math.random() < 4 / 7) return orig.apply(this, arguments);
  const m = bm2Boss(); if (!m) return; const t = Date.now(), rage = bm2Rage(), k = BM3_KINDS[Math.floor(Math.random() * 3)];
  if (k === 'dodge') BM2.cur = { k, side: Math.random() < 0.5 ? 'left' : 'right', dl: t + (rage ? 1500 : 1900) };
  if (k === 'hold') BM2.cur = { k, warn: t + 900, dl: t + 900 + (rage ? 3000 : 2500), held: 0, holding: false, last: t };
  if (k === 'adds') { const n = rage ? 4 : 3; BM2.cur = { k, dl: t + (rage ? 3800 : 4500), adds: Array.from({ length: n }, () => ({ x: 12 + Math.random() * 76, y: 28 + Math.random() * 46, hp: 2 })) }; }
  BM2.cur.until = Infinity; BM2.cur.t0 = t; bm2Draw(true);
})(bm2Start);
bm2Draw = (orig => function (force) {
  const c = BM2.cur; if (!c || !BM3_KINDS.includes(c.k)) return orig.apply(this, arguments);
  const st = $('#mstage'); if (!st) return; let el = st.querySelector('.bm2'); if (!el) { el = document.createElement('div'); el.className = 'bm2'; st.appendChild(el); force = true; }
  const m = curMon(), t = Date.now(), left = Math.max(0, c.dl - t);
  if (c.k === 'hold') {
    if (force || !el.querySelector('.bm2-hold')) el.innerHTML = `<div class="bm2-panel"><b>🔥 ${m.name} takes a deep breath…</b><small>Press and HOLD the shield until it's over</small></div><button class="bm2-hold" data-bm2h="1"><span>🛡️</span><small>HOLD</small><i></i></button>`;
    const b = el.querySelector('.bm2-hold'), breathing = t >= c.warn, total = c.dl - c.warn;
    b.classList.toggle('on', c.holding); b.classList.toggle('breath', breathing);
    b.querySelector('i').style.width = (breathing ? Math.min(100, c.held / total * 100) : 0) + '%';
    b.querySelector('small').textContent = breathing ? (c.holding ? 'BLOCKING!' : 'HOLD IT!') : 'GET READY';
    return;
  }
  if (!force) return;
  const timer = `<i class="bm2-timer" style="animation-duration:${left}ms"></i>`;
  if (c.k === 'dodge') el.innerHTML = `<div class="bm2-panel"><b>${c.side === 'left' ? '⬅️' : '➡️'} ${m.name} swipes ${c.side.toUpperCase()}!</b><small>Dodge to the other side</small>${timer}</div><div class="bm2-sides"><button class="bm2-side ${c.side === 'left' ? 'danger' : ''}" data-bm2d="left">${c.side === 'left' ? '💥' : '🏃'}</button><button class="bm2-side ${c.side === 'right' ? 'danger' : ''}" data-bm2d="right">${c.side === 'right' ? '💥' : '🏃'}</button></div>`;
  if (c.k === 'adds') el.innerHTML = `<div class="bm2-panel"><b>👹 Minions rush to heal ${m.name}!</b><small>Tap each one away (2 taps)</small>${timer}</div>${c.adds.map((a, i) => a.hp > 0 ? `<button class="bm2-add ${a.hp < 2 ? 'hurt' : ''}" data-bm2a="${i}" style="left:${a.x}%;top:${a.y}%">👹</button>` : '').join('')}`;
})(bm2Draw);
// ticking & resolving the new ones
setInterval(() => {
  const c = BM2.cur; if (!c || !BM3_KINDS.includes(c.k)) return;
  if (UI.view !== 'combat' || OFF || !bm2Boss()) { BM2.cur = null; return; }
  const t = Date.now(), m = curMon();
  if (c.k === 'hold') { if (c.holding && t >= c.warn) c.held += t - Math.max(c.last, c.warn); c.last = t; bm2Draw(); }
  if (t < c.dl) return;
  if (c.k === 'dodge') heavyHit(2, `${m.name}'s swipe`);
  if (c.k === 'hold') { const total = c.dl - c.warn, f = Math.max(0, 1 - c.held / total); if (f < 0.08) { BM.counter = Date.now() + 3000; toast('🛡️ Breath blocked! Counter: +50% damage for 3s.', 'rare', 2000); } else heavyHit(2.4 * f, `${m.name}'s fire breath (${Math.round(f * 100)}% got through)`); }
  if (c.k === 'adds') { const left = c.adds.filter(a => a.hp > 0).length; if (left) { const C = S.combat, h = Math.round(C.mmax * 0.05 * left); C.mhp = Math.min(C.mmax, C.mhp + h); toast(`👹 ${left} minion${left > 1 ? 's' : ''} healed ${m.name} for ${fmt(h)}!`, 'warn', 2200); } }
  bm2End();
}, 50);
document.addEventListener('pointerdown', e => {
  const c = BM2.cur; if (!c) return;
  const h = e.target.closest('[data-bm2h]'), d = e.target.closest('[data-bm2d]'), a = e.target.closest('[data-bm2a]');
  if (!h && !d && !a) return; e.preventDefault(); e.stopImmediatePropagation();
  if (h && c.k === 'hold') { c.holding = true; c.last = Date.now(); bm2Draw(); try { h.setPointerCapture?.(e.pointerId); } catch (er) {} }
  if (d && c.k === 'dodge') { if (d.dataset.bm2d !== c.side) bm2Win('🏃 Dodged!'); else heavyHit(2, `Wrong way! ${curMon().name}'s swipe`); bm2End(); }
  if (a && c.k === 'adds') { const ad = c.adds[+a.dataset.bm2a]; if (ad && ad.hp > 0) { ad.hp--; if (c.adds.every(x => x.hp <= 0)) { bm2Win('👹 Minions cleared!'); bm2End(); } else bm2Draw(true); } }
}, { capture: true, passive: false });
const holdOff = () => { const c = BM2.cur; if (c?.k === 'hold' && c.holding) { const t = Date.now(); if (t >= c.warn) c.held += t - Math.max(c.last, c.warn); c.last = t; c.holding = false; bm2Draw(); } };
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => document.addEventListener(ev, holdOff, true));
document.addEventListener('click', e => { if (e.target.closest('[data-bm2h],[data-bm2d],[data-bm2a]')) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
document.addEventListener('contextmenu', e => { if (e.target.closest('[data-bm2h]')) e.preventDefault(); }, true);
openMonsterInfo = (orig => function (id) {
  orig(id); const p = $('#modal .bm-info'); if (p) p.innerHTML = '⚔️ <b>Boss mechanics</b> (while you watch): ⚡ tap race, 🔢 rune sequence, 🙏 prayer call, 🎯 weak spot, ↔️ dodge to the safe side, 🛡️ hold the shield through a breath, 👹 tap away the healing minions. Below 25% health it enrages: faster mechanics, harder hits.';
})(openMonsterInfo);

function boot69() { boot68(); }
