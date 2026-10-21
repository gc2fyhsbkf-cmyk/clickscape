'use strict';
/* =========================================================
   CLICKSCAPE v9.30 — Treasure maps (clue overhaul): new step types and original riddles that get
   harder with the tier, clear monster/boss directions, reworked chest loot (uniques per chest,
   the priciest ones much rarer), treasure-chest art; the Treasure hunter outfit; and a
   skilling-look picker in the Costume room
   ========================================================= */

/* ================= NAMES & ART ================= */
Object.keys(CLUE_TIERS).forEach(t => {
  const n = CLUE_TIERS[t].name;
  if (ITEMS['clue_' + t]) { ITEMS['clue_' + t].name = `Treasure map (${t})`; ITEMS['clue_' + t].kind = 'tmap'; }
  if (ITEMS['casket_' + t]) { const c = ITEMS['casket_' + t]; c.name = `Treasure chest (${t})`; delete c.emoji; c.kind = 'tchest'; c.tint = CLUE_TIERS[t].tint; }
});
SHAPES.tmap = t => `<path d="M4 7 L11 4 L21 7 L28 4 L28 25 L21 28 L11 25 L4 28 Z" fill="#e8d8a8" ${K}/><path d="M11 4 L11 25 M21 7 L21 28" stroke="#b8a070" stroke-width="1"/>
  <path d="M8 20 Q12 14 16 17 Q20 20 22 12" stroke="#8a6a3a" stroke-width="1.2" stroke-dasharray="2 1.6" fill="none"/><path d="M20 9 L25 14 M25 9 L20 14" stroke="#c02020" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M4 7 L4 28" stroke="${t}" stroke-width="3"/><path d="M28 4 L28 25" stroke="${t}" stroke-width="3"/>`;
SHAPES.tchest = t => `<path d="M4 14 L28 14 L28 27 L4 27 Z" fill="#8a5a2a" ${K}/><path d="M4 14 Q4 6 16 6 Q28 6 28 14 Z" fill="#a06a32" ${K}/>
  <path d="M4 14 L28 14 M4 20 L28 20" stroke="${t}" stroke-width="2.2"/><path d="M9 7.5 L9 27 M23 7.5 L23 27" stroke="${t}" stroke-width="2.2"/>
  <rect x="13.5" y="16" width="5" height="6" rx="1" fill="${t}" stroke="#000" stroke-width="1"/><circle cx="16" cy="18.6" r="1" fill="#000"/>`;
Object.keys(CLUE_TIERS).forEach(t => { delete _iconCache['clue_' + t]; delete _iconCache['casket_' + t]; });
const TM_WORDS = [[/Clue scrolls/g, 'Treasure maps'], [/Clue scroll/g, 'Treasure map'], [/clue scrolls/g, 'treasure maps'], [/clue scroll/g, 'treasure map'], [/Reward caskets/g, 'Treasure chests'], [/Reward casket/g, 'Treasure chest'],
  [/reward caskets/g, 'treasure chests'], [/reward casket/g, 'treasure chest'], [/(?<=[\s>(])clues(?=[\s<.,)!:;])/g, 'maps'], [/(?<=[\s>(])clue(?=[\s<.,)!:;])/g, 'map'], [/(?<=[\s>(\d])Clues(?=[\s<.,)!:;])/g, 'Maps'], [/(?<=[\s>(])Clue(?=[\s<.,)!:;])/g, 'Map'], [/📜 Treasure map/g, '🗺️ Treasure map'], [/treasure trail/g, 'treasure hunt'], [/Treasure trail/g, 'Treasure hunt']];
rebrand = (orig => function (s) { s = orig(s); if (typeof s !== 'string') return s; for (const [re, to] of TM_WORDS) s = s.replace(re, to); return s; })(rebrand);
for (const k in SOURCES) SOURCES[k] = SOURCES[k].map(rebrand);

