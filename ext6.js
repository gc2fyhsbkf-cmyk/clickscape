'use strict';
/* =========================================================
   CLICKSCAPE v4.4 — combat screen redesign
   ========================================================= */

/* ---------- Fight maths (estimates) ---------- */
function styleSim(style, fn) { const C = S.combat, old = C.style; C.style = style; try { return fn(); } finally { C.style = old; } }
function fightCalc(m = curMon(), style = S.combat.style) {
  return styleSim(style, () => {
    const C = S.combat, max = maxHit(false, m), hc = hitChance(m), spd = attackInterval();
    let dps = hc * (max + 1) / 2 / spd;
    if (m.corp && !ITEMS[S.equip.weapon]?.spear) dps /= 2;
    const ttk = m.hp / Math.max(0.01, dps);
    const ehc = enemyHitChance(m), emh = enemyMaxHit(m), red = reduction();
    const inc = ehc * (emh + 1) / 2 * (1 - red) / m.spd;
    const regen = (M.regen || 1) / 8;
    let food = 0; for (const id of FOODS) food += have(id) * ITEMS[id].heal;
    const net = inc - regen;
    const hp = C.fighting ? C.hp : maxHp();
    const survive = net <= 0 ? Infinity : (Math.max(0, hp - maxHp() * 0.5) + food + maxHp() * 0.5) / net;
    const kph = 3600 / (ttk + 1.2);
    const xph = Math.min(dps, m.hp / (ttk + 1.2)) * 3600 * 4;
    return { max, hc, dps, ttk, ehc, emh, inc, net, food, survive, kph, xph, spd };
  });
}
function riskOf(f) {
  if (f.survive === Infinity) return ['safe', '🟢 Safe', 'You out-heal everything it does.'];
  const killsLeft = f.survive / (f.ttk + 1.2);
  if (f.survive > 1800) return ['safe', '🟢 Safe', `Food lasts ${fmtTime(f.survive)}.`];
  if (f.survive > 300) return ['ok', '🟡 Steady', `Food lasts ~${fmtTime(f.survive)} (~${fmt(Math.floor(killsLeft))} kills).`];
  if (f.survive > 60) return ['risky', '🟠 Risky', `Food runs out in ~${fmtTime(f.survive)}.`];
  return ['deadly', '🔴 Deadly', f.food ? `You will die in ~${fmtTime(Math.max(1, f.survive))}.` : 'No food and it out-damages your regen.'];
}
function fightTip(f, m) {
  const cls = wclass(), C = S.combat, r = riskOf(f)[0];
  const defStyle = { melee: 'defence', ranged: 'r_long', magic: 'm_def' }[cls];
  const tips = [];
  if (canFight(m)) tips.push('🔒 ' + canFight(m));
  if (m.dragon && dragonfireMult() > 1) tips.push(`🔥 Dragonfire ×${dragonfireMult()}: equip an anti-dragon shield or drink antifire.`);
  if ((r === 'risky' || r === 'deadly') && C.style !== defStyle) {
    const d = fightCalc(m, defStyle);
    if (d.ehc < f.ehc - 0.04 || d.survive > f.survive * 1.3) tips.push(`🛡️ Defensive style: they hit ${Math.round(f.ehc * 100)}% → ${Math.round(d.ehc * 100)}% of the time${d.survive === Infinity ? ' (fully safe)' : `, food lasts ${fmtTime(d.survive)}`}.`);
  }
  if ((r === 'risky' || r === 'deadly') && !FOODS.some(id => have(id))) tips.push('🍖 You have no food: cook fish or buy some.');
  if (r === 'deadly' && combatLevel() < m.lvl - 15) tips.push(`⚠️ ${m.name} is ${m.lvl - combatLevel()} levels above you: train up, bring better armour or switch target.`);
  if ((r === 'risky' || r === 'deadly') && LV.prayer < 43) tips.push('🙏 Protect from Melee unlocks at Prayer 43 (−25% damage).');
  if (m.weak && m.weak !== cls) tips.push(`🎯 Weak to ${m.weak}: its defence drops 40% against that style.`);
  if (r === 'safe' && C.style === defStyle && cls === 'melee') tips.push('💪 You are safe here: Aggressive or Accurate will kill faster.');
  if (f.hc < 0.35) tips.push(`🎯 Only ${Math.round(f.hc * 100)}% accuracy: Accurate style, Attack potions or better weapon bonuses help.`);
  return tips.slice(0, 2);
}
function fightStripHTML() {
  const m = curMon(), f = fightCalc(m), [rc, rl, rd] = riskOf(f), tips = fightTip(f, m);
  return `<div class="fs-grid">
      <div><small>Your hit</small><b>${f.max}</b><i>${Math.round(f.hc * 100)}% acc</i></div>
      <div><small>Your DPS</small><b>${fmtD(f.dps)}</b><i>kill ~${fmtTime(Math.max(1, f.ttk))}</i></div>
      <div><small>Their hit</small><b class="cb-red">${f.emh}</b><i>${Math.round(f.ehc * 100)}% acc</i></div>
      <div><small>Taken/s</small><b>${fmtD(f.inc)}</b><i>regen ${fmtD((M.regen || 1) / 8)}</i></div>
    </div>
    <div class="fs-risk ${rc}"><b>${rl}</b> <span>${rd}</span> <span class="muted">· ~${fmt(f.kph)} kills/h · ~${fmt(f.xph)} XP/h</span></div>
    ${tips.map(t => `<div class="fs-tip">${t}</div>`).join('')}`;
}

