'use strict';
/* =========================================================
   CLICKSCAPE v9.14 — the Monsters tab, rebuilt
   Regions you unlock by beating each region's champion, one simple Bosses grid,
   Activities as plain cards (what it is, what it gives, Start), and a Slayer page.
   ========================================================= */

/* ================= REGIONS ================= */
// overworld monsters and bosses are sorted into regions by level; other areas keep their own region
const REGIONS = [
  { id: 'farm',  icon: '🌾', name: 'Meadowlands',     desc: 'Farm animals and goblins. Everyone starts here.', band: [1, 12] },
  { id: 'wood',  icon: '🌲', name: 'Darkwood',        desc: 'Skeletons, guards and the first giants.', band: [13, 35], from: 'farm' },
  { id: 'hills', icon: '⛰️', name: "Giants' Foothills", desc: 'Ogres, cyclopes, ice wolves and trolls.', band: [36, 75], from: 'wood' },
  { id: 'wild',  icon: '☠️', name: 'Wilderness',      desc: 'Revenants and the wilderness bosses. Wilderness weapons hit harder here.', area: 'wild', from: 'hills' },
  { id: 'waste', icon: '🔥', name: 'Demon Wastes',    desc: 'Demons, fire giants and the first dragons.', band: [76, 105], from: 'hills' },
  { id: 'gwd',   icon: '⚔️', name: 'God Wars',        desc: "The gods' armies. Their kill count opens the generals' chambers.", area: 'gwd', from: 'waste' },
  { id: 'peaks', icon: '🐉', name: 'Dragon Peaks',    desc: 'Chromatic and metal dragons, demons and golems.', band: [106, 240], from: 'waste' },
  { id: 'lairs', icon: '⚒️', name: 'Metal Lairs',     desc: 'Steel to rune dragons, and the classic bosses.', band: [241, 420], from: 'peaks' },
  { id: 'deep',  icon: '🌑', name: 'The Deep',        desc: 'The strongest bosses of the old world.', band: [421, 99999], from: 'lairs' },
  { id: 'beyond', icon: '🌠', name: 'Beyond',         desc: 'Starborn creatures past the edge of the map.', area: 'beyond', from: 'lairs' },
  { id: 'rift',  icon: '🌌', name: 'The Rift',        desc: 'Only the ascended may enter. Each tier needs more ascensions.', area: 'rift', asc: 1 },
  { id: 'event', icon: '🎉', name: 'Event',           desc: 'Seasonal monsters, here for a limited time.', area: 'event', event: true },
];
const REG_BY_ID = Object.fromEntries(REGIONS.map(r => [r.id, r]));
const GATE_KILLS = 10;
function regionOf(m) {
  if (!m || m.raid || m.barrows) return null;
  if (m.area === 'slayer' || (m.sl && m.area === 'bosses')) return 'slayer';
  if (m.area === 'echo') return 'echo';
  if (m.season) return 'event';
  const R = REGIONS.find(r => r.area === m.area); if (R) return R.id;
  if (m.area === 'overworld' || m.area === 'bosses') { const B = REGIONS.find(r => r.band && m.lvl >= r.band[0] && m.lvl <= r.band[1]); return B ? B.id : 'deep'; }
  return null;
}
const REG_CACHE = {};
const regMons = id => { const L = REG_CACHE[id] ||= MONSTERS.filter(m => regionOf(m) === id).sort((a, b) => a.lvl - b.lvl); return id === 'event' ? L.filter(m => m.season === activeSeason()?.id) : L; };
const CHAMP = {};
// a region's champion is its strongest regular monster: beat it 10 times to open the next region
const champion = id => id in CHAMP ? CHAMP[id] : (CHAMP[id] = regMons(id).filter(m => !m.boss).pop() || null);
const lifeKills = id => Math.max(S.lifetime?.mk?.[id] || 0, S.kills?.[id] || 0);
function regOpen(id) {
  const R = REG_BY_ID[id]; if (!R) return true;
  const U = S.lifetime.regions ||= {};
  if (U[id]) return true;
  let ok = false;
  if (R.event) ok = true;
  else if (R.asc) ok = lifeAsc() >= R.asc || tcount() > 0 || apoCount() > 0;
  else if (!R.from) ok = true;
  else { const c = champion(R.from); ok = !c || (regOpen(R.from) && lifeKills(c.id) >= GATE_KILLS); }
  if (ok && !R.event) U[id] = 1;
  return ok;
}
function gateText(id) {
  const R = REG_BY_ID[id];
  if (R.asc) return `Ascend ${R.asc} time${R.asc > 1 ? 's' : ''}`;
  const F = REG_BY_ID[R.from], c = champion(R.from);
  if (!regOpen(R.from)) return `Unlock ${F.name} first`;
  return `Kill ${GATE_KILLS} × ${c.name} in ${F.name} (${Math.min(GATE_KILLS, lifeKills(c.id))}/${GATE_KILLS})`;
}
// existing saves: open every region already reached, so nobody gets locked out of their spot
function grandfatherRegions() {
  const U = S.lifetime.regions ||= {}; if (U._v) return; U._v = 1;
  const open = lifeAsc() > 0 || tcount() > 0 || apoCount() > 0;
  for (const R of REGIONS) if (open || regMons(R.id).some(m => (S.kills?.[m.id] || 0) > 0)) U[R.id] = 1;
  U.farm = 1;
  // opening a region opens the path to it
  let ch = true; while (ch) { ch = false; for (const R of REGIONS) if (U[R.id] && R.from && !U[R.from]) { U[R.from] = 1; ch = true; } }
}
const clueMonId = () => { const s = S.clues?.active?.steps?.[S.clues.active.idx]; return s?.mon; };
canFight = (orig => function (m) {
  const r = regionOf(m);
  if (r && REG_BY_ID[r] && !regOpen(r) && !onTask(m) && clueMonId() !== m.id) return `🗺️ ${REG_BY_ID[r].name} is locked: ${gateText(r)}`;
  return orig(m);
})(canFight);
// lifetime kills per monster (regions stay unlocked through every reset)
killMonster = (orig => function (m) {
  const r = orig.apply(this, arguments);
  if (m && S.lifetime) {
    const K = S.lifetime.mk ||= {}; K[m.id] = (K[m.id] || 0) + 1;
    if (K[m.id] === GATE_KILLS) for (const R of REGIONS) if (R.from && champion(R.from)?.id === m.id && !S.lifetime.regions?.[R.id] && regOpen(R.id)) {
      const msg = `🗺️ New region unlocked: ${R.icon} ${R.name}!`; if (OFF) OFFLOG.push(msg); else toast(msg, 'pet', 6000);
    }
  }
  return r;
})(killMonster);

