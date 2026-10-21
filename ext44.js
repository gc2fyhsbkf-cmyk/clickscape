'use strict';
/* =========================================================
   CLICKSCAPE v9.20 — Collections: monster Codex, Trophy room, evolving pets,
   collection-log milestones. All kept forever.
   ========================================================= */

/* ================= CODEX ================= */
const CODEX_KILLS = [10, 100, 1000, 10000, 100000];
const codexStars = m => CODEX_KILLS.filter(k => lifeKills(m.id) >= k).length;
const codexMons = () => MONSTERS.filter(m => !m.boss && !m.raid && !m.barrows && regionOf(m) && regionOf(m) !== 'echo');
const regionDone = id => { const L = regMons(id).filter(m => !m.boss); return L.length > 0 && L.every(m => codexStars(m) >= 3); };
const codexRegions = () => [...REGIONS.filter(r => !r.event).map(r => r.id), 'slayer'].filter(id => (id === 'slayer' ? MONSTERS.some(m => regionOf(m) === 'slayer' && !m.boss) : regMons(id).some(m => !m.boss)));
const slayerDone = () => { const L = MONSTERS.filter(m => regionOf(m) === 'slayer' && !m.boss); return L.length && L.every(m => codexStars(m) >= 3); };
const codexSets = () => codexRegions().filter(id => id === 'slayer' ? slayerDone() : regionDone(id)).length;
// +2% damage and +2% drops per star against that monster
weaponVs = (orig => function (m) { return orig(m) * (m && !m.boss ? 1 + 0.02 * codexStars(m) : 1); })(weaponVs);
killMonster = (orig => function (m) {
  const s0 = m && !m.boss ? codexStars(m) : 0, l0 = M.luck;
  if (s0) M.luck *= 1 + 0.02 * s0;
  let r; try { r = orig.apply(this, arguments); } finally { M.luck = l0; }
  if (m && !m.boss && !m.raid) {
    const s1 = codexStars(m);
    if (s1 > s0) {
      const sets0 = S.lifetime.codexSets || 0, sets1 = codexSets(); S.lifetime.codexSets = sets1;
      const msg = `📖 Codex: ${m.name} ${'★'.repeat(s1)} · +${s1 * 2}% damage & drops against it${sets1 > sets0 ? ` · 🗺️ Region set complete! +3% combat XP` : ''}`;
      if (OFF) OFFLOG.push(msg); else toast(msg, sets1 > sets0 ? 'pet' : 'rare', 5000);
    }
  }
  return r;
})(killMonster);
const COMBAT_XP_SKILLS = new Set(['attack', 'strength', 'defence', 'ranged', 'magic', 'hitpoints', 'prayer', 'slayer']);
gainXP = (orig => function (skill, amt) { if (COMBAT_XP_SKILLS.has(skill) && S?.lifetime?.codexSets) amt *= 1 + 0.03 * S.lifetime.codexSets; return orig(skill, amt); })(gainXP);

/* ================= TROPHY ROOM ================= */
// every boss's lifetime kill count earns a trophy: bronze 50, silver 250, gold 1000 → global damage
const TROPHY = [[50, '🥉', 'Bronze', 0.0025], [250, '🥈', 'Silver', 0.005], [1000, '🥇', 'Gold', 0.01]];
const trophyBosses = () => MONSTERS.filter(m => m.boss && !m.raid && !m.season && !m.transReq);
const trophyOf = m => { let t = -1; TROPHY.forEach(([k], i) => { if (lifeKills(m.id) >= k) t = i; }); return t; };
const RAID_TROPHY = [['cox', '🏛️', 'Chambers of Xeric'], ['tob', '🩸', 'Theatre of Blood'], ['toa', '⚱️', 'Tombs of Amascut'], ['caves', '🌋', 'Fight Caves'], ['inferno', '☄️', 'Inferno'], ['gauntlet', '🐇', 'The Gauntlet'], ['cgauntlet', '🩸', 'Corrupted Gauntlet']];
const RAID_T = [10, 50, 250];
const raidTrophyOf = k => { const n = S.raids?.[k] || 0, L = S.lifetime.raidMax ||= {}; L[k] = Math.max(L[k] || 0, n); let t = -1; RAID_T.forEach((x, i) => { if (L[k] >= x) t = i; }); return t; };
function trophyBonus() {
  let d = 0; for (const m of trophyBosses()) { const t = trophyOf(m); if (t >= 0) d += TROPHY[t][3]; }
  for (const [k] of RAID_TROPHY) { const t = raidTrophyOf(k); if (t >= 0) d += TROPHY[t][3] * 2; }
  return d;
}
recalc4 = (orig => function () { orig(); if (!S?.lifetime) return; const d = trophyBonus(); if (d) M.dmg *= 1 + d; M.trophy = d; })(recalc4);

