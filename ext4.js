'use strict';
/* =========================================================
   CLICKSCAPE v4 — ascension overhaul, house, raids, rift
   ========================================================= */
CLUE_KILL_RANGE.master = [150, 3000];
const perk = id => S.asc?.perks?.[id] || 0;
const room = id => S.house?.[id] || 0;
const wellOn = id => (S.well?.[id] || 0) > now();

/* ---------- Level caps rise with ascension ---------- */
function capBonus() { return Math.min(30, 3 * (S.asc?.count || 0)); }
function applyCaps() { for (const s of SKILL_ORDER) MAX_LVL[s] = (CAP99.includes(s) ? 99 : 120) + capBonus(); }
function skillXpMult(skill) { return skill === 'prayer' ? 1 + 0.25 * room('altar') : 1; }
function offlineHours() { return (has('long_rest') ? 24 : 8) + 6 * perk('tireless') + 8 * room('portal'); }
function weaponVs(m) {
  const w = ITEMS[S.equip.weapon];
  if (!w || !m) return 1;
  let f = 1;
  if (w.dragonbane && m.dragon) f *= w.dragonbane;
  if (w.tbow) f *= 0.6 + Math.min(m.lvl, 1100) / 1000;
  return f;
}

/* ---------- Extra multipliers (called at the end of recalc) ---------- */
function recalc4() {
  if (!S.asc) return;
  M.xp *= (1 + 0.1 * perk('lucid')) * (1 + 0.03 * room('library')) * (wellOn('xp') ? 1.5 : 1);
  M.luck *= (1 + 0.08 * perk('fortune')) * (wellOn('luck') ? 1.25 : 1);
  M.sell *= 1 + 0.03 * room('vault');
  M.dmg *= (1 + 0.05 * perk('warlord')) * (1 + 0.02 * room('trophy')) * (wellOn('war') ? 1.25 : 1);
  M.grow *= Math.max(0.4, 1 - 0.06 * room('garden'));
  M.yield *= 1 + 0.06 * room('garden');
  M.regen *= 1 + room('pool');
  M.specRegen = 1 + 0.5 * room('pool');
  M.eventFreq = 1 / (1 + 0.15 * room('observatory'));
  const men = room('menagerie') * 0.01;
  let combatPets = 0;
  for (const p in S.pets) if (PETS[p]?.st === 'combat') combatPets++;
  M.dmg *= Math.pow(1 + men, combatPets);
  const guild = 1 + 0.02 * (S.guild || 0);
  const crew = (1 + 0.15 * perk('industry')) * (1 + 0.04 * room('quarters')) * (wellOn('work') ? 2 : 1);
  for (const st of STATION_ORDER) {
    let f = guild;
    if (['furnace', 'anvil', 'craft', 'fletch'].includes(st)) f *= 1 + 0.06 * room('workshop');
    if (st === 'range') f *= 1 + 0.1 * room('kitchen');
    for (const p in S.pets) if (PETS[p]?.st === st) f *= 1 + men;
    M.tap[st] *= f;
    M.rate[st] *= f * crew;
  }
}

