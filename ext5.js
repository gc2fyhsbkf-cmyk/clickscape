'use strict';
/* =========================================================
   CLICKSCAPE v4.3 — loot screen, combat academy, clue abandon,
   bank grouping, Halloween expansion, shop expansion, fixes
   ========================================================= */

/* ---------- Loot screen ---------- */
let LOOT_MUTE = 0;
toast = (orig => function (html, cls = '', ms) {
  if (LOOT_MUTE && cls !== 'warn' && cls !== 'pet') return;
  return orig(html, cls, ms);
})(toast);

function snapBank() { return { bank: { ...S.bank }, coins: S.coins }; }
function diffBank(s) {
  const got = {};
  for (const id in S.bank) { const d = (S.bank[id] || 0) - (s.bank[id] || 0); if (d > 0) got[id] = d; }
  return { got, coins: Math.max(0, Math.round(S.coins - s.coins)) };
}
function lootTile(id, n, uniq) {
  const it = ITEMS[id];
  return `<button class="loot-tile ${uniq ? 'uniq' : it.rare ? 'rare' : ''}" data-act="lootinfo" data-id="${id}" title="${esc(it.name)}">${itemIcon(id)}<b>${fmt(n)}</b><small>${esc(it.name)}</small></button>`;
}
function showLoot(title, sub, d, uniqs = []) {
  const ids = Object.keys(d.got).sort((a, b) => (uniqs.includes(b) - uniqs.includes(a)) || (sellPrice(b) * d.got[b] - sellPrice(a) * d.got[a]));
  const coinTile = d.coins ? `<div class="loot-tile coin"><span class="emo">🪙</span><b>${fmt(d.coins)}</b><small>Coins</small></div>` : '';
  const value = d.coins + ids.reduce((a, id) => a + sellPrice(id) * d.got[id], 0);
  openModal(`<div class="item-modal loot-modal"><h2>${title}</h2>${sub ? `<p class="muted small">${sub}</p>` : ''}
    <div class="loot-grid">${coinTile}${ids.map(id => lootTile(id, d.got[id], uniqs.includes(id))).join('') || '<p class="muted">It was empty…</p>'}</div>
    <p class="small">Total value: <b class="y">🪙${fmt(value)}</b></p>
    <div id="loot-info" class="panel small muted">Tap an item to see what it is.</div>
    <button class="btn big" data-act="close">Close</button></div>`);
}
function lootInfo(id) {
  const it = ITEMS[id], box = $('#loot-info'); if (!box || !it) return;
  const src = itemSources(id).slice(0, 2);
  box.classList.remove('muted');
  box.innerHTML = `<div class="row-between"><b>${itemIcon(id)} ${esc(it.name)}</b><span class="y">🪙${fmt(sellPrice(id))} ea</span></div>
    ${itemDesc(it) ? `<div>${itemDesc(it)}</div>` : ''}${src.length ? `<div class="muted">From: ${src.join(' · ')}</div>` : ''}
    <div class="muted">You now have ${fmt(have(id))}.</div>`;
  $$('.loot-tile').forEach(t => t.classList.toggle('sel', t.dataset.id === id));
}
function openWithLoot(id, q) {
  const it = ITEMS[id];
  if (it.lamp) return openLampPicker();
  if (it.clue) { closeModal(); return readClue(it.clue); }
  q = Math.max(1, Math.min(q || 1, have(id)));
  const s = snapBank();
  s.bank[id] = (s.bank[id] || 0); // opened item decreases; ignore
  LOOT_MUTE++;
  try { openItem(id, q); } finally { LOOT_MUTE--; }
  const d = diffBank(s);
  if (!Object.keys(d.got).length && !d.coins) { if (have(id)) openItemModal(id); else closeModal(); return; }
  SFX.play('rare');
  showLoot(`${it.emoji || '🎁'} You open ${q > 1 ? q + ' × ' + it.name.replace(/(x|s|sh|ch)$/i, '$1e') + 's' : 'the ' + it.name}`, have(id) ? `${fmt(have(id))} left in your bank.` : '', d);
  if (have(id)) $('#modal .loot-modal').insertAdjacentHTML('beforeend', `<div class="row-btns"><button class="btn" data-act="open" data-id="${id}" data-q="1">Open another</button>${have(id) > 1 ? `<button class="btn" data-act="open" data-id="${id}" data-q="${have(id)}">Open all ${fmt(have(id))}</button>` : ''}</div>`);
}
finishClue = (orig => function (tier) {
  if (OFF) return orig(tier);
  const s = snapBank();
  LOOT_MUTE++;
  try { orig(tier); } finally { LOOT_MUTE--; }
  const d = diffBank(s), T = CLUE_TIERS[tier];
  showLoot(`📜 ${T.name} treasure trail complete!`, `You have completed ${fmt(S.clues.done[tier])} ${tier} clue${S.clues.done[tier] > 1 ? 's' : ''}.`, d, CLUE_UNIQUES[tier] || []);
})(finishClue);

/* ---------- Season tokens & event items survive ascension; challenges too ---------- */
const SEASON_KEEP = new Set();
function seasonKeepRefresh() { SEASONS.forEach(z => { SEASON_KEEP.add(z.token); z.shop.forEach(([id]) => SEASON_KEEP.add(id)); (z.extra || []).forEach(([id]) => SEASON_KEEP.add(id)); }); HWEEN_ITEMS.forEach(id => SEASON_KEEP.add(id)); }
ascend = (orig => function () {
  const before = S.asc.count, old = S;
  const keepItems = {}; for (const id in old.bank) if (SEASON_KEEP.has(id)) keepItems[id] = old.bank[id];
  for (const sl in old.equip) if (old.equip[sl] && SEASON_KEEP.has(old.equip[sl])) keepItems[old.equip[sl]] = (keepItems[old.equip[sl]] || 0) + 1;
  orig();
  if (S === old || S.asc.count === before) return;
  for (const id in keepItems) add(id, keepItems[id]);
  S.ch = old.ch || {};
  S.sboost = old.sboost || {};
  S.academy = { t: {}, grounds: old.academy?.grounds || 0, on: true };
  save();
})(ascend);

