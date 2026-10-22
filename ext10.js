'use strict';
/* =========================================================
   CLICKSCAPE v5.3 — prayer points, Pest Control, Tombs of Amascut,
   boss KC milestones, ascension rebalance, TRANSCENDENCE,
   pet bonuses, cloud save
   ========================================================= */

/* ================= PRAYER POINTS ================= */
const maxPP = () => LV.prayer * 10 + (S.trans?.perks?.devotion || 0) * 100;
function monStyle(m) {
  if (!m) return 'melee';
  if (m.atype) return m.atype;
  const n = (m.id + ' ' + m.name).toLowerCase();
  if (m.dragon || /mage|wizard|druid|shaman|sorc|zulrah|olm|verzik|kraken|thermy|warden|akkha|elemental|nightmare/.test(n)) return 'magic';
  if (/archer|ranger|kree|vespula|xarpus|scorpia|venenatis|zebak|rev_|spider|wyvern/.test(n)) return 'ranged';
  return 'melee';
}
it7('prayer_potion', 'Prayer potion', 900, 'potion', '#3ad8c8', { cat: 'herb', ppRestore: [70, 0.25] });
it7('super_restore', 'Super restore', 2200, 'potion', '#e83a8a', { cat: 'herb', ppRestore: [80, 0.27] });
A7({ id: 'h_prayer_potion', st: 'herb', name: 'Prayer potion', lvl: 38, xp: 88, hp: 5, inp: { ranarr: 1, vial_of_water: 1 }, out: { prayer_potion: 1 }, icon: 'prayer_potion' });
A7({ id: 'h_super_restore', st: 'herb', name: 'Super restore', lvl: 63, xp: 143, hp: 6, inp: { snapdragon: 1, vial_of_water: 1, crushed_nest: 1 }, out: { super_restore: 1 }, icon: 'super_restore' });
SHOP.supplies.push({ id: 'prayer_potion', price: 3600 });
const PR = () => (S.combat.pray ||= { pp: maxPP(), off: true, prot: 'auto', pot: true });
prayerBoost = (orig => function () {
  const P = S?.combat?.pray;
  if (P && (!P.off || P.pp <= 0)) return { n: P.pp <= 0 ? 'Out of prayer' : 'Off', a: 1, s: 1, d: 1, r: 1, m: 1 };
  return orig();
})(prayerBoost);
const protOn = () => { const P = S.combat.pray; return P && P.pp > 0 && P.prot !== 'none' && LV.prayer >= 43; };
const protStyle = () => { const P = S.combat.pray; return P.prot === 'auto' ? monStyle(curMon()) : P.prot; };
reduction = (orig => function () {
  const P = LV.prayer, old = P >= 43 ? 0.25 + (P - 43) / 56 * 0.15 : 0;
  let r = orig() - old;
  if (S.combat.pray && protOn() && protStyle() === monStyle(curMon())) r += curMon()?.boss ? 0.4 : 0.5;
  return Math.max(0, Math.min(0.8, r));
})(reduction);
function ppDrain() { const P = PR(); let d = 0; if (P.off && LV.prayer >= 1) d += 0.15 + LV.prayer / 300; if (protOn()) d += 0.25; return d * (1 - 0.1 * (S.trans?.perks?.devotion || 0)); }
combatTick = (orig => function (dt) {
  orig(dt);
  const P = PR(), C = S.combat, mx = maxPP();
  if (P.pp > mx) P.pp = mx;
  if (C.fighting && C.mhp > 0) {
    P.pp = Math.max(0, P.pp - ppDrain() * dt);
    if (P.pot && P.pp < mx * 0.25) { const id = ['super_restore', 'prayer_potion'].find(i => have(i)); if (id) { remove(id, 1); const [f, p] = ITEMS[id].ppRestore; P.pp = Math.min(mx, P.pp + f + mx * p); if (!OFF) floaterOn('#php', '+🙏', 'good'); } }
    if (P.pp <= 0 && !P.warned) { P.warned = true; if (!OFF) toast('🙏 You have run out of prayer points. Bring prayer potions (Herblore 38) or rest.', 'warn', 5000); }
  } else { P.pp = Math.min(mx, P.pp + dt * mx / 120); if (P.pp > mx * 0.5) P.warned = false; }
})(combatTick);
function prayerPanel() {
  const P = PR(), mx = maxPP(), pots = have('prayer_potion') + have('super_restore');
  return `<div class="panel"><h3>🙏 Prayer <small class="muted">· ${Math.floor(P.pp)}/${mx} points · drains ${fmtD(ppDrain())}/s</small></h3>
    <div class="hpbar pp"><i style="width:${Math.min(100, P.pp / mx * 100)}%"></i><span>${Math.floor(P.pp)} / ${mx}</span></div>
    <div class="chips"><button class="chip ${P.off ? 'on' : ''}" data-act="pr-off">${P.off ? '✨ ' + prayerBoost().n : '✨ Offensive prayer off'}</button></div>
    ${LV.prayer >= 43 ? `<div class="chips">${[['none', '🚫 No protection'], ['auto', '🤖 Auto'], ['melee', '⚔️ Melee'], ['ranged', '🏹 Missiles'], ['magic', '🔮 Magic']].map(([k, n]) => `<button class="chip ${P.prot === k ? 'on' : ''}" data-act="pr-prot" data-id="${k}">${n}</button>`).join('')}</div>
      <p class="muted small">${curMon().name} attacks with <b>${monStyle(curMon())}</b>. The right protection blocks ${curMon().boss ? 40 : 50}% of its damage.</p>` : '<p class="muted small">Protection prayers unlock at Prayer 43.</p>'}
    <label class="toggle"><input type="checkbox" data-act="pr-pot" ${P.pot ? 'checked' : ''}> Auto-drink prayer potions below 25% (have ${fmt(pots)})</label>
    <p class="muted tiny">Points refill slowly whenever you're not fighting.</p></div>`;
}
viewCombat = (orig => function () {
  const h = orig();
  if ((UI.ctab || 'setup') !== 'setup') return h;
  return h.replace(/<p class="small">🙏 Prayer: [\s\S]*?<\/p>/, '').replace('<div class="panel"><h3>Combat style</h3>', prayerPanel() + '<div class="panel"><h3>Combat style</h3>');
})(viewCombat);

