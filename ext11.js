'use strict';
/* =========================================================
   CLICKSCAPE v6.0 — the replay loop
   Run relics, ascension challenges (incl. Ironman), Echo bosses,
   Fight Caves & Inferno runs, Gauntlet, Nightmare, Barbarian Assault,
   Giants' Foundry & Guardians of the Rift, more quests, tutorial
   ========================================================= */

/* ================= RUN RELICS (pick 1 per tier each ascension) ================= */
const RELIC_TIERS = [0, 400, 900, 1500];
const GATHER = ['mine', 'forest', 'fish', 'hunt', 'dig'], PROCESS = ['furnace', 'anvil', 'craft', 'fletch', 'herb', 'range', 'fire', 'sawmill', 'workbench', 'runealtar', 'altar', 'restore'];
const RELICS = [
  [{ id: 'harvest', icon: '🌾', name: 'Endless Harvest', desc: 'Gathering (mine, forest, fish, hunt, dig) ×2' }, { id: 'prodigy', icon: '🔨', name: 'Production Prodigy', desc: 'Processing (smelt, smith, craft, cook, brew…) ×2' },
    { id: 'trickster', icon: '🦹', name: 'Trickster', desc: 'Thieving & Agility ×3' }, { id: 'thumb', icon: '🌱', name: 'Green Thumb', desc: 'Crops grow 3× faster, +50% yield' }],
  [{ id: 'lucky', icon: '🍀', name: 'Lucky', desc: 'Rare drops ×1.5' }, { id: 'scholar', icon: '📚', name: 'Scholar', desc: 'All XP ×1.5' },
    { id: 'banker', icon: '💰', name: 'Banker', desc: 'Sell prices ×1.5' }, { id: 'weapon', icon: '⚔️', name: 'Weapon Master', desc: 'Damage ×1.4, accuracy ×1.2' }],
  [{ id: 'workforce', icon: '👷', name: 'Workforce', desc: 'Workers ×3 speed' }, { id: 'gloves', icon: '🧤', name: 'Golden Gloves', desc: 'Tap power ×5' },
    { id: 'grit', icon: '💀', name: "Slayer's Grit", desc: 'Slayer XP ×3, Slayer points ×2' }, { id: 'fairy', icon: '🧚', name: "Fairy's Flight", desc: '+12h offline time this run' }],
  [{ id: 'midas', icon: '🪙', name: 'Golden Touch', desc: 'All coins gained ×2' }, { id: 'avatar', icon: '🛡️', name: 'Avatar', desc: 'Combat XP ×3' },
    { id: 'overgrowth', icon: '🌳', name: 'Overgrowth', desc: 'All production ×2' }, { id: 'echo', icon: '🔊', name: 'Echo', desc: 'This ascension gives +50% runes & essence' }],
];
const relicOn = id => S.relic?.picks && Object.values(S.relic.picks).includes(id);
function rollRelicOffers() { const offers = RELICS.map(t => [...t].sort(() => rnd() - 0.5).slice(0, 3).map(r => r.id)); S.relic = { offers, picks: {} }; }
const relicDef = id => RELICS.flat().find(r => r.id === id);
recalc4 = (orig => function () {
  orig(); if (!S.asc || !S.relic) return;
  const r = relicOn;
  for (const st of STATION_ORDER) {
    let f = 1; if (r('harvest') && GATHER.includes(st)) f *= 2; if (r('prodigy') && PROCESS.includes(st)) f *= 2; if (r('trickster') && ['thieve', 'course'].includes(st)) f *= 3; if (r('overgrowth')) f *= 2;
    M.rate[st] *= f * (r('workforce') ? 3 : 1); M.tap[st] *= f * (r('gloves') ? 5 : 1);
  }
  if (r('thumb')) { M.grow *= 1 / 3; M.yield *= 1.5; }
  if (r('lucky')) M.luck *= 1.5; if (r('scholar')) M.xp *= 1.5; if (r('banker')) M.sell *= 1.5;
  if (r('weapon')) { M.dmg *= 1.4; M.capeAcc *= 1.2; } if (r('avatar')) M.cxp *= 3; if (r('grit')) { M.sxp *= 3; M.slayPts *= 2; }
  // permanent challenge rewards
  const C = S.lifetime.chal || {};
  if (C.ironman) M.luck *= 1 + 0.1 * Math.min(3, C.ironman);
  if (C.lonewolf) for (const st of STATION_ORDER) M.tap[st] *= 1 + Math.min(3, C.lonewolf);
  if (C.pacifist) M.xp *= 1 + 0.1 * Math.min(3, C.pacifist);
  if (C.warrior) M.dmg *= 1 + 0.1 * Math.min(3, C.warrior);
  if (C.hourglass) for (const st of STATION_ORDER) M.rate[st] *= 1 + 0.2 * Math.min(3, C.hourglass);
  if (C.hardcore) { M.dmg *= 1 + 0.05 * Math.min(3, C.hardcore); M.luck *= 1 + 0.05 * Math.min(3, C.hardcore); }
  const ch = activeChal();
  if (ch === 'warrior') M.cxp *= 1.5;
})(recalc4);
skillXpMult = (orig => function (sk) { let m = orig(sk); if (activeChal() === 'warrior' && !COMBAT_SKILLS.includes(sk) && sk !== 'prayer') m *= 0.5; return m; })(skillXpMult);
gainCoins = (orig => function (n) { return orig(relicOn('midas') ? n * 2 : n); })(gainCoins);
offlineHours = (orig => function () { return orig() + (relicOn('fairy') ? 12 : 0); })(offlineHours);
function relicPanel() {
  if (!S.relic) rollRelicOffers();
  const R = S.relic, tl = totalLevel();
  return `<div class="panel relics"><h3>🔮 Run relics <small class="muted">· pick one per tier · new choices every ascension</small></h3>
    ${RELIC_TIERS.map((need, i) => { const picked = R.picks[i], open = tl >= need;
      return `<div class="relic-tier ${open ? '' : 'locked'}"><b>Tier ${i + 1}</b> <small class="muted">${open ? (picked ? '' : 'choose one') : `unlocks at total level ${need}`}</small>
        <div class="relic-row">${R.offers[i].map(id => { const d = relicDef(id); return `<button class="relic ${picked === id ? 'on' : ''} ${picked && picked !== id ? 'dim' : ''}" data-act="relic" data-i="${i}" data-id="${id}" ${!open || picked ? 'disabled' : ''}><span>${d.icon}</span><b>${d.name}</b><small>${d.desc}</small></button>`; }).join('')}</div></div>`; }).join('')}</div>`;
}

