'use strict';
/* =========================================================
   CLICKSCAPE v6.2 — purpose: ascension tribute & offerings,
   ascension bounties, transcendence cost, birdhouses, farming contracts
   ========================================================= */

/* ================= ASCENSION TRIBUTE ================= */
const TRIBUTE_POOL = [
  ['adamant_bar', 40, 0], ['rune_bar', 25, 2], ['yew_logs', 150, 0], ['magic_logs', 80, 2], ['elder_logs', 40, 5], ['shark', 150, 1], ['manta_ray', 100, 3],
  ['ranarr', 40, 0], ['snapdragon', 30, 3], ['torstol', 20, 5], ['cut_ruby', 30, 0], ['cut_diamond', 25, 2], ['black_dragonhide', 30, 3], ['dragon_bones', 50, 2],
  ['prayer_potion', 25, 1], ['super_restore', 20, 4], ['super_combat', 10, 5], ['blood_rune', 300, 3], ['nature_rune', 400, 0], ['mahogany_plank', 60, 2],
  ['red_chinchompa', 60, 2], ['black_chinchompa', 40, 5], ['green_dragonhide', 60, 0], ['teak_plank', 100, 0], ['law_rune', 300, 1],
].filter(([id]) => ITEMS[id]);
const tributeCoins = (c = S.asc.count) => Math.round(1.5e6 * Math.pow(2.8, c));
function rollTribute() {
  const c = S.asc.count || 0, pool = TRIBUTE_POOL.filter(t => t[2] <= c).sort(() => rnd() - 0.5).slice(0, 3);
  S.tribute = { items: pool.map(([id, q]) => [id, Math.round(q * (1 + 0.5 * c))]), offer: 1 };
}
const tributeOk = () => S.tribute && S.coins >= tributeCoins() * (S.tribute.offer || 1) && S.tribute.items.every(([id, q]) => have(id) >= q);
const OFFERS = [[1, 0], [2, 0.2], [5, 0.5], [10, 1]];
const offerBonus = () => (OFFERS.find(o => o[0] === (S.tribute?.offer || 1)) || OFFERS[0])[1];

/* ================= ASCENSION BOUNTIES ================= */
function rollBounties() {
  const c = S.asc.count || 0, out = [], used = new Set();
  const bosses = MONSTERS.filter(m => m.boss && !m.raid && !m.season && !m.transReq && !m.ascReq && m.area !== 'echo' && m.area !== 'minigames');
  const raids = ['cox', 'tob', 'toa', 'gauntlet', 'caves', 'ba', 'pc'].filter(r => r !== 'pc');
  const skills = SKILL_ORDER.filter(s => !['hitpoints'].includes(s));
  const makers = [
    () => { const s = skills[randInt(0, skills.length - 1)]; return { type: 'lvl', key: s, n: Math.min(MAX_LVL[s], 55 + 4 * c + randInt(0, 20)), txt: l => `Reach ${SKILLS[s].icon} ${SKILLS[s].name} ${l}` }; },
    () => { const m = bosses[randInt(0, bosses.length - 1)]; return { type: 'kill', key: m.id, n: 10 + 5 * c, base: S.kills[m.id] || 0, txt: n => `Kill ${n} × ${m.name}` }; },
    () => { const r = raids[randInt(0, raids.length - 1)]; return { type: 'raid', key: r, n: 2 + Math.floor(c / 2), base: S.raids?.[r] || 0, txt: n => `Complete ${n} × ${({ cox: 'Chambers of Xeric', tob: 'Theatre of Blood', toa: 'Tombs of Amascut', gauntlet: 'Gauntlet', caves: 'Fight Caves', ba: 'Barbarian Assault' })[r]}` }; },
    () => ({ type: 'clue', key: '*', n: 4 + c, base: Object.values(S.clues.done).reduce((a, b) => a + b, 0), txt: n => `Complete ${n} clue scrolls` }),
    () => ({ type: 'coins', key: '*', n: Math.round(5e7 * Math.pow(2.2, c)), txt: n => `Earn 🪙${fmt(n)} this run` }),
    () => { const s = skills[randInt(0, skills.length - 1)]; return { type: 'lvl', key: s, n: Math.min(MAX_LVL[s], 70 + 4 * c + randInt(0, 15)), txt: l => `Reach ${SKILLS[s].icon} ${SKILLS[s].name} ${l}` }; },
  ];
  let guard = 0;
  while (out.length < 3 && guard++ < 50) { const b = makers[randInt(0, makers.length - 1)](); const k = b.type + b.key; if (used.has(k)) continue; used.add(k); delete b.txt; out.push(b); }
  S.bounty = out;
}
function bountyText(b) {
  if (b.type === 'lvl') return `Reach ${SKILLS[b.key].icon} ${SKILLS[b.key].name} ${b.n}`;
  if (b.type === 'kill') return `Kill ${b.n} × ${MONSTER_BY_ID[b.key]?.name || b.key}`;
  if (b.type === 'raid') return `Complete ${b.n} × ${({ cox: 'Chambers of Xeric', tob: 'Theatre of Blood', toa: 'Tombs of Amascut', gauntlet: 'Gauntlet', caves: 'Fight Caves', ba: 'Barbarian Assault' })[b.key]}`;
  if (b.type === 'clue') return `Complete ${b.n} clue scrolls`;
  return `Earn 🪙${fmt(b.n)} this run`;
}
function bountyProg(b) {
  if (b.type === 'lvl') return [LV[b.key], b.n];
  if (b.type === 'kill') return [(S.kills[b.key] || 0) - b.base, b.n];
  if (b.type === 'raid') return [(S.raids?.[b.key] || 0) - b.base, b.n];
  if (b.type === 'clue') return [Object.values(S.clues.done).reduce((a, x) => a + x, 0) - b.base, b.n];
  return [S.stats.earned || 0, b.n];
}
const bountyDone = b => { const [a, n] = bountyProg(b); return a >= n; };
const bountiesDone = () => (S.bounty || []).filter(bountyDone).length;

