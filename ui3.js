'use strict';
/* =========================================================
   CLICKSCAPE v3 UI — guides, hub, new screens
   ========================================================= */
const HUB_VIEWS = ['challenges', 'achievements', 'clog', 'clue', 'character', 'season', 'pets', 'stats', 'settings', 'help'];
const subHead = (title, back = 'menu') => `<div class="skill-head panel"><button class="btn back" data-nav="${back}">‹</button><div class="sh-main"><div class="sh-title">${title}</div></div></div>`;

/* ---------- Skill guide ---------- */
function guideEntries(sk) {
  const E = [];
  const push = (lvl, icon, name, note, kind, id) => E.push({ lvl, icon, name, note, kind, id });
  (SKILL_STATIONS[sk] || []).forEach(st => STATION_ACTIONS[st].forEach(a => {
    if (a.star) return;
    const out = Object.keys(a.out)[0];
    let note = `${STATIONS[st].name} · ${fmtD(a.xp)} xp`;
    if (a.thieve) note += ` · ${a.thieve.coins ? '🪙 coins' : 'loot'}`;
    if (a.course) note += ` per lap · marks 1/${Math.round(1 / a.course.mark)}`;
    push(a.lvl, itemIcon(a.icon), a.name, note, 'act', out);
  }));
  if (sk === 'farming') CROPS.forEach(c => push(c.lvl, itemIcon(c.id + '_seed'), c.name, `Grows in ${fmtTime(c.time)} · ${fmtD(c.hxp)} xp per crop`, 'act', c.cropItem || c.id));
  if (sk === 'mining') push(10, '<span class="emo">🌠</span>', 'Shooting stars', 'Tier 1–9 stars crash every few hours (10 levels per tier)', 'other');
  if (sk === 'prayer') [[4, 'Burst of Strength', '+5% melee'], [13, 'Superhuman Strength', '+10% all styles'], [31, 'Ultimate Strength', '+15% melee, +10% ranged/magic'], [43, 'Protect from Melee', '−25% damage taken (−40% at 99)'], [44, 'Eagle Eye & Mystic Might', '+15% ranged/magic'], [60, 'Chivalry', '+15/18/20% melee'], [70, 'Piety', '+20/23/25% melee'], [77, 'Rigour & Augury', '+20% ranged, +25% magic']]
    .forEach(([l, n, d]) => push(l, '<span class="emo">🙏</span>', n, 'Prayer · ' + d, 'other'));
  if (sk === 'magic') SPELLS.forEach(([l, n, m]) => push(l, '<span class="emo">🔥</span>', n, `Spell · max hit ${m} (cast by any staff)`, 'other'));
  if (sk === 'slayer') {
    MONSTERS.filter(m => m.sl).forEach(m => push(m.sl, `<span class="emo" style="${monFilter(m)}">${m.icon}</span>`, m.name, `Can be assigned & damaged${m.needs ? ' · needs ' + ITEMS[m.needs].name : ''}${m.leaf ? ' · leaf-bladed weapon' : ''}`, 'other'));
    SLAYER_MASTERS.forEach(ms => push(Math.max(1, ms.sl), `<span class="emo">${ms.icon}</span>`, ms.name, `Slayer master · combat ${ms.cb}+ · ${ms.pts} pts/task`, 'other'));
  }
  if (sk === 'agility') push(1, '<span class="emo">🏃</span>', 'Light feet', 'Every Agility level makes all workers 0.3% faster', 'other');
  if (sk === 'hitpoints') push(10, '<span class="emo">❤️</span>', 'Max health', 'Each level is +1 max HP', 'other');
  Object.values(ITEMS).forEach(it => {
    if (it.hidden || !it.req || !(sk in it.req) || (it.id === 'max_cape' && sk !== 'attack')) return;
    const src = itemSources(it.id).find(x => !x.startsWith('Shop (capes)')) || itemSources(it.id)[0] || '';
    push(it.req[sk], itemIcon(it.id), it.name, (it.cat === 'tool' ? 'Use tool' : it.slot ? 'Wear' : 'Use') + (src ? ' · ' + src : ''), 'item', it.id);
  });
  UPGRADES.filter(u => u.req.skill === sk).forEach(u => push(u.req.lvl, `<span class="emo">${u.icon}</span>`, u.name, 'Upgrade · ' + u.desc, 'other'));
  return E.sort((a, b) => a.lvl - b.lvl || (a.kind === 'act' ? -1 : 1));
}
function nextUnlock(sk) { return guideEntries(sk).find(e => e.lvl > LV[sk]); }
function openGuide(sk, filter = 'all') {
  const all = guideEntries(sk);
  const list = all.filter(e => filter === 'all' || (filter === 'act' ? e.kind === 'act' : filter === 'item' ? e.kind === 'item' : e.kind === 'other'));
  const L = LV[sk];
  const nx = all.find(e => e.lvl > L);
  UI.guide = { sk, filter };
  openModal(`<h2>${SKILLS[sk].icon} ${SKILLS[sk].name} guide</h2>
    <p class="muted small">Level ${L}${nx ? ` · next unlock at <b class="y">${nx.lvl}</b>: ${nx.name} (${fmt(XP_TABLE[nx.lvl] - S.xp[sk])} xp to go)` : ' · everything unlocked!'}</p>
    <div class="chips">${[['all', 'All'], ['act', 'Training'], ['item', 'Equipment'], ['other', 'Other']].map(([k, n]) => `<button class="chip ${filter === k ? 'on' : ''}" data-act="guide" data-id="${sk}" data-f="${k}">${n}</button>`).join('')}</div>
    <div class="guide">${list.map(e => `<div class="g-row ${e.lvl <= L ? 'got' : ''} ${nx && e === nx ? 'next' : ''}" ${e.id && ITEMS[e.id] ? `data-act="info" data-id="${e.id}"` : ''}>
      <span class="g-lvl">${e.lvl}</span><span class="g-icon">${e.icon}</span><span class="g-main"><b>${e.name}</b><small>${e.note}</small></span>${e.lvl <= L ? '<span class="g-tick">✔</span>' : ''}</div>`).join('') || '<p class="muted">Nothing here.</p>'}</div>`);
}

/* ---------- Skill head (with guide + next unlock) ---------- */
function skillHead(sk, back = 'skills') {
  const nx = nextUnlock(sk);
  return `<div class="skill-head panel">
    <button class="btn back" data-nav="${back}">‹</button>
    <div class="sh-icon">${SKILLS[sk].icon}</div>
    <div class="sh-main"><div class="sh-title">${SKILLS[sk].name} <span class="lvlnum" data-lvl="${sk}">${LV[sk]}</span></div>${xpBar(sk)}
      ${nx ? `<div class="next-unlock">Next: ${nx.name} at <b>${nx.lvl}</b></div>` : '<div class="next-unlock">All unlocks reached 🏆</div>'}</div>
    <button class="btn guide-btn" data-act="guide" data-id="${sk}">📖<small>Guide</small></button>
  </div>`;
}

/* ---------- Skills grid ---------- */
function viewSkills() {
  const cells = SKILL_ORDER.map(s => `<button class="skill-cell" data-act="skill" data-id="${s}">
      <span class="sc-icon">${SKILLS[s].icon}</span>
      <span class="sc-lvl"><span>${LV[s]}</span><span class="slash">/</span><span>${LV[s]}</span></span>
      <span class="sc-bar"><i data-xp="${s}"></i></span>
      <span class="sc-name">${SKILLS[s].name}</span></button>`).join('');
  const working = STATION_ORDER.filter(st => S.workers[st]).map(st => {
    const a = ACTIONS[S.target[st]];
    return `<div class="work-line">${STATIONS[st].wicon} <b>${S.workers[st]}</b> × ${STATIONS[st].worker} → ${itemIcon(a.icon)} ${a.name} <span class="status" data-status="${st}"></span></div>`;
  }).join('');
  const star = starActive() ? `<div class="panel glow" data-act="skill" data-id="mining">🌠 A tier <b>${S.star.tier}</b> shooting star has landed! <span data-live2="star"></span></div>` : '';
  const clue = S.clues.active ? `<div class="panel glow" data-act="hub" data-id="clue">📜 Clue scroll in progress (step ${S.clues.active.idx + 1}/${S.clues.active.steps.length}). Tap to continue.</div>` : '';
  const claim = [...(S.ch.daily || []), ...(S.ch.weekly || [])].filter(c => c.done && !c.claimed).length;
  return `<div class="panel title-panel"><div class="tp-row"><span>Total level: <b class="y">${totalLevel()}</b></span><span>Combat: <b class="y">${combatLevel()}</b></span>${S.asc.points ? `<span>🌀 <b class="y">${S.asc.points}</b></span>` : ''}</div></div>
    ${star}${clue}${claim ? `<div class="panel glow" data-act="hub" data-id="challenges">📅 ${claim} challenge reward${claim > 1 ? 's' : ''} ready to claim!</div>` : ''}
    <div class="skill-grid">${cells}<div class="skill-cell total"><span class="sc-name">Total level</span><span class="sc-lvl">${totalLevel()}</span></div></div>
    <div class="panel"><h3>Your workforce</h3>${working || '<p class="muted">No workers yet. Open a skill and hire some help — they keep working even while you\'re away.</p>'}</div>
    ${FARM_SUMMARY()}`;
}