/* ================= RIDDLES (original; harder with the tier) ================= */
const RID = {
  easy: [
    ['I have keys but open no locks, and space but no room. What am I?', ['A keyboard', 'A castle', 'A map', 'A chest']],
    ['The more you take, the more you leave behind. What are they?', ['Footsteps', 'Coins', 'Breaths', 'Apples']],
    ['I am full of holes but still hold water. What am I?', ['A sponge', 'A bucket', 'A net', 'A boot']],
    ['What has a neck but no head?', ['A bottle', 'A snake', 'A shirt', 'A guitar case']],
    ['What gets wetter the more it dries?', ['A towel', 'A river', 'A cloud', 'Bread']],
    ['I can be cracked, made, told and played. What am I?', ['A joke', 'An egg', 'A whip', 'A drum']],
    ['What has one eye but cannot see?', ['A needle', 'A potato', 'A storm', 'A cyclops statue']],
    ['What can travel around the world while staying in a corner?', ['A stamp', 'A spider', 'A shadow', 'A compass']],
    ['What has hands but cannot clap?', ['A clock', 'A statue', 'A glove', 'A tree']],
    ['A miner finds 3 ores a minute. How many does he find in a quarter of an hour?', ['45', '30', '15', '60']],
    ['What comes once in a minute, twice in a moment, but never in a thousand years?', ['The letter M', 'A heartbeat', 'A comet', 'Midnight']],
    ['What has a bed but never sleeps, and a mouth but never eats?', ['A river', 'A dragon', 'A cave', 'An inn']],
  ],
  hard: [
    ['A forge makes 7 bars every 2 minutes. How many bars in 3 hours?', ['630', '420', '700', '540']],
    ['A ranger has 3 times as many arrows as bows. Together they make 48. How many bows?', ['12', '16', '9', '36']],
    ['I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?', ['An echo', 'A flute', 'A ghost', 'A sail']],
    ['The person who makes it sells it; the person who buys it never uses it; the person who uses it never sees it. What is it?', ['A coffin', 'A crown', 'A shadow', 'A map']],
    ['What number comes next: 2, 6, 12, 20, 30, …?', ['42', '40', '36', '44']],
    ['A potion doubles in strength every day. On day 10 it is at full strength. On which day was it at half strength?', ['Day 9', 'Day 5', 'Day 8', 'Day 1']],
    ['Forward I am heavy, backward I am not. What am I?', ['Ton', 'Stone', 'Anvil', 'Lead']],
    ['A chest holds coins. Take away half, then 10 more, and 30 remain. How many were there?', ['80', '70', '60', '100']],
    ['What can fill a room but takes up no space?', ['Light', 'Air', 'Smoke', 'Silence']],
    ['Three workers chop 3 trees in 3 minutes. How long do 9 workers take to chop 9 trees?', ['3 minutes', '9 minutes', '1 minute', '27 minutes']],
    ['If you have me, you want to share me. If you share me, you no longer have me. What am I?', ['A secret', 'Gold', 'A meal', 'A map']],
    ['What is always in front of you but cannot be seen?', ['The future', 'Your nose', 'The wind', 'A mirror']],
  ],
  elite: [
    ['A bat and a ball cost 110 coins together. The bat costs 100 more than the ball. How much is the ball?', ['5', '10', '15', '1']],
    ['It takes 5 smiths 5 minutes to forge 5 swords. How long do 100 smiths take to forge 100 swords?', ['5 minutes', '100 minutes', '20 minutes', '1 minute']],
    ['A lily patch doubles in size each day and covers the lake on day 48. When did it cover half the lake?', ['Day 47', 'Day 24', 'Day 46', 'Day 12']],
    ['Next in the pattern: 1, 1, 2, 3, 5, 8, 13, …?', ['21', '18', '20', '26']],
    ['A merchant buys a sword for 60, sells it for 70, buys it back for 80 and sells it for 90. Profit?', ['20', '10', '30', '0']],
    ['What five-letter word becomes shorter when you add two letters to it?', ['Short', 'Small', 'Brief', 'Quick']],
    ['A clock shows 3:15. What is the angle between the hands?', ['7.5°', '0°', '15°', '90°']],
    ['Two fathers and two sons go fishing. Each catches one fish, and they bring home three. How?', ['They are grandfather, father and son', 'One fish escaped', 'One was eaten', 'One son is a ghost']],
    ['Which is heavier: a tonne of feathers or a tonne of iron?', ['They weigh the same', 'Iron', 'Feathers', 'It depends on the wind']],
    ['I am an odd number. Take away one letter and I become even. What number am I?', ['Seven', 'Nine', 'Five', 'Three']],
    ['A rope ladder hangs over a ship with rungs 30cm apart. The tide rises 1m. How many rungs are now under water if 2 were before?', ['2', '5', '6', '3']],
    ['How many times can you subtract 10 from 100?', ['Once', 'Ten times', 'Nine times', 'Forever']],
  ],
};
const ridPool = t => t === 'easy' || t === 'medium' ? RID.easy : t === 'hard' ? RID.hard : RID.elite;