/* ---------- hook into ascension ---------- */
ascendGain = (orig => function () { return Math.floor(orig() * (1 + offerBonus()) * (1 + 0.15 * bountiesDone() + (bountiesDone() === 3 ? 0.25 : 0))); })(ascendGain);
ascend = (orig => function () {
  if (!S.tribute) rollTribute();
  if (totalLevel() >= ascReqTotal() && !tributeOk()) {
    const miss = []; const cc = tributeCoins() * (S.tribute.offer || 1); if (S.coins < cc) miss.push(`🪙${fmt(cc)}`);
    S.tribute.items.forEach(([id, q]) => { if (have(id) < q) miss.push(`${fmt(q - have(id))} × ${ITEMS[id].name}`); });
    closeModal(); return toast(`🌀 The altar demands its tribute. Still missing: ${miss.join(', ')}`, 'warn', 7000);
  }
  const old = S, n = S.asc.count, done = bountiesDone(), trib = S.tribute, cost = tributeCoins() * (trib.offer || 1);
  orig();
  if (S === old || S.asc.count === n) return;
  // tribute is consumed from the old run (already reset) — nothing to remove; record stats
  S.lifetime.tributes = (S.lifetime.tributes || 0) + cost;
  if (done === 3) { add('mystery_box', 5); add('xp_lamp', 2); setTimeout(() => toast('🎯 All three bounties complete! Bonus: 5 mystery boxes and 2 lamps.', 'pet', 6000), 900); }
  rollTribute(); rollBounties(); save();
})(ascend);
// coins & items are "spent" by the reset, but make sure the tribute can't be skipped by spending first:
viewAscension = (orig => function () {
  if (!S.tribute) rollTribute(); if (!S.bounty) rollBounties();
  const T = S.tribute, base = tributeCoins(), cc = base * (T.offer || 1);
  const trib = `<div class="panel"><h3>🌀 Ascension tribute <small class="muted">· required to ascend</small></h3>
    <div class="trib ${S.coins >= cc ? 'ok' : ''}">🪙 <b>${fmt(cc)}</b> coins <small>(have ${fmt(S.coins)})</small></div>
    ${T.items.map(([id, q]) => `<div class="trib ${have(id) >= q ? 'ok' : ''}">${itemIcon(id)} <b>${fmt(q)} × ${ITEMS[id].name}</b> <small>(have ${fmt(have(id))})</small>${have(id) < q && GE_SET.has(id) ? ` <button class="btn small" data-act="ge-x" data-id="${id}" data-mode="buy">🛒</button>` : ''}</div>`).join('')}
    <h3>Offering</h3><p class="muted small">Pay a bigger coin tribute for more runes & essence from this ascension.</p>
    <div class="chips">${OFFERS.map(([m, b]) => `<button class="chip ${T.offer === m ? 'on' : ''}" data-act="offer" data-id="${m}">×${m} · 🪙${fmt(base * m)}${b ? ` · +${b * 100}%` : ''}</button>`).join('')}</div></div>
  <div class="panel"><h3>🎯 Run bounties <small class="muted">· +15% runes & essence each, +25% more for all three</small></h3>
    ${S.bounty.map(b => { const [a, n] = bountyProg(b), ok = a >= n; return `<div class="trib ${ok ? 'ok' : ''}">${ok ? '✔' : '○'} ${bountyText(b)} <small>(${fmt(Math.max(0, Math.min(a, n)))}/${fmt(n)})</small></div>`; }).join('')}</div>`;
  return orig().replace('<div class="panel relics">', trib + '<div class="panel relics">');
})(viewAscension);

