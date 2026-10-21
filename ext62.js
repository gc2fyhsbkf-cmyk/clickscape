'use strict';
/* =========================================================
   CLICKSCAPE v9.41 — fixes: menu dots only for something new, banner no longer stuck at the top,
   clearer missing-materials notice, and "sell outclassed" covers quality tiers and tools
   ========================================================= */

/* ---------- menu dots: only when something new has happened since you last looked ---------- */
// a dot used to sit on Bank whenever any treasure map was in it, and on Combat whenever you had no
// bounty task, which in a long game is forever. Now each dot clears when you open that tab and only
// comes back when its reason changes (a new chest to open, a new upgrade you can afford...)
const NAV_SEEN = () => (S.lifetime.navSeen ||= {});
function navReasons() {
  const r = {};
  const relic = !freshAccount() && S.relic && RELIC_TIERS.some((n, i) => totalLevel() >= n && !S.relic.picks[i]);
  const plots = S.plots.some(p => plotReady(p)) && !fhN();
  if (S.omenOffer?.length || relic || plots) r.skills = [S.omenOffer?.length ? 'o' : '', relic ? 'r' + S.relic.picks.length : '', plots ? 'p' : ''].join('');
  if (S.slayer && !S.slayer.task && LV.slayer > 1) r.combat = 'slayer' + (S.lifetime.slayerDone || S.slayer.streak || 0);
  if ((S.runChests || []).length) r.combat = (r.combat || '') + 'c' + S.runChests.length;
  const up = UPGRADES.filter(u => !has(u.id) && upgUnlocked(u) && canAffordUpg(u)).map(u => u.id); if (up.length) r.upgrades = up.join();
  const ch = Object.keys(CLUE_TIERS).reduce((a, t) => a + have('casket_' + t), 0); if (ch) r.bank = 'c' + ch;
  return r;
}
navAlerts = function () {
  const r = navReasons(), seen = NAV_SEEN(), a = {};
  const cur = UI.view === 'skill' ? 'skills' : UI.view;
  for (const k in r) { if (k === cur) seen[k] = r[k]; if (seen[k] !== r[k]) a[k] = true; }
  return a;
};

/* ---------- the drop banner hides fully (it peeked out under the status bar) ---------- */
// (CSS)

/* ---------- ingredient counts turn red when you're short ---------- */
liveExtra = (orig => function () {
  const r = orig.apply(this, arguments);
  document.querySelectorAll('#view .need').forEach(el => {
    const c = el.querySelector('[data-count]'); if (!c) return;
    if (el._q === undefined) { const tn = [...el.childNodes].find(n => n.nodeType === 3 && /\d/.test(n.textContent)); el._q = tn ? parseInt(tn.textContent.replace(/[^\d]/g, ''), 10) || 0 : 0; }
    const short = have(c.dataset.count) < el._q; if (el._s !== short) { el._s = short; el.classList.toggle('short', short); }
  });
  return r;
})(liveExtra);

/* ---------- sell outclassed: quality tiers and tools ---------- */
// 1) a plain item is outclassed by a better-quality copy of the same item, even one you can't wear yet
// 2) tools: anything weaker than the best tool you can use for that slot goes too
const TOOL_SLOTS = ['pickaxe', 'hatchet', 'rod', 'mattock'];
const ocSafe = (id, keep) => { const it = ITEMS[id]; return it && have(id) > 0 && !keep.has(id) && !S.locked[id] && !S.fav?.[id] && !it.cosmetic && !it.outfit && !it.perk; };
outclassed = (orig => function () {
  const L = new Set(orig());
  const keep = new Set([...Object.values(S.equip), ...(S.carried || []), ...Object.values(S.loadouts || {}).flatMap(l => Object.values(l?.equip || {}))]);
  (S.tribute?.items || []).forEach(([id]) => keep.add(id));
  for (const c of Object.values(S.lifetime?.contracts || {})) (c?.items || []).forEach(([id, q, d]) => { if (d < q) keep.add(id); });
  const owned = [...new Set([...Object.keys(S.bank).filter(id => have(id)), ...Object.values(S.equip).filter(Boolean)])];
  // quality: best tier owned for each base
  const topQ = {}; for (const id of owned) { if (!ITEMS[id]?.slot) continue; const b = qBase(id), t = qTier(id); if ((topQ[b] ?? -1) < t) topQ[b] = t; }
  for (const id of Object.keys(S.bank)) { if (!ITEMS[id]?.slot || !ocSafe(id, keep)) continue; if (qTier(id) < (topQ[qBase(id)] ?? -1)) L.add(id); }
  // tools
  const bestT = {}; for (const id of owned) { const it = ITEMS[id]; if (!it || it.cat !== 'tool' || !TOOL_SLOTS.includes(it.slot) || !it.mult || !reqOk(it.req)) continue; bestT[it.slot] = Math.max(bestT[it.slot] || 0, it.mult); }
  for (const id of Object.keys(S.bank)) {
    const it = ITEMS[id]; if (!it || it.cat !== 'tool' || !TOOL_SLOTS.includes(it.slot) || !it.mult || !ocSafe(id, keep)) continue;
    if (it.untradeable || it.bonus || /third_age|crystal|infernal/.test(id)) continue; // special tools stay
    if (bestT[it.slot] && it.mult < bestT[it.slot]) L.add(id);
  }
  return [...L];
})(outclassed);
// the review window gets a Tools section
ocModal = (orig => function () {
  orig.apply(this, arguments); const box = $('#modal .oc-modal'); if (!box) return;
  const rows = [...box.querySelectorAll('.oc-row')].filter(b => ITEMS[b.dataset.id]?.cat === 'tool'); if (!rows.length) return;
  rows.forEach(b => { const list = b.parentElement; b.remove(); if (list && !list.children.length) { list.previousElementSibling?.tagName === 'H3' && list.previousElementSibling.remove(); list.remove(); } });
  const btns = box.querySelector('.row-btns'); btns.insertAdjacentHTML('beforebegin', '<h3>🛠️ Tools</h3><div class="oc-list oc-tools"></div>');
  const tl = box.querySelector('.oc-tools'); rows.forEach(b => tl.appendChild(b));
})(ocModal);

function boot62() { boot61(); UI.force = true; render(); }
boot62();
