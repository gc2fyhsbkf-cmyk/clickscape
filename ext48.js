'use strict';
/* =========================================================
   CLICKSCAPE v9.24 — Event pass & daily event tasks for seasonal events,
   an event banner on the Skills page, and a recent-stations quick bar
   ========================================================= */

/* ================= EVENT PASS ================= */
const PASS_T = [10, 25, 50, 80, 120, 170, 230, 300, 380, 500];
const PASS_SKIN = { halloween: ['ev_lantern_cape', 'Hallowed lantern cape', 'cape', 'batcape', '#3a1a4a'], christmas: ['ev_frost_crown', 'Frostbound crown', 'head', 'hat', '#a8d8ff'] };
Object.values(PASS_SKIN).forEach(([id, n, slot, kind, tint]) => { cosmetic(id, n, slot, kind, tint, [0, 0, 0], { value: 9e7, trim: '#ffd84a', untradeable: true }); ITEM_ORDER[id] = 1e6 + Object.keys(ITEM_ORDER).length; if (!WARD_IDS.includes(id)) WARD_IDS.push(id); });
const PASS_REW = [
  () => { add('mystery_box', 2); return '2 mystery boxes'; }, () => { add('xp_lamp', 2); return '2 XP lamps'; }, () => { add('clue_hard', 1); return 'a hard clue'; },
  () => { add('mystery_box', 5); return '5 mystery boxes'; }, () => { add('clue_elite', 1); return 'an elite clue'; }, () => { add('xp_lamp', 3); add('mystery_box', 5); return '3 lamps + 5 boxes'; },
  () => { add('clue_elite', 2); return '2 elite clues'; }, () => { add('mystery_box', 10); return '10 mystery boxes'; }, () => { add('clue_master', 1); return 'a master clue'; },
  se => { const s = PASS_SKIN[se.id]; if (s) { add(s[0], 1); return `the ${s[1]} (👑 wardrobe piece)`; } add('clue_master', 2); return '2 master clues'; },
];
const PASS_DESC = ['2 mystery boxes', '2 XP lamps', 'Hard clue', '5 mystery boxes', 'Elite clue', '3 lamps + 5 boxes', '2 elite clues', '10 mystery boxes', 'Master clue', 'Exclusive event cosmetic 👑'];
let EV_NO_COUNT = false;
const passKey = se => se.id + new Date(now()).getFullYear();
const passOf = se => (S.lifetime.pass ||= {})[passKey(se)] ||= { earned: 0, got: [] };
add = (orig => function (id, n = 1) {
  const r = orig.apply(this, arguments);
  if (n > 0 && S?.lifetime) { const se = activeSeason(); if (se && id === se.token && !EV_NO_COUNT) { passOf(se).earned += n; evTaskProgress('tok', n); } }
  return r;
})(add);
const passTier = se => PASS_T.filter(t => passOf(se).earned >= t).length;
function passClaim(i) {
  const se = activeSeason(); if (!se) return; const P = passOf(se);
  if (P.got.includes(i) || P.earned < PASS_T[i]) return;
  P.got.push(i); const t = PASS_REW[i](se); toast(`${se.icon} Event pass tier ${i + 1}: ${t}!`, i === 9 ? 'pet' : 'rare', 6000);
  if (i === 9 && typeof fanLegend === 'function') fanLegend({ kind: `${se.icon} EVENT PASS COMPLETE ${se.icon}`, icon: itemIcon(PASS_SKIN[se.id]?.[0] || 'clue_master'), name: PASS_SKIN[se.id]?.[1] || '2 master clues', sub: `Thanks for playing ${se.name}!` });
  UI.force = true; render();
}

/* ================= DAILY EVENT TASKS ================= */
const EV_TASKS = [
  { k: 'evkill', n: 25, txt: se => `Defeat 25 ${se.name} monsters`, rw: 15 },
  { k: 'evboss', n: 3, txt: se => `Defeat the event boss 3 times`, rw: 25 },
  { k: 'tok', n: 20, txt: se => `Collect 20 ${ITEMS[se.token].name.toLowerCase()}s`, rw: 10 },
  { k: 'kill', n: 150, txt: () => 'Defeat 150 monsters anywhere', rw: 15 },
  { k: 'boss', n: 5, txt: () => 'Defeat 5 bosses', rw: 20 },
];
function evTasks() {
  const se = activeSeason(); if (!se) return null;
  const D = S.lifetime.evDaily ||= {}; const dk = dayKey();
  if (D.day !== dk || D.se !== se.id) {
    const has = id => MONSTERS.some(m => m.season === se.id && (id === 'boss' ? m.boss : !m.boss));
    const pool = EV_TASKS.filter(t => (t.k !== 'evkill' || has('mon')) && (t.k !== 'evboss' || has('boss')));
    const pick = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    Object.assign(D, { day: dk, se: se.id, list: pick.map(t => ({ k: t.k, p: 0, done: false })) });
  }
  return D.list;
}
function evTaskProgress(k, n = 1) {
  const L = evTasks(); if (!L) return; const se = activeSeason();
  for (const t of L) if (t.k === k && !t.done) {
    const def = EV_TASKS.find(x => x.k === k); t.p = Math.min(def.n, t.p + n);
    if (t.p >= def.n) { t.done = true; EV_NO_COUNT = false; add(se.token, def.rw); if (!OFF) toast(`${se.icon} Daily event task done: ${def.txt(se)} · +${def.rw} ${ITEMS[se.token].name.toLowerCase()}s`, 'rare', 5000); }
  }
}
killMonster = (orig => function (m) {
  const r = orig.apply(this, arguments);
  if (m && activeSeason()) { evTaskProgress('kill'); if (m.boss) evTaskProgress('boss'); if (m.season) { evTaskProgress(m.boss ? 'evboss' : 'evkill'); } }
  return r;
})(killMonster);

