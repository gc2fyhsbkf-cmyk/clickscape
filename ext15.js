'use strict';
/* =========================================================
   CLICKSCAPE v7.0 (part 2) — weekly trial, Echo raids, investments,
   commission board, costume room & favourites, collect all,
   statistics, run summary, icon pass
   ========================================================= */

/* ================= WEEKLY TRIAL ================= */
function weeklyTrial() {
  const wk = weekKey(), W = S.lifetime.weekly ||= {};
  if (W.week !== wk) {
    const r = seeded('trial' + wk), skills = SKILL_ORDER.filter(s => s !== 'hitpoints');
    const bosses = MONSTERS.filter(m => m.boss && !m.raid && !m.season && !m.transReq && !m.ascReq && m.area === 'bosses');
    const sk = skills[Math.floor(r() * skills.length)], b = bosses[Math.floor(r() * bosses.length)];
    Object.assign(W, { week: wk, start: null, done: null, goals: [{ type: 'lvl', key: sk, n: 80 }, { type: 'kill', key: b.id, n: 25 }, { type: 'total', n: 1200 }], relics: RELICS.map(t => t[Math.floor(r() * t.length)].id) });
  }
  return W;
}
function trialProg(g, W) {
  if (g.type === 'lvl') return [LV[g.key], g.n];
  if (g.type === 'kill') return [(S.kills[g.key] || 0) - (W.base?.[g.key] || 0), g.n];
  return [totalLevel(), g.n];
}
function trialText(g) { return g.type === 'lvl' ? `Reach ${SKILLS[g.key].icon} ${SKILLS[g.key].name} ${g.n}` : g.type === 'kill' ? `Kill ${g.n} × ${MONSTER_BY_ID[g.key]?.name}` : `Reach total level ${g.n}`; }
function trialCheck() {
  const W = weeklyTrial(); if (!W.start || W.done) return;
  if (W.goals.every(g => { const [a, n] = trialProg(g, W); return a >= n; })) {
    W.done = now(); const t = (W.done - W.start) / 1000; W.bestTime = Math.min(W.bestTime || Infinity, t);
    (S.trans ||= { count: 0, shards: 0, perks: {} }).shards += 1; add('mystery_box', 5);
    if (!have('trial_cape')) { add('trial_cape', 1); logItem('trial_cape', 1); }
    if (!OFF) { toast(`🏁 Weekly trial complete in ${fmtTime(t)}! +1 divine shard and 5 mystery boxes.`, 'pet', 8000); SFX.play('pet'); }
  }
}
cosmetic('trial_cape', 'Trial cape', 'cape', 'cape', '#2ad8a8', [0, 0, 6], { untradeable: true, trim: '#ffd84a' });
function trialPanel() {
  const W = weeklyTrial(), started = !!W.start;
  return `<div class="panel"><h3>🏁 Weekly trial <small class="muted">· new every Monday</small></h3>
    <p class="small">Start the clock, then finish all three goals. Reward: <b>1 divine shard</b>, 5 mystery boxes and the Trial cape. Featured relics this week: ${W.relics.map(id => relicDef(id)?.icon).join(' ')}</p>
    ${W.goals.map(g => { const [a, n] = trialProg(g, W), ok = started && a >= n; return `<div class="trib ${ok ? 'ok' : ''}">${ok ? '✔' : '○'} ${trialText(g)} ${started ? `<small>(${fmt(Math.min(a, n))}/${fmt(n)})</small>` : ''}</div>`; }).join('')}
    ${W.done ? `<p class="y">✔ Completed in ${fmtTime((W.done - W.start) / 1000)}${W.bestTime ? ` · best ${fmtTime(W.bestTime)}` : ''}</p>` : started ? `<p class="small">⏱️ ${fmtTime((now() - W.start) / 1000)} elapsed</p>` : '<button class="btn big" data-act="trial-start">Start the clock</button>'}</div>`;
}

