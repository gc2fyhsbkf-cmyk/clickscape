'use strict';
/* =========================================================
   CLICKSCAPE v9.32 — boss mechanics (wind-up attacks to dodge, weak spots to crit, enrage),
   Mastery stars replace prestige (earned automatically, no reset), and a first-launch intro
   ========================================================= */

/* ================= BOSS MECHANICS ================= */
// only while you're watching the fight: a boss winds up a heavy blow (tap the boss to dodge it,
// and dodging gives a short counter-attack buff), or exposes a weak spot (tap it for a 3× hit).
// Below 25% health every boss enrages: it attacks faster and harder (this one applies idle too).
const BM = { next: 0, phase: null, until: 0, counter: 0 };
const bmBoss = () => { const m = curMon(); return S.combat?.fighting && m?.boss && S.combat.mhp > 0 ? m : null; };
const enraged = () => { const m = bmBoss(); return !!m && S.combat.mmax > 0 && S.combat.mhp / S.combat.mmax < 0.25; };
tickCore = (orig => function (dt) {
  orig(dt);
  if (enraged()) S.combat.mT -= dt * 0.3; // 30% faster attacks
})(tickCore);
monsterAttack = (orig => function () {
  const m = curMon(); if (!enraged() || !m) return orig.apply(this, arguments);
  const mh = m.mh; m.mh = Math.round(mh * 1.2); try { return orig.apply(this, arguments); } finally { m.mh = mh; }
})(monsterAttack);
// counter buff after a dodge: +50% damage for 5 seconds
maxHit = (orig => function (tap, m) { const h = orig(tap, m); return Date.now() < BM.counter ? Math.round(h * 1.5) : h; })(maxHit);
function bmUI() {
  const st = $('#mstage'); if (!st) return; let el = st.querySelector('.bm-layer'); if (!el) { el = document.createElement('div'); el.className = 'bm-layer'; st.appendChild(el); }
  const m = bmBoss(), t = Date.now();
  let h = '';
  if (m && BM.phase === 'windup') h = `<div class="bm-warn"><b>⚠️ ${m.name} winds up a heavy blow!</b><small>Tap the boss to dodge</small><i style="animation-duration:${BM.until - t}ms"></i></div>`;
  else if (m && BM.phase === 'weak') h = `<button class="bm-weak" data-act="bm-weak" style="left:${BM.x}%;top:${BM.y}%"><span>🎯</span></button><div class="bm-tip">Weak spot! Tap it</div>`;
  if (enraged()) h += '<div class="bm-rage">😡 ENRAGED</div>';
  if (t < BM.counter) h += '<div class="bm-counter">⚔️ Counter! +50% damage</div>';
  if (el._h !== h) { el._h = h; el.innerHTML = h; }
  st.classList.toggle('enraged', enraged());
}
setInterval(() => {
  if (UI.view !== 'combat' || document.hidden || OFF) { BM.phase = null; return; }
  const m = bmBoss(), t = Date.now();
  if (!m) { BM.phase = null; bmUI(); return; }
  if (!BM.next) BM.next = t + 8000 + Math.random() * 6000;
  if (BM.phase && t > BM.until) {
    if (BM.phase === 'windup') { // not dodged: a heavy hit
      const mh = m.mh; m.mh = Math.round(mh * 2.5); try { monsterAttack(); } finally { m.mh = mh; }
      toast(`💥 ${m.name}'s heavy blow lands!`, 'warn', 2500);
    }
    BM.phase = null; BM.next = t + 9000 + Math.random() * 8000;
  }
  if (!BM.phase && t > BM.next) {
    if (Math.random() < 0.55) { BM.phase = 'windup'; BM.until = t + 2200; }
    else { BM.phase = 'weak'; BM.until = t + 1800; BM.x = 25 + Math.random() * 50; BM.y = 15 + Math.random() * 45; }
  }
  bmUI();
}, 200);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="bm-weak"]');
  if (t) { e.stopImmediatePropagation(); if (BM.phase !== 'weak') return; BM.phase = null; BM.next = Date.now() + 9000 + Math.random() * 7000; const d = playerAttack(true, 3); floaterAt?.(t, `CRIT ${fmt(d || 0)}!`); toast(`🎯 Weak spot! A critical hit for ${fmt(d || 0)}.`, 'rare', 2000); bmUI(); return; }
  if (BM.phase === 'windup' && e.target.closest('#mstage')) { BM.phase = null; BM.next = Date.now() + 9000 + Math.random() * 7000; BM.counter = Date.now() + 5000; toast('🌀 Dodged! Counter-attack: +50% damage for 5 seconds.', 'rare', 2500); try { restart($('#bhero'), 'dodge'); } catch (er) {} bmUI(); }
}, true);
const floaterAt = (el, txt) => { try { const r = el.getBoundingClientRect(); floater(r.left + r.width / 2, r.top, txt, 'good'); } catch (e) {} };
// a line in the monster info window
openMonsterInfo = (orig => function (id) {
  orig(id); const m = MONSTER_BY_ID[id]; if (!m?.boss) return;
  $('#modal .mon-info h3')?.insertAdjacentHTML('beforebegin', '<p class="small bm-info">⚔️ <b>Boss mechanics</b>: winds up heavy blows (tap the boss to dodge, then counter for +50% damage), shows weak spots (tap for a 3× hit), and enrages below 25% health.</p>');
})(openMonsterInfo);

