'use strict';
/* =========================================================
   CLICKSCAPE v5.1 — GE buy X, shop cleanup, useful monster drops,
   tool finds, loot filter, skill milestones, buy-missing-inputs
   ========================================================= */

/* ---------- Fix: academy page re-rendered every tick (wages counter) ---------- */
viewSig = (orig => function () {
  if (UI.view === 'academy') { const A = S.academy || {}; return JSON.stringify({ t: A.t, g: A.grounds, on: A.on }) + ACAD_SKILLS.map(s => LV[s]).join(); }
  return orig();
})(viewSig);

/* ---------- Grand Exchange: buy / sell any amount ---------- */
geRow = (orig => function (id, mode) {
  const h = orig(id, mode);
  return h.replace(/(<button class="btn small" data-act="ge-(?:buy|sell)" data-id="[^"]+" data-q="(?:10|\d+)"[^>]*>(?:10|All)<\/button>)/, `$1<button class="btn small" data-act="ge-x" data-id="${id}" data-mode="${mode}">X</button>`);
})(geRow);
function geXModal(id, mode, preset) {
  const buy = mode !== 'sell', p = buy ? geBuyPrice(id) : geSellPrice(id), max = buy ? Math.floor(S.coins / p) : have(id);
  const q0 = Math.max(1, Math.min(preset || (buy ? 100 : max), max || 1));
  openModal(`<div class="item-modal"><h2>${itemIcon(id)} ${buy ? 'Buy' : 'Sell'} ${ITEMS[id].name}</h2>
    <p class="small">🪙${fmt(p)} each · you have ${fmt(have(id))} · ${buy ? `you can afford ${fmt(max)}` : ''}</p>
    <input id="gex-q" type="number" min="1" inputmode="numeric" value="${q0}" class="qty-in">
    <div class="chips">${[10, 100, 500, 1000, 5000].map(n => `<button class="chip" data-act="gex-set" data-n="${n}">${fmt(n)}</button>`).join('')}<button class="chip" data-act="gex-set" data-n="${max}">Max (${fmt(max)})</button></div>
    <p>Total: <b class="y" id="gex-tot">🪙${fmt(p * q0)}</b>${buy ? ' <small class="muted">(big orders push the price up a little)</small>' : ''}</p>
    <button class="btn big" data-act="gex-go" data-id="${id}" data-mode="${mode}">${buy ? 'Buy' : 'Sell'}</button></div>`);
  const inp = $('#gex-q'); inp?.addEventListener('input', () => { $('#gex-tot').textContent = '🪙' + fmt(p * Math.max(0, Math.floor(+inp.value || 0))); });
}
geBuy = (orig => function (id, q) {
  const c0 = S.coins; orig(id, q);
  if (S.coins < c0 && q >= 50) { const f = S.ge.f[id] ?? 1; S.ge.f[id] = Math.min(2.2, Math.round(f * (1 + Math.min(0.15, q / 4000)) * 1000) / 1000); }
})(geBuy);

/* ---------- Shop cleanup: no Slayer kit, boss drops or drop-only tools ---------- */
(function () {
  const rareDrop = new Set(); for (const m of MONSTERS) for (const [id, ch] of m.drops) if (ch <= 1 / 50 || m.boss) rareDrop.add(id);
  const smithable = new Set(Object.values(ACTIONS).flatMap(a => Object.keys(a.out || {})));
  const ban = new Set(['earmuffs', 'nose_peg', 'facemask', 'rock_hammer', 'mirror_shield', 'leaf_bladed_sword', 'barrows_gloves', 'warrior_ring', 'berserker_ring', 'spirit_shield', 'helm_of_neitiznot', 'dragon_boots', 'crystal_harpoon', 'rune_crossbow']);
  const toolCap = /^(adamant|rune|primal|void|dragon|infernal|crystal|third_age)_/;
  for (const cat of Object.keys(SHOP)) {
    if (cat === 'capes') continue;
    SHOP[cat] = SHOP[cat].filter(({ id }) => {
      if (ban.has(id)) return false;
      if (cat === 'tools' && toolCap.test(id)) return false;
      if (rareDrop.has(id) && !smithable.has(id)) return false;
      return true;
    });
  }
})();

/* ---------- Monster drops: level-banded useful loot, tool drops, rare drop table ---------- */
const ok = id => !!ITEMS[id];
const DROP_BANDS = [
  { max: 25, add: [['feather', 1 / 4, 5, 15], ['cowhide', 1 / 10, 1, 2], ['air_rune', 1 / 6, 5, 20], ['mind_rune', 1 / 8, 3, 12], ['copper_ore', 1 / 12, 1, 3], ['potato_seed', 1 / 12, 1, 4], ['bronze_pickaxe', 1 / 300, 1, 1]] },
  { max: 70, add: [['feather', 1 / 6, 10, 30], ['cowhide', 1 / 8, 2, 4], ['iron_bar', 1 / 10, 1, 3], ['nature_rune', 1 / 12, 3, 8], ['chaos_rune', 1 / 10, 4, 12], ['sapphire', 1 / 25, 1, 1], ['emerald', 1 / 40, 1, 1], ['guam_seed', 1 / 20, 1, 3], ['ranarr_seed', 1 / 120, 1, 1], ['vial_of_water', 1 / 12, 2, 5],
    ['steel_pickaxe', 1 / 400, 1, 1], ['steel_hatchet', 1 / 400, 1, 1], ['steel_harpoon', 1 / 400, 1, 1], ['mithril_pickaxe', 1 / 900, 1, 1]] },
  { max: 150, add: [['steel_bar', 1 / 9, 2, 5], ['mithril_bar', 1 / 14, 1, 4], ['death_rune', 1 / 10, 5, 15], ['law_rune', 1 / 12, 3, 10], ['ruby', 1 / 25, 1, 1], ['diamond', 1 / 50, 1, 1], ['yew_logs', 1 / 10, 3, 8], ['green_dragonhide', 1 / 30, 1, 2],
    ['ranarr_seed', 1 / 50, 1, 2], ['snapdragon_seed', 1 / 120, 1, 1], ['leather', 1 / 8, 3, 8], ['mithril_harpoon', 1 / 400, 1, 1], ['adamant_pickaxe', 1 / 500, 1, 1], ['adamant_hatchet', 1 / 500, 1, 1], ['adamant_harpoon', 1 / 500, 1, 1], ['adamant_mattock', 1 / 700, 1, 1]] },
  { max: 400, add: [['adamant_bar', 1 / 9, 2, 5], ['rune_bar', 1 / 25, 1, 3], ['blood_rune', 1 / 10, 5, 20], ['soul_rune', 1 / 20, 5, 15], ['magic_logs', 1 / 12, 2, 6], ['dragonstone', 1 / 150, 1, 1], ['torstol_seed', 1 / 80, 1, 1], ['black_dragonhide', 1 / 30, 1, 2], ['pure_essence', 1 / 6, 20, 60],
    ['rune_pickaxe', 1 / 400, 1, 1], ['rune_hatchet', 1 / 400, 1, 1], ['rune_harpoon', 1 / 400, 1, 1], ['rune_mattock', 1 / 600, 1, 1], ['dragon_pickaxe', 1 / 3000, 1, 1], ['dragon_hatchet', 1 / 3000, 1, 1], ['dragon_harpoon', 1 / 3000, 1, 1]] },
  { max: 1e9, add: [['rune_bar', 1 / 8, 2, 6], ['wrath_rune', 1 / 10, 5, 20], ['soul_rune', 1 / 10, 10, 30], ['onyx', 1 / 2500, 1, 1], ['cut_dragonstone', 1 / 60, 1, 1], ['dragon_pickaxe', 1 / 1500, 1, 1], ['dragon_hatchet', 1 / 1500, 1, 1], ['dragon_harpoon', 1 / 1500, 1, 1], ['dragon_mattock', 1 / 4000, 1, 1]] },
];
const RDT = [['nature_rune', 67, 67, 20], ['law_rune', 45, 45, 15], ['death_rune', 45, 45, 15], ['rune_bar', 3, 5, 10], ['dragonstone', 1, 1, 8], ['rune_kiteshield', 1, 1, 6], ['rune_platelegs', 1, 1, 6], ['cut_diamond', 2, 4, 10], ['coins', 3000, 15000, 10]];
(function () {
  for (const m of MONSTERS) {
    if (m.raid || m.barrows || m.season || m.drops.length === 0 && m.area === 'minigames') continue;
    const band = DROP_BANDS.find(b => m.lvl < b.max);
    const have_ = new Set(m.drops.map(d => d[0]));
    const scale = m.boss ? 2 : 1;
    for (const [id, ch, a, b] of band.add) if (ok(id) && !have_.has(id)) m.drops.push([id, Math.min(1, ch * scale), a * scale, b * scale]);
    if (m.lvl >= 60) m.rdt = true;
  }
})();
killMonster = (orig => function (m) {
  orig(m);
  if (m.rdt && rnd() < (1 / 128) * M.luck) {
    const [id, a, b] = pickWeighted(RDT.map(r => [r, r[3]]));
    if (id === 'coins') gainCoins(randInt(a, b)); else if (ok(id)) { const q = randInt(a, b); add(id, q); logItem(id, q); if (!OFF) toast(`🎲 Rare drop table: <b>${q > 1 ? q + ' × ' : ''}${ITEMS[id].name}</b>`, 'rare'); }
  }
  autoSellNow();
})(killMonster);
openMonsterInfo = (orig => function (id) {
  orig(id); const m = MONSTER_BY_ID[id];
  if (m?.rdt) $('#modal .drops')?.insertAdjacentHTML('beforeend', `<div class="drop rare"><span class="ar-icon"><span class="emo">🎲</span></span><span class="ar-main"><b>Rare drop table</b><small>Nature/law/death runes, rune bars, dragonstone, rune armour, diamonds</small></span><span class="rate rare">1/${Math.round(128 / M.luck)}</span></div>`);
})(openMonsterInfo);

/* ---------- Tool finds while skilling ---------- */
const TOOL_LADDER = {};
for (const it of Object.values(ITEMS)) if (it.cat === 'tool' && it.mult && ['pickaxe', 'hatchet', 'rod', 'mattock'].includes(it.slot) && !it.untradeable && !/third_age|infernal|crystal|void|primal/.test(it.id)) (TOOL_LADDER[it.slot] ||= []).push(it);
for (const s in TOOL_LADDER) TOOL_LADDER[s].sort((a, b) => a.mult - b.mult || a.value - b.value);
doYield = (orig => function (st, a, n, xpScale) {
  const done = orig(st, a, n, xpScale);
  const slot = STATIONS[st]?.tool;
  if (done > 0 && slot && TOOL_LADDER[slot]) {
    const cur = ITEMS[S.equip[slot]], sk = STATIONS[st].skill;
    const next = TOOL_LADDER[slot].find(t => t.mult > (cur?.mult || 0) && !have(t.id) && (!t.req || Object.entries(t.req).every(([s, l]) => (LV[s] || 0) >= l - 10)));
    if (next && !next.id.startsWith('dragon')) {
      const rate = (typeof TOOL_FIND_RATE === 'number' ? TOOL_FIND_RATE : 1 / 3000) * M.luck;
      if (now() - (S.lifetime.toolFindT || 0) > (typeof TOOL_FIND_CD === 'number' ? TOOL_FIND_CD : 0) && rollCount(done, rate) > 0) { if (typeof toolFound === 'function') toolFound(st, next); else { add(next.id, 1); logItem(next.id, 1); } }
    }
  }
  return done;
})(doYield);

/* ---------- Loot filter: auto-sell chosen drops ---------- */
function autoSellNow() {
  const L = S.autosell; if (!L) return;
  let total = 0;
  for (const id in L) { if (!L[id] || S.locked[id]) continue; const n = have(id); if (n > 0) { total += saleTake(id, n, sellPrice(id)); remove(id, n); } }
  if (total) gainCoins(total);
}
openItemModal = (orig => function (id, fromSlot) {
  orig(id, fromSlot);
  const box = $('#modal .item-modal') || $('#modal'); if (!box || fromSlot) return;
  const on = !!S.autosell?.[id], ge = GE_SET.has(id);
  box.insertAdjacentHTML('beforeend', `<div class="row-btns">${ge ? `<button class="btn" data-act="ge-x" data-id="${id}" data-mode="buy">🛒 Buy on GE</button>` : ''}
    ${ITEMS[id].untradeable || ITEMS[id].slot === undefined && ITEMS[id].cat === 'misc' ? '' : `<button class="btn ${on ? 'danger' : ''}" data-act="autosell" data-id="${id}">${on ? '🗑️ Auto-sell: ON' : '🗑️ Auto-sell drops'}</button>`}</div>
    ${on ? '<p class="muted small">This item is sold automatically whenever a monster drops it.</p>' : ''}`);
})(openItemModal);

/* ---------- Skill milestones: permanent speed at 25 / 50 / 75 / 99 / 120 ---------- */
const MILESTONES = [25, 50, 75, 99, 120];
const msCount = sk => MILESTONES.filter(l => LV[sk] >= l).length;
recalc4 = (orig => function () {
  orig(); if (!S.asc) return;
  for (const st of STATION_ORDER) { const m = 1 + 0.04 * msCount(STATIONS[st].skill); M.rate[st] *= m; M.tap[st] *= m; }
})(recalc4);
skillHead = (orig => function (sk) {
  const h = orig(sk);
  if (COMBAT_SKILLS.includes(sk) || sk === 'prayer') return h;
  const n = msCount(sk), next = MILESTONES.find(l => LV[sk] < l);
  return h + `<div class="milestones">${MILESTONES.map(l => `<span class="${LV[sk] >= l ? 'on' : ''}">${l}</span>`).join('')}<small>${n ? `+${n * 4}% speed` : 'Milestones'}${next ? ` · next at ${next}` : ' · all done!'}</small></div>`;
})(skillHead);

/* ---------- Skill page: buy missing inputs from the GE ---------- */
viewSkill = (orig => function () {
  const html = orig(), st = UI.curStation, a = st && ACTIONS[S.target[st]];
  if (!a?.inp) return html;
  const miss = Object.entries(a.inp).filter(([id, q]) => have(id) < q * 20 && GE_SET.has(id));
  if (!miss.length) return html;
  const bar = `<div class="panel buybar"><small>Running low:</small> ${miss.map(([id]) => `<button class="chip" data-act="ge-x" data-id="${id}" data-mode="buy">${itemIcon(id)} ${ITEMS[id].name} (${fmt(have(id))}) · 🛒</button>`).join('')}</div>`;
  const i = html.indexOf('<div class="list">');
  return i > 0 ? html.slice(0, i) + bar + html.slice(i) : html + bar;
})(viewSkill);
VIEWS.skill = viewSkill;

/* ---------- Safety: strip any action input/output that points at a missing item ---------- */
for (const a of Object.values(ACTIONS)) for (const k of ['out', 'inp']) if (a[k]) for (const id in a[k]) if (!ITEMS[id]) { console.warn('missing item in action', a.id, id); delete a[k][id]; }

/* ---------- Skill grid in the classic order ---------- */
(function () {
  const want = ['attack', 'hitpoints', 'mining', 'strength', 'agility', 'smithing', 'defence', 'herblore', 'fishing', 'ranged', 'thieving', 'cooking', 'prayer', 'crafting', 'firemaking',
    'magic', 'fletching', 'woodcutting', 'runecrafting', 'slayer', 'farming', 'construction', 'hunter', 'archaeology'];
  const rest = SKILL_ORDER.filter(s => !want.includes(s));
  SKILL_ORDER.splice(0, SKILL_ORDER.length, ...want.filter(s => SKILLS[s]), ...rest);
})();

/* ---------- Input ---------- */
document.addEventListener('click', e => {
  if (e.target.closest('[data-nav]')) return;
  const t = e.target.closest('[data-act]'); if (!t) return;
  const d = t.dataset; let h = true, rer = true;
  switch (d.act) {
    case 'ge-x': geXModal(d.id, d.mode); rer = false; break;
    case 'gex-set': { const i = $('#gex-q'); if (i) { i.value = Math.max(1, +d.n); i.dispatchEvent(new Event('input')); } rer = false; break; }
    case 'gex-go': { const q = Math.floor(+($('#gex-q')?.value) || 0); if (q > 0) { if (d.mode === 'sell') geSell(d.id, q); else geBuy(d.id, q); } closeModal(); break; }
    case 'autosell': (S.autosell ||= {})[d.id] = !S.autosell[d.id]; if (!S.autosell[d.id]) delete S.autosell[d.id]; openItemModal(d.id); rer = false; break;
    default: h = false;
  }
  if (!h) return;
  e.stopImmediatePropagation();
  if (rer) { UI.force = true; render(); liveUpdate(); }
}, true);

/* ---------- Farming: livestock & material patches ---------- */
const LIVESTOCK = [
  { id: 'chicken_coop', seedName: 'Chicks', out: 'feather', name: 'Chicken coop', emoji: '🐔', lvl: 1, time: 300, pxp: 8, hxp: 0.6, y: [40, 80], seed: 40, extra: [['raw_chicken', 2, 5]] },
  { id: 'cow_pen', seedName: 'Calf', out: 'cowhide', name: 'Cow pen', emoji: '🐄', lvl: 8, time: 900, pxp: 14, hxp: 9, y: [4, 8], seed: 150, extra: [['raw_beef', 2, 4], ['bones', 1, 2]] },
  { id: 'newt_pond', seedName: 'Newt spawn', out: 'eye_of_newt', name: 'Newt pond', emoji: '🦎', lvl: 14, time: 900, pxp: 16, hxp: 6, y: [6, 12], seed: 120 },
  { id: 'silkworm_farm', seedName: 'Silkworms', out: 'silk', name: 'Silkworm farm', emoji: '🐛', lvl: 22, time: 1200, pxp: 24, hxp: 15, y: [3, 7], seed: 400 },
  { id: 'vineyard', seedName: 'Zamorak grape vine', out: 'wine_of_zamorak', name: 'Zamorak vineyard', emoji: '🍇', lvl: 36, time: 1800, pxp: 40, hxp: 30, y: [2, 5], seed: 1500 },
  { id: 'nest_boxes', seedName: 'Nest boxes', out: 'bird_nest', name: 'Bird nest boxes', emoji: '🪺', lvl: 42, time: 2400, pxp: 50, hxp: 40, y: [2, 4], seed: 2500, extra: [['crushed_nest', 1, 3]] },
  { id: 'green_roost', seedName: 'Green dragon egg', out: 'green_dragonhide', name: 'Green dragon roost', emoji: '🐲', lvl: 58, time: 3600, pxp: 90, hxp: 70, y: [2, 4], seed: 6000, extra: [['dragon_bones', 1, 2], ['dragon_scale_dust', 1, 2]] },
  { id: 'blue_roost', seedName: 'Blue dragon egg', out: 'blue_dragonhide', name: 'Blue dragon roost', emoji: '🐉', lvl: 68, time: 4200, pxp: 120, hxp: 95, y: [2, 4], seed: 10000, extra: [['dragon_bones', 1, 2]] },
  { id: 'red_roost', seedName: 'Red dragon egg', out: 'red_dragonhide', name: 'Red dragon roost', emoji: '🐉', lvl: 78, time: 4800, pxp: 160, hxp: 125, y: [2, 4], seed: 16000, extra: [['dragon_bones', 1, 3]] },
  { id: 'black_roost', seedName: 'Black dragon egg', out: 'black_dragonhide', name: 'Black dragon roost', emoji: '🐉', lvl: 88, time: 5400, pxp: 210, hxp: 165, y: [2, 4], seed: 25000, extra: [['dragon_bones', 2, 3]] },
];
LIVESTOCK.forEach(c => {
  if (!ITEMS[c.out]) return;
  item(c.id + '_seed', c.seedName, Math.max(1, Math.round(c.seed / 3)), { cat: 'farm', emoji: c.emoji });
  const crop = { ...c, cropItem: c.out, livestock: true }; CROPS.push(crop); CROP_BY_ID[c.id] = crop;
  SHOP.seeds.push({ id: c.id + '_seed', price: c.seed });
  ITEM_ORDER[c.id + '_seed'] = Object.keys(ITEM_ORDER).length;
  (SOURCES[c.out] ||= []).push(`Farming: ${c.name} (lvl ${c.lvl})`);
});
SHOP.seeds.sort((a, b) => a.price - b.price);
harvest = (orig => function (i) {
  const p = S.plots[i], c = p && CROP_BY_ID[p.c];
  const y = orig(i);
  if (y && c?.extra) for (const [id, a, b] of c.extra) if (ITEMS[id]) add(id, Math.max(1, Math.round(randInt(a, b) * M.yield)));
  return y;
})(harvest);