/* ================= ECHO RAIDS ================= */
const ECHO_RAIDS = { ecox: ['cox', RAID_COX, COX_UNIQUES, 'Chambers of Xeric'], etob: ['tob', RAID_TOB, TOB_UNIQUES, 'Theatre of Blood'], etoa: ['toa', RAID_TOA, TOA_UNIQUES, 'Tombs of Amascut'] };
const ECHO_SKINS = [['echo_bow_skin', 'Echo bow (cosmetic)', 'longbow'], ['echo_blade_skin', 'Echo blade (cosmetic)', 'sword'], ['echo_staff_skin', 'Echo staff (cosmetic)', 'staff']];
ECHO_SKINS.forEach(([id, n, kind]) => cosmetic(id, n, 'weapon', kind, '#c8a8ff', [0, 0, 0], { untradeable: true, trim: '#ffffff', value: 1 }));
Object.entries(ECHO_RAIDS).forEach(([key, [, list]]) => {
  ECHO_RAIDS[key][4] = list.map((id, i) => { const b = MONSTER_BY_ID[id]; const nid = 'e' + id; MON({ ...b, id: nid, name: 'Echo ' + b.name, area: 'echo', raid: key, order: i, hue: (b.hue || 0) + 180, lvl: b.lvl * 2, hp: Math.round(b.hp * 2.5), atk: Math.round(b.atk * 1.5), def: Math.round(b.def * 1.4), mh: Math.round(b.mh * 1.35), transReq: 1, minCombat: 120, drops: [] }); return nid; });
});
raidKill = (orig => function (m) {
  const E = ECHO_RAIDS[m.raid]; if (!E) return orig(m);
  const list = E[4];
  if (m.order < list.length - 1) { S.combat.mon = list[m.order + 1]; UI.force = true; return; }
  const R = S.raids ||= {}; R[m.raid] = (R[m.raid] || 0) + 1;
  const got = []; const sh = randInt(25, 60); add('echo_shard', sh); got.push(`${sh} echo shards`);
  if (rnd() < (1 / 3) * M.luck) { const u = pickWeighted(E[2]); rareGet(u, 1, 'drop'); logItem(u, 1); got.push('💜 ' + ITEMS[u].name); }
  if (rnd() < 1 / 40 * M.luck) { const s = ECHO_SKINS[randInt(0, 2)][0]; add(s, 1); logItem(s, 1); got.push('✨ ' + ITEMS[s].name); }
  const msg = `✴️ Echo ${E[3]} complete (${R[m.raid]}): ${got.join(', ')}`;
  if (OFF) OFFLOG.push(msg); else { toast(msg, got.length > 1 ? 'pet' : 'rare', 7000); SFX.play('clue'); }
  S.combat.mon = list[0]; UI.force = true;
})(raidKill);
viewCombat = (orig => function () {
  const h = orig(), area = UI.area || curMon().area;
  if (area !== 'echo' || UI.ctab !== 'monsters' || !(S.trans?.count)) return h;
  const R = S.raids || {}, cur = curMon();
  const panel = `<div class="panel"><h3>✴️ Echo raids</h3><p class="small">Echo versions of every raid: 1/3 purple chance, 25–60 echo shards per clear, and rare Echo weapon skins. Combat 120+.</p>
    ${Object.entries(ECHO_RAIDS).map(([k, E]) => `<div class="upg"><div class="upg-icon">${MONSTER_BY_ID[E[4][E[4].length - 1]].icon}</div><div class="upg-main"><b>Echo ${E[3]}</b><small>${fmt(R[k] || 0)} clears${cur.raid === k ? ` · room ${cur.order + 1}/${E[4].length}` : ''}</small></div><button class="btn" data-act="eraid" data-id="${k}">${S.combat.fighting && cur.raid === k ? '…' : 'Enter'}</button></div>`).join('')}</div>`;
  const i = h.indexOf('<div class="list">'); return i > 0 ? h.slice(0, i) + panel + h.slice(i) : h + panel;
})(viewCombat);

