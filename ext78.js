'use strict';
/* =========================================================
   CLICKSCAPE v9.56 — Salvaging tidy-up: mattocks become crowbars, the old dig-site leftovers
   (Digby, the Ancient Brush) get salvage versions, and long float numbers (10.100000000000001h,
   5.9999999) are cleaned up everywhere
   ========================================================= */

/* ---------- crowbars ---------- */
for (const it of Object.values(ITEMS)) {
  if (it.kind !== 'mattock' && it.slot !== 'mattock') continue;
  it.name = it.name.replace(/mattock/g, 'crowbar').replace(/Mattock/g, 'Crowbar');
}
STATIONS.dig.toolName = 'crowbar';
if (PETS.mole) Object.assign(PETS.mole, { name: 'Rivet the Magpie', icon: '🐦‍⬛', desc: '+10% Salvaging speed' });
{ const u = UPGRADES.find(x => x.id === 'ancient_brush'); if (u) Object.assign(u, { name: 'Pneumatic Crowbar', icon: '🔧', desc: 'Salvaging ×2 (tap & workers)', items: { metal_scrap: 5000 } }); }
// plain-text mentions of mattocks in the UI
const MATTOCK_RE = /(?<![\w'"=-])([Mm])attock(s?)(?![\w"])/g;
const fixMattock = s => typeof s === 'string' ? s.replace(MATTOCK_RE, (m, M, pl) => (M === 'M' ? 'Crowbar' : 'crowbar') + pl) : s;

/* ---------- long float numbers ---------- */
// 10.100000000000001 → 10.1, 5.9999999999 → 6 (only numbers that are clearly rounding noise)
const FLOAT_RE = /(\d+)\.(\d*?)(0{6,}\d{1,3}|9{6,}\d{0,3})(?!\d)/g;
const fixFloats = s => typeof s === 'string' ? s.replace(FLOAT_RE, (m, a, b) => { const v = (+m).toFixed(b.length); return String(+v); }) : s;
rebrand = (orig => function (s) { return fixMattock(fixFloats(orig(s))); })(rebrand);
toast = (orig => function (html, ...a) { return orig(fixMattock(fixFloats(html)), ...a); })(toast);
openModal = (orig => function (html, ...a) { return orig(fixMattock(fixFloats(html)), ...a); })(openModal);
offlineHours = (orig => function () { return Math.round(orig() * 100) / 100; })(offlineHours);

function boot78() { boot77(); UI.force = true; render(); }
