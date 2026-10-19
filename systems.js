'use strict';
/* =========================================================
   CLICKSCAPE v3 systems
   ========================================================= */

/* ---------- Sound effects (synthesised, no files) ---------- */
const SFX = (() => {
  let ctx = null;
  const last = {};
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume().catch(() => { });
    return ctx;
  }
  const vol = () => (S?.settings?.volume ?? 0.6);
  function tone(f, d, type = 'square', v = 0.08, slide = 0, delay = 0) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
    g.gain.setValueAtTime(Math.max(0.0001, v * vol()), t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.03);
  }
  function noise(d, v = 0.08, f = 2000, delay = 0) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + delay, len = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 1.2;
    g.gain.value = v * vol(); src.connect(bp).connect(g).connect(c.destination); src.start(t);
  }
  const arp = (notes, d = 0.1, type = 'triangle', v = 0.07) => notes.forEach((n, i) => tone(n, d * 1.6, type, v, 0, i * d));
  const LIB = {
    mine: () => { tone(1500, 0.07, 'triangle', 0.1, 0.7); noise(0.04, 0.05, 4000); },
    chop: () => { tone(170, 0.08, 'square', 0.07, 0.5); noise(0.06, 0.07, 700); },
    fish: () => tone(420, 0.12, 'sine', 0.1, 2.2),
    dig: () => noise(0.09, 0.08, 500),
    smith: () => { tone(980, 0.18, 'triangle', 0.08); tone(1470, 0.12, 'triangle', 0.04); },
    fire: () => noise(0.14, 0.05, 900),
    cook: () => noise(0.12, 0.04, 3200),
    craft: () => tone(880, 0.05, 'triangle', 0.06, 1.2),
    pray: () => tone(660, 0.25, 'sine', 0.05, 1.5),
    thieve: () => tone(1250, 0.05, 'sine', 0.05, 1.6),
    agility: () => tone(600, 0.05, 'triangle', 0.06, 1.4),
    drink: () => { tone(300, 0.08, 'sine', 0.08, 2); tone(500, 0.08, 'sine', 0.06, 2, 0.08); },
    hit: () => tone(150, 0.08, 'square', 0.09, 0.5),
    miss: () => tone(320, 0.05, 'sine', 0.04),
    hurt: () => tone(110, 0.12, 'sawtooth', 0.06, 0.6),
    eat: () => { tone(420, 0.05, 'triangle', 0.07); tone(380, 0.05, 'triangle', 0.07, 0, 0.07); },
    coin: () => { tone(1600, 0.05, 'square', 0.04); tone(2150, 0.08, 'square', 0.04, 0, 0.05); },
    level: () => arp([523, 659, 784, 1047, 1319], 0.09, 'square', 0.05),
    rare: () => arp([1319, 1568, 2093], 0.07, 'sine', 0.08),
    pet: () => arp([784, 988, 1175, 1568, 1976], 0.08, 'triangle', 0.08),
    ach: () => arp([659, 784, 1047, 1319], 0.08, 'square', 0.05),
    clue: () => arp([523, 784, 1047], 0.1, 'triangle', 0.07),
    star: () => arp([1568, 2093, 2637, 3136], 0.06, 'sine', 0.06),
    error: () => tone(190, 0.14, 'square', 0.04, 0.8),
    click: () => tone(1000, 0.02, 'square', 0.02),
    perfect: () => arp([880, 1320, 1760], 0.05, 'square', 0.05),
    slip: () => tone(420, 0.25, 'sawtooth', 0.05, 0.4),
    death: () => arp([392, 330, 262, 196], 0.18, 'triangle', 0.07),
    spec: () => { noise(0.15, 0.06, 1500); tone(220, 0.2, 'sawtooth', 0.07, 2.5); },
  };
  function play(name) {
    if (OFF || !S?.settings?.sound) return;
    const t = performance.now();
    if (t - (last[name] || 0) < 70) return;
    last[name] = t;
    try { LIB[name]?.(); } catch (e) { }
  }
  return { play, unlock: ac };
})();
const STATION_SFX = { mine: 'mine', forest: 'chop', fish: 'fish', dig: 'dig', thieve: 'thieve', course: 'agility', furnace: 'fire', anvil: 'smith', craft: 'craft', fletch: 'craft', herb: 'drink', range: 'cook', fire: 'fire', altar: 'pray' };
document.addEventListener('pointerdown', () => { if (S?.settings?.sound) SFX.unlock(); }, { once: true, capture: true });