/* ---------- Station skill view ---------- */
function viewSkill() {
  const sk = UI.skill;
  if (sk === 'farming') return viewFarming();
  if (COMBAT_SKILLS.includes(sk)) {
    const how = {
      slayer: 'Get a task from a Slayer master in Combat → 💀 Slayer. Only kills on your task give Slayer XP, and many monsters need a Slayer level before you can damage them.',
      hitpoints: 'You gain Hitpoints XP from every hit you land. Each level is +1 max HP.',
      ranged: 'Wield a bow or crossbow and pick ammo in the Combat tab. Arrows come from Fletching (shafts + feathers + arrowtips from the Anvil). Accurate, Rapid (faster) or Longrange (shares XP with Defence).',
      magic: `Wield any staff to cast the best spell your level allows (currently <b>${spellFor()[1]}</b>, max hit ${spellFor()[2]}). Mage gear and magic damage bonuses raise your hits. The Trident of the seas scales with your Magic level instead.`,
    }[sk] || `Pick the <b>${{ attack: 'Accurate', strength: 'Aggressive', defence: 'Defensive' }[sk]}</b> combat style with a melee weapon to train ${SKILLS[sk].name}.`;
    return skillHead(sk) + `<div class="panel"><p>${SKILLS[sk].name} is trained by fighting monsters in the <b>Combat</b> tab.</p><p class="muted">${how}</p>
      <button class="btn big" data-act="gocombat" data-id="${sk === 'slayer' ? 'slayer' : ''}">Go fight ⚔️</button></div>`;
  }
  const sts = SKILL_STATIONS[sk];
  const st = sts.includes(UI.station[sk]) ? UI.station[sk] : sts[0];
  UI.curStation = st;
  const S0 = STATIONS[st];
  const a = ACTIONS[S.target[st]];
  const n = S.workers[st] || 0;
  let list = STATION_ACTIONS[st].filter(x => !x.star);
  let metalChips = '';
  if (st === 'anvil') {
    const unlocked = METALS.filter(m => LV.smithing >= m.lvl);
    const cur = UI.anvilMetal || a.metal || unlocked[unlocked.length - 1].id;
    metalChips = `<div class="chips">${METALS.map(m => `<button class="chip ${m.id === cur ? 'on' : ''} ${LV.smithing < m.lvl ? 'locked' : ''}" data-act="metal" data-id="${m.id}"><i class="dot" style="background:${m.tint}"></i>${m.name}</button>`).join('')}</div>`;
    list = list.filter(x => x.metal === cur);
  }
  const tool = S0.tool ? ITEMS[S.equip[S0.tool]] : null;
  const toolRow = S0.tool ? `<div class="panel tool-row">${tool ? itemIcon(tool.id) : '<span class="emo">🚫</span>'}<div><b>${tool ? tool.name : 'No ' + S0.tool + ' equipped!'}</b><div class="muted">Tool power ×${tool ? tool.mult : 0.25} · ${S0.tool === 'pickaxe' || S0.tool === 'hatchet' ? 'Forge better ones at the Anvil or buy in the Shop' : 'Buy better ones in the Shop'}</div></div></div>` : '';
  const rows = list.map(x => {
    const locked = LV[sk] < x.lvl, on = S.target[st] === x.id;
    const inp = x.inp ? Object.entries(x.inp).map(([id, q]) => `<span class="need">${itemIcon(id)}${q}<small>(<span data-count="${id}">${fmt(have(id))}</span>)</small></span>`).join('') : '';
    const outId = Object.keys(x.out)[0] || Object.keys(x.inp || {})[0];
    let extra = x.burn ? ` · stops burning at ${x.burn - (has('gauntlets') ? 10 : 0)}` : '';
    if (x.thieve) extra += ` · ${Math.round(thieveChance(x) * 100)}% success`;
    if (x.course) extra += ` · marks 1/${Math.round(1 / x.course.mark)}`;
    const qty = Object.values(x.out)[0] > 1 ? ` ×${Object.values(x.out)[0]}` : '';
    return `<button class="act-row ${on ? 'on' : ''} ${locked ? 'locked' : ''}" data-act="target" data-st="${st}" data-id="${x.id}">
      <span class="ar-icon">${itemIcon(x.icon)}</span>
      <span class="ar-main"><b>${x.name}${qty && !x.name.includes('×') ? qty : ''}</b><small>${locked ? '🔒 ' : ''}Lv ${x.lvl} · ${fmtD(x.xp)} xp${extra}</small>${inp ? `<span class="needs">${inp}</span>` : ''}</span>
      ${outId ? `<span class="ar-have">${itemIcon(outId)}<span data-count="${outId}">${fmt(have(outId))}</span></span>` : ''}
    </button>`;
  }).join('');
  const stageIn = a.inp ? `<div class="stage-in">${S0.verb}s: ${Object.entries(a.inp).map(([id, q]) => `${q}× ${ITEMS[id].name}`).join(' + ')}</div>` : '';
  const agi = st === 'course' ? `<div class="agi"><i id="agi-zone"></i><i id="agi-perfect"></i><i id="agi-cursor"></i></div><div class="stage-sub">Tap when the marker is in the green zone · gold = PERFECT ×3</div>` : '';
  return skillHead(sk) + stationTabs(sk, st) + `
    <div class="stage" data-tap="${st}">
      <div class="stage-bg ${st}"></div>
      <div class="stage-icon">${itemIcon(a.icon)}</div>
      <div class="stage-name">${a.name}</div>${stageIn}${agi}
      <div class="bar big"><i data-prog="${st}"></i></div>
      <div class="stage-sub">TAP to ${S0.verb.toLowerCase()} · power <b data-tappower="${st}"></b> / ${a.hp} <span class="status" data-status="${st}"></span></div>
    </div>
    <div class="panel worker-row">
      <div class="w-icon">${S0.wicon}</div>
      <div class="w-main"><b>${n} ${plural(S0.worker, n)}</b><div class="muted"><span data-rate="${st}"></span> power/s · ~<span data-ipm="${st}"></span> per min</div><div class="muted tiny">Permanent: they never leave and keep working offline (${has('long_rest') ? 24 : 8}h cap). Earn ${Math.round(WORKER_XP * 100)}% XP.</div></div>
      <div class="w-btns">
        <button class="btn" data-act="hire" data-st="${st}" data-k="1">Hire<small data-hire="${st}:1"></small></button>
        <button class="btn" data-act="hire" data-st="${st}" data-k="10">×10<small data-hire="${st}:10"></small></button>
        <button class="btn" data-act="hire" data-st="${st}" data-k="max">Max</button>
      </div>
    </div>
    ${st === 'mine' ? starPanel() : ''}${toolRow}${metalChips}${st === 'restore' ? museumPanel() : ''}
    ${st === 'dig' ? '<div class="panel small muted">⛏️ Excavating gives materials and sometimes a <b>damaged artifact</b>. Restore it at the <b>Restoration bench</b> tab using materials from the same site, then donate a full set to the Museum.</div>' : ''}
    <div class="list">${rows}</div>
    ${st === 'dig' ? museumPanel() : ''}${st === 'course' ? gracefulPanel() : ''}${st === 'thieve' ? roguePanel() : ''}`;
}
function starPanel() {
  if (!starActive()) return `<div class="panel muted small">🌠 No shooting star right now. Stars crash every few hours (you'll get a message).${have('stardust') ? ` · You have ${fmt(have('stardust'))} stardust. <button class="btn small" data-act="starshop">Star shop</button>` : ''}</div>`;
  const ok = LV.mining >= S.star.tier * 10;
  return `<div class="panel glow star-panel">🌠 <b>Tier ${S.star.tier} shooting star</b> · <span data-live2="stardust">${S.star.dust}</span> dust left in this layer · <span data-live2="star"></span>
    <div class="chips">${S.target.mine === 'm_star' ? '<span class="pill">Mining the star</span>' : `<button class="btn small ${ok ? '' : 'disabled'}" data-act="starmine">${ok ? 'Mine the star' : `Needs Mining ${S.star.tier * 10}`}</button>`}
    <button class="btn small" data-act="starshop">Star shop (${fmt(have('stardust'))} ✨)</button></div></div>`;
}
function gracefulPanel() {
  return `<div class="panel"><h3>✨ Grace's graceful shop <small class="muted">· ${fmt(have('mark_of_grace'))} marks</small></h3>
    <p class="muted small">Each graceful piece you wear makes every worker 2% faster (a full set gives +20%). Every Agility level adds another 0.3%.</p>
    ${GRACEFUL.map(([id, , , , cost]) => { const own = have(id) || Object.values(S.equip).includes(id); return `<div class="upg"><div class="upg-icon">${itemIcon(id)}</div><div class="upg-main"><b>${ITEMS[id].name}</b><small>${cost} marks of grace</small></div>
      ${own ? '<span class="y">✔ Owned</span>' : `<button class="btn ${have('mark_of_grace') < cost ? 'poor' : ''}" data-act="grace" data-id="${id}">Buy</button>`}</div>`; }).join('')}</div>`;
}
function roguePanel() {
  return `<div class="panel muted small">🦹 Rare finds while stealing: the <b>Rogues' outfit</b>. Each piece worn gives +15% loot; the full set doubles it. Clue scrolls come from pickpocketing too. Failing stuns you for a moment when tapping.
    <div class="chips">${ROGUE.map(([id]) => `<span class="chip ${S.clog[id] ? 'on' : 'locked'}">${itemIcon(id)}</span>`).join('')}</div></div>`;
}

/* ---------- Farming (crop item icons) ---------- */
function viewFarming() {
  const plots = S.plots.map((p, i) => {
    if (!p) return `<button class="plot empty" data-act="plot" data-i="${i}"><span class="pl-icon">🟫</span><span>Empty patch</span><small>Tap to plant</small></button>`;
    const c = CROP_BY_ID[p.c];
    return `<button class="plot ${plotReady(p) ? 'ready' : 'growing'}" data-act="plot" data-i="${i}">
      <span class="pl-icon">${itemIcon(c.cropItem || c.id)}</span><span>${c.name}${p.b ? ' 🌫️' : ''}</span><div class="bar"><i data-plot="${i}"></i></div><small data-plottime="${i}"></small></button>`;
  }).join('');
  const next = S.plots.length < 8 ? PLOT_COSTS[S.plots.length] : null;
  const seeds = CROPS.map(c => `<div class="act-row static ${LV.farming < c.lvl ? 'locked' : ''}"><span class="ar-icon">${itemIcon(c.id + '_seed')}</span>
      <span class="ar-main"><b>${c.name}</b><small>Lv ${c.lvl} · ${fmtTime(growTime(c))} · ${c.y[0]}-${c.y[1]} crops · ${fmtD(c.hxp)} xp each</small></span>
      <span class="ar-have">${itemIcon(c.id + '_seed')}<span data-count="${c.id}_seed">${fmt(have(c.id + '_seed'))}</span></span></div>`).join('');
  return skillHead('farming') + `
    <div class="panel"><div class="farm-actions"><button class="btn" data-act="harvestall">Harvest all</button><button class="btn" data-act="replant">Replant empty</button>
      <label class="toggle"><input type="checkbox" data-act="ashes" ${S.useAshes ? 'checked' : ''}> Use 3 ashes per plant (+50% yield) · have <span data-count="ashes">${fmt(have('ashes'))}</span></label></div>
      ${has('gardener') ? '<p class="muted">👩‍🌾 Your gardener auto-harvests and replants.</p>' : ''}</div>
    <div class="plots">${plots}${next !== null ? `<button class="plot buy" data-act="buyplot"><span class="pl-icon">➕</span><span>New patch</span><small data-afford="${next}">🪙${fmt(next)}</small></button>` : ''}</div>
    <div class="panel"><h3>Seeds</h3><p class="muted">Buy seeds in the Shop, find them in bird's nests, steal them from master farmers or loot them from monsters. Herbs feed Herblore; flax becomes bowstrings.</p></div>
    <div class="list">${seeds}</div>`;
}

