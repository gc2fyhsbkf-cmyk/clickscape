'use strict';
/* =========================================================
   CLICKSCAPE v9.42 — sound & vibration throttle: no more slot-machine dinging when hundreds of
   items arrive at once
   ========================================================= */
// each sound could fire 14 times a second, and "rare find" chimes played for every gem, seed or
// drop at high production. Now: frequent "something arrived" sounds play at most every 1.5–2 seconds,
// any one sound at most ~6 times a second, and never more than 8 sounds a second in total.
const SND_GAP = { rare: 2000, coin: 1500, clue: 1500, pet: 1200, level: 900, ach: 1500, quality: 1500, chest: 800, legend: 1500, contract: 1200, error: 800 };
const SND_LAST = {}; let SND_WIN = [];
const sndOk = name => {
  const t = performance.now(), gap = SND_GAP[name] ?? 160;
  if (t - (SND_LAST[name] || -1e9) < gap) return false;
  SND_WIN = SND_WIN.filter(x => t - x < 1000); if (SND_WIN.length >= 8) return false;
  SND_LAST[name] = t; SND_WIN.push(t); return true;
};
SFX.play = (orig => function (name) { if (!sndOk(name)) return; return orig.apply(this, arguments); })(SFX.play);
let BUZZ_T = 0;
buzz = (orig => function () { const t = Date.now(); if (t - BUZZ_T < 1500) return; BUZZ_T = t; return orig.apply(this, arguments); })(buzz);

// FIX: the Beyond bosses' collection-log page listed five items that don't exist (and could crash that page)
(function () {
  const pg = CLOG.find(c => c.id === 'beyond'); if (!pg) return;
  pg.items = pg.items.map(i => { if (!/_undefined$/.test(i)) return i; const b = BEYOND_BOSSES.find(x => i.startsWith(x[0] + '_')); const id = b && `${b[0]}_${b[9]}`; return id && ITEMS[id] ? id : null; }).filter(Boolean);
  for (const b of BEYOND_BOSSES) { const bad = SOURCES[`${b[0]}_undefined`]; if (bad) { (SOURCES[`${b[0]}_${b[9]}`] ||= []).push(...bad); delete SOURCES[`${b[0]}_undefined`]; } }
})();

function boot63() { boot62(); }