/* ---------- Ascension ---------- */
function ascReqCalc() { const n = SKILL_ORDER.length, c = S?.asc?.count || 0; const avgCap = SKILL_ORDER.reduce((a, k) => a + (MAX_LVL[k] || 99), 0) / n; return Math.round(n * Math.min(30 + 14 * c, 0.9 * avgCap) * (typeof ascReqMult === 'function' ? ascReqMult() : 1)); }
const ascReqTotal = () => ascReqCalc();
ascendGain = function () { return Math.floor(Math.sqrt(S.stats.xpRun / 40000) * (1 + 0.1 * (S.asc.count || 0))); };
function ascRewards(n) {
  const r = [['ascension_cape_' + Math.min(n, 10), 1], ['xp_lamp', n + 1], ['mystery_box', n + 1]];
  if (n >= 2) r.push(['clue_elite', 1]);
  if (n >= 4) r.push(['clue_master', Math.floor(n / 4)]);
  if (n === 3) r.push(['ring_of_ascension', 1]);
  if (n === 5) r.push(['ascendant_cape', 1]);
  if (n === 10) r.push(['crown_of_ascension', 1]);
  return r;
}
ascend = function () {
  const g = ascendGain();
  if (totalLevel() < ascReqTotal() || g < 1) return;
  const old = S, n = old.asc.count + 1;
  const keep = { museum: old.museum, pets: old.pets, asc: { points: old.asc.points + g, count: n, essence: (old.asc.essence || 0) + g, perks: old.asc.perks || {} },
    lifetime: old.lifetime, settings: old.settings, clog: old.clog, ach: old.ach, ge: old.ge, loadouts: old.loadouts, cosmetic: old.cosmetic, locked: old.locked };
  S = newState(keep);
  Object.assign(S, { house: old.house || {}, guild: old.guild || 0, unlocks: old.unlocks || {}, kills: old.kills || {}, raids: old.raids || {}, well: {},
    clues: { active: null, done: old.clues?.done || {} }, barrows: { killed: [], chests: old.barrows?.chests || 0 } });
  // perks
  S.coins = [25, 10000, 250000, 5000000, 100000000, 1000000000][perk('headstart')];
  const vet = [1, 10, 20, 30, 40, 50, 60][perk('veteran')];
  if (vet > 1) SKILL_ORDER.forEach(s => S.xp[s] = Math.max(S.xp[s], XP_TABLE[s === 'hitpoints' ? Math.max(10, vet) : vet]));
  const loyal = perk('loyal') * 0.1;
  if (loyal) for (const st in old.workers) S.workers[st] = Math.floor(old.workers[st] * loyal);
  if (perk('toolkit')) ['pickaxe', 'hatchet', 'rod', 'mattock'].forEach(s => S.equip[s] = old.equip[s]);
  if (perk('armoury')) GEAR_SLOTS.forEach(s => S.equip[s] = old.equip[s]);
  if (perk('insight')) for (const id in old.upgrades) if (/_tap\d|_crew\d/.test(id)) S.upgrades[id] = true;
  if (perk('slayerkeep')) { S.slayer.points = old.slayer.points; S.slayer.unlocks = old.slayer.unlocks; }
  const rewards = ascRewards(n);
  rewards.forEach(([id, q]) => { add(id, q); logItem(id, q); });
  if (n === 2) givePet('ascendling');
  applyCaps(); refreshLevels(); recalc(); save();
  closeModal(); go('ascension');
  SFX.play('pet'); burst();
  openModal(`<div class="item-modal"><h2>🌀 Ascension ${n} complete!</h2><p>You now hold <b class="y">${S.asc.points}</b> Ancient Runes and <b class="y">${S.asc.essence}</b> essence to spend.</p>
    <p class="small">Level caps are now <b>${99 + capBonus()}</b> (combat) and <b>${120 + capBonus()}</b> (skilling).</p>
    <h3>Ascension rewards</h3><div class="mini-grid casket">${rewards.map(([id, q]) => `<div class="mini uniq">${itemIcon(id)}<span>${q > 1 ? q : ''}</span></div>`).join('')}</div>
    <button class="btn big" data-act="close">Begin anew</button></div>`);
};
function buyPerk(id) {
  const p = ASC_PERKS.find(x => x.id === id), l = perk(id);
  if (l >= p.max) return;
  const c = p.cost(l);
  if ((S.asc.essence || 0) < c) return toast(`You need ${c} essence.`, 'warn');
  S.asc.essence -= c; S.asc.perks[id] = l + 1; recalc();
  toast(`${p.icon} ${p.name} → level ${l + 1}`, 'rare'); SFX.play('ach');
}
function viewAscension() {
  const g = ascendGain(), req = ascReqTotal(), ok = totalLevel() >= req && g >= 1, n = S.asc.count;
  return subHead('🌀 Ascension') + `<div class="panel asc"><div class="stats">
      <div>Ascensions</div><b>${n}</b><div>Ancient Runes (+5% production each)</div><b>${fmt(S.asc.points)}</b>
      <div>Essence to spend</div><b>${fmt(S.asc.essence || 0)}</b><div>Level caps</div><b>${99 + capBonus()} / ${120 + capBonus()}</b></div>
      <p class="small">Ascending resets levels, items, coins, workers and upgrades. You keep pets, museum, logs, achievements, house, GE history and everything below. Each ascension needs a higher total level and raises level caps by 6 (Transcendence adds +60 more each time), and new Rift monsters unlock.</p>
      <p>Next: total level <b class="y">${totalLevel()}/${req}</b> · gain <b class="y">+${g}</b> runes & essence</p>
      <h3>Rewards for ascension ${n + 1}</h3><div class="mini-grid">${ascRewards(n + 1).map(([id, q]) => `<div class="mini" data-act="info" data-id="${id}">${itemIcon(id)}<span>${q > 1 ? q : ''}</span></div>`).join('')}</div>
      <button class="btn big ${ok ? '' : 'disabled'}" data-act="ascend">${ok ? 'Ascend…' : `Total level ${totalLevel()}/${req}`}</button></div>
    <div class="panel"><h3>✨ Essence perks <small class="muted">· permanent</small></h3>
      ${ASC_PERKS.map(p => { const l = perk(p.id), max = l >= p.max; return `<div class="upg"><div class="upg-icon">${p.icon}</div><div class="upg-main"><b>${p.name} ${l}/${p.max}</b><small>${p.desc(l)}${max ? '' : ` → ${p.desc(l + 1)}`}</small></div>
        ${max ? '<span class="y">MAX</span>' : `<button class="btn ${(S.asc.essence || 0) < p.cost(l) ? 'poor' : ''}" data-act="perk" data-id="${p.id}">${p.cost(l)} ✨</button>`}</div>`; }).join('')}</div>`;
}
viewUpgrades = (orig => function () {
  return orig().replace(/<div class="panel asc">[\s\S]*?<\/button><\/div>/, `<div class="panel asc"><h3>🌀 Ascension</h3><p>Ascension ${S.asc.count + 1} needs total level <b class="y">${ascReqTotal()}</b> and grants <b class="y">+${ascendGain()}</b> runes and essence, special loot and higher level caps.</p><button class="btn big" data-act="hub" data-id="ascension">Open ascension</button></div>`);
})(viewUpgrades);