/* ---------- Combat ---------- */
function boostsText() {
  const B = S.combat.boost || {}, out = [];
  for (const [k, n] of [['atk', 'Atk'], ['str', 'Str'], ['def', 'Def'], ['rng', 'Rng'], ['mag', 'Mag']]) if (B[k]?.t > 0) out.push(`${n} +${B[k].f + Math.floor(LV[{ atk: 'attack', str: 'strength', def: 'defence', rng: 'ranged', mag: 'magic' }[k]] * B[k].p)} <small>${fmtTime(B[k].t)}</small>`);
  if (B.antifire > 0) out.push(`🔥 Antifire <small>${fmtTime(B.antifire)}</small>`);
  return out.length ? '🧪 ' + out.join(' · ') : '';
}
function viewCombat() {
  const C = S.combat, m = curMon();
  const area = UI.area || m.area;
  const cls = wclass();
  const foodOpts = FOODS.filter(id => have(id));
  const pb = prayerBoost(), red = reduction();
  const mons = MONSTERS.filter(x => x.area === area).map(x => {
    const diff = x.lvl - combatLevel();
    const col = diff > 10 ? 'red' : diff > 0 ? 'orange' : diff > -10 ? 'yellow' : 'green';
    const err = canFight(x), req = monReqs(x), task = onTask(x);
    const done = x.barrows && S.barrows.killed.includes(x.barrows);
    return `<button class="act-row ${x.id === C.mon ? 'on' : ''} ${err ? 'locked' : ''}" data-act="mon" data-id="${x.id}">
      <span class="ar-icon emo-big" style="${monFilter(x)}">${x.icon}</span>
      <span class="ar-main"><b>${x.name}${x.boss ? ' 👑' : ''}${task ? ' <span class="pill">TASK</span>' : ''}${done ? ' ✔' : ''}</b><small><span class="cb-${col}">level-${x.lvl}</span> · ${x.hp} HP · max hit ${enemyMaxHit(x)}${S.kills[x.id] ? ` · ${fmt(S.kills[x.id])} kills` : ''}</small>
        ${req.length ? `<small class="reqs ${err ? 'bad' : ''}">${err ? '🔒 ' : ''}${req.join(' · ')}</small>` : ''}</span>
      <span class="ar-have small">${x.drops.filter(d => d[1] <= 1 / 50 && !d[0].startsWith('pet')).slice(-3).map(d => itemIcon(d[0])).join('')}<span class="info-btn" data-act="moninfo" data-id="${x.id}">📋</span></span></button>`;
  }).join('');
  let areaPanel = '';
  if (area === 'slayer') {
    const sl = S.slayer;
    areaPanel = `<div class="panel"><h3>Slayer masters <small class="muted">· ${fmt(sl.points)} points · streak ${sl.streak}</small></h3>
      <div class="masters">${SLAYER_MASTERS.map(ms => {
        const lock = combatLevel() < ms.cb || LV.slayer < ms.sl;
        return `<button class="master ${lock ? 'locked' : ''} ${sl.master === ms.id ? 'on' : ''}" data-act="master" data-id="${ms.id}"><span>${ms.icon}</span><b>${ms.name}</b><small>${lock ? `🔒 Combat ${ms.cb}${ms.sl > 1 ? ' · Slayer ' + ms.sl : ''}` : `${ms.pts} pts / task`}</small></button>`;
      }).join('')}</div>
      <p class="muted small">Tap a master for a task. Only task kills give Slayer XP (XP = the monster's HP). Every 10th task gives 5× points.</p>
      <button class="btn big" data-act="slshop">💀 Slayer shop</button></div>`;
  } else if (area === 'gwd') {
    areaPanel = `<div class="panel"><h3>God Wars kill count</h3><div class="kc-grid">${Object.entries(GODS).map(([g, n]) => `<div class="kc"><span class="dot" style="background:${GOD_TINT[g]}"></span>${n}<b data-live="kc-${g}">${fmt(S.kc[g] || 0)}</b><small>/ ${GWD_KC}</small></div>`).join('')}</div>
      <p class="muted small">Kill a god's followers to build kill count. Entering a general's chamber costs ${GWD_KC} KC; you stay inside until you retreat or die. Kree'arra flies, so bring Ranged or Magic. Nex needs a Frozen key, made from the four key pieces the generals drop.</p></div>`;
  } else if (area === 'minigames') {
    const B = S.barrows;
    areaPanel = `<div class="panel"><h3>⚱️ Barrows <small class="muted">· ${fmt(B.chests || 0)} chests opened</small></h3>
      <div class="chips">${BARROWS.map(b => `<span class="chip ${B.killed.includes(b.id) ? 'on' : ''}"><span style="${monFilter(MONSTER_BY_ID['barrows_' + b.id])}">${b.icon}</span> ${b.name.split(' ')[0]}${B.killed.includes(b.id) ? ' ✔' : ''}</span>`).join('')}</div>
      <p class="muted small">Defeat all six brothers to open the chest: coins, bolts, a 1/12 chance of a Barrows piece and sometimes a hard clue. You move to the next brother automatically. Full sets grant their famous effects.</p>
      <button class="btn big" data-act="barrows-run">${C.fighting && m.barrows ? 'Run in progress…' : 'Start Barrows run'}</button></div>`;
  }
  const sp = M.spec;
  const name = (C.fighting && C.sup ? 'Superior ' : '') + m.name;
  const ammoOpts = ITEMS[S.equip.weapon]?.ammo ? Object.keys(S.bank).filter(id => ITEMS[id].ammo === ITEMS[S.equip.weapon].ammo).sort((a, b) => ITEMS[b].rstr - ITEMS[a].rstr) : [];
  const potOpts = Object.keys(S.bank).filter(id => ITEMS[id].potion);
  const styleChips = STYLES[cls].map(([s, n, i]) => `<button class="chip ${C.style === s ? 'on' : ''}" data-act="style" data-id="${s}">${i} ${n}</button>`).join('');
  return taskBar() + `<div class="arena panel ${C.fighting && C.sup ? 'superior' : ''}">
      <div class="fighter" id="php"><div class="f-name">You <small>(level-${combatLevel()}) · ${{ melee: '⚔️ Melee', ranged: '🎯 Ranged', magic: '🔮 Magic' }[cls]}</small></div>
        <div class="hpbar"><i data-live="php"></i><span data-live="phptext"></span></div><div class="splats" id="psplat"></div>
        <div class="f-stats">Max hit <b>${maxHit(false, m)}</b> · Accuracy <b>${Math.round(hitChance(m) * 100)}%</b> · Dodge <b>${Math.round((1 - enemyHitChance(m)) * 100)}%</b>${red ? ` · 🙏 −${Math.round(red * 100)}% dmg` : ''}${M.set ? ` · <span class="y">${cap1(M.set)}'s set</span>` : ''}</div>
        <div class="f-stats boosts" data-live="boosts"></div>
        ${sp ? `<div class="spec-row"><div class="specbar"><i data-live="spec"></i><span data-live="spectext"></span></div><button class="btn small" data-act="spec" data-live="specbtn">${sp.name} (${sp.cost}%)</button></div>` : ''}</div>
      <div class="mstage ${C.fighting && C.mhp <= 0 ? 'dead' : ''}" id="mstage" data-tap="combat">
        <div class="mon" style="${monFilter(m)}">${m.icon}</div><div class="splats" id="msplat"></div>
        <div class="f-name">${name} <small>(level-${m.lvl})</small></div>
        <div class="hpbar enemy"><i data-live="mhp"></i><span data-live="mhptext"></span></div>
        <div class="muted small">${C.fighting ? `Tap to strike! Auto-attack every ${fmtD(attackInterval())}s` : 'Tap to attack'}${m.dragon && dragonfireMult() > 1 ? ` · <span class="cb-red">dragonfire ×${dragonfireMult()}: bring an anti-dragon shield or antifire</span>` : ''}${m.weak ? ` · weak to ${m.weak}` : ''}</div>
      </div>
      <div class="fight-btns"><button class="btn big ${C.fighting ? 'danger' : ''}" data-act="fight">${C.fighting ? 'Retreat' : 'Fight!'}</button><button class="btn" data-act="moninfo" data-id="${m.id}">📋 Drops</button></div>
    </div>
    <div class="tabs">${AREAS.map(([k, n]) => `<button class="tab ${area === k ? 'on' : ''}" data-act="area" data-id="${k}">${n}</button>`).join('')}</div>
    ${areaPanel}
    <div class="list">${mons}</div>
    <div class="panel"><h3>Combat style</h3><div class="chips">${styleChips}</div>
      ${cls === 'magic' ? `<p class="small">🔮 Casting <b>${ITEMS[S.equip.weapon].cast === 'trident' ? 'Trident of the seas' : spellFor()[1]}</b></p>` : ''}
      ${cls === 'ranged' ? `<h3>Ammo <small class="muted">(80% of ammo is picked back up)</small></h3><div class="chips">${ammoOpts.length ? ammoOpts.map(id => `<button class="chip ${C.ammo === id ? 'on' : ''} ${ITEMS[id].tier > (ITEMS[S.equip.weapon].ammoCap || 9) ? 'locked' : ''}" data-act="ammo" data-id="${id}">${itemIcon(id)} ${ITEMS[id].name} <small>+${ITEMS[id].rstr} · <span data-count="${id}">${fmt(have(id))}</span></small></button>`).join('') : '<span class="muted">No ammo! Fletch arrows or buy some.</span>'}</div>` : ''}
      <p class="small">🙏 Prayer: <b>${pb.n}</b>${LV.prayer >= 43 ? ' · Protect from Melee' : ' · <span class="muted">Protect from Melee at 43</span>'}</p>
      <h3>Potions <small class="muted">(pick up to 3 to auto-drink; each lasts ${POT_SECONDS / 60} min of fighting)</small></h3>
      <div class="chips">${potOpts.length ? potOpts.map(id => `<button class="chip ${(C.pots || []).includes(id) ? 'on' : ''}" data-act="potset" data-id="${id}">${itemIcon(id)} ${ITEMS[id].name} <small><span data-count="${id}">${fmt(have(id))}</span></small></button>`).join('') : '<span class="muted">No potions. Make them with Herblore.</span>'}</div>
      <h3>Auto-eat food <small class="muted">(eats below 50% HP)</small></h3>
      <div class="chips">${foodOpts.length ? foodOpts.map(id => `<button class="chip ${C.food === id ? 'on' : ''}" data-act="food" data-id="${id}">${itemIcon(id)} ${ITEMS[id].name} <small>+${ITEMS[id].heal} · <span data-count="${id}">${fmt(have(id))}</span></small></button>`).join('') : '<span class="muted">No food! Cook fish or buy some in the Shop.</span>'}</div>
      <div class="gear-sum">${gearLine()} <button class="btn small" data-act="hub" data-id="character">Gear & loadouts</button></div></div>
    <div class="panel"><h3>Loot</h3><div id="lootlog" class="lootlog"></div></div>`;
}
function gearLine() {
  const G = M.gear, cls = wclass();
  if (cls === 'ranged') return `🎯 +${G.ratk} acc · 🏹 +${G.rstr + (ITEMS[S.combat.ammo]?.rstr || 0)} str · 🛡️ +${G.def}`;
  if (cls === 'magic') return `🔮 +${G.matk} acc · ✨ +${G.mdmg}% dmg · 🛡️ +${G.def}`;
  return `⚔️ +${G.atk} · 💪 +${G.str} · 🛡️ +${G.def}`;
}

function openMonsterInfo(id) {
  const m = MONSTER_BY_ID[id];
  const rows = [...m.drops].sort((a, b) => b[1] - a[1]).map(([iid, ch, a, b]) => {
    const pet = iid.startsWith('pet:'), it = pet ? null : ITEMS[iid];
    const rate = ch >= 1 ? 'Always' : `1/${Math.round(1 / (ch * M.luck))}`;
    const got = S.clog[iid] || (pet && S.pets[iid.slice(4)]);
    const cls = ch >= 1 ? 'always' : ch > 1 / 20 ? 'common' : ch > 1 / 100 ? 'uncommon' : 'rare';
    return `<div class="drop ${cls}" ${pet ? '' : `data-act="info" data-id="${iid}"`}><span class="ar-icon">${pet ? `<span class="emo">${PETS[iid.slice(4)].icon}</span>` : itemIcon(iid)}</span>
      <span class="ar-main"><b>${pet ? PETS[iid.slice(4)].name + ' (pet)' : it.name}</b><small>${a === b ? a : a + '–' + b} · ${rate}${CLOG_ITEMS.has(iid) ? (got ? ' · 📒 ✔' : ' · 📒') : ''}</small></span><span class="rate ${cls}">${rate}</span></div>`;
  }).join('');
  const clue = m.boss ? 'elite 1/60' : `${clueTierFor(m.lvl)} 1/128`;
  openModal(`<div class="mon-info"><div class="mi-head"><span class="mi-icon" style="${monFilter(m)}">${m.icon}</span><div><h2>${m.name}${m.boss ? ' 👑' : ''}</h2><p class="muted small">Level ${m.lvl} · ${m.hp} HP · max hit ${enemyMaxHit(m)} · attacks every ${m.spd}s${S.kills[m.id] ? ` · ${fmt(S.kills[m.id])} kills` : ''}</p></div></div>
    ${monReqs(m).length ? `<p class="small reqs">${monReqs(m).join(' · ')}</p>` : ''}
    <p class="small">${m.coins ? `🪙 ${fmt(m.coins[0])}–${fmt(m.coins[1])} coins · ` : ''}📜 Clue: ${clue}${activeSeason() ? ` · ${activeSeason().icon} ${ITEMS[activeSeason().token].name.toLowerCase()} 1/30` : ''}</p>
    <h3>Drop table</h3><div class="drops">${rows || '<p class="muted">Nothing but glory.</p>'}</div>
    <p class="muted tiny">Rates include your current luck bonuses (×${(Math.round(M.luck * 100) / 100)}). Superior monsters roll 4 times.</p>
    <button class="btn big" data-act="mon-go" data-id="${m.id}">Fight ${m.name}</button></div>`);
}
function museumPanel() {
  return `<div class="panel museum"><h3>🏛️ Museum</h3><p class="muted small">Restore damaged artifacts at the Restoration bench, then donate one of each artifact from a dig site here. Each finished collection gives a permanent bonus that survives Ascension.</p>
  ${DIGSITES.map(d => {
    const done = S.museum[d.id];
    const can = !done && d.arts.every(([id]) => have(id) > 0);
    return `<div class="coll ${done ? 'done' : ''}"><div class="coll-head"><b>${d.name}</b><span class="muted">Lv ${d.lvl} · ${d.buff.desc}</span></div>
      <div class="coll-arts">${d.arts.map(([id, nm]) => `<span class="art ${have(id) || done ? 'got' : ''}" data-act="info" data-id="${id}" title="${esc(nm)}">${itemIcon(id)}<small>${done ? '✔' : have(id) + (have('damaged_' + id) ? ` <i>(+${have('damaged_' + id)} dmg)</i>` : '')}</small></span>`).join('')}
      ${done ? '<span class="y">✔ Complete</span>' : `<button class="btn ${can ? '' : 'disabled'}" data-act="donate" data-id="${d.id}">Donate</button>`}</div></div>`;
  }).join('')}</div>`;
}

/* ---------- Bank (search, locks) ---------- */
function bankTiles() {
  const q = (UI.bankQ || '').trim().toLowerCase();
  const ids = Object.keys(S.bank).filter(id => (UI.bankFilter === 'all' || bankCat(ITEMS[id]) === UI.bankFilter) && (!q || ITEMS[id].name.toLowerCase().includes(q))).sort((a, b) => ITEM_ORDER[a] - ITEM_ORDER[b]);
  return ids.map(id => `<button class="tile ${ITEMS[id].rare ? 'rare' : ''}" data-act="item" data-id="${id}">${itemIcon(id)}<span class="qty" data-count="${id}" data-qty>${qtyText(have(id))}</span>${S.locked[id] ? '<span class="lock">🔒</span>' : ''}</button>`).join('') || `<p class="muted pad">${q ? 'No items match “' + esc(q) + '”.' : 'Nothing here yet. Go gather something!'}</p>`;
}
function bankCat(it) {
  if (['ore', 'bar'].includes(it.cat)) return 'ore';
  if (['gear', 'tool', 'ammo'].includes(it.cat)) return 'gear';
  if (['food', 'fish'].includes(it.cat)) return 'food';
  if (['farm', 'herb'].includes(it.cat)) return 'farm';
  return 'other';
}
function viewBank() {
  const slots = [['head', '⛑️'], ['cape', '🧣'], ['neck', '📿'], ['ring', '💍'], ['hands', '🧤'], ['weapon', '🗡️'], ['body', '🦺'], ['shield', '🛡️'], ['legs', '👖'], ['feet', '👢'], ['pickaxe', '⛏️'], ['hatchet', '🪓'], ['rod', '🎣'], ['mattock', '⛏']];
  const eq = slots.map(([s, ph]) => {
    const id = S.equip[s];
    return `<button class="eq-slot ${id ? '' : 'empty'}" data-act="${id ? 'item-eq' : ''}" data-slot="${s}">${id ? itemIcon(id) : `<span class="emo ph">${ph}</span>`}<small>${s}</small></button>`;
  }).join('');
  const value = Object.entries(S.bank).reduce((a, [id, n]) => a + sellPrice(id) * n, 0);
  return `<div class="panel"><div class="row-between"><h3>Worn equipment</h3><button class="btn small" data-act="hub" data-id="character">🧍 Character & loadouts</button></div><div class="eq-grid">${eq}</div>
      <div class="gear-sum">${gearLine()}</div></div>
    <div class="search-row"><input id="bankq" type="search" placeholder="🔍 Search your bank…" value="${esc(UI.bankQ || '')}" autocomplete="off"><button class="btn small" data-act="nav-ge">📈 GE</button></div>
    <div class="chips">${[['all', 'All'], ['ore', 'Ores & bars'], ['gear', 'Gear & ammo'], ['food', 'Food'], ['farm', 'Farming & herbs'], ['other', 'Other']].map(([k, n]) => `<button class="chip ${UI.bankFilter === k ? 'on' : ''}" data-act="bankfilter" data-id="${k}">${n}</button>`).join('')}</div>
    <div class="bank-grid" id="bankgrid">${bankTiles()}</div>
    ${combinePanel()}
    <div class="panel muted small">Bank value: 🪙${fmt(value)} · ${Object.keys(S.bank).length} item types · 🔒 locked items can't be sold</div>`;
}

