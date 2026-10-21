'use strict';
/* =========================================================
   CLICKSCAPE v9.34/9.35 — drop tables & crafting quality sanity pass, drop-only gear made special:
   cheap low-tier tools drop more often than valuable weapons, and quality can lift an item
   up to the next tier's level but never past it
   ========================================================= */

/* ---------- tool drops follow their value ---------- */
// craftable tools: cheap ones are more common, and never rarer than a pricier non-tool drop of the same monster.
// drop-only tools (Wyrm, crystal, infernal...) are special: twice as rare as before.
const MADE = new Set(); for (const a of Object.values(ACTIONS)) for (const id in (a.out || {})) MADE.add(id);
const SHOPPED = new Set(); for (const L of Object.values(SHOP)) for (const e of L) SHOPPED.add(e?.id || e?.[0]);
(function () {
  for (const m of MONSTERS) for (const d of (m.drops || [])) {
    const it = ITEMS[d[0]]; if (!it || it.cat !== 'tool' || !it.mult || d[1] >= 1) continue;
    if (!MADE.has(d[0]) && !SHOPPED.has(d[0])) { d[1] /= 2; continue; }
    let want = Math.min(1 / 40, 90 / Math.max(1, it.value || 1)) * (m.boss ? 2 : 1);
    for (const o of m.drops) { const oi = ITEMS[o[0]]; if (oi && oi.cat !== 'tool' && (oi.value || 0) > (it.value || 0) && o[1] < 1) want = Math.max(want, Math.min(1 / 40, o[1] * 1.25)); }
    if (want > d[1]) d[1] = want;
  }
})();

/* ---------- drop-only gear is special ---------- */
// gear nobody can craft can't roll crafting quality, so instead it can DROP with quality,
// and drop-only weapons carry a signature strike
const DROP_ONLY = new Set(Object.keys(ITEMS).filter(id => !id.includes('__q') && qCapable(id) && !MADE.has(id) && !SHOPPED.has(id)));
const isDropOnly = id => DROP_ONLY.has(qBase(id));
const DROP_Q = [0, 0.06, 0.015, 0.003, 0.0005];
const DSIG = { melee: ['Rend', 0.12, 0.6, 'strike again'], ranged: ['Volley', 0.15, 0.5, 'loose a second shot'], magic: ['Surge', 0.10, 0.8, 'cast again'] };
const sigOf = id => { const it = ITEMS[id]; if (!it || it.slot !== 'weapon' || !isDropOnly(id)) return null; return DSIG[it.wclass || 'melee'] || DSIG.melee; };
let IN_DROP = 0, IN_RARE = false;
const dropCtx = fn => (orig => function () { IN_DROP++; try { return orig.apply(this, arguments); } finally { IN_DROP--; } })(fn);
killMonster = dropCtx(killMonster);
if (typeof chestModal === 'function') chestModal = dropCtx(chestModal);
if (typeof rollCasket === 'function') rollCasket = dropCtx(rollCasket);
openItem = dropCtx(openItem);
function maybeQ(id, q) {
  if (q !== 1 || !DROP_ONLY.has(id)) return id;
  const k = Math.min(2, Math.sqrt(M.luck || 1)); const t = rollQ(DROP_Q.map(p => p * k)); if (!t) return id;
  const qid = qItem(id, t), Q = QUAL[t];
  if (!OFF) setTimeout(() => { if (t >= 3 && typeof fanLegend === 'function') fanLegend({ kind: `${t >= 4 ? '🔶 LEGENDARY' : '🟣 MASTERWORK'} DROP`, icon: itemIcon(qid), name: ITEMS[qid].name, sub: `Dropped with quality · stats ×${Q.k}` }); else if (typeof fanBanner === 'function') fanBanner(itemIcon(qid), `${Q.n} drop!`, `${ITEMS[qid].name} · stats ×${Q.k}`); }, 400);
  else OFFLOG.push(`◆ ${ITEMS[qid].name} dropped with ${Q.n} quality!`);
  return qid;
}
rareGet = (orig => function (id, q, why) { if (!IN_DROP) return orig.apply(this, arguments); IN_RARE = true; try { return orig(maybeQ(id, q), q, why); } finally { IN_RARE = false; } })(rareGet);
add = (orig => function (id, n = 1) {
  if (IN_DROP && !IN_RARE && n === 1 && DROP_ONLY.has(id)) { const qid = maybeQ(id, 1); if (qid !== id) { IN_RARE = true; try { return orig(qid, 1); } finally { IN_RARE = false; } } }
  return orig.apply(this, arguments);
})(add);
// signature strike: idle and active, never chains
let DSIG_ON = false;
playerAttack = (orig => function (tap, mult = 1, acc = 1, noAmmo) {
  const m0 = S.combat.mon; let d = orig.apply(this, arguments);
  const sg = !DSIG_ON && sigOf(S.equip.weapon);
  if (sg && S.combat.mhp > 0 && S.combat.mon === m0 && Math.random() < sg[1]) {
    DSIG_ON = true; try { d += orig(tap, mult * sg[2], acc, true) || 0; } finally { DSIG_ON = false; }
    if (!OFF) try { floaterOn('#mstage', `${sg[0]}!`, 'good'); } catch (e) {}
  }
  return d;
})(playerAttack);
// the item window explains it
openItemModal = (orig => function (id) {
  orig.apply(this, arguments); if (!isDropOnly(id)) return; const box = $('#modal .item-modal'); if (!box) return;
  const p = [...box.querySelectorAll('p')].find(e => /Plain quality/.test(e.textContent)); if (p) p.textContent = '◇ Plain quality. This can\'t be crafted, but it can drop as Fine, Superior, Masterwork or Legendary.';
  const sg = sigOf(id); box.insertAdjacentHTML('beforeend', `<p class="small sig-line">🏅 <b>Drop-only</b>${sg ? ` · Signature <b>${sg[0]}</b>: ${Math.round(sg[1] * 100)}% chance to ${sg[3]} for ${Math.round(sg[2] * 100)}% damage` : ' · can drop with quality'}</p>`);
})(openItemModal);

/* ---------- crafting quality: a tier's best never beats the next tier ---------- */
// metal tiers are ~20-25% apart, so Fine/Superior/Masterwork/Legendary are now +5/10/15/20%
// (a Legendary Ancient scimitar matches a plain Volcanic one; it no longer beats a Wyrm scimitar)
[null, 1.05, 1.10, 1.15, 1.20].forEach((k, t) => { if (k && QUAL[t]) QUAL[t].k = k; });
function requalify() {
  for (const id in ITEMS) { const it = ITEMS[id]; if (!it.quality || !it.base || !ITEMS[it.base]) continue; const b = ITEMS[it.base], Q = QUAL[it.quality]; for (const k of Q_STATS) if (typeof b[k] === 'number' && b[k] > 0) it[k] = Math.round(b[k] * Q.k * 10) / 10; }
}
requalify();
load = (orig => function () { const r = orig.apply(this, arguments); try { requalify(); } catch (e) {} return r; })(load);
// the item window explains the new rule
openItemModal = (orig => function (id) {
  orig.apply(this, arguments); if (!ITEMS[id]?.quality) return;
  $('#modal .item-modal')?.insertAdjacentHTML('beforeend', '<p class="small muted">Quality lifts an item close to the next metal tier, but never past it.</p>');
})(openItemModal);

function boot58() { boot57(); requalify(); recalc(); UI.force = true; render(); }
boot58();