/* ================= INVESTMENT FUND ================= */
const FUND_STEP = 10 * 60000;
function fundTick() {
  const F = S.fund; if (!F || !F.amt) return;
  F.t ||= now(); let steps = 0;
  while (now() - F.t >= FUND_STEP && steps < 300) { F.t += FUND_STEP; steps++; const z = (rnd() + rnd() + rnd() - 1.5) * 0.05 + 0.004; F.amt = Math.max(0, Math.round(F.amt * Math.exp(z))); if (rnd() < 0.005) { const crash = rnd() < 0.5; F.amt = Math.round(F.amt * (crash ? 0.75 : 1.3)); (F.news ||= []).unshift(`${crash ? '📉 Market crash' : '📈 Boom'}: fund ${crash ? '−25%' : '+30%'}`); F.news.length = Math.min(F.news.length, 5); } }
}
tickCore = (orig => function (dt) { orig(dt); fundTick(); trialCheck(); })(tickCore);
function fundPanel() {
  const F = S.fund || { amt: 0, put: 0 };
  const pl = F.amt - (F.put || 0);
  return `<div class="panel"><h3>🏦 Investment fund</h3><p class="muted small">Invest coins: the fund drifts up about 0.4% every 10 minutes (even offline), but it swings, and a rare crash (−25%) or boom (+30%) can hit it. Withdrawing costs 1%.</p>
    <div class="stats"><div>Fund value</div><b class="y">🪙${fmt(F.amt || 0)}</b><div>Invested</div><b>🪙${fmt(F.put || 0)}</b><div>Profit</div><b class="${pl >= 0 ? 'cb-green' : 'cb-red'}">${pl >= 0 ? '+' : ''}${fmt(pl)}</b></div>
    <div class="chips">${[0.1, 0.25, 0.5, 1].map(p => `<button class="chip" data-act="fund-in" data-id="${p}">Invest ${p * 100}% of coins</button>`).join('')}<button class="chip" data-act="fund-out">Withdraw all</button></div>
    ${(F.news || []).length ? `<p class="muted tiny">${F.news.join(' · ')}</p>` : ''}</div>`;
}
viewGE = (orig => function () { return orig() + fundPanel(); })(viewGE);

/* ================= COMMISSION BOARD ================= */
const COMM_POOL = TRIBUTE_POOL.map(t => t[0]).concat(['steel_bar', 'mithril_bar', 'oak_plank', 'feather', 'leather', 'cut_sapphire', 'cut_emerald', 'lobster', 'swordfish', 'willow_logs', 'maple_logs', 'iron_bar', 'gold_bar']).filter(id => ITEMS[id]);
function rollCommission() {
  const id = COMM_POOL[randInt(0, COMM_POOL.length - 1)], v = Math.max(1, ITEMS[id].value);
  const q = Math.max(10, Math.round((20000 + totalLevel() * 400) * (1 + S.asc.count) / v / 10) * 10);
  return { id, q, pay: Math.round(v * q * 3.5), until: now() + randInt(1, 4) * 3600e3 };
}
function commissions() { const C = S.comm ||= []; for (let i = 0; i < 3; i++) if (!C[i] || C[i].until < now()) C[i] = rollCommission(); return C; }
function viewCommissions() {
  const C = commissions();
  return subHead('📋 Commission board') + `<div class="panel small">NPC orders for your stockpiles. Deliver the goods before time runs out for <b>3.5× their value</b>, plus a mystery box. Done (${fmt(S.lifetime.comms || 0)} total).</div>
    <div class="list">${C.map((c, i) => `<div class="upg"><div class="upg-icon">${itemIcon(c.id)}</div><div class="upg-main"><b>${fmt(c.q)} × ${ITEMS[c.id].name}</b><small>Pays 🪙${fmt(c.pay)} · ${fmtTime((c.until - now()) / 1000)} left · have ${fmt(have(c.id))}</small></div>
      <div class="shop-btns"><button class="btn ${have(c.id) >= c.q ? '' : 'poor'}" data-act="comm-do" data-i="${i}">Deliver</button><button class="btn small" data-act="comm-skip" data-i="${i}">↻</button></div></div>`).join('')}</div>
    <p class="muted small">↻ rerolls an order for 🪙${fmt(10000 * (1 + S.asc.count))}.</p>`;
}