/* ================= PEST CONTROL & VOID_SET ================= */
const VOID_SET = [['void_knight_top', 'Void knight top', 'body', 'platebody', 100], ['void_knight_robe', 'Void knight robe', 'legs', 'robeskirt', 100], ['void_knight_gloves', 'Void knight gloves', 'hands', 'gloves', 60],
  ['void_melee_helm', 'Void melee helm', 'head', 'full_helm', 80], ['void_ranger_helm', 'Void ranger helm', 'head', 'coif', 80], ['void_mage_helm', 'Void mage helm', 'head', 'hat', 80],
  ['elite_void_top', 'Elite void top', 'body', 'platebody', 250], ['elite_void_robe', 'Elite void robe', 'legs', 'robeskirt', 250]];
VOID_SET.forEach(([id, n, slot, kind]) => gear(id, n, slot, [0, 0, slot === 'body' ? 45 : slot === 'legs' ? 30 : 8], { defence: 42 }, { kind, tint: id.startsWith('elite') ? '#e8e0c8' : '#3a3a3a', trim: '#c8a83a', untradeable: true, value: 1, void: true }));
it7('pc_points', 'Pest Control points', 0, 'emblem', '#8a3ad8', { hidden: true });
function voidStyle() {
  const e = S.equip, top = ['void_knight_top', 'elite_void_top'].includes(e.body), robe = ['void_knight_robe', 'elite_void_robe'].includes(e.legs);
  if (!top || !robe || e.hands !== 'void_knight_gloves') return null;
  const s = { void_melee_helm: 'melee', void_ranger_helm: 'ranged', void_mage_helm: 'magic' }[e.head];
  return s ? { s, elite: e.body === 'elite_void_top' && e.legs === 'elite_void_robe' } : null;
}
const PC_RUN = ['pc_portal_purple', 'pc_portal_blue', 'pc_portal_yellow', 'pc_portal_red'];
[['purple', 'Purple'], ['blue', 'Blue'], ['yellow', 'Yellow'], ['red', 'Red']].forEach(([k, n], i) => MON({ id: 'pc_portal_' + k, name: n + ' portal', icon: '🌀', hue: [270, 210, 50, 0][i], lvl: 90, hp: 160, atk: 70, def: 60 + i * 10, mh: 10, spd: 2.6, area: 'minigames', raid: 'pc', order: i, minCombat: 40, drops: [] }));
raidKill = (orig => function (m) {
  if (m.raid !== 'pc') return orig(m);
  if (m.order < PC_RUN.length - 1) { S.combat.mon = PC_RUN[m.order + 1]; UI.force = true; return; }
  const pts = 12; S.pc = S.pc || { pts: 0, games: 0 }; S.pc.pts += pts; S.pc.games++; gainCoins(500 + combatLevel() * 20);
  if (!OFF) toast(`🛡️ The Void Knight is safe! +${pts} Pest Control points (${S.pc.pts}).`, 'rare'); else OFFLOG.push(`🛡️ Won a game of Pest Control (+${pts} points).`);
  S.combat.mon = PC_RUN[0]; UI.force = true;
})(raidKill);