/* ================= ROWS & TILES ================= */
const lvlCol = x => { const d = x.lvl - combatLevel(); return d > 10 ? 'red' : d > 0 ? 'orange' : d > -10 ? 'yellow' : 'green'; };
function monRow(x, champ) {
  const err = canFight(x), task = onTask(x), on = S.combat.mon === x.id, kc = lifeKills(x.id), req = monReqs(x).filter(r => !/^Combat /.test(r) || err);
  const lockTxt = err ? String(err).replace(/^🗺️ /, '') : '';
  return `<button class="act-row mrow ${on ? 'on' : ''} ${err ? 'locked' : ''}" data-act="mon-pick" data-id="${x.id}">
    <span class="ar-icon emo-big" style="${monFilter(x)}">${x.icon}</span>
    <span class="ar-main"><b>${x.name}${x.boss ? ' 👑' : ''}${task ? ' <span class="pill">TASK</span>' : ''}${champ ? ' <span class="pill champ">CHAMPION</span>' : ''}</b>
      <small><span class="cb-${lvlCol(x)}">Lv ${fmt(x.lvl)}</span> · ${fmt(x.hp)} HP${kc ? ` · ${fmt(kc)} kills` : ''}${on && S.combat.fighting ? ' · <span class="y">fighting</span>' : ''}</small>
      ${err ? `<small class="reqs bad">🔒 ${lockTxt}</small>` : req.length ? `<small class="reqs">${req.join(' · ')}</small>` : ''}</span>
    <span class="info-btn" data-act="moninfo" data-id="${x.id}">📋</span></button>`;
}
function bossTile(x) {
  const err = canFight(x), kc = lifeKills(x.id);
  return `<button class="boss-tile ${err ? 'locked' : ''} ${S.combat.mon === x.id ? 'on' : ''}" data-act="moninfo" data-id="${x.id}">
    <span class="bt-icon" style="${monFilter(x)}">${x.icon}</span><b>${x.name}</b><small><span class="cb-${lvlCol(x)}">Lv ${fmt(x.lvl)}</span>${kc ? ` · ${fmt(kc)} KC` : ''}</small>${err ? '<span class="bt-lock">🔒</span>' : ''}</button>`;
}