/* ---------- Item info ---------- */
function itemDesc(it) {
  const b = [];
  const st = [];
  if (it.atk || it.str) st.push(`⚔️ +${it.atk || 0}`, `💪 +${it.str || 0}`);
  if (it.ratk || it.rstr) st.push(`🎯 +${it.ratk || 0}`, `🏹 +${it.rstr || 0}`);
  if (it.matk || it.mdmg) st.push(`🔮 +${it.matk || 0}`, `✨ +${it.mdmg || 0}%`);
  if (it.def) st.push(`🛡️ +${it.def}`);
  if (it.slot && st.length) b.push(st.join(' · '));
  if (it.slot === 'weapon') b.push(`${{ ranged: '🎯 Ranged', magic: '🔮 Magic' }[it.wclass] || '⚔️ Melee'} · speed ×${it.spd || 1}${it.twoHanded ? ' · two-handed' : ''}${it.ammo ? ` · fires ${it.ammo}s up to ${['', 'bronze', 'iron', 'steel', 'mithril', 'adamant', 'rune', 'dragon'][it.ammoCap] || 'any'}` : ''}${it.doubleShot ? ' · fires two arrows' : ''}`);
  if (it.ammo) b.push(`Ammo · +${it.rstr} ranged strength`);
  if (it.spec) { const sp = SPECS[it.spec]; b.push(`⚡ Special: <b>${sp.name}</b> (${sp.cost}% energy)`); }
  if (it.potion) b.push('🧪 ' + Object.entries(it.potion).map(([k, v]) => k === 'antifire' ? 'Protects against dragonfire' : `+${v[0]} +${Math.round(v[1] * 100)}% ${{ atk: 'Attack', str: 'Strength', def: 'Defence', rng: 'Ranged', mag: 'Magic' }[k]}`).join(', ') + ` for ${POT_SECONDS / 60} min of fighting`);
  if (it.set && BARROWS.find(x => x.id === it.set)) b.push(`⚱️ Set effect (all 4 pieces): ${BARROWS.find(x => x.id === it.set).eff}`);
  if (it.set === 'graceful') b.push('🪶 +2% worker speed per piece worn (+20% for the full set)');
  if (it.set === 'rogue') b.push('🦹 +15% thieving loot per piece; full set doubles loot');
  if (it.cosmetic) b.push('✨ Rare cosmetic');
  if (it.starRing) b.push('🌠 +10% Mining speed');
  if (it.leaf) b.push('🍃 Can damage Turoth and Kurask');
  if (it.spear) b.push('Full damage against the Corporeal Beast');
  if (it.antifire) b.push('🔥 Protects against dragonfire');
  if (it.mirror) b.push('🪞 Lets you fight Cockatrice and Basilisks');
  if (it.reduce) b.push(`Reduces damage taken by ${Math.round(it.reduce * 100)}%`);
  if (it.luck) b.push(`Rare drops ×${it.luck}`);
  if (it.gemx) b.push(`Gems found while mining ×${it.gemx}`);
  if (it.slayerHelm) b.push('+16.7% accuracy & damage on Slayer task · works as earmuffs, nose peg & facemask');
  if (it.perk) b.push(it.perk === 'max' ? 'Grants every skillcape perk' : `Perk: ${SKILLS[it.perk].name} ${['attack', 'strength', 'defence'].includes(it.perk) ? '+5%' : it.perk === 'hitpoints' ? 'regen ×2' : it.perk === 'prayer' ? '−10% damage taken' : it.perk === 'slayer' ? '+10% Slayer points' : it.perk === 'farming' ? '+25% crop yield' : '+25% speed'}`);
  if (it.bonus) b.push(it.bonus.desc);
  if (it.mult) b.push(`Tool power ×${it.mult}`);
  if (it.req) b.push(`Requires ${reqText(it.req)}`);
  if (it.heal) b.push(`Heals ${it.heal}`);
  if (it.cat === 'arch' && it.kind === 'artifact') b.push(it.id.startsWith('damaged_') ? 'Restore it at Archaeology → Restoration bench, using materials from the same dig site.' : 'Donate one of each artifact from a site at Archaeology → Museum (on the Dig site and Restoration tabs) for a permanent bonus, or sell it.');
  if (it.clue) b.push('Read it to start a treasure trail.');
  if (it.lamp) b.push('Rub it for XP in a skill of your choice.');
  if (it.open) b.push('Can be opened.');
  if (it.untradeable) b.push('<span class="muted">Untradeable on the Grand Exchange</span>');
  return b.join('<br>');
}
function openItemModal(id, fromSlot) {
  const it = ITEMS[id];
  const n = have(id);
  const p = sellPrice(id);
  const locked = !!S.locked[id];
  const btns = [];
  if (fromSlot) btns.push(`<button class="btn big" data-act="unequip" data-slot="${fromSlot}">Remove</button>`);
  else if (n > 0) {
    if (it.slot) btns.push(`<button class="btn big" data-act="equip" data-id="${id}">${it.cat === 'tool' ? 'Wield tool' : 'Wear'}</button>`);
    if (it.potion) btns.push(`<button class="btn big" data-act="drink" data-id="${id}">Drink</button>`);
    if (it.heal) btns.push(`<button class="btn" data-act="eat" data-id="${id}">Eat</button>`);
    if (it.clue) btns.push(`<button class="btn big" data-act="open" data-id="${id}" data-q="1">Read clue</button>`);
    else if (it.lamp) btns.push(`<button class="btn big" data-act="open" data-id="${id}" data-q="1">Rub lamp</button>`);
    else if (it.open) btns.push(`<button class="btn big" data-act="open" data-id="${id}" data-q="1">Open</button><button class="btn" data-act="open" data-id="${id}" data-q="${n}">Open all</button>`);
    if (!locked) {
      btns.push(`<button class="btn" data-act="sell" data-id="${id}" data-q="1">Sell 1<small>🪙${fmt(p)}</small></button>`);
      if (n >= 10) btns.push(`<button class="btn" data-act="sell" data-id="${id}" data-q="10">Sell 10<small>🪙${fmt(p * 10)}</small></button>`);
      if (n > 1) btns.push(`<button class="btn" data-act="sell" data-id="${id}" data-q="${n - 1}">All but 1</button>`);
      btns.push(`<button class="btn danger" data-act="sell" data-id="${id}" data-q="${n}">Sell all<small>🪙${fmt(p * n)}</small></button>`);
      if (GE_SET.has(id)) btns.push(`<button class="btn" data-act="ge-sell" data-id="${id}" data-q="${n}">GE sell all<small>🪙${fmt(geSellPrice(id) * n)}</small></button>`);
    }
    btns.push(`<button class="btn" data-act="lock" data-id="${id}">${locked ? '🔓 Unlock' : '🔒 Lock'}</button>`);
  }
  if (it.slot && !['pickaxe', 'hatchet', 'rod', 'mattock'].includes(it.slot) && (n > 0 || fromSlot)) btns.push(`<button class="btn" data-act="look-set" data-id="${id}">👁️ Use as look</button>`);
  const recs = RECIPES.map((r, i) => [r, i]).filter(([r]) => r.inp[id] || r.out === id);
  const src = itemSources(id).slice(0, 5);
  openModal(`<div class="item-modal"><div class="im-icon">${itemIcon(id)}</div><h2>${it.name}${locked ? ' 🔒' : ''}</h2>
    <p class="muted">${fromSlot ? 'Equipped' : n ? `You have ${fmt(n)}` : "You don't have this yet"} · worth 🪙${fmt(p)} each${GE_SET.has(id) ? ` · GE 🪙${fmt(geSellPrice(id))}` : ''}</p><p class="small">${itemDesc(it)}</p>
    <div class="im-btns">${btns.join('')}</div>
    ${src.length ? `<h3>Where to get it</h3><div class="sources">${src.map(s => `<div>• ${s}</div>`).join('')}</div>` : ''}
    ${recs.length ? `<h3>Combinations</h3>${recs.map(([r, i]) => recipeRow(r, i)).join('')}` : ''}</div>`);
}