/* ================= TOMBS OF AMASCUT ================= */
gear('osmumtens_fang', "Osmumten's fang", 'weapon', [105, 103, 0], { attack: 82 }, { kind: 'sword', tint: '#e8d8a0', spd: 0.85, value: 40000000 });
gear('lightbearer', 'Lightbearer', 'ring', [0, 0, 0], null, { kind: 'ring', tint: '#ffd84a', value: 8000000 });
gear('elidinis_ward', "Elidinis' ward", 'shield', [0, 0, 53], { defence: 80, prayer: 80 }, { kind: 'kiteshield', tint: '#3ac8c8', matk: 25, mdmg: 5, value: 20000000 });
gear('masori_mask', 'Masori mask', 'head', [0, 0, 8], { defence: 30, ranged: 80 }, { kind: 'coif', tint: '#c8a83a', ratk: 12, rstr: 2, value: 15000000 });
gear('masori_body', 'Masori body', 'body', [0, 0, 59], { defence: 30, ranged: 80 }, { kind: 'dhidebody', tint: '#c8a83a', ratk: 43, rstr: 4, value: 30000000 });
gear('masori_chaps', 'Masori chaps', 'legs', [0, 0, 35], { defence: 30, ranged: 80 }, { kind: 'chaps', tint: '#c8a83a', ratk: 27, rstr: 2, value: 25000000 });
gear('tumekens_shadow', "Tumeken's shadow", 'weapon', [0, 0, 0], { magic: 85 }, { kind: 'staff', tint: '#5a2a8a', wclass: 'magic', cast: 'celestial', matk: 35, mdmg: 30, twoHanded: true, spd: 1.0, value: 900000000 });
PETS.tumekens_guardian = { name: "Tumeken's guardian", icon: '🐈‍⬛', st: 'combat', chance: 0, desc: '+3% combat max hit (ToA pet)' };
const RAID_TOA = ['toa_zebak', 'toa_kephri', 'toa_baba', 'toa_akkha', 'toa_wardens'];
const TOA_BASE = {};
[['toa_zebak', 'Zebak', '🐊', 380, 450, 300, 180, 32, 3, 'magic', 'ranged'], ['toa_kephri', 'Kephri', '🪲', 300, 400, 260, 220, 28, 2.4, 'ranged', 'magic'], ['toa_baba', 'Ba-Ba', '🐒', 380, 480, 320, 160, 34, 3, 'melee', 'melee'],
  ['toa_akkha', 'Akkha', '⚱️', 400, 500, 330, 200, 34, 3, 'magic', 'magic'], ['toa_wardens', 'Elidinis & Tumeken', '🗿', 900, 1200, 420, 240, 44, 3, 'melee', 'magic']]
  .forEach(([id, name, icon, lvl, hp, atk, def, mh, spd, weak, atype], i) => { MON({ id, name, icon, lvl, hp, atk, def, mh, spd, weak, atype, area: 'raids', raid: 'toa', order: i, boss: id === 'toa_wardens', minCombat: 100, drops: [] }); TOA_BASE[id] = { hp, atk, def, mh }; });
const TOA_UNIQUES = [['lightbearer', 7], ['osmumtens_fang', 7], ['elidinis_ward', 3], ['masori_mask', 2], ['masori_body', 2], ['masori_chaps', 2], ['tumekens_shadow', 1]];
const TOA_COMMON = [['coins', 30000, 120000], ['blood_rune', 100, 400], ['cut_diamond', 3, 8], ['rune_bar', 8, 20], ['magic_logs', 20, 60], ['dragon_bones', 5, 15]];
function toaScale() { const L = S.raids?.toaLvl || 0, f = 1 + L / 250; for (const id of RAID_TOA) { const m = MONSTER_BY_ID[id], b = TOA_BASE[id]; m.hp = Math.round(b.hp * f); m.atk = Math.round(b.atk * f); m.def = Math.round(b.def * (1 + L / 500)); m.mh = Math.round(b.mh * (1 + L / 400)); } }
raidKill = (orig => function (m) {
  if (m.raid !== 'toa') return orig(m);
  const R = S.raids ||= {};
  if (m.id !== 'toa_wardens') { S.combat.mon = RAID_TOA[m.order + 1]; UI.force = true; return; }
  R.toa = (R.toa || 0) + 1; track('raid', 'toa', 1);
  const L = R.toaLvl || 0, got = [];
  if (rnd() < (1 / 10) * (1 + L / 150) * M.luck) { const u = pickWeighted(TOA_UNIQUES); rareGet(u, 1, 'drop'); logItem(u, 1); got.push('💜 ' + ITEMS[u].name); R.toaPurples = (R.toaPurples || 0) + 1; if (rnd() < 1 / 60 * (1 + L / 300)) givePet('tumekens_guardian'); }
  else for (let i = 0; i < 2; i++) { const [id, a, b] = TOA_COMMON[randInt(0, TOA_COMMON.length - 1)]; const k = 1 + L / 300; if (id === 'coins') { const c = Math.round(randInt(a, b) * k); gainCoins(c); got.push('🪙' + fmt(c)); } else { const q = Math.round(randInt(a, b) * k); add(id, q); got.push(`${q} × ${ITEMS[id].name}`); } }
  const msg = `⚱️ Tombs of Amascut (level ${L}) complete (${R.toa}): ${got.join(', ')}`;
  if (OFF) OFFLOG.push(msg); else { toast(msg, got[0]?.startsWith('💜') ? 'pet' : 'rare', 7000); SFX.play(got[0]?.startsWith('💜') ? 'pet' : 'clue'); }
  S.combat.mon = RAID_TOA[0]; UI.force = true;
})(raidKill);
raidPanel = (orig => function () {
  const R = S.raids || {}, cur = curMon(), at = cur.raid === 'toa' ? cur.order : -1, L = R.toaLvl || 0;
  return orig() + `<div class="panel"><h3>⚱️ Tombs of Amascut <small class="muted">· ${fmt(R.toa || 0)} completions · ${fmt(R.toaPurples || 0)} purples</small></h3>
    <div class="chips">${RAID_TOA.map((id, i) => `<span class="chip ${i < at ? 'on' : ''}">${MONSTER_BY_ID[id].icon} ${MONSTER_BY_ID[id].name.split(' ')[0]}${i < at ? ' ✔' : ''}</span>`).join('')}</div>
    <p class="small">Raid level <b class="y">${L}</b>: monsters ×${fmtD(1 + L / 250)} HP · purple chance ×${fmtD(1 + L / 150)} (1/${Math.round(10 / (1 + L / 150))}).</p>
    <div class="chips">${[0, 100, 200, 300, 400, 500].map(l => `<button class="chip ${L === l ? 'on' : ''}" data-act="toa-lvl" data-id="${l}">${l}</button>`).join('')}</div>
    <p class="muted small">Uniques: Lightbearer, Osmumten's fang, Elidinis' ward, Masori armour and Tumeken's shadow. Requires combat level 100.</p>
    <button class="btn big" data-act="toa-start">${S.combat.fighting && cur.raid === 'toa' ? 'Raid in progress…' : 'Enter the Tombs'}</button></div>`;
})(raidPanel);