/* ---------- Message feed (replaces pop-ups) ---------- */
const MSGS = [];
let feedTimer = null;
function toast(html, cls = '', ms = 3200) {
  if (OFF) return;
  const top = MSGS[0];
  if (top && top.html === html && Date.now() - top.t < 5000) { top.n++; top.t = Date.now(); }
  else { MSGS.unshift({ html, cls, t: Date.now(), n: 1, ms }); if (MSGS.length > 200) MSGS.pop(); }
  if (cls === 'warn') SFX.play('error');
  renderFeed();
}
let feedSeq = 0;
function renderFeed() {
  const box = $('#feed'); if (!box) return;
  const t = Date.now();
  const vis = MSGS.filter(m => t - m.t < m.ms).slice(0, 2);
  // Keyed diff: only add/remove lines that changed, so the slide-in animation plays once per message.
  for (const m of vis) m.k ||= ++feedSeq;
  const want = new Set(vis.map(m => String(m.k)));
  [...box.children].forEach(el => { if (!want.has(el.dataset.k)) el.remove(); });
  vis.forEach((m, i) => {
    let el = box.querySelector(`[data-k="${m.k}"]`);
    const cnt = m.n > 1 ? ` <b class="cnt">×${m.n}</b>` : '';
    if (!el) {
      el = document.createElement('div'); el.dataset.k = m.k; el.className = `feed-line ${m.cls}`;
      el.innerHTML = m.html + cnt; el.dataset.n = m.n;
    } else if (el.dataset.n != m.n) { el.innerHTML = m.html + cnt; el.dataset.n = m.n; }
    if (box.children[i] !== el) box.insertBefore(el, box.children[i] || null);
  });
  box.classList.toggle('empty', !vis.length);
  clearTimeout(feedTimer);
  if (vis.length) feedTimer = setTimeout(renderFeed, 500);
}
function openMsgLog(filter = 'all') {
  const F = { all: () => true, loot: m => ['rare', 'pet'].includes(m.cls), levels: m => m.cls === 'lvlup', warn: m => m.cls === 'warn' };
  const list = MSGS.filter(F[filter] || F.all).slice(0, 120);
  openModal(`<h2>💬 Game messages</h2>
    <div class="chips">${[['all', 'All'], ['loot', 'Loot & pets'], ['levels', 'Levels'], ['warn', 'Warnings']].map(([k, n]) => `<button class="chip ${k === filter ? 'on' : ''}" data-act="msglog" data-id="${k}">${n}</button>`).join('')}</div>
    <div class="chatbox">${list.map(m => `<div class="chat ${m.cls}"><small>${new Date(m.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small> ${m.html}${m.n > 1 ? ` <b class="cnt">×${m.n}</b>` : ''}</div>`).join('') || '<p class="muted">Nothing yet.</p>'}</div>`);
}

/* ---------- Event tracking (challenges + clue steps) ---------- */
function track(type, key, n = 1) {
  const ch = S.ch;
  if (ch && ch.daily) for (const c of [...ch.daily, ...(ch.weekly || [])]) {
    if (c.done || c.type !== type || (c.key !== '*' && c.key !== key)) continue;
    c.prog = Math.min(c.n, c.prog + n);
    if (c.prog >= c.n) { c.done = true; if (!OFF) { toast(`📅 Challenge complete: <b>${c.text}</b>. Claim it in More → Challenges.`, 'rare', 5000); SFX.play('ach'); } }
  }
  clueStepTrack(type, key, n);
}

/* ---------- Daily & weekly challenges ---------- */
const CH_TPL = [
  { type: 'yield', key: 'mine', sk: 'mining', t: 'Mine {n} ores', b: 60 }, { type: 'yield', key: 'forest', sk: 'woodcutting', t: 'Chop {n} logs', b: 60 },
  { type: 'yield', key: 'fish', sk: 'fishing', t: 'Catch {n} fish', b: 50 }, { type: 'yield', key: 'range', sk: 'cooking', t: 'Cook {n} food', b: 50 },
  { type: 'yield', key: 'fire', sk: 'firemaking', t: 'Burn {n} logs', b: 50 }, { type: 'yield', key: 'furnace', sk: 'smithing', t: 'Smelt {n} bars', b: 40 },
  { type: 'yield', key: 'anvil', sk: 'smithing', t: 'Smith {n} items', b: 25 }, { type: 'yield', key: 'craft', sk: 'crafting', t: 'Craft {n} items', b: 25 },
  { type: 'yield', key: 'fletch', sk: 'fletching', t: 'Fletch {n} items', b: 60 }, { type: 'yield', key: 'herb', sk: 'herblore', t: 'Mix {n} potions', b: 15 },
  { type: 'yield', key: 'thieve', sk: 'thieving', t: 'Attempt {n} thefts', b: 60 }, { type: 'yield', key: 'course', sk: 'agility', t: 'Run {n} agility laps', b: 12 },
  { type: 'yield', key: 'altar', sk: 'prayer', t: 'Offer {n} bones', b: 40 }, { type: 'yield', key: 'dig', sk: 'archaeology', t: 'Excavate {n} times', b: 40 },
  { type: 'kill', key: '*', sk: 'attack', t: 'Kill {n} monsters', b: 40 }, { type: 'task', key: '*', sk: 'slayer', t: 'Kill {n} Slayer task monsters', b: 25, need: () => LV.slayer >= 5 },
  { type: 'boss', key: '*', sk: null, t: 'Defeat {n} bosses', b: 2, fixed: true, need: () => combatLevel() >= 80 }, { type: 'clue', key: '*', sk: null, t: 'Complete {n} clue scroll', b: 1, fixed: true },
  { type: 'pot', key: '*', sk: 'herblore', t: 'Drink {n} potions', b: 4, fixed: true, need: () => LV.herblore >= 3 }, { type: 'coins', key: '*', sk: null, t: 'Earn {n} coins', b: 0 },
];
function seeded(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }
function dayKey(d = new Date()) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function weekKey(d = new Date()) { const t = new Date(d); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return 'W' + dayKey(t); }
function makeChallenges(seedKey, count, mult) {
  const r = seeded(seedKey), pool = CH_TPL.filter(c => !c.need || c.need()), out = [];
  while (out.length < count && pool.length) {
    const c = pool.splice(Math.floor(r() * pool.length), 1)[0];
    let n;
    if (c.type === 'coins') n = Math.round((5000 + totalLevel() * 400) * mult / 100) * 100;
    else n = c.fixed ? c.b * (mult > 1 ? 4 : 1) : Math.round(c.b * (1 + (c.sk ? LV[c.sk] : 20) / 25) * mult);
    out.push({ type: c.type, key: c.key, n, prog: 0, done: false, claimed: false, text: c.t.replace('{n}', fmt(n)) + (c.type === 'clue' && n > 1 ? 's' : '') });
  }
  return out;
}
function ensureChallenges() {
  const ch = S.ch ||= {};
  const d = dayKey(), w = weekKey();
  if (ch.day !== d) { ch.day = d; ch.daily = makeChallenges(d, 3, 1); }
  if (ch.week !== w) { ch.week = w; ch.weekly = makeChallenges(w + 'wk', 3, 7); }
}
function claimChallenge(kind, i) {
  const c = S.ch[kind]?.[i];
  if (!c || !c.done || c.claimed) return;
  c.claimed = true;
  const weekly = kind === 'weekly';
  const coins = Math.round((weekly ? 100 : 12) * Math.max(50, totalLevel()));
  gainCoins(coins);
  const got = ['🪙' + fmt(coins)];
  const items = weekly ? [['xp_lamp', 1], ['mystery_box', 2], ['clue_hard', 1]] : [[pickWeighted([['casket', 30], ['clue_easy', 25], ['clue_medium', 15], ['mystery_box', 15], ['xp_lamp', 15]]), 1]];
  items.forEach(([id, q]) => { add(id, q); got.push(`${q} × ${ITEMS[id].name}`); });
  S.lifetime.dailies = (S.lifetime.dailies || 0) + 1;
  toast(`📅 Reward claimed: ${got.join(', ')}`, 'rare', 5000); SFX.play('coin');
}

/* ---------- Achievements ---------- */
function achContext() {
  const owned = new Set([...Object.keys(S.bank), ...Object.values(S.equip).filter(Boolean)]);
  return {
    S, LV, total: totalLevel(), clogPct: clogStats().pct,
    owns: pred => [...owned].some(id => ITEMS[id] && pred(ITEMS[id])),
    fullBarrows: !!M.set && BARROWS.some(b => b.id === M.set),
  };
}
function achPoints() { return ACHIEVEMENTS.reduce((a, x) => a + (S.ach[x.id] ? x.ap : 0), 0); }
function checkAchievements() {
  const g = achContext(), fresh = [];
  for (const a of ACHIEVEMENTS) if (!S.ach[a.id]) { try { if (a.test(g)) { S.ach[a.id] = Date.now(); fresh.push(a); } } catch (e) { } }
  if (!fresh.length) return;
  recalc();
  if (OFF) return;
  if (fresh.length > 3) toast(`🏆 <b>${fresh.length} achievements</b> unlocked! (${achPoints()} points)`, 'pet', 5000);
  else fresh.forEach(a => toast(`🏆 Achievement unlocked: <b>${a.name}</b> — ${a.desc} (+${a.ap} pt)`, 'pet', 5000));
  SFX.play('ach');
}

/* ---------- Collection log ---------- */
const CLOG = [];
(function buildClog() {
  const uniq = a => [...new Set(a)];
  const rareOf = m => m.drops.filter(d => d[1] <= 1 / 50 || d[0].startsWith('pet:')).map(d => d[0]);
  MONSTERS.filter(m => m.boss).forEach(m => CLOG.push({ id: 'm_' + m.id, name: m.name, icon: m.icon, cat: m.area === 'gwd' ? 'God Wars' : 'Bosses', items: uniq(rareOf(m)) }));
  CLOG.push({ id: 'slayer', name: 'Slayer monsters', icon: '💀', cat: 'Slayer', items: uniq(MONSTERS.filter(m => m.area === 'slayer').flatMap(rareOf)) });
  CLOG.push({ id: 'world', name: 'World monsters', icon: '🌄', cat: 'Other', items: uniq(MONSTERS.filter(m => m.area === 'overworld' && !m.boss).flatMap(rareOf)) });
  CLOG.push({ id: 'barrows', name: 'Barrows chests', icon: '⚱️', cat: 'Minigames', items: BARROWS_PIECES });
  Object.keys(CLUE_UNIQUES).forEach(t => CLOG.push({ id: 'clue_' + t, name: CLUE_TIERS[t].name + ' clues', icon: '📜', cat: 'Clues', items: CLUE_UNIQUES[t] }));
  CLOG.push({ id: 'skillpets', name: 'Skilling pets', icon: '🐾', cat: 'Other', items: Object.keys(PETS).filter(p => PETS[p].st !== 'combat').map(p => 'pet:' + p) });
  CLOG.push({ id: 'rogue', name: "Rogues' outfit", icon: '🦹', cat: 'Other', items: ROGUE.map(r => r[0]) });
  CLOG.push({ id: 'artifacts', name: 'Artifacts', icon: '🏺', cat: 'Other', items: DIGSITES.flatMap(d => d.arts.map(a => a[0])) });
  CLOG.push({ id: 'skilling', name: 'Skilling finds', icon: '💎', cat: 'Other', items: ['sapphire', 'emerald', 'ruby', 'diamond', 'dragonstone', 'bird_nest', 'casket', 'mark_of_grace', 'stardust', 'onyx'] });
  CLOG.forEach(p => p.items = p.items.filter(i => i.startsWith('pet:') ? PETS[i.slice(4)] : ITEMS[i]));
})();
const CLOG_ITEMS = new Set(CLOG.flatMap(p => p.items));
function logItem(id, q = 1) {
  if (!CLOG_ITEMS.has(id)) return;
  const first = !S.clog[id];
  S.clog[id] = (S.clog[id] || 0) + q;
  if (first) {
    const name = id.startsWith('pet:') ? PETS[id.slice(4)].name : ITEMS[id].name;
    if (OFF) OFFLOG.push(`📒 New collection log item: <b>${name}</b>`);
    else toast(`📒 New item added to your collection log: <b>${name}</b>`, 'rare', 5000);
    const before = M.clogPages;
    recalc();
    if (M.clogPages > before && !OFF) { toast(`📕 Collection log page complete! Permanent +1% XP and +1% damage.`, 'pet', 6000); SFX.play('ach'); }
  }
}
function clogStats() {
  let got = 0, tot = 0, pages = 0;
  for (const p of CLOG) { const g = p.items.filter(i => S.clog[i]).length; got += g; tot += p.items.length; if (g === p.items.length && p.items.length) pages++; }
  return { got, tot, pages, pct: tot ? Math.floor(got / tot * 1000) / 10 : 0 };
}

/* ---------- Clue scrolls ---------- */
const CLUE_KILL_RANGE = { easy: [1, 30], medium: [10, 90], hard: [50, 200], elite: [100, 450] };
function readClue(tier) {
  if (S.clues.active) return toast('You already have a clue scroll in progress. Finish it first (More → Clue scroll).', 'warn');
  if (!remove('clue_' + tier, 1)) return;
  const T = CLUE_TIERS[tier], steps = [];
  for (let i = 0; i < T.steps; i++) steps.push(makeClueStep(tier, i));
  S.clues.active = { tier, steps, idx: 0 };
  SFX.play('clue');
  go('clue');
}
function makeClueStep(tier, i) {
  const r = rnd(), T = CLUE_TIERS[tier];
  if (r < 0.4 || i === 0) {
    const [q, opts] = RIDDLES[randInt(0, RIDDLES.length - 1)];
    const order = opts.map((o, k) => [o, k]).sort(() => rnd() - 0.5);
    return { type: 'riddle', q, opts: order.map(o => o[0]), ans: order.findIndex(o => o[1] === 0) };
  }
  if (r < 0.7) {
    const [lo, hi] = CLUE_KILL_RANGE[tier];
    const pool = MONSTERS.filter(m => !m.boss && !m.barrows && m.lvl >= lo && m.lvl <= hi && (m.sl || 1) <= LV.slayer && ['overworld', 'slayer'].includes(m.area));
    if (pool.length) { const m = pool[randInt(0, pool.length - 1)]; return { type: 'kill', mon: m.id, n: tier === 'elite' ? 3 : 1, prog: 0 }; }
  }
  const acts = Object.values(ACTIONS).filter(a => !a.star && !a.inp && LV[STATIONS[a.st].skill] >= a.lvl && ['mine', 'forest', 'fish', 'dig', 'thieve', 'course'].includes(a.st));
  const a = acts[randInt(0, acts.length - 1)];
  const n = a.st === 'course' ? Math.max(1, Math.round(T.n / 5)) : T.n;
  return { type: 'skill', act: a.id, n, prog: 0 };
}
function clueStepText(s) {
  if (s.type === 'riddle') return `“${s.q}”`;
  if (s.type === 'kill') return `Defeat ${s.n > 1 ? s.n + ' × ' : 'a '}${MONSTER_BY_ID[s.mon].name}. (${s.prog}/${s.n})`;
  const a = ACTIONS[s.act];
  return `${STATIONS[a.st].verb} at <b>${a.name}</b> ${fmt(s.n)} time${s.n > 1 ? 's' : ''}. (${fmt(s.prog)}/${fmt(s.n)})`;
}
function clueAdvance() {
  const c = S.clues.active;
  c.idx++;
  if (c.idx < c.steps.length) { if (!OFF) { toast(`📜 You find another clue! Step ${c.idx + 1} of ${c.steps.length}.`, 'rare'); SFX.play('clue'); } UI.force = true; return; }
  finishClue(c.tier);
}
function clueStepKill(m) {
  const c = S.clues?.active; if (!c) return;
  const s = c.steps[c.idx];
  if (s.type === 'kill' && s.mon === m.id) { s.prog++; if (s.prog >= s.n) clueAdvance(); }
}
function clueStepTrack(type, key, n) {
  const c = S.clues?.active; if (!c || type !== 'act') return;
  const s = c.steps[c.idx];
  if (s.type === 'skill' && s.act === key) { s.prog += n; if (s.prog >= s.n) clueAdvance(); }
}
function answerRiddle(i) {
  const c = S.clues.active; if (!c) return;
  const s = c.steps[c.idx];
  if (s.type !== 'riddle') return;
  if (i === s.ans) clueAdvance();
  else { toast('Nothing interesting happens. Try another answer.', 'warn'); }
}
function finishClue(tier) {
  const T = CLUE_TIERS[tier];
  S.clues.active = null;
  S.clues.done[tier] = (S.clues.done[tier] || 0) + 1;
  const got = {}; let coins = 0;
  const rolls = randInt(T.rolls[0], T.rolls[1]);
  for (let i = 0; i < rolls; i++) {
    if (rnd() < T.rare * M.luck) { const u = CLUE_UNIQUES[tier][randInt(0, CLUE_UNIQUES[tier].length - 1)]; got[u] = (got[u] || 0) + 1; }
    else { const [id, a, b] = CLUE_COMMON[tier][randInt(0, CLUE_COMMON[tier].length - 1)]; if (id === 'coins') coins += randInt(a, b); else got[id] = (got[id] || 0) + randInt(a, b); }
  }
  if (coins) gainCoins(coins);
  for (const id in got) { add(id, got[id]); logItem(id, got[id]); }
  track('clue', tier, 1);
  const html = `${coins ? `<div class="mini">🪙<span>${fmt(coins)}</span></div>` : ''}${Object.entries(got).map(([id, n]) => `<div class="mini ${CLUE_UNIQUES[tier].includes(id) ? 'uniq' : ''}">${itemIcon(id)}<span>${fmt(n)}</span></div>`).join('')}`;
  if (OFF) { OFFLOG.push(`📜 Completed a ${tier} clue scroll!`); return; }
  SFX.play(Object.keys(got).some(id => CLUE_UNIQUES[tier].includes(id)) ? 'rare' : 'clue');
  openModal(`<div class="item-modal"><h2>📜 ${T.name} treasure trail complete!</h2><p class="muted">You have completed ${S.clues.done[tier]} ${tier} clue${S.clues.done[tier] > 1 ? 's' : ''}.</p>
    <div class="mini-grid casket">${html}</div><button class="btn big" data-act="close">Close</button></div>`);
  UI.force = true;
}
function clueTierFor(lvl) { return lvl < 25 ? 'easy' : lvl < 70 ? 'medium' : lvl < 150 ? 'hard' : 'elite'; }
function monsterExtras(m) {
  const out = [];
  const ch = (m.boss ? 1 / 60 : 1 / 128) * M.luck;
  if (rnd() < ch) { const t = m.boss ? 'elite' : clueTierFor(m.lvl); add('clue_' + t, 1); out.push(`Clue scroll (${t})`); if (!OFF) { toast(`📜 ${m.name} dropped a <b>${t}</b> clue scroll!`, 'rare'); SFX.play('clue'); } }
  const se = activeSeason();
  if (se && rnd() < 1 / 30) { add(se.token, 1); out.push(ITEMS[se.token].name); }
  return out;
}

/* ---------- Barrows ---------- */
function barrowsKill(m) {
  const B = S.barrows;
  if (!B.killed.includes(m.barrows)) B.killed.push(m.barrows);
  if (B.killed.length >= BARROWS.length) {
    B.killed = []; B.chests = (B.chests || 0) + 1;
    track('barrows', '*', 1);
    const got = []; const coins = randInt(2000, 9000); gainCoins(coins); got.push('🪙' + fmt(coins));
    const bolts = pickWeighted([['mithril_bolts', 50], ['adamant_bolts', 30], ['rune_bolts', 20]]); const q = randInt(20, 80); add(bolts, q); got.push(`${q} × ${ITEMS[bolts].name}`);
    if (rnd() < (1 / 12) * M.luck) { const p = BARROWS_PIECES[randInt(0, BARROWS_PIECES.length - 1)]; rareGet(p, 1, 'drop'); logItem(p, 1); got.push(ITEMS[p].name); }
    if (rnd() < 1 / 30) { add('clue_hard', 1); got.push('Clue scroll (hard)'); }
    const msg = `⚱️ Barrows chest: ${got.join(', ')} (${B.chests} chests)`;
    if (OFF) OFFLOG.push(msg); else { toast(msg, 'rare', 6000); SFX.play('rare'); }
  }
  const next = BARROWS.find(b => !B.killed.includes(b.id));
  S.combat.mon = 'barrows_' + (next || BARROWS[0]).id;
  UI.force = true;
}

/* ---------- Thieving & agility ---------- */
let LAST_FAIL = 0, LAST_LOOT = '';
const thieveChance = a => clamp(0.55 + (LV.thieving - a.lvl) * 0.012 + (M.rogue >= 5 ? 0.05 : 0), 0.5, 0.97);
function thieveYield(st, a, n, xpScale) {
  const t = a.thieve, ok = rollCount(n, thieveChance(a));
  LAST_FAIL = n - ok; LAST_LOOT = '';
  track('yield', st, n); track('act', a.id, ok);
  if (ok <= 0) return n;
  gainXP('thieving', a.xp * ok * xpScale);
  const mult = M.rogue >= 5 ? 2 : 1 + M.rogue * 0.15;
  if (t.coins) { const c = Math.round((t.coins[0] + t.coins[1]) / 2 * ok * mult); gainCoins(c); LAST_LOOT = '🪙' + c; }
  for (const [id, ch, lo, hi] of t.loot) {
    const k = Math.round(rollCount(ok, ch >= 1 ? 1 : ch * M.luck) * mult);
    if (!k) continue;
    if (id === 'seedtable' || id === 'gemtable') {
      const tbl = id === 'seedtable' ? SEED_TABLE : GEM_TABLE, got = {};
      for (let i = 0; i < Math.min(k, 200); i++) { const s = pickWeighted(tbl); got[s] = (got[s] || 0) + 1; }
      const sc = k > 200 ? k / 200 : 1;
      for (const s in got) { add(s, Math.round(got[s] * sc)); LAST_LOOT = ITEMS[s].name; }
    } else { add(id, k * randInt(lo, hi)); LAST_LOOT = ITEMS[id].name; if (ch <= 1 / 50) logItem(id, k); }
  }
  if (rollCount(ok, (1 / 700) * M.luck)) {
    const missing = ROGUE.map(r => r[0]).filter(id => !S.clog[id]);
    const id = (missing.length ? missing : ROGUE.map(r => r[0]))[randInt(0, (missing.length || ROGUE.length) - 1)];
    rareGet(id, 1, 'skill'); logItem(id, 1);
  }
  if (t.clue && rollCount(ok, t.clue[1] * M.luck)) { add('clue_' + t.clue[0], 1); if (!OFF) toast(`📜 You find a <b>${t.clue[0]}</b> clue scroll!`, 'rare'); }
  rollPet(st, ok);
  return n;
}
function courseYield(st, a, n, xpScale) {
  gainXP('agility', a.xp * n * xpScale);
  const marks = rollCount(n, a.course.mark * M.luck);
  if (marks) { add('mark_of_grace', marks); logItem('mark_of_grace', marks); if (!OFF) toast(`✨ You find ${marks > 1 ? marks + ' marks' : 'a mark'} of grace!`, 'rare'); }
  S.lifetime.laps = (S.lifetime.laps || 0) + n;
  track('yield', st, n); track('act', a.id, n);
  rollPet(st, n);
  return n;
}
const AGI = { zone: 0.5, w: 0.13, pw: 0.04 };
const agiSpeed = () => { const a = ACTIONS[S.target.course]; return 1.8 + (a?.lvl || 1) / 45; };
const agiPos = () => (Math.sin(performance.now() / 1000 * agiSpeed() * Math.PI) + 1) / 2;
function agiJudge() {
  const d = Math.abs(agiPos() - AGI.zone);
  const res = d <= AGI.pw ? 'perfect' : d <= AGI.w ? 'good' : 'miss';
  AGI.zone = 0.15 + rnd() * 0.7;
  const z = $('#agi-zone'); if (z) { z.style.left = (AGI.zone - AGI.w) * 100 + '%'; z.style.width = AGI.w * 200 + '%'; }
  const p = $('#agi-perfect'); if (p) { p.style.left = (AGI.zone - AGI.pw) * 100 + '%'; p.style.width = AGI.pw * 200 + '%'; }
  return res;
}
function agiAnim() {
  const el = $('#agi-cursor');
  if (!el) return;
  el.style.left = agiPos() * 100 + '%';
  requestAnimationFrame(agiAnim);
}

/* ---------- Shooting stars ---------- */
const starActive = () => S.star && now() < S.star.until && S.star.tier > 0;
const starDust = tier => 50 + tier * 25;
function syncStarAction() {
  const a = ACTIONS.m_star, t = S.star?.tier || 1;
  a.lvl = t * 10; a.xp = 14 * t + 16; a.hp = 4 + t * 2; a.name = `Crashed star (tier ${t})`;
}
function starTick() {
  if (S.star && (now() >= S.star.until || S.star.tier <= 0)) { S.star = null; if (S.target.mine === 'm_star') S.target.mine = S.prevMine || 'm_copper_ore'; if (!OFF) toast('🌠 The shooting star has crumbled to dust.'); }
  if (!S.star && now() >= (S.nextStar || 0)) {
    const tier = randInt(1, 9);
    S.star = { tier, dust: starDust(tier), until: now() + randInt(40, 75) * 60000 };
    S.nextStar = S.star.until + randInt(45, 150) * 60000 * (M.eventFreq || 1);
    syncStarAction();
    if (!OFF) { toast(`🌠 A tier ${tier} shooting star has crashed near the mine! Mining ${tier * 10} needed.`, 'pet', 6000); SFX.play('star'); }
    UI.force = true;
  }
}
function starYield(st, a, n, xpScale) {
  if (!starActive()) return 0;
  const k = Math.min(n, S.star.dust);
  add('stardust', k); logItem('stardust', k);
  gainXP('mining', a.xp * k * xpScale);
  S.lifetime.stardust = (S.lifetime.stardust || 0) + k;
  S.star.dust -= k;
  track('yield', 'mine', k);
  if (S.star.dust <= 0) {
    S.star.tier--;
    if (S.star.tier <= 0) { S.star = null; S.target.mine = S.prevMine || 'm_copper_ore'; if (!OFF) toast('🌠 You mined the last of the star!'); }
    else { S.star.dust = starDust(S.star.tier); syncStarAction(); if (!OFF) toast(`🌠 The star shrinks to tier ${S.star.tier}.`); }
    UI.force = true;
  }
  return k;
}

/* ---------- Seasonal events ---------- */
function activeSeason(d = new Date(now())) {
  const md = (d.getMonth() + 1) * 100 + d.getDate();
  return SEASONS.find(s => { const a = s.from[0] * 100 + s.from[1], b = s.to[0] * 100 + s.to[1]; return a <= b ? md >= a && md <= b : md >= a || md <= b; }) || null;
}

/* ---------- Grand Exchange ---------- */
const GE_ITEMS = Object.values(ITEMS).filter(i => !i.hidden && !i.untradeable && i.value >= 1).map(i => i.id);
const GE_SET = new Set(GE_ITEMS);
const GE_STEP = 10 * 60000;
const geF = id => S.ge.f[id] ?? 1;
function geBuyPrice(id) { return Math.max(1, Math.ceil(ITEMS[id].value * geF(id) * 1.02)); }
function geSellPrice(id) { return Math.max(1, Math.floor(sellPrice(id) * geF(id) * 0.98)); }
function geStep() {
  const G = S.ge;
  for (const id of GE_ITEMS) {
    let f = G.f[id] ?? 1;
    const z = (rnd() + rnd() + rnd() - 1.5) * 0.12;
    f = clamp(f * Math.exp(z) + (1 - f) * 0.08, 0.45, 2.2);
    G.f[id] = Math.round(f * 1000) / 1000;
  }
  if (rnd() < 0.35) {
    const id = GE_ITEMS[randInt(0, GE_ITEMS.length - 1)], up = rnd() < 0.5;
    G.f[id] = clamp(G.f[id] * (up ? 1.6 : 0.6), 0.45, 2.2);
    G.news.unshift(`${up ? '📈' : '📉'} ${ITEMS[id].name} ${up ? 'soars' : 'crashes'} to ${Math.round(G.f[id] * 100)}% of value`);
    G.news.length = Math.min(G.news.length, 8);
  }
  const watch = new Set([...Object.keys(S.bank), ...(G.watch || [])]);
  for (const id of watch) if (GE_SET.has(id)) { const h = G.hist[id] ||= []; h.push(G.f[id] ?? 1); if (h.length > 24) h.shift(); }
}
function geTick() {
  const G = S.ge;
  if (!G.t) G.t = now();
  let steps = 0;
  while (now() - G.t >= GE_STEP && steps < 24) { geStep(); G.t += GE_STEP; steps++; }
  if (now() - G.t >= GE_STEP) G.t = now();
}
function geSell(id, q) {
  if (S.locked[id]) return toast(`${ITEMS[id].name} is locked. Unlock it first.`, 'warn');
  q = Math.min(q, have(id)); if (q <= 0 || !GE_SET.has(id)) return;
  const p = geSellPrice(id), base = sellPrice(id);
  const got = saleTake(id, q, p); remove(id, q); gainCoins(got);
  if (p > base) S.lifetime.geProfit = (S.lifetime.geProfit || 0) + (p - base) * q;
  toast(`📈 Sold ${fmt(q)} × ${ITEMS[id].name} on the GE for 🪙${fmt(got)}`); SFX.play('coin');
}
function geBuy(id, q) {
  if (!GE_SET.has(id)) return;
  const cost = geBuyPrice(id) * q;
  if (S.coins < cost) return toast("You don't have enough coins.", 'warn');
  S.coins -= cost; add(id, q);
  toast(`📈 Bought ${fmt(q)} × ${ITEMS[id].name} for 🪙${fmt(cost)}`); SFX.play('coin');
}

/* ---------- Loadouts & cosmetics ---------- */
function saveLoadout(i, name) {
  const C = S.combat;
  S.loadouts[i] = { name: name || `Loadout ${i + 1}`, equip: Object.fromEntries(GEAR_SLOTS.map(s => [s, S.equip[s]])), style: C.style, food: C.food, pots: [...(C.pots || [])], ammo: C.ammo };
  toast(`💾 Saved ${S.loadouts[i].name}.`);
}
function equipLoadout(i) {
  const L = S.loadouts[i]; if (!L) return;
  const missing = [];
  for (const s of GEAR_SLOTS) { if (S.equip[s] && S.equip[s] !== L.equip[s]) { add(S.equip[s], 1); S.equip[s] = null; } }
  for (const s of GEAR_SLOTS) {
    const id = L.equip[s]; if (!id || S.equip[s] === id) continue;
    const it = ITEMS[id];
    if (!have(id)) { missing.push(it.name); continue; }
    if (!reqOk(it.req)) { missing.push(it.name + ' (level)'); continue; }
    remove(id, 1); S.equip[s] = id;
  }
  Object.assign(S.combat, { style: L.style, food: L.food, pots: [...(L.pots || [])], ammo: L.ammo });
  recalc();
  toast(`🎒 Equipped ${L.name}.${missing.length ? ' Missing: ' + missing.join(', ') : ''}`, missing.length ? 'warn' : '');
}
const lookOf = slot => S.cosmetic[slot] || S.equip[slot];

/* ---------- XP lamps ---------- */
function useLamp(sk) {
  if (!remove('xp_lamp', 1)) return;
  const L = LV[sk], xp = Math.max(500, 12 * L * L + 200);
  const got = gainXP(sk, xp);
  toast(`🪔 You rub the lamp: <b>${fmt(got)} ${SKILLS[sk].name} XP</b>!`, 'rare'); SFX.play('rare');
}

/* ---------- Item sources (for guides & item info) ---------- */
const SOURCES = {};
(function buildSources() {
  const addS = (id, s) => { if (!ITEMS[id]) return; (SOURCES[id] ||= []); if (!SOURCES[id].includes(s)) SOURCES[id].push(s); };
  const frac = c => c >= 1 ? 'always' : `1/${Math.round(1 / c)}`;
  MONSTERS.forEach(m => m.drops.forEach(([id, c]) => { if (!id.startsWith('pet:')) addS(id, `Drop: ${m.name} (${frac(c)})`); }));
  Object.values(ACTIONS).forEach(a => {
    const sk = STATIONS[a.st].skill;
    Object.keys(a.out).forEach(id => addS(id, `${STATIONS[a.st].verb}: ${a.name} (${SKILLS[sk].name} ${a.lvl})`));
  });
  Object.entries(SHOP).forEach(([cat, list]) => list.forEach(({ id, price }) => addS(id, `Shop (${cat}): 🪙${fmt(price)}`)));
  SLAYER_GEAR_SHOP.forEach(([id, p]) => addS(id, `Slayer shop: 🪙${fmt(p)}`));
  SLAYER_SHOP.filter(x => x.item).forEach(x => addS(x.id, `Slayer shop: ${x.pts} points`));
  RECIPES.forEach(r => addS(r.out, `Combine: ${Object.keys(r.inp).map(i => ITEMS[i].name).join(' + ')}`));
  THIEVING.forEach(t => t.loot.forEach(([id]) => addS(id, `Thieving: ${t.name} (${t.lvl})`)));
  SEED_TABLE.forEach(([id]) => addS(id, 'Thieving: master farmer'));
  ROGUE.forEach(([id]) => addS(id, 'Thieving: rare find while stealing'));
  GRACEFUL.forEach(([id, , , , cost]) => addS(id, `Agility: ${cost} marks of grace`));
  Object.entries(CLUE_UNIQUES).forEach(([t, list]) => list.forEach(id => addS(id, `Clue scroll reward (${t})`)));
  BARROWS_PIECES.forEach(id => addS(id, 'Barrows chest'));
  STAR_SHOP.forEach(([id, c]) => addS(id, `Star shop: ${c} stardust`));
  SEASONS.forEach(z => z.shop.forEach(([id, c]) => addS(id, `${z.name} event: ${c} ${ITEMS[z.token].name.toLowerCase()}s`)));
  DIGSITES.forEach(d => d.arts.forEach(([id]) => addS(id, `Archaeology: ${d.name} (${d.lvl})`)));
  SKILL_ORDER.forEach(s => addS(s + '_cape', `Shop (capes): 🪙99,000 at ${SKILLS[s].name} 99`));
})();
const itemSources = id => SOURCES[id] || [];