/* ================= ASCENSION CHALLENGES ================= */
const CHALLENGES = [
  { id: 'ironman', icon: '⛓️', name: 'Ironman', desc: 'No shop or Grand Exchange buying.', reward: '+10% rare drops (stacks ×3)', mult: 2 },
  { id: 'lonewolf', icon: '🐺', name: 'Lone Wolf', desc: 'No workers or combat trainers.', reward: 'Tap power +100% (stacks ×3)', mult: 2 },
  { id: 'pacifist', icon: '🕊️', name: 'Pacifist', desc: 'No combat at all.', reward: '+10% all XP (stacks ×3)', mult: 1.5 },
  { id: 'warrior', icon: '🗡️', name: "Warrior's Path", desc: 'Skilling XP halved, combat XP ×1.5.', reward: '+10% damage (stacks ×3)', mult: 1.5 },
  { id: 'hourglass', icon: '⌛', name: 'Hourglass', desc: 'Ascend within 12 hours of starting the run.', reward: '+20% worker speed (stacks ×3)', mult: 2 },
  { id: 'hardcore', icon: '💀', name: 'Hardcore', desc: 'Dying once fails the challenge.', reward: '+5% damage & rare drops (stacks ×3)', mult: 2.5 },
];
const activeChal = () => S?.chal?.id && !S.chal.failed ? S.chal.id : null;
const chalDef = id => CHALLENGES.find(c => c.id === id);
function chalFail(why) { if (!S.chal?.id || S.chal.failed) return; S.chal.failed = true; if (!OFF) toast(`${chalDef(S.chal.id).icon} Challenge failed: ${why}`, 'warn', 6000); else OFFLOG.push(`Challenge failed: ${why}`); }
function chalBlock(kind) {
  const c = activeChal(); if (!c) return false;
  const bad = { buy: ['ironman'], hire: ['lonewolf'], fight: ['pacifist'] }[kind] || [];
  if (bad.includes(c)) { toast(`${chalDef(c).icon} ${chalDef(c).name} challenge: you can't do that this run.`, 'warn'); return true; }
  return false;
}
buy = (orig => function (id, q, p) { if (chalBlock('buy')) return; return orig(id, q, p); })(buy);
geBuy = (orig => function (id, q) { if (chalBlock('buy')) return; return orig(id, q); })(geBuy);
hire = (orig => function (st, k) { if (chalBlock('hire')) return; return orig(st, k); })(hire);
acadHire = (orig => function (sk, k) { if (chalBlock('hire')) return; return orig(sk, k); })(acadHire);
startFight = (orig => function (q) { if (activeChal() === 'pacifist') { if (!q) chalBlock('fight'); S.combat.fighting = false; return false; } return orig(q); })(startFight);
die = (orig => function () { orig(); if (activeChal() === 'hardcore') chalFail('you died'); })(die);
ascendGain = (orig => function () {
  let g = orig(); const c = activeChal();
  if (c && (c !== 'hourglass' || now() - (S.chal.t || 0) <= 12 * 3600e3)) g = Math.floor(g * chalDef(c).mult);
  if (relicOn('echo')) g = Math.floor(g * 1.5);
  return g;
})(ascendGain);
ascend = (orig => function () {
  const old = S, n = S.asc.count, c = activeChal();
  const okC = c && (c !== 'hourglass' || now() - (S.chal.t || 0) <= 12 * 3600e3);
  const next = S.nextChal || null;
  orig();
  if (S === old || S.asc.count === n) return;
  if (okC) { const L = S.lifetime.chal ||= {}; L[c] = (L[c] || 0) + 1; setTimeout(() => toast(`${chalDef(c).icon} Challenge complete: <b>${chalDef(c).name}</b>! Permanent reward: ${chalDef(c).reward}.`, 'pet', 8000), 600); }
  S.chal = next ? { id: next, t: now(), failed: false } : null; S.nextChal = null;
  rollRelicOffers(); recalc(); save();
})(ascend);
function chalPanel() {
  const L = S.lifetime.chal || {}, cur = S.chal;
  return `<div class="panel"><h3>🏁 Challenges <small class="muted">· optional rules for your next run</small></h3>
    ${cur?.id ? `<p class="small">This run: <b>${chalDef(cur.id).icon} ${chalDef(cur.id).name}</b> ${cur.failed ? '<span class="cb-red">✗ failed</span>' : `<span class="cb-green">✔ on track · runes & essence ×${chalDef(cur.id).mult}</span>`}${cur.id === 'hourglass' && !cur.failed ? ` · ${fmtTime(Math.max(0, 12 * 3600 - (now() - cur.t) / 1000))} left` : ''}</p>` : ''}
    <p class="muted small">Pick a challenge to start your <b>next</b> ascension with. Finish that run (ascend again) to earn a permanent reward that's kept forever, even through Transcendence.</p>
    <div class="list">${CHALLENGES.map(c => `<div class="upg ${S.nextChal === c.id ? 'got' : ''}"><div class="upg-icon">${c.icon}</div><div class="upg-main"><b>${c.name} <small class="muted">· done ${L[c.id] || 0}×</small></b><small>${c.desc} Runes & essence ×${c.mult}.</small><small class="y">🎁 ${c.reward}</small></div>
      <button class="btn small ${S.nextChal === c.id ? 'danger' : ''}" data-act="chal-pick" data-id="${c.id}">${S.nextChal === c.id ? 'Selected' : 'Select'}</button></div>`).join('')}</div></div>`;
}
viewAscension = (orig => function () { return orig().replace('<div class="panel"><h3>✨ Essence perks', relicPanel() + chalPanel() + '<div class="panel"><h3>✨ Essence perks'); })(viewAscension);
// show relics on the skills page too
viewSkills = (orig => function () {
  if (!S.relic) rollRelicOffers();
  const open = RELIC_TIERS.filter((n, i) => totalLevel() >= n && !S.relic.picks[i]).length;
  const tut = tutorialPanel();
  return tut + (open ? `<div class="panel glow row-between"><div>🔮 <b>${open} relic${open > 1 ? 's' : ''} to choose!</b><br><small class="muted">Powerful bonuses for this run</small></div><button class="btn" data-act="hub" data-id="ascension">Choose</button></div>` : '') + orig();
})(viewSkills);