/* ================= REGIONS PAGE ================= */
function regionsGrid() {
  const cur = regionOf(curMon());
  return `<div class="reg-grid">${REGIONS.filter(R => !R.event || regMons('event').length).map(R => {
    const L = regMons(R.id), open = regOpen(R.id), nb = L.filter(m => m.boss).length, nm = L.length - nb;
    const lo = L[0]?.lvl || 0, hi = L[L.length - 1]?.lvl || 0;
    return `<button class="reg-card ${open ? '' : 'locked'} ${cur === R.id ? 'here' : ''}" data-act="reg-open" data-id="${R.id}">
      <span class="rc-icon">${R.icon}</span><b>${R.name}</b><small>Lv ${fmt(lo)}–${fmt(hi)}</small>
      <small class="rc-st">${open ? `${nm ? `${nm} monster${nm > 1 ? 's' : ''}` : ''}${nm && nb ? ' · ' : ''}${nb ? `${nb} boss${nb > 1 ? 'es' : ''}` : ''}` : '🔒 ' + gateText(R.id)}</small>
      ${cur === R.id ? '<span class="rc-here">⚔️ here</span>' : ''}</button>`;
  }).join('')}</div>`;
}
function regionPage(id) {
  const R = REG_BY_ID[id], L = regMons(id), open = regOpen(id), mons = L.filter(m => !m.boss), bosses = L.filter(m => m.boss);
  const ch = champion(id), next = REGIONS.filter(n => n.from === id);
  let extra = '';
  if (id === 'gwd') extra = `<div class="panel small"><b>Kill count</b> <small class="muted">· kill a god's soldiers to build it; entering a general's chamber costs ${GWD_KC}</small><div class="kc-grid">${Object.entries(GODS).map(([g, n]) => `<div class="kc"><span class="dot" style="background:${GOD_TINT[g]}"></span>${n}<b>${fmt(S.kc[g] || 0)}</b></div>`).join('')}</div></div>`;
  if (id === 'rift') extra = `<div class="panel small muted">Rift monsters drop rift essence, celestial bones, master clues and celestial cores. You have ascended ${lifeAsc()} time${lifeAsc() === 1 ? '' : 's'}.</div>`;
  const gate = ch && next.length ? `<div class="panel small gate">🏆 <b>Champion: ${ch.name}</b> · beat it ${GATE_KILLS} times to open ${next.map(n => `${n.icon} ${n.name}`).join(' and ')} <b class="y">(${Math.min(GATE_KILLS, lifeKills(ch.id))}/${GATE_KILLS})</b>${next.every(n => regOpen(n.id)) ? ' ✔' : ''}</div>` : '';
  return `<div class="panel reg-head"><button class="btn small" data-act="reg-back">‹ Regions</button><div><b>${R.icon} ${R.name}</b><small>${R.desc}</small></div></div>
    ${open ? '' : `<div class="panel small warnbox">🔒 Locked: ${gateText(id)}</div>`}${gate}${extra}
    ${mons.length ? `<div class="list">${mons.map(m => monRow(m, ch && m.id === ch.id && next.length)).join('')}</div>` : ''}
    ${bosses.length ? `<h3 class="sec-h">👑 Bosses</h3><div class="list">${bosses.map(m => monRow(m)).join('')}</div>` : ''}`;
}

/* ================= BOSSES PAGE ================= */
function bossesPage() {
  const groups = [...REGIONS.map(R => [R.icon + ' ' + R.name, R.id]), ['💀 Slayer', 'slayer'], ['✴️ Echoes', 'echo']];
  return `<div class="panel small muted">Every boss in one place. Tap one for its drops and the Fight button. Bosses open with their region.</div>` +
    groups.map(([n, id]) => {
      if (id === 'echo' && !tcount() && !apoCount()) return '';
      const L = MONSTERS.filter(m => m.boss && !m.raid && regionOf(m) === id && (id !== 'event' || m.season === activeSeason()?.id)).sort((a, b) => a.lvl - b.lvl);
      if (!L.length) return '';
      return `<h3 class="sec-h">${n}${REG_BY_ID[id] && !regOpen(id) ? ' <small class="muted">🔒</small>' : ''}</h3><div class="boss-grid">${L.map(bossTile).join('')}</div>`;
    }).join('');
}

