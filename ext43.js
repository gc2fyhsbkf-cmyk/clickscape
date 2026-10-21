'use strict';
/* =========================================================
   CLICKSCAPE v9.19 — Crafting quality: gear made at a station can roll
   Fine / Superior / Masterwork / Legendary with boosted stats. Reforge to try for better.
   ========================================================= */

const QUAL = [
  null,
  { n: 'Fine',       c: '#5ad85a', k: 1.10, p: 0.006,  v: 1.6 },
  { n: 'Superior',   c: '#4aa8ff', k: 1.25, p: 0.0012,  v: 3 },
  { n: 'Masterwork', c: '#c070ff', k: 1.50, p: 0.0002, v: 8 },
  { n: 'Legendary',  c: '#ffa020', k: 2.00, p: 0.00003, v: 25 },
];
const Q_STATS = ['atk', 'str', 'def', 'ratk', 'rstr', 'matk', 'mdmg', 'prayer'];
const COMBAT_SLOTS = new Set(['head', 'body', 'legs', 'shield', 'weapon', 'feet', 'hands', 'cape', 'neck', 'ring']);
const qBase = id => String(id).split('__q')[0];
const qTier = id => +(String(id).split('__q')[1] || 0);
const qCapable = id => { const it = ITEMS[qBase(id)]; return !!it && COMBAT_SLOTS.has(it.slot) && !it.cosmetic && !it.outfit && it.cat !== 'tool' && Q_STATS.some(k => it[k] > 0); };
function qItem(base, t) {
  if (!t) return base;
  const id = `${base}__q${t}`; if (ITEMS[id]) return id;
  const b = ITEMS[base]; if (!b) return base;
  const Q = QUAL[t], it = { ...b, id, name: `${Q.n} ${b.name}`, quality: t, base, trim: Q.c, value: Math.round((b.value || 1) * Q.v), untradeable: true, rare: t >= 3 || b.rare };
  for (const k of Q_STATS) if (typeof b[k] === 'number' && b[k] > 0) it[k] = Math.round(b[k] * Q.k * 10) / 10;
  ITEMS[id] = it; ITEM_ORDER[id] = (ITEM_ORDER[base] || 0) + t / 10;
  return id;
}
// quality items come back to life on load (they're made on demand)
function ensureQuality() {
  const ids = new Set([...Object.keys(S.bank || {}), ...Object.values(S.equip || {}), ...Object.keys(S.costume || {}), ...(S.carried || []), ...(S.kitGear || []),
    ...Object.values(S.loadouts || {}).flatMap(l => Object.values(l?.equip || {})), ...Object.keys(S.locked || {}), ...Object.keys(S.fav || {})]);
  for (const id of ids) if (id && String(id).includes('__q')) qItem(qBase(id), qTier(id));
}
load = (orig => function () { const r = orig.apply(this, arguments); try { ensureQuality(); } catch (e) {} return r; })(load);

// rolling: better odds the further your level is above the item's, and with luck
function qOdds(base, sk, boost = 1) {
  const it = ITEMS[base], req = Math.max(1, ...Object.values(it.req || {}), 1), over = Math.max(0, (LV[sk] || 1) - req);
  const k = Math.min(1.5, 1 + over / 120) * ((it.value || 0) < 500 ? 0.5 : 1) * Math.sqrt(M.luck || 1) * boost;
  return QUAL.map(q => q ? Math.min(0.5, q.p * k) : 0);
}
function rollQ(odds) { let r = Math.random(); for (let t = 4; t >= 1; t--) { if (r < odds[t]) return t; r -= odds[t]; } return 0; }
const rr2 = x => Math.floor(x) + (Math.random() < x % 1 ? 1 : 0);
doYield = (orig => function (st, a, n, xpScale) {
  const before = {}; const outs = a?.out ? Object.keys(a.out).filter(qCapable) : [];
  for (const id of outs) before[id] = have(id);
  const r = orig.apply(this, arguments);
  for (const id of outs) {
    const made = have(id) - before[id]; if (made <= 0) continue;
    const odds = qOdds(id, STATIONS[st]?.skill), got = [];
    if (made <= 50) { for (let i = 0; i < made; i++) { const t = rollQ(odds); if (t) got[t] = (got[t] || 0) + 1; } }
    else for (let t = 1; t <= 4; t++) { const k = rr2(made * odds[t]); if (k) got[t] = k; }
    let best = 0;
    for (let t = 1; t <= 4; t++) if (got[t]) { const k = Math.min(got[t], have(id)); if (k <= 0) continue; remove(id, k); add(qItem(id, t), k); best = t; }
    if (best >= 2 && !OFF) {
      const qid = qItem(id, best), Q = QUAL[best];
      if (best >= 4 && typeof fanLegend === 'function') fanLegend({ kind: '🔶 LEGENDARY CRAFT 🔶', icon: itemIcon(qid), name: ITEMS[qid].name, sub: `Stats ×${Q.k} · made at the ${STATIONS[st].name}` });
      else if (typeof fanBanner === 'function') fanBanner(itemIcon(qid), `${Q.n} craft!`, `${ITEMS[qid].name} · stats ×${Q.k}`);
    }
  }
  return r;
})(doYield);

