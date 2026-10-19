'use strict';
/* =========================================================
   CLICKSCAPE v9.0 — the prestige ladder
   Ascension (unlimited) → Transcendence (sigil target) → Apotheosis (shard target)
   Sigils are an exponential currency that powers you up; caps keep rising (slower
   past 10 ascensions / 10 Transcendences) so huge counts never break the curve.
   Automation (auto-ascend, echo engine, foreman, quartermaster, auto-transcend)
   is unlocked through the tiers, and so are the Trading Post, academy & auto-supply.
   ========================================================= */

/* ---------- tunables (set by the pacing bot) ---------- */
const SIG = { base: 6, exp: 0.3, powDiv: 1000, powE: { prod: 0.8, xp: 0.77, cxp: 0.8 }, essDiv: 5 };
const TPOW = { prod: 2.5, xp: 1.9, cxp: 2.5 };   // per Transcendence
const APOW = { prod: 50, xp: 20, cxp: 50 };       // per Apotheosis
const TRANS_T = { base: 4e4, growth: 40 };        // sigils needed to transcend
const APO_T = { base: 25, growth: 5 };            // shards earned (this Apotheosis) needed
// neutralise v8 depth power: v9 power comes from sigils, Transcendences & Apotheoses
for (const o of [PW, PWT, PWT2]) for (const k of ['prod', 'xp', 'cxp', 'money']) o[k] = 1;

/* ================= LEVELS: caps that climb forever ================= */
{ let pts = 0; for (let l = 1; l < 2000; l++) { pts += Math.floor(l + 300 * Math.pow(2, l / 7)); if (l + 1 >= XP_TABLE.length) XP_TABLE[l + 1] = Math.floor(pts / 4); } }
const apoCount = () => S?.apo?.count || 0;
const capAsc = a => Math.round(90 * Math.log10(1 + a / 2.5)); // +13 for the first, ~+63 by 10, ~+145 by 100, ~+500 by a million
const capTrans = t => t <= 10 ? 30 * t : Math.round(300 + 150 * Math.log10(t / 10));
capBonus = function () {
  const a = S?.asc?.count || 0, t = tcount(), p = S?.trans?.perks?.caps || 0;
  return Math.min(1999 - 120, capAsc(a) + capTrans(t) + 5 * p + 60 * apoCount() + 60 * (S?.apo?.perks?.heavens || 0));
};
ascReqCalc = function () {
  const n = SKILL_ORDER.length, d = Math.min(30, (S.asc?.count || 0) + 10 * tcount());
  const avgCap = SKILL_ORDER.reduce((a, k) => a + (MAX_LVL[k] || 99), 0) / n, pan = S?.trans?.perks?.pantheon || 0;
  return Math.round(n * Math.min((d ? 60 + 30 * d : 30) * (1 - 0.1 * pan), avgCap - 12 - 4 * pan));
};

/* ================= SIGILS: the ascension currency ================= */
const sigils = () => S.asc.points || 0;
function sigilGain() {
  const xr = S.stats.xpRun || 0, ap = S.apo?.perks || {};
  const g = SIG.base * Math.pow(Math.max(1, xr / 1e6), SIG.exp) * (1 + 0.1 * (S.asc.count || 0)) * Math.pow(3, ap.sigil || 0) * (1 + (typeof offerBonus === 'function' ? offerBonus() : 0)) * (1 + 0.15 * (typeof bountiesDone === 'function' ? bountiesDone() : 0));
  return Math.floor(g);
}
const sigilPow = k => Math.pow(1 + sigils() / SIG.powDiv, SIG.powE[k]);
function tierPow(k) {
  const ap = S.apo?.perks || {};
  return sigilPow(k) * Math.pow(TPOW[k], tcount()) * Math.pow(APOW[k], apoCount()) * Math.pow(3, ap.omni || 0);
}
recalc4 = (orig => function () {
  orig(); if (!S?.asc) return;
  const pp = tierPow('prod');
  for (const st of STATION_ORDER) { M.rate[st] *= pp; M.tap[st] *= pp; }
  M.xp *= tierPow('xp'); M.cxp *= tierPow('cxp'); M.depthPow = pp;
  M.rate.harbour = 0; M.tap.harbour = 0;
})(recalc4);
// sigils replace the ascension gain; essence keeps the gentle log curve so perks stay meaningful
ascend = (orig => function () {
  const old = S, n = S.asc.count, before = sigils(), g = sigilGain(), t0 = S.stats.runStart || S.lifetime.runStart || now();
  orig();
  if (S === old || S.asc.count === n) return;
  S.asc.points = before + g; S.apo = old.apo; S.auto = old.auto;
  { const eg = S.asc.essence - (old.asc.essence || 0); if (eg > 0) S.asc.essence = (old.asc.essence || 0) + Math.max(1, Math.floor(eg / SIG.essDiv)); }
  const L = S.lifetime; L.ascs = (L.ascs || 0) + 1;
  const secs = Math.max(30, (now() - t0) / 1000);
  const E = S.engine ||= {}; if (!E.best || g / secs > E.best) E.best = g / secs; E.lastGain = g;
  S.stats.runStart = now(); recalc();
})(ascend);

