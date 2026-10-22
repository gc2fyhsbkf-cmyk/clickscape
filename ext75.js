'use strict';
/* =========================================================
   CLICKSCAPE v9.52 (part 2) — the Estate (endless buildings: small permanent bonuses, prices that
   follow your income) and a cosmetic shop (station skins and titles for coins)
   ========================================================= */
const ESTATE = [
  ['forge', '⚒️', 'Forge hall', 'Smithing & Crafting stations +2% speed', 25],
  ['fishery', '🎣', 'Fishery', 'Fishing & Cooking stations +2% speed', 25],
  ['mess', '🍲', 'Mess hall', 'Workers eat 2% less', 25],
  ['larder', '🥫', 'Larder', 'Food bag +2 slots', 25],
  ['barracks', '🛡️', 'Barracks', 'Combat damage +1%', 25],
  ['library', '📚', 'Library', 'All XP +1%', 25],
  ['counting', '💰', 'Counting house', 'Selling +1%', 25],
  ['kennels', '🐾', 'Kennels', 'Rare drop luck +1%', 25],
];
const estate = () => (S.lifetime.estate ||= {});
function estateLvl(id) { return S?.lifetime?.estate?.[id] || 0; }
// price: at least 500K × 2.2ⁿ, and at least half an hour of your coin income × 1.5ⁿ
const estateCost = (id, l) => Math.round(Math.max(5e5 * Math.pow(2.2, l), 0.5 * (typeof INCOME_H !== 'undefined' ? INCOME_H : 0) * Math.pow(1.5, l)));
recalc4 = (orig => function () {
  orig(); if (!S?.lifetime) return; const E = S.lifetime.estate || {};
  const sp = (sts, k) => { if (!k) return; for (const st of sts) { if (M.rate[st] !== undefined) M.rate[st] *= 1 + 0.02 * k; if (M.tap[st] !== undefined) M.tap[st] *= 1 + 0.02 * k; } };
  sp(['anvil', 'furnace', 'craft', 'fletch'], E.forge); sp(['fish', 'range'], E.fishery);
  if (E.barracks) M.dmg *= 1 + 0.01 * E.barracks; if (E.library) M.xp *= 1 + 0.01 * E.library;
  if (E.counting) M.sell *= 1 + 0.01 * E.counting; if (E.kennels) M.luck *= 1 + 0.01 * E.kennels;
})(recalc4);
// the Mess hall trims meals
if (typeof mealRate === 'function') mealRate = (orig => function () { return orig.apply(this, arguments) * (1 - 0.02 * estateLvl('mess')); })(mealRate);
function estatePanel() {
  return `<div class="panel estate"><h3>🏰 Estate <small class="muted">· kept forever · prices follow your income</small></h3>
    <div class="list">${ESTATE.map(([id, ic, n, d, max]) => { const l = estateLvl(id), c = estateCost(id, l); return `<div class="upg ${l ? 'got' : ''}"><div class="upg-icon"><span class="emo">${ic}</span></div><div class="upg-main"><b>${n} ${l}/${max}</b><small>${d} per level${l ? ` · <b class="y">now ×${l}</b>` : ''}</small></div>${l >= max ? '<span class="y">MAX</span>' : `<button class="btn" data-act="estate-buy" data-id="${id}" data-afford="${c}">🪙${fmt(c)}</button>`}</div>`; }).join('')}</div></div>`;
}