/* ---------- Clue scrolls: swap a step or destroy ---------- */
const CLUE_SWAP = { easy: 500, medium: 3000, hard: 12000, elite: 50000, master: 200000 };
const clueSwapCost = () => { const c = S.clues.active; return c ? Math.round((CLUE_SWAP[c.tier] || 5000) * (1 + (c.swaps || 0) * 0.5)) : 0; };
viewClue = (orig => function () {
  const html = orig(), c = S.clues.active;
  if (!c) return html;
  const cost = clueSwapCost();
  const panel = `<div class="panel"><h3>Stuck?</h3><p class="muted small">Swap this step for a different one, or throw the clue away so you can read another.</p>
    <div class="row-btns"><button class="btn" data-act="clueswap" data-afford="${cost}">🔁 Swap step · 🪙${fmt(cost)}</button><button class="btn danger" data-act="cluedrop">🗑️ Destroy clue</button></div></div>`;
  const m = html.match(/<div class="panel"><h3>(Clues in your bank|Completed)/);
  return m ? html.slice(0, m.index) + panel + html.slice(m.index) : html + panel;
})(viewClue);
function clueSwap() {
  const c = S.clues.active; if (!c) return;
  const cost = clueSwapCost();
  if (S.coins < cost) return toast(`You need 🪙${fmt(cost)} to swap this step.`, 'warn');
  S.coins -= cost; c.swaps = (c.swaps || 0) + 1;
  const cur = c.steps[c.idx];
  let s, tries = 0;
  do { s = makeClueStep(c.tier, 1); tries++; } while (tries < 10 && s.type === cur.type && (s.q === cur.q && s.mon === cur.mon && s.act === cur.act));
  c.steps[c.idx] = s;
  toast('📜 You study the clue from a different angle… a new step appears.', 'rare'); SFX.play('clue');
}

/* ---------- Bank: group by category ---------- */
const BANK_GROUPS = [
  ['coins', '🪙 Tokens & currency', it => it.untradeable && it.cat === 'misc' && !it.slot && !it.open && !it.lamp && !it.clue],
  ['clue', '📜 Clues, caskets & lamps', it => it.clue || it.open || it.lamp || ['casket', 'mystery_box', 'bird_nest'].includes(it.id)],
  ['ore', '⛏️ Ores', it => it.cat === 'ore'],
  ['bar', '🧱 Bars', it => it.cat === 'bar'],
  ['log', '🪵 Logs', it => it.cat === 'log'],
  ['fish', '🐟 Raw fish', it => it.cat === 'fish'],
  ['food', '🍖 Food', it => it.cat === 'food' || it.heal > 0],
  ['seed', '🌱 Seeds', it => /_seed$/.test(it.id)],
  ['farm', '🌿 Herbs & produce', it => it.cat === 'farm'],
  ['pot', '🧪 Potions & herblore', it => it.potion || it.cat === 'herb'],
  ['gem', '💎 Gems', it => it.cat === 'gem'],
  ['craft', '🧵 Crafting', it => it.cat === 'craft'],
  ['ammo', '🏹 Ammo & fletching', it => it.cat === 'ammo'],
  ['tool', '🛠️ Tools', it => it.cat === 'tool'],
  ['weapon', '⚔️ Weapons', it => it.slot === 'weapon' && !it.cosmetic],
  ['armour', '🛡️ Armour', it => ['head', 'body', 'legs', 'shield', 'hands', 'feet'].includes(it.slot) && !it.cosmetic],
  ['jewel', '📿 Jewellery & capes', it => ['neck', 'ring', 'cape'].includes(it.slot) && !it.cosmetic],
  ['cosm', '✨ Cosmetics', it => it.cosmetic],
  ['drop', '🦴 Bones, hides & drops', it => it.cat === 'drop'],
  ['arch', '♻️ Salvaging', it => it.cat === 'arch'],
  ['misc', '📦 Other', () => true],
];
function bankGroupOf(it) { for (const g of BANK_GROUPS) { try { if (g[2](it)) return g[0]; } catch (e) { } } return 'misc'; }
bankTiles = (orig => function () {
  const q = (UI.bankQ || '').trim();
  if (!S.settings.bankGroup || q || UI.bankFilter !== 'all') return orig();
  const by = {};
  for (const id of Object.keys(S.bank)) (by[bankGroupOf(ITEMS[id])] ||= []).push(id);
  const tile = id => `<button class="tile ${ITEMS[id].rare ? 'rare' : ''}" data-act="item" data-id="${id}">${itemIcon(id)}<span class="qty" data-count="${id}" data-qty>${qtyText(have(id))}</span>${S.locked[id] ? '<span class="lock">🔒</span>' : ''}</button>`;
  return BANK_GROUPS.filter(g => by[g[0]]).map(g => `<div class="bank-h">${g[1]} <small>${by[g[0]].length}</small></div>` + by[g[0]].sort((a, b) => ITEM_ORDER[a] - ITEM_ORDER[b]).map(tile).join('')).join('') || '<p class="muted pad">Your bank is empty.</p>';
})(bankTiles);
viewBank = (orig => function () {
  return orig().replace('<div class="chips">', `<div class="chips"><button class="chip ${S.settings.bankGroup ? 'on' : ''}" data-act="bankgroup">🗂️ ${S.settings.bankGroup ? 'Grouped' : 'Group'}</button>`);
})(viewBank);