/* ================= ECHO ENGINE: passive sigils ================= */
const engineLvl = () => S.trans?.perks?.engine || 0;
const engineRate = () => { const l = engineLvl(); if (!l || !S.engine?.best) return 0; return S.engine.best * 0.02 * Math.pow(3, l - 1) * Math.pow(10, S.apo?.perks?.engine || 0); };
let engAcc = 0, autoT = 0;
tickCore = (orig => function (dt) {
  orig(dt);
  const r = engineRate(); if (r > 0) { engAcc += r * dt; if (engAcc >= 1) { const w = Math.floor(engAcc); S.asc.points = sigils() + w; engAcc -= w; S.engine.made = (S.engine.made || 0) + w; } }
  autoT += dt; if (autoT >= 5) { autoT = 0; automationTick(); }
  const se = S.apo?.perks?.shardengine || 0; if (se && S.trans?.lastGain) { S.trans.shAcc = (S.trans.shAcc || 0) + S.trans.lastGain * 0.002 * se * dt; if (S.trans.shAcc >= 1) { const w = Math.floor(S.trans.shAcc); S.trans.shards += w; S.trans.earned = (S.trans.earned || 0) + w; S.trans.shAcc -= w; } }
})(tickCore);

/* ================= AUTOMATION ================= */
function automationTick() {
  const tp = S.trans?.perks || {}, au = S.auto ||= {};
  const saving = totalLevel() >= 0.9 * ascReqTotal(); // save up for the tribute near the end of a run
  if (tp.foreman && au.hire !== false && !saving) { let g = 0; while (g++ < 50) { let bs = null, bc = Infinity; for (const st of STATION_ORDER) { if (st === 'harbour' || LV[STATIONS[st].skill] < (STATION_ACTIONS[st][0]?.lvl || 1)) continue; const c = hireCost(st, 1); if (c < bc) { bc = c; bs = st; } } if (!bs || bc > S.coins * 0.3) break; hire(bs, 1); } }
  if (tp.quartermaster && au.upg !== false) { let g = 0; while (g++ < 30) { const u = UPGRADES.filter(u => !has(u.id) && upgUnlocked(u) && canAffordUpg(u)).sort((a, b) => a.cost - b.cost)[0]; if (!u || u.cost > S.coins * 0.5) break; buyUpgrade(u.id); } }
  if (tp.autoasc && au.asc !== false && !OFF_BLOCK() && totalLevel() >= ascReqTotal() && sigilGain() >= 1) {
    let ok = typeof tributeOk !== 'function' || tributeOk();
    if (!ok && S.tribute && typeof tributeCoins === 'function') { // missing materials: pay triple coins instead
      const cc = tributeCoins() * (S.tribute.offer || 1);
      if (S.coins >= 3 * cc) { S.coins -= 2 * cc; for (const [id, q] of S.tribute.items) { const m = q - tribHave(id); if (m > 0) add(id, m); } ok = tributeOk(); }
    }
    if (ok) { ascend(); closeModal(); if (!OFF) toast(`🌀 Auto-ascended (${fmt(S.asc.count)})`, 'rare', 2500); }
  }
  if (S.apo?.perks?.autotrans && au.trans !== false && sigils() >= transTarget()) transcend2(true);
}
const OFF_BLOCK = () => !!S.chal?.id && !S.chal.failed; // never auto-ascend mid-challenge