/* ================= EVOLVING PETS ================= */
const EVO = [{ n: '', k: 1 }, { n: 'Grown', k: 2 }, { n: 'Elder', k: 3.5 }];
const evoOf = p => S.lifetime.evo?.[p] || 0;
const evoCost = p => 250000 * Math.pow(20, evoOf(p)) * (1 + lifeAsc() * 0.5);
const evoName = p => `${EVO[evoOf(p)].n ? EVO[evoOf(p)].n + ' ' : ''}${PETS[p].name}`;
// a level-10 pet can evolve: its level bonus is doubled (Grown) then ×3.5 (Elder)
recalc4 = (orig => function () {
  orig(); if (!S?.pets || !S.lifetime?.evo) return;
  for (const p in S.pets) {
    const e = evoOf(p); if (!e) continue; const l = petLvl(p), st = PETS[p]?.st; if (!l) continue;
    const extra = (1 + 0.015 * l * EVO[e].k) / (1 + 0.015 * l);
    if (st && M.rate[st] !== undefined) { M.rate[st] *= extra; M.tap[st] *= extra; } else if (st === 'combat') M.dmg *= (1 + 0.003 * l * EVO[e].k) / (1 + 0.003 * l);
  }
})(recalc4);
function evolve(p) {
  const e = evoOf(p); if (e >= 2 || petLvl(p) < 10 || !S.pets[p]) return;
  const c = evoCost(p); if (S.coins < c) return toast(`🐾 Evolving costs 🪙${fmt(c)}.`, 'warn');
  S.coins -= c; (S.lifetime.evo ||= {})[p] = e + 1; S.petxp[p] = 3600 * 100; recalc();
  if (typeof fanLegend === 'function') fanLegend({ kind: '🐾 EVOLUTION 🐾', icon: `<span class="emo evo${e + 1}">${PETS[p].icon}</span>`, name: evoName(p), sub: `Level bonus ×${EVO[e + 1].k}: up to +${fmt(15 * EVO[e + 1].k)}% at level 10`, cls: 'pet' });
  UI.force = true; render();
}
viewPets = (orig => function () {
  return orig().replace(/<div class="pet got"><span>([^<]*)<\/span><small>([^<]*)<\/small>/g, (m, ic, name) => {
      const p = Object.keys(S.pets).find(k => PETS[k]?.name === name); if (!p) return m; const e = evoOf(p);
      return `<div class="pet got evo${e}"><span>${ic}</span><small>${e ? `<b class="y">${EVO[e].n}</b> ` : ''}${name}</small>${petLvl(p) >= 10 && e < 2 ? `<button class="btn small glow" data-act="pet-evo" data-id="${p}">Evolve · 🪙${fmt(evoCost(p))}</button>` : ''}`;
    })
    .replace('Each level adds +1.5% to their station, up to +25% total at level 10.', 'Each level adds +1.5% to their station (+15% at level 10). At level 10 a pet can <b>evolve</b>: Grown doubles the bonus, Elder makes it ×3.5.');
})(viewPets);
VIEWS.pets = (orig => function () { return rebrand(orig()); })(viewPets);

/* ================= COLLECTION LOG MILESTONES ================= */
cosmetic('collector_cape', "Collector's cape", 'cape', 'cape', '#c8a040', [0, 0, 8], { value: 8e7, trim: '#ffffff', untradeable: true }); ITEM_ORDER.collector_cape = 1e6 + Object.keys(ITEM_ORDER).length; if (!WARD_IDS.includes('collector_cape')) WARD_IDS.push('collector_cape');
const LOG_MS = [[5, () => { add('mystery_box', 3); return '3 mystery boxes'; }], [10, () => { add('xp_lamp', 3); add('clue_hard', 2); return '3 XP lamps and 2 hard clues'; }],
  [20, () => { add('collector_cape', 1); return "the Collector's cape (👑 wardrobe piece)"; }], [40, () => { add('clue_elite', 3); add('mystery_box', 10); return '3 elite clues and 10 mystery boxes'; }], [80, () => { add('clue_master', 3); return '3 master clues'; }]];