/* ---------- Combat academy (paid auto-training) ---------- */
const ACAD_SKILLS = ['attack', 'strength', 'defence', 'ranged', 'magic', 'prayer'];
const ACAD_NAMES = { attack: 'Sword master', strength: 'Strongman', defence: 'Shield drill-master', ranged: 'Archery tutor', magic: 'Arcane tutor', prayer: 'Monk' };
const acadN = sk => S.academy?.t?.[sk] || 0;
const acadCost = (sk, k = 1) => { const n = acadN(sk), b = 300; return Math.ceil(b * Math.pow(1.17, n) * (Math.pow(1.17, k) - 1) / 0.17); };
const acadGroundsCost = l => Math.round(25000 * Math.pow(6, l));
const acadBase = sk => 0.2 + 0.008 * LV[sk];           // raw XP/s per trainer, before multipliers
const acadMult = () => (1 + 0.5 * (S.academy?.grounds || 0)) * (M.asc || 1);
const acadWage = sk => 0.6 * acadBase(sk);                // coins/s per trainer
function acadTotals() {
  let xp = 0, wage = 0;
  for (const sk of ACAD_SKILLS) { const n = acadN(sk); if (n) { xp += n * acadBase(sk) * acadMult(); wage += n * acadWage(sk); } }
  return { xp, wage };
}
let acadPoor = false;
function academyTick(dt) {
  const A = S.academy; if (!A || A.on === false) return;
  const tot = acadTotals(); if (!tot.wage) return;
  const due = tot.wage * dt;
  if (S.coins < due) { if (!acadPoor) { acadPoor = true; if (!OFF) toast('🎓 Your combat trainers stop: you can’t pay their wages.', 'warn', 5000); } return; }
  acadPoor = false;
  A.owed = (A.owed || 0) + due;
  if (A.owed >= 1) { const c = Math.floor(A.owed); S.coins -= c; A.owed -= c; S.stats.wages = (S.stats.wages || 0) + c; }
  let melee = 0;
  for (const sk of ACAD_SKILLS) {
    const n = acadN(sk); if (!n) continue;
    const x = n * acadBase(sk) * acadMult() * dt;
    gainXP(sk, x);
    if (sk !== 'prayer') melee += x;
  }
  if (melee) gainXP('hitpoints', melee / 3);
}
tickCore = (orig => function (dt) { orig(dt); academyTick(dt); seasonTick(); })(tickCore);
function acadHire(sk, k) {
  S.academy ||= { t: {}, grounds: 0, on: true };
  if (k === 'max') { k = 0; while (acadCost(sk, k + 1) <= S.coins && k < 300) k++; if (!k) k = 1; }
  const c = acadCost(sk, k);
  if (S.coins < c) return toast("You don't have enough coins.", 'warn');
  S.coins -= c; S.academy.t[sk] = acadN(sk) + k;
  toast(`🎓 Hired ${k} ${ACAD_NAMES[sk]}${k > 1 ? 's' : ''}. ${SKILLS[sk].name} now trains on its own.`, 'rare'); SFX.play('coin');
}
function viewAcademy() {
  const A = S.academy ||= { t: {}, grounds: 0, on: true }, tot = acadTotals(), g = A.grounds || 0, gc = acadGroundsCost(g);
  return subHead('🎓 Combat academy') + `<div class="panel"><p>Hire trainers to level your combat skills while you skill, fight or sleep. Trainers earn XP every second (works offline) and <b>Hitpoints</b> gets a third of it. They charge wages from your coins as they work.</p>
      <div class="stats"><div>Total XP/hour</div><b class="y">${fmt(tot.xp * 3600)}</b><div>Wages/hour</div><b class="cb-red">🪙${fmt(tot.wage * 3600)}</b><div>Wages paid (this run)</div><b>🪙${fmt(S.stats.wages || 0)}</b></div>
      <div class="row-btns"><button class="btn ${A.on === false ? '' : 'danger'}" data-act="acad-toggle">${A.on === false ? '▶️ Resume training' : '⏸️ Pause training'}</button></div></div>
    <div class="panel"><h3>🏟️ Training grounds ${g}/10 <small class="muted">· kept through ascension</small></h3><p class="small">Every level gives trainers <b>+50%</b> XP without raising wages (now ×${fmtD(1 + 0.5 * g)}).</p>
      ${g >= 10 ? '<span class="y">MAX</span>' : `<button class="btn big" data-act="acad-grounds" data-afford="${gc}">Upgrade · 🪙${fmt(gc)}</button>`}</div>
    <div class="list">${ACAD_SKILLS.map(sk => { const n = acadN(sk), xph = n * acadBase(sk) * acadMult() * 3600, wh = n * acadWage(sk) * 3600;
      return `<div class="upg"><div class="upg-icon">${SKILLS[sk].icon}</div><div class="upg-main"><b>${SKILLS[sk].name} ${LV[sk]} · ${n} ${ACAD_NAMES[sk]}${n === 1 ? '' : 's'}</b><small>${n ? `+${fmt(xph)} XP/h · 🪙${fmt(wh)}/h wages` : `Each trainer: ~${fmt(acadBase(sk) * acadMult() * 3600)} XP/h for 🪙${fmt(acadWage(sk) * 3600)}/h`}</small></div>
        <div class="shop-btns"><button class="btn" data-act="acad-hire" data-id="${sk}" data-k="1" data-afford="${acadCost(sk, 1)}">+1 🪙${fmt(acadCost(sk, 1))}</button><button class="btn" data-act="acad-hire" data-id="${sk}" data-k="10" data-afford="${acadCost(sk, 10)}">+10</button></div></div>`; }).join('')}</div>
    <div class="panel muted small">Hiring costs grow ×1.17 per trainer. Wages scale with the skill's level. If you can’t pay, trainers wait until you can.</div>`;
}
viewCombat = (orig => function () {
  const tot = acadTotals();
  return orig() + `<div class="panel row-between"><div><b>🎓 Combat academy</b><br><small class="muted">${tot.xp ? `Training: +${fmt(tot.xp * 3600)} XP/h · 🪙${fmt(tot.wage * 3600)}/h` : 'Hire trainers to level combat in the background'}</small></div><button class="btn" data-act="hub" data-id="academy">Open</button></div>`;
})(viewCombat);

