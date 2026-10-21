'use strict';
/* =========================================================
   CLICKSCAPE v9.39 — worker events (tap-to-claim boosts and finds while you play),
   milestone station skins, and pages remember
   where you'd scrolled to
   ========================================================= */

/* ================= WORKER EVENTS ================= */
// every 8–14 minutes of play, one of your workers reports something. A small bubble sits above the
// menu bar for 2 minutes: tap it to claim, or ignore it. Nothing happens offline.
const WEV = { next: 0, cur: null };
const wevOn = () => S.settings.wevents !== false;
const perMin = st => { const a = ACTIONS[S.target[st]]; return a && M.rate[st] > 0 ? M.rate[st] * frenzy() / a.hp * 60 : 0; };
const WEV_TYPES = [
  { k: 'vein', w: 4, ok: st => true, text: (st, S0) => `${S0.wicon} Your ${S0.worker}s are on a roll! <b>Tap: ×3 ${S0.name} speed for 10 min</b>`,
    claim: st => { S.wboost = { st, until: now() + 600e3 }; recalc(); return [`${STATIONS[st].wicon} ×3 ${STATIONS[st].name} speed`, 'for the next 10 minutes']; } },
  { k: 'stash', w: 3, ok: st => { const a = ACTIONS[S.target[st]]; return a && !a.inp && !a.thieve && !a.course && !a.star && Object.keys(a.out || {}).length; },
    text: (st, S0) => `${S0.wicon} A ${S0.worker} found a stash! <b>Tap to collect</b>`,
    claim: st => { const a = ACTIONS[S.target[st]], n = Math.max(5, Math.round(perMin(st) * 15)); const got = [];
      for (const id in a.out) { const q = a.out[id] * n; add(id, q); got.push(`${fmt(q)} × ${ITEMS[id].name}`); }
      if (Math.random() < 0.25 && typeof clueTierFor === 'function') { const t = clueTierFor((LV[STATIONS[st].skill] || 1) * 1.4); add('clue_' + t, 1); got.push(`a ${t} treasure map`); }
      return ['📦 Stash collected', got.join(' + ')]; } },
  { k: 'tip', w: 3, ok: st => !!ACTIONS[S.target[st]], text: (st, S0) => `${S0.wicon} Your ${S0.worker} has a trick to show you. <b>Tap for 15 min of ${SKILLS[S0.skill].name} XP</b>`,
    claim: st => { const a = ACTIONS[S.target[st]], sk = STATIONS[st].skill, x = a.xp * Math.max(10, perMin(st) * 15); gainXP(sk, x); return [`💡 +${fmt(x)} ${SKILLS[sk].name} XP`, `your ${STATIONS[st].worker}'s trick`]; } },
];
function wevSpawn() {
  const sts = STATION_ORDER.filter(st => (S.workers[st] || 0) > 0 && M.rate[st] > 0 && ACTIONS[S.target[st]]); if (!sts.length) return;
  const st = sts[randInt(0, sts.length - 1)];
  const L = WEV_TYPES.filter(t => t.ok(st)); let r = Math.random() * L.reduce((a, t) => a + t.w, 0), T = L[0]; for (const t of L) { if ((r -= t.w) <= 0) { T = t; break; } }
  WEV.cur = { st, k: T.k, until: Date.now() + 120e3 };
  wevDraw(); try { SFX2('contract'); } catch (e) {}
}
function wevDraw() {
  let el = document.getElementById('wevent');
  if (!WEV.cur) { if (el) el.remove(); return; }
  const T = WEV_TYPES.find(t => t.k === WEV.cur.k), S0 = STATIONS[WEV.cur.st];
  if (!el) { el = document.createElement('div'); el.id = 'wevent'; document.body.appendChild(el); }
  const h = `<button class="wev-main" data-act="wev-claim">${T.text(WEV.cur.st, S0)}</button><button class="wev-x" data-act="wev-x" aria-label="Dismiss">✕</button><i style="animation-duration:${Math.max(0, WEV.cur.until - Date.now())}ms"></i>`;
  if (el._k !== WEV.cur.until) { el._k = WEV.cur.until; el.innerHTML = h; }
}
setInterval(() => {
  if (!S || OFF || document.hidden) return;
  const t = Date.now();
  if (S.wboost && now() > S.wboost.until) { S.wboost = null; recalc(); }
  if (WEV.cur && t > WEV.cur.until) { WEV.cur = null; wevDraw(); }
  if (!wevOn()) { if (WEV.cur) { WEV.cur = null; wevDraw(); } return; }
  if (!WEV.next) WEV.next = t + (3 + Math.random() * 4) * 60e3; // first one comes a bit sooner
  if (!WEV.cur && t > WEV.next) { WEV.next = t + (8 + Math.random() * 6) * 60e3; wevSpawn(); }
}, 1000);
recalc4 = (orig => function () { orig(); const B = S?.wboost; if (B && now() < B.until && M.rate[B.st] !== undefined) { M.rate[B.st] *= 3; M.tap[B.st] *= 3; } })(recalc4);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="wev-claim"],[data-act="wev-x"]'); if (!t) return; e.stopImmediatePropagation();
  const cur = WEV.cur; WEV.cur = null; wevDraw(); if (!cur || t.dataset.act === 'wev-x') return;
  const T = WEV_TYPES.find(x => x.k === cur.k); const [title, sub] = T.claim(cur.st) || [];
  if (typeof fanBanner === 'function') fanBanner(`<span class="emo">${STATIONS[cur.st].wicon}</span>`, title, sub); else toast(`${title} · ${sub}`, 'rare');
  S.lifetime.wevClaimed = (S.lifetime.wevClaimed || 0) + 1; UI.force = true; render();
}, true);
// a live "×3" tag on the boosted station
liveExtra = (orig => function (L) {
  const r = orig.apply(this, arguments); const B = S.wboost, on = B && now() < B.until;
  document.querySelectorAll('.stage').forEach(stg => { const st = UI.view === 'skill' ? UI.curStation || UI.station?.[UI.skill] : null; const show = on && st === B.st; let tag = stg.querySelector('.wb-tag');
    if (show) { if (!tag) { tag = document.createElement('div'); tag.className = 'wb-tag'; stg.appendChild(tag); } setT(tag, `×3 · ${fmtTime((B.until - now()) / 1000)}`); } else if (tag) tag.remove(); });
  return r;
})(liveExtra);
viewSettings = (orig => function () {
  return orig().replace(/(<label class="toggle"><input type="checkbox" data-act="set-autolock"[^]*?<\/label>)/, `$1<label class="toggle"><input type="checkbox" data-act="set-wevents" ${wevOn() ? 'checked' : ''}> Worker events (a tap-to-claim bubble every ~10 minutes)</label>`);
})(viewSettings);
VIEWS.settings = (orig => function () { return rebrand(orig()); })(viewSettings);
document.addEventListener('change', e => { const t = e.target.closest?.('[data-act="set-wevents"]'); if (t) { S.settings.wevents = t.checked; if (!t.checked) { WEV.cur = null; wevDraw(); } } }, true);