/* ---------- Shop ---------- */
const SHOP_CATS3 = [['tools', '⛏️ Tools'], ['gear', '🛡️ Gear'], ['supplies', '🧪 Supplies'], ['food', '🍖 Food'], ['seeds', '🌱 Seeds'], ['capes', '🧣 Capes']];
function viewShop() {
  const items = SHOP[UI.shopCat] || SHOP.tools;
  const rows = items.map(({ id, price }) => {
    const it = ITEMS[id];
    const multi = ['food', 'seeds', 'supplies'].includes(UI.shopCat) && !it.slot;
    if (UI.shopCat === 'capes') {
      const ok = reqOk(it.req);
      return `<div class="act-row static ${ok ? '' : 'locked'}"><span class="ar-icon">${itemIcon(id)}</span><span class="ar-main"><b>${it.name}</b><small>${ok ? '' : '🔒 '}${it.perk === 'max' ? 'Every skill at 99' : SKILLS[it.perk].name + ' 99'} · ${itemDesc(it).split('<br>').filter(x => x.startsWith('Perk') || x.startsWith('Grants')).join('')}</small></span>
        <span class="shop-btns"><button class="btn ${ok ? '' : 'disabled'}" data-act="buy" data-id="${id}" data-q="1" data-afford="${price}">🪙${fmt(price)}</button></span></div>`;
    }
    const crop = CROPS.find(c => c.id + '_seed' === id);
    const sub = it.req ? `Req ${reqText(it.req)}` : crop ? `Farming ${crop.lvl}` : it.heal ? `Heals ${it.heal}` : '';
    const stl = it.slot ? (it.mult ? ` · ×${it.mult}` : ' · ' + itemDesc(it).split('<br>')[0]) : '';
    return `<div class="act-row static" data-act="info" data-id="${id}"><span class="ar-icon">${itemIcon(id)}</span>
      <span class="ar-main"><b>${it.name}</b><small>${sub}${stl} · own <span data-count="${id}">${fmt(have(id))}</span></small></span>
      <span class="shop-btns"><button class="btn" data-act="buy" data-id="${id}" data-q="1" data-afford="${price}">🪙${fmt(price)}</button>
      ${multi ? `<button class="btn" data-act="buy" data-id="${id}" data-q="10" data-afford="${price * 10}">×10</button>` : ''}</span></div>`;
  }).join('');
  return `<div class="panel shop-head row-between"><div><h2>🏪 General Store</h2><p class="muted">“Buy something, or sell from your bank.”</p></div><button class="btn" data-act="nav-ge">📈 Grand<br>Exchange</button></div>
    <div class="tabs scroll">${SHOP_CATS3.map(([k, n]) => `<button class="tab ${UI.shopCat === k ? 'on' : ''}" data-act="shopcat" data-id="${k}">${n}</button>`).join('')}</div>
    <div class="list">${rows}</div>
    <div class="panel"><h3>Quick sell</h3><p class="muted">Sell all of a category in one tap (skips locked items, gear you wear, seeds, artifacts &amp; food).</p>
      <div class="chips"><button class="chip" data-act="quicksell" data-id="ore">Ores & bars</button><button class="chip" data-act="quicksell" data-id="log">Logs</button>
      <button class="chip" data-act="quicksell" data-id="drop">Bones & hides</button><button class="chip" data-act="quicksell" data-id="gem">Gems</button><button class="chip" data-act="quicksell" data-id="smith">Smithed gear</button><button class="chip" data-act="quicksell" data-id="junk">Burnt food & ashes</button></div></div>`;
}

/* ---------- Grand Exchange ---------- */
function spark(id) {
  const h = S.ge.hist[id] || [];
  if (h.length < 2) return '<svg class="spark" viewBox="0 0 60 18"></svg>';
  const lo = Math.min(...h), hi = Math.max(...h), r = hi - lo || 1;
  const pts = h.map((v, i) => `${(i / (h.length - 1) * 58 + 1).toFixed(1)},${(16 - (v - lo) / r * 14 + 1).toFixed(1)}`).join(' ');
  const up = h[h.length - 1] >= h[0];
  return `<svg class="spark" viewBox="0 0 60 18"><polyline points="${pts}" fill="none" stroke="${up ? '#5ad65a' : '#ff6a4a'}" stroke-width="1.6"/></svg>`;
}
function geRow(id, mode) {
  const f = geF(id), pct = Math.round((f - 1) * 100);
  const trend = `<small class="${pct >= 0 ? 'up' : 'down'}">${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct)}%</small>`;
  if (mode === 'sell') return `<div class="ge-row"><span class="ar-icon">${itemIcon(id)}</span><span class="ar-main"><b>${ITEMS[id].name}</b><small>🪙${fmt(geSellPrice(id))} each ${trend} · store 🪙${fmt(sellPrice(id))} · own ${fmt(have(id))}</small></span>${spark(id)}
    <span class="shop-btns">${S.locked[id] ? '<span class="muted">🔒</span>' : `<button class="btn small" data-act="ge-sell" data-id="${id}" data-q="1">1</button><button class="btn small" data-act="ge-sell" data-id="${id}" data-q="${have(id)}">All</button>`}</span></div>`;
  return `<div class="ge-row"><span class="ar-icon">${itemIcon(id)}</span><span class="ar-main"><b>${ITEMS[id].name}</b><small>🪙${fmt(geBuyPrice(id))} each ${trend} · own ${fmt(have(id))}</small></span>${spark(id)}
    <span class="shop-btns"><button class="btn small" data-act="ge-buy" data-id="${id}" data-q="1" data-afford="${geBuyPrice(id)}">1</button><button class="btn small" data-act="ge-buy" data-id="${id}" data-q="10" data-afford="${geBuyPrice(id) * 10}">10</button><button class="btn small" data-act="ge-watch" data-id="${id}">${(S.ge.watch || []).includes(id) ? '★' : '☆'}</button></span></div>`;
}
function geList() {
  const q = (UI.geQ || '').trim().toLowerCase();
  if (UI.geTab === 'buy') {
    const watch = (S.ge.watch || []).filter(id => GE_SET.has(id));
    const res = q.length >= 2 ? GE_ITEMS.filter(id => ITEMS[id].name.toLowerCase().includes(q)).slice(0, 40) : watch;
    return res.length ? res.map(id => geRow(id, 'buy')).join('') : `<p class="muted pad">${q.length >= 2 ? 'No tradeable items match.' : 'Search for any tradeable item to buy. Tap ☆ to watch an item and track its price.'}</p>`;
  }
  const ids = Object.keys(S.bank).filter(id => GE_SET.has(id) && (!q || ITEMS[id].name.toLowerCase().includes(q)))
    .sort((a, b) => (geSellPrice(b) - sellPrice(b)) * have(b) - (geSellPrice(a) - sellPrice(a)) * have(a));
  return ids.map(id => geRow(id, 'sell')).join('') || '<p class="muted pad">Nothing tradeable in your bank.</p>';
}
function viewGE() {
  UI.geTab ||= 'sell';
  const next = Math.max(0, GE_STEP - (now() - (S.ge.t || now())));
  return subHead('📈 Grand Exchange', 'shop') + `<div class="panel small"><p>Prices drift every 10 minutes (next update in <b data-live2="ge">${fmtTime(next / 1000)}</b>). Sell when an item trades above the store price; there is a 2% tax on sales and buys.</p>
      ${S.ge.news?.length ? `<div class="ge-news">${S.ge.news.slice(0, 4).map(n => `<div>${n}</div>`).join('')}</div>` : ''}
      <p class="muted">Lifetime flipping profit: 🪙${fmt(S.lifetime.geProfit || 0)}</p></div>
    <div class="tabs">${[['sell', 'Sell'], ['buy', 'Buy']].map(([k, n]) => `<button class="tab ${UI.geTab === k ? 'on' : ''}" data-act="ge-tab" data-id="${k}">${n}</button>`).join('')}</div>
    <div class="search-row"><input id="geq" type="search" placeholder="🔍 ${UI.geTab === 'buy' ? 'Search all items…' : 'Filter your items…'}" value="${esc(UI.geQ || '')}" autocomplete="off"></div>
    <div class="list" id="gelist">${geList()}</div>`;
}