/* ---------- Halloween expansion ---------- */
// Proper Halloween looks
Object.assign(SHAPES, {
  skullmask: t => `<path d="M7 15 C 6 7, 11 3, 16 3 C 21 3, 26 7, 25 15 C 25 19, 23 21, 22 22 L22 27 L10 27 L10 22 C 9 21, 7 19, 7 15 Z" fill="${t}" ${K}/>
    <ellipse cx="12" cy="15" rx="3" ry="3.4" fill="#1a1410"/><ellipse cx="20" cy="15" rx="3" ry="3.4" fill="#1a1410"/><path d="M16 18 L14.5 21 L17.5 21 Z" fill="#1a1410"/>
    <path d="M12 24 L12 27 M14.7 24 L14.7 27 M17.3 24 L17.3 27 M20 24 L20 27" stroke="#1a1410" stroke-width="1"/>`,
  ribcage: t => `<path d="M9 5 L13 4 C 14 7, 18 7, 19 4 L23 5 L28 11 L25 15 L23 13 L23 28 L9 28 L9 13 L7 15 L4 11 Z" fill="#241c16" ${K}/>
    <path d="M16 6 L16 26" stroke="${t}" stroke-width="2.4"/><path d="M10 10 C 13 9, 15 10, 16 11 C 17 10, 19 9, 22 10 M10 14 C 13 13, 15 14, 16 15 C 17 14, 19 13, 22 14 M10 18 C 13 17, 15 18, 16 19 C 17 18, 19 17, 22 18 M11 22 C 13 21, 15 22, 16 23 C 17 22, 19 21, 21 22" stroke="${t}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
  bonelegs: t => `<path d="M8 4 L24 4 L25 28 L18 28 L16 13 L14 28 L7 28 Z" fill="#241c16" ${K}/>
    <path d="M11 6 L10.5 26 M21 6 L21.5 26" stroke="${t}" stroke-width="2.6" stroke-linecap="round"/><circle cx="10.7" cy="15" r="2" fill="${t}"/><circle cx="21.3" cy="15" r="2" fill="${t}"/><path d="M9 5 L23 5" stroke="${t}" stroke-width="2"/>`,
  bonehand: t => `<path d="M10 28 L10 16 M13 16 L12 6 M16 16 L16 4 M19 16 L20 6 M22 18 L25 11" stroke="#000" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M10 28 L10 16 M13 16 L12 6 M16 16 L16 4 M19 16 L20 6 M22 18 L25 11" stroke="${t}" stroke-width="2" stroke-linecap="round"/><path d="M9 16 C 9 22, 12 25, 16 25 C 20 25, 23 22, 23 17 L9 16 Z" fill="${t}" ${K}/>`,
  boneboot: t => `<path d="M6 5 L14 5 L14 20 L24 22 C 28 23, 28 28, 26 28 L6 28 Z" fill="#241c16" ${K}/><path d="M10 6 L10 22" stroke="${t}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M10 24 L26 25" stroke="${t}" stroke-width="2" stroke-linecap="round"/><circle cx="17" cy="23" r="1.4" fill="${t}"/><circle cx="21" cy="24" r="1.4" fill="${t}"/>`,
  hweenmask: t => `<path d="M5 9 C 5 5, 10 3, 16 3 C 22 3, 27 5, 27 9 L26 20 C 25 25, 20 29, 16 29 C 12 29, 7 25, 6 20 Z" fill="${t}" ${K}/>
    <path d="M9 12 L14 14 L13 17 L9 15 Z M23 12 L18 14 L19 17 L23 15 Z" fill="#000"/><path d="M10 21 C 13 25, 19 25, 22 21 L19 22 L16 21 L13 22 Z" fill="#000"/>
    <path d="M8 7 C 11 5, 14 5, 16 5" stroke="${shade(t, .45)}" fill="none"/>`,
  pumpkinhead: t => `<path d="M16 7 C 12 4, 15 2, 17 2 L18 6" fill="#3a6a1a" ${K}/><ellipse cx="16" cy="18" rx="12" ry="10" fill="${t}" ${K}/>
    <path d="M11 9 C 9 14, 9 22, 11 27 M21 9 C 23 14, 23 22, 21 27 M16 8 L16 28" stroke="${shade(t, -.3)}" fill="none"/>
    <path d="M9 15 L13 13 L13 17 Z M23 15 L19 13 L19 17 Z" fill="#ffe14a"/><path d="M9 21 L12 23 L14 21 L16 23 L18 21 L20 23 L23 21 C 21 26, 11 26, 9 21 Z" fill="#ffe14a"/>`,
  witchhat: t => `<path d="M3 24 C 8 21, 24 21, 29 24 C 25 27, 7 27, 3 24 Z" fill="${shade(t, -.15)}" ${K}/><path d="M9 23 C 11 16, 13 9, 22 3 C 20 9, 21 16, 23 23 Z" fill="${t}" ${K}/>
    <path d="M9.5 21 C 13 19.5, 19 19.5, 22.8 21" stroke="#8a3ad8" stroke-width="2.2" fill="none"/><rect x="14" y="19" width="4" height="3.4" fill="#e0c040" ${K}/>`,
  lantern: t => `<path d="M14 3 L18 3 L18 6" stroke="#000" stroke-width="2" fill="none"/><path d="M10 6 L22 6 L21 9 L11 9 Z" fill="#3a3a3a" ${K}/>
    <ellipse cx="16" cy="19" rx="10" ry="9" fill="${t}" ${K}/><path d="M11 17 L14 15 L14 19 Z M21 17 L18 15 L18 19 Z" fill="#ffe14a"/><path d="M10 22 C 13 26, 19 26, 22 22 L19 23 L16 22 L13 23 Z" fill="#ffe14a"/>`,
  batcape: t => `<path d="M16 6 C 14 4, 10 4, 9 6 L3 10 L5 14 C 4 18, 3 22, 2 27 L7 24 L10 28 L13 24 L16 28 L19 24 L22 28 L25 24 L30 27 C 29 22, 28 18, 27 14 L29 10 L23 6 C 22 4, 18 4, 16 6 Z" fill="${t}" ${K}/>
    <path d="M16 7 L16 26 M9 10 L7 24 M23 10 L25 24" stroke="${shade(t, .3)}" fill="none"/>`,
  ghostrobe: t => `<path d="M16 3 C 9 3, 6 9, 6 16 L5 29 L9 26 L12 29 L16 26 L20 29 L23 26 L27 29 L26 16 C 26 9, 23 3, 16 3 Z" fill="${t}" ${K}/>
    <ellipse cx="12.5" cy="12" rx="2" ry="2.8" fill="#1a1410"/><ellipse cx="19.5" cy="12" rx="2" ry="2.8" fill="#1a1410"/><ellipse cx="16" cy="18" rx="2.2" ry="3" fill="#1a1410"/>`,
  pumpkin: t => `<path d="M16 8 C 14 4, 16 2, 18 3 L17.5 8" fill="#3a6a1a" ${K}/><ellipse cx="16" cy="18" rx="12" ry="10" fill="${t}" ${K}/>
    <path d="M11 9 C 8 14, 8 22, 11 27 M21 9 C 24 14, 24 22, 21 27 M16 8.5 L16 28" stroke="${shade(t, -.3)}" fill="none"/><path d="M8 13 C 9 11, 11 10, 12 10" stroke="${shade(t, .4)}" fill="none"/>`,
  candy: t => `<path d="M10 16 L4 11 L4 21 Z M22 16 L28 11 L28 21 Z" fill="${shade(t, -.2)}" ${K}/><ellipse cx="16" cy="16" rx="7" ry="6" fill="${t}" ${K}/>
    <path d="M12 13 C 14 15, 18 17, 20 19 M11 16 C 13 18, 15 19, 17 20" stroke="#fff" stroke-width="1.4" fill="none" opacity=".8"/>`,
  pie: t => `<ellipse cx="16" cy="20" rx="13" ry="6" fill="#d8a050" ${K}/><ellipse cx="16" cy="18" rx="11" ry="4.6" fill="${t}" ${K}/><path d="M8 18 C 10 16, 12 16, 14 18 C 16 16, 18 16, 20 18 C 22 16, 24 16, 25 18" stroke="#e8c070" stroke-width="1.6" fill="none"/>`,
  treatbag: t => `<path d="M9 9 C 9 6, 23 6, 23 9 L26 27 C 22 29, 10 29, 6 27 Z" fill="${t}" ${K}/><path d="M11 8 C 11 3, 21 3, 21 8" stroke="#3a2a10" stroke-width="2" fill="none"/>
    <path d="M11 17 L14 15 L14 19 Z M21 17 L18 15 L18 19 Z" fill="#1a1410"/><path d="M11 22 C 14 25, 18 25, 21 22 L18 23 L16 22 L14 23 Z" fill="#1a1410"/>`,
});
for (const id in _iconCache) delete _iconCache[id];
Object.assign(ITEMS.skeleton_mask, { kind: 'skullmask', tint: '#ece6d6' });
Object.assign(ITEMS.skeleton_shirt, { kind: 'ribcage', tint: '#ece6d6' });
Object.assign(ITEMS.skeleton_leggings, { kind: 'bonelegs', tint: '#ece6d6' });
Object.assign(ITEMS.skeleton_gloves, { kind: 'bonehand', tint: '#ece6d6' });
Object.assign(ITEMS.skeleton_boots, { kind: 'boneboot', tint: '#ece6d6' });
['red', 'green', 'blue'].forEach(c => ITEMS['halloween_mask_' + c].kind = 'hweenmask');
Object.assign(ITEMS.scythe_cosmetic, { tint: '#d8dce4' });
delete ITEMS.pumpkin.emoji;
Object.assign(ITEMS.pumpkin, { kind: 'pumpkin', tint: '#e87a1a' });