/* ---------- Stats tab ---------- */
function statsTabHTML() {
  const m = curMon(), cls = wclass(), pb = prayerBoost(), G = M.gear;
  const trains = (STYLE_XP[S.combat.style] || []).map(([s]) => SKILLS[s].name).join(' + ') || 'Attack';
  const rows = ['attack', 'strength', 'defence', 'ranged', 'magic', 'hitpoints', 'prayer', 'slayer'].map(sk => {
    const L = LV[sk], b = BOOST_KEY[sk] ? boosted(sk) : L, cap = MAX_LVL[sk];
    const lo = XP_TABLE[L] || 0, hi = XP_TABLE[Math.min(cap, L + 1)] || lo, pct = L >= cap ? 100 : Math.max(0, Math.min(100, (S.xp[sk] - lo) / Math.max(1, hi - lo) * 100));
    return `<div class="cs-row"><span class="cs-ic">${SKILLS[sk].icon}</span><span class="cs-name">${SKILLS[sk].name}</span>
      <b class="cs-lvl">${b > L ? `<span class="cb-green">${b}</span><small>/${L}</small>` : L}</b>
      <span class="cs-bar"><i style="width:${pct}%"></i><em>${L >= cap ? 'MAX' : fmt(Math.max(0, hi - S.xp[sk])) + ' xp'}</em></span></div>`;
  }).join('');
  const bonus = cls === 'ranged' ? [['🎯 Ranged acc', G.ratk], ['🏹 Ranged str', G.rstr + (ITEMS[S.combat.ammo]?.rstr || 0)]]
    : cls === 'magic' ? [['🔮 Magic acc', G.matk], ['✨ Magic dmg', G.mdmg + '%']] : [['⚔️ Attack', G.atk], ['💪 Strength', G.str]];
  return `<div class="panel"><h3>📊 Your combat stats <small class="muted">· combat level ${combatLevel()}</small></h3>
      <p class="small">Style <b>${(STYLES[cls].find(s => s[0] === S.combat.style) || STYLES[cls][0])[1]}</b> trains <b class="y">${trains}</b> (+ Hitpoints).</p>
      <div class="cs-list">${rows}</div></div>
    <div class="panel"><h3>🛡️ Bonuses</h3><div class="stats">
      ${bonus.map(([n, v]) => `<div>${n}</div><b>+${v}</b>`).join('')}<div>🛡️ Defence</div><b>+${G.def}</b>
      <div>🙏 Prayer</div><b>${pb.n}</b><div>Damage reduction</div><b>${Math.round(reduction() * 100)}%</b>
      <div>Attack speed</div><b>${fmtD(attackInterval())}s</b><div>Max HP</div><b>${maxHp()}</b>
      ${M.set ? `<div>Set effect</div><b>${cap1(M.set)}</b>` : ''}</div>
      <div class="f-stats boosts" data-live="boosts"></div></div>
    <div class="panel"><h3>${m.icon} ${m.name} <small class="muted">· level ${m.lvl}</small></h3><div class="stats">
      <div>Hitpoints</div><b>${m.hp}</b><div>Attack / Defence</div><b>${m.atk} / ${m.def}</b>
      <div>Max hit</div><b>${enemyMaxHit(m)}</b><div>Attacks every</div><b>${m.spd}s</b>
      <div>Weak to</div><b>${m.weak ? cap1(m.weak) : '—'}</b><div>Kills</div><b>${fmt(S.kills[m.id] || 0)}</b></div>
      <h3>All styles vs this monster</h3><div class="style-cmp">${STYLES[cls].map(([s, n, i]) => { const f = fightCalc(m, s), r = riskOf(f); return `<button class="sc ${S.combat.style === s ? 'on' : ''}" data-act="style" data-id="${s}"><b>${i} ${n}</b><small>DPS ${f.dps.toFixed(2)} · hit on you ${Math.round(f.ehc * 100)}%</small><small class="fs-risk ${r[0]}">${r[1]}</small></button>`; }).join('')}</div></div>`;
}