/* ---------- reforge ---------- */
const reforgeCost = id => Math.max(1000, Math.round((ITEMS[qBase(id)]?.value || 100) * 20 * (1 + qTier(id))));
function reforge(id) {
  const base = qBase(id), t0 = qTier(id);
  if (!qCapable(id) || t0 >= 4) return;
  const need = id === base ? 2 : 1; // the item itself plus one plain copy
  if (have(base) < need || (id !== base && !have(id))) return toast(`🔨 Reforging needs the item plus one plain ${ITEMS[base].name}.`, 'warn', 3500);
  const c = reforgeCost(id); if (S.coins < c) return toast(`🔨 Reforging costs 🪙${fmt(c)}.`, 'warn');
  const sk = Object.entries(STATION_ACTIONS).find(([, L]) => L.some(x => x.out?.[base]))?.[0];
  S.coins -= c; remove(base, 1); if (id !== base) remove(id, 1); else remove(base, 1);
  const t = Math.max(t0, rollQ(qOdds(base, STATIONS[sk]?.skill || 'smithing', 6)));
  const nid = qItem(base, t); add(nid, 1); recalc();
  if (t > t0) { if (t >= 4 && typeof fanLegend === 'function') fanLegend({ kind: '🔶 LEGENDARY REFORGE 🔶', icon: itemIcon(nid), name: ITEMS[nid].name, sub: `Stats ×${QUAL[t].k}` }); else fanBanner?.(itemIcon(nid), `Reforged: ${QUAL[t].n}!`, ITEMS[nid].name); }
  else toast(`🔨 The reforge holds at ${t ? QUAL[t].n : 'plain'} quality. (It never drops a tier.)`, '', 3500);
  closeModal(); openItemModal(nid);
}
openItemModal = (orig => function (id, fromSlot) {
  orig(id, fromSlot); if (!qCapable(id)) return;
  const box = $('#modal .item-modal') || $('#modal'); if (!box) return;
  const t = qTier(id), base = qBase(id), Q = QUAL[t];
  const line = t ? `<p class="small" style="color:${Q.c}">◆ ${Q.n} quality: stats ×${Q.k}</p>` : '<p class="small muted">◇ Plain quality. Crafting it can roll Fine, Superior, Masterwork or Legendary.</p>';
  const odds = qOdds(base, Object.entries(STATION_ACTIONS).find(([, L]) => L.some(x => x.out?.[base])) ? STATIONS[Object.entries(STATION_ACTIONS).find(([, L]) => L.some(x => x.out?.[base]))[0]].skill : 'smithing', 6);
  const ref = t < 4 && !fromSlot ? `<div class="reforge"><button class="btn ${have(base) >= (t ? 1 : 2) && S.coins >= reforgeCost(id) ? '' : 'poor'}" data-act="reforge" data-id="${id}">🔨 Reforge · 🪙${fmt(reforgeCost(id))} + 1 plain ${ITEMS[base].name}</button>
    <small class="muted">Rolls again with 6× odds (Legendary ${fmtD(odds[4] * 100)}%, Masterwork ${fmtD(odds[3] * 100)}%). Never drops a tier.</small></div>` : '';
  box.querySelector('h2, h3')?.insertAdjacentHTML('afterend', line);
  box.insertAdjacentHTML('beforeend', ref);
})(openItemModal);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t || t.dataset.act !== 'reforge') return;
  e.stopImmediatePropagation(); reforge(t.dataset.id);
}, true);
// quality shows on bank tiles as a coloured corner
bankTiles = (orig => function () { return orig().replace(/data-act="item" data-id="([a-z0-9_]+__q(\d))">/g, (m, id, t) => `${m}<span class="qdot" style="background:${QUAL[+t].c}"></span>`); })(bankTiles);
function boot43() { boot42(); ensureQuality(); UI.force = true; render(); }