/* ================= ECHO BOSSES (after Transcendence) ================= */
it7('echo_shard', 'Echo shard', 50000, 'shard', '#c8a8ff', { cat: 'misc', untradeable: true });
gear('ring_of_echoes', 'Ring of echoes', 'ring', [12, 12, 12], null, { kind: 'ring', tint: '#c8a8ff', ratk: 12, rstr: 4, matk: 12, mdmg: 4, untradeable: true, value: 1 });
gear('echo_cape', 'Echo cape', 'cape', [10, 10, 15], null, { kind: 'cape', tint: '#8a5ad8', trim: '#ffd84a', ratk: 10, rstr: 4, matk: 10, mdmg: 4, untradeable: true, value: 1 });
const ECHO_SRC = ['kbd', 'kalphite_queen', 'vorkath', 'zulrah', 'corp', 'nex', 'callisto', 'tob_verzik'].filter(id => MONSTER_BY_ID[id]);
ECHO_SRC.forEach(id => {
  const b = MONSTER_BY_ID[id];
  MON({ ...b, id: 'echo_' + id, name: 'Echo ' + b.name.replace(/^The /, ''), area: 'echo', raid: undefined, order: undefined, boss: true, hue: (b.hue || 0) + 180, lvl: b.lvl * 2, hp: Math.round(b.hp * 2.5), atk: Math.round(b.atk * 1.6), def: Math.round(b.def * 1.5), mh: Math.round(b.mh * 1.4), transReq: 1, minCombat: 110,
    drops: [['echo_shard', 1, 3, 8], ...b.drops.filter(d => !d[0].startsWith('pet:') && d[1] < 1).map(([i, c, a, bb]) => [i, Math.min(1, c * 3), a, bb]), ['ring_of_echoes', 1 / 300, 1, 1], ['echo_cape', 1 / 800, 1, 1]] });
});
canFight = (orig => function (m) { if (m.transReq && (S.trans?.count || 0) < m.transReq) return `Requires ${m.transReq} Transcendence`; return orig(m); })(canFight);
AREAS.push(['echo', '✴️ Echoes']);
const ECHO_PER_SHARD = 400;
viewCombat = (orig => function () {
  const h = orig(), area = UI.area || curMon().area;
  if (area !== 'echo' || UI.ctab !== 'monsters') return h;
  const t = S.trans?.count || 0;
  const panel = `<div class="panel glow"><h3>✴️ Echoes</h3><p class="small">${t ? 'Twisted reflections of the strongest bosses: 2.5× HP, harder hits, triple unique rates and <b>echo shards</b>.' : '🔒 Echo bosses appear once you have Transcended.'}</p>
    <p class="small">Echo shards: <b class="y">${fmt(have('echo_shard'))}</b>. Trade ${ECHO_PER_SHARD} for a <b>divine shard</b> to spend in the Pantheon.</p>
    <button class="btn ${have('echo_shard') >= ECHO_PER_SHARD ? '' : 'poor'}" data-act="echo-trade">Trade ${ECHO_PER_SHARD} → 1 ✴️ divine shard</button></div>`;
  const i = h.indexOf('<div class="list">'); return i > 0 ? h.slice(0, i) + panel + h.slice(i) : h + panel;
})(viewCombat);