// New Halloween items
cosmetic('pumpkin_head', 'Pumpkin head', 'head', 'pumpkinhead', '#e8781a', [0, 0, 0], { untradeable: true, value: 1000000 });
cosmetic('witch_hat', 'Witch hat', 'head', 'witchhat', '#2a2236', [0, 0, 0], { untradeable: true });
cosmetic('jack_lantern', "Jack-o'-lantern", 'shield', 'lantern', '#e8781a', [0, 0, 0], { untradeable: true });
cosmetic('bat_cape', 'Bat-wing cape', 'cape', 'batcape', '#2a2030', [0, 0, 0], { untradeable: true, value: 1000000 });
cosmetic('ghostly_robe', 'Ghostly robe', 'body', 'ghostrobe', '#eef2f8', [0, 0, 0], { untradeable: true });
item('trick_bag', 'Trick-or-treat bag', 1, { cat: 'misc', kind: 'treatbag', tint: '#e8781a', open: true, untradeable: true });
item('halloween_candy', 'Spooky candy', 40, { cat: 'food', kind: 'candy', tint: '#a050d8', heal: 18, untradeable: true });
item('pumpkin_pie', 'Pumpkin pie', 120, { cat: 'food', kind: 'pie', tint: '#d8781a', heal: 26, untradeable: true });
FOODS.push('halloween_candy', 'pumpkin_pie'); FOODS.sort((a, b) => ITEMS[b].heal - ITEMS[a].heal);
PETS.jack = { name: 'Jack', icon: '🎃', st: 'combat', chance: 0, desc: '+3% combat max hit (Halloween pet)' };
const HWEEN_ITEMS = ['pumpkin_head', 'witch_hat', 'jack_lantern', 'bat_cape', 'ghostly_robe', 'trick_bag'];
const hw = SEASONS.find(z => z.id === 'halloween');
hw.shop.push(['witch_hat', 120], ['jack_lantern', 100], ['ghostly_robe', 150], ['bat_cape', 300], ['pumpkin_head', 500]);

