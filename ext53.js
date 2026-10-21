'use strict';
/* =========================================================
   CLICKSCAPE v9.29 — automatic bank tabs (every item sorts itself), skill outfits go straight
   to the Costume room (still count, keep the bank clean) and show on your skilling character
   ========================================================= */

/* ================= AUTO TABS ================= */
const AUTO_TABS = [
  ['metal', '⛏️ Ores & bars'], ['wood', '🌲 Logs & planks'], ['food', '🐟 Food & fish'], ['farm', '🌱 Farming & herbs'], ['potion', '🧪 Potions'],
  ['gear', '⚔️ Gear & ammo'], ['tool', '🛠️ Tools'], ['craft', '💎 Gems, runes & crafting'], ['drop', '🦴 Bones & drops'], ['arch', '🏺 Archaeology'],
  ['box', '📦 Boxes & clues'], ['look', '👗 Cosmetics'], ['other', '❔ Other'],
];
bankCat = function (it) {
  if (!it) return 'other';
  const c = it.cat, k = it.kind || '';
  if (it.cosmetic || it.outfit) return 'look';
  if (c === 'ore' || c === 'bar') return 'metal';
  if (c === 'log' || k === 'plank' || k === 'furniture') return 'wood';
  if (it.potion || k === 'potion' || c === 'potion') return 'potion';
  if (c === 'food' || c === 'fish') return 'food';
  if (c === 'farm' || c === 'herb') return 'farm';
  if (c === 'tool' || ['pickaxe', 'hatchet', 'rod', 'mattock'].includes(it.slot)) return 'tool';
  if (c === 'gear' || c === 'ammo' || it.slot) return 'gear';
  if (c === 'gem' || c === 'craft') return 'craft';
  if (c === 'drop') return 'drop';
  if (c === 'arch') return 'arch';
  if (it.clue || it.open || it.lamp || /casket|box|crate|cache|nest|jar|lamp/.test(it.id)) return 'box';
  return 'other';
};
viewBank = (orig => function () {
  const counts = {}; for (const id in S.bank) if (have(id) && ITEMS[id]) { const c = bankCat(ITEMS[id]); counts[c] = (counts[c] || 0) + 1; }
  if (UI.bankFilter !== 'all' && !counts[UI.bankFilter]) UI.bankFilter = 'all';
  const row = `<div class="chips one-row auto-tabs"><button class="chip ${UI.bankFilter === 'all' ? 'on' : ''}" data-act="bankfilter" data-id="all">🏦 All <small>${Object.values(counts).reduce((a, b) => a + b, 0)}</small></button>${AUTO_TABS.filter(([k]) => counts[k]).map(([k, n]) => `<button class="chip ${UI.bankFilter === k ? 'on' : ''}" data-act="bankfilter" data-id="${k}">${n} <small>${counts[k]}</small></button>`).join('')}</div>`;
  let h = orig().replace(/<button class="chip[^"]*" data-act="bankfilter"[^>]*>[^<]*<\/button>/g, '');
  h = h.includes('<div class="chips one-row btabs">') ? h.replace('<div class="chips one-row btabs">', row + '<div class="chips one-row btabs">') : h.replace('<div class="bank-grid" id="bankgrid">', row + '<div class="bank-grid" id="bankgrid">');
  // custom tabs only show once you've made one (their row keeps a small ＋ otherwise)
  if (!(S.settings.bankTabs || []).length) h = h.replace(/<div class="chips one-row btabs">[\s\S]*?<\/div>/, '').replace('</div><div class="bank-grid"', '<button class="chip small-add" data-act="btab-new" title="Make your own tab">＋</button></div><div class="bank-grid"');
  return h;
})(viewBank);
VIEWS.bank = (orig => function () { return rebrand(orig()); })(viewBank);

/* ================= OUTFITS: straight to the Costume room ================= */
let OUTFIT_MOVE = false;
add = (orig => function (id, n = 1) {
  const r = orig.apply(this, arguments);
  const it = ITEMS[id];
  if (n > 0 && it?.outfit && !OUTFIT_MOVE && S?.bank) {
    OUTFIT_MOVE = true;
    try { const C = S.costume ||= {}; const q = have(id); if (q > 0) { C[id] = (C[id] || 0) + q; remove(id, q); if (!OFF) toast(`👕 ${it.name} is in your Costume room: it works just by owning it, and your character wears it while skilling.`, 'rare', 5000); } }
    finally { OUTFIT_MOVE = false; }
    recalc();
  }
  return r;
})(add);
// tidy existing banks once
function moveOutfits() { const C = S.costume ||= {}; let n = 0; for (const id of Object.keys(S.bank)) if (ITEMS[id]?.outfit && have(id)) { C[id] = (C[id] || 0) + have(id); OUTFIT_MOVE = true; try { remove(id, have(id)); } finally { OUTFIT_MOVE = false; } n++; } if (n) recalc(); }
// taking one out of the costume room shouldn't bounce it straight back
document.addEventListener('click', e => { const t = e.target.closest('[data-act="costume-take"]'); if (t && ITEMS[t.dataset.id]?.outfit) { OUTFIT_MOVE = true; setTimeout(() => { OUTFIT_MOVE = false; }, 0); } }, true);

function boot53() { boot52(); moveOutfits(); UI.force = true; render(); }