/* ================= MASTERY STARS (replaces prestige) ================= */
// stars come automatically from reaching level milestones in a skill: no reset, kept forever
const MASTERY = [99, 175, 300, 500, 800];
const masteryAuto = sk => MASTERY.filter(l => (S.lifetime.peakLv?.[sk] || 0) >= l).length;
const syncMastery = sk => { const a = Math.min(5, masteryAuto(sk)); if (a > (S.lifetime.prest?.[sk] || 0)) (S.lifetime.prest ||= {})[sk] = a; };
let mstT = 0;
tickCore = (orig => function (dt) {
  orig(dt); mstT += dt; if (mstT < 5) return; mstT = 0;
  const P = S.lifetime.peakLv ||= {}; let up = false;
  for (const sk of SKILL_ORDER) { const before = prest(sk); if ((LV[sk] || 0) > (P[sk] || 0)) P[sk] = LV[sk]; syncMastery(sk); const after = prest(sk); if (after > before) { up = true; const msg = `⭐ ${SKILLS[sk].name} Mastery star ${after}! +${after * 5}% XP & speed in ${SKILLS[sk].name}, forever.`; if (OFF) OFFLOG.push(msg); else if (typeof fanLegend === 'function') fanLegend({ kind: '⭐ MASTERY STAR ⭐', icon: `<span class="emo">${SKILLS[sk].icon}</span>`, name: `${SKILLS[sk].name} ${'⭐'.repeat(after)}`, sub: `+${after * 5}% XP & speed in ${SKILLS[sk].name}, kept forever` }); else toast(msg, 'pet', 6000); } }
  if (up) recalc();
})(tickCore);
skillHead = (orig => function (sk, back) {
  const h = orig(sk, back); const p = prest(sk), nx = MASTERY.find(l => (S.lifetime.peakLv?.[sk] || LV[sk]) < l);
  return h.replace(/<div class="prestige-row">[\s\S]*?<\/div>/, `<div class="prestige-row mastery"><span class="y">${'⭐'.repeat(p)}${'☆'.repeat(5 - p)}</span> <small>Mastery${p ? ` · +${p * 5}% XP & speed` : ''}${nx ? ` · next star at level ${nx}` : ' · complete'}</small></div>`);
})(skillHead);
document.addEventListener('click', e => { const t = e.target.closest('[data-act="prestige"],[data-act="prestige-yes"]'); if (t) { e.stopImmediatePropagation(); toast('⭐ Prestige is now Mastery: stars come automatically at levels 99, 175, 300, 500 and 800. No reset needed.', 'rare', 5000); } }, true);

/* ================= FIRST-LAUNCH INTRO ================= */
const INTRO = [
  ['⛏️', 'Welcome to Clickscape', 'Train 20+ skills by tapping. Every tap mines, chops, fishes or smiths. Levels unlock better resources.'],
  ['👷', 'Hire workers', 'Workers keep a station going for you, even while you\'re away. Sell what they make and reinvest.'],
  ['⚔️', 'Fight and collect', 'Battle monsters across regions, beat bosses for rare drops, and fill your collection.'],
  ['🌀', 'Ascend for power', 'When your total level is high enough, ascend: start over much stronger, again and again.'],
];
function introModal(i = 0) {
  const [ic, t, d] = INTRO[i];
  openModal(`<div class="item-modal intro"><div class="intro-ic">${ic}</div><h2>${t}</h2><p>${d}</p><div class="intro-dots">${INTRO.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="row-btns">${i < INTRO.length - 1 ? `<button class="btn" data-act="intro-skip">Skip</button><button class="btn big" data-act="intro-next" data-i="${i + 1}">Next</button>` : '<button class="btn big" data-act="intro-go">Let\'s mine!</button>'}</div></div>`);
}
// coach marks for the very first actions
function coach() {
  const c = S.lifetime.coach; document.querySelectorAll('.coach').forEach(e => e.classList.remove('coach'));
  if (!c) return;
  if (c === 'tap' && UI.view === 'skill') { const s = $('.stage'); if (s) s.classList.add('coach'); if ((S.lifetime.taps || 0) >= (S.lifetime.coachTap0 || 0) + 8) { S.lifetime.coach = 'hire'; toast('Nice! Now hire a worker to mine for you.', 'rare', 4000); } }
  if (c === 'hire' && UI.view === 'skill') { const b = $('[data-act="hire"][data-k="1"]'); if (b) b.classList.add('coach'); if (Object.values(S.workers).some(n => n > 0)) { S.lifetime.coach = 'combat'; toast('Workers keep going while you\'re away. Try a fight next: tap ⚔️ Combat.', 'rare', 5000); } }
  if (c === 'combat') { const n = $('#nav [data-nav="combat"]'); if (n) n.classList.add('coach'); if (UI.view === 'combat' || (S.lifetime.kills || 0) > 0) { S.lifetime.coach = null; toast('You\'re all set! Follow "Getting started" and the Journey on the Skills page for more.', 'pet', 6000); } }
}
setInterval(() => { try { coach(); } catch (e) {} }, 700);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
  if (a === 'intro-next') { e.stopImmediatePropagation(); introModal(+t.dataset.i); }
  if (a === 'intro-skip' || a === 'intro-go') { e.stopImmediatePropagation(); S.lifetime.introDone = true; closeModal(); if (a === 'intro-go') { S.lifetime.coach = 'tap'; S.lifetime.coachTap0 = S.lifetime.taps || 0; UI.skill = 'mining'; go('skill', { skill: 'mining' }); } }
}, true);

function boot56() {
  boot55();
  const P = S.lifetime.peakLv ||= {}; for (const sk of SKILL_ORDER) { if ((LV[sk] || 0) > (P[sk] || 0)) P[sk] = LV[sk]; syncMastery(sk); } recalc();
  if (!S.lifetime.introDone && !lifeAsc() && !tcount() && totalLevel() < 60 && (S.lifetime.taps || 0) < 30) setTimeout(() => introModal(0), 600);
  else S.lifetime.introDone = true;
  UI.force = true; render();
}
boot56();