/* ================= WAVE RUNS: FIGHT CAVES & INFERNO ================= */
it7('tokkul', 'Tokkul', 1, 'emblem', '#3a3a3a', { cat: 'misc' });
const CAVES = [], INFERNO = [];
[['fc_kih', 'Tz-Kih', '🦇', 22, 20, 30, 20, 4], ['fc_kek', 'Tz-Kek', '🪨', 45, 40, 50, 40, 7], ['fc_xil', 'Tok-Xil', '🦂', 90, 60, 90, 70, 13], ['fc_mejkot', 'Yt-MejKot', '🦍', 180, 120, 160, 120, 25], ['fc_zek', 'Ket-Zek', '🔥', 360, 200, 280, 200, 40]]
  .forEach(([id, n, ic, lvl, hp, atk, def, mh], i) => { MON({ id, name: n, icon: ic, lvl, hp, atk, def, mh, spd: 3, area: 'minigames', raid: 'caves', order: i, minCombat: 60, drops: [['tokkul', 1, lvl * 2, lvl * 4]] }); CAVES.push(id); });
MON({ ...MONSTER_BY_ID.jad, id: 'fc_jad', area: 'minigames', raid: 'caves', order: CAVES.length, boss: true, drops: [] }); CAVES.push('fc_jad');
[['inf_nibbler', 'Jal-Nib', '🐜', 32, 40, 80, 60, 5], ['inf_bat', 'Jal-MejRah', '🦇', 85, 80, 140, 100, 12], ['inf_blob', 'Jal-Ak', '🫧', 165, 160, 220, 160, 25], ['inf_meleer', 'Jal-ImKot', '🦍', 240, 220, 300, 220, 32], ['inf_ranger', 'Jal-Xil', '🏹', 370, 260, 380, 260, 40, 'ranged'], ['inf_mage', 'Jal-Zek', '🧙', 490, 320, 440, 300, 48, 'magic']]
  .forEach(([id, n, ic, lvl, hp, atk, def, mh, atype], i) => { MON({ id, name: n, icon: ic, lvl, hp, atk, def, mh, spd: 3, atype, area: 'minigames', raid: 'inferno', order: i, minCombat: 100, drops: [['tokkul', 1, lvl * 3, lvl * 5]] }); INFERNO.push(id); });
MON({ ...MONSTER_BY_ID.zuk, id: 'inf_zuk', area: 'minigames', raid: 'inferno', order: INFERNO.length, boss: true, sacrifice: undefined, drops: [] }); INFERNO.push('inf_zuk');

/* ================= GAUNTLET, NIGHTMARE, BARBARIAN ASSAULT ================= */
gear('bow_of_faerdhinen', 'Bow of faerdhinen', 'weapon', [0, 0, 0], { ranged: 80, agility: 70 }, { kind: 'longbow', tint: '#8ae8e8', wclass: 'ranged', ratk: 128, rstr: 106, spd: 1.0, value: 100000000 });
gear('blade_of_saeldor', 'Blade of saeldor', 'weapon', [94, 89, 0], { attack: 75 }, { kind: 'sword', tint: '#8ae8e8', spd: 0.9, value: 30000000 });
[['crystal_helm', 'Crystal helm', 'head', 'coif', 12, 30], ['crystal_body', 'Crystal body', 'body', 'dhidebody', 46, 80], ['crystal_legs', 'Crystal legs', 'legs', 'chaps', 26, 50]]
  .forEach(([id, n, slot, kind, ratk, def]) => gear(id, n, slot, [0, 0, def], { defence: 70, ranged: 70 }, { kind, tint: '#8ae8e8', ratk, rstr: 0, value: 20000000, crystal: true }));
PETS.youngllef = { name: 'Youngllef', icon: '🐰', st: 'combat', chance: 0, desc: '+3% combat max hit (Gauntlet pet)' };
const GAUNT = [], CGAUNT = [];
[['g_bear', 'Crystalline bear', '🐻', 90, 120, 100, 80, 14], ['g_dragon', 'Crystalline dragon', '🐉', 150, 180, 160, 120, 20], ['g_hunllef', 'Crystalline Hunllef', '🐇', 674, 600, 300, 200, 36]]
  .forEach(([id, n, ic, lvl, hp, atk, def, mh], i) => { MON({ id, name: n, icon: ic, hue: 160, lvl, hp, atk, def, mh, spd: 3, atype: i === 2 ? 'magic' : 'melee', area: 'minigames', raid: 'gauntlet', order: i, boss: i === 2, minCombat: 90, drops: [] }); GAUNT.push(id); });
[['cg_bear', 'Corrupted bear', '🐻', 180, 240, 200, 160, 24], ['cg_dragon', 'Corrupted dragon', '🐉', 300, 360, 300, 220, 32], ['cg_hunllef', 'Corrupted Hunllef', '🐇', 894, 1000, 450, 280, 48]]
  .forEach(([id, n, ic, lvl, hp, atk, def, mh], i) => { MON({ id, name: n, icon: ic, hue: 330, lvl, hp, atk, def, mh, spd: 3, atype: i === 2 ? 'ranged' : 'melee', area: 'minigames', raid: 'cgauntlet', order: i, boss: i === 2, minCombat: 110, drops: [] }); CGAUNT.push(id); });
