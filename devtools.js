'use strict';
/* =========================================================
   CLICKSCAPE DEV TOOLS — bench-testing panel. ONLY included with `python3 tools/build.py <ver> --dev`.
   Release / App Store builds are made without --dev, so none of this code ships to players.
   Open it from More → 🛠 Dev tools (or the 🛠 button at the bottom left).
   ========================================================= */
(function () {
  const DEV = { log: [] };
  const note = msg => { DEV.log.unshift(`${new Date().toLocaleTimeString()} ${msg}`); DEV.log.length = Math.min(DEV.log.length, 12); toast('🛠 ' + msg, 'rare', 2500); };
  const after = () => { applyCaps(); refreshLevels(); recalc(); if (typeof applyBossScale === 'function') { for (const m of MONSTERS) m.tierV = -1; applyBossScale(); } UI.force = true; render(); };
  const ACTIONS_DEV = {
    coins: v => { S.coins += +v || 1e6; note(`+🪙${fmt(+v || 1e6)}`); },
    level: v => { const L = +v || 99; for (const s of SKILL_ORDER) S.xp[s] = Math.max(S.xp[s] || 0, XP_TABLE[Math.min(L, MAX_LVL[s] || L)] || 0); note(`all skills → level ${L} (capped)`); },
    skill: v => { const [s, l] = String(v).split(/[ :=]+/); if (!SKILLS[s]) return note(`no skill "${s}"`); S.xp[s] = XP_TABLE[Math.min(+l || 99, MAX_LVL[s])] || 0; note(`${s} → ${l}`); },
    item: v => { const [id, q] = String(v).split(/[ x×:]+/); if (!ITEMS[id]) { const hit = Object.keys(ITEMS).filter(k => k.includes(id)).slice(0, 8); return note(`no item "${id}"${hit.length ? ' · try: ' + hit.join(', ') : ''}`); } add(id, +q || 1); note(`+${+q || 1} ${ITEMS[id].name}`); },
    asc: v => { S.asc.count = +v || 0; S.lifetime.ascs = Math.max(S.lifetime.ascs || 0, S.asc.count); note(`ascensions this TD = ${S.asc.count}`); },
    td: v => { S.trans ||= { count: 0, shards: 0, perks: {} }; S.trans.count = +v || 0; note(`transcendences = ${S.trans.count}`); },
    shards: v => { S.trans ||= { count: 0, shards: 0, perks: {} }; S.trans.shards += +v || 10; note(`+${+v || 10} shards`); },
    essence: v => { S.asc.essence = (S.asc.essence || 0) + (+v || 100); note(`+${+v || 100} essence`); },
    sigils: v => { S.asc.points = (S.asc.points || 0) + (+v || 1000); note(`+${+v || 1000} sigils`); },
    hours: v => { const h = Math.min(48, +v || 1), was = OFF; OFF = true; try { for (let i = 0; i < h * 3600; i++) tickCore(1); } finally { OFF = was; } note(`simulated ${h}h`); },
    clues: () => { for (const t of ['easy', 'medium', 'hard', 'elite', 'master']) if (ITEMS['clue_' + t]) add('clue_' + t, 5); note('+5 maps of each tier'); },
    boon: () => { if (typeof rollBoons === 'function') { rollBoons(); note('new boon offer'); } },
    edict: () => { if (typeof rollEdicts === 'function') { rollEdicts(); note('new edict offer'); } },
    heal: () => { S.combat.hp = maxHp(); note('healed'); },
    god: () => { DEV.god = !DEV.god; note(`god mode ${DEV.god ? 'ON' : 'off'}`); },
    tribute: () => { if (!S.tribute && typeof rollTribute === 'function') rollTribute(); for (const [id, q] of S.tribute?.items || []) add(id, q); S.coins += (typeof tributeCoins === 'function' ? tributeCoins() * 10 : 1e7); S.stats.xpRun = Math.max(S.stats.xpRun || 0, 1e8); note('tribute & run XP filled: ascend when ready'); },
  };
  monsterAttack = (orig => function () { if (DEV.god) return 0; return orig.apply(this, arguments); })(monsterAttack);
  const row = (k, label, ph) => `<div class="dev-row"><b>${label}</b>${ph != null ? `<input id="dev-${k}" placeholder="${ph}">` : ''}<button class="btn small" data-act="dev" data-id="${k}">Go</button></div>`;
  VIEWS.dev = () => `<div class="panel"><h2>🛠 Dev tools</h2><p class="small muted">Bench testing only. This panel exists only in --dev builds and never ships in release.</p>
    ${row('coins', 'Add coins', '1000000')}${row('level', 'All skills to level', '99')}${row('skill', 'One skill', 'mining 120')}${row('item', 'Give item', 'rune_platebody 5')}
    ${row('asc', 'Set ascensions (this TD)', '5')}${row('td', 'Set transcendences', '1')}${row('shards', 'Add shards', '10')}${row('essence', 'Add essence', '100')}${row('sigils', 'Add sigils', '1000')}
    ${row('hours', 'Simulate hours (max 48)', '1')}${row('clues', '+5 maps of each tier')}${row('tribute', 'Fill tribute & run XP')}${row('boon', 'Roll a boon offer')}${row('edict', 'Roll an edict offer')}${row('heal', 'Heal')}${row('god', `God mode (${DEV.god ? 'ON' : 'off'})`)}
    <div class="dev-log">${DEV.log.map(l => `<div>${esc(l)}</div>`).join('') || '<small class="muted">No actions yet.</small>'}</div></div>`;
  if (typeof HUB_VIEWS !== 'undefined') HUB_VIEWS.push('dev');
  viewSig = (orig => function () { return UI.view === 'dev' ? 'dev|' + DEV.log.length + DEV.god : orig(); })(viewSig);
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act="dev"]'); if (!t) return; e.stopImmediatePropagation();
    const k = t.dataset.id, inp = document.getElementById('dev-' + k);
    try { ACTIONS_DEV[k]?.(inp?.value || inp?.placeholder); } catch (er) { note('error: ' + er.message); }
    after();
  }, true);
  const btn = document.createElement('button'); btn.className = 'dev-fab'; btn.textContent = '🛠'; btn.onclick = () => go('dev'); document.body.appendChild(btn);
  const css = document.createElement('style');
  css.textContent = `.dev-row{display:grid;grid-template-columns:1fr 110px auto;gap:6px;align-items:center;margin:4px 0}.dev-row input{width:100%;padding:5px;border-radius:6px;border:1px solid #6a5a3a;background:#1a140e;color:inherit}
  .dev-log{margin-top:8px;font-size:.75rem;opacity:.85;max-height:160px;overflow:auto}.dev-fab{position:fixed;left:6px;bottom:84px;z-index:60;width:36px;height:36px;border-radius:50%;border:1px solid #e8c060;background:#2a1e12;font-size:18px;opacity:.75}`;
  document.head.appendChild(css);
  window.DEV = DEV;
})();