function logMilestones() {
  const n = M.clogPages || 0, G = S.lifetime.logMs ||= {};
  for (const [k, give] of LOG_MS) if (n >= k && !G[k]) { G[k] = 1; const t = give(); if (!OFF) toast(`📕 ${k} collection log pages! Reward: ${t}.`, 'pet', 7000); }
}
recalc4 = (orig => function () { orig(); if (S?.lifetime && M.clogPages && !logMilestones._busy) { logMilestones._busy = true; try { logMilestones(); } finally { logMilestones._busy = false; } } })(recalc4);

/* ================= THE COLLECTIONS PAGE ================= */
function viewCollections() {
  const tab = UI.colTab || 'codex';
  const tabs = `<div class="seg4">${[['codex', '📖', 'Codex'], ['trophy', '🏆', 'Trophies'], ['pets', '🐾', 'Pets'], ['log', '📕', 'Log']].map(([k, i, n]) => `<button class="${tab === k ? 'on' : ''}" data-act="col-tab" data-id="${k}"><span>${i}</span>${n}</button>`).join('')}</div>`;
  let body = '';
  if (tab === 'codex') {
    const sets = codexSets();
    body = `<div class="panel small">Every monster has a codex entry that earns stars from your <b>lifetime</b> kills (${CODEX_KILLS.map(fmt).join(' / ')}). Each star gives <b>+2% damage and +2% drops</b> against it. Get every regular monster in a region to ★★★ to complete its set: <b>+3% combat XP</b> each. Sets done: <b class="y">${sets}/${codexRegions().length}</b>.</div>` +
      codexRegions().map(id => {
        const R = REG_BY_ID[id], L = id === 'slayer' ? MONSTERS.filter(m => regionOf(m) === 'slayer' && !m.boss).sort((a, b) => a.lvl - b.lvl) : regMons(id).filter(m => !m.boss);
        const done = id === 'slayer' ? slayerDone() : regionDone(id), open = id === 'slayer' || regOpen(id);
        return `<div class="panel codex ${done ? 'done' : ''}"><h3>${R ? R.icon + ' ' + R.name : '💀 Slayer'} ${done ? '<span class="pill champ">SET ✔</span>' : `<small class="muted">${L.filter(m => codexStars(m) >= 3).length}/${L.length} at ★3</small>`}</h3>
          <div class="codex-grid">${L.map(m => { const s = codexStars(m); return `<button class="cx ${open ? '' : 'locked'} ${s ? '' : 'none'}" data-act="moninfo" data-id="${m.id}"><span style="${monFilter(m)}">${s || open ? m.icon : '❔'}</span><small>${s || open ? m.name : '???'}</small><i>${'★'.repeat(s)}${'☆'.repeat(5 - s)}</i></button>`; }).join('')}</div></div>`;
      }).join('');
  } else if (tab === 'trophy') {
    const B = trophyBosses().sort((a, b) => a.lvl - b.lvl);
    body = `<div class="panel small">Trophies come from your <b>lifetime</b> boss kills (🥉 50 · 🥈 250 · 🥇 1,000) and raid clears (🥉 10 · 🥈 50 · 🥇 250). Each one mounted adds permanent damage everywhere: bronze +0.25%, silver +0.5%, gold +1% (raids count double). Total: <b class="y">+${fmtD((M.trophy || 0) * 100)}% damage</b>.</div>
      <h3 class="sec-h">🏛️ Raids & runs</h3><div class="boss-grid">${RAID_TROPHY.map(([k, ic, n]) => { const t = raidTrophyOf(k); return `<div class="boss-tile trophy t${t}"><span class="bt-icon">${ic}</span><b>${n}</b><small>${t >= 0 ? TROPHY[t][1] + ' ' + TROPHY[t][2] : `${fmt(S.lifetime.raidMax?.[k] || 0)}/${RAID_T[0]}`}</small></div>`; }).join('')}</div>
      <h3 class="sec-h">👑 Bosses</h3><div class="boss-grid">${B.map(m => { const t = trophyOf(m), k = lifeKills(m.id), nx = TROPHY[t + 1]; return `<button class="boss-tile trophy t${t}" data-act="moninfo" data-id="${m.id}"><span class="bt-icon" style="${monFilter(m)}">${m.icon}</span><b>${m.name}</b><small>${t >= 0 ? TROPHY[t][1] + ' ' : ''}${fmt(k)}${nx ? `/${fmt(nx[0])}` : ' KC'}</small></button>`; }).join('')}</div>`;
  } else if (tab === 'pets') {
    const P = Object.keys(S.pets || {}).filter(p => PETS[p]);
    body = `<div class="panel small">Pets level up while they're with you. At level 10 they can <b>evolve</b>: Grown doubles their level bonus, Elder makes it ×3.5. Evolutions are kept forever.</div>` +
      (P.length ? `<div class="list">${P.map(p => { const l = petLvl(p), e = evoOf(p), can = l >= 10 && e < 2; return `<div class="upg"><div class="upg-icon"><span class="emo evo${e}">${PETS[p].icon}</span></div><div class="upg-main"><b>${evoName(p)}</b><small>Lv ${l}/10 · ${PETS[p].desc}${e ? ` · level bonus ×${EVO[e].k}` : ''}</small></div>${can ? `<button class="btn small ${S.coins >= evoCost(p) ? 'glow' : 'poor'}" data-act="pet-evo" data-id="${p}">Evolve<br><small>🪙${fmt(evoCost(p))}</small></button>` : e >= 2 ? '<span class="y small">Elder ✔</span>' : `<span class="muted small">Lv 10 to evolve</span>`}</div>`; }).join('')}</div>` : '<div class="panel muted">No pets yet. They come from skilling and bosses.</div>');
  } else {
    const n = M.clogPages || 0, G = S.lifetime.logMs || {};
    body = `<div class="panel small">Every finished collection log page gives +1% XP and +1% damage forever. Milestones add one-off rewards. Pages done: <b class="y">${n}</b>.</div>
      <div class="list">${LOG_MS.map(([k], i) => `<div class="trib ${G[k] ? 'ok' : ''}">${G[k] ? '✅' : '⬜'} <b>${k} pages</b> <small class="muted">${['3 mystery boxes', '3 XP lamps + 2 hard clues', "Collector's cape (👑 wardrobe)", '3 elite clues + 10 mystery boxes', '3 master clues'][i]}</small></div>`).join('')}</div>
      <button class="btn big" data-act="hub" data-id="clog">📕 Open the collection log</button>`;
  }
  return subHead('📚 Collections') + tabs + body;
}
VIEWS.collections = () => rebrand(viewCollections());
HUB_VIEWS.push('collections');
viewMenu = (orig => function () {
  return orig().replace('<button class="hub-tile" data-act="hub" data-id="contracts">', `<button class="hub-tile" data-act="hub" data-id="collections"><span class="ht-icon">📚</span><b>Collections</b><small>Codex ${codexSets()} sets · +${fmtD((M.trophy || 0) * 100)}% trophies</small></button><button class="hub-tile" data-act="hub" data-id="contracts">`);
})(viewMenu);
VIEWS.menu = (orig => function () { return rebrand(orig()); })(viewMenu);
viewSig = (orig => function () { return UI.view === 'collections' ? 'col' + (UI.colTab || '') + JSON.stringify(S.lifetime.mk || {}).length + JSON.stringify(S.lifetime.evo || {}) + (M.clogPages || 0) + Object.values(S.petxp || {}).map(x => Math.floor(Math.sqrt(x / 3600))).join() : orig(); })(viewSig);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
  if (a === 'col-tab') { e.stopImmediatePropagation(); UI.colTab = t.dataset.id; UI.force = true; render(); }
  if (a === 'pet-evo') { e.stopImmediatePropagation(); evolve(t.dataset.id); }
}, true);
function boot44() { boot43(); S.lifetime.codexSets = codexSets(); recalc(); UI.force = true; render(); }