const GAUNT_LOOT = [['crystal_helm', 3], ['crystal_body', 3], ['crystal_legs', 3], ['blade_of_saeldor', 1], ['bow_of_faerdhinen', 1]];
gear('inquisitors_great_helm', "Inquisitor's great helm", 'head', [4, 4, 22], { defence: 30, strength: 70 }, { kind: 'full_helm', tint: '#d8d0c0', value: 40000000 });
gear('inquisitors_hauberk', "Inquisitor's hauberk", 'body', [12, 6, 62], { defence: 30, strength: 70 }, { kind: 'platebody', tint: '#d8d0c0', value: 60000000 });
gear('inquisitors_plateskirt', "Inquisitor's plateskirt", 'legs', [8, 4, 44], { defence: 30, strength: 70 }, { kind: 'platelegs', tint: '#d8d0c0', value: 50000000 });
gear('nightmare_staff', 'Nightmare staff', 'weapon', [0, 0, 0], { magic: 65 }, { kind: 'staff', tint: '#5a3a8a', wclass: 'magic', cast: 'spell', matk: 16, mdmg: 15, spd: 1.0, value: 40000000 });
gear('eldritch_nightmare_staff', 'Eldritch nightmare staff', 'weapon', [0, 0, 0], { magic: 75 }, { kind: 'staff', tint: '#3a8ad8', wclass: 'magic', cast: 'celestial', matk: 28, mdmg: 15, spd: 1.0, value: 150000000 });
PETS.little_nightmare = { name: 'Little nightmare', icon: '👻', st: 'combat', chance: 0, desc: '+3% combat max hit' };
MON({ id: 'nightmare', name: 'The Nightmare', icon: '👁️‍🗨️', hue: 280, boss: true, lvl: 814, hp: 1100, atk: 450, def: 300, mh: 42, spd: 3, coins: [20000, 60000], area: 'bosses', weak: 'melee', minCombat: 110, atype: 'magic',
  drops: [['dragon_bones', 1, 3, 5], ['inquisitors_great_helm', 1 / 150, 1, 1], ['inquisitors_hauberk', 1 / 150, 1, 1], ['inquisitors_plateskirt', 1 / 150, 1, 1], ['nightmare_staff', 1 / 120, 1, 1], ['eldritch_nightmare_staff', 1 / 900, 1, 1], ['clue_elite', 1 / 40, 1, 1], ['pet:little_nightmare', 1 / 2500, 1, 1]] });
gear('fighter_torso', 'Fighter torso', 'body', [0, 4, 62], { defence: 40 }, { kind: 'platebody', tint: '#7a4a2a', untradeable: true, value: 1 });
gear('penance_gloves', 'Penance gloves', 'hands', [6, 6, 6], { defence: 40 }, { kind: 'gloves', tint: '#5a3a2a', untradeable: true, value: 1 });
gear('fighter_hat', 'Fighter hat', 'head', [0, 3, 10], { defence: 45 }, { kind: 'hat', tint: '#c84a2a', untradeable: true, value: 1 });
const BA_SHOP = [['fighter_torso', 150], ['penance_gloves', 80], ['fighter_hat', 120]];
const BAWAVES = [];
for (let i = 1; i <= 9; i++) { MON({ id: 'ba_w' + i, name: `Penance wave ${i}`, icon: '👹', hue: i * 20, lvl: 30 + i * 12, hp: 40 + i * 18, atk: 30 + i * 12, def: 20 + i * 10, mh: 4 + i * 2, spd: 2.6, area: 'minigames', raid: 'ba', order: i - 1, minCombat: 40, drops: [] }); BAWAVES.push('ba_w' + i); }
MON({ id: 'ba_queen', name: 'Penance Queen', icon: '👑', hue: 0, lvl: 209, hp: 400, atk: 180, def: 120, mh: 22, spd: 3, area: 'minigames', raid: 'ba', order: 9, boss: true, minCombat: 40, drops: [] }); BAWAVES.push('ba_queen');