/* ================= STEPS ================= */
const TM_RANGE = { easy: [1, 30], medium: [10, 90], hard: [40, 200], elite: [90, 450], master: [150, 99999] };
const TM_MIX = { easy: { riddle: .4, kill: .3, skill: .3 }, medium: { riddle: .3, kill: .25, skill: .25, give: .2 }, hard: { riddle: .25, kill: .25, skill: .2, give: .3 },
  elite: { riddle: .2, kill: .2, skill: .15, give: .25, boss: .2 }, master: { riddle: .2, kill: .15, give: .25, boss: .4 } };
const TM_KILLN = { easy: 1, medium: 1, hard: 2, elite: 3, master: 5 }, TM_GIVEN = { medium: 10, hard: 25, elite: 50, master: 100 };
function tmPick(tier) { const M2 = TM_MIX[tier] || TM_MIX.medium; let r = Math.random(), last = 'riddle'; for (const [k, p] of Object.entries(M2)) { last = k; if ((r -= p) <= 0) return k; } return last; }
makeClueStep = function (tier, i) {
  const T = CLUE_TIERS[tier] || CLUE_TIERS.medium; let type = i === 0 ? 'riddle' : tmPick(tier);
  for (let tries = 0; tries < 6; tries++) {
    if (type === 'riddle') { const P = ridPool(tier), [q, opts] = P[randInt(0, P.length - 1)]; const order = opts.map((o, k) => [o, k]).sort(() => Math.random() - 0.5); return { type: 'riddle', q, opts: order.map(o => o[0]), ans: order.findIndex(o => o[1] === 0) }; }
    if (type === 'kill' || type === 'boss') {
      const [lo, hi] = TM_RANGE[tier] || TM_RANGE.medium, boss = type === 'boss';
      const pool = MONSTERS.filter(m => !!m.boss === boss && !m.raid && !m.barrows && !m.season && !m.transReq && m.lvl >= (boss ? 0 : lo) && m.lvl <= hi && regionOf(m) && regionOf(m) !== 'echo' && !canFight(m));
      if (pool.length) { const m = pool[randInt(0, pool.length - 1)]; return { type: 'kill', mon: m.id, n: boss ? 1 : TM_KILLN[tier] || 1, prog: 0 }; }
      type = 'skill';
    }
    if (type === 'give') {
      const opts = []; for (const [st, L] of Object.entries(STATION_ACTIONS)) { const sk = STATIONS[st]?.skill; if (!sk || ['dig', 'restore', 'thieve', 'course', 'altar', 'harbour'].includes(st)) continue; for (const a of L) { if ((LV[sk] || 1) < a.lvl || !a.out) continue; const id = Object.keys(a.out)[0]; if (ITEMS[id] && !ITEMS[id].untradeable && a.lvl >= (LV[sk] || 1) * 0.35) opts.push(id); } }
      if (opts.length) { const id = opts[randInt(0, opts.length - 1)]; return { type: 'give', id, n: TM_GIVEN[tier] || 10 }; }
      type = 'skill';
    }
    if (type === 'skill') {
      const acts = Object.values(ACTIONS).filter(a => !a.star && !a.inp && STATIONS[a.st] && LV[STATIONS[a.st].skill] >= a.lvl && ['mine', 'forest', 'fish', 'dig', 'thieve', 'course'].includes(a.st) && a.lvl >= LV[STATIONS[a.st].skill] * (tier === 'easy' ? 0 : 0.4));
      if (acts.length) { const a = acts[randInt(0, acts.length - 1)]; return { type: 'skill', act: a.id, n: a.st === 'course' ? Math.max(1, Math.round(T.n / 5)) : T.n, prog: 0 }; }
      type = 'riddle';
    }
  }
  return { type: 'riddle', q: RID.easy[0][0], opts: RID.easy[0][1], ans: 0 };
};
const monWhere = m => { const r = regionOf(m), R = REG_BY_ID[r]; return R ? `${R.icon} ${R.name}` : r === 'slayer' ? '💀 Bounty monsters' : ''; };
clueStepText = (orig => function (s) {
  if (s.type === 'give') return `Bring the cartographer <b>${fmt(s.n)} × ${ITEMS[s.id].name}</b>. You have ${fmt(have(s.id))}.`;
  if (s.type === 'kill') { const m = MONSTER_BY_ID[s.mon]; return `Defeat ${s.n > 1 ? s.n + ' × ' : m.boss ? '' : 'a '}<b>${m.icon} ${m.name}</b>${m.boss ? ' (boss)' : ''}. (${s.prog}/${s.n})<br><small class="muted">Found in ${monWhere(m)} · level ${fmt(m.lvl)}${canFight(m) ? ` · 🔒 ${String(canFight(m)).replace(/^🗺️ /, '')}` : ''}</small>`; }
  return orig(s);
})(clueStepText);
viewClue = (orig => function () {
  const c = S.clues?.active, s = c?.steps?.[c.idx];
  if (!s || s.type !== 'give') return orig();
  c.steps[c.idx] = { type: 'riddle', q: '@@GIVE@@', opts: [] };
  let h; try { h = orig(); } finally { c.steps[c.idx] = s; }
  const ok = have(s.id) >= s.n && !S.locked[s.id];
  return h.replace('“@@GIVE@@”', clueStepText(s)).replace('<div class="riddle"></div>', `<button class="btn big ${ok ? '' : 'poor'}" data-act="clue-give">Hand over ${fmt(s.n)} × ${ITEMS[s.id].name}</button><p class="muted small">Make or gather them, then come back.${S.locked[s.id] ? ' (Unlock them first.)' : ''}</p>`);
})(viewClue);
VIEWS.clue = (orig => function () { return rebrand(orig()); })(viewClue);
viewSig = (orig => function () { if (UI.view !== 'clue') return orig(); const s = S.clues?.active?.steps?.[S.clues.active.idx]; return orig() + (s?.type === 'give' ? '|g' + have(s.id) : ''); })(viewSig);

