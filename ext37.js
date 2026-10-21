'use strict';
/* =========================================================
   CLICKSCAPE v9.13 — weekly World boss, sell outclassed gear
   ========================================================= */

/* ================= WORLD BOSS ================= */
// a new giant every week (Monday). Assign your fighter and it chips away, online and offline.
// Its health is set from the best damage you've ever shown, so each week is about a day of steady hitting.
const WB_BOSSES = [
  { id: 'wyrm', icon: '🐉', name: 'The Colossal Wyrm', skin: ['wb_wyrm_helm', 'Wyrmscale helm', 'head', 'full_helm', '#3a8a4a'] },
  { id: 'king', icon: '👑', name: 'The Hollow King', skin: ['wb_hollow_crown', 'Hollow crown', 'head', 'hat', '#d8b040'] },
  { id: 'titan', icon: '⛈️', name: 'The Tempest Titan', skin: ['wb_storm_cape', 'Stormcaller cape', 'cape', 'cape', '#4a6ad8'] },
  { id: 'levi', icon: '🐙', name: 'The Abyssal Leviathan', skin: ['wb_abyss_robe', 'Abyssal robe', 'body', 'robe', '#5a2a8a'] },
];
WB_BOSSES.forEach(b => { const [id, n, slot, kind, tint] = b.skin; cosmetic(id, n, slot, kind, tint, [0, 0, 0], { value: 4e7, trim: '#ffffff' }); ITEM_ORDER[id] = 1e6 + Object.keys(ITEM_ORDER).length; if (!WARD_IDS.includes(id)) WARD_IDS.push(id); });
const WB_HOURS = 24;                 // hours of assigned fighting at your best damage to kill it
const WB_MS = [0.25, 0.5, 0.75, 1];
const wbWeek = () => Math.floor((Date.now() / 864e5 + 3) / 7); // weeks start on Monday
const WB_MON = { id: 'world_boss', name: 'World boss', def: 60, lvl: 500, hp: 1, atk: 1, mh: 1, spd: 3 };
function wbDps() {
  try { const m = WB_MON, h = maxHit(false, m), c = hitChance(m); return Math.max(0.1, 0.5 * h * c / attackInterval()); } catch (e) { return 0.1; }
}
function wbState() {
  const L = S.lifetime, W = L.wb ||= { peak: 0, wk: -1, kills: 0, skins: {} };
  const wk = wbWeek();
  if (W.wk !== wk) {
    const B = WB_BOSSES[((wk % WB_BOSSES.length) + WB_BOSSES.length) % WB_BOSSES.length];
    W.peak = Math.max(W.peak || 0, wbDps());
    Object.assign(W, { wk, boss: B.id, max: Math.round(W.peak * WB_HOURS * 3600), dmg: 0, got: [] });
  }
  return W;
}
const wbBoss = () => WB_BOSSES.find(b => b.id === wbState().boss) || WB_BOSSES[0];
const wbCoin = () => Math.round(20000 * Math.pow(3, Math.min(14, lifeAsc() + 3 * tcount() + 6 * apoCount())));
const WB_REW = [
  [() => { const c = wbCoin(); gainCoins(c); add('mystery_box', 2); return `🪙${fmt(c)} + 2 mystery boxes`; }],
  [() => { const c = 2 * wbCoin(); gainCoins(c); add('clue_hard', 1); add('xp_lamp', 2); return `🪙${fmt(c)}, a hard clue + 2 XP lamps`; }],
  [() => { const c = 3 * wbCoin(); gainCoins(c); add('clue_elite', 1); add('xp_lamp', 3); return `🪙${fmt(c)}, an elite clue + 3 XP lamps`; }],
  [() => {
    const W = wbState(), B = wbBoss(), c = 5 * wbCoin(); gainCoins(c); add('clue_master', 1); W.kills = (W.kills || 0) + 1;
    const first = !W.skins[B.id], skin = first || Math.random() < 1 / 3; let t = `🪙${fmt(c)} + a master clue`;
    if (skin) { add(B.skin[0], 1); W.skins[B.id] = (W.skins[B.id] || 0) + 1; t += ` + ${ITEMS[B.skin[0]].name}!`; }
    return t;
  }],
];
function wbCheck() {
  const W = wbState(); if (!W.max) return;
  WB_MS.forEach((f, i) => { if (!W.got.includes(i) && W.dmg >= f * W.max) { W.got.push(i); const t = WB_REW[i][0](); if (!OFF) toast(`${wbBoss().icon} World boss ${f * 100}%: ${t}`, 'rare', 7000); else OFFLOG?.push(`${wbBoss().icon} World boss ${f * 100}% reward: ${t}`); } });
}
let wbT = 0, wbPk = 0;
tickCore = (orig => function (dt) {
  orig(dt); wbT += dt; if (wbT < 1) return; const d = wbT; wbT = 0;
  const W = wbState();
  if (!OFF && (wbPk += d) >= 30) { wbPk = 0; W.peak = Math.max(W.peak || 0, wbDps()); }
  if (!W.on || W.dmg >= W.max) return;
  if (S.combat?.fighting) S.combat.fighting = false; // your fighter is busy with the boss
  W.dmg = Math.min(W.max, W.dmg + wbDps() * d); wbCheck();
  if (W.dmg >= W.max) { W.on = false; if (!OFF) toast(`${wbBoss().icon} ${wbBoss().name} has fallen! A new boss arrives on Monday.`, 'rare', 7000); }
})(tickCore);
// starting a normal fight takes your fighter off the boss
startFight = (orig => function (...a) { const W = S.lifetime.wb; if (W?.on && !a[0]) { W.on = false; toast('🐉 Left the world boss to fight here.', '', 2500); } return orig.apply(this, a); })(startFight);

