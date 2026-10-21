'use strict';
/* =========================================================
   CLICKSCAPE v9.37 — fixes: steady "out of materials" notice, bank tab row keeps its scroll,
   destroy for items you can't sell, Rogue outfit tidy-up, skilling-boss crate cap
   ========================================================= */

/* ---------- 1) "out of materials" only changes after it's been true for a moment ---------- */
// workers using inputs the instant they arrive made the notice flash on and off every frame
const MAT_ST = {};
const matMissText = a => { for (const id in (a.inp || {})) { const n = a.inp[id] - have(id); if (n > 0) return `⚠ need ${fmt(n)} more ${ITEMS[id]?.name || id}`; } return '⚠ out of materials'; };
liveExtra = (orig => function (L) {
  const r = orig.apply(this, arguments);
  const t = Date.now();
  (L?.status || []).forEach(e => {
    const st = e.dataset.status, a = ACTIONS[S.target[st]]; if (!a) return;
    const raw = !canMakeOne(a), s = MAT_ST[st] ||= { shown: raw, since: t };
    if (raw === s.shown) s.since = t; else if (t - s.since > 1500) { s.shown = raw; s.since = t; }
    setT(e, s.shown ? matMissText(a) : '');
  });
  return r;
})(liveExtra);

/* ---------- 2) side-scrolling rows keep their place when the page refreshes ---------- */
// any sideways-scrolling strip on any page (bank tabs, metal chips, skill chips, regions...)
const isHScroll = el => { if (!(el instanceof Element) || el.scrollWidth <= el.clientWidth + 2) return false; const o = getComputedStyle(el).overflowX; return o === 'auto' || o === 'scroll'; };
const HSCROLL = new Set();
document.addEventListener('scroll', e => { const t = e.target; if (t instanceof Element && t.scrollLeft > 0 && t.closest('#view, #modal')) HSCROLL.add(t); }, true);
let TOUCH_ROW = false, TOUCH_T = 0;
document.addEventListener('touchstart', e => { for (let el = e.target; el && el.id !== 'view' && el !== document.body; el = el.parentElement) if (isHScroll(el)) { TOUCH_ROW = true; return; } }, { passive: true, capture: true });
document.addEventListener('touchend', () => { if (TOUCH_ROW) { TOUCH_ROW = false; TOUCH_T = Date.now(); setTimeout(() => render(), 450); } }, { passive: true, capture: true });
document.addEventListener('touchcancel', () => { TOUCH_ROW = false; }, { passive: true, capture: true });
const rowKey = (root, e) => {
  const c = e.className && typeof e.className === 'string' ? e.className : '', sel = c ? '.' + c.trim().split(/\s+/).map(x => CSS.escape(x)).join('.') : (e.parentElement?.className ? '.' + String(e.parentElement.className).trim().split(/\s+/).map(x => CSS.escape(x)).join('.') + ' > ' : '') + e.tagName.toLowerCase();
  let i = -1; try { i = [...root.querySelectorAll(sel)].indexOf(e); } catch (er) {} return sel + '#' + i;
};
const grabScroll = root => [...HSCROLL].filter(e => e.isConnected && root.contains(e) && e.scrollLeft > 0).map(e => [rowKey(root, e), e.scrollLeft]);
const putScroll = (root, keep) => { for (const [k, x] of keep) { const [sel, i] = [k.slice(0, k.lastIndexOf('#')), +k.slice(k.lastIndexOf('#') + 1)]; let el = null; try { el = root.querySelectorAll(sel)[i]; } catch (er) {} if (el) { el.scrollLeft = x; HSCROLL.add(el); } } };
render = (orig => function () {
  const v = document.getElementById('view'); if (!v) return orig.apply(this, arguments);
  // don't swap the page out from under a finger that's swiping a row
  if (!UI.force && (TOUCH_ROW || Date.now() - TOUCH_T < 400)) return;
  const keep = grabScroll(v), first = v.firstElementChild; const r = orig.apply(this, arguments);
  if (keep.length && v.firstElementChild !== first) putScroll(v, keep);
  return r;
})(render);
// some pages redraw just a part of themselves (the pinned station block, item windows): watch for that too
new MutationObserver(muts => {
  for (const m of muts) { if (m.type !== 'childList' || !m.removedNodes.length) continue; const host = m.target; const keep = host._hsKeep; if (keep?.length) { host._hsKeep = null; putScroll(host, keep); } }
}).observe(document.body, { childList: true, subtree: true });
// remember positions on the containers of any strip just before something else replaces them
document.addEventListener('scroll', e => { const t = e.target; if (!(t instanceof Element) || !t.scrollLeft) return; const host = t.parentElement?.parentElement || t.parentElement; if (host) host._hsKeep = grabScroll(host); }, true);