/* ================= ACTIVITIES PAGE ================= */
const ACTS = [];
const actProg = (key, list) => { const cur = curMon(); return S.combat.fighting && cur.raid === key ? `room ${cur.order + 1}/${list.length}` : ''; };
ACTS.push({ k: 'barrows', grp: 'Minigames', icon: '⚱️', name: 'Barrows', line: 'Beat six brothers in a row, then open their chest.', first: 'barrows_ahrim', btn: ['barrows-run'],
  clears: () => S.barrows.chests || 0, prog: () => { const c = curMon(); return S.combat.fighting && c.barrows ? `${S.barrows.killed.length}/6 brothers` : S.barrows.killed.length ? `${S.barrows.killed.length}/6 brothers beaten` : ''; },
  uniques: () => BARROWS.flatMap(b => b.pieces.map(p => p[0])), info: 'Each chest: coins, bolts, sometimes a hard clue, and a 1 in 12 chance of a Barrows piece. A full set of one brother gives his famous effect.' });
ACTS.push({ k: 'pc', grp: 'Minigames', icon: '🛡️', name: 'Pest Control', line: 'Destroy four portals. Each win gives 12 points for Void armour.', first: PC_RUN[0], btn: ['pc-start'], raid: 'pc', list: PC_RUN,
  clears: () => S.pc?.games || 0, extra: () => `${fmt(S.pc?.pts || 0)} points`, shop: 'pc',
  info: 'Full Void (top, robe, gloves and a helm) gives +10% accuracy and damage for that helm\'s style (ranged +12.5%). Elite Void adds +5% more.' });
Object.entries(RUNS).forEach(([k, r]) => ACTS.push({ k, grp: 'Minigames', icon: r.icon, name: r.name, line: r.desc.split('. ')[0] + '.', first: r.list[0], btn: ['run-start', k], raid: k, list: r.list,
  clears: () => S.raids?.[k] || 0, need: r.need ? () => r.need() ? '' : r.needTxt : null, shop: k === 'ba' ? 'ba' : null, extra: k === 'ba' ? () => `${fmt(S.ba || 0)} honour` : null,
  uniques: () => k === 'caves' ? ['fire_cape'] : k === 'inferno' ? ['infernal_cape'] : k.includes('gauntlet') ? GAUNT_LOOT.map(u => u[0]) : k === 'ba' ? BA_SHOP.map(u => u[0]) : [], info: r.desc }));
ACTS.push({ k: 'cox', grp: 'Raids', icon: '🏛️', name: 'Chambers of Xeric', line: 'Four rooms, then the Great Olm. 1 in 9 chance of a purple each clear.', first: RAID_COX[0], btn: ['raid-start'], raid: 'cox', list: RAID_COX,
  clears: () => S.raids?.cox || 0, uniques: () => COX_UNIQUES.map(u => u[0]), info: 'Prayer scrolls (unlock Rigour and Augury), Dragon hunter crossbow, Twisted buckler, Dinh\'s bulwark, Ancestral robes, Dragon claws, Elder maul, Kodai wand or the Twisted bow. Raids loop while you keep fighting.' });
ACTS.push({ k: 'tob', grp: 'Raids', icon: '🩸', name: 'Theatre of Blood', line: 'Six rooms ending with Verzik Vitur. 1 in 9 purple chance.', first: RAID_TOB[0], btn: ['tob-start'], raid: 'tob', list: RAID_TOB,
  clears: () => S.raids?.tob || 0, uniques: () => TOB_UNIQUES.map(u => u[0]), info: 'Avernic defender hilt, Ghrazi rapier, Sanguinesti staff (heals you), Justiciar armour or the Scythe of vitur (hits up to 3 times).' });