function viewWorldBoss() {
  const W = wbState(), B = wbBoss(), pct = W.max ? W.dmg / W.max : 0, dps = wbDps(), left = Math.max(0, W.max - W.dmg);
  const wkEnd = (wbWeek() + 1) * 7 - 3, tLeft = (wkEnd * 864e5 - Date.now()) / 1000;
  const done = W.dmg >= W.max;
  return subHead('🌍 World boss') + `<div class="panel wb">
      <div class="wb-icon">${B.icon}</div><h2>${B.name}</h2>
      <div class="hpbar"><i style="width:${(100 * (1 - pct)).toFixed(2)}%"></i><span>${done ? 'Defeated!' : `${fmt(left)} / ${fmt(W.max)}`}</span></div>
      <p class="small muted">${done ? 'Slain this week. ' : ''}A new boss arrives in <b>${tLeft > 86400 ? `${Math.floor(tLeft / 86400)}d ${Math.floor(tLeft % 86400 / 3600)}h` : fmtTime(tLeft)}</b>.</p>
      ${done ? '' : `<p class="small">Your damage: <b class="y">${dps < 10 ? dps.toFixed(2) : fmt(dps)}/s</b> · ${W.on ? `kills it in about <b>${fmtTime(left / dps)}</b>` : 'not fighting'}</p>
      <button class="btn big" data-act="wb-toggle">${W.on ? '⏸️ Recall your fighter' : '⚔️ Send your fighter'}</button>`}
    </div>
    <div class="panel"><h3>🎁 Rewards this week</h3>${WB_MS.map((f, i) => `<div class="trib ${W.got.includes(i) ? 'ok' : ''}">${W.got.includes(i) ? '✅' : '⬜'} <b>${f * 100}%</b> <small class="muted">${['🪙 + 2 mystery boxes', '🪙×2, hard clue, 2 lamps', '🪙×3, elite clue, 3 lamps', `🪙×5, master clue, ${W.skins[B.id] ? '1 in 3 chance of' : 'guaranteed'} ${ITEMS[B.skin[0]].name} (👑 wardrobe piece)`][i]}</small></div>`).join('')}
      <small class="muted">Coins grow with your AC, TD and Apotheosis count (🪙${fmt(wbCoin())} base).</small></div>
    <div class="panel small muted">While your fighter is on the boss it keeps hitting, even while you're away (up to your offline limit), but it can't fight anything else. The boss's health is set each Monday from the best damage you've ever shown, so better gear makes it fall faster during the week. Bosses slain: ${fmt(W.kills || 0)}.</div>`;
}
VIEWS.worldboss = () => rebrand(viewWorldBoss());
HUB_VIEWS.push('worldboss');
viewMenu = (orig => function () {
  const W = wbState(), done = W.dmg >= W.max;
  return orig().replace('<button class="hub-tile" data-act="hub" data-id="character">', `<button class="hub-tile" data-act="hub" data-id="worldboss"><span class="ht-icon">${wbBoss().icon}</span><b>World boss</b><small>${done ? 'Slain · back Monday' : `${fmt(100 * W.dmg / Math.max(1, W.max))}% done${W.on ? ' · fighting' : ''}`}</small></button><button class="hub-tile" data-act="hub" data-id="character">`);
})(viewMenu);
VIEWS.menu = (orig => function () { return rebrand(orig()); })(viewMenu);
viewCombat = (orig => function () {
  const W = wbState(); if (W.dmg >= W.max) return orig();
  return `<div class="panel row-between"><div><b>${wbBoss().icon} World boss</b><br><small class="muted">${W.on ? 'Your fighter is on the boss' : `${wbBoss().name} · ${fmt(100 * W.dmg / Math.max(1, W.max))}% down`}</small></div><button class="btn small" data-act="hub" data-id="worldboss">Open</button></div>` + orig();
})(viewCombat);
VIEWS.combat = (orig => function () { return rebrand(orig()); })(viewCombat);
viewSig = (orig => function () { if (UI.view !== 'worldboss') return orig(); const W = wbState(); return 'wb' + Math.floor(1000 * W.dmg / Math.max(1, W.max)) + W.on + W.got.length + W.wk; })(viewSig);