/* ================= TRANSCENDENCE COSTS COINS ================= */
const transCost = () => Math.round(5e10 * Math.pow(4, S.trans?.count || 0));
transcend = (orig => function () {
  if ((S.asc?.count || 0) >= TRANS_REQ && S.coins < transCost()) { closeModal(); return toast(`✴️ Transcending needs an offering of 🪙${fmt(transCost())}.`, 'warn', 6000); }
  return orig();
})(transcend);
viewTranscend = (orig => function () { return orig().replace('<div class="panel"><h3>✴️ The Pantheon', `<div class="panel small">✴️ Transcendence offering: <b class="${S.coins >= transCost() ? 'cb-green' : 'cb-red'}">🪙${fmt(transCost())}</b> (you have ${fmt(S.coins)}). Rises ×4 each time.</div><div class="panel"><h3>✴️ The Pantheon`); })(viewTranscend);

/* ================= BIRDHOUSES (Hunter) ================= */
const BIRDHOUSES = [['logs', 'Bird house', 5, 280], ['oak_logs', 'Oak bird house', 14, 420], ['willow_logs', 'Willow bird house', 24, 560], ['maple_logs', 'Maple bird house', 34, 700], ['yew_logs', 'Yew bird house', 49, 960], ['magic_logs', 'Magic bird house', 74, 1140], ['elder_logs', 'Elder bird house', 89, 1200]];
const BH_TIME = 50 * 60000;
function bestBirdhouse() { let b = null; for (const h of BIRDHOUSES) if (LV.hunter >= h[2]) b = h; return b; }
function birdPanel() {
  const B = S.bird, h = bestBirdhouse();
  if (B) { const left = B.t + BH_TIME - now(); return `<div class="panel"><h3>🏠 Bird house run</h3><p class="small">4 × ${B.name} set up. ${left > 0 ? `Ready in <b>${fmtTime(left / 1000)}</b>.` : '<b class="y">Ready to collect!</b>'}</p>${left <= 0 ? '<button class="btn big" data-act="bird-collect">Collect bird houses</button>' : ''}</div>`; }
  if (!h) return `<div class="panel muted small">🏠 Bird house runs unlock at Hunter 5.</div>`;
  return `<div class="panel"><h3>🏠 Bird house run</h3><p class="small">Build 4 × <b>${h[1]}</b> (4 ${ITEMS[h[0]].name.toLowerCase()} + 40 seeds). In 50 minutes they fill up with feathers, bird nests and ${fmt(h[3] * 4)} Hunter XP. Works offline.</p>
    <button class="btn big ${have(h[0]) >= 4 ? '' : 'poor'}" data-act="bird-set">Set up bird houses</button></div>`;
}
function seedTotal() { return Object.keys(S.bank).filter(id => /_seed$/.test(id) && !CROP_BY_ID[id.replace(/_seed$/, '')]?.livestock).reduce((a, id) => a + have(id), 0); }
function takeSeeds(n) { for (const id of Object.keys(S.bank).filter(i => /_seed$/.test(i) && !CROP_BY_ID[i.replace(/_seed$/, '')]?.livestock).sort((a, b) => ITEMS[a].value - ITEMS[b].value)) { const k = Math.min(n, have(id)); remove(id, k); n -= k; if (!n) break; } }