/* ================= TREASURE HUNTER OUTFIT ================= */
OUTFITS.treasure = ['treasure', '#b8862a', 'Treasure hunter'];
OUTFIT_PIECES.forEach(([p, slot, kind]) => { gear(`treasure_${p}`, `Treasure hunter ${p}`, slot, [0, 0, 0], null, { kind, tint: '#b8862a', trim: '#e8d070', outfit: 'treasure', untradeable: true, value: 250000, rare: true }); ITEM_ORDER[`treasure_${p}`] = 1e6 + Object.keys(ITEM_ORDER).length; (SOURCES[`treasure_${p}`] ||= []).push('Treasure chests (any tier, rarer on easy ones)'); });
const thPieces = () => outfitCount('treasure');
// full set: one step fewer (never below 1)
readClue = (orig => function (tier) {
  const T = CLUE_TIERS[tier], s0 = T?.steps, full = thPieces() >= 4; if (full && T) T.steps = Math.max(1, s0 - 1);
  try { return orig(tier); } finally { if (T) T.steps = s0; }
})(readClue);

/* ================= CHEST LOOT ================= */
// commons as before; ONE unique chance per chest (not per roll), and pricey uniques are much rarer
const TM_UNIQ = { easy: 1 / 22, medium: 1 / 26, hard: 1 / 32, elite: 1 / 40, master: 1 / 50 };
const TH_DROP = { easy: 1 / 45, medium: 1 / 38, hard: 1 / 30, elite: 1 / 24, master: 1 / 18 };
rollCasket = function (tier) {
  const T = CLUE_TIERS[tier]; let coins = 0; const got = {};
  const rolls = randInt(T.rolls[0], T.rolls[1]);
  for (let i = 0; i < rolls; i++) { const [id, a, b] = CLUE_COMMON[tier][randInt(0, CLUE_COMMON[tier].length - 1)]; if (id === 'coins') coins += randInt(a, b); else got[id] = (got[id] || 0) + randInt(a, b); }
  const luck = Math.min(2, Math.sqrt(M.luck || 1)) * (1 + 0.08 * thPieces());
  let uniq = false;
  if (Math.random() < (TM_UNIQ[tier] || 1 / 30) * luck) {
    const L = (CLUE_UNIQUES[tier] || []).filter(id => ITEMS[id]); const W = L.map(id => 1 / Math.pow(Math.max(1e4, ITEMS[id].value || 1e4), 0.3));
    let r = Math.random() * W.reduce((a, b) => a + b, 0), k = 0; while (k < L.length - 1 && (r -= W[k]) > 0) k++;
    if (L[k]) { got[L[k]] = (got[L[k]] || 0) + 1; uniq = true; }
  }
  if (Math.random() < (TH_DROP[tier] || 1 / 35) * luck) { const miss = OUTFIT_PIECES.map(([p]) => `treasure_${p}`).filter(id => !have(id) && !(S.costume?.[id] > 0)); const id = (miss.length ? miss : OUTFIT_PIECES.map(([p]) => `treasure_${p}`))[randInt(0, (miss.length || 4) - 1)]; got[id] = 1; uniq = true; }
  if (coins) gainCoins(coins);
  for (const id in got) if (ITEMS[id]) { const big = (ITEMS[id].value || 0) >= 1e6 || ITEMS[id].outfit === 'treasure'; if (big && typeof rareGet === 'function') rareGet(id, got[id], 'drop'); else add(id, got[id]); logItem(id, got[id]); }
  track('clue', tier, 1);
  return uniq;
};