/* ================= SELL OUTCLASSED GEAR ================= */
// each piece is judged against the best piece you own for the SAME slot and the SAME combat style,
// so a melee setup never sells your bows or staffs, and quality versions are compared too
const ocStyle = it => it.slot === 'weapon' ? (it.wclass || (['longbow', 'shortbow', 'crossbow', 'blowpipe'].includes(it.kind) ? 'ranged' : ['staff', 'wand', 'trident'].includes(it.kind) ? 'magic' : 'melee')) : ((it.ratk || 0) + (it.rstr || 0) > (it.atk || 0) + (it.str || 0) && (it.ratk || 0) + (it.rstr || 0) >= (it.matk || 0) + (it.mdmg || 0)) ? 'ranged' : ((it.matk || 0) + (it.mdmg || 0) > (it.atk || 0) + (it.str || 0)) ? 'magic' : 'melee';
const ocScore = (id, style) => { const i = ITEMS[id] || {}, d = (i.def || 0) * 0.6; return style === 'ranged' ? (i.ratk || 0) + (i.rstr || 0) * 2 + d : style === 'magic' ? (i.matk || 0) + (i.mdmg || 0) * 3 + d : (i.atk || 0) + (i.str || 0) * 1.2 + d; };
function outclassed() {
  const keep = new Set([...Object.values(S.equip), ...(S.carried || []), ...Object.values(S.loadouts || {}).flatMap(l => Object.values(l?.equip || {}))]);
  (S.tribute?.items || []).forEach(([id]) => keep.add(id));
  for (const c of Object.values(S.lifetime?.contracts || {})) (c?.items || []).forEach(([id, q, d]) => { if (d < q) keep.add(id); });
  const owned = [...new Set([...Object.keys(S.bank).filter(id => have(id)), ...Object.values(S.equip).filter(Boolean)])].filter(id => ITEMS[id]?.slot);
  const best = {};
  for (const id of owned) { const it = ITEMS[id]; if (it.cosmetic || !reqOk(it.req)) continue; const k = it.slot + ':' + ocStyle(it) + (it.antifire ? ':af' : ''), sc = ocScore(id, ocStyle(it)); if (!best[k] || sc > best[k]) best[k] = sc; }
  return Object.keys(S.bank).filter(id => {
    const it = ITEMS[id]; if (!it?.slot || !have(id) || keep.has(id)) return false;
    if (S.locked[id] || S.fav?.[id] || it.cosmetic || (it.untradeable && !it.quality) || it.cat === 'tool' || it.outfit || it.perk) return false;
    if (it.rare && !it.quality) return false;
    if (['pickaxe', 'hatchet', 'rod', 'ammo', 'mattock'].includes(it.slot)) return false;
    const k = it.slot + ':' + ocStyle(it) + (it.antifire ? ':af' : ''), sc = ocScore(id, ocStyle(it)); return best[k] !== undefined && sc < best[k] - 0.01;
  });
}
viewBank = (orig => function () {
  const L = outclassed(); if (!L.length) return orig();
  const v = L.reduce((a, id) => a + sellPrice(id) * have(id), 0);
  return orig().replace('<div class="bank-grid" id="bankgrid">', `<div class="panel row-between small"><div>🧹 <b>${L.length} outclassed gear item${L.length > 1 ? 's' : ''}</b><br><small class="muted">You own something better for that slot and style · about 🪙${fmt(v)}</small></div><button class="btn small" data-act="sell-outclassed">Review</button></div><div class="bank-grid" id="bankgrid">`);
})(viewBank);
function ocModal() {
  const L = outclassed(), skip = UI.ocSkip ||= {}; if (!L.length) return closeModal();
  const pick = L.filter(id => !skip[id]), n = pick.reduce((a, id) => a + have(id), 0), v = pick.reduce((a, id) => a + sellPrice(id) * have(id), 0);
  const groups = ['melee', 'ranged', 'magic'].map(st => [st, L.filter(id => ocStyle(ITEMS[id]) === st)]).filter(([, g]) => g.length);
  openModal(`<div class="item-modal oc-modal"><h2>🧹 Sell outclassed gear?</h2><p class="small muted">Each item below is weaker than something you already own for the same slot and combat style. Tap an item to keep it. Locked and favourite items are never sold.</p>
    ${groups.map(([st, g]) => `<h3>${{ melee: '⚔️ Melee', ranged: '🎯 Ranged', magic: '🔮 Magic' }[st]}</h3><div class="oc-list">${g.map(id => `<button class="oc-row ${skip[id] ? 'kept' : ''}" data-act="oc-toggle" data-id="${id}">${itemIcon(id)}<span><b>${have(id) > 1 ? fmt(have(id)) + ' × ' : ''}${ITEMS[id].name}</b><small>${skip[id] ? 'Keeping' : '🪙' + fmt(sellPrice(id) * have(id))}</small></span><i>${skip[id] ? '🔒' : '✓'}</i></button>`).join('')}</div>`).join('')}
    <div class="row-btns"><button class="btn big danger ${n ? '' : 'disabled'}" data-act="oc-confirm">Sell ${fmt(n)} item${n === 1 ? '' : 's'} · 🪙${fmt(v)}</button><button class="btn" data-act="close">Cancel</button></div></div>`);
}
VIEWS.bank = (orig => function () { return rebrand(orig()); })(viewBank);