/* ================= ASCENSION MILESTONE SKINS ================= */
// the existing milestones (×1.1 production & XP each) now also unlock a station skin, with a fanfare
const SKIN_NAMES = [['bronze', 'Bronze'], ['iron', 'Iron'], ['silver', 'Silver'], ['gold', 'Gold'], ['crystal', 'Crystal'], ['void', 'Void'], ['celestial', 'Celestial'], ['primordial', 'Primordial'], ['primordial', 'Primordial II'], ['primordial', 'Primordial III'], ['primordial', 'Primordial IV'], ['primordial', 'Primordial V']];
const skinsGot = () => SKIN_NAMES.slice(0, Math.min(8, msReached()));
const skinNow = () => { const ok = skinsGot().map(x => x[0]).concat(S.lifetime.skinsBought || []); if (!ok.length) return null; const pick = S.lifetime.skin; if (pick === 'none') return null; return ok.includes(pick) ? pick : ok[ok.length - 1]; };
function applySkin() { const s = skinNow(); document.body.className = document.body.className.replace(/\bskin-\w+\b/g, '').trim() + (s ? ' skin-' + s : ''); }
function msPanel() {
  const r = msReached(), next = ASC_MS[r], cur = skinNow();
  return `<div class="panel ascms"><h3>🏆 Ascension milestones <small class="muted">· ${fmt(lifeAsc())} lifetime ascensions</small></h3>
    <small class="muted">Each milestone: <b class="y">×1.1 production & XP</b> forever (now ×${fmtD(Math.pow(1.1, r))}) and a new station skin. ${next ? `Next at <b>${fmt(next)}</b> ascensions.` : 'All reached!'}</small>
    <div class="ms-track">${ASC_MS.slice(0, 8).map((n, i) => { const [k, name] = SKIN_NAMES[i]; return `<button class="ms-node ${i < r ? 'got' : ''} ${cur === k && i < r ? 'on' : ''} skinchip-${k}" ${i < r ? `data-act="skin-pick" data-id="${k}"` : 'disabled'}><b>${fmt(n)}</b><small>${name}</small></button>`; }).join('')}</div>
    ${ASC_MS.length > 8 ? `<small class="muted">Beyond: ${ASC_MS.slice(8).map((n, i) => `<span class="chip ${i + 8 < r ? 'on' : 'locked'}">${fmt(n)}</span>`).join(' ')}</small><br>` : ''}
    ${r ? `<small class="muted">Tap a reached milestone to use its station skin, or <button class="chip" data-act="skin-pick" data-id="none">${cur ? 'plain stations' : '✓ plain stations'}</button></small>` : '<small class="muted">Your first skin (Bronze) comes at 5 ascensions.</small>'}</div>`;
}
viewAscension = (orig => function () {
  const h = orig().replace(/<div class="panel small"><b>🏆 Ascension milestones<\/b>[\s\S]*?<\/div><\/div>/, '');
  return h.includes('<div class="ctabs asc-tabs">') ? h.replace('<div class="ctabs asc-tabs">', msPanel() + '<div class="ctabs asc-tabs">') : msPanel() + h;
})(viewAscension);
VIEWS.ascension = (orig => function () { return rebrand(orig()); })(viewAscension);
viewSig = (orig => function () { return UI.view === 'ascension' ? orig() + '|ms' + msReached() + (S.lifetime.skin || '') : orig(); })(viewSig);
let msT = 0;
tickCore = (orig => function (dt) {
  orig(dt); msT += dt; if (msT < 3) return; msT = 0;
  const r = msReached(); if (S.lifetime.msSeen == null) S.lifetime.msSeen = r;
  if (r > S.lifetime.msSeen) { S.lifetime.msSeen = r; applySkin(); const n = ASC_MS[r - 1], name = SKIN_NAMES[r - 1]?.[1] || ''; const msg = `🏆 Ascension milestone: ${fmt(n)} ascensions! ×1.1 production & XP forever${r <= 8 ? ` and the ${name} station skin` : ''}.`; if (OFF) OFFLOG.push(msg); else if (typeof fanLegend === 'function') fanLegend({ kind: '🏆 ASCENSION MILESTONE 🏆', icon: '<span class="emo">🌀</span>', name: `${fmt(n)} ascensions`, sub: `×${fmtD(Math.pow(1.1, r))} production & XP forever${r <= 8 ? ` · new ${name} station skin` : ''}` }); else toast(msg, 'pet', 6000); }
})(tickCore);
document.addEventListener('click', e => { const t = e.target.closest('[data-act="skin-pick"]'); if (!t) return; e.stopImmediatePropagation(); S.lifetime.skin = t.dataset.id; applySkin(); UI.force = true; render(); }, true);