/* ================= COSTUME ROOM & FAVOURITES ================= */
const isCostume = id => ITEMS[id]?.cosmetic || ITEMS[id]?.outfit || /_cape$/.test(id) && ITEMS[id]?.perk;
function viewCostume() {
  const C = S.costume ||= {}, ids = Object.keys(C).filter(id => C[id] > 0).sort((a, b) => ITEM_ORDER[a] - ITEM_ORDER[b]);
  const inBank = Object.keys(S.bank).filter(isCostume).length;
  return subHead('👗 Costume room') + `<div class="panel small">Store cosmetics, outfits and skillcapes here to keep your bank tidy. Stored outfits still count for their XP bonus, and you can wear anything as a look straight from here.
      <div class="row-btns"><button class="btn ${inBank ? '' : 'poor'}" data-act="costume-store">Store all from bank (${inBank})</button></div></div>
    <div class="list">${ids.map(id => `<div class="upg"><div class="upg-icon">${itemIcon(id)}</div><div class="upg-main"><b>${ITEMS[id].name}</b><small>${ITEMS[id].slot || ''} · ×${C[id]}</small></div>
      <div class="shop-btns">${ITEMS[id].slot ? `<button class="btn small" data-act="costume-look" data-id="${id}">👁️ Look</button>` : ''}<button class="btn small" data-act="costume-take" data-id="${id}">Take</button></div></div>`).join('') || '<div class="panel muted">Nothing stored yet.</div>'}</div>`;
}
outfitCount = (orig => function (k) { return Math.min(4, orig(k) + OUTFIT_PIECES.filter(([p]) => (S.costume?.[`${k}_${p}`] || 0) > 0 && !have(`${k}_${p}`)).length); })(outfitCount);
bankTiles = (orig => function () {
  const fav = Object.keys(S.fav || {}).filter(id => S.fav[id] && have(id));
  if (!fav.length || (UI.bankQ || '').trim() || UI.bankFilter !== 'all') return orig();
  const tile = id => `<button class="tile ${ITEMS[id].rare ? 'rare' : ''}" data-act="item" data-id="${id}">${itemIcon(id)}<span class="qty" data-count="${id}" data-qty>${qtyText(have(id))}</span></button>`;
  return `<div class="bank-h">⭐ Favourites <small>${fav.length}</small></div>${fav.map(tile).join('')}${S.settings.bankGroup ? '' : '<div class="bank-h">All items</div>'}` + orig();
})(bankTiles);
openItemModal = (orig => function (id, fromSlot) {
  orig(id, fromSlot); if (fromSlot) return;
  const box = $('#modal .item-modal') || $('#modal');
  box?.insertAdjacentHTML('beforeend', `<div class="row-btns"><button class="btn" data-act="fav" data-id="${id}">${S.fav?.[id] ? '★ Unfavourite' : '☆ Favourite'}</button>${isCostume(id) && have(id) ? `<button class="btn" data-act="costume-one" data-id="${id}">👗 Store</button>` : ''}</div>`);
})(openItemModal);

/* ================= COLLECT ALL ================= */
function readyCount() {
  let n = S.plots.filter(p => plotReady(p)).length;
  if (S.bird && now() >= S.bird.t + BH_TIME) n++;
  n += [...(S.ch.daily || []), ...(S.ch.weekly || [])].filter(c => c.done && !c.claimed).length;
  return n;
}
function collectAll() {
  let crops = 0; S.plots.forEach((p, i) => { if (plotReady(p)) crops += harvest(i); });
  if (has('gardener')) S.plots.forEach((p, i) => { if (!p && UI.lastSeed && have(UI.lastSeed + '_seed')) plant(i, UI.lastSeed, true); });
  let bird = false; if (S.bird && now() >= S.bird.t + BH_TIME) { const B = S.bird; add('feather', randInt(80, 240)); add('bird_nest', randInt(1, 6)); gainXP('hunter', B.xp * 4 / (M.xp * SKILL_XP_RATE)); S.lifetime.birdruns = (S.lifetime.birdruns || 0) + 1; S.bird = null; bird = true; }
  let ch = 0; ['daily', 'weekly'].forEach(k => (S.ch[k] || []).forEach((c, i) => { if (c.done && !c.claimed) { claimChallenge(k, i); ch++; } }));
  toast(`🧺 Collected: ${crops} crops${bird ? ', bird houses' : ''}${ch ? `, ${ch} challenge reward${ch > 1 ? 's' : ''}` : ''}.`, 'rare');
}
viewSkills = (orig => function () {
  const n = readyCount(), O = omen();
  return (O ? `<div class="panel omen">${O.icon} <b>${O.name}</b> <small>· this run's omen: ${O.desc}</small></div>` : '') + (n ? `<div class="panel row-between"><div>🧺 <b>${n} thing${n > 1 ? 's' : ''} ready</b><br><small class="muted">Crops, bird houses & challenge rewards</small></div><button class="btn" data-act="collect-all">Collect all</button></div>` : '') + orig();
})(viewSkills);