/* ---------- House, wishing well, guild ---------- */
function viewHouse() {
  const wc = 2000 * Math.max(100, totalLevel()) * (1 + (S.asc.count || 0));
  return subHead('🏠 Your house') + `<div class="panel small">Build and upgrade rooms with coins. Rooms are permanent and stay through Ascension.</div>
    <div class="list">${HOUSE.map(r => { const l = room(r.id), max = l >= r.max, c = houseCost(r, l); return `<div class="upg ${l ? 'got' : ''}"><div class="upg-icon">${r.icon}</div><div class="upg-main"><b>${r.name} ${l}/${r.max}</b><small>${l ? r.desc(l) : 'Not built'}${max ? '' : ` → ${r.desc(l + 1)}`}</small></div>
      ${max ? '<span class="y">MAX</span>' : `<button class="btn" data-act="house" data-id="${r.id}" data-afford="${c}">🪙${fmt(c)}</button>`}</div>`; }).join('')}</div>
    <div class="panel"><h3>⛲ Wishing well <small class="muted">· 30-minute blessings</small></h3><p class="muted small">Throw in 🪙${fmt(wc)} for a blessing. Price grows with your total level.</p>
      ${WELL.map(w => `<div class="upg"><div class="upg-icon">${w.icon}</div><div class="upg-main"><b>${w.name}</b><small>${w.desc}${wellOn(w.id) ? ` · <span class="y">active ${fmtTime((S.well[w.id] - now()) / 1000)}</span>` : ''}</small></div>
        <button class="btn" data-act="well" data-id="${w.id}" data-afford="${Math.round(wc * w.mult)}">🪙${fmt(Math.round(wc * w.mult))}</button></div>`).join('')}</div>
    <div class="panel"><h3>📊 Guild investment</h3><p class="small">Each share gives <b>+2%</b> tap power and worker speed at every station, forever. You own <b class="y">${S.guild || 0}</b> shares (+${2 * (S.guild || 0)}%).</p>
      <button class="btn big" data-act="guild" data-afford="${guildCost(S.guild || 0)}">Buy a share · 🪙${fmt(guildCost(S.guild || 0))}</button></div>`;
}
function buyRoom(id) {
  const r = HOUSE.find(x => x.id === id), l = room(id);
  if (l >= r.max) return;
  const c = houseCost(r, l);
  if (S.coins < c) return toast("You don't have enough coins.", 'warn');
  S.coins -= c; S.house[id] = l + 1; recalc();
  toast(`${r.icon} ${r.name} upgraded to level ${l + 1}: ${r.desc(l + 1)}`, 'rare'); SFX.play('smith');
}
function throwWell(id) {
  const w = WELL.find(x => x.id === id), c = Math.round(2000 * Math.max(100, totalLevel()) * (1 + (S.asc.count || 0)) * w.mult);
  if (S.coins < c) return toast("You don't have enough coins.", 'warn');
  S.coins -= c; S.well[id] = Math.max(now(), S.well[id] || 0) + 30 * 60000; recalc();
  toast(`${w.icon} The well glows: ${w.desc}!`, 'pet'); SFX.play('rare');
}