/* ================= Minigames panel (Pest Control) ================= */
viewCombat = (orig => function () {
  const h = orig(), area = UI.area || curMon().area;
  if (area !== 'minigames' || UI.ctab !== 'monsters') return h;
  const pc = S.pc || { pts: 0, games: 0 }, cur = curMon(), vs = voidStyle();
  const panel = `<div class="panel"><h3>🛡️ Pest Control <small class="muted">· ${fmt(pc.pts)} points · ${fmt(pc.games)} games</small></h3>
    <p class="small">Destroy the four portals to save the Void Knight. Each win gives <b>12 points</b> and coins. Requires combat 40.</p>
    <button class="btn big" data-act="pc-start">${S.combat.fighting && cur.raid === 'pc' ? 'Game in progress…' : 'Board the lander'}</button>
    <h3>Void Knight rewards</h3><p class="muted small">Full void (top, robe, gloves + a helm) gives +10% accuracy and damage for that helm's style (ranged +12.5%). Elite void adds +5% more. ${vs ? `<span class="y">Active: ${vs.s}${vs.elite ? ' (elite)' : ''}</span>` : ''}</p>
    <div class="list">${VOID_SET.map(([id, n, , , c]) => `<div class="upg ${have(id) || Object.values(S.equip).includes(id) ? 'got' : ''}"><div class="upg-icon">${itemIcon(id)}</div><div class="upg-main"><b>${n}</b><small>${c} points</small></div><button class="btn ${pc.pts < c ? 'poor' : ''}" data-act="pc-buy" data-id="${id}">Buy</button></div>`).join('')}</div></div>`;
  const i = h.indexOf('<div class="list">');
  return i > 0 ? h.slice(0, i) + panel + h.slice(i) : h + panel;
})(viewCombat);

/* ================= BOSS KC MILESTONES ================= */
const KC_MS = [50, 100, 250, 500, 1000];
const kcTier = m => KC_MS.filter(k => (S.kills[m.id] || 0) >= k).length;
killMonster = (orig => function (m) {
  const t = m.boss ? kcTier(m) : 0, l0 = M.luck;
  if (t) M.luck *= 1 + 0.05 * t;
  try { orig(m); } finally { M.luck = l0; }
  if (m.boss && kcTier(m) > t && !m.raid) {
    const k = KC_MS[kcTier(m) - 1], boxes = kcTier(m);
    add('mystery_box', boxes); add('xp_lamp', 1);
    const msg = `👑 ${fmt(k)} ${m.name} kills! Boss mastery ${kcTier(m)}: +${kcTier(m) * 5}% drop rate & +${kcTier(m) * 3}% damage against it. Bonus: ${boxes} mystery box${boxes > 1 ? 'es' : ''} and a lamp.`;
    if (OFF) OFFLOG.push(msg); else { toast(msg, 'pet', 7000); SFX.play('ach'); }
  }
})(killMonster);
weaponVs = (orig => function (m) { return orig(m) * (m?.boss ? 1 + 0.03 * kcTier(m) : 1); })(weaponVs);
openMonsterInfo = (orig => function (id) {
  orig(id); const m = MONSTER_BY_ID[id];
  if (m?.boss && !m.raid) { const t = kcTier(m), next = KC_MS[t]; $('#modal .mon-info h3')?.insertAdjacentHTML('beforebegin', `<p class="small">👑 Boss mastery <b class="y">${t}/5</b>${t ? ` (+${t * 5}% drops, +${t * 3}% damage)` : ''}${next ? ` · next at ${fmt(next)} kills (${fmt(S.kills[id] || 0)} now)` : ' · maxed!'}</p>`); }
})(openMonsterInfo);