ACTS.push({ k: 'toa', grp: 'Raids', icon: '⚱️', name: 'Tombs of Amascut', line: 'Five bosses. Raise the raid level for tougher fights and better odds.', first: RAID_TOA[0], btn: ['toa-start'], raid: 'toa', list: RAID_TOA,
  clears: () => S.raids?.toa || 0, extra: () => `raid level ${S.raids?.toaLvl || 0}`, uniques: () => TOA_UNIQUES.map(u => u[0]), toa: true,
  info: 'Lightbearer, Osmumten\'s fang, Elidinis\' ward, Masori armour or Tumeken\'s shadow.' });
Object.entries(ECHO_RAIDS).forEach(([k, E]) => ACTS.push({ k, grp: 'Echoes', icon: '✴️', name: 'Echo ' + E[3], line: '2.5× HP, 1 in 3 purple chance and 25–60 echo shards per clear.', first: E[4][0], btn: ['eraid', k], raid: k, list: E[4],
  clears: () => S.raids?.[k] || 0, uniques: () => [...E[2].map(u => u[0]), ...ECHO_SKINS.map(s => s[0])], echo: true, info: 'Echo versions of the raid. Rare Echo weapon skins (1 in 40). Trade echo shards for divine shards for the Pantheon.' }));
const actLock = A => { const m = MONSTER_BY_ID[A.first]; return (A.need && A.need()) || (m ? canFight(m) : '') || ''; };
const actBusy = A => { const c = curMon(); return S.combat.fighting && (A.k === 'barrows' ? !!c.barrows : c.raid === (A.raid || A.k)); };
function actCard(A) {
  const lock = actLock(A), busy = actBusy(A), prog = A.prog ? A.prog() : A.list ? actProg(A.raid || A.k, A.list) : '';
  const meta = [`${fmt(A.clears())} clear${A.clears() === 1 ? '' : 's'}`, A.extra?.(), prog && `<span class="y">${prog}</span>`].filter(Boolean).join(' · ');
  return `<div class="act-card ${lock && !busy ? 'locked' : ''} ${busy ? 'busy' : ''}"><div class="ac-head"><span class="ac-icon">${A.icon}</span><div><b>${A.name}</b><small>${A.line}</small></div></div>
    <div class="ac-meta">${lock && !busy ? `🔒 ${String(lock).replace(/^🗺️ /, '')}` : meta}</div>
    <div class="ac-btns"><button class="btn ${lock && !busy ? 'poor' : ''}" data-act="${A.btn[0]}" ${A.btn[1] ? `data-id="${A.btn[1]}"` : ''} data-actstart="1">${busy ? '⚔️ In progress' : '▶ Start'}</button>
      <button class="btn small" data-act="act-info" data-id="${A.k}">ℹ️ Rewards${A.shop ? ' & shop' : ''}</button></div></div>`;
}
function actsPage() {
  const show = A => A.grp !== 'Echoes' || tcount() > 0 || apoCount() > 0;
  return `<div class="panel small muted">Activities run on their own once started: you move from room to room automatically, and raids repeat while you keep fighting.</div>` +
    ['Minigames', 'Raids', 'Echoes'].map(g => { const L = ACTS.filter(A => A.grp === g && show(A)); return L.length ? `<h3 class="sec-h">${g === 'Minigames' ? '🎲' : g === 'Raids' ? '🏛️' : '✴️'} ${g}</h3><div class="act-list">${L.map(actCard).join('')}</div>` : ''; }).join('');
}
function openActInfo(k) {
  const A = ACTS.find(a => a.k === k); if (!A) return;
  const U = (A.uniques?.() || []).filter(id => ITEMS[id]);
  let shop = '';
  if (A.shop === 'pc') shop = `<h3>Void Knight rewards <small class="muted">· ${fmt(S.pc?.pts || 0)} points</small></h3><div class="list">${VOID_SET.map(([id, n, , , c]) => `<div class="upg"><div class="upg-icon">${itemIcon(id)}</div><div class="upg-main"><b>${n}</b><small>${c} points</small></div><button class="btn small ${(S.pc?.pts || 0) >= c ? '' : 'poor'}" data-act="pc-buy" data-id="${id}">Buy</button></div>`).join('')}</div>`;
  if (A.shop === 'ba') shop = `<h3>Honour rewards <small class="muted">· ${fmt(S.ba || 0)} points</small></h3><div class="list">${BA_SHOP.map(([id, c]) => `<div class="upg"><div class="upg-icon">${itemIcon(id)}</div><div class="upg-main"><b>${ITEMS[id].name}</b><small>${c} honour</small></div><button class="btn small ${(S.ba || 0) >= c ? '' : 'poor'}" data-act="ba-buy" data-id="${id}">Buy</button></div>`).join('')}</div>`;
  const L = S.raids?.toaLvl || 0;
  const toa = A.toa ? `<h3>Raid level <b class="y">${L}</b></h3><p class="small">Monsters ×${fmtD(1 + L / 250)} HP · purple chance 1 in ${Math.round(10 / (1 + L / 150))}</p><div class="chips">${[0, 100, 200, 300, 400, 500].map(l => `<button class="chip ${L === l ? 'on' : ''}" data-act="toa-lvl" data-id="${l}">${l}</button>`).join('')}</div>` : '';
  const echo = A.echo ? `<p class="small">Echo shards: <b class="y">${fmt(have('echo_shard'))}</b> <button class="btn small ${have('echo_shard') >= ECHO_PER_SHARD ? '' : 'poor'}" data-act="echo-trade">Trade ${ECHO_PER_SHARD} → 1 divine shard</button></p>` : '';
  const steps = A.list ? `<div class="chips">${A.list.map(id => `<span class="chip">${MONSTER_BY_ID[id].icon} ${MONSTER_BY_ID[id].name.replace(/^(The |Echo )/, '').split(' ').slice(0, 2).join(' ')}</span>`).join('')}</div>` : '';
  openModal(`<div class="item-modal act-info" data-actinfo="${k}"><h2>${A.icon} ${A.name}</h2><p class="small">${A.info}</p>${steps}
    ${U.length ? `<h3>Rare rewards</h3><div class="mini-grid">${U.map(id => `<div class="mini ${S.clog?.[id] ? '' : 'used'}" data-act="info" data-id="${id}">${itemIcon(id)}<span>${S.clog?.[id] ? '✔' : ''}</span></div>`).join('')}</div><p class="tiny muted">✔ = in your collection log</p>` : ''}
    ${toa}${echo}${shop}<button class="btn big" data-act="close">Close</button></div>`);
}