/* ---------- More hub ---------- */
function viewMenu() {
  const claim = [...(S.ch.daily || []), ...(S.ch.weekly || [])].filter(c => c.done && !c.claimed).length;
  const cs = clogStats(), ad = ACHIEVEMENTS.filter(a => S.ach[a.id]).length, se = activeSeason();
  const tiles = [
    ['challenges', '📅', 'Challenges', claim ? `<b class="badge">${claim}</b> to claim` : 'Daily & weekly'],
    ['achievements', '🏆', 'Achievements', `${ad}/${ACHIEVEMENTS.length} · ${achPoints()} pts`],
    ['clog', '📒', 'Collection log', `${cs.got}/${cs.tot} · ${cs.pages} pages`],
    ['clue', '📜', 'Clue scroll', S.clues.active ? `<b class="badge">!</b> In progress` : `${Object.values(S.clues.done).reduce((a, b) => a + b, 0)} completed`],
    ['character', '🧍', 'Character', 'Gear, looks & loadouts'],
    ['ge', '📈', 'Grand Exchange', 'Buy, sell & flip'],
    ...(se ? [['season', se.icon, se.name + ' event', `${fmt(have(se.token))} ${ITEMS[se.token].name.toLowerCase()}s`]] : []),
    ['msglog', '💬', 'Game messages', `${MSGS.length} recent`],
    ['pets', '🐾', 'Pets', `${Object.keys(S.pets).length}/${Object.keys(PETS).length}`],
    ['stats', '📊', 'Stats', 'Your numbers'],
    ['settings', '⚙️', 'Settings & save', 'Sound, backup, install'],
    ['help', '❓', 'How to play', 'Tips & systems'],
  ];
  return `<div class="panel"><h2>☰ More</h2></div><div class="hub">${tiles.map(([id, i, n, d]) => `<button class="hub-tile" data-act="hub" data-id="${id}"><span class="ht-icon">${i}</span><b>${n}</b><small>${d}</small></button>`).join('')}</div>`;
}
function viewChallenges() {
  ensureChallenges();
  const block = (kind, title) => {
    const list = S.ch[kind] || [];
    const reset = kind === 'daily' ? (() => { const t = new Date(); t.setHours(24, 0, 0, 0); return t - Date.now(); })() : (() => { const t = new Date(); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() + ((8 - t.getDay()) % 7 || 7)); return t - Date.now(); })();
    return `<div class="panel"><h3>${title} <small class="muted">· resets in ${fmtTime(reset / 1000)}</small></h3>${list.map((c, i) => `<div class="ch ${c.done ? 'done' : ''}"><div class="ch-main"><b>${c.text}</b>
      <div class="bar"><i style="width:${c.prog / c.n * 100}%"></i></div><small>${fmt(c.prog)} / ${fmt(c.n)}</small></div>
      ${c.claimed ? '<span class="y">✔</span>' : c.done ? `<button class="btn" data-act="chclaim" data-k="${kind}" data-i="${i}">Claim</button>` : ''}</div>`).join('')}</div>`;
  };
  return subHead('📅 Challenges') + block('daily', 'Daily challenges') + block('weekly', 'Weekly challenges') +
    '<div class="panel muted small">Daily rewards: coins plus a casket, clue, lamp or mystery box. Weekly rewards: lots of coins, a lamp, two mystery boxes and a hard clue.</div>';
}
function viewAchievements() {
  const ap = achPoints(), done = ACHIEVEMENTS.filter(a => S.ach[a.id]).length;
  const list = [...ACHIEVEMENTS].sort((a, b) => (!!S.ach[b.id]) - (!!S.ach[a.id]));
  return subHead('🏆 Achievements') + `<div class="panel"><p><b class="y">${done}</b> / ${ACHIEVEMENTS.length} complete · <b class="y">${ap}</b> points</p>
    <p class="muted small">Every 10 points permanently gives +1% XP and +1% sell prices (currently +${Math.floor(ap / 10)}%).</p></div>
    <div class="list">${list.map(a => `<div class="upg ${S.ach[a.id] ? 'got' : 'locked'}"><div class="upg-icon">${S.ach[a.id] ? a.icon : '🔒'}</div><div class="upg-main"><b>${a.name}</b><small>${a.desc}</small></div><small class="y">${a.ap} pt</small></div>`).join('')}</div>`;
}
function viewClog() {
  const cs = clogStats(), cats = [...new Set(CLOG.map(p => p.cat))];
  UI.clogCat ||= cats[0];
  const pages = CLOG.filter(p => p.cat === UI.clogCat);
  return subHead('📒 Collection log') + `<div class="panel"><p><b class="y">${cs.got}</b> / ${cs.tot} items (${cs.pct}%) · <b class="y">${cs.pages}</b> pages complete</p>
    <p class="muted small">Each completed page permanently gives +1% XP and +1% damage.</p></div>
    <div class="tabs scroll">${cats.map(c => `<button class="tab ${UI.clogCat === c ? 'on' : ''}" data-act="clogcat" data-id="${c}">${c}</button>`).join('')}</div>
    <div class="list">${pages.map(p => {
      const g = p.items.filter(i => S.clog[i]).length, open = UI.clogOpen === p.id;
      return `<div class="clog-page ${g === p.items.length ? 'done' : ''}"><button class="act-row" data-act="clogpage" data-id="${p.id}"><span class="ar-icon emo-big">${p.icon}</span><span class="ar-main"><b>${p.name}</b><small>${g} / ${p.items.length}${p.id.startsWith('m_') && S.kills[p.id.slice(2)] ? ` · ${fmt(S.kills[p.id.slice(2)])} kills` : ''}</small></span><span>${open ? '▲' : '▼'}</span></button>
        ${open ? `<div class="clog-grid">${p.items.map(i => { const pet = i.startsWith('pet:'), n = S.clog[i] || 0; const icon = pet ? `<span class="emo">${PETS[i.slice(4)].icon}</span>` : itemIcon(i);
          return `<div class="clog-item ${n ? 'got' : ''}" ${pet ? '' : `data-act="info" data-id="${i}"`} title="${esc(pet ? PETS[i.slice(4)].name : ITEMS[i].name)}">${icon}${n ? `<small>${fmt(n)}</small>` : ''}</div>`; }).join('')}</div>` : ''}</div>`;
    }).join('')}</div>`;
}
function viewClue() {
  const c = S.clues.active;
  let body;
  if (c) {
    const s = c.steps[c.idx], T = CLUE_TIERS[c.tier];
    let actions = '';
    if (s.type === 'riddle') actions = `<div class="riddle">${s.opts.map((o, i) => `<button class="btn" data-act="clueans" data-i="${i}">${o}</button>`).join('')}</div>`;
    else if (s.type === 'kill') actions = `<button class="btn big" data-act="cluefight">Fight ${MONSTER_BY_ID[s.mon].name}</button>`;
    else actions = `<button class="btn big" data-act="cluego">Go to ${SKILLS[STATIONS[ACTIONS[s.act].st].skill].name}</button><p class="muted small">Workers count too, once you set this as their target.</p>`;
    body = `<div class="panel clue-card" style="--ct:${T.tint}"><div class="clue-tier">${itemIcon('clue_' + c.tier)} ${T.name} clue · step ${c.idx + 1} of ${c.steps.length}</div>
      <p class="clue-text">${clueStepText(s)}</p>${actions}</div>`;
  } else body = '<div class="panel"><p>No clue scroll in progress.</p><p class="muted small">Clues drop from monsters (higher level = harder clues), pickpocketing, skilling, Barrows chests and challenge rewards.</p></div>';
  const owned = Object.keys(CLUE_TIERS).filter(t => have('clue_' + t));
  return subHead('📜 Clue scroll') + body +
    `${owned.length ? `<div class="panel"><h3>Clues in your bank</h3>${owned.map(t => `<div class="upg"><div class="upg-icon">${itemIcon('clue_' + t)}</div><div class="upg-main"><b>${CLUE_TIERS[t].name} clue</b><small>You have ${have('clue_' + t)}</small></div><button class="btn ${c ? 'disabled' : ''}" data-act="clueread" data-id="${t}">Read</button></div>`).join('')}</div>` : ''}
    <div class="panel"><h3>Completed</h3><div class="stats">${Object.keys(CLUE_TIERS).map(t => `<div>${CLUE_TIERS[t].name}</div><b>${fmt(S.clues.done[t] || 0)}</b>`).join('')}</div></div>`;
}
function dollSVG() {
  const t = slot => ITEMS[lookOf(slot)]?.tint;
  const k = slot => ITEMS[lookOf(slot)]?.kind;
  const emb = (slot, x, y, w, rot = 0) => {
    const id = lookOf(slot); if (!id) return '';
    const it = ITEMS[id];
    if (it.emoji) return `<text x="${x + w / 2}" y="${y + w * 0.8}" font-size="${w * 0.8}" text-anchor="middle">${it.emoji}</text>`;
    const inner = itemIcon(id).replace(/<svg[^>]*>/, '').replace('</svg>', '');
    return `<g transform="translate(${x} ${y}) rotate(${rot} ${w / 2} ${w / 2}) scale(${w / 32})">${inner}</g>`;
  };
  const skin = '#e3b48a', body = t('body') || '#7a5a3a', legs = t('legs') || '#4a3a2a', feet = t('feet') || '#3a2a1a', hands = t('hands') || skin;
  const cape = t('cape'), head = lookOf('head'), hk = k('head');
  const helm = !head ? `<path d="M88 30 C 88 18, 112 18, 112 30 L112 34 L88 34 Z" fill="#5a3a1a"/>`
    : ['hat', 'coif'].includes(hk) ? `<path d="M84 36 C 86 18, 114 18, 116 36 L116 42 L84 42 Z" fill="${t('head')}" stroke="#000" stroke-width="1.5"/>${hk === 'hat' ? `<path d="M92 26 L100 4 L108 26 Z" fill="${t('head')}" stroke="#000" stroke-width="1.5"/>` : ''}`
    : `<path d="M84 50 C 82 22, 118 22, 116 50 Z" fill="${t('head')}" stroke="#000" stroke-width="1.5"/><path d="M90 38 L110 38 L109 42 L91 42 Z" fill="#111"/>`;
  return `<svg class="doll" viewBox="0 0 200 250">
    <ellipse cx="100" cy="238" rx="56" ry="8" fill="#000" opacity=".35"/>
    ${cape ? `<path d="M72 64 L128 64 L142 196 L58 196 Z" fill="${cape}" stroke="#000" stroke-width="1.5"/>` : ''}
    <rect x="80" y="150" width="17" height="70" rx="4" fill="${legs}" stroke="#000" stroke-width="1.5"/><rect x="103" y="150" width="17" height="70" rx="4" fill="${legs}" stroke="#000" stroke-width="1.5"/>
    <rect x="76" y="216" width="22" height="12" rx="4" fill="${feet}" stroke="#000" stroke-width="1.5"/><rect x="102" y="216" width="22" height="12" rx="4" fill="${feet}" stroke="#000" stroke-width="1.5"/>
    <rect x="58" y="70" width="16" height="66" rx="6" fill="${body}" stroke="#000" stroke-width="1.5"/><rect x="126" y="70" width="16" height="66" rx="6" fill="${body}" stroke="#000" stroke-width="1.5"/>
    <circle cx="66" cy="140" r="8" fill="${hands}" stroke="#000" stroke-width="1.5"/><circle cx="134" cy="140" r="8" fill="${hands}" stroke="#000" stroke-width="1.5"/>
    <path d="M74 64 L126 64 L124 158 L76 158 Z" fill="${body}" stroke="#000" stroke-width="1.5"/>
    <rect x="92" y="52" width="16" height="14" fill="${skin}"/>
    <circle cx="100" cy="38" r="17" fill="${skin}" stroke="#000" stroke-width="1.5"/><circle cx="94" cy="38" r="2" fill="#000"/><circle cx="106" cy="38" r="2" fill="#000"/>
    ${helm}
    ${lookOf('neck') ? `<circle cx="100" cy="74" r="5" fill="${t('neck')}" stroke="#e0b030" stroke-width="2"/>` : ''}
    ${emb('weapon', 128, 92, 52, 10)}${emb('shield', 30, 104, 42)}
  </svg>`;
}
function viewCharacter() {
  const G = M.gear;
  const looks = Object.entries(S.cosmetic).filter(([, v]) => v);
  return subHead('🧍 Character') + `<div class="panel char"><div class="doll-wrap">${dollSVG()}</div>
      <div class="char-stats"><h3>Bonuses</h3><div class="stats">
        <div>⚔️ Melee accuracy</div><b>+${G.atk}</b><div>💪 Melee strength</div><b>+${G.str}</b>
        <div>🎯 Ranged accuracy</div><b>+${G.ratk}</b><div>🏹 Ranged strength</div><b>+${G.rstr}</b>
        <div>🔮 Magic accuracy</div><b>+${G.matk}</b><div>✨ Magic damage</div><b>+${G.mdmg}%</b>
        <div>🛡️ Defence</div><b>+${G.def}</b><div>🙏 Damage reduction</div><b>${Math.round(reduction() * 100)}%</b>
        <div>Combat level</div><b>${combatLevel()}</b><div>Set effect</div><b>${M.set ? cap1(M.set) : M.grace === 6 ? 'Graceful' : M.rogue === 5 ? 'Rogue' : '—'}</b></div></div></div>
    ${looks.length ? `<div class="panel"><h3>👁️ Looks</h3><p class="muted small">Cosmetic overrides only change how you look.</p><div class="chips">${looks.map(([s, id]) => `<span class="chip">${itemIcon(id)} ${s}: ${ITEMS[id].name}</span>`).join('')}</div><button class="btn small" data-act="look-clear">Clear looks</button></div>` : '<div class="panel muted small">👁️ Tip: open any gear item and tap “Use as look” to wear it cosmetically over your real gear.</div>'}
    <div class="panel"><h3>🎒 Loadouts</h3><p class="muted small">Save your gear, combat style, food, potions and ammo, then swap in one tap.</p>
      ${S.loadouts.map((L, i) => `<div class="upg"><div class="upg-icon">${L ? (L.equip.weapon ? itemIcon(L.equip.weapon) : '🎒') : '➕'}</div><div class="upg-main"><b>${L ? esc(L.name) : 'Empty slot ' + (i + 1)}</b><small>${L ? GEAR_SLOTS.filter(s => L.equip[s]).length + ' items · ' + (STYLES.melee.concat(STYLES.ranged, STYLES.magic).find(x => x[0] === L.style)?.[1] || '') : 'Save what you are wearing now'}</small></div>
        ${L ? `<button class="btn small" data-act="lo-equip" data-i="${i}">Equip</button>` : ''}<button class="btn small" data-act="lo-save" data-i="${i}">Save</button></div>`).join('')}</div>
    <div class="panel"><button class="btn big" data-nav="bank">Open bank & equipment</button></div>`;
}
function viewSeason() {
  const se = activeSeason();
  if (!se) return subHead('Events') + '<div class="panel">No seasonal event is running right now. Halloween runs 15 Oct – 7 Nov and Christmas runs through December.</div>';
  return subHead(`${se.icon} ${se.name} event`) + `<div class="panel glow"><p>During ${se.name}, random events may arrive as ${se.icon} spirits and monsters sometimes drop <b>${ITEMS[se.token].name.toLowerCase()}s</b>. Trade them here for limited cosmetics.</p>
    <p>You have <b class="y">${fmt(have(se.token))}</b> ${ITEMS[se.token].name.toLowerCase()}s.</p></div>
    <div class="list">${se.shop.map(([id, cost]) => `<div class="upg"><div class="upg-icon">${itemIcon(id)}</div><div class="upg-main"><b>${ITEMS[id].name}</b><small>${cost} ${ITEMS[se.token].name.toLowerCase()}s · own ${fmt(have(id))}</small></div>
      <button class="btn ${have(se.token) < cost ? 'poor' : ''}" data-act="season-buy" data-id="${id}">Buy</button></div>`).join('')}</div>`;
}
function viewPets() {
  return subHead('🐾 Pets') + `<div class="panel"><div class="pet-grid">${Object.entries(PETS).map(([id, p]) => `<div class="pet ${S.pets[id] ? 'got' : ''}"><span>${S.pets[id] ? p.icon : '❔'}</span><small>${S.pets[id] ? p.name : '???'}</small><small class="muted">${p.desc}</small></div>`).join('')}</div></div>`;
}
function viewStats() {
  const st = S.stats, lt = S.lifetime;
  return subHead('📊 Stats') + `<div class="panel"><div class="stats">
      <div>Taps (run / all)</div><b>${fmt(st.taps)} / ${fmt(lt.taps)}</b>
      <div>Kills (run / all)</div><b>${fmt(st.kills)} / ${fmt(lt.kills)}</b>
      <div>Coins earned (run)</div><b>🪙${fmt(st.earned)}</b>
      <div>Total XP (run / all)</div><b>${fmt(st.xpRun)} / ${fmt(lt.xp)}</b>
      <div>Rare finds</div><b>${fmt(st.rares)}</b>
      <div>Random events</div><b>${fmt(st.events)}</b>
      <div>Slayer tasks</div><b>${fmt(S.slayer.done)}</b>
      <div>Barrows chests</div><b>${fmt(S.barrows.chests || 0)}</b>
      <div>Agility laps</div><b>${fmt(lt.laps || 0)}</b>
      <div>Potions drunk</div><b>${fmt(lt.pots || 0)}</b>
      <div>Stardust mined</div><b>${fmt(lt.stardust || 0)}</b>
      <div>Ascensions</div><b>${S.asc.count}</b>
      <div>Workers</div><b>${Object.values(S.workers).reduce((a, b) => a + b, 0)}</b></div></div>
    <div class="panel"><h3>Boss kills</h3><div class="stats">${MONSTERS.filter(m => m.boss).map(m => `<div>${m.icon} ${m.name}</div><b>${fmt(S.kills[m.id] || 0)}</b>`).join('')}</div></div>`;
}
function viewSettings() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return subHead('⚙️ Settings & save') + `<div class="panel"><h3>🔊 Sound</h3>
      <label class="toggle"><input type="checkbox" data-act="set-sound" ${S.settings.sound ? 'checked' : ''}> Sound effects</label>
      <label class="toggle">Volume <input id="volume" type="range" min="0" max="1" step="0.05" value="${S.settings.volume ?? 0.6}"></label>
      <label class="toggle"><input type="checkbox" data-act="vibrate" ${S.settings.vibrate ? 'checked' : ''}> Vibrate on rare drops</label>
      <label class="toggle"><input type="checkbox" data-act="set-autolock" ${S.settings.autoLock ? 'checked' : ''}> Auto-lock rare items when you first get them</label></div>
    ${!standalone ? `<div class="panel glow"><h3>📲 Install as an app</h3>${deferredInstall ? '<button class="btn big" data-act="install">Install Clickscape</button>' :
      isIOS ? '<p>In Safari tap the <b>Share</b> button, then <b>Add to Home Screen</b>.</p>' : '<p>Open your browser menu (⋮) and choose <b>Install app</b> or <b>Add to Home screen</b>.</p>'}</div>` : ''}
    <div class="panel"><h3>💾 Save</h3><p class="muted small">Your game autosaves on this device. Export a backup code to move it to another phone.</p>
      <div class="chips"><button class="chip" data-act="export">Export save</button><button class="chip" data-act="import">Import save</button><button class="chip" data-act="savenow">Save now</button></div>
      <button class="btn danger" data-act="wipe">Delete save &amp; restart</button></div>`;
}
function viewHelp() {
  return subHead('❓ How to play') + `<div class="panel small help">
    <p>⛏️ <b>Tap</b> a skill's stage to gather or craft. Every skill has a 📖 <b>Guide</b> showing what unlocks at each level and where items come from.</p>
    <p>👷 <b>Hire workers</b>. They keep producing while the app is closed (8h cap, upgradable). Agility and graceful make all of them faster.</p>
    <p>⭐ Buy <b>Upgrades</b>, catch wandering 🧞 random events, complete 📅 <b>challenges</b> and 🏆 <b>achievements</b> for permanent bonuses.</p>
    <p>⚔️ Fight with <b>melee, ranged or magic</b>: your weapon decides. Bows need arrows (Fletching), staves cast spells. Set up food and up to 3 potions to auto-use.</p>
    <p>🧪 <b>Herblore</b>: herb + secondary + vial of water. Grow herbs, buy vials and eyes of newt, and loot the rest.</p>
    <p>🧵 <b>Crafting</b>: tan cowhide, cut gems, make jewellery, dragonhide and mystic robes (silk from the silk stall).</p>
    <p>🦹 <b>Thieving</b> and 🏃 <b>Agility</b>: steal for coins, seeds and clues; run rooftops (tap in the green zone) for marks of grace.</p>
    <p>💀 <b>Slayer</b> tasks, ⚔️ <b>God Wars</b> kill count, ⚱️ <b>Barrows</b> runs and 👑 bosses all feed your 📒 <b>collection log</b>.</p>
    <p>📜 <b>Clue scrolls</b> drop everywhere: solve riddles, kill a monster or gather something, then open the casket.</p>
    <p>📈 The <b>Grand Exchange</b> drifts every 10 minutes: buy low, sell high.</p>
    <p>🌀 <b>Ascend</b> at total level ${ASCEND_MIN_TOTAL} for Ancient Runes. Pets, logs, achievements and museum bonuses are kept.</p>
    <p class="muted">A fan-made idle game inspired by classic MMO skilling. Not affiliated with any game company.</p></div>`;
}
function openLampPicker() {
  openModal(`<h2>🪔 Rub the lamp</h2><p class="muted small">Choose a skill to gain experience in.</p><div class="lamp-grid">${SKILL_ORDER.map(s => `<button class="btn" data-act="lamp" data-id="${s}">${SKILLS[s].icon}<small>${SKILLS[s].name} ${LV[s]}</small></button>`).join('')}</div>`);
}
function openStarShop() {
  openModal(`<h2>🌠 Star shop</h2><p>You have <b class="y">${fmt(have('stardust'))}</b> stardust.</p><div class="list">${STAR_SHOP.map(([id, c]) => `<div class="upg"><div class="upg-icon">${itemIcon(id)}</div><div class="upg-main"><b>${ITEMS[id].name}</b><small>${c} stardust${ITEMS[id].starRing ? ' · +10% Mining speed when worn' : ''}</small></div>
    <button class="btn ${have('stardust') < c ? 'poor' : ''}" data-act="star-buy" data-id="${id}">Buy</button></div>`).join('')}</div>`);
}