/* ================= ASCENSION REBALANCE ================= */
// XP gets slower each ascension (unless offset by Transcendence perks)
recalc4 = (orig => function () {
  orig(); if (!S.asc) return;
  const tp = S.trans?.perks || {};
  M.xp *= 1 / (1 + 0.06 * (S.asc.count || 0)) * Math.pow(1.25, tp.wisdom || 0);
  // pets: +1% XP and luck each
  const n = Object.keys(S.pets).length; M.xp *= 1 + 0.01 * n; M.luck *= 1 + 0.01 * n;
  if (S.pets.phoenix) M.rate.fire *= 1.05; if (S.pets.tiny_tempor) M.rate.fish *= 1.05; if (S.pets.smolcano) M.rate.mine *= 1.05;
  // void
  const v = voidStyle(); if (v && v.s === wclass()) { M.capeAcc *= 1.1; M.dmg *= (v.s === 'ranged' ? 1.125 : 1.1) * (v.elite ? 1.05 : 1); }
  // transcendence
  for (const st of STATION_ORDER) { const f = Math.pow(1.5, tp.haste || 0); M.rate[st] *= f; M.tap[st] *= f; }
  M.luck *= Math.pow(1.4, tp.fortune || 0); M.dmg *= Math.pow(1.4, tp.war || 0); M.sell *= Math.pow(1.3, tp.midas || 0);
  if (tp.runes) { const f = 1 + 0.25 * tp.runes; for (const st of STATION_ORDER) { M.rate[st] *= f; M.tap[st] *= f; } }
})(recalc4);
const ascReqMult = () => 1 - 0.1 * (S?.trans?.perks?.pantheon || 0);
capBonus = (orig => function () { return orig() + 5 * (S?.trans?.perks?.caps || 0); })(capBonus);
canFight = (orig => function (m) {
  const b = 2 * (S.trans?.perks?.rift || 0);
  if (!m.ascReq || !b) return orig(m);
  const r = m.ascReq; m.ascReq = Math.max(0, r - b); try { return orig(m); } finally { m.ascReq = r; }
})(canFight);
offlineHours = (orig => function () { return orig() + 12 * (S.trans?.perks?.timeless || 0); })(offlineHours);

ascend = (orig => function () {
  const old = S, n = S.asc.count; orig();
  if (S === old || S.asc.count === n) return;
  S.trans = old.trans; S.pc = old.pc; S.autosell = old.autosell; if (old.combat?.pray) S.combat.pray = { ...old.combat.pray, pp: maxPP() };
  if (old.raids?.toaLvl) (S.raids ||= {}).toaLvl = old.raids.toaLvl;
  applyCaps(); refreshLevels(); recalc(); save();
})(ascend);