/* ---------- Raids: Chambers of Xeric ---------- */
function raidKill(m) {
  const R = S.raids ||= {};
  if (m.id !== 'cox_olm') { S.combat.mon = RAID_COX[m.order + 1]; UI.force = true; return; }
  R.cox = (R.cox || 0) + 1;
  track('raid', 'cox', 1);
  const got = [];
  if (rnd() < (1 / 9) * M.luck) {
    const u = pickWeighted(COX_UNIQUES);
    rareGet(u, 1, 'drop'); logItem(u, 1); got.push('💜 ' + ITEMS[u].name);
    R.purples = (R.purples || 0) + 1;
    if (rnd() < 1 / 53) givePet('olmlet');
  } else {
    for (let i = 0; i < 2; i++) {
      const [id, a, b] = COX_COMMON[randInt(0, COX_COMMON.length - 1)];
      if (id === 'coins') { const c = randInt(a, b); gainCoins(c); got.push('🪙' + fmt(c)); } else { const q = randInt(a, b); add(id, q); got.push(`${q} × ${ITEMS[id].name}`); }
    }
  }
  if (rnd() < 1 / 12) { add('clue_elite', 1); got.push('Clue scroll (elite)'); }
  const msg = `🏛️ Chambers of Xeric complete (${R.cox}): ${got.join(', ')}`;
  if (OFF) OFFLOG.push(msg); else { toast(msg, got[0]?.startsWith('💜') ? 'pet' : 'rare', 7000); SFX.play(got[0]?.startsWith('💜') ? 'pet' : 'clue'); }
  S.combat.mon = RAID_COX[0];
  UI.force = true;
}
function raidPanel() {
  const R = S.raids || {}, cur = curMon();
  const at = cur.raid ? cur.order : -1;
  return `<div class="panel"><h3>🏛️ Chambers of Xeric <small class="muted">· ${fmt(R.cox || 0)} completions · ${fmt(R.purples || 0)} purples</small></h3>
    <div class="chips">${RAID_COX.map((id, i) => `<span class="chip ${i < at ? 'on' : ''} ${i === at && S.combat.fighting ? 'locked' : ''}">${MONSTER_BY_ID[id].icon} ${MONSTER_BY_ID[id].name}${i < at ? ' ✔' : ''}</span>`).join('')}</div>
    <p class="muted small">Clear four rooms, then the Great Olm. Each completion has a 1/9 chance of a purple: prayer scrolls (unlock Rigour & Augury), Dragon hunter crossbow, Twisted buckler, Dinh's bulwark, Ancestral robes, Dragon claws, Elder maul, Kodai wand or the Twisted bow. Requires combat 100. Raids loop while you fight.</p>
    <button class="btn big" data-act="raid-start">${S.combat.fighting && cur.raid ? 'Raid in progress…' : 'Start raid'}</button></div>`;
}
function riftPanel() {
  const n = S.asc.count;
  return `<div class="panel glow"><h3>🌌 The Rift</h3><p class="small">A realm that only opens to the ascended. Each tier of monster needs more ascensions. They drop <b>rift essence</b> (for Void bars, Starwood bows, Divine overloads and Celestial amulets), celestial bones, master clues and <b>celestial cores</b> for the strongest weapons in the game.</p>
    <p class="muted small">You have ascended ${n} time${n === 1 ? '' : 's'}. Level caps are ${99 + capBonus()} / ${120 + capBonus()}.</p></div>`;
}

