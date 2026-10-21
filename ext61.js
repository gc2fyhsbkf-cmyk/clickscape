'use strict';
/* =========================================================
   CLICKSCAPE v9.40 — drop table balance pass, "broadcast-worthy" drop fanfare with a setting,
   and upgrades consolidated: 200 per-station upgrades become 5 big Guild Mastery tiers
   ========================================================= */

/* ================= DROP TABLE BALANCE ================= */
// a full audit of every table; only the outliers are touched
const dropOf = (mid, iid) => MONSTER_BY_ID[mid]?.drops?.find(d => d[0] === iid);
(function () {
  // Giant Mole: mole skins were valued like a boss unique while dropping 1 in 3 (1.35M per kill)
  if (ITEMS.mole_skin) ITEMS.mole_skin.value = 3000;
  // Basilisk (lvl 61): the 25M jaw at 1/300 (now 1/3000) paid more per kill than monsters 200 levels higher
  const j = dropOf('basilisk', 'basilisk_jaw'); if (j) j[1] = 1 / 3000;
  // Lizardfolk Shaman (lvl 150): Wyrm warhammer 1/500 → 1/2500
  const w = dropOf('lizardman_shaman', 'dragon_warhammer'); if (w) w[1] = 1 / 2500;
  // Rending demon: Wyrm claws 1/600 → 1/1500
  const c = dropOf('ripper_demon', 'dragon_claws'); if (c) c[1] = 1 / 1500;
  // revenants: early wilderness monsters paid 10-60× more per kill than anything near their level
  for (const m of MONSTERS) if (!m.boss && m.area === 'wild' && m.drops?.some(d => d[0] === 'ancient_relic')) {
    const k = m.lvl < 50 ? 0.1 : m.lvl < 100 ? 0.4 : 0.5;
    for (const d of m.drops) if ((ITEMS[d[0]]?.value || 0) >= 5e5 && d[1] < 1) d[1] *= k;
  }
  // levels 20-110: monsters with no gear at all now drop one weapon and one armour piece of their tier
  const TIER = l => l < 45 ? ['steel', 'mithril'] : l < 80 ? ['mithril', 'adamant'] : ['adamant', 'rune'];
  const W = ['scimitar', 'dagger'], A = ['full_helm', 'platelegs', 'kiteshield', 'platebody'];
  let i = 0;
  for (const m of MONSTERS) {
    if (m.boss || m.raid || m.area === 'wild' || m.season || m.lvl < 20 || m.lvl > 110 || !(m.drops || []).length) continue;
    if (m.drops.some(d => { const it = ITEMS[d[0]]; return it?.slot && it.cat !== 'tool' && !it.cosmetic; })) continue;
    const [lo, hi] = TIER(m.lvl), wid = `${lo}_${W[i % 2]}`, aid = `${hi}_${A[i % 4]}`; i++;
    if (ITEMS[wid]) { m.drops.push([wid, 1 / 64, 1, 1]); (SOURCES[wid] ||= []).push(`${m.name} (1/64)`); }
    if (ITEMS[aid]) { m.drops.push([aid, 1 / 150, 1, 1]); (SOURCES[aid] ||= []).push(`${m.name} (1/150)`); }
  }
})();

