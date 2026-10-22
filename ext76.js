'use strict';
/* =========================================================
   CLICKSCAPE v9.54 — fishing spots show what you hold of each fish, thieving loot tables filled
   out (and real coin ranges), farmlands produce far fewer crops for similar XP
   ========================================================= */

/* ---------- fishing: counts per fish on spot rows ---------- */
viewSkill = (orig => function () {
  let h = orig(); if (UI.skill !== 'fishing') return h;
  return h.replace(/(data-act="target" data-st="fish" data-id="(fs_[a-z]+)">)([\s\S]*?)(<span class="ar-info")/g, (m, open, id, body, tail) => {
    const a = ACTIONS[id]; if (!a?.spot) return m;
    const b2 = body.replace(/<span class="ar-loot">Catches: [\s\S]*?<\/span><\/span>/, `<span class="ar-loot">Catches: ${a.spot.map(([f, w, lvl]) => `<span class="fish-cnt ${LV.fishing >= lvl ? '' : 'locked-fish'}" title="${esc(ITEMS[f].name)} (level ${lvl})">${itemIcon(f)}<small data-count="${f}">${fmt(have(f))}</small></span>`).join('')}</span></span>`);
    return open + b2 + tail;
  });
})(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);

/* ---------- thieving: fuller loot tables, real coin ranges ---------- */
// [coins lo, hi], loot: [item, chance, lo, hi]
const TV = {
  man: [[2, 9], [['bronze_dagger', 1 / 25, 1, 1], ['bronze_arrow', 1 / 8, 3, 10], ['cowhide', 1 / 12, 1, 1], ['feather', 1 / 6, 2, 8], ['potato_seed', 1 / 10, 1, 2]]],
  farmer: [[6, 16], [['potato_seed', 1 / 2, 1, 3], ['flax_crop_seed', 1 / 3, 1, 3], ['cabbage_seed', 1 / 5, 1, 2], ['onion_seed', 1 / 6, 1, 2], ['tomato_seed', 1 / 8, 1, 2]]],
  master_farmer: [[10, 30], [['seedtable', 1, 1, 1], ['ranarr_seed', 1 / 60, 1, 1], ['snapdragon_seed', 1 / 180, 1, 1], ['strawberry_seed', 1 / 8, 1, 3]]],
  guard_pp: [[18, 45], [['iron_dagger', 1 / 20, 1, 1], ['iron_arrow', 1 / 6, 5, 15], ['iron_bar', 1 / 12, 1, 2], ['steel_bolts', 1 / 15, 3, 8], ['chaos_rune', 1 / 10, 2, 6]]],
  knight: [[35, 80], [['steel_dagger', 1 / 25, 1, 1], ['steel_bar', 1 / 10, 1, 3], ['steel_arrow', 1 / 6, 5, 15], ['law_rune', 1 / 12, 1, 4], ['cut_sapphire', 1 / 30, 1, 1]]],
  paladin: [[60, 130], [['fire_orb', 1 / 40, 1, 1], ['mithril_bar', 1 / 10, 1, 3], ['prayer_potion', 1 / 25, 1, 1], ['nature_rune', 1 / 8, 2, 8], ['cut_emerald', 1 / 30, 1, 1], ['mithril_bolts', 1 / 12, 4, 12]]],
  hero: [[200, 320], [['diamond', 1 / 50, 1, 1], ['dragonstone', 1 / 200, 1, 1], ['wine_of_zamorak', 1 / 30, 1, 1], ['adamant_bar', 1 / 10, 1, 2], ['death_rune', 1 / 10, 2, 6], ['gold_bar', 1 / 8, 1, 3], ['super_attack', 1 / 40, 1, 1]]],
  elf: [[280, 360], [['crystal_shard', 1 / 40, 1, 1], ['dragonstone', 1 / 100, 1, 1], ['cut_diamond', 1 / 30, 1, 1], ['magic_potion', 1 / 30, 1, 1], ['nature_rune', 1 / 6, 5, 15], ['rune_arrow', 1 / 10, 5, 15]]],
  tzhaar: [[150, 600], [['onyx', 1 / 2000, 1, 1], ['cut_ruby', 1 / 20, 1, 1], ['cut_diamond', 1 / 40, 1, 1], ['rune_bar', 1 / 25, 1, 1], ['blood_rune', 1 / 12, 2, 8], ['coal', 1 / 4, 5, 20]]],
};
// late targets: their tier's raw materials on top of what they had
const TV_EXTRA = {
  elf_lord: [['rune_bar', 1 / 12, 1, 2], ['magic_logs', 1 / 8, 2, 5], ['death_rune', 1 / 6, 4, 12], ['magic_potion', 1 / 25, 1, 1]],
  rift_merchant: [['primal_bar', 1 / 12, 1, 2], ['pure_essence', 1 / 4, 5, 20], ['emagic_logs', 1 / 10, 1, 4], ['echo_shard', 1 / 300, 1, 1]],
  star_sprite: [['void_bar', 1 / 15, 1, 2], ['star_shard', 1 / 60, 1, 1], ['starwood_logs', 1 / 10, 1, 3]],
};
for (const T of METAL_TIERS.slice(2)) TV_EXTRA[T + '_mark'] = [[T + '_ore', 1 / 6, 1, 3], [T + '_bar', 1 / 15, 1, 2], [T + '_logs', 1 / 8, 2, 5]];
const UNIV = lvl => lvl >= 80 ? [['cut_dragonstone', 1 / 400, 1, 1]] : lvl >= 40 ? [['ruby', 1 / 150, 1, 1]] : [['sapphire', 1 / 120, 1, 1]];
(function () {
  for (const a of STATION_ACTIONS.thieve || []) {
    const t = a.thieve; if (!t) continue; const k = a.id.replace(/^t_/, ''), def = TV[k];
    if (def) { if (t.coins || def[0]) t.coins = def[0]; t.loot = def[1].filter(([id]) => id === 'seedtable' || id === 'gemtable' || ITEMS[id]); }
    else if (t.coins && t.coins[0] === t.coins[1]) t.coins = [Math.round(t.coins[0] * 0.6), Math.round(t.coins[1] * 1.5)];
    for (const x of TV_EXTRA[k] || []) if (ITEMS[x[0]] && !t.loot.some(y => y[0] === x[0])) t.loot.push(x);
    // every target can also turn up something a little special
    for (const u of UNIV(a.lvl)) if (ITEMS[u[0]] && !t.loot.some(x => x[0] === u[0])) t.loot.push(u);
  }
})();

// runes became spell scrolls long ago: swap any rune in these tables for the matching scroll
for (const a of STATION_ACTIONS.thieve || []) if (a.thieve?.loot && typeof deRune === 'function') deRune(a.thieve.loot);

/* ---------- farmlands ---------- */
// see flCps (ext26): a field now harvests ~9× slower for one hand and far less for big crews (hands^0.75),
// while each harvest gives 5× the XP (ext33), so Farming XP holds up and the flax flood dries up

function boot76() { boot75(); UI.force = true; render(); }