/* ================= STATISTICS & RUN SUMMARY ================= */
function runSnapshot() { return { t0: S.stats.started || S.runStart || now(), xp: S.stats.xpRun || 0, coins: S.stats.earned || 0, kills: S.stats.kills || 0, total: totalLevel(), rares: S.stats.rares || 0 }; }
ascend = (orig => function () {
  const old = S, n = S.asc.count, snap = runSnapshot(), relics = Object.values(S.relic?.picks || {}), om = omen(), chal = S.chal?.id && !S.chal.failed ? S.chal.id : null, bd = typeof bountiesDone === 'function' ? bountiesDone() : 0, gain = ascendGain();
  orig();
  if (S === old || S.asc.count === n) return;
  const dur = (now() - snap.t0) / 1000;
  const runs = S.lifetime.runs ||= []; runs.push({ n: S.asc.count, dur, xp: snap.xp, coins: snap.coins, kills: snap.kills, total: snap.total, gain, at: now() }); if (runs.length > 60) runs.shift();
  S.runStart = now();
  setTimeout(() => {
    const box = $('#modal .item-modal'); if (!box) return;
    box.querySelector('.btn.big')?.insertAdjacentHTML('beforebegin', `<div class="panel run-sum"><h3>📜 Run summary</h3><div class="stats">
      <div>Time</div><b>${fmtTime(dur)}</b><div>Total level</div><b>${fmt(snap.total)}</b><div>XP gained</div><b>${fmt(snap.xp)}</b><div>Coins earned</div><b>🪙${fmt(snap.coins)}</b>
      <div>Kills</div><b>${fmt(snap.kills)}</b><div>Rare finds</div><b>${fmt(snap.rares)}</b><div>Bounties</div><b>${bd}/3</b><div>Runes & essence</div><b class="y">+${fmt(gain)}</b></div>
      <p class="small">${om ? `${om.icon} ${om.name} · ` : ''}${relics.map(id => relicDef(id)?.icon + ' ' + relicDef(id)?.name).join(' · ') || 'No relics'}${chal ? ` · 🏁 ${chalDef(chal).name} ✔` : ''}</p></div>`);
  }, 50);
})(ascend);
function bars(vals, fmtv) { const mx = Math.max(1, ...vals); return `<div class="sbars">${vals.map(v => `<div class="sbar"><i style="height:${Math.max(3, v / mx * 100)}%"></i><small>${fmtv(v)}</small></div>`).join('')}</div>`; }
function viewStats2() {
  const runs = (S.lifetime.runs || []).slice(-12), L = S.lifetime;
  return subHead('📊 Statistics') + `<div class="panel"><div class="stats">
      <div>Ascensions (this cycle / transcends)</div><b>${S.asc.count} / ${S.trans?.count || 0}</b><div>Lifetime XP</div><b>${fmt(L.xp || 0)}</b><div>Lifetime coins earned</div><b>🪙${fmt(L.earned || 0)}</b>
      <div>Lifetime kills</div><b>${fmt(L.kills || 0)}</b><div>Tributes paid</div><b>🪙${fmt(L.tributes || 0)}</b><div>Deepest Rift floor</div><b>${fmt(L.depthBest || 0)}</b>
      <div>Commissions</div><b>${fmt(L.comms || 0)}</b><div>Prestige stars</div><b>${Object.values(L.prest || {}).reduce((a, b) => a + b, 0)}</b><div>Pets</div><b>${Object.keys(S.pets).length}</b></div></div>
    ${runs.length ? `<div class="panel"><h3>⏱️ Ascension times (last ${runs.length})</h3>${bars(runs.map(r => r.dur / 3600), v => v.toFixed(1) + 'h')}</div>
      <div class="panel"><h3>🌀 Runes & essence per ascension</h3>${bars(runs.map(r => r.gain || 0), v => fmt(v))}</div>
      <div class="panel"><h3>🪙 Coins earned per run</h3>${bars(runs.map(r => r.coins), v => fmt(v))}</div>` : '<div class="panel muted">Ascend to start recording run history.</div>'}`;
}