/* ================= TRANSCENDENCE ================= */
const TRANS_REQ = 10;
const TRANS_PERKS = [
  { id: 'haste', icon: '⚡', name: 'Godly Haste', max: 5, cost: l => 1 + l, desc: l => `All production ×${fmtD(Math.pow(1.5, l))}` },
  { id: 'wisdom', icon: '📜', name: 'Divine Wisdom', max: 5, cost: l => 1 + l, desc: l => `All XP ×${fmtD(Math.pow(1.25, l))}` },
  { id: 'runes', icon: '🌀', name: 'Eternal Engines', max: 3, cost: l => 2 + l, desc: l => `All production +${25 * l}%` },
  { id: 'war', icon: '⚔️', name: 'Avatar of War', max: 5, cost: l => 1 + l, desc: l => `Damage ×${fmtD(Math.pow(1.4, l))}` },
  { id: 'fortune', icon: '🍀', name: 'Treasure of the Gods', max: 5, cost: l => 1 + l, desc: l => `Rare drops ×${fmtD(Math.pow(1.4, l))}` },
  { id: 'midas', icon: '🪙', name: 'Midas Touch', max: 3, cost: l => 1 + l, desc: l => `Sell prices ×${fmtD(Math.pow(1.3, l))} · start with 🪙${fmt([0, 1e6, 2e7, 5e8][l])}` },
  { id: 'pantheon', icon: '🏛️', name: 'Head of the Pantheon', max: 3, cost: l => 2 + l, desc: l => `Ascension requirement −${l * 10}%` },
  { id: 'caps', icon: '📈', name: 'Cap Breaker', max: 4, cost: l => 2 + l * 2, desc: l => `Level caps +${l * 5} (beyond ascension caps)` },
  { id: 'memory', icon: '🧠', name: 'Ascendant Memory', max: 3, cost: l => 2 + l, desc: l => `Keep ${[0, 25, 50, 100][l]}% of your essence perks when you transcend` },
  { id: 'estate', icon: '🏠', name: 'Eternal Estate', max: 1, cost: () => 3, desc: l => l ? 'House, guild shares & training grounds are kept' : 'Keep house, guild & training grounds when transcending' },
  { id: 'rift', icon: '🌌', name: 'Rift Walker', max: 3, cost: l => 1 + l, desc: l => `Rift monsters need ${l * 2} fewer ascensions` },
  { id: 'devotion', icon: '🙏', name: 'Devotion', max: 3, cost: l => 1 + l, desc: l => `+${l * 100} prayer points, −${l * 10}% prayer drain` },
  { id: 'timeless', icon: '⏳', name: 'Timeless', max: 2, cost: l => 2 + l, desc: l => `+${l * 12}h offline progress` },
];
const tperk = id => S.trans?.perks?.[id] || 0;
const transGain = () => 1 + Math.max(0, (S.asc?.count || 0) - TRANS_REQ);
function transcend() {
  if ((S.asc?.count || 0) < TRANS_REQ) return toast(`You need ${TRANS_REQ} ascensions to transcend.`, 'warn');
  const old = S, T = old.trans || { count: 0, shards: 0, perks: {} };
  T.count++; T.shards += transGain();
  const keepPerks = {}; const mem = [0, 0.25, 0.5, 1][T.perks.memory || 0];
  for (const k in old.asc.perks || {}) keepPerks[k] = Math.floor(old.asc.perks[k] * mem);
  const keep = { museum: old.museum, pets: old.pets, asc: { points: 0, count: 0, essence: 0, perks: keepPerks }, lifetime: old.lifetime, settings: old.settings, clog: old.clog, ach: old.ach, ge: old.ge, loadouts: old.loadouts, cosmetic: old.cosmetic, locked: old.locked };
  S = newState(keep);
  S.trans = T; S.autosell = old.autosell; S.sboost = old.sboost || {}; S.quests = {}; S.diary = {};
  for (const id in old.bank) if (SEASON_KEEP.has(id)) add(id, old.bank[id]);
  if (T.perks.estate) { S.house = old.house || {}; S.guild = old.guild || 0; S.academy = { t: {}, grounds: old.academy?.grounds || 0, on: true }; }
  else { S.house = {}; S.guild = 0; S.academy = { t: {}, grounds: 0, on: true }; }
  S.coins = [25, 1e6, 2e7, 5e8][T.perks.midas || 0];
  S.unlocks = {}; S.raids = {}; S.well = {}; S.clues = { active: null, done: old.clues?.done || {} };
  ensureTargets(); applyCaps(); refreshLevels(); recalc(); save();
  closeModal(); go('transcend'); burst(); SFX.play('pet');
  openModal(`<div class="item-modal"><h2>✴️ Transcendence ${T.count}!</h2><p>Everything returns to dust… except you. You gain divine shards. You now have <b class="y">${T.shards}</b> to spend in the Pantheon.</p><p class="small">Ascend ${TRANS_REQ} times again to transcend once more. Each ascension past ${TRANS_REQ} adds an extra shard.</p><button class="btn big" data-act="close">Begin again</button></div>`);
}
function buyTPerk(id) {
  const p = TRANS_PERKS.find(x => x.id === id), T = S.trans ||= { count: 0, shards: 0, perks: {} }, l = T.perks[id] || 0;
  if (l >= p.max) return; const c = p.cost(l);
  if (T.shards < c) return toast(`You need ${c} divine shards.`, 'warn');
  T.shards -= c; T.perks[id] = l + 1; applyCaps(); refreshLevels(); recalc();
  toast(`${p.icon} ${p.name} → ${l + 1}: ${p.desc(l + 1)}`, 'pet'); SFX.play('ach');
}
function viewTranscend() {
  const T = S.trans || { count: 0, shards: 0, perks: {} }, n = S.asc.count, ok = n >= TRANS_REQ;
  return subHead('✴️ Transcendence') + `<div class="panel glow"><p>Transcending resets <b>everything</b>: levels, items, coins, ascensions, runes, essence, house, quests and diaries. You keep pets, the collection log, achievements, museum, cosmetics, seasonal items and your Transcendence perks.</p>
      <div class="stats"><div>Transcendences</div><b>${T.count}</b><div>Divine shards</div><b class="y">${T.shards}</b><div>Ascensions this cycle</div><b>${n}/${TRANS_REQ}</b></div>
      <button class="btn big ${ok ? 'danger' : 'disabled'}" data-act="trans">${ok ? `Transcend for ${transGain()} shard${transGain() > 1 ? 's' : ''}…` : `Requires ${TRANS_REQ} ascensions (${n}/${TRANS_REQ})`}</button></div>
    <div class="panel"><h3>✴️ The Pantheon <small class="muted">· permanent forever</small></h3>
      ${TRANS_PERKS.map(p => { const l = T.perks[p.id] || 0, max = l >= p.max; return `<div class="upg ${l ? 'got' : ''}"><div class="upg-icon">${p.icon}</div><div class="upg-main"><b>${p.name} ${l}/${p.max}</b><small>${l ? p.desc(l) : 'Not learned'}${max ? '' : ` → ${p.desc(l + 1)}`}</small></div>
        ${max ? '<span class="y">MAX</span>' : `<button class="btn ${T.shards < p.cost(l) ? 'poor' : ''}" data-act="tperk" data-id="${p.id}">${p.cost(l)} ✴️</button>`}</div>`; }).join('')}</div>`;
}
viewAscension = (orig => function () {
  const T = S.trans || {};
  return orig() + `<div class="panel row-between"><div><b>✴️ Transcendence</b><br><small class="muted">${S.asc.count >= TRANS_REQ ? 'Ready! A deeper reset for divine shards.' : `After ${TRANS_REQ} ascensions (${S.asc.count}/${TRANS_REQ}) · ${T.shards || 0} shards`}</small></div><button class="btn" data-act="hub" data-id="transcend">Open</button></div>`;
})(viewAscension);

/* ================= PET BONUSES ================= */
viewPets = (orig => function () {
  const n = Object.keys(S.pets).length;
  return orig().replace('<div class="panel"><div class="pet-grid">', `<div class="panel small">🐾 Pet collection bonus: <b class="y">+${n}% XP and +${n}% rare-drop luck</b> (1% per pet). Combat pets add +3% max hit each, and skilling pets speed up their skill.</div><div class="panel"><div class="pet-grid">`);
})(viewPets);

