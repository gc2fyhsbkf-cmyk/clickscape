'use strict';
/* =========================================================
   CLICKSCAPE v9.51 — late bosses no longer take hours, the food bag (fights eat from what you
   carry, refilled between kills), low-tier recipes give little XP once you're far above them,
   and high-tier metalwork is slower to make
   ========================================================= */

/* ================= 1) LATE BOSS HEALTH ================= */
// health grows with your level caps on top of its base, so the very top bosses took hours per kill
// (Primeval Forge ~3h). Base health is now capped by level: 1200 + 0.3 × level
for (const m of MONSTERS) {
  if (!m.boss || m.lvl < 1000) continue;
  const B = m.b0 || m, cap = Math.round(1200 + m.lvl * 0.3);
  if (B.hp > cap) { B.hp = cap; if (m.b0) m.hp = Math.round(cap * (m.scale || 1) * (m.scale || 1)); }
}

/* ================= 2) THE FOOD BAG ================= */
// fights eat only from your food bag. It refills itself from the bank between kills (like banking
// between trips), so a long fight has to be survived on one bag: gear and prayer matter again.
const BAG_BASE = 20;
const bagCap = () => BAG_BASE + (typeof estateLvl === 'function' ? 2 * estateLvl('larder') : 0);
const bag = () => (S.combat.bag ||= { id: null, n: 0 });
function bagFood() { const f = S.combat.food; if (f && ITEMS[f]?.heal) return f; return FOODS.find(id => have(id) > 0) || null; }
function refillBag() {
  const B = bag(), want = bagFood(); if (!want) return;
  if (B.id && B.id !== want && B.n > 0) { add(B.id, B.n); B.n = 0; }
  B.id = want; const k = Math.min(bagCap() - B.n, have(want)); if (k > 0) { remove(want, k); B.n += k; }
}
autoEat = function () {
  if (typeof activeChal === 'function' && activeChal() === 'glass') return false;
  const C = S.combat, B = bag(); if (!B.id || B.n <= 0 || !ITEMS[B.id]) return false;
  B.n--; C.hp = Math.min(maxHp(), C.hp + ITEMS[B.id].heal);
  if (!OFF) { try { floaterOn('#php', `+${ITEMS[B.id].heal} 🍖`, 'good'); SFX.play('eat'); } catch (e) {} }
  return true;
};
startFight = (orig => function () { refillBag(); return orig.apply(this, arguments); })(startFight);
killMonster = (orig => function () { const r = orig.apply(this, arguments); refillBag(); return r; })(killMonster);
// changing your chosen food swaps the bag over
document.addEventListener('click', e => { if (e.target.closest('[data-act="food"]')) setTimeout(() => { refillBag(); UI.force = true; render(); }, 0); }, true);
// fight maths: food = one bag, judged per kill
fightCalc = (orig => function (m, style) {
  const f = orig.apply(this, arguments); const B = bag(), id = B.id || bagFood();
  const heal = id ? ITEMS[id].heal * Math.min(bagCap(), (B.id === id ? B.n : 0) + have(id)) : 0;
  const hp = maxHp();
  f.food = heal; f.survive = f.net <= 0 ? Infinity : (hp * 0.5 + heal + hp * 0.5) / f.net; f.perKill = true;
  return f;
})(fightCalc);
riskOf = (orig => function (f) {
  if (!f?.perKill) return orig.apply(this, arguments);
  if (f.survive === Infinity) return ['safe', '🟢 Safe', 'You out-heal everything it does.'];
  const k = f.survive / (f.ttk + 1.2);
  if (k >= 3) return ['safe', '🟢 Safe', `One food bag covers each kill easily.`];
  if (k >= 1.2) return ['ok', '🟡 Steady', `Your food bag lasts about ${fmtD(k)} kills' worth.`];
  if (k >= 0.6) return ['risky', '🟠 Risky', `Your food bag may run out mid-kill.`];
  return ['deadly', '🔴 Deadly', f.food ? `You'd run out of food well before it dies.` : 'No food in your bag.'];
})(riskOf);
// the bag on the combat page
viewCombat = (orig => function () {
  const B = bag(), id = B.id || bagFood();
  const line = `<div class="bag-line">🎒 <b>Food bag</b> ${id ? `${itemIcon(id)} <b class="y">${B.n}</b>/${bagCap()} ${ITEMS[id].name} <small class="muted">(heals ${ITEMS[id].heal} · refills between kills · ${fmt(have(id))} in the bank)</small>` : '<span class="r">empty: cook some fish</span>'}</div>`;
  return orig().replace(/(<div class="fight-btns">)/, line + '$1');
})(viewCombat);
VIEWS.combat = (orig => function () { return rebrand(orig()); })(viewCombat);
viewSig = (orig => function () { return UI.view === 'combat' ? orig() + '|bag' + (S.combat.bag?.n || 0) + (S.combat.bag?.id || '') : orig(); })(viewSig);

/* ================= 3) PRODUCTION: LOW-TIER XP FALLOFF ================= */
// a recipe gives full XP up to 20 levels above its requirement, then falls off fast
// (Volcanic platebody, level 99, at level 180: about 29% XP; bronze at 180: 5%)
const xpFall = (L, lvl) => L <= lvl + 20 ? 1 : Math.max(0.05, Math.pow((lvl + 20) / L, 3));
doYield = (orig => function (st, a, n, xpScale = 1) {
  const sk = STATIONS[st]?.skill; if (!a || !sk || a.lvl == null) return orig.apply(this, arguments);
  return orig.call(this, st, a, n, (xpScale ?? 1) * xpFall(LV[sk] || 1, a.lvl));
})(doYield);
// the action list says when you're past a recipe
viewSkill = (orig => function () {
  const sk = UI.skill; return orig().replace(/(data-act="target" data-st="[a-z_]+" data-id="([a-z0-9_]+)">[\s\S]*?Lv \d+ · )([\d.,]+ xp)/g, (m, pre, id, xp) => { const a = ACTIONS[id]; const f = a ? xpFall(LV[sk] || 1, a.lvl) : 1; return f < 0.99 ? `${pre}${xp} <span class="xp-fall">×${Math.round(f * 100)}%</span>` : m; });
})(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);

/* ================= 4) HIGH-TIER METALWORK IS SLOWER ================= */
// above Volcanic, each metal tier takes much longer per item (bars ×1.3 per tier, anvil work ×1.5 per tier)
// but gives that much more XP per item, so XP per hour is the same while far fewer items come out
const METAL_TIERS = ['primal', 'void', 'ascended', 'exalted', 'divine', 'eternal', 'godforged', 'starmetal', 'voidsteel', 'primordial'];
for (const a of Object.values(ACTIONS)) {
  if (!['anvil', 'furnace'].includes(a.st) || a._slow) continue;
  const oid = Object.keys(a.out || {})[0] || ''; const k = METAL_TIERS.findIndex(m => oid.startsWith(m + '_')) + 1; if (!k) continue;
  const mult = Math.pow(a.st === 'anvil' ? 1.5 : 1.3, k); a.hp = Math.round(a.hp * mult); a.xp = Math.round(a.xp * mult); if (a.base) { a.base.hp = Math.round(a.base.hp * mult); a.base.xp = Math.round(a.base.xp * mult); } a._slow = k;
}

function boot72() { boot71(); if (typeof applyBossScale === 'function') applyBossScale(); refillBag(); recalc(); UI.force = true; render(); }