/* ================= ICON PASS ================= */
for (const it of Object.values(ITEMS)) {
  if (it.kind || it.emoji) continue;
  const id = it.id;
  it.kind = /_bar$/.test(id) ? 'bar' : /_ore$/.test(id) ? 'ore' : /logs$/.test(id) ? 'log' : /_seed$/.test(id) ? 'seed' : /bones$/.test(id) ? 'bone' : /hide$/.test(id) ? 'hide' : /_rune$/.test(id) ? 'rune'
    : /plank/.test(id) ? 'plank' : /potion|brew|restore|overload/.test(id) ? 'potion' : /shard/.test(id) ? 'shard' : /gem|sapphire|emerald|ruby|diamond|onyx|zenyte|dragonstone/.test(id) ? 'gem' : /arrow$/.test(id) ? 'arrow' : /bolts?$/.test(id) ? 'bolt' : undefined;
  if (it.kind && !it.tint) it.tint = '#a8a090';
}
for (const id in _iconCache) delete _iconCache[id];

/* ---------- logs, sources, views, input, boot ---------- */
(function () {
  CLOG.push({ id: 'echoraid', name: 'Echo raids', icon: '✴️', cat: 'Raids', items: [...ECHO_SKINS.map(s => s[0]), 'trial_cape'] });
  CLOG.flatMap(p => p.items).forEach(i => CLOG_ITEMS.add(i));
  ECHO_SKINS.forEach(([id]) => (SOURCES[id] ||= []).push('Echo raids (1/40)')); (SOURCES.trial_cape ||= []).push('Weekly trial');
  ach('trial_1', 'Speedrunner', 'Complete a weekly trial', '🏁', g => !!g.S.lifetime.weekly?.done, 25);
  ach('comm_25', 'Contractor', 'Complete 25 commissions', '📋', g => (g.S.lifetime.comms || 0) >= 25, 15);
  ach('eraid_1', 'Echoes of Glory', 'Clear an Echo raid', '✴️', g => ['ecox', 'etob', 'etoa'].some(k => g.S.raids?.[k]), 40);
})();
for (const m of MONSTERS) MONSTER_BY_ID[m.id] = m;
Object.keys(ITEMS).forEach(id => { if (!(id in ITEM_ORDER)) ITEM_ORDER[id] = Object.keys(ITEM_ORDER).length; });
Object.assign(VIEWS, { commissions: viewCommissions, costume: viewCostume, stats: viewStats2, ge: viewGE, skills: viewSkills, combat: viewCombat });
HUB_VIEWS.push('commissions', 'costume');
viewAscension = (orig => function () { return orig().replace('<div class="panel relics">', trialPanel() + '<div class="panel relics">'); })(viewAscension);
VIEWS.ascension = viewAscension;
viewMenu = (orig => function () {
  const tiles = [['commissions', '📋', 'Commissions', `${commissions().filter(c => have(c.id) >= c.q).length} ready to deliver`], ['costume', '👗', 'Costume room', `${Object.keys(S.costume || {}).length} stored`]];
  return orig().replace('<button class="hub-tile" data-act="hub" data-id="character">', tiles.map(([id, i, n, d]) => `<button class="hub-tile" data-act="hub" data-id="${id}"><span class="ht-icon">${i}</span><b>${n}</b><small>${d}</small></button>`).join('') + '<button class="hub-tile" data-act="hub" data-id="character">');
})(viewMenu);
VIEWS.menu = viewMenu;
viewSig = (orig => function () {
  const v = UI.view;
  if (v === 'commissions') return JSON.stringify(S.comm) + Math.floor(now() / 30000) + Object.keys(S.bank).length;
  if (v === 'costume') return JSON.stringify(S.costume || {}) + Object.keys(S.bank).length;
  if (v === 'stats') return 'stats' + (S.lifetime.runs || []).length;
  if (v === 'ge') return orig() + JSON.stringify(S.fund || {});
  if (v === 'skills') return orig() + readyCount() + S.omen;
  if (v === 'ascension') return orig() + JSON.stringify(S.lifetime.weekly || {}) + Math.floor(now() / 10000);
  if (v === 'bank') return orig() + JSON.stringify(S.fav || {});
  return orig();
})(viewSig);