/* ================= SLAYER PAGE ================= */
function slayerPage() {
  const sl = S.slayer, L = MONSTERS.filter(m => regionOf(m) === 'slayer').sort((a, b) => (a.sl || 0) - (b.sl || 0) || a.lvl - b.lvl);
  const task = sl.mon && sl.left > 0 ? MONSTER_BY_ID[sl.mon] : null;
  return `<div class="panel"><h3>Slayer masters <small class="muted">· ${fmt(sl.points)} points · streak ${sl.streak}</small></h3>
      ${task ? `<p class="small">Current task: <b>${fmt(sl.left)} × ${task.name}</b> <button class="btn small" data-act="fighttask">Go</button></p>` : '<p class="small muted">No task. Tap a master to get one: task kills give Slayer XP, and tasks can send you anywhere, even to regions you haven\'t unlocked.</p>'}
      <div class="masters">${SLAYER_MASTERS.map(ms => { const lock = combatLevel() < ms.cb || LV.slayer < ms.sl; return `<button class="master ${lock ? 'locked' : ''} ${sl.master === ms.id ? 'on' : ''}" data-act="master" data-id="${ms.id}"><span>${ms.icon}</span><b>${ms.name}</b><small>${lock ? `🔒 Combat ${ms.cb}${ms.sl > 1 ? ' · Slayer ' + ms.sl : ''}` : `${ms.pts} pts / task`}</small></button>`; }).join('')}</div>
      <button class="btn" data-act="slshop">💀 Slayer shop</button></div>
    <h3 class="sec-h">Slayer monsters <small class="muted">· need a Slayer level</small></h3><div class="list">${L.filter(m => !m.boss).map(m => monRow(m)).join('')}</div>
    <h3 class="sec-h">👑 Slayer bosses</h3><div class="list">${L.filter(m => m.boss).map(m => monRow(m)).join('')}</div>`;
}

