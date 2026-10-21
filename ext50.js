'use strict';
/* =========================================================
   CLICKSCAPE v9.26 — battle scene: your character (in your gear, side-on) and your
   follower pet face the monster; melee swings, arrows and spells fly, high-tier weapons
   leave coloured trails (dragon gear = fire swipe), hits shake, the pet joins in.
   ========================================================= */

/* ---------- weapon flavour ---------- */
function weaponFx(w) {
  if (!w) return { k: 'plain', c: '#ffffff' };
  const id = w.id || '', q = w.quality || 0;
  if (/dragon|infernal|volcanic|fire|magma|wyrm|dragonbane/.test(id)) return { k: 'fire', c: '#ff6a1a' };
  if (/third_age|celestial|divine|godforged|primordial|starmetal|voidsteel|eternal|exalted|ascended|twisted|scythe|tumeken|zaryte/.test(id) || (w.value || 0) >= 2e7) return { k: 'arcane', c: w.tint || '#c080ff' };
  if (q >= 3) return { k: 'arcane', c: QUAL[q].c };
  if (/abyssal|whip|void/.test(id)) return { k: 'arcane', c: '#8a3ad8' };
  return { k: 'plain', c: '#ffffff' };
}

/* ---------- the hero, side-on, facing right ---------- */
let HERO_LOOK = null; // optional slot → item override (skilling uses the skill outfit instead of combat gear)
function heroSVG() {
  const L = s => { const id = HERO_LOOK ? HERO_LOOK(s) : lookOf(s); return id ? ITEMS[id] : null; };
  const head = L('head'), body = L('body'), legs = L('legs'), feet = L('feet'), hands = L('hands'), cape = L('cape'), wpn = L('weapon'), shd = L('shield');
  const skin = '#e6b58c', hair = '#5a3a1e', O = '#120d08';
  const bc = body?.tint || '#9a8a62', lc = legs?.tint || '#5a4632', fc = feet?.tint || '#3a2614', hc = hands?.tint || skin;
  const metal = it => it && ['platebody', 'platelegs', 'full_helm', 'kiteshield', 'chainbody', 'dfs', 'defender'].includes(it.kind);
  const g = (id, c, m) => `<linearGradient id="h${id}" x1="0" x2="1"><stop offset="0" stop-color="${dshade(c, m ? -.45 : -.3)}"/><stop offset=".45" stop-color="${dshade(c, m ? .35 : .12)}"/><stop offset="1" stop-color="${dshade(c, m ? -.4 : -.3)}"/></linearGradient>`;
  const defs = [g('b', bc, metal(body)), g('l', lc, metal(legs)), g('c', cape?.tint || '#8a2a2a'), g('hh', head?.tint || '#777', metal(head)), g('s', shd?.tint || '#888', metal(shd))].join('');
  const out = [];
  const limb = (d, w, c) => `<path d="${d}" stroke="${O}" stroke-width="${w + 3}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  out.push(`<ellipse cx="58" cy="134" rx="30" ry="5" fill="#000" opacity=".35"/>`);
  if (cape) out.push(`<path d="M50 52 Q34 80 26 124 Q40 128 52 122 Q50 90 58 56 Z" fill="url(#hc)" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>`);
  // far arm (shield arm) behind the body
  const robe = body?.kind === 'robe' || body?.kind === 'ghostrobe';
  out.push(limb('M56 58 L64 76 L72 84', 9, robe ? 'url(#hb)' : metal(body) ? 'url(#hb)' : skin));
  // legs
  const legFill = 'url(#hl)';
  if (legs?.kind === 'robeskirt' || robe) out.push(`<path d="M46 92 L68 92 L76 128 L40 128 Z" fill="${robe && !legs ? 'url(#hb)' : legFill}" stroke="${O}" stroke-width="1.8"/>`);
  else { out.push(limb('M54 94 L48 112 L44 128', 11, legFill), limb('M60 94 L66 112 L70 128', 11, legFill)); if (legs?.kind === 'platelegs') out.push(`<circle cx="48" cy="112" r="4" fill="${dshade(lc, .25)}" stroke="${O}"/><circle cx="66" cy="112" r="4" fill="${dshade(lc, .25)}" stroke="${O}"/>`); }
  out.push(`<path d="M37 126 L50 126 L51 133 L36 133 Z" fill="${fc}" stroke="${O}" stroke-width="1.5"/><path d="M64 126 L77 126 L80 133 L64 133 Z" fill="${fc}" stroke="${O}" stroke-width="1.5"/>`);
  // torso (profile)
  out.push(`<path d="M47 52 Q58 48 68 54 L67 96 Q57 99 46 95 Z" fill="url(#hb)" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>`);
  if (body?.kind === 'platebody') out.push(`<path d="M50 72 Q58 76 66 72 M49 84 L67 84" stroke="${dshade(bc, -.5)}" stroke-width="1.3" fill="none"/><ellipse cx="58" cy="56" rx="11" ry="7" fill="${dshade(bc, .2)}" stroke="${O}" stroke-width="1.6"/>`);
  if (body?.kind === 'chainbody') out.push(`<path d="M49 60 L66 60 M49 66 L66 66 M49 72 L66 72 M49 78 L66 78 M49 84 L66 84" stroke="${dshade(bc, -.45)}" stroke-width="1" stroke-dasharray="1.5 1.5"/>`);
  if (body?.kind === 'dhidebody') out.push(`<path d="M50 54 L66 92" stroke="${dshade(bc, -.55)}" stroke-width="3"/>`);
  if (!body) out.push(`<path d="M46 86 L67 86 L67 91 L46 91 Z" fill="#4a3018" stroke="${O}"/>`);
  if (body?.trim) out.push(`<path d="M47 52 Q58 48 68 54 L67 96 Q57 99 46 95 Z" fill="none" stroke="${body.trim}" stroke-width="1.6"/>`);
  // head (profile, facing right)
  out.push(`<rect x="54" y="42" width="9" height="9" fill="${dshade(skin, -.15)}"/><circle cx="59" cy="34" r="12" fill="${skin}" stroke="${O}" stroke-width="1.8"/><circle cx="65" cy="33" r="1.6" fill="${O}"/><path d="M70 36 L72 38 L70 39" stroke="${O}" stroke-width="1.2" fill="none"/>`);
  const hk = head?.kind, hn = (head?.name || '').toLowerCase();
  if (!head) out.push(`<path d="M47 33 Q47 20 59 21 Q70 21 70 29 Q62 26 56 30 Q52 36 50 40 Z" fill="${hair}" stroke="${O}" stroke-width="1.4"/>`);
  else if (hk === 'full_helm') out.push(`<path d="M46 36 Q45 19 59 19 Q73 19 72 36 L72 44 L46 44 Z" fill="url(#hhh)" stroke="${O}" stroke-width="1.9"/><path d="M62 31 L73 31 L73 35 L62 35 Z" fill="#0c0805"/>${(head.value || 0) > 2e5 || head.trim ? `<path d="M56 19 Q48 6 36 10 Q46 12 52 21 Z" fill="${head.trim || '#c02020'}" stroke="${O}" stroke-width="1.2"/>` : ''}`);
  else if (hk === 'coif' || /hood|cowl/.test(hn)) out.push(`<path d="M45 46 Q42 18 60 18 Q74 18 72 30 L66 30 Q64 24 58 25 Q50 27 52 46 Z" fill="url(#hhh)" stroke="${O}" stroke-width="1.7"/>`);
  else if (head.matk > 0 || /wizard|mystic|witch|hat/.test(hn)) out.push(`<path d="M42 28 Q58 32 76 27 Q70 24 66 24 Q60 6 48 -2 Q52 12 50 24 Q44 25 42 28 Z" fill="url(#hhh)" stroke="${O}" stroke-width="1.7"/>`);
  else if (/crown|tiara/.test(hn)) out.push(`<path d="M48 24 L50 14 L55 21 L59 11 L63 21 L68 14 L70 24 Z" fill="#e0b030" stroke="${O}" stroke-width="1.4"/>`);
  else out.push(`<path d="M46 30 Q47 18 59 18 Q71 18 72 28 L76 30 L46 31 Z" fill="url(#hhh)" stroke="${O}" stroke-width="1.6"/>`);
  // shield, near the front
  if (shd) {
    const sc = shd.tint || '#888';
    if (shd.kind === 'defender') out.push(`<path d="M70 86 L73 70 L76 86 Z" fill="${sc}" stroke="${O}" stroke-width="1.3"/>`);
    else if (shd.kind === 'orb' || shd.kind === 'lantern') out.push(`<circle cx="74" cy="84" r="6" fill="${sc}" stroke="${O}" stroke-width="1.5"/><circle cx="74" cy="84" r="10" fill="${sc}" opacity=".25"/>`);
    else out.push(`<path d="M66 66 Q74 63 82 66 Q83 84 74 96 Q65 84 66 66 Z" fill="url(#hs)" stroke="${O}" stroke-width="1.9"/>${shd.kind === 'dfs' ? `<path d="M70 74 Q74 70 78 74 L76 79 Q74 81 72 79 Z" fill="#e8501a" stroke="${O}" stroke-width=".9"/>` : `<path d="M74 69 L74 90 M68 76 L80 76" stroke="${shd.trim || dshade(sc, -.5)}" stroke-width="2"/>`}`);
  }
  // weapon arm (near side) — animated group, pivot at the shoulder
  const cls = wclass(), wk = wpn?.kind || '';
  let wArm;
  if (cls === 'ranged') wArm = `${limb('M58 58 L72 66 L84 66', 9, robe || metal(body) ? 'url(#hb)' : skin)}<circle cx="85" cy="66" r="4.5" fill="${hc}" stroke="${O}" stroke-width="1.5"/><g transform="translate(86 66) ${wk === "crossbow" ? "rotate(10)" : "scale(-1 1)"}">${wpn ? weaponSVG(wpn, 'hw', []).replace(/url\(#hww\)/g, wpn.tint || '#b8b8c0') : ''}</g>`;
  else if (cls === 'magic') wArm = `${limb('M58 58 L70 70 L80 62', 9, robe || metal(body) ? 'url(#hb)' : skin)}<g transform="translate(80 62) rotate(8)">${wpn ? weaponSVG(wpn, 'hw', []).replace(/url\(#hww\)/g, wpn.tint || '#b8b8c0') : ''}</g><circle cx="80" cy="62" r="4.5" fill="${hc}" stroke="${O}" stroke-width="1.5"/>`;
  else wArm = `${limb('M58 58 L66 74 L78 78', 9, robe || metal(body) ? 'url(#hb)' : skin)}<g transform="translate(78 78) rotate(55)">${wpn ? weaponSVG(wpn, 'hw', []).replace(/url\(#hww\)/g, `url(#hwg)`) : ''}</g><circle cx="78" cy="78" r="4.5" fill="${hc}" stroke="${O}" stroke-width="1.5"/>`;
  const wt = wpn?.tint || '#b8b8c0';
  const wdefs = `<linearGradient id="hwg" x1="0" x2="1"><stop offset="0" stop-color="${dshade(wt, -.4)}"/><stop offset=".45" stop-color="${dshade(wt, .45)}"/><stop offset="1" stop-color="${dshade(wt, -.35)}"/></linearGradient>`;
  out.push(`<g class="h-arm ${cls}" style="transform-origin:58px 58px">${wArm}</g>`);
  return `<svg class="hero-svg" viewBox="20 -6 100 146"><defs>${defs}${wdefs}</defs>${out.join('')}</svg>`;
}
function petHTML() {
  const f = typeof follower === 'function' ? follower() : null; const p = f && PETS[f.id]; if (!p) return '';
  const fighter = p.st === 'combat' || /damage|combat|hit/i.test(p.desc || '');
  return `<div class="b-pet ${fighter ? 'fighter' : ''}" title="${p.name}">${p.icon}</div>`;
}

/* ---------- scene in the arena ---------- */
viewCombat = (orig => function () {
  const h = orig();
  return h.replace(/<div class="mon" style="([^"]*)">([\s\S]*?)<\/div><div class="splats" id="msplat"><\/div>/, (m) =>
    `<div class="b-scene"><div class="b-hero" id="bhero">${heroSVG()}${petHTML()}</div><div class="b-mon">${m}</div></div>`);
})(viewCombat);
VIEWS.combat = (orig => function () { return rebrand(orig()); })(viewCombat);
viewSig = (orig => function () { return UI.view === 'combat' ? orig() + '|eq' + JSON.stringify(S.equip) + (S.follow?.id || '') : orig(); })(viewSig);

/* ---------- animations ---------- */
let lastAnim = 0, petCount = 0, FXC = '#fff';
const restart = (el, cls) => { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
function fxSpawn(cls, html, x, y, dx, dy, ms = 500) {
  const st = $('#mstage'); if (!st) return; const d = document.createElement('div'); d.className = 'b-fx ' + cls; d.innerHTML = html || '';
  d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.setProperty('--fxc', FXC); d.style.setProperty('--dx', dx + 'px'); d.style.setProperty('--dy', dy + 'px');
  st.appendChild(d); setTimeout(() => d.remove(), ms);
}
function attackAnim(dmg) {
  if (UI.view !== 'combat' || document.hidden) return; const t = performance.now(); if (t - lastAnim < 140) return; lastAnim = t;
  const st = $('#mstage'), hero = $('#bhero'), mon = $('#mstage .mon'); if (!st || !hero || !mon) return;
  const sr = st.getBoundingClientRect(), hr = hero.getBoundingClientRect(), mr = mon.getBoundingClientRect();
  const hx = hr.left - sr.left + hr.width * 0.78, hy = hr.top - sr.top + hr.height * 0.45, mx = mr.left - sr.left + mr.width / 2, my = mr.top - sr.top + mr.height / 2;
  const cls = wclass(), w = ITEMS[S.equip.weapon], fx = weaponFx(w); FXC = fx.c;
  restart(hero.querySelector('.h-arm'), 'atk'); restart(hero, 'lunge');
  if (cls === 'ranged') fxSpawn(`arrow ${fx.k}`, '', hx, hy, mx - hx, my - hy, 420);
  else if (cls === 'magic') fxSpawn(`spell ${fx.k}`, '', hx, hy - 10, mx - hx, my - hy + 10, 480);
  const delay = cls === 'melee' ? 90 : 330;
  setTimeout(() => {
    if (dmg > 0) {
      restart(mon, 'hit');
      if (cls === 'melee') fxSpawn(`slash ${fx.k}`, `<svg viewBox="0 0 100 100"><path d="M15 80 Q50 10 88 22" style="stroke:var(--fxc)" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M15 80 Q50 10 88 22" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/></svg>`, mx - 40, my - 40, 0, 0, 380);
      else fxSpawn(`burst ${fx.k}`, '', mx - 20, my - 20, 0, 0, 380);
      if (fx.k === 'fire') for (let i = 0; i < 5; i++) fxSpawn('ember', '', mx - 6 + (Math.random() - 0.5) * 50, my + (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 30, -30 - Math.random() * 30, 650);
    }
    // the follower joins in now and then
    const pet = hero.querySelector('.b-pet.fighter'); if (pet && ++petCount % 3 === 0) { restart(pet, 'pounce'); setTimeout(() => fxSpawn('claw', '<span>💥</span>', mx - 12, my - 4, 0, 0, 400), 220); }
  }, delay);
}
function hurtAnim(dmg) { if (UI.view !== 'combat') return; const hero = $('#bhero'); if (!hero) return; restart(hero, dmg > 0 ? 'hurt' : 'dodge'); }
splat = (orig => function (who, dmg) { orig(who, dmg); try { if (who === 'm') attackAnim(dmg); else hurtAnim(dmg); } catch (e) {} })(splat);
function boot50() { boot49(); UI.force = true; render(); }