/* ================= UNLOCKS THROUGH THE TIERS ================= */
const lifeAsc = () => (S.lifetime.ascs || 0);
const UNLOCKS = { ge: 1, academy: 1 };
const unlocked = k => k === 'autosupply' ? !!(S.trans?.perks?.supply || apoCount()) : (tcount() > 0 || apoCount() > 0 || lifeAsc() >= UNLOCKS[k]);
go = (orig => function (v, ...r) {
  const k = v === 'ge' ? 'ge' : v === 'academy' ? 'academy' : null;
  if (k && !unlocked(k)) return toast(`🔒 ${k === 'ge' ? 'The Trading Post' : 'The Combat academy'} opens after ${UNLOCKS[k]} ascension${UNLOCKS[k] > 1 ? 's' : ''}.`, 'warn', 4000);
  return orig(v, ...r);
})(go);
openItemModal = (orig => function (id, fromSlot) { orig(id, fromSlot); if (!unlocked('ge')) document.querySelectorAll('#modal [data-act="ge-x"]').forEach(b => b.remove()); })(openItemModal);
autoSupplyTick = (orig => function () { if (unlocked('autosupply')) orig(); })(autoSupplyTick);
academyTick = (orig => function (dt) { if (unlocked('academy')) orig(dt); })(academyTick);
viewSkill = (orig => function () { const h = orig(); return unlocked('autosupply') ? h : h.replace(/<div class="panel autosup[\s\S]*?<\/button><\/div>/, `<div class="panel small muted">🔒 Auto-supply is a Pantheon perk (unlocked with divine shards after your first Transcendence).</div>`); })(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);

/* ---------- tribute & offerings scale with what this run earned ---------- */
tributeCoinsCalc = function () { return Math.max(750000, Math.round(0.1 * (S.stats.earned || 0))); };
transCostCalc = function () { return Math.max(5e6, Math.round(0.5 * (S.stats.earned || 0))); };

/* ================= TRANSCENDENCE (eternity) ================= */
const transTarget = () => Math.round(TRANS_T.base * Math.pow(TRANS_T.growth, tcount()) / Math.pow(2, S.apo?.perks?.heavens || 0));
const shardGain = () => { const p = sigils(), tg = transTarget(); if (p < tg) return 0; return Math.floor(5 * Math.pow(p / tg, 0.4) * (1 + 0.25 * tcount()) * Math.pow(2, S.apo?.perks?.sigil || 0)); };
// new Pantheon perks: automation & upgrades for unlocked systems
[{ id: 'supply', icon: '🛒', name: 'Supply line', max: 1, cost: () => 2, desc: () => 'Unlocks auto-supply: skills top up cheap basic ingredients (never herbs or crops)', keep: true },
 { id: 'autoasc', icon: '🔁', name: 'Auto-ascend', max: 1, cost: () => 2, desc: () => 'Ascends for you whenever the requirement is met (pays triple coins if tribute materials are missing)', keep: true },
 { id: 'engine', icon: '⚙️', name: 'Echo engine', max: 6, cost: l => 2 + 2 * l, desc: l => `Passively makes sigils: ${fmtD(2 * Math.pow(3, l - 1))}% of your best sigils-per-second run`, keep: true },
 { id: 'foreman', icon: '👷', name: 'Foreman', max: 1, cost: () => 1, desc: () => 'Automatically hires workers (up to 30% of your coins at a time)', keep: true },
 { id: 'quartermaster', icon: '📦', name: 'Quartermaster', max: 1, cost: () => 2, desc: () => 'Automatically buys upgrades', keep: true },
 { id: 'charter', icon: '🎓', name: 'Academy charter', max: 5, cost: l => 1 + l, desc: l => `Academy trainers give ${1 + l}× XP` },
 { id: 'licence', icon: '📈', name: 'Trading licence', max: 2, cost: l => 2 + l, desc: l => `Trading Post markets are ${l === 1 ? '2' : '4'}× deeper before prices drop` },
].forEach(p => { if (!TRANS_PERKS.some(x => x.id === p.id)) TRANS_PERKS.push(p); });
mktDepthCoins = (orig => function () { return orig() * [1, 2, 4][S.trans?.perks?.licence || 0]; })(mktDepthCoins);
function transcend2(auto) {
  const g = shardGain(); if (!g) { if (!auto) toast(`You need ${fmt(transTarget())} sigils to transcend.`, 'warn'); return; }
  if (S.coins < transCost()) { if (!auto) { closeModal(); toast(`✴️ Transcending needs an offering of 🪙${fmt(transCost())}.`, 'warn', 6000); } return; }
  const old = S, T = old.trans || { count: 0, shards: 0, perks: {} };
  T.count++; T.shards += g; T.earned = (T.earned || 0) + g; T.lastGain = g; T.best = Math.max(T.best || 0, g);
  const keepPerks = {}; const mem = [0, 0.25, 0.5, 1][T.perks.memory || 0];
  for (const k in old.asc.perks || {}) keepPerks[k] = Math.floor(old.asc.perks[k] * mem);
  const keep = { museum: old.museum, pets: old.pets, asc: { points: 0, count: 0, essence: 0, perks: keepPerks }, lifetime: old.lifetime, settings: old.settings, clog: old.clog, ach: old.ach, ge: old.ge, loadouts: old.loadouts, cosmetic: old.cosmetic, locked: old.locked };
  S = newState(keep);
  S.trans = T; S.apo = old.apo; S.auto = old.auto; S.autosell = old.autosell; S.sboost = old.sboost || {}; S.quests = {}; S.diary = {}; S.engine = { best: (old.engine?.best || 0) * 0.02 };
  for (const id in old.bank) if (SEASON_KEEP.has(id)) add(id, old.bank[id]);
  if (T.perks.estate) { S.house = old.house || {}; S.guild = old.guild || 0; S.academy = { t: {}, grounds: old.academy?.grounds || 0, on: true }; }
  else { S.house = {}; S.guild = 0; S.academy = { t: {}, grounds: 0, on: true }; }
  S.coins = [25, 1e6, 2e7, 5e8][T.perks.midas || 0];
  S.unlocks = {}; S.raids = {}; S.well = {}; S.clues = { active: null, done: old.clues?.done || {} }; S.ship = old.ship; S.stats.runStart = now();
  ensureTargets(); applyCaps(); refreshLevels(); recalc(); save();
  if (auto) { if (!OFF) toast(`✴️ Auto-transcended (+${fmt(g)} shards)`, 'rare', 3000); return; }
  closeModal(); go('transcend'); burst(); SFX.play('pet');
  openModal(`<div class="item-modal"><h2>✴️ Transcendence ${fmt(T.count)}!</h2><p>Everything returns to dust… except you. You gain <b class="y">${fmt(g)}</b> divine shards (${fmt(T.shards)} to spend).</p><p class="small">Next Transcendence needs <b>${fmt(transTarget())}</b> sigils. Pushing past the target earns more shards.</p><button class="btn big" data-act="close">Begin again</button></div>`);
}
transcend = function () { transcend2(false); };
viewTranscend = function () {
  const T = S.trans || { count: 0, shards: 0, perks: {} }, p = sigils(), tg = transTarget(), ok = p >= tg, pct = Math.min(100, 100 * Math.log10(1 + p) / Math.log10(1 + tg));
  return subHead('✴️ Transcendence', 'ascension') + `<div class="panel glow"><p>Transcending resets <b>everything</b>: levels, items, coins, ascensions, sigils, essence, house, quests and diaries. You keep pets, the collection log, achievements, the museum, your ship and the Pantheon.</p>
      <div class="stats"><div>Transcendences</div><b>${fmt(T.count)}</b><div>Divine shards</div><b class="y">${fmt(T.shards)}</b><div>Sigils</div><b>${fmt(p)} / ${fmt(tg)}</b><div>Next level caps</div><b>+${capTrans(T.count + 1) - capTrans(T.count)}</b></div>
      <div class="voy-bar"><div class="voy-fill" style="width:${pct}%"></div></div>
      <button class="btn big ${ok ? 'danger' : 'disabled'}" data-act="trans2">${ok ? `Transcend for ${fmt(shardGain())} shards…` : `Needs ${fmt(tg)} sigils`}</button>
      <p class="small muted">Shards grow with how far past the target you push (×2 sigils ≈ +32% shards).</p></div>
    <div class="panel"><h3>✴️ The Pantheon <small class="muted">· kept through Transcendence</small></h3>
      ${TRANS_PERKS.map(pk => { const l = T.perks[pk.id] || 0, max = l >= pk.max; return `<div class="upg ${l ? 'got' : ''}"><div class="upg-icon">${pk.icon}</div><div class="upg-main"><b>${pk.name} ${l}/${pk.max}</b><small>${pk.desc(Math.max(1, l))}</small></div>
        ${max ? '<span class="y">MAX</span>' : `<button class="btn ${T.shards < pk.cost(l) ? 'poor' : ''}" data-act="tperk" data-id="${pk.id}">${pk.cost(l)} ✴️</button>`}</div>`; }).join('')}</div>
    ${apoPanel()}`;
};
VIEWS.transcend = (orig => function () { return rebrand(orig()); })(viewTranscend);

/* ================= APOTHEOSIS (third tier) ================= */
const apoTarget = () => Math.round(APO_T.base * Math.pow(APO_T.growth, apoCount()));
const divGain = () => { const e = S.trans?.earned || 0, tg = apoTarget(); if (e < tg) return 0; return Math.floor(2 * Math.pow(e / tg, 0.4) * (1 + 0.3 * apoCount())); };
const APO_PERKS = [
  { id: 'omni', icon: '☀️', name: 'Omnipotence', max: 20, cost: l => 1 + l, desc: l => `All production & XP ×${fmt(Math.pow(3, l))}` },
  { id: 'engine', icon: '⚙️', name: 'Eternal engine', max: 10, cost: l => 1 + l, desc: l => `Echo engine ×${fmt(Math.pow(10, l))}` },
  { id: 'sigil', icon: '🔆', name: 'Radiance', max: 10, cost: l => 1 + l, desc: l => `Sigil gains ×${fmt(Math.pow(3, l))}, shard gains ×${fmt(Math.pow(2, l))}` },
  { id: 'heavens', icon: '🌌', name: 'Open heavens', max: 5, cost: l => 2 + 2 * l, desc: l => `Level caps +${60 * l}, Transcendence target ÷${Math.pow(2, l)}` },
  { id: 'autotrans', icon: '🔄', name: 'Auto-transcend', max: 1, cost: () => 3, desc: () => 'Transcends for you whenever the sigil target is met' },
  { id: 'shardengine', icon: '💠', name: 'Shard engine', max: 5, cost: l => 2 + l, desc: l => `Passively makes ${fmtD(0.2 * l)}% of your last Transcendence's shards every second` },
];
const apoPerk = id => S.apo?.perks?.[id] || 0;
function apotheosis() {
  const g = divGain(); if (!g) return toast(`You need ${fmt(apoTarget())} shards earned this Apotheosis.`, 'warn');
  const old = S, A = old.apo || { count: 0, div: 0, perks: {} };
  A.count++; A.div += g;
  const keepTP = {}; for (const pk of TRANS_PERKS) if (pk.keep && old.trans?.perks?.[pk.id]) keepTP[pk.id] = old.trans.perks[pk.id];
  const keep = { museum: old.museum, pets: old.pets, asc: { points: 0, count: 0, essence: 0, perks: {} }, lifetime: old.lifetime, settings: old.settings, clog: old.clog, ach: old.ach, ge: old.ge, loadouts: old.loadouts, cosmetic: old.cosmetic, locked: old.locked };
  S = newState(keep);
  S.apo = A; S.trans = { count: 0, shards: 0, earned: 0, perks: keepTP }; S.auto = old.auto; S.autosell = old.autosell; S.ship = old.ship; S.engine = {}; S.academy = { t: {}, grounds: 0, on: true }; S.stats.runStart = now();
  for (const id in old.bank) if (SEASON_KEEP.has(id)) add(id, old.bank[id]);
  ensureTargets(); applyCaps(); refreshLevels(); recalc(); save();
  closeModal(); go('apotheosis'); burst(); SFX.play('pet');
  openModal(`<div class="item-modal"><h2>☀️ Apotheosis ${A.count}!</h2><p>You rise above the Pantheon itself. You gain <b class="y">${fmt(g)}</b> divinity.</p><p class="small">Automation perks are kept. Everything else begins again, far stronger.</p><button class="btn big" data-act="close">Ascend to godhood</button></div>`);
}
function apoPanel() {
  const e = S.trans?.earned || 0, tg = apoTarget(), A = S.apo || { count: 0, div: 0 };
  if (!tcount() && !apoCount()) return '';
  return `<div class="panel row-between"><div><b>☀️ Apotheosis ${A.count ? `· ${A.count}` : ''}</b><br><small class="muted">${e >= tg ? `Ready for ${fmt(divGain())} divinity!` : `Earn ${fmt(tg)} shards this Apotheosis (${fmt(e)} so far)`} · resets Transcendences</small></div><button class="btn" data-nav="apotheosis">Open</button></div>`;
}
function viewApotheosis() {
  const A = S.apo || { count: 0, div: 0, perks: {} }, e = S.trans?.earned || 0, tg = apoTarget(), ok = e >= tg;
  return subHead('☀️ Apotheosis', 'transcend') + `<div class="panel glow"><p>Apotheosis resets your <b>Transcendences, shards and Pantheon</b> (automation perks are kept) for divinity, the power of a god.</p>
    <div class="stats"><div>Apotheoses</div><b>${A.count}</b><div>Divinity</div><b class="y">${fmt(A.div)}</b><div>Shards earned</div><b>${fmt(e)} / ${fmt(tg)}</b><div>Power per Apotheosis</div><b>×${fmt(APOW.prod)}</b></div>
    <button class="btn big ${ok ? 'danger' : 'disabled'}" data-act="apo">${ok ? `Apotheosis for ${fmt(divGain())} divinity…` : `Needs ${fmt(tg)} shards earned`}</button></div>
    <div class="panel"><h3>☀️ Divine perks <small class="muted">· permanent forever</small></h3>${APO_PERKS.map(pk => { const l = A.perks?.[pk.id] || 0, max = l >= pk.max; return `<div class="upg ${l ? 'got' : ''}"><div class="upg-icon">${pk.icon}</div><div class="upg-main"><b>${pk.name} ${l}/${pk.max}</b><small>${pk.desc(Math.max(1, l))}</small></div>
      ${max ? '<span class="y">MAX</span>' : `<button class="btn ${A.div < pk.cost(l) ? 'poor' : ''}" data-act="aperk" data-id="${pk.id}">${pk.cost(l)} ☀️</button>`}</div>`; }).join('')}</div>`;
}
VIEWS.apotheosis = () => rebrand(viewApotheosis());
if (typeof HUB_VIEWS !== 'undefined') HUB_VIEWS.push('apotheosis');

/* ================= ASCENSION PAGE: sigils, engine & automation ================= */
viewAscension = (orig => function () {
  const p = sigils(), tg = transTarget(), r = engineRate(), au = S.auto || {}, tp = S.trans?.perks || {};
  const toggles = [['autoasc', 'asc', '🔁 Auto-ascend'], ['foreman', 'hire', '👷 Auto-hire'], ['quartermaster', 'upg', '📦 Auto-upgrades']].filter(([k]) => tp[k]).map(([, k, n]) => `<button class="chip ${au[k] !== false ? 'on' : ''}" data-act="auto-tog" data-id="${k}">${n}</button>`).join('');
  if (apoPerk('autotrans')) { /* shown on the transcend page */ }
  const panel = `<div class="panel small sigil-panel"><div class="row-between"><b>🔆 ${fmt(p)} sigils</b><small>production ×${fmt(sigilPow('prod'))} · XP ×${fmt(sigilPow('xp'))}</small></div>
    <small>Next ascension: <b>+${fmt(sigilGain())}</b> sigils${r ? ` · ⚙️ engine +${fmtD(r)}/s (≈${fmtD(r / Math.max(1, S.engine.lastGain || 1))} ascensions/s)` : ''}</small>
    <div class="voy-bar"><div class="voy-fill" style="width:${Math.min(100, 100 * Math.log10(1 + p) / Math.log10(1 + tg))}%"></div></div><small class="muted">✴️ Transcendence at ${fmt(tg)} sigils · tier power ×${fmt(tierPow('prod') / sigilPow('prod'))}</small>
    ${toggles ? `<div class="chips">${toggles}</div>` : ''}</div>`;
  return orig().replace(/<div class="panel small depth-note">[\s\S]*?<\/div>/, '')
    .replace(/gain <b class="y">\+[^<]*<\/b> (runes|sigils) (&amp;|&) essence/, `gain <b class="y">+${fmt(sigilGain())}</b> sigils & <b class="y">+${fmt(Math.max(1, Math.floor(ascendGain() / SIG.essDiv)))}</b> essence`)
    .replace('raises level caps by 6 (Transcendence adds +60 more each time)', `raises level caps (next: +${capAsc((S.asc.count || 0) + 1) - capAsc(S.asc.count || 0)}; each one adds a little less, Transcendence adds lots more)`)
    .replace(/<div class="panel row-between"><div><b>✴️ Transcendence<\/b>[\s\S]*?<\/button><\/div>/, `<div class="panel row-between"><div><b>✴️ Transcendence</b><br><small class="muted">${p >= tg ? 'Ready! A deeper reset for divine shards.' : `At ${fmt(tg)} sigils (${fmt(p)} now)`}</small></div><button class="btn" data-nav="transcend">Open</button></div>`)
    .replace('<div class="ctabs asc-tabs">', panel + '<div class="ctabs asc-tabs">');
})(viewAscension);
VIEWS.ascension = (orig => function () { return rebrand(orig()); })(viewAscension);
viewSig = (orig => function () { return ['ascension', 'transcend', 'apotheosis'].includes(UI.view) ? orig() + '|' + Math.floor(Math.log10(1 + sigils()) * 20) + JSON.stringify(S.auto || {}) + (S.trans?.shards || 0) + (S.apo?.div || 0) : orig(); })(viewSig);

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act, d = t.dataset;
  if (!['trans2', 'trans2-yes', 'apo', 'apo-yes', 'aperk', 'auto-tog'].includes(a)) return;
  e.stopImmediatePropagation();
  if (a === 'trans2') openModal(`<h2>✴️ Transcend?</h2><p>This resets <b>everything</b>, including all ascensions, sigils, essence, house and quests, for <b class="y">${fmt(shardGain())}</b> divine shards.</p><button class="btn big danger" data-act="trans2-yes">Transcend</button><button class="btn" data-act="close">Not yet</button>`);
  else if (a === 'trans2-yes') { transcend2(false); return; }
  else if (a === 'apo') openModal(`<h2>☀️ Apotheosis?</h2><p>This resets your Transcendences, shards and Pantheon (automation perks are kept) for <b class="y">${fmt(divGain())}</b> divinity.</p><button class="btn big danger" data-act="apo-yes">Become a god</button><button class="btn" data-act="close">Not yet</button>`);
  else if (a === 'apo-yes') { apotheosis(); return; }
  else if (a === 'aperk') { const A = S.apo ||= { count: 0, div: 0, perks: {} }, pk = APO_PERKS.find(x => x.id === d.id), l = A.perks[d.id] || 0; if (l < pk.max && A.div >= pk.cost(l)) { A.div -= pk.cost(l); A.perks[d.id] = l + 1; applyCaps(); refreshLevels(); recalc(); toast(`${pk.icon} ${pk.name} → ${l + 1}`, 'rare'); } }
  else if (a === 'auto-tog') { const au = S.auto ||= {}; au[d.id] = au[d.id] === false; }
  UI.force = true; render(); liveUpdate();
}, true);


/* ================= v9 extras from playtesting ================= */
// no relic straight away on a brand-new account
relicNeed = (orig => function (i) { const n = orig(i); return i === 0 && !lifeAsc() && !tcount() && !apoCount() ? Math.max(n, 250) : n; })(relicNeed);

// smithing costs climb with your prestige; the very top gear also eats the previous tier's bars
const barScale = () => (1 + capAsc(S?.asc?.count || 0) / 30) * Math.pow(4, tcount()) * Math.pow(10, apoCount());
(function () {
  const ti = Object.fromEntries(ATIERS.map((T, i) => [T.id, i]));
  for (const a of STATION_ACTIONS.anvil) {
    const bar = Object.keys(a.inp || {}).find(k => k.endsWith('_bar')); if (!bar) continue;
    const me = METALS.find(m => bar === m.id + '_bar'); if (!me || me.lvl < 85) continue;
    a.base = { inp: { ...a.inp }, xp: a.xp, hp: a.hp, imbue: a.imbue || 0, val: ITEMS[Object.keys(a.out)[0]]?.value || 0 };
    const i = ti[me.id]; if (i >= 3 && ATIERS[i - 1]) a.base.inp[ATIERS[i - 1].id + '_bar'] = Math.ceil(a.inp[bar] * 0.5);
  }
})();
function applyBarScale() {
  const f = barScale();
  for (const a of STATION_ACTIONS.anvil) {
    if (!a.base) continue;
    for (const k in a.base.inp) a.inp[k] = Math.max(1, Math.round(a.base.inp[k] * f));
    a.xp = a.base.xp * f; a.hp = Math.round(a.base.hp * Math.sqrt(f)); if (a.base.imbue) a.imbue = Math.round(a.base.imbue * f);
    const it = ITEMS[Object.keys(a.out)[0]]; if (it && a.base.val) it.value = Math.round(a.base.val * f);
  }
}
recalc4 = (orig => function () { orig(); if (S?.asc) applyBarScale(); })(recalc4);

// auto-supply never buys herbs, crops or seeds
autoSupplyTick = (orig => function () {
  if (!S.autoSupply) return orig();
  const crop = id => ITEMS[id]?.kind === 'herb' || ITEMS[id]?.kind === 'seed' || CROPS.some(c => (c.cropItem || c.id) === id);
  const saved = {}; for (const st in S.autoSupply) { const a = ACTIONS[S.target[st]]; if (S.autoSupply[st] && a?.inp && Object.keys(a.inp).some(crop)) { saved[st] = true; S.autoSupply[st] = false; } }
  orig(); for (const st in saved) S.autoSupply[st] = true;
})(autoSupplyTick);

// farmhands: a direct way to speed Farming up
const fhN = () => S.farmhands || 0;
const fhCost = (k = 1) => { const n = fhN(); return Math.ceil(2500 * Math.pow(1.3, n) * (Math.pow(1.3, k) - 1) / 0.3); };
recalc4 = (orig => function () { orig(); if (S?.asc) M.grow *= Math.max(0.4, 1 - 0.01 * fhN()); })(recalc4);
harvest = (orig => function (i) {
  const p = S.plots[i]; if (!plotReady(p)) return 0;
  const c = CROP_BY_ID[p.c], xp0 = S.xp.farming, y = orig(i); if (!y || !fhN()) return y;
  const f = 0.1 * fhN(), ex = Math.floor(y * f); if (ex) add(c.cropItem || c.id, ex);
  const g = S.xp.farming - xp0; if (g > 0) S.xp.farming = Math.min(1e300, S.xp.farming + g * f);
  return y + ex;
})(harvest);
viewFarming = (orig => function () {
  const fm = farmMult(), n = fhN();
  const panel = `<div class="panel small"><div class="row-between"><div><b>🧑‍🌾 Farmhands: ${n}</b><br><small>+${n * 10}% crops & Farming XP · crops grow ${Math.round(100 - 100 * Math.max(0.4, 1 - 0.01 * n))}% faster</small><br><small class="muted">Your workforce also boosts harvests ×${fmtD(fm)} (more gathering workers = bigger farms)</small></div>
    <span><button class="btn ${S.coins < fhCost(1) ? 'poor' : ''}" data-act="farmhand" data-k="1">Hire<small>🪙${fmt(fhCost(1))}</small></button><button class="btn ${S.coins < fhCost(10) ? 'poor' : ''}" data-act="farmhand" data-k="10">×10<small>🪙${fmt(fhCost(10))}</small></button></span></div></div>`;
  return orig().replace('<div class="plots', panel + '<div class="plots');
})(viewFarming);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="farmhand"]'); if (!t) return;
  e.stopImmediatePropagation(); const k = +t.dataset.k, c = fhCost(k);
  if (S.coins < c) toast("You don't have enough coins.", 'warn'); else { S.coins -= c; S.farmhands = fhN() + k; recalc(); toast(`🧑‍🌾 Hired ${k} farmhand${k > 1 ? 's' : ''}.`); }
  UI.force = true; render(); liveUpdate();
}, true);
viewSig = (orig => function () { return UI.skill === 'farming' ? orig() + fhN() : orig(); })(viewSig);

/* ---------- boot ---------- */
(function () {
  // existing saves: count past ascensions so unlocks don't lock anyone out
  ach('apo_1', 'Godhood', 'Reach Apotheosis', '☀️', g => (g.S.apo?.count || 0) >= 1, 100);
  ach('sig_1m', 'Sigil hoard', 'Hold a million sigils', '🔆', g => (g.S.asc?.points || 0) >= 1e6, 25);
})();
function boot23() {
  boot22();
  S.lifetime.ascs ??= (S.asc?.count || 0) + 10 * tcount();
  S.stats.runStart ||= now();
  applyCaps(); refreshLevels(); recalc(); UI.force = true; render();
}