function passPanel(se) {
  const P = passOf(se), t = passTier(se), next = PASS_T[t];
  const pct = next ? 100 * (P.earned - (PASS_T[t - 1] || 0)) / (next - (PASS_T[t - 1] || 0)) : 100;
  const L = evTasks() || [];
  return `<div class="panel ev-pass"><h3>${se.icon} Event pass <small class="muted">· tier ${t}/10 · ${fmt(P.earned)} ${ITEMS[se.token].name.toLowerCase()}s earned</small></h3>
    <div class="bar rep"><i style="width:${Math.min(100, pct)}%"></i></div><small class="muted">${next ? `${fmt(next - P.earned)} more for tier ${t + 1}` : 'Pass complete!'} · spending ${ITEMS[se.token].name.toLowerCase()}s never lowers your pass progress</small>
    <div class="pass-track">${PASS_T.map((n, i) => { const ok = P.earned >= n, got = P.got.includes(i); return `<button class="pt ${ok ? 'ok' : ''} ${got ? 'got' : ''} ${i === 9 ? 'final' : ''}" ${ok && !got ? `data-act="pass-claim" data-i="${i}"` : 'disabled'}><b>${i + 1}</b><small>${PASS_DESC[i]}</small><i>${got ? '✔' : ok ? 'Claim!' : fmt(n)}</i></button>`; }).join('')}</div></div>
    <div class="panel"><h3>📅 Daily event tasks <small class="muted">· new ones tomorrow</small></h3>${L.map(x => { const d = EV_TASKS.find(y => y.k === x.k); return `<div class="trib ${x.done ? 'ok' : ''}">${x.done ? '✅' : '⬜'} <b>${d.txt(se)}</b> <small class="muted">${fmt(x.p)}/${fmt(d.n)} · +${d.rw} ${ITEMS[se.token].emoji || ''}</small><div class="bar"><i style="width:${100 * x.p / d.n}%"></i></div></div>`; }).join('')}</div>`;
}
viewSeason = (orig => function () {
  const h = orig(), se = activeSeason(); if (!se) return h;
  return h.replace(/(<div class="panel glow">[\s\S]*?<\/div>)/, `$1${passPanel(se)}`);
})(viewSeason);
VIEWS.season = (orig => function () { return rebrand(orig()); })(viewSeason);
const seasonEnd = se => { const d = new Date(now()); let e = new Date(d.getFullYear(), se.to[0] - 1, se.to[1], 23, 59); if (e < d) e = new Date(d.getFullYear() + 1, se.to[0] - 1, se.to[1], 23, 59); return e; };
viewSkills = (orig => function () {
  const h = orig(), se = activeSeason(); if (!se) return h;
  const days = Math.max(0, Math.ceil((seasonEnd(se) - now()) / 864e5)), L = evTasks() || [], claim = PASS_T.some((n, i) => passOf(se).earned >= n && !passOf(se).got.includes(i));
  return `<div class="panel row-between ev-banner"><div><b>${se.icon} ${se.name} event</b> <small class="muted">· ${days} day${days === 1 ? '' : 's'} left</small><br><small>Pass tier <b class="y">${passTier(se)}/10</b> · daily tasks ${L.filter(x => x.done).length}/${L.length}${claim ? ' · <span class="y">reward ready!</span>' : ''}</small></div><button class="btn ${claim ? 'glow' : ''}" data-act="hub" data-id="season">Open</button></div>` + h;
})(viewSkills);
VIEWS.skills = (orig => function () { return rebrand(orig()); })(viewSkills);
viewSig = (orig => function () {
  const se = activeSeason(); if (!se) return orig();
  if (UI.view === 'season') return orig() + '|ps' + passOf(se).earned + passOf(se).got.length + JSON.stringify(evTasks());
  if (UI.view === 'skills') return orig() + '|pt' + passTier(se) + (evTasks() || []).filter(x => x.done).length;
  return orig();
})(viewSig);

/* ================= RECENT STATIONS QUICK BAR ================= */
viewSkill = (orig => function () {
  const h = orig(), sk = UI.skill, st = UI.curStation;
  if (!sk || SK_SKIP() || !st) return h;
  const R = (S.settings.recentSt ||= []); const key = sk + ':' + st;
  const i = R.indexOf(key); if (i) { if (i > 0) R.splice(i, 1); R.unshift(key); R.length = Math.min(R.length, 6); }
  const others = R.filter(k => k !== key && STATIONS[k.split(':')[1]]).slice(0, 5);
  if (!others.length) return h;
  const bar = `<div class="quick-st"><small>Recent</small>${others.map(k => { const [s2, st2] = k.split(':'); return `<button class="qst" data-act="quick-st" data-sk="${s2}" data-st="${st2}"><span>${SKILLS[s2]?.icon || '⭐'}</span><small>${STATIONS[st2].name}</small></button>`; }).join('')}</div>`;
  return h.replace(/(<div class="skill-head panel">)/, `${bar}$1`);
})(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
  if (a === 'pass-claim') { e.stopImmediatePropagation(); passClaim(+t.dataset.i); }
  if (a === 'quick-st') { e.stopImmediatePropagation(); UI.station[t.dataset.sk] = t.dataset.st; go('skill', { skill: t.dataset.sk }); UI.station[t.dataset.sk] = t.dataset.st; UI.force = true; render(); $('#view')?.scrollTo({ top: 0 }); }
}, true);
function boot48() { boot47(); UI.force = true; render(); }

