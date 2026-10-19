'use strict';
/* =========================================================
   CLICKSCAPE v7.7 — Glyphcraft makes spell scrolls (Magic's ammo),
   bought items don't count for tribute, tabbed Ascension page
   ========================================================= */

/* ================= SPELL SCROLLS ================= */
const SCROLLS = [
  [1, 'Gust', 2, 'gust', { pure_essence: 1 }, 10, '#cfe8f4'], [13, 'Ember', 8, 'ember', { pure_essence: 1, ashes: 1 }, 10, '#e8803a'],
  [35, 'Firebolt', 12, 'firebolt', { pure_essence: 2, coal: 1 }, 8, '#e85a1a'], [59, 'Flame Burst', 16, 'flameburst', { pure_essence: 2, yew_logs: 1 }, 6, '#d83a1a'],
  [75, 'Inferno Wave', 20, 'infernowave', { pure_essence: 3, magic_logs: 1 }, 5, '#c81a1a'], [95, 'Pyroclasm', 24, 'pyroclasm', { pure_essence: 4, elder_logs: 1 }, 5, '#a8101a'],
  [120, 'Starfall', 32, 'starfall', { pure_essence: 5, rift_essence: 1 }, 5, '#c8a8ff'], [150, 'Void Bolt', 42, 'voidbolt', { pure_essence: 6, ascended_logs: 1 }, 5, '#6a3ad8'],
  [185, 'Nova', 56, 'nova', { pure_essence: 8, divine_logs: 1 }, 5, '#ffd84a'], [230, 'Cataclysm', 75, 'cataclysm', { pure_essence: 10, eternal_logs: 1 }, 5, '#ff4a8a'],
];
SPELLS.length = 0; SCROLLS.forEach(([lvl, name, max]) => SPELLS.push([lvl, name, max]));
// Glyphcraft: retire the rune altars, inscribe scrolls instead
Object.assign(STATIONS.runealtar, { name: "Scribe's desk", verb: 'Inscribe', worker: 'Scribe', wicon: '✍️' });
STATION_ACTIONS.runealtar = STATION_ACTIONS.runealtar.filter(a => !/^rc_/.test(a.id) || a.id === 'rc_gotr');
for (const id of Object.keys(ACTIONS)) if (/^rc_/.test(id) && id !== 'rc_gotr') delete ACTIONS[id];
SCROLLS.forEach(([lvl, name, , key, inp, out, tint], i) => {
  const id = 'scroll_' + key;
  item(id, `Scroll of ${name}`, Math.max(2, Math.round(lvl * lvl / 20)), { cat: 'ammo', kind: 'scroll', tint, scroll: name, spellLvl: lvl });
  if (Object.keys(inp).every(k => ITEMS[k])) A7({ id: 'gl_' + key, st: 'runealtar', name: `Scroll of ${name} ×${out}`, lvl, xp: 6 + lvl * 1.6, hp: 2 + Math.floor(lvl / 25), inp, out: { [id]: out }, icon: id });
  (SOURCES[id] ||= []).push(`Glyphcraft ${lvl}: ${Object.entries(inp).map(([k, q]) => `${q} ${ITEMS[k]?.name.toLowerCase()}`).join(' + ')} → ${out} scrolls`);
});
STATION_ACTIONS.runealtar.sort((a, b) => a.lvl - b.lvl);
// Guardians of the Rift now pays out scrolls
if (ACTIONS.rc_gotr) ACTIONS.rc_gotr.out = { scroll_ember: 3, scroll_firebolt: 1 };
if (CRATES.gotr_pouch) CRATES.gotr_pouch.loot = [['coins', 300, 3000], ['scroll_firebolt', 10, 30], ['scroll_flameburst', 5, 15], ['scroll_infernowave', 2, 8], ['pure_essence', 50, 150]];
// every rune that dropped, was looted or was asked for becomes a scroll of similar tier (×1/3 quantity)
const RUNE_TO_SCROLL = { air: 'gust', mind: 'gust', water: 'gust', earth: 'gust', fire: 'ember', body: 'ember', cosmic: 'firebolt', chaos: 'firebolt', astral: 'firebolt', nature: 'firebolt', law: 'flameburst', death: 'flameburst', blood: 'infernowave', soul: 'infernowave', wrath: 'pyroclasm' };
const runeSwap = id => { const m = /^(\w+)_rune$/.exec(id); return m && ITEMS[id]?.rune ? 'scroll_' + (RUNE_TO_SCROLL[m[1]] || 'starfall') : null; };
const third = n => typeof n === 'number' && n >= 1 ? Math.max(1, Math.round(n / 3)) : n;
function deRune(x, seen = new Set(), upto = 9) {
  if (!x || typeof x !== 'object' || seen.has(x)) return; seen.add(x);
  if (Array.isArray(x)) {
    if (typeof x[0] === 'string' && runeSwap(x[0])) { x[0] = runeSwap(x[0]); for (let i = 1; i < Math.min(x.length, upto + 1); i++) x[i] = third(x[i]); return; }
    x.forEach(v => deRune(v, seen, upto)); return;
  }
  for (const k of Object.keys(x)) {
    const s = runeSwap(k);
    if (s && typeof x[k] === 'number') { x[s] = (x[s] || 0) + third(x[k]); delete x[k]; } else deRune(x[k], seen);
  }
}
[MONSTERS, CRATES, DROP_BANDS, TOA_COMMON, TOB_COMMON, IMP_LOOT].forEach(t => deRune(t));
deRune(RDT, undefined, 2); deRune(TRIBUTE_POOL, undefined, 1);
for (let i = GE_ITEMS.length - 1; i >= 0; i--) if (runeSwap(GE_ITEMS[i])) { GE_SET.delete(GE_ITEMS[i]); GE_ITEMS.splice(i, 1); }
RELICS.forEach?.(t => (Array.isArray(t) ? t : [t]).forEach(r => { if (r?.desc && typeof r.desc === 'string') r.desc = r.desc.replace('runes & essence', 'sigils & essence'); }));
for (const a of Object.values(ACTIONS)) { deRune(a.out); deRune(a.inp); deRune(a.bonus); }
for (const id of Object.keys(ITEMS)) if (ITEMS[id].rune && ITEMS[id].cat === 'craft') ITEMS[id].hidden = true;
// shop sells only the two basic scrolls
SHOP.supplies = SHOP.supplies.filter(s => !/_rune$/.test(s.id));
SHOP.supplies.push({ id: 'scroll_gust', price: 20 }, { id: 'scroll_ember', price: 60 });
// starter kits include a stack of scrolls
KITS.forEach((k, i) => { k.items[['scroll_gust', 'scroll_ember', 'scroll_firebolt', 'scroll_flameburst', 'scroll_infernowave'][i] || 'scroll_gust'] = 150; });