document.addEventListener('click', e => {
  if (e.target.closest('[data-nav]')) return;
  const t = e.target.closest('[data-act]'); if (!t) return;
  const d = t.dataset; let h = true, rer = true;
  switch (d.act) {
    case 'trial-start': { const W = weeklyTrial(); W.start = now(); W.base = {}; W.goals.forEach(g => { if (g.type === 'kill') W.base[g.key] = S.kills[g.key] || 0; }); toast('🏁 The weekly trial clock is running!', 'rare'); break; }
    case 'eraid': { const E = ECHO_RAIDS[d.id], cur = curMon(); if (S.combat.fighting && cur.raid === d.id) break; if (S.combat.fighting) retreat(); S.combat.mon = E[4][0]; startFight(); break; }
    case 'fund-in': { const a = Math.floor(S.coins * +d.id); if (a <= 0) break; S.coins -= a; const F = S.fund ||= { amt: 0, put: 0 }; F.amt += a; F.put = (F.put || 0) + a; F.t ||= now(); toast(`🏦 Invested 🪙${fmt(a)}.`, 'rare'); break; }
    case 'fund-out': { const F = S.fund; if (!F?.amt) break; const g = Math.floor(F.amt * 0.99); S.coins += g; toast(`🏦 Withdrew 🪙${fmt(g)} (${g >= (F.put || 0) ? 'profit' : 'loss'} ${fmt(g - (F.put || 0))}).`, 'rare'); S.fund = { amt: 0, put: 0 }; break; }
    case 'comm-do': { const c = commissions()[+d.i]; if (have(c.id) < c.q) { toast(`You need ${fmt(c.q)} × ${ITEMS[c.id].name}.`, 'warn'); break; } remove(c.id, c.q); gainCoins(c.pay); add('mystery_box', 1); S.lifetime.comms = (S.lifetime.comms || 0) + 1; S.comm[+d.i] = rollCommission(); toast(`📋 Commission delivered: 🪙${fmt(c.pay)} and a mystery box.`, 'rare'); SFX.play('coin'); break; }
    case 'comm-skip': { const c = 10000 * (1 + S.asc.count); if (S.coins < c) { toast(`You need 🪙${fmt(c)}.`, 'warn'); break; } S.coins -= c; S.comm[+d.i] = rollCommission(); break; }
    case 'costume-store': { const C = S.costume ||= {}; for (const id of Object.keys(S.bank).filter(isCostume)) { C[id] = (C[id] || 0) + have(id); remove(id, have(id)); } toast('👗 Cosmetics stored.'); break; }
    case 'costume-one': { const C = S.costume ||= {}; C[d.id] = (C[d.id] || 0) + have(d.id); remove(d.id, have(d.id)); closeModal(); toast('👗 Stored in the costume room.'); break; }
    case 'costume-take': { const C = S.costume; if (!C?.[d.id]) break; add(d.id, C[d.id]); delete C[d.id]; break; }
    case 'costume-look': { const it = ITEMS[d.id]; S.cosmetic[it.slot] = d.id; toast(`👁️ You now look like you're wearing ${it.name}.`); break; }
    case 'fav': (S.fav ||= {})[d.id] = !S.fav[d.id]; if (!S.fav[d.id]) delete S.fav[d.id]; closeModal(); openItemModal(d.id); rer = false; break;
    case 'collect-all': collectAll(); break;
    default: h = false;
  }
  if (!h) return;
  e.stopImmediatePropagation();
  if (rer) { UI.force = true; render(); liveUpdate(); }
}, true);

function boot15() {
  boot8();
  if (!S.omen) rollOmen();
  setDepthStats(); applyCaps(); refreshLevels(); recalc(); S.runStart ||= S.stats.started || now();
  UI.force = true; render();
}