/* ---------- Layout: arena + strip + tabs ---------- */
viewCombat = (orig => function () {
  const html = orig();
  const iTabs = html.indexOf('<div class="tabs scroll">'), iSetup = html.indexOf('<div class="panel"><h3>Combat style</h3>'), iLoot = html.indexOf('<div class="panel"><h3>Loot</h3>');
  if (iTabs < 0 || iSetup < 0 || iLoot < 0) return html;
  const arena = html.slice(0, iTabs), monsters = html.slice(iTabs, iSetup), setup = html.slice(iSetup, iLoot), rest = html.slice(iLoot);
  const tab = UI.ctab || 'setup', m = curMon(), area = UI.area || m.area, areaName = (AREAS.find(a => a[0] === area) || ['', 'Monsters'])[1];
  const body = tab === 'monsters' ? monsters : tab === 'stats' ? statsTabHTML() : setup;
  return arena + `<div class="panel fight-strip" id="fstrip">${fightStripHTML()}</div>
    <div class="ctabs"><button class="ctab ${tab === 'setup' ? 'on' : ''}" data-act="ctab" data-id="setup">🎒 Setup</button><button class="ctab ${tab === 'monsters' ? 'on' : ''}" data-act="ctab" data-id="monsters">👹 Monsters <small>${areaName.replace(/^\S+\s/, '')}</small></button><button class="ctab ${tab === 'stats' ? 'on' : ''}" data-act="ctab" data-id="stats">📊 Stats</button></div>
    ${body}${rest}`;
})(viewCombat);
VIEWS.combat = viewCombat;
viewSig = (orig => function () {
  if (UI.view === 'combat') return orig() + (UI.ctab || 'setup') + (UI.ctab === 'stats' ? ['attack', 'strength', 'defence', 'ranged', 'magic', 'hitpoints', 'prayer', 'slayer'].map(s => LV[s]).join() + Math.floor(Date.now() / 5000) : '');
  return orig();
})(viewSig);

// keep the strip live (food counts, potion boosts, HP)
setInterval(() => {
  const el = $('#fstrip'); if (!el || UI.view !== 'combat' || document.hidden) return;
  const h = fightStripHTML(); if (el._h !== h) { el._h = h; el.innerHTML = h; }
}, 1000);

document.addEventListener('click', e => {
  if (e.target.closest('[data-nav]')) return;
  const t = e.target.closest('[data-act]'); if (!t) return;
  const d = t.dataset;
  if (d.act === 'ctab') { UI.ctab = d.id; UI.force = true; render(); liveUpdate(); e.stopImmediatePropagation(); }
  else if (d.act === 'area' && UI.view === 'combat') UI.ctab = 'monsters';
}, true);