// Season goodies & boosts (work for any seasonal token)
const SEASON_GOODS = [['trick_bag', 12, '🎁 Trick-or-treat bag', 'Coins, candy, lamps, clues, gems… and a small chance of rare cosmetics'], ['xp_lamp', 40, '🪔 XP lamp', 'XP in a skill of your choice'], ['pumpkin_pie', 1, '🥧 Pumpkin pie ×3', 'Heals 26 each'], ['mystery_box', 20, '🎁 Mystery box', 'A random reward box']];
const SEASON_BOOSTS = [
  { id: 'xp', icon: '📚', name: 'Spooky studies', desc: '+30% all XP for 30 min', cost: 30 },
  { id: 'luck', icon: '🍀', name: 'Haunted luck', desc: '+30% rare drop chance for 30 min', cost: 30 },
  { id: 'work', icon: '👻', name: 'Ghostly helpers', desc: 'Workers +50% faster for 30 min', cost: 40 },
  { id: 'war', icon: '🦇', name: 'Bat frenzy', desc: '+20% combat damage for 30 min', cost: 30 },
];
const sbOn = id => (S.sboost?.[id] || 0) > now();
recalc4 = (orig => function () {
  orig();
  if (!S.sboost) return;
  if (sbOn('xp')) M.xp *= 1.3;
  if (sbOn('luck')) M.luck *= 1.3;
  if (sbOn('war')) M.dmg *= 1.2;
  if (sbOn('work')) for (const st of STATION_ORDER) M.rate[st] *= 1.5;
})(recalc4);
let sbLast = '';
function seasonTick() { const k = SEASON_BOOSTS.map(b => +sbOn(b.id)).join(''); if (k !== sbLast) { sbLast = k; recalc(); } }

// Halloween monsters (only during the event)
MON({ id: 'spooky_bat', name: 'Spooky bat', icon: '🦇', hue: 280, lvl: 22, hp: 28, atk: 18, def: 14, mh: 3, spd: 2.2, coins: [5, 60], area: 'event', season: 'halloween',
  drops: [['pumpkin', 1, 1, 2], ['halloween_candy', 1 / 3, 1, 2], ['trick_bag', 1 / 20, 1, 1], ['bat_cape', 1 / 2000, 1, 1]] });
MON({ id: 'haunted_scarecrow', name: 'Haunted scarecrow', icon: '🧟', hue: 40, lvl: 88, hp: 140, atk: 75, def: 60, mh: 11, spd: 2.6, coins: [40, 400], area: 'event', season: 'halloween', weak: 'magic',
  drops: [['pumpkin', 1, 2, 5], ['pumpkin_pie', 1 / 4, 1, 2], ['trick_bag', 1 / 8, 1, 1], ['witch_hat', 1 / 150, 1, 1], ['ghostly_robe', 1 / 200, 1, 1]] });
MON({ id: 'pumpkin_king', name: 'The Pumpkin King', icon: '🎃', hue: 0, boss: true, lvl: 175, hp: 320, atk: 150, def: 110, mh: 18, spd: 3, coins: [400, 4000], area: 'event', season: 'halloween', weak: 'ranged',
  drops: [['pumpkin', 1, 6, 14], ['trick_bag', 1 / 3, 1, 2], ['pumpkin_pie', 1 / 2, 2, 4], ['pumpkin_head', 1 / 80, 1, 1], ['bat_cape', 1 / 60, 1, 1], ['jack_lantern', 1 / 40, 1, 1], ['clue_hard', 1 / 20, 1, 1], ['pet:jack', 1 / 500, 1, 1]] });
for (const m of MONSTERS) MONSTER_BY_ID[m.id] = m;
canFight = (orig => function (m) {
  if (m.season && activeSeason()?.id !== m.season) return `Only appears during the ${cap1(m.season)} event`;
  return orig(m);
})(canFight);
taskPool = (orig => function (ms) { return orig(ms).filter(m => !m.season); })(taskPool);
(function () {
  const se = activeSeason();
  if (se && MONSTERS.some(m => m.season === se.id)) AREAS.push(['event', se.icon + ' Event']);
  CLOG.push({ id: 'halloween', name: 'Halloween', icon: '🎃', cat: 'Events', items: [...hw.shop.map(x => x[0]), 'pet:jack'] });
  CLOG.flatMap(p => p.items).forEach(i => CLOG_ITEMS.add(i));
  const addS = (id, s) => { (SOURCES[id] ||= []).push(s); };
  ['witch_hat', 'jack_lantern', 'ghostly_robe', 'bat_cape', 'pumpkin_head'].forEach(id => addS(id, `Halloween event shop`));
  addS('pumpkin_head', 'The Pumpkin King (1/80)'); addS('bat_cape', 'The Pumpkin King (1/60)'); addS('jack_lantern', 'The Pumpkin King (1/40)');
  addS('witch_hat', 'Haunted scarecrow (1/150)'); addS('ghostly_robe', 'Haunted scarecrow (1/200)');
  addS('trick_bag', 'Halloween event monsters & shop'); addS('pumpkin', 'Any monster during Halloween (1/30), random events, event monsters');
  addS('halloween_candy', 'Spooky bats, trick-or-treat bags'); addS('pumpkin_pie', 'Event shop, Haunted scarecrow, Pumpkin King');
})();