/* ---------- Items: prayer scrolls & bigger caskets ---------- */
openItem = (orig => function (id, q = 1) {
  const it = ITEMS[id];
  if (it.prayerScroll) {
    if (S.unlocks?.[it.prayerScroll]) return toast(`You already know ${cap1(it.prayerScroll)}.`, 'warn');
    if (!remove(id, 1)) return;
    (S.unlocks ||= {})[it.prayerScroll] = true; recalc();
    toast(`🙏 You read the scroll and learn <b>${cap1(it.prayerScroll)}</b>! (Prayer 77)`, 'pet', 6000); SFX.play('pet'); return;
  }
  if (id === 'casket') {
    q = Math.min(q, have(id));
    const extra = {};
    for (let k = 0; k < q; k++) {
      if (rnd() < 0.2) { const g = pickWeighted([['cut_sapphire', 40], ['cut_emerald', 30], ['cut_ruby', 20], ['cut_diamond', 10]]); extra[g] = (extra[g] || 0) + 1; }
      if (rnd() < 1 / 25) extra.clue_easy = (extra.clue_easy || 0) + 1;
      if (rnd() < 1 / 60) extra.clue_medium = (extra.clue_medium || 0) + 1;
      if (rnd() < 1 / 400) extra.dragonstone = (extra.dragonstone || 0) + 1;
    }
    orig(id, q);
    const parts = Object.entries(extra).map(([i, n]) => { add(i, n); return `${n} × ${ITEMS[i].name}`; });
    if (parts.length) toast(`🧰 Also inside: ${parts.join(', ')}`, 'rare');
    return;
  }
  return orig(id, q);
})(openItem);
finishClue = (orig => function (tier) {
  orig(tier);
  if (tier === 'elite' && rnd() < 0.2) { add('clue_master', 1); toast('📜 Tucked inside the casket is a <b>master clue scroll</b>!', 'pet', 5000); }
  if (tier === 'master' && rnd() < (1 / 1000) * M.luck) givePet('bloodhound');
  if (tier === 'hard' && rnd() < 1 / 15) { add('clue_elite', 1); toast('📜 You find an <b>elite clue scroll</b> in the casket!', 'rare'); }
})(finishClue);