/* ================= AUTO-SELL ONLY SELLS DROPS ================= */
// "Auto-sell drops" used to sell your WHOLE stack of that item every time any monster died, so bars
// or logs you'd made yourself vanished in one go. Now it only sells what that kill dropped.
let AS_BASE = null;
killMonster = (orig => function () {
  const L = S.autosell || {}, base = {}; for (const id in L) if (L[id]) base[id] = have(id);
  const prev = AS_BASE; AS_BASE = base; try { return orig.apply(this, arguments); } finally { AS_BASE = prev; }
})(killMonster);
autoSellNow = function () {
  const L = S.autosell; if (!L || !AS_BASE) return; let total = 0;
  for (const id in L) { if (!L[id] || S.locked?.[id]) continue; const n = Math.max(0, have(id) - (AS_BASE[id] || 0)); if (n > 0) { total += saleTake(id, n, sellPrice(id)); remove(id, n); AS_BASE[id] = have(id); } }
  if (total) gainCoins(total);
};
// a small 🗑️ on bank tiles of items that are set to auto-sell, so it's never a surprise
bankTiles = (orig => function () { const L = S.autosell || {}; return orig().replace(/(<button class="tile[^"]*"[^>]*data-id="([a-z0-9_]+)"[^>]*>)/g, (m, open, id) => L[id] ? open + '<span class="as-mark" title="Auto-sell is on">🗑️</span>' : m); })(bankTiles);

/* ================= WHERE DID MY ITEMS GO? ================= */
// the item window lists what used up this item in the last hour (stations, selling, auto-sell...)
const LEDGER = {}; let LCTX = null;
const ledgerCtx = (fn, label) => (orig => function () { const p = LCTX; LCTX = typeof label === 'function' ? label.apply(this, arguments) : label; try { return orig.apply(this, arguments); } finally { LCTX = p; } })(fn);
doYield = ledgerCtx(doYield, st => `used at the ${STATIONS[st]?.name || st}`);
autoSellNow = ledgerCtx(autoSellNow, 'auto-sold after kills');
sell = ledgerCtx(sell, 'sold'); geSell = ledgerCtx(geSell, 'sold on the GE'); buyUpgrade = ledgerCtx(buyUpgrade, 'spent on upgrades');
remove = (orig => function (id, n) {
  if (n > 0 && S?.bank && !OUTFIT_MOVE) { const t = Date.now(), E = LEDGER[id] ||= []; E.push([t, n, LCTX || 'used or spent elsewhere']); while (E.length && t - E[0][0] > 3600e3) E.shift(); if (E.length > 400) E.splice(0, E.length - 400); }
  return orig.apply(this, arguments);
})(remove);
openItemModal = (orig => function (id, fromSlot) {
  orig.apply(this, arguments); if (fromSlot) return; const E = (LEDGER[id] || []).filter(e => Date.now() - e[0] < 3600e3); if (!E.length) return;
  const by = {}; for (const [, n, k] of E) by[k] = (by[k] || 0) + n;
  const box = $('#modal .item-modal') || $('#modal'); box?.insertAdjacentHTML('beforeend', `<p class="small muted ledger">📉 Last hour: ${Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<b>${fmt(n)}</b> ${k}`).join(' · ')}</p>`);
})(openItemModal);

/* ================= PAGES REMEMBER WHERE YOU WERE ================= */
// going back to a page puts you where you'd scrolled to, instead of the top
const SCROLL_MEM = {};
const pageKey = () => UI.view + (UI.view === 'skill' ? ':' + UI.skill + ':' + (UI.station?.[UI.skill] || '') : '') + (UI.view === 'bank' ? ':' + UI.bankFilter : '');
go = (orig => function (v, ...r) {
  const from = pageKey(); SCROLL_MEM[from] = window.scrollY;
  const res = orig.call(this, v, ...r); const y = SCROLL_MEM[pageKey()];
  if (y && pageKey() !== from) requestAnimationFrame(() => window.scrollTo(0, Math.min(y, document.body.scrollHeight)));
  return res;
})(go);

function boot60() { boot59(); applySkin(); if (S.lifetime.msSeen == null) S.lifetime.msSeen = msReached(); recalc(); UI.force = true; render(); }