// Trick-or-treat bag contents
openItem = (orig => function (id, q = 1) {
  if (id !== 'trick_bag') return orig(id, q);
  q = Math.min(q, have(id)); if (q <= 0) return;
  remove(id, q);
  let coins = 0;
  for (let k = 0; k < q; k++) {
    coins += randInt(200, 1500);
    const r = pickWeighted([['candy', 30], ['pie', 15], ['gem', 15], ['clue', 14], ['lamp', 8], ['pumpkin', 14], ['box', 4]]);
    if (r === 'candy') add('halloween_candy', randInt(2, 5));
    else if (r === 'pie') add('pumpkin_pie', randInt(1, 3));
    else if (r === 'gem') add(pickWeighted([['cut_sapphire', 40], ['cut_emerald', 30], ['cut_ruby', 20], ['cut_diamond', 10]]), randInt(1, 2));
    else if (r === 'clue') add(pickWeighted([['clue_easy', 45], ['clue_medium', 35], ['clue_hard', 20]]), 1);
    else if (r === 'lamp') add('xp_lamp', 1);
    else if (r === 'pumpkin') add('pumpkin', randInt(2, 6));
    else add('mystery_box', 1);
    if (rnd() < 1 / 150 * M.luck) { const u = pickWeighted([['witch_hat', 3], ['ghostly_robe', 3], ['jack_lantern', 2], ['bat_cape', 1], ['pumpkin_head', 1]]); add(u, 1); logItem(u, 1); }
  }
  gainCoins(coins);
})(openItem);

// Event page
viewSeason = function () {
  const se = activeSeason();
  if (!se) return subHead('Events') + `<div class="panel">No seasonal event is running right now. Halloween runs 15 Oct – 7 Nov and Christmas runs through December.</div>
    <div class="panel muted small">Seasonal tokens and event cosmetics are kept when you ascend.</div>`;
  const tok = ITEMS[se.token].name.toLowerCase() + 's', n = have(se.token);
  const mons = MONSTERS.filter(m => m.season === se.id);
  const btn = (act, id, cost, label = 'Buy') => `<button class="btn ${n < cost ? 'poor' : ''}" data-act="${act}" data-id="${id}">${label} · ${cost}</button>`;
  return subHead(`${se.icon} ${se.name} event`) + `<div class="panel glow"><p>You have <b class="y">${fmt(n)}</b> ${tok}. Earn them from any monster (1/30), the ${se.icon} spirits that wander by, and the event monsters below.</p>
      <p class="muted small">${cap1(tok)} and everything from this page are <b>kept when you ascend</b>.</p></div>
    ${mons.length ? `<div class="panel"><h3>👻 Event monsters</h3>${mons.map(m => `<div class="upg"><div class="upg-icon"><span class="emo">${m.icon}</span></div><div class="upg-main"><b>${m.name}</b><small>Level ${m.lvl}${m.boss ? ' boss' : ''} · ${m.drops.filter(d => d[1] < 1 && !d[0].startsWith('pet:')).slice(0, 4).map(d => ITEMS[d[0]].name).join(', ')}</small></div>
      <button class="btn small" data-act="moninfo" data-id="${m.id}">📋</button><button class="btn" data-act="mon-go" data-id="${m.id}">Fight</button></div>`).join('')}</div>` : ''}
    <div class="panel"><h3>✨ Boosts <small class="muted">· 30 minutes</small></h3>${SEASON_BOOSTS.map(b => `<div class="upg"><div class="upg-icon">${b.icon}</div><div class="upg-main"><b>${b.name}</b><small>${b.desc}${sbOn(b.id) ? ` · <span class="y">active ${fmtTime((S.sboost[b.id] - now()) / 1000)}</span>` : ''}</small></div>${btn('sboost', b.id, b.cost, sbOn(b.id) ? 'Extend' : 'Buy')}</div>`).join('')}</div>
    <div class="panel"><h3>🎁 Goodies</h3>${SEASON_GOODS.map(([id, c, name, d]) => `<div class="upg"><div class="upg-icon">${itemIcon(id)}</div><div class="upg-main"><b>${name}</b><small>${d} · own ${fmt(have(id))}</small></div>${btn('sgood', id, c)}</div>`).join('')}</div>
    <div class="panel"><h3>👗 Cosmetics</h3><p class="muted small">Wear them with “Use as look” to show them over your real gear.</p><div class="list">${se.shop.map(([id, cost]) => `<div class="upg ${have(id) || Object.values(S.cosmetic).includes(id) ? 'got' : ''}"><div class="upg-icon">${itemIcon(id)}</div><div class="upg-main"><b>${ITEMS[id].name}</b><small>${cost} ${tok} · own ${fmt(have(id))}</small></div>
      ${btn('season-buy', id, cost)}</div>`).join('')}</div></div>`;
};
function buySeasonGood(id) {
  const se = activeSeason(); if (!se) return;
  const g = SEASON_GOODS.find(x => x[0] === id); if (!g) return;
  if (have(se.token) < g[1]) return toast(`Not enough ${ITEMS[se.token].name.toLowerCase()}s.`, 'warn');
  remove(se.token, g[1]); const q = id === 'pumpkin_pie' ? 3 : 1; add(id, q);
  toast(`${se.icon} You get ${q > 1 ? q + ' × ' : 'a '}${ITEMS[id].name}.`, 'rare'); SFX.play('coin');
}
function buySeasonBoost(id) {
  const se = activeSeason(); if (!se) return;
  const b = SEASON_BOOSTS.find(x => x.id === id);
  if (have(se.token) < b.cost) return toast(`Not enough ${ITEMS[se.token].name.toLowerCase()}s.`, 'warn');
  remove(se.token, b.cost); S.sboost ||= {};
  S.sboost[id] = Math.max(now(), S.sboost[id] || 0) + 30 * 60000; recalc();
  toast(`${b.icon} ${b.name}: ${b.desc}.`, 'pet'); SFX.play('ach');
}