/* ================= SKILLING LOOKS (Costume room) ================= */
const LOOK_SLOTS = [['head', '⛑️ Head'], ['body', '👕 Body'], ['legs', '👖 Legs'], ['feet', '👢 Feet']];
const skillsWithOutfit = () => [...new Set(Object.values(STATIONS).map(s => s.skill).filter(Boolean))].filter(sk => SKILLS[sk]);
const ownsLook = id => have(id) > 0 || (S.costume?.[id] || 0) > 0 || Object.values(S.equip).includes(id);
const lookOptions = slot => Object.keys(ITEMS).filter(id => { const it = ITEMS[id]; return it.slot === slot && (it.outfit || it.cosmetic) && ownsLook(id); });
function skillLookFor(sk, slot) {
  const pick = S.lifetime.skLook?.[sk]?.[slot];
  if (pick === 'none') return null;
  if (pick && ITEMS[pick] && ownsLook(pick)) return pick;
  const k = Object.keys(OUTFITS).find(o => OUTFITS[o][0] === sk); const pc = OUTFIT_PIECES.find(([, sl]) => sl === slot); const id = k && pc && `${k}_${pc[0]}`;
  return id && ITEMS[id] && ownsLook(id) ? id : null;
}
// (ext51's skilling hero asks skillLookFor for each slot)
function looksPanel() {
  const rows = skillsWithOutfit().map(sk => `<button class="look-row" data-act="look-edit" data-id="${sk}"><span class="lr-sk">${SKILLS[sk].icon} ${SKILLS[sk].name}</span><span class="lr-pcs">${LOOK_SLOTS.map(([sl]) => { const id = skillLookFor(sk, sl); return id ? itemIcon(id) : '<i class="lr-empty"></i>'; }).join('')}</span><i>›</i></button>`).join('');
  const th = thPieces();
  return `<div class="panel looks"><h3>🎽 Skilling looks</h3><small class="muted">Pick what your character wears at each skill: any outfit or cosmetic pieces you own, mixed freely. Outfit XP bonuses always work just by owning the pieces.</small>
    <div class="look-list">${rows}</div>
    <div class="panel small th-note">🗺️ <b>Treasure hunter outfit</b> · ${th}/4 pieces · from treasure chests. Each piece: +8% chance of a rare chest reward. Full set: every treasure map has one step fewer.</div></div>`;
}
viewCostume = (orig => function () { const h = orig(); return h.replace(/(<div class="panel ward">)/, looksPanel() + '$1'); })(viewCostume);
VIEWS.costume = (orig => function () { return rebrand(orig()); })(viewCostume);
function lookModal(sk) {
  const cur = S.lifetime.skLook?.[sk] || {};
  openModal(`<div class="item-modal look-modal"><h2>${SKILLS[sk].icon} ${SKILLS[sk].name} look</h2><p class="small muted">"Auto" wears this skill's own outfit pieces as you get them.</p>
    ${LOOK_SLOTS.map(([sl, n]) => { const opts = lookOptions(sl); const v = cur[sl] || ''; return `<div class="look-slot"><b>${n}</b><div class="chips">${[['', '✨ Auto'], ['none', '— None']].map(([k, t]) => `<button class="chip ${v === k ? 'on' : ''}" data-act="look-set2" data-sk="${sk}" data-sl="${sl}" data-id="${k}">${t}</button>`).join('')}${opts.map(id => `<button class="chip ${v === id ? 'on' : ''}" data-act="look-set2" data-sk="${sk}" data-sl="${sl}" data-id="${id}">${itemIcon(id)} ${ITEMS[id].name}</button>`).join('')}</div></div>`; }).join('')}
    <div class="row-btns"><button class="btn" data-act="look-copy" data-sk="${sk}">Use for every skill</button><button class="btn big" data-act="close">Done</button></div></div>`);
}