/* ---------- Collection log & sources for new things ---------- */
(function () {
  for (let i = CLOG.length - 1; i >= 0; i--) if (!CLOG[i].items.length) CLOG.splice(i, 1);
  CLOG.push({ id: 'cox', name: 'Chambers of Xeric', icon: '🏛️', cat: 'Raids', items: [...COX_UNIQUES.map(u => u[0]), 'pet:olmlet'] });
  CLOG.push({ id: 'ascension', name: 'Ascension', icon: '🌀', cat: 'Rift', items: ['ring_of_ascension', 'ascendant_cape', 'crown_of_ascension', ...ASC_CAPE_TINTS.map((t, i) => 'ascension_cape_' + (i + 1)), 'pet:ascendling'] });
  const master = CLOG.find(p => p.id === 'clue_master'); if (master) master.items.push('pet:bloodhound');
  CLOG.forEach(p => { if (p.id.startsWith('m_') && MONSTER_BY_ID[p.id.slice(2)]?.area === 'rift') p.cat = 'Rift'; });
  CLOG.flatMap(p => p.items).forEach(i => CLOG_ITEMS.add(i));
  const addS = (id, s) => { (SOURCES[id] ||= []).push(s); };
  COX_UNIQUES.forEach(([id]) => addS(id, 'Chambers of Xeric (raid purple)'));
  ascRewards(10).concat(ascRewards(3), ascRewards(5)).forEach(([id]) => addS(id, 'Ascension reward'));
  ASC_CAPE_TINTS.forEach((t, i) => addS('ascension_cape_' + (i + 1), `Reward for ascension ${i + 1}`));
  addS('clue_master', 'Elite clue caskets (1/5), Rift monsters, rift merchant');
  ['dexterous_prayer_scroll', 'arcane_prayer_scroll'].forEach(id => addS(id, 'Read it to unlock ' + (id.startsWith('dex') ? 'Rigour' : 'Augury') + ' at Prayer 77'));
  RECIPES.slice(-6).forEach(r => addS(r.out, `Combine: ${Object.keys(r.inp).map(i => ITEMS[i].name).join(' + ')}`));
  for (const id of Object.keys(ITEMS)) if (!ITEMS[id].hidden && !ITEMS[id].untradeable && !GE_SET.has(id) && ITEMS[id].value >= 1) { GE_ITEMS.push(id); GE_SET.add(id); }
})();

/* ---------- Views & input ---------- */
Object.assign(VIEWS, { ascension: viewAscension, house: viewHouse, upgrades: viewUpgrades });
HUB_VIEWS.push('ascension', 'house');
viewSig = (orig => function () {
  if (UI.view === 'ascension') return JSON.stringify(S.asc) + totalLevel() + ascendGain();
  if (UI.view === 'house') return JSON.stringify(S.house) + S.guild + JSON.stringify(S.well) + totalLevel();
  if (UI.view === 'combat' && ['raids', 'rift'].includes(UI.area)) return orig() + S.combat.mon + JSON.stringify(S.raids || {});
  return orig();
})(viewSig);
document.addEventListener('click', e => {
  if (e.target.closest('[data-nav]')) return;
  const t = e.target.closest('[data-act]'); if (!t) return;
  const d = t.dataset, id = d.id;
  let h = true;
  switch (d.act) {
    case 'perk': buyPerk(id); break;
    case 'house': buyRoom(id); break;
    case 'well': throwWell(id); break;
    case 'guild': { const c = guildCost(S.guild || 0); if (S.coins < c) { toast("You don't have enough coins.", 'warn'); break; } S.coins -= c; S.guild = (S.guild || 0) + 1; recalc(); toast(`📊 You buy a guild share. Production now +${2 * S.guild}%.`, 'rare'); SFX.play('coin'); break; }
    case 'raid-start': { const cur = curMon(); if (S.combat.fighting && cur.raid) break; if (S.combat.fighting) retreat(); S.combat.mon = RAID_COX[0]; startFight(); break; }
    default: h = false;
  }
  if (h) { UI.force = true; render(); liveUpdate(); }
});

/* ---------- Boot additions ---------- */
function boot4() {
  boot3();
  S.house ||= {}; S.unlocks ||= {}; S.raids ||= {}; S.well ||= {}; S.guild ||= 0;
  S.asc.essence ??= S.asc.points || 0; S.asc.perks ||= {};
  applyCaps(); refreshLevels(); recalc();
  setInterval(() => recalc(), 5000);
  UI.force = true; render();
}