/* ---------- Shop expansion ---------- */
(function () {
  const P = (id, m) => ITEMS[id] && { id, price: Math.round(ITEMS[id].value * m) };
  const push = (cat, arr) => { SHOP[cat] ||= []; const have_ = new Set(SHOP[cat].map(x => x.id)); arr.filter(Boolean).forEach(x => { if (!have_.has(x.id)) SHOP[cat].push(x); }); SHOP[cat].sort((a, b) => a.price - b.price); };
  push('tools', [P('rock_hammer', 3), P('earmuffs', 3), P('nose_peg', 3), P('facemask', 3), P('primal_hatchet', 6), P('primal_pickaxe', 6), P('primal_harpoon', 6), P('primal_mattock', 6)]);
  push('gear', [...['adamant', 'rune'].flatMap(m => ['dagger', 'scimitar', 'full_helm', 'kiteshield', 'platelegs', 'platebody'].map(k => P(m + '_' + k, 4))), P('rune_boots', 4), P('amulet_of_power', 4), P('amulet_of_glory', 4), P('ring_of_wealth', 4), P('warrior_ring', 4), P('mirror_shield', 4), P('spirit_shield', 4)]);
  SHOP.ranged = [];
  push('ranged', [P('shortbow', 3), P('longbow', 3), ...['oak', 'willow', 'maple', 'yew', 'magic'].flatMap(w => [P(w + '_shortbow', 4), P(w + '_longbow', 4)]), P('rune_crossbow', 4),
    ...['iron', 'steel', 'mithril', 'adamant', 'rune'].map(m => P(m + '_arrow', 4)), ...['steel', 'mithril', 'adamant', 'rune'].map(m => P(m + '_bolts', 4)),
    P('leather_coif', 3), P('leather_body', 3), P('leather_chaps', 3), P('leather_vambraces', 3),
    ...['green', 'blue', 'red', 'black'].flatMap(c => ['vambraces', 'chaps', 'body'].map(k => P(`${c}_dhide_${k}`, 5))), P('amulet_of_accuracy', 4)]);
  SHOP.magic = [];
  push('magic', [P('wizard_hat', 3), P('wizard_robe', 3), P('wizard_skirt', 3), P('staff_of_fire', 3), P('battlestaff', 3), P('fire_battlestaff', 4), P('mystic_fire_staff', 4),
    ...['hat', 'robe_top', 'robe_bottom', 'gloves', 'boots'].map(k => P('mystic_' + k, 4)), P('amulet_of_magic', 4)]);
  SHOP_CATS3.splice(2, 0, ['ranged', '🏹 Ranged'], ['magic', '🔮 Magic']);
})();

/* ---------- Views, input, boot ---------- */
Object.assign(VIEWS, { academy: viewAcademy, combat: viewCombat, bank: viewBank, clue: viewClue, season: viewSeason });
HUB_VIEWS.push('academy');
viewMenu = (orig => function () {
  const tot = acadTotals();
  return orig().replace('<button class="hub-tile" data-act="hub" data-id="character">', `<button class="hub-tile" data-act="hub" data-id="academy"><span class="ht-icon">🎓</span><b>Combat academy</b><small>${tot.xp ? fmt(tot.xp * 3600) + ' XP/h' : 'Auto-train combat'}</small></button><button class="hub-tile" data-act="hub" data-id="character">`);
})(viewMenu);
VIEWS.menu = viewMenu;
['pumpkin_head', 'witch_hat', 'jack_lantern', 'bat_cape', 'ghostly_robe', 'trick_bag', 'halloween_candy', 'pumpkin_pie'].forEach(id => { if (!(id in ITEM_ORDER)) ITEM_ORDER[id] = Object.keys(ITEM_ORDER).length; });
viewSig = (orig => function () {
  if (UI.view === 'academy') return JSON.stringify(S.academy) + ACAD_SKILLS.map(s => LV[s]).join();
  if (UI.view === 'season') return orig() + JSON.stringify(S.sboost || {}) + have(activeSeason()?.token);
  if (UI.view === 'bank') return orig() + !!S.settings.bankGroup;
  return orig();
})(viewSig);

document.addEventListener('click', e => {
  if (e.target.closest('[data-nav]')) return;
  const t = e.target.closest('[data-act]'); if (!t) return;
  const d = t.dataset, id = d.id;
  let h = true, rer = true;
  switch (d.act) {
    case 'open': openWithLoot(id, +d.q); break;
    case 'lootinfo': lootInfo(id); rer = false; break;
    case 'clueswap': clueSwap(); break;
    case 'cluedrop': openModal(`<h2>🗑️ Destroy clue?</h2><p>Your current ${S.clues.active ? CLUE_TIERS[S.clues.active.tier].name.toLowerCase() : ''} clue will be thrown away. You can then read a new one.</p><button class="btn big danger" data-act="cluedrop-yes">Destroy it</button><button class="btn" data-act="close">Keep it</button>`); rer = false; break;
    case 'cluedrop-yes': S.clues.active = null; closeModal(); toast('📜 You tear up the clue scroll.'); break;
    case 'bankgroup': S.settings.bankGroup = !S.settings.bankGroup; break;
    case 'acad-hire': acadHire(id, d.k === 'max' ? 'max' : +d.k); break;
    case 'acad-toggle': S.academy.on = S.academy.on === false; acadPoor = false; break;
    case 'acad-grounds': { const g = S.academy.grounds || 0, c = acadGroundsCost(g); if (g >= 10) break; if (S.coins < c) { toast("You don't have enough coins.", 'warn'); break; } S.coins -= c; S.academy.grounds = g + 1; toast(`🏟️ Training grounds upgraded to level ${g + 1}!`, 'rare'); SFX.play('ach'); break; }
    case 'sboost': buySeasonBoost(id); break;
    case 'sgood': buySeasonGood(id); break;
    default: h = false;
  }
  if (!h) return;
  e.stopImmediatePropagation();
  if (rer) { UI.force = true; render(); liveUpdate(); }
}, true);

function boot5() {
  seasonKeepRefresh();
  boot4();
  S.academy ||= { t: {}, grounds: 0, on: true };
  S.sboost ||= {};
  recalc(); UI.force = true; render();
}