/* ---------- 3) destroy items you can't sell ---------- */
const canDestroy = id => have(id) > 0 && (isCarried(id) || ITEMS[id]?.untradeable) && !ITEMS[id]?.outfit && !ITEMS[id]?.costumeSet;
openItemModal = (orig => function (id, fromSlot) {
  orig.apply(this, arguments); if (fromSlot || !canDestroy(id)) return; const box = $('#modal .item-modal') || $('#modal'); if (!box) return;
  box.insertAdjacentHTML('beforeend', `<div class="row-btns destroy-row"><button class="btn danger-soft" data-act="destroy" data-id="${id}">🗑️ Destroy${have(id) > 1 ? ` all ${fmt(have(id))}` : ''}</button></div>`);
})(openItemModal);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="destroy"]'); if (!t) return; e.stopImmediatePropagation();
  const id = t.dataset.id; if (!canDestroy(id)) return;
  if (!t.dataset.sure) { t.dataset.sure = '1'; t.innerHTML = '⚠️ Tap again to destroy'; setTimeout(() => { if (t.isConnected) { delete t.dataset.sure; t.innerHTML = '🗑️ Destroy'; } }, 3000); return; }
  const n = have(id); if (S.locked) delete S.locked[id]; remove(id, n);
  if (S.carried && !Object.values(S.equip).includes(id)) S.carried = S.carried.filter(x => x !== id);
  toast(`🗑️ Destroyed ${n > 1 ? fmt(n) + ' × ' : ''}${ITEMS[id].name}.`, '', 3000); closeModal(); UI.force = true; render();
}, true);

/* ---------- 4) Rogue outfit: works by owning it, lives in the Costume room, no more duplicates ---------- */
const ROGUE_IDS = ROGUE.map(r => r[0]);
const rogueOwned = id => have(id) > 0 || (S.costume?.[id] || 0) > 0 || Object.values(S.equip).includes(id) || Object.values(S.cosmetic || {}).includes(id);
recalc = (orig => function () { const r = orig.apply(this, arguments); if (S && M) M.rogue = ROGUE_IDS.filter(rogueOwned).length; return r; })(recalc);
function tidyRogue() {
  const C = S.costume ||= {}; let extra = 0;
  for (const id of ROGUE_IDS) { const q = have(id); if (q <= 0) continue; const keep = rogueOwned(id) && !(C[id] > 0) && !Object.values(S.equip).includes(id) ? 1 : 0; if (keep) C[id] = 1; extra += q - keep; OUTFIT_MOVE = true; try { remove(id, q); } finally { OUTFIT_MOVE = false; } }
  return extra;
}
add = (orig => function (id, n = 1) {
  if (n > 0 && ROGUE_IDS.includes(id) && S?.bank && !OUTFIT_MOVE) {
    if (rogueOwned(id)) { const c = 2000 * (1 + lifeAsc()); gainCoins(c); if (!OFF) toast(`🦹 Duplicate ${ITEMS[id].name} traded for 🪙${fmt(c)}.`, '', 3000); return; }
    (S.costume ||= {})[id] = 1; recalc(); if (!OFF) toast(`🦹 ${ITEMS[id].name} is in your Costume room: it works just by owning it.`, 'rare', 4000); return;
  }
  return orig.apply(this, arguments);
})(add);
SOURCES && ROGUE_IDS.forEach(id => { (SOURCES[id] ||= []).push('Works just by owning it (kept in the Costume room): +15% thieving loot per piece, full set ×2 loot and +5% success'); });

/* ---------- 5) skilling-boss crates: at most about one per tap ---------- */
// crates come from your own taps; a single huge buffed tap used to roll hundreds at once
doYield = (orig => function (st, a, n) {
  const C = a?.crateDef; if (!C || !(n > 1)) return orig.apply(this, arguments);
  const p0 = C[1], lk = M.luck || 1; if (n * p0 * lk <= 1) return orig.apply(this, arguments);
  a.crateDef = [C[0], 0.9 / (n * lk)]; try { return orig.apply(this, arguments); } finally { a.crateDef = C; }
})(doYield);

function boot59() {
  boot58();
  const x = tidyRogue(); if (x > 0) { const c = Math.min(5e6, 2000 * (1 + lifeAsc()) * x); gainCoins(c); setTimeout(() => toast(`🦹 Tidied ${fmt(x)} spare Rogue pieces from your bank (traded for 🪙${fmt(c)}). The outfit now works just by owning it.`, 'rare', 7000), 2500); }
  recalc(); UI.force = true; render();
}