const RUNS = {
  caves: { list: CAVES, name: 'Fight Caves', icon: '🌋', done: m => { add('fire_cape', 1); logItem('fire_cape', 1); add('tokkul', 8000); return 'a Fire cape and 8,000 tokkul'; }, desc: 'Five waves of TzHaar, then TzTok-Jad. Rewards a Fire cape and tokkul. Combat 60+.' },
  inferno: { list: INFERNO, name: 'Inferno', icon: '☄️', need: () => have('fire_cape') || S.equip.cape === 'fire_cape', needTxt: 'Bring a Fire cape (it is sacrificed)', start: () => { if (have('fire_cape')) remove('fire_cape', 1); else S.equip.cape = null; recalc(); },
    done: m => { add('infernal_cape', 1); logItem('infernal_cape', 1); add('tokkul', 16000); if (rnd() < 1 / 100 * M.luck) givePet('jal_nib_rek'); return 'an Infernal cape and 16,000 tokkul'; }, desc: 'Six waves of Jal, then TzKal-Zuk. Costs a Fire cape. Rewards an Infernal cape. Combat 100+.' },
  gauntlet: { list: GAUNT, name: 'The Gauntlet', icon: '🐇', done: () => gauntLoot(1 / 14, 1 / 2000), desc: 'Crystalline creatures then the Hunllef. 1/14 chance per run of crystal armour, Blade of saeldor or Bow of faerdhinen. Combat 90+.' },
  cgauntlet: { list: CGAUNT, name: 'Corrupted Gauntlet', icon: '🩸', need: () => (S.raids?.gauntlet || 0) >= 10, needTxt: 'Complete the Gauntlet 10 times', done: () => gauntLoot(1 / 6, 1 / 800), desc: 'The Corrupted Hunllef: much harder, 1/6 purple chance. Unlocks after 10 Gauntlet runs.' },
  ba: { list: BAWAVES, name: 'Barbarian Assault', icon: '🪓', done: () => { S.ba = (S.ba || 0) + 25; return '25 honour points'; }, desc: 'Nine Penance waves, then the Queen. 25 honour points per run for the Fighter torso, Penance gloves and Fighter hat. Combat 40+.' },
};
function gauntLoot(p, pet) {
  if (rnd() < p * M.luck) { const u = pickWeighted(GAUNT_LOOT); rareGet(u, 1, 'drop'); logItem(u, 1); if (rnd() < pet * 50) givePet('youngllef'); return '💜 ' + ITEMS[u].name; }
  const c = randInt(20000, 60000); gainCoins(c); add('cut_dragonstone', randInt(1, 3)); return `🪙${fmt(c)} and dragonstones`;
}
raidKill = (orig => function (m) {
  const run = RUNS[m.raid]; if (!run) return orig(m);
  if (m.order < run.list.length - 1) { S.combat.mon = run.list[m.order + 1]; UI.force = true; return; }
  const R = S.raids ||= {}; R[m.raid] = (R[m.raid] || 0) + 1;
  const got = run.done(m);
  const msg = `${run.icon} ${run.name} complete (${R[m.raid]}): ${got}`;
  if (OFF) OFFLOG.push(msg); else { toast(msg, String(got).startsWith('💜') || m.raid === 'inferno' ? 'pet' : 'rare', 7000); SFX.play('clue'); }
  if (run.start || m.raid === 'caves' || m.raid === 'inferno') { retreat(); S.combat.mon = run.list[0]; } else S.combat.mon = run.list[0];
  UI.force = true;
})(raidKill);
viewCombat = (orig => function () {
  const h = orig(), area = UI.area || curMon().area;
  if (area !== 'minigames' || UI.ctab !== 'monsters') return h;
  const R = S.raids || {}, cur = curMon();
  const panel = Object.entries(RUNS).map(([k, r]) => { const lock = r.need && !r.need(); const at = cur.raid === k ? cur.order : -1;
    return `<div class="panel"><h3>${r.icon} ${r.name} <small class="muted">· ${fmt(R[k] || 0)} completions</small></h3><p class="small">${r.desc}</p>
      ${at >= 0 ? `<p class="small">Wave ${at + 1}/${r.list.length}: <b>${cur.name}</b></p>` : ''}
      ${k === 'ba' ? `<p class="small">Honour points: <b class="y">${fmt(S.ba || 0)}</b></p><div class="chips">${BA_SHOP.map(([id, c]) => `<button class="chip ${(S.ba || 0) < c ? 'locked' : ''}" data-act="ba-buy" data-id="${id}">${itemIcon(id)} ${ITEMS[id].name} · ${c}</button>`).join('')}</div>` : ''}
      <button class="btn big ${lock ? 'disabled' : ''}" data-act="run-start" data-id="${k}">${lock ? '🔒 ' + r.needTxt : S.combat.fighting && cur.raid === k ? 'In progress…' : 'Start'}</button></div>`; }).join('');
  const i = h.indexOf('<div class="list">'); return i > 0 ? h.slice(0, i) + panel + h.slice(i) : h + panel;
})(viewCombat);

/* ================= SKILLING MINIGAMES: Giants' Foundry & Guardians of the Rift ================= */
OUTFITS.smith = ['smithing', '#5a5a6a', "Smiths'"]; OUTFITS.raiments = ['runecrafting', '#3ac8a8', 'Raiments'];
['smith', 'raiments'].forEach(k => { const [sk, tint, name] = OUTFITS[k]; OUTFIT_PIECES.forEach(([p, slot, kind]) => gear(`${k}_${p}`, `${name} ${p}`, slot, [0, 0, 0], null, { kind, tint, outfit: k, untradeable: true, value: 50000, rare: true })); });
it7('foundry_crate', "Kovac's crate", 1, 'crate', '#5a5a6a', { cat: 'misc', open: true });
it7('gotr_pouch', 'Rewards guardian pouch', 1, 'crate', '#3ac8a8', { cat: 'misc', open: true });
PETS.abyssal_protector = { name: 'Abyssal protector', icon: '👁️', st: null, chance: 0, desc: '+5% Runecrafting speed' };
PETS.kovac = { name: 'Little Kovac', icon: '🔨', st: null, chance: 0, desc: '+5% Smithing speed' };
CRATES.foundry_crate = { outfit: 'smith', pet: 'kovac', loot: [['coins', 500, 4000], ['steel_bar', 5, 15], ['mithril_bar', 3, 10], ['adamant_bar', 2, 6], ['rune_bar', 1, 2]] };
CRATES.gotr_pouch = { outfit: 'raiments', pet: 'abyssal_protector', loot: [['coins', 300, 3000], ['nature_rune', 20, 60], ['law_rune', 15, 40], ['death_rune', 10, 30], ['pure_essence', 50, 150]] };
A7({ id: 'a_giants_foundry', st: 'anvil', name: "⚒️ Giants' Foundry commission", lvl: 15, xp: 140, hp: 14, inp: { steel_bar: 2 }, out: {}, icon: 'foundry_crate', crate: ['foundry_crate', 1 / 8] });
A7({ id: 'rc_gotr', st: 'runealtar', name: '🌀 Guardians of the Rift', lvl: 27, xp: 55, hp: 8, inp: { pure_essence: 2 }, out: { cosmic_rune: 1, nature_rune: 1 }, icon: 'gotr_pouch', crate: ['gotr_pouch', 1 / 10] });
recalc4 = (orig => function () { orig(); if (!S.asc) return; if (S.pets.kovac) { M.rate.anvil *= 1.05; M.rate.furnace *= 1.05; } if (S.pets.abyssal_protector) M.rate.runealtar *= 1.05; })(recalc4);