/* ---------- clicks & boot ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
  if (a === 'wb-toggle') {
    e.stopImmediatePropagation(); const W = wbState(); W.on = !W.on;
    if (W.on) { if (S.combat) S.combat.fighting = false; toast(`${wbBoss().icon} Your fighter heads off to face ${wbBoss().name}.`); }
    UI.force = true; render(); return;
  }
  if (a === 'sell-outclassed') { e.stopImmediatePropagation(); UI.ocSkip = {}; ocModal(); return; }
  if (a === 'oc-toggle') { e.stopImmediatePropagation(); const sk = UI.ocSkip ||= {}; sk[t.dataset.id] = !sk[t.dataset.id]; ocModal(); return; }
  if (a === 'oc-confirm') {
    e.stopImmediatePropagation(); const L = outclassed().filter(id => !(UI.ocSkip || {})[id]), c0 = S.coins; let n = 0;
    const T = toast; toast = () => {}; try { L.forEach(id => { n += have(id); sell(id, have(id)); }); } finally { toast = T; }
    closeModal(); toast(`🧹 Sold ${fmt(n)} outclassed gear item${n === 1 ? '' : 's'} for 🪙${fmt(S.coins - c0)}.`); UI.force = true; render(); return;
  }
}, true);
function boot37() { boot36(); wbState(); UI.force = true; render(); }
