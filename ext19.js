'use strict';
/* =========================================================
   CLICKSCAPE v7.6 — rarer & bigger tool finds, no tools in the shop,
   rare skilling outfits that matter, recipe ingredient sources,
   starter kit fix
   ========================================================= */

/* ---------- 1) Tool finds: rare "whoop" moments (used by the tool-find roll in ext9) ---------- */
const TOOL_FIND_RATE = 1 / 40000, TOOL_FIND_CD = 3 * 3600e3;
function toolFound(st, next) {
  add(next.id, 1); logItem(next.id, 1); S.lifetime.toolFindT = now(); S.lifetime.toolFinds = (S.lifetime.toolFinds || 0) + 1;
  if (OFF) { OFFLOG.push(`🎉 You found a ${next.name} while skilling!`); return; }
  SFX.play('pet'); burst();
  openModal(`<div class="item-modal whoop"><h2>🎉 Incredible find!</h2><div class="whoop-icon">${itemIcon(next.id)}</div>
    <p>While ${STATIONS[st].verb.toLowerCase()}ing, you uncover a <b class="y">${next.name}</b>!</p><p class="muted small">Tool power ×${next.mult}. Finds like this are very rare: at most once every few hours.</p>
    <button class="btn big" data-act="equip" data-id="${next.id}">Wield it</button><button class="btn" data-act="close">Nice!</button></div>`);
}

/* ---------- 2) No tools in the shop (smith them or get them from monsters) ---------- */
SHOP.tools = SHOP.tools.filter(({ id }) => !ITEMS[id]?.slot || ['rod'].includes(ITEMS[id].slot) && !/(bronze|iron|steel|mithril|adamant|rune)_/.test(id));
SHOP.tools.forEach(t => {}); // fishing rods & harpoons that can't be smithed stay
const toolTabNote = '<div class="panel small muted">⛏️ Pickaxes, hatchets, harpoons and mattocks aren’t sold here: smith them at the Anvil, loot them from monsters, or find them (very rarely) while skilling.</div>';
viewShop = (orig => function () { const h = orig(); return UI.shopCat === 'tools' ? h.replace('<div class="list">', toolTabNote + '<div class="list">') : h; })(viewShop);

/* ---------- 3) Skilling outfits: rare, unique, and strong ---------- */
const OUTFIT_RATE = 1 / 6000;
function rollOutfitPiece(set) {
  const missing = OUTFIT_PIECES.map(([p]) => `${set}_${p}`).filter(id => !have(id) && !Object.values(S.equip).includes(id) && !(S.costume?.[id] > 0) && !Object.values(S.cosmetic || {}).includes(id));
  if (!missing.length) { const c = 250000 * (1 + S.asc.count); gainCoins(c); if (!OFF) toast(`👷 You already own the whole ${OUTFITS[set][2]} outfit, so the piece is traded for 🪙${fmt(c)}.`, 'rare'); return; }
  const id = missing[randInt(0, missing.length - 1)];
  add(id, 1); logItem(id, 1);
  if (!OFF) { SFX.play('pet'); burst(); toast(`👷 <b>Outfit piece!</b> ${ITEMS[id].name} (${outfitCount(set)}/4)`, 'pet', 7000); }
}
// stronger sets: +5% XP per piece; the full set adds +10% XP and +25% speed in that skill
skillXpMult = (orig => function (sk) {
  let m = orig(sk);
  for (const [k, [osk]] of Object.entries(OUTFITS)) if (osk === sk) { const n = outfitCount(k); const old = 1 + 0.025 * n + (n === 4 ? 0.025 : 0); m = m / old * (1 + 0.05 * n + (n === 4 ? 0.1 : 0)); }
  return m;
})(skillXpMult);
recalc4 = (orig => function () {
  orig(); if (!S?.asc) return;
  for (const [k, [osk]] of Object.entries(OUTFITS)) if (outfitCount(k) === 4) for (const st of STATION_ORDER) if (STATIONS[st].skill === osk) { M.rate[st] *= 1.25; M.tap[st] *= 1.25; }
})(recalc4);
skillHead = (orig => function (sk) {
  const h = orig(sk), sets = Object.entries(OUTFITS).filter(([, [osk]]) => osk === sk);
  if (!sets.length) return h;
  return h + sets.map(([k, [, , name]]) => { const n = outfitCount(k); return `<div class="outfit-row">👷 <b>${rebrand(name)} outfit ${n}/4</b> <small>${n ? `+${n * 5 + (n === 4 ? 10 : 0)}% XP${n === 4 ? ' · +25% speed' : ''}` : 'Rare from this skill’s reward crates'} · works just by owning it</small></div>`; }).join('');
})(skillHead);
for (const id in SOURCES) SOURCES[id] = SOURCES[id].map(s => s.replace('+2.5% XP each (just own it)', '+5% XP each, full set +10% XP & +25% speed (just own it) · very rare'));

/* ---------- 4) Recipe ingredients show where to get them ---------- */
(function () {
  for (const r of RECIPES) {
    if (!ITEMS[r.out]) continue;
    const parts = Object.keys(r.inp).filter(i => ITEMS[i]).map(i => { const src = (SOURCES[i] || []).find(s => !/^Combine|^Needs/.test(s)); return src ? `${ITEMS[i].name} — ${src}` : null; }).filter(Boolean);
    if (parts.length) (SOURCES[r.out] ||= []).push(...parts.map(p => 'Needs ' + p));
  }
  if (!(SOURCES.smouldering_stone || []).length) (SOURCES.smouldering_stone ||= []).push('Drop: Cerberus (1/128)');
})();

/* ---------- 5) Starter kit: based on ascensions in the current cycle, modest coins ---------- */
giveKit = function () {
  const n = S.asc.count + 2 * (S.trans?.count || 0), k = [...KITS].reverse().find(x => n >= x.at);
  const coins = [500, 5000, 50000, 500000, 5000000][KITS.indexOf(k)] || 500;
  for (const [id, q] of Object.entries(k.items)) if (ITEMS[id] && !ITEMS[id].slot?.match(/pickaxe|hatchet|rod|mattock/)) add(id, q);
  gainCoins(coins);
  for (const id of Object.keys(k.items)) { const it = ITEMS[id]; if (it?.slot && !['pickaxe', 'hatchet', 'rod', 'mattock'].includes(it.slot) && reqOk(it.req)) equip(id); }
  S.combat.food = Object.keys(k.items).find(id => ITEMS[id]?.heal) || S.combat.food;
  return { items: k.items, coins };
};

/* ---------- styles, achievements, boot ---------- */
(function () { ach('whoop', 'Whoop!', 'Find a tool while skilling', '🎉', g => (g.S.lifetime.toolFinds || 0) >= 1, 15); })();
VIEWS.shop = (orig => function () { return rebrand(orig()); })(viewShop);
function boot19() { boot18(); recalc(); UI.force = true; render(); }