/* ================= MORE QUESTS ================= */
QUESTS.push(
  { id: 'fremmy', name: 'The Fremennik Trials', icon: '🛶', qp: 3, req: { skills: { fletching: 25, crafting: 40, woodcutting: 40 } }, xp: { strength: 2800, defence: 2800, attack: 2800 }, give: { helm_of_neitiznot: 1 }, buff: { sk: { crafting: 1.05 } }, txt: 'Helm of neitiznot · +5% Crafting XP' },
  { id: 'sotf', name: 'Sins of the Father', icon: '🧛', qp: 2, req: { qp: 35, skills: { woodcutting: 62, fletching: 60, crafting: 56, agility: 52, slayer: 50, magic: 49 } }, xp: { woodcutting: 15000, fletching: 15000 }, buff: { st: { forest: 1.1, fletch: 1.1 } }, txt: '+10% Woodcutting & Fletching speed' },
  { id: 'mm2', name: 'Monkey Madness II', icon: '🦍', qp: 4, req: { qp: 40, skills: { slayer: 69, crafting: 70, hunter: 60, agility: 55, thieving: 55, firemaking: 60 }}, xp: { slayer: 25000, agility: 20000, thieving: 20000, hunter: 20000 }, give: { zenyte_shard: 1 }, buff: { st: { thieve: 1.1, hunt: 1.1 } }, txt: 'A zenyte shard · +10% Thieving & Hunter speed' },
  { id: 'wgs', name: 'While Guthix Sleeps', icon: '🌳', qp: 5, req: { qp: 60, skills: { thieving: 72, magic: 67, agility: 66, farming: 65, herblore: 65, hunter: 62 } }, xp: { magic: 40000, farming: 40000, herblore: 40000 }, buff: { luck: 1.05, xp: 1.03 }, txt: '+5% rare drops & +3% all XP' },
  { id: 'legends', name: "Legends' Quest", icon: '🏆', qp: 4, req: { qp: 70, skills: { agility: 50, crafting: 50, herblore: 45, magic: 56, mining: 52, prayer: 42, smithing: 50, strength: 50, thieving: 50, woodcutting: 50 } }, xp: { strength: 15000, defence: 15000, prayer: 15000 }, coins: 500000, buff: { allst: 1.05 }, txt: "Legends' cape · every worker +5%" });
QP_TOTAL = QUESTS.reduce((a, q) => a + q.qp, 0);

/* ================= GETTING STARTED (tutorial) ================= */
const TUT = [
  ['Tap the Mine 10 times', () => S.lifetime.taps >= 10, 100], ['Hire your first worker', () => Object.values(S.workers).some(n => n > 0), 200],
  ['Smelt a bronze bar', () => have('bronze_bar') || LV.smithing >= 2, 300], ['Equip a weapon', () => !!S.equip.weapon, 300],
  ['Kill a monster', () => S.lifetime.kills >= 1, 400], ['Buy an upgrade', () => Object.keys(S.upgrades).length >= 1, 500], ['Reach total level 100', () => totalLevel() >= 100, 2000]];
function tutorialPanel() {
  const T = S.lifetime.tut ||= {}; if (T.done || S.asc.count > 0 || (S.trans?.count || 0) > 0) return '';
  let changed = false; TUT.forEach(([n, f, c], i) => { if (!T[i] && f()) { T[i] = 1; gainCoins(c); changed = true; if (!OFF) toast(`✅ ${n}: +🪙${c}`, 'rare'); } });
  if (TUT.every((x, i) => T[i])) { T.done = 1; add('xp_lamp', 2); toast('🎓 Tutorial complete! Have 2 XP lamps.', 'pet'); return ''; }
  return `<div class="panel tut"><h3>🎓 Getting started</h3>${TUT.map(([n, , c], i) => `<div class="${T[i] ? 'cb-green' : ''}">${T[i] ? '✔' : '○'} ${n} <small class="muted">+🪙${c}</small></div>`).join('')}</div>`;
}