// casting
const standardMagic = () => { const w = ITEMS[S.equip.weapon]; return wclass() === 'magic' && (!w?.cast || w.cast === 'spell'); };
spellFor = function () {
  let best = null, top = SPELLS[0];
  for (const sp of SPELLS) if (LV.magic >= sp[0]) { top = sp; if (have(scrollId(sp[1]))) best = sp; }
  return best || top;
};
const scrollId = name => 'scroll_' + (SCROLLS.find(s => s[1] === name)?.[3] || 'gust');
spellRunes = function () { return null; }; // the old rune bonus is retired
canFight = (orig => function (m) {
  if (standardMagic() && !SPELLS.some(sp => LV.magic >= sp[0] && have(scrollId(sp[1])))) return 'You need spell scrolls: inscribe them with Glyphcraft (or buy Gust/Ember scrolls)';
  return orig(m);
})(canFight);
let scrollWarned = false;
playerAttack = (orig => function (tap, mult, acc, noAmmo) {
  if (standardMagic() && !noAmmo) {
    const sp = spellFor(), id = scrollId(sp[1]);
    if (!have(id)) { retreat(); if (!OFF) { toast('📜 You have run out of spell scrolls! Inscribe more with Glyphcraft.', 'warn', 6000); UI.force = true; } return 0; }
    remove(id, 1);
    if (have(id) === 0 && !scrollWarned && !OFF) { scrollWarned = true; toast(`📜 Last ${ITEMS[id].name} used, switching to your next best scroll.`, 'warn'); } else if (have(id)) scrollWarned = false;
  }
  return orig(tap, mult, acc, noAmmo);
})(playerAttack);
viewCombat = (orig => function () {
  const h = orig();
  if (!standardMagic() || (UI.ctab || 'setup') !== 'setup') return h;
  const rows = SPELLS.filter(sp => LV.magic >= sp[0]).map(sp => { const id = scrollId(sp[1]); return `<span class="chip ${spellFor()[1] === sp[1] ? 'on' : ''} ${have(id) ? '' : 'locked'}">${itemIcon(id)} ${sp[1]} <small>max ${sp[2]} · ${fmt(have(id))}</small></span>`; }).join('');
  return h.replace(/<p class="small">🔮 Casting <b>[^<]*<\/b><\/p>/, `<h3>Spell scrolls <small class="muted">(1 used per cast · best one you hold is cast)</small></h3><div class="chips">${rows}</div>`);
})(viewCombat);
VIEWS.combat = (orig => function () { return rebrand(orig()); })(viewCombat);