/* ---------- Render plumbing ---------- */
Object.assign(VIEWS, { skills: viewSkills, skill: viewSkill, combat: viewCombat, bank: viewBank, shop: viewShop, menu: viewMenu, ge: viewGE,
  challenges: viewChallenges, achievements: viewAchievements, clog: viewClog, clue: viewClue, character: viewCharacter, season: viewSeason, pets: viewPets, stats: viewStats, settings: viewSettings, help: viewHelp });
const baseSig = viewSig;
viewSig = function () {
  const v = UI.view;
  if (v === 'bank') return Object.keys(S.bank).join() + JSON.stringify(S.equip) + UI.bankFilter + JSON.stringify(S.locked) + JSON.stringify(S.cosmetic);
  if (v === 'skill') return baseSig() + (S.star ? S.star.tier + '|' + S.target.mine : '') + have('mark_of_grace') + (UI.skill === 'thieving' ? ROGUE.map(r => S.clog[r[0]] ? 1 : 0).join('') : '');
  if (v === 'combat') return baseSig() + JSON.stringify(S.combat.pots) + S.combat.ammo + Object.keys(S.bank).filter(id => ITEMS[id].potion || ITEMS[id].ammo).join() + S.barrows.killed.join() + M.set;
  if (v === 'skills') return baseSig() + !!S.star + (S.clues.active ? S.clues.active.idx : '-') + [...(S.ch.daily || []), ...(S.ch.weekly || [])].map(c => +c.done + +c.claimed).join('');
  if (v === 'ge') return UI.geTab + (S.ge.t || 0) + Object.keys(S.bank).length + JSON.stringify(S.ge.watch) + JSON.stringify(S.locked);
  if (v === 'menu') return [...(S.ch.daily || []), ...(S.ch.weekly || [])].map(c => +c.done + +c.claimed).join('') + Object.keys(S.ach).length + Object.keys(S.clog).length + !!S.clues.active + Object.keys(S.pets).length;
  if (v === 'challenges') return JSON.stringify(S.ch);
  if (v === 'achievements') return Object.keys(S.ach).length;
  if (v === 'clog') return Object.keys(S.clog).length + UI.clogCat + UI.clogOpen;
  if (v === 'clue') return JSON.stringify(S.clues) + Object.keys(CLUE_TIERS).map(t => have('clue_' + t)).join();
  if (v === 'character') return JSON.stringify(S.equip) + JSON.stringify(S.cosmetic) + JSON.stringify(S.loadouts);
  if (v === 'season') return Object.keys(S.bank).length + have(activeSeason()?.token);
  if (v === 'pets') return Object.keys(S.pets).length;
  if (HUB_VIEWS.includes(v)) return v;
  return baseSig();
};
function postRender() {
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.nav === UI.view || (UI.view === 'skill' && b.dataset.nav === 'skills') || (HUB_VIEWS.includes(UI.view) && b.dataset.nav === 'menu') || (UI.view === 'ge' && b.dataset.nav === 'shop')));
  if ($('#agi-cursor')) {
    const z = $('#agi-zone'), p = $('#agi-perfect');
    z.style.left = (AGI.zone - AGI.w) * 100 + '%'; z.style.width = AGI.w * 200 + '%';
    p.style.left = (AGI.zone - AGI.pw) * 100 + '%'; p.style.width = AGI.pw * 200 + '%';
    requestAnimationFrame(agiAnim);
  }
}
function liveExtra() {
  $$('[data-live2]').forEach(e => {
    const k = e.dataset.live2;
    if (k === 'star' && S.star) e.textContent = '⏳ ' + fmtTime((S.star.until - now()) / 1000) + ' left';
    if (k === 'stardust' && S.star) e.textContent = S.star.dust;
    if (k === 'ge') e.textContent = fmtTime(Math.max(0, GE_STEP - (now() - (S.ge.t || now()))) / 1000);
  });
}
function liveCombatExtra(L) {
  L.live.forEach(e => { if (e.dataset.live === 'boosts') { const t = boostsText(); if (e._t !== t) { e.innerHTML = t; e._t = t; } } });
}