/* ---------- logs, sources, achievements, indexes ---------- */
(function () {
  const page = (id, name, icon, cat, items) => CLOG.push({ id, name, icon, cat, items });
  page('echo', 'Echoes', '✴️', 'Bosses', ['ring_of_echoes', 'echo_cape']);
  page('gauntlet', 'The Gauntlet', '🐇', 'Minigames', [...GAUNT_LOOT.map(x => x[0]), 'pet:youngllef']);
  page('nightmare', 'The Nightmare', '👁️‍🗨️', 'Bosses', ['inquisitors_great_helm', 'inquisitors_hauberk', 'inquisitors_plateskirt', 'nightmare_staff', 'eldritch_nightmare_staff', 'pet:little_nightmare']);
  page('ba', 'Barbarian Assault', '🪓', 'Minigames', BA_SHOP.map(x => x[0]));
  page('skillmini', 'Foundry & Rift', '⚒️', 'Skilling', [...['smith', 'raiments'].flatMap(k => OUTFIT_PIECES.map(([p]) => `${k}_${p}`)), 'pet:kovac', 'pet:abyssal_protector']);
  CLOG.flatMap(p => p.items).forEach(i => CLOG_ITEMS.add(i));
  const addS = (id, s) => (SOURCES[id] ||= []).push(s);
  GAUNT_LOOT.forEach(([id]) => addS(id, 'The Gauntlet / Corrupted Gauntlet'));
  BA_SHOP.forEach(([id, c]) => addS(id, `Barbarian Assault (${c} honour points)`));
  ['smith', 'raiments'].forEach(k => OUTFIT_PIECES.forEach(([p]) => addS(`${k}_${p}`, (k === 'smith' ? "Giants' Foundry crates" : 'Guardians of the Rift pouches') + ' · +2.5% XP each (just own it)')));
  addS('echo_shard', 'Echo bosses (after Transcending)'); addS('ring_of_echoes', 'Echo bosses (1/300)'); addS('echo_cape', 'Echo bosses (1/800)');
  addS('fire_cape', 'Fight Caves run'); addS('infernal_cape', 'Inferno run');
  ach('relic_4', 'Relic Hunter', 'Pick all four relics in one run', '🔮', g => Object.keys(g.S.relic?.picks || {}).length >= 4, 15);
  ach('chal_1', 'Challenger', 'Complete an ascension challenge', '🏁', g => Object.keys(g.S.lifetime.chal || {}).length >= 1, 20);
  ach('chal_all', 'Master of Trials', 'Complete every challenge', '🏆', g => CHALLENGES.every(c => g.S.lifetime.chal?.[c.id]), 75);
  ach('inferno_run', 'Into the Fire', 'Complete an Inferno run', '☄️', g => (g.S.raids?.inferno || 0) >= 1, 40);
  ach('cg_1', 'Corrupted', 'Complete the Corrupted Gauntlet', '🩸', g => (g.S.raids?.cgauntlet || 0) >= 1, 30);
  ach('echo_kill', 'Echo Slayer', 'Defeat an Echo boss', '✴️', g => Object.keys(g.S.kills).some(k => k.startsWith('echo_')), 30);
})();
for (const m of MONSTERS) MONSTER_BY_ID[m.id] = m;
Object.keys(ITEMS).forEach(id => { if (!(id in ITEM_ORDER)) ITEM_ORDER[id] = Object.keys(ITEM_ORDER).length; });
for (const id of ['bow_of_faerdhinen', 'blade_of_saeldor', 'crystal_helm', 'crystal_body', 'crystal_legs', 'inquisitors_great_helm', 'inquisitors_hauberk', 'inquisitors_plateskirt', 'nightmare_staff', 'eldritch_nightmare_staff']) if (!GE_SET.has(id)) { GE_ITEMS.push(id); GE_SET.add(id); }
ensureTargets = (orig => function () { orig(); for (const st of STATION_ORDER) if (!S.target[st] || !ACTIONS[S.target[st]]) S.target[st] = STATION_ACTIONS[st][0].id; })(ensureTargets);

/* ---------- views & input ---------- */
Object.assign(VIEWS, { ascension: viewAscension, combat: viewCombat, skills: viewSkills });
viewSig = (orig => function () {
  if (UI.view === 'ascension') return orig() + JSON.stringify(S.relic || {}) + JSON.stringify(S.chal || {}) + S.nextChal + totalLevel();
  if (UI.view === 'skills') return orig() + JSON.stringify(S.relic?.picks || {}) + RELIC_TIERS.filter(n => totalLevel() >= n).length + JSON.stringify(S.lifetime.tut || {});
  if (UI.view === 'combat' && UI.ctab === 'monsters') return orig() + JSON.stringify(S.raids || {}) + (S.ba || 0) + have('echo_shard') + have('fire_cape');
  return orig();
})(viewSig);

document.addEventListener('click', e => {
  if (e.target.closest('[data-nav]')) return;
  const t = e.target.closest('[data-act]'); if (!t) return;
  const d = t.dataset; let h = true;
  switch (d.act) {
    case 'relic': { const i = +d.i; if (!S.relic || S.relic.picks[i] || totalLevel() < RELIC_TIERS[i]) break; S.relic.picks[i] = d.id; recalc(); const r = relicDef(d.id); toast(`${r.icon} Relic chosen: <b>${r.name}</b> (${r.desc})`, 'pet'); SFX.play('ach'); break; }
    case 'chal-pick': S.nextChal = S.nextChal === d.id ? null : d.id; break;
    case 'echo-trade': if (have('echo_shard') < ECHO_PER_SHARD) { toast(`You need ${ECHO_PER_SHARD} echo shards.`, 'warn'); break; } remove('echo_shard', ECHO_PER_SHARD); (S.trans ||= { count: 0, shards: 0, perks: {} }).shards++; toast('✴️ The shards fuse into a divine shard!', 'pet'); SFX.play('pet'); break;
    case 'run-start': { const r = RUNS[d.id]; if (!r) break; const cur = curMon(); if (S.combat.fighting && cur.raid === d.id) break; if (r.need && !r.need()) { toast('🔒 ' + r.needTxt, 'warn'); break; } if (S.combat.fighting) retreat(); r.start?.(); S.combat.mon = r.list[0]; startFight(); break; }
    case 'ba-buy': { const it = BA_SHOP.find(x => x[0] === d.id); if ((S.ba || 0) < it[1]) { toast(`You need ${it[1]} honour points.`, 'warn'); break; } S.ba -= it[1]; add(it[0], 1); logItem(it[0], 1); toast(`🪓 You receive a ${ITEMS[it[0]].name}.`, 'rare'); break; }
    default: h = false;
  }
  if (h) { e.stopImmediatePropagation(); UI.force = true; render(); liveUpdate(); }
}, true);