/* ================= FARMING CONTRACTS ================= */
it7('seed_pack', 'Seed pack', 1, 'seed', '#c8a83a', { cat: 'misc', open: true });
function newContract() {
  const ok = CROPS.filter(c => !c.livestock && c.lvl <= LV.farming && c.lvl >= Math.max(1, LV.farming - 40));
  const c = ok[randInt(0, ok.length - 1)] || CROPS[0];
  S.fcon = { c: c.id, n: Math.max(10, Math.round(10 + LV.farming / 3)), prog: 0 };
}
harvest = (orig => function (i) {
  const p = S.plots[i], y = orig(i);
  if (y && p && S.fcon && p.c === S.fcon.c) { S.fcon.prog += y; if (S.fcon.prog >= S.fcon.n) { const k = 1 + Math.floor(LV.farming / 30); add('seed_pack', k); gainXP('farming', 150 * LV.farming / SKILL_XP_RATE / 10); if (!OFF) toast(`🌱 Farming contract complete! You receive ${k} seed pack${k > 1 ? 's' : ''}.`, 'pet', 5000); S.fcon = null; } }
  return y;
})(harvest);
openItem = (orig => function (id, q = 1) {
  if (id !== 'seed_pack') return orig(id, q);
  q = Math.min(q, have(id)); if (q <= 0) return; remove(id, q);
  const pool = CROPS.filter(c => !c.livestock && c.lvl <= LV.farming + 10);
  for (let k = 0; k < q; k++) for (let r = 0; r < 4; r++) { const c = pool[Math.min(pool.length - 1, Math.floor(Math.pow(rnd(), 0.6) * pool.length))]; add(c.id + '_seed', randInt(1, 3)); }
})(openItem);
viewFarming = (orig => function () {
  const F = S.fcon, c = F && CROP_BY_ID[F.c];
  const panel = `<div class="panel"><h3>📜 Farming contract</h3>${F ? `<p class="small">Grow <b>${F.n} × ${c.name}</b> · ${fmt(Math.min(F.prog, F.n))}/${F.n}</p><div class="hpbar pp"><i style="width:${Math.min(100, F.prog / F.n * 100)}%"></i><span>${fmt(F.prog)} / ${F.n}</span></div>` :
    '<p class="small">Take a contract from the Farming Guild: grow a set number of a crop for <b>seed packs</b> (rare seeds) and bonus XP.</p><button class="btn" data-act="fcon-new">Get a contract</button>'}</div>`;
  return orig().replace('<div class="plots">', panel + '<div class="plots">');
})(viewFarming);
viewSkill = (orig => function () { const h = orig(); return UI.skill === 'hunter' ? h.replace('<div class="list">', birdPanel() + '<div class="list">') : h; })(viewSkill);
VIEWS.skill = viewSkill;

/* ---------- ascension resets & boot ---------- */
(function () {
  ach('bounty_3', 'Bounty Hunter', 'Finish all three run bounties', '🎯', g => (g.S.bounty || []).length === 3 && bountiesDone() === 3, 20);
  ach('offer_10', 'Big Spender', 'Ascend with a ×10 offering', '💸', g => (g.S.lifetime.tributes || 0) >= 1e9, 20);
  ach('birdman', 'Birdman', 'Collect 50 bird house runs', '🏠', g => (g.S.lifetime.birdruns || 0) >= 50, 15);
  (SOURCES.seed_pack ||= []).push('Farming contracts');
})();
viewSig = (orig => function () {
  if (UI.view === 'ascension') return orig() + JSON.stringify(S.tribute || {}) + (S.bounty || []).map(b => bountyProg(b)[0] >= b.n).join() + Math.floor(Math.log10(Math.max(1, S.coins)) * 4);
  if (UI.view === 'skill' && UI.skill === 'hunter') return orig() + JSON.stringify(S.bird || {}) + (S.bird && now() >= S.bird.t + BH_TIME);
  if (UI.view === 'skill' && UI.skill === 'farming') return orig() + JSON.stringify(S.fcon || {});
  if (UI.view === 'transcend') return orig() + (S.coins >= transCost());
  return orig();
})(viewSig);
Object.assign(VIEWS, { ascension: viewAscension, transcend: viewTranscend });
document.addEventListener('click', e => {
  if (e.target.closest('[data-nav]')) return;
  const t = e.target.closest('[data-act]'); if (!t) return;
  const d = t.dataset; let h = true;
  switch (d.act) {
    case 'offer': S.tribute.offer = +d.id; break;
    case 'bird-set': { const hh = bestBirdhouse(); if (!hh) break; if (have(hh[0]) < 4) { toast(`You need 4 × ${ITEMS[hh[0]].name}.`, 'warn'); break; } if (seedTotal() < 40) { toast('You need 40 seeds (any kind) to fill the bird houses.', 'warn'); break; } remove(hh[0], 4); takeSeeds(40); S.bird = { t: now(), name: hh[1], xp: hh[3] }; toast('🏠 Bird houses set. Come back in 50 minutes.', 'rare'); break; }
    case 'bird-collect': { const B = S.bird; if (!B || now() < B.t + BH_TIME) break; const f = randInt(80, 240); add('feather', f); const nests = randInt(1, 6); add('bird_nest', nests); gainXP('hunter', B.xp * 4 / (M.xp * SKILL_XP_RATE)); S.lifetime.birdruns = (S.lifetime.birdruns || 0) + 1; S.bird = null; toast(`🏠 Bird houses collected: ${f} feathers, ${nests} bird nests and Hunter XP.`, 'rare'); break; }
    case 'fcon-new': newContract(); break;
    default: h = false;
  }
  if (h) { e.stopImmediatePropagation(); UI.force = true; render(); liveUpdate(); }
}, true);