/* ================= CLOUD SAVE (GitHub Gist) ================= */
const CLOUD_KEY = 'clickscape_cloud';
const cloudCfg = () => { try { return JSON.parse(localStorage.getItem(CLOUD_KEY)) || {}; } catch (e) { return {}; } };
const cloudSet = c => localStorage.setItem(CLOUD_KEY, JSON.stringify(c));
async function cloudUpload(quiet) {
  const c = cloudCfg(); if (!c.token) return quiet || toast('Add a GitHub token first.', 'warn');
  save();
  const body = { description: 'Clickscape save', public: false, files: { 'clickscape-save.json': { content: localStorage.getItem(SAVE_KEY) } } };
  try {
    const r = await fetch(c.gist ? `https://api.github.com/gists/${c.gist}` : 'https://api.github.com/gists', { method: c.gist ? 'PATCH' : 'POST', headers: { Authorization: `Bearer ${c.token}`, Accept: 'application/vnd.github+json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(r.status);
    const j = await r.json(); c.gist = j.id; c.last = Date.now(); cloudSet(c);
    if (!quiet) toast('☁️ Save uploaded to the cloud.', 'rare');
  } catch (e) { if (!quiet) toast(`☁️ Upload failed (${e.message}). Check your token has the "gist" permission.`, 'warn', 6000); }
}
async function cloudDownload() {
  const c = cloudCfg(); if (!c.token || !c.gist) return toast('No cloud save found yet. Upload from your other device first, or paste its gist ID.', 'warn', 6000);
  try {
    const r = await fetch(`https://api.github.com/gists/${c.gist}`, { headers: { Authorization: `Bearer ${c.token}`, Accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error(r.status);
    const j = await r.json(), f = j.files['clickscape-save.json']; let txt = f.content;
    if (f.truncated) txt = await (await fetch(f.raw_url)).text();
    const d = JSON.parse(txt); if (!d.xp) throw new Error('bad save');
    SAVE_LOCK = true; localStorage.setItem(SAVE_KEY, txt); toast('☁️ Cloud save loaded, reloading…'); setTimeout(() => location.reload(), 400);
  } catch (e) { toast(`☁️ Download failed (${e.message}).`, 'warn', 6000); }
}
setInterval(() => { const c = cloudCfg(); if (c.token && c.auto && !document.hidden) cloudUpload(true); }, 10 * 60000);
viewSettings = (orig => function () {
  const c = cloudCfg();
  return orig().replace('<div class="panel"><h3>📁 Save file</h3>', `<div class="panel"><h3>☁️ Cloud save</h3>
      <p class="muted small">Sync your save between devices with a free private GitHub Gist. Create a token at github.com → Settings → Developer settings → Personal access tokens (classic) with only the <b>gist</b> box ticked, then paste it on each device. The token is stored only on this device.</p>
      <input id="cloud-token" type="password" class="qty-in" placeholder="GitHub token (ghp_…)" value="${esc(c.token || '')}" autocomplete="off">
      <input id="cloud-gist" type="text" class="qty-in" placeholder="Gist ID (filled in after first upload)" value="${esc(c.gist || '')}" autocomplete="off">
      <div class="row-btns"><button class="btn" data-act="cloud-save">💾 Save settings</button><button class="btn" data-act="cloud-up">⬆️ Upload</button><button class="btn" data-act="cloud-down">⬇️ Download</button></div>
      <label class="toggle"><input type="checkbox" data-act="cloud-auto" ${c.auto ? 'checked' : ''}> Auto-upload every 10 minutes</label>
      ${c.last ? `<p class="muted tiny">Last upload: ${new Date(c.last).toLocaleString()}</p>` : ''}</div>
    <div class="panel"><h3>📁 Save file</h3>`);
})(viewSettings);

/* ---------- Collection log, sources, achievements ---------- */
(function () {
  CLOG.push({ id: 'toa', name: 'Tombs of Amascut', icon: '⚱️', cat: 'Raids', items: [...TOA_UNIQUES.map(u => u[0]), 'pet:tumekens_guardian'] });
  CLOG.push({ id: 'pc', name: 'Pest Control', icon: '🛡️', cat: 'Minigames', items: VOID_SET.map(v => v[0]) });
  CLOG.flatMap(p => p.items).forEach(i => CLOG_ITEMS.add(i));
  TOA_UNIQUES.forEach(([id]) => (SOURCES[id] ||= []).push('Tombs of Amascut (raid purple)'));
  VOID_SET.forEach(([id, , , , c]) => (SOURCES[id] ||= []).push(`Pest Control reward shop (${c} points)`));
  ['prayer_potion', 'super_restore'].forEach(id => (SOURCES[id] ||= []).push('Herblore'));
  ach('toa_1', 'Tomb Raider', 'Complete the Tombs of Amascut', '⚱️', g => (g.S.raids?.toa || 0) >= 1, 25);
  ach('toa_300', 'Expert Raider', 'Complete a level 300+ Tombs of Amascut', '🏺', g => (g.S.raids?.toa || 0) >= 1 && (g.S.raids?.toaLvl || 0) >= 300, 40);
  ach('void_set', 'Knight of the Void', 'Wear a full void set', '🛡️', () => !!voidStyle(), 15);
  ach('trans_1', 'Beyond the Veil', 'Transcend for the first time', '✴️', g => (g.S.trans?.count || 0) >= 1, 50);
})();
for (const m of MONSTERS) MONSTER_BY_ID[m.id] = m;
Object.keys(ITEMS).forEach(id => { if (!(id in ITEM_ORDER)) ITEM_ORDER[id] = Object.keys(ITEM_ORDER).length; });
for (const id of ['osmumtens_fang', 'lightbearer', 'elidinis_ward', 'masori_mask', 'masori_body', 'masori_chaps', 'tumekens_shadow', 'prayer_potion', 'super_restore']) if (!GE_SET.has(id)) { GE_ITEMS.push(id); GE_SET.add(id); }

/* ---------- Views & input ---------- */
Object.assign(VIEWS, { transcend: viewTranscend, ascension: viewAscension, pets: viewPets, settings: viewSettings, combat: viewCombat });
HUB_VIEWS.push('transcend');
viewSig = (orig => function () {
  if (UI.view === 'transcend') return JSON.stringify(S.trans || {}) + S.asc.count;
  if (UI.view === 'combat') { const P = S.combat.pray || {}; return orig() + (P.off ? 1 : 0) + P.prot + (P.pot ? 1 : 0) + (UI.ctab === 'monsters' ? JSON.stringify(S.pc || {}) + (S.raids?.toaLvl || 0) : ''); }
  if (UI.view === 'ascension') return orig() + JSON.stringify(S.trans || {});
  return orig();
})(viewSig);
setInterval(() => { const b = $('.hpbar.pp'); if (!b || !S.combat.pray) return; const P = S.combat.pray, mx = maxPP(); b.querySelector('i').style.width = Math.min(100, P.pp / mx * 100) + '%'; b.querySelector('span').textContent = `${Math.floor(P.pp)} / ${mx}`; }, 500);

document.addEventListener('click', e => {
  if (e.target.closest('[data-nav]')) return;
  const t = e.target.closest('[data-act]'); if (!t) return;
  const d = t.dataset; let h = true;
  switch (d.act) {
    case 'pr-off': PR().off = !PR().off; recalc(); break;
    case 'pr-prot': PR().prot = d.id; break;
    case 'pr-pot': PR().pot = t.checked; break;
    case 'pc-start': { const cur = curMon(); if (S.combat.fighting && cur.raid === 'pc') break; if (S.combat.fighting) retreat(); S.combat.mon = PC_RUN[0]; startFight(); break; }
    case 'pc-buy': { const v = VOID_SET.find(x => x[0] === d.id), pc = S.pc ||= { pts: 0, games: 0 }; if (pc.pts < v[4]) { toast(`You need ${v[4]} Pest Control points.`, 'warn'); break; } pc.pts -= v[4]; add(v[0], 1); logItem(v[0], 1); toast(`🛡️ You receive a ${v[1]}.`, 'rare'); break; }
    case 'toa-lvl': if (S.combat.fighting && curMon().raid === 'toa') { toast('Finish or leave the current raid first.', 'warn'); break; } (S.raids ||= {}).toaLvl = +d.id; toaScale(); break;
    case 'toa-start': { const cur = curMon(); if (S.combat.fighting && cur.raid === 'toa') break; if (S.combat.fighting) retreat(); toaScale(); S.combat.mon = RAID_TOA[0]; startFight(); break; }
    case 'trans': openModal(`<h2>✴️ Transcend?</h2><p>This resets <b>everything</b>, including all ascensions, runes, essence, house and quests, for <b class="y">${transGain()}</b> divine shard${transGain() > 1 ? 's' : ''}.</p><button class="btn big danger" data-act="trans-yes">Transcend</button><button class="btn" data-act="close">Not yet</button>`); e.stopImmediatePropagation(); return;
    case 'trans-yes': transcend(); e.stopImmediatePropagation(); return;
    case 'tperk': buyTPerk(d.id); break;
    case 'cloud-save': { const c = cloudCfg(); c.token = $('#cloud-token').value.trim(); c.gist = $('#cloud-gist').value.trim() || undefined; cloudSet(c); toast('☁️ Cloud settings saved.'); break; }
    case 'cloud-up': { const c = cloudCfg(); const tk = $('#cloud-token')?.value.trim(); if (tk) { c.token = tk; c.gist = $('#cloud-gist').value.trim() || c.gist; cloudSet(c); } cloudUpload(); break; }
    case 'cloud-down': { const c = cloudCfg(); const tk = $('#cloud-token')?.value.trim(); if (tk) { c.token = tk; c.gist = $('#cloud-gist').value.trim() || c.gist; cloudSet(c); } cloudDownload(); break; }
    case 'cloud-auto': { const c = cloudCfg(); c.auto = t.checked; cloudSet(c); break; }
    default: h = false;
  }
  if (h) { e.stopImmediatePropagation(); UI.force = true; render(); liveUpdate(); }
}, true);