/* ================= THE TAB ================= */
const CB_SECS = [['regions', '🗺️', 'Regions'], ['bosses', '👑', 'Bosses'], ['acts', '🏟️', 'Activities'], ['slayer', '💀', 'Slayer']];
function monstersBody() {
  const sec = UI.cbSec || 'regions';
  const seg = `<div class="seg4">${CB_SECS.map(([k, i, n]) => `<button class="${sec === k ? 'on' : ''}" data-act="cb-sec" data-id="${k}"><span>${i}</span>${n}</button>`).join('')}</div>`;
  const body = sec === 'bosses' ? bossesPage() : sec === 'acts' ? actsPage() : sec === 'slayer' ? slayerPage() : UI.region ? regionPage(UI.region) : regionsGrid();
  return seg + body;
}
viewCombat = (orig => function () {
  let h = orig();
  const r = regionOf(curMon()), lbl = r && REG_BY_ID[r] ? REG_BY_ID[r].name : r === 'slayer' ? 'Slayer' : curMon().raid ? 'Activity' : 'Monsters';
  h = h.replace(/(data-id="monsters">👹 Monsters <small>)[^<]*/, `$1${lbl}`);
  if (UI.ctab !== 'monsters') return h;
  const a = h.indexOf('<div class="ctabs">'); if (a < 0) return h;
  const b = h.indexOf('</div>', a) + 6, c = h.indexOf('<div class="panel"><h3>Loot</h3>', b);
  return c < 0 ? h.slice(0, b) + monstersBody() : h.slice(0, b) + monstersBody() + h.slice(c);
})(viewCombat);
VIEWS.combat = (orig => function () { return rebrand(orig()); })(viewCombat);
viewSig = (orig => function () {
  if (UI.view !== 'combat' || UI.ctab !== 'monsters') return orig();
  return orig() + '|' + (UI.cbSec || '') + (UI.region || '') + S.combat.mon + S.combat.fighting + (S.combat.fighting ? curMon().order ?? '' : '') + JSON.stringify(S.lifetime.regions || {});
})(viewSig);

/* ---------- clicks ---------- */
const toTop = () => setTimeout(() => $('#view')?.scrollTo({ top: 0, behavior: 'smooth' }), 30);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act, id = t.dataset.id;
  if (a === 'cb-sec') { e.stopImmediatePropagation(); UI.cbSec = id; UI.region = null; UI.force = true; render(); return; }
  if (a === 'reg-open') { e.stopImmediatePropagation(); UI.region = id; UI.force = true; render(); $('#view')?.querySelector('.seg4')?.scrollIntoView({ block: 'start' }); return; }
  if (a === 'reg-back') { e.stopImmediatePropagation(); UI.region = null; UI.force = true; render(); return; }
  if (a === 'mon-pick') {
    e.stopImmediatePropagation(); const m = MONSTER_BY_ID[id]; if (!m) return;
    const err = canFight(m); if (err) { toast('🔒 ' + String(err).replace(/^🗺️ /, ''), 'warn'); return; }
    if (S.combat.mon !== id) { if (S.combat.fighting) retreat(); S.combat.mon = id; }
    UI.area = m.area; if (!S.combat.fighting) startFight(); UI.force = true; render(); toTop(); return;
  }
  if (a === 'act-info') { e.stopImmediatePropagation(); openActInfo(id); return; }
  if (t.dataset.actstart) toTop();
  // refresh an open activity window after a purchase or a raid-level change
  if (['pc-buy', 'ba-buy', 'toa-lvl', 'echo-trade'].includes(a)) { const k = $('#modal [data-actinfo]')?.dataset.actinfo; if (k) setTimeout(() => openActInfo(k), 0); }
}, true);
// the old area tabs are gone: any "area" jump (e.g. from a clue or the drop log) lands on the right region
go = (orig => function (v, o, ...r) {
  if (v === 'combat' && o?.area) { const m = curMon(), rg = regionOf(m); if (rg && REG_BY_ID[rg]) { UI.cbSec = 'regions'; UI.region = rg; } else if (rg === 'slayer') UI.cbSec = 'slayer'; else if (m.raid || m.barrows) UI.cbSec = 'acts'; }
  return orig(v, o, ...r);
})(go);

function boot38() { boot37(); grandfatherRegions(); UI.force = true; render(); }
boot38();