/* ================= DROP FANFARE: BROADCAST-WORTHY ONLY ================= */
// like a game-wide drop broadcast: banners and fanfare are for drops that matter, everything else
// is a quiet "rare drop" message. The bar is set in Settings.
const FAN_LEVELS = [['notable', 'Notable drops'], ['all', 'Every rare drop'], ['10m', 'Worth 10M+'], ['100m', 'Worth 100M+']];
const fanMin = () => S.settings.fanMin || 'notable';
function dropChance(id) { const m = FAN_MON; if (!m) return null; const d = (m.drops || []).filter(x => x[0] === id); return d.length ? Math.min(...d.map(x => x[1])) : null; }
function broadcastWorthy(id) {
  const it = ITEMS[id]; if (!it) return false; const v = it.value || 0, ch = dropChance(id), mode = fanMin();
  if (mode === 'all') return true;
  if (mode === '10m') return v >= 1e7;
  if (mode === '100m') return v >= 1e8;
  // notable: big money, drop-only gear and looks that are genuinely rare, or anything 1-in-1000+
  if (v >= 1e6) return true;
  const special = (typeof DROP_ONLY !== 'undefined' && DROP_ONLY.has(id)) || it.cosmetic || it.outfit || /^pet:/.test(id);
  if (special && (ch === null || ch <= 1 / 250)) return true;
  if (ch !== null && ch <= 1 / 1000 && v >= 1e4) return true;
  return false;
}
dropTier = (orig => function (id, why) { const t = orig(id, why); return t && broadcastWorthy(id) ? t : null; })(dropTier);
viewSettings = (orig => function () {
  const f = fanMin();
  return orig().replace(/(<b>✨ Rare drop fanfare<\/b>[\s\S]*?<\/div>)(<\/div>)/, `$1<small class="muted">Celebrate:</small><div class="chips">${FAN_LEVELS.map(([k, n]) => `<button class="chip ${f === k ? 'on' : ''}" data-act="fanmin" data-id="${k}">${n}</button>`).join('')}</div><small class="muted">"Notable" = drops worth 1M+, rare drop-only gear and looks (1 in 250 or rarer), and anything 1 in 1,000 or rarer. Other rare drops show as a normal message.</small>$2`);
})(viewSettings);
VIEWS.settings = (orig => function () { return rebrand(orig()); })(viewSettings);
viewSig = (orig => function () { return UI.view === 'settings' ? orig() + fanMin() : orig(); })(viewSig);
document.addEventListener('click', e => { const t = e.target.closest('[data-act="fanmin"]'); if (!t) return; e.stopImmediatePropagation(); S.settings.fanMin = t.dataset.id; UI.force = true; render(); }, true);

/* ================= UPGRADES: FEWER, BIGGER ================= */
// 10 tap/worker upgrades per station (200 in all, re-bought every run) become 5 Guild Mastery tiers
// that each double tap power AND worker speed at every station. Same total power, 195 fewer clicks.
const GM = [[25, 2e3], [120, 6e4], [300, 1.5e6], [600, 3e7], [1000, 6e8]];
const OLD_UPG = new Set(UPGRADES.filter(u => /^[a-z]+_(tap|crew)\d$/.test(u.id) && ['tap', 'crew'].includes(u.eff?.type)).map(u => u.id));
for (let k = UPGRADES.length - 1; k >= 0; k--) if (OLD_UPG.has(UPGRADES[k].id)) UPGRADES.splice(k, 1);
GM.forEach(([tl, cost], i) => { const u = { id: `guild_mastery${i}`, name: `Guild Mastery ${['I', 'II', 'III', 'IV', 'V'][i]}`, icon: '🏅', desc: 'Tap power ×2 AND workers ×2 at every station', cost, req: { total: tl }, eff: { type: 'tapall', mult: 2, crew2: true } }; UPGRADES.push(u); UPGRADE_BY_ID[u.id] = u; });
recalc4 = (orig => function () { orig(); if (!S?.upgrades) return; let n = 0; for (let i = 0; i < GM.length; i++) if (S.upgrades[`guild_mastery${i}`]) n++; if (n) { const k = Math.pow(2, n); for (const st of STATION_ORDER) if (M.rate[st] !== undefined) M.rate[st] *= k; } })(recalc4);
// saves mid-run: owned station upgrades turn into the matching Guild Mastery tier
function convertOldUpgrades() {
  if (!S?.upgrades) return; const tiers = new Set(); let had = false;
  for (const id of Object.keys(S.upgrades)) { if (!OLD_UPG.has(id)) continue; had = true; tiers.add(+id.slice(-1)); delete S.upgrades[id]; }
  if (!had) return; for (const i of tiers) S.upgrades[`guild_mastery${i}`] = true; recalc();
  setTimeout(() => toast(`🏅 Station upgrades are now 5 Guild Mastery tiers (each ×2 tap power and ×2 workers everywhere). You've been given tier${tiers.size > 1 ? 's' : ''} ${[...tiers].sort().map(i => i + 1).join(', ')} for what you'd bought.`, 'rare', 9000), 2000);
}
// keep anything that kept old ids working (old saves loading old ids) harmless
for (const id of OLD_UPG) { if (!UPGRADE_BY_ID[id]) continue; UPGRADE_BY_ID[id] = { ...UPGRADE_BY_ID[id], eff: { type: 'none', mult: 1 } }; }

function boot61() { boot60(); convertOldUpgrades(); recalc(); UI.force = true; render(); }