/* ---------- clicks ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
  if (a === 'clue-give') {
    e.stopImmediatePropagation(); const c = S.clues?.active, s = c?.steps?.[c.idx]; if (!s || s.type !== 'give') return;
    if (S.locked[s.id]) return toast('Those are locked: unlock them first.', 'warn');
    if (have(s.id) < s.n) return toast(`You need ${fmt(s.n - have(s.id))} more ${ITEMS[s.id].name}.`, 'warn');
    remove(s.id, s.n); clueAdvance(); UI.force = true; render(); return;
  }
  if (a === 'look-edit') { e.stopImmediatePropagation(); lookModal(t.dataset.id); return; }
  if (a === 'look-set2') { e.stopImmediatePropagation(); const L = (S.lifetime.skLook ||= {})[t.dataset.sk] ||= {}; if (t.dataset.id) L[t.dataset.sl] = t.dataset.id; else delete L[t.dataset.sl]; lookModal(t.dataset.sk); UI.force = true; return; }
  if (a === 'look-copy') { e.stopImmediatePropagation(); const src = { ...(S.lifetime.skLook?.[t.dataset.sk] || {}) }; skillsWithOutfit().forEach(sk => { (S.lifetime.skLook ||= {})[sk] = { ...src }; }); toast('🎽 Look copied to every skill.'); closeModal(); UI.force = true; render(); return; }
}, true);
function boot54() { boot53(); UI.force = true; render(); }