/* ---------- one-off: give existing magic users scrolls for their level ---------- */
function scrollMigration() {
  if (S.lifetime.scrollMig) return; S.lifetime.scrollMig = 1;
  for (const id of Object.keys(S.bank)) { const s = runeSwap(id); if (s) { add(s, third(S.bank[id])); delete S.bank[id]; } }
  if (LV.magic > 1) { const sp = spellFor(); add(scrollId(sp[1]), 300); toast(`📜 Magic now uses spell scrolls! Here are 300 × Scroll of ${sp[1]} to start. Make more with Glyphcraft.`, 'pet', 9000); }
}

/* ================= TRIBUTE: track purchases (bought items don't count) ================= */
geBuy = (orig => function (id, q) { const c0 = S.coins; orig(id, q); if (S.coins < c0) (S.bought ||= {})[id] = (S.bought[id] || 0) + q; })(geBuy);
buy = (orig => function (id, q, p) { const c0 = S.coins; orig(id, q, p); if (S.coins < c0) (S.bought ||= {})[id] = (S.bought[id] || 0) + q; })(buy);
remove = (orig => function (id, n) { const r = orig(id, n); if (r && S?.bought?.[id]) S.bought[id] = Math.min(S.bought[id], have(id)); return r; })(remove);

/* ================= ASCENSION PAGE TABS ================= */
viewAscension = (orig => function () {
  const html = orig(), tab = UI.ascTab || 'ascend';
  const head = html.match(/^[\s\S]*?(?=<div class="panel)/)?.[0] || '';
  const panels = html.slice(head.length).split(/(?=<div class="panel)/);
  const kind = p => /Essence perks/.test(p) ? 'perks' : /panel relics|Challenges|Weekly trial/.test(p) ? 'run' : 'ascend';
  const pick = panels.filter(p => kind(p) === tab).join('');
  const ess = fmt(S.asc.essence || 0), relicReady = tab !== 'run' && panels.some(p => kind(p) === 'run' && /data-act="relic"(?![^>]*disabled)/.test(p));
  const tabs = `<div class="ctabs asc-tabs"><button class="ctab ${tab === 'ascend' ? 'on' : ''}" data-act="asc-tab" data-id="ascend">🌀 Ascend</button><button class="ctab ${tab === 'perks' ? 'on' : ''}" data-act="asc-tab" data-id="perks">✨ Perks <small>${ess} essence</small></button><button class="ctab ${tab === 'run' ? 'on' : ''}" data-act="asc-tab" data-id="run">🔮 Run${relicReady ? ' <b class="y">●</b>' : ''} <small>${relicReady ? 'relic to pick!' : 'relics & challenges'}</small></button></div>`;
  return (head + tabs + pick).replace(/runes &amp; essence|runes & essence/g, 'sigils & essence');
})(viewAscension);
VIEWS.ascension = (orig => function () { return rebrand(orig()); })(viewAscension);
viewSig = (orig => function () { return UI.view === 'ascension' ? orig() + (UI.ascTab || 'ascend') + (S.asc.essence || 0) : orig(); })(viewSig);
document.addEventListener('click', e => {
  if (e.target.closest('[data-nav]')) return;
  const t = e.target.closest('[data-act]'); if (!t || t.dataset.act !== 'asc-tab') return;
  UI.ascTab = t.dataset.id; e.stopImmediatePropagation(); UI.force = true; render(); window.scrollTo(0, 0);
}, true);

/* ---------- logs & boot ---------- */
(function () {
  for (const it of Object.values(ITEMS)) if (it.scroll) it.name = rebrand(it.name);
  ach('scribe', 'Scribe', 'Inscribe a Scroll of Pyroclasm', '📜', g => g.S.clog?.scroll_pyroclasm || have('scroll_pyroclasm'), 15);
  Object.keys(ITEMS).forEach(id => { if (!(id in ITEM_ORDER)) ITEM_ORDER[id] = Object.keys(ITEM_ORDER).length; });
  for (const id of Object.keys(ITEMS)) if (ITEMS[id].scroll && !GE_SET.has(id)) { GE_ITEMS.push(id); GE_SET.add(id); }
})();
function boot20() { boot19(); ensureTargets(); scrollMigration(); recalc(); UI.force = true; render(); }
boot20();