/* ================= COSMETIC SHOP ================= */
const SHOP_SKINS = [['royal', 'Royal', 2], ['obsidian', 'Obsidian', 3], ['aurora', 'Aurora', 5], ['sakura', 'Sakura', 4], ['frost', 'Frost', 4]];
const SHOP_TITLES = [['t_tycoon', 'the Tycoon', 3], ['t_magnate', 'the Magnate', 6], ['t_baron', 'Baron', 10], ['t_mogul', 'the Mogul', 20], ['t_golden', 'the Golden', 40]];
const cosmeticPrice = mult => Math.round(Math.max(1e7, 2 * (typeof INCOME_H !== 'undefined' ? INCOME_H : 0)) * mult);
const bought = k => (S.lifetime[k] ||= []);
SHOP_TITLES.forEach(([id, n]) => TITLES.push([id, n, () => (S.lifetime.titlesBought || []).includes(id)]));
function cosmeticPanel() {
  const sk = bought('skinsBought'), ti = bought('titlesBought');
  return `<div class="panel cos-shop"><h3>🎨 Cosmetic shop <small class="muted">· kept forever · prices follow your income</small></h3>
    <small class="muted">Station skins</small><div class="ms-track">${SHOP_SKINS.map(([k, n, m]) => { const own = sk.includes(k); return `<button class="ms-node ${own ? 'got' : ''} skinchip-${k}" data-act="${own ? 'skin-pick' : 'cos-buy'}" data-kind="skin" data-id="${k}"><b>${n}</b><small>${own ? 'use' : '🪙' + fmt(cosmeticPrice(m))}</small></button>`; }).join('')}</div>
    <small class="muted">Titles</small><div class="chips">${SHOP_TITLES.map(([id, n, m]) => { const own = ti.includes(id); return `<button class="chip ${own ? 'on' : ''}" data-act="${own ? 'title' : 'cos-buy'}" data-kind="title" data-id="${id}">${n}${own ? '' : ` · 🪙${fmt(cosmeticPrice(m))}`}</button>`; }).join('')}</div></div>`;
}
viewHouse = (orig => function () { return orig() + estatePanel() + cosmeticPanel(); })(viewHouse);
VIEWS.house = (orig => function () { return rebrand(orig()); })(viewHouse);
// a signpost on the Upgrades page
viewUpgrades = (orig => function () { return orig().replace(/(<div class="panel"><h2>⭐ Upgrades<\/h2>)/, '<div class="panel row-between small"><div>🏰 <b>Estate & cosmetic shop</b><br><small class="muted">Endless buildings and looks to spend your fortune on</small></div><button class="btn small" data-act="hub" data-id="house">Open</button></div>$1'); })(viewUpgrades);
VIEWS.upgrades = (orig => function () { return rebrand(orig()); })(viewUpgrades);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="estate-buy"],[data-act="cos-buy"]'); if (!t) return; e.stopImmediatePropagation();
  if (t.dataset.act === 'estate-buy') {
    const id = t.dataset.id, R = ESTATE.find(x => x[0] === id), l = estateLvl(id); if (!R || l >= R[4]) return; const c = estateCost(id, l);
    if (S.coins < c) return toast(`🏰 You need 🪙${fmt(c)} for the next ${R[2]} level.`, 'warn');
    S.coins -= c; estate()[id] = l + 1; recalc(); toast(`🏰 ${R[2]} level ${l + 1}: ${R[3]}.`, 'rare', 3500);
  } else {
    const k = t.dataset.kind, id = t.dataset.id, L = k === 'skin' ? SHOP_SKINS : SHOP_TITLES, R = L.find(x => x[0] === id); if (!R) return; const c = cosmeticPrice(R[2]);
    if (S.coins < c) return toast(`🎨 You need 🪙${fmt(c)} for that.`, 'warn');
    S.coins -= c; bought(k === 'skin' ? 'skinsBought' : 'titlesBought').push(id);
    if (k === 'skin') { S.lifetime.skin = id; if (typeof applySkin === 'function') applySkin(); } else { S.lifetime.title = id; if (typeof renderTitle === 'function') renderTitle(); }
    toast(`🎨 ${k === 'skin' ? R[1] + ' station skin' : 'Title "' + R[1] + '"'} unlocked!`, 'rare', 3500);
  }
  UI.force = true; render();
}, true);
viewSig = (orig => function () { return UI.view === 'house' ? orig() + JSON.stringify(S.lifetime.estate || {}) + (S.lifetime.skinsBought || []).length + (S.lifetime.titlesBought || []).length + Math.floor(Math.log10(1 + S.coins)) : orig(); })(viewSig);

function boot75() { boot74(); recalc(); UI.force = true; render(); }