/* ---------- Input ---------- */
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'bankq') { UI.bankQ = t.value; const g = $('#bankgrid'); if (g) { g.innerHTML = bankTiles(); LIVE.count = $$('[data-count]', $('#view')); } }
  if (t.id === 'geq') { UI.geQ = t.value; const g = $('#gelist'); if (g) { g.innerHTML = geList(); LIVE.afford = $$('[data-afford]', $('#view')); } }
  if (t.id === 'volume') { S.settings.volume = +t.value; SFX.play('coin'); }
});
document.addEventListener('click', e => {
  if (e.target.closest('[data-nav]')) return;
  const t = e.target.closest('[data-act]');
  if (!t) return;
  const d = t.dataset, id = d.id;
  let handled = true;
  switch (d.act) {
    case 'guide': openGuide(id, d.f || 'all'); break;
    case 'moninfo': e.stopPropagation(); openMonsterInfo(id); break;
    case 'mon-go': closeModal(); if (S.combat.mon !== id) { if (S.combat.fighting) retreat(); S.combat.mon = id; } go('combat', { area: MONSTER_BY_ID[id].area }); startFight(); break;
    case 'info': if (!e.target.closest('button[data-act="buy"]')) openItemModal(id); break;
    case 'hub': closeModal(); if (id === 'msglog') openMsgLog(); else if (id === 'ge') go('ge'); else go(id); break;
    case 'nav-ge': go('ge'); break;
    case 'openlog': openMsgLog(); break;
    case 'msglog': openMsgLog(id); break;
    case 'chclaim': claimChallenge(d.k, +d.i); break;
    case 'clueans': answerRiddle(+d.i); break;
    case 'clueread': readClue(id); break;
    case 'cluefight': { const s = S.clues.active?.steps[S.clues.active.idx]; if (!s) break; if (S.combat.fighting) retreat(); S.combat.mon = s.mon; go('combat', { area: MONSTER_BY_ID[s.mon].area }); startFight(); break; }
    case 'cluego': { const s = S.clues.active?.steps[S.clues.active.idx]; if (!s) break; const a = ACTIONS[s.act]; S.target[a.st] = a.id; go('skill', { skill: STATIONS[a.st].skill }); UI.station[STATIONS[a.st].skill] = a.st; break; }
    case 'clogcat': UI.clogCat = id; UI.clogOpen = null; break;
    case 'clogpage': UI.clogOpen = UI.clogOpen === id ? null : id; break;
    case 'lo-save': saveLoadout(+d.i); break;
    case 'lo-equip': equipLoadout(+d.i); break;
    case 'look-set': { const it = ITEMS[id]; S.cosmetic[it.slot] = id; closeModal(); toast(`👁️ You now look like you're wearing ${it.name}.`); break; }
    case 'look-clear': S.cosmetic = {}; break;
    case 'ge-tab': UI.geTab = id; UI.geQ = ''; break;
    case 'ge-sell': geSell(id, +d.q); if (UI.modal) closeModal(); break;
    case 'ge-buy': geBuy(id, +d.q); break;
    case 'ge-watch': { const w = S.ge.watch ||= []; const i = w.indexOf(id); if (i >= 0) w.splice(i, 1); else w.push(id); const g = $('#gelist'); if (g) g.innerHTML = geList(); break; }
    case 'lock': if (S.locked[id]) S.locked[id] = 0; else S.locked[id] = 1; openItemModal(id); break;
    case 'drink': drinkPotion(id); if (!have(id)) closeModal(); else openItemModal(id); break;
    case 'potset': { const P = S.combat.pots ||= [null, null, null]; const i = P.indexOf(id); if (i >= 0) P[i] = null; else { const j = P.indexOf(null); if (j < 0) toast('You can set up 3 potions at most. Tap one to remove it.', 'warn'); else P[j] = id; } UI.force = true; break; }
    case 'ammo': S.combat.ammo = id; recalc(); UI.force = true; break;
    case 'barrows-run': { const next = BARROWS.find(b => !S.barrows.killed.includes(b.id)) || BARROWS[0]; if (S.combat.fighting) retreat(); S.combat.mon = 'barrows_' + next.id; startFight(); UI.force = true; break; }
    case 'grace': { const g = GRACEFUL.find(x => x[0] === id); if (have('mark_of_grace') < g[4]) { toast('Not enough marks of grace.', 'warn'); break; } remove('mark_of_grace', g[4]); add(id, 1); toast(`✨ You buy the ${ITEMS[id].name}.`, 'rare'); SFX.play('coin'); break; }
    case 'starmine': if (starActive() && LV.mining >= S.star.tier * 10) { if (S.target.mine !== 'm_star') S.prevMine = S.target.mine; S.target.mine = 'm_star'; S.prog.mine = 0; } break;
    case 'starshop': openStarShop(); break;
    case 'star-buy': { const c = STAR_SHOP.find(x => x[0] === id)[1]; if (have('stardust') < c) { toast('Not enough stardust.', 'warn'); break; } remove('stardust', c); add(id, 1); toast(`🌠 You buy a ${ITEMS[id].name}.`, 'rare'); openStarShop(); break; }
    case 'season-buy': { const se = activeSeason(); const c = se?.shop.find(x => x[0] === id)?.[1]; if (!c || have(se.token) < c) { toast(`Not enough ${ITEMS[se?.token]?.name.toLowerCase() || 'tokens'}s.`, 'warn'); break; } remove(se.token, c); add(id, 1); logItem(id, 1); toast(`${se.icon} You get a ${ITEMS[id].name}!`, 'rare'); SFX.play('rare'); break; }
    case 'lamp': useLamp(id); closeModal(); break;
    case 'set-sound': S.settings.sound = t.checked; if (t.checked) { SFX.unlock(); SFX.play('level'); } break;
    case 'set-autolock': S.settings.autoLock = t.checked; break;
    default: handled = false;
  }
  if (handled) { render(); liveUpdate(); }
});

/* ---------- Boot ---------- */
(function boot3() {
  boot();
  if (S.star) syncStarAction();
  ensureChallenges();
  setTimeout(checkAchievements, 1500);
  setInterval(() => { ensureChallenges(); checkAchievements(); }, 5000);
  renderFeed();
})();
