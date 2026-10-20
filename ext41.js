'use strict';
/* =========================================================
   CLICKSCAPE v9.17 — Contracts: five factions post big orders sized to your production.
   Deliver for coins and reputation; reputation tiers give permanent perks and, at Exalted,
   the faction's own wardrobe piece. Reputation is kept forever.
   ========================================================= */

const FACTIONS = [
  { id: 'smith',  icon: '⚒️', name: "Smiths' Guild",       sts: ['mine', 'furnace', 'anvil'], skills: ['mining', 'smithing'], skin: ['fc_smith_apron', "Guildmaster's apron", 'body', 'robe', '#8a5a2a'] },
  { id: 'wood',   icon: '🌲', name: "Woodsmen's Lodge",    sts: ['forest', 'fletch', 'sawmill', 'workbench'], skills: ['woodcutting', 'fletching', 'construction', 'firemaking'], skin: ['fc_lodge_hood', 'Lodge ranger hood', 'head', 'hat', '#2a6a2a'] },
  { id: 'coop',   icon: '🍲', name: 'Harvest Co-op',       sts: ['fish', 'range', 'herb'], farm: true, skills: ['fishing', 'cooking', 'herblore', 'farming'], skin: ['fc_coop_hat', 'Harvest sun hat', 'head', 'hat', '#d8b84a'] },
  { id: 'art',    icon: '🧵', name: "Artisans' Circle",    sts: null, skills: null, skin: ['fc_artisan_cape', 'Artisan\'s mantle', 'cape', 'cape', '#8a3ab8'] },
  { id: 'league', icon: '🗡️', name: "Adventurers' League", combat: true, skills: ['attack', 'strength', 'defence', 'ranged', 'magic', 'hitpoints', 'prayer', 'slayer'], skin: ['fc_league_helm', 'League champion helm', 'head', 'full_helm', '#b83a2a'] },
];
// the Artisans take every production station the others don't
(() => {
  const taken = new Set(FACTIONS.flatMap(f => f.sts || [])), skip = new Set(['dig', 'restore', 'course', 'altar', 'harbour', 'fire']);
  const A = FACTIONS.find(f => f.id === 'art');
  A.sts = STATION_ORDER.filter(st => !taken.has(st) && !skip.has(st) && STATION_ACTIONS[st]?.length);
  A.skills = [...new Set(A.sts.map(st => STATIONS[st].skill))];
})();
FACTIONS.forEach(f => { const [id, n, slot, kind, tint] = f.skin; cosmetic(id, n, slot, kind, tint, [0, 0, 0], { value: 6e7, trim: '#ffd84a', untradeable: true }); ITEM_ORDER[id] = 1e6 + Object.keys(ITEM_ORDER).length; if (!WARD_IDS.includes(id)) WARD_IDS.push(id); });
const FAC_BY_ID = Object.fromEntries(FACTIONS.map(f => [f.id, f]));
const REP_TIERS = [[0, 'Neutral'], [50, 'Friendly'], [150, 'Honoured'], [400, 'Revered'], [1000, 'Exalted']];
const repOf = id => S.lifetime.rep?.[id] || 0;
const tierOf = id => { const r = repOf(id); let t = 0; REP_TIERS.forEach(([n], i) => { if (r >= n) t = i; }); return t; };
const perkTxt = (f, t) => t ? `${f.combat ? `+${4 * t}% damage` : `+${5 * t}% speed`} and +${4 * t}% XP in ${f.combat ? 'combat' : f.skills.map(s => SKILLS[s]?.name).filter(Boolean).slice(0, 3).join(', ')}${t >= 2 ? ` · contract pay ×${fmtD(1 + 0.25 * t)}` : ''}${t >= 4 ? ' · 👑 faction wardrobe piece' : ''}` : 'No perks yet: reach Friendly (50 rep)';
// rounding to friendly numbers
const nice = x => { if (x < 10) return Math.max(1, Math.round(x)); const p = Math.pow(10, Math.floor(Math.log10(x)) - 1); return Math.round(x / p) * p; };

/* ---------- rolling a contract ---------- */
function facPool(f) {
  const P = [];
  if (f.combat) {
    const cb = combatLevel();
    for (const m of MONSTERS) {
      if (m.boss || m.raid || m.barrows || m.season || m.lvl > cb + 15 || canFight(m)) continue;
      for (const [id, ch, a, b] of m.drops || []) {
        if (id.startsWith('pet:') || id === 'coins' || !ITEMS[id] || ITEMS[id].clue || ITEMS[id].untradeable || ch < 1 / 25 || itemSource(id)) continue; // monster loot only, nothing a station makes
        const kills = 40 + Math.random() * 40; P.push({ id, q: nice(Math.max(3, kills * Math.min(1, ch) * (a + b) / 2)), w: m.lvl + 5, src: m.name });
      }
    }
  } else {
    for (const st of f.sts) {
      const sk = STATIONS[st]?.skill; if (!sk) continue;
      const acts = (STATION_ACTIONS[st] || []).filter(a => LV[sk] >= a.lvl && a.out && Object.keys(a.out).length === 1).sort((a, b) => b.lvl - a.lvl).slice(0, 5);
      for (const a of acts) {
        const [id, oq] = Object.entries(a.out)[0]; if (!ITEMS[id] || ITEMS[id].untradeable || ITEMS[id].cat === 'tool') continue;
        const ipm = Math.max(2, (M.rate?.[st] || 0) / Math.max(1, a.hp) * 60 * (typeof oq === 'number' ? oq : 1));
        P.push({ id, q: nice(Math.max(10, ipm * (25 + Math.random() * 20))), w: a.lvl + 5, src: STATIONS[st].name });
      }
    }
    if (f.farm) for (const c of CROPS) if (!c.livestock && LV.farming >= c.lvl) P.push({ id: c.cropItem || c.id, q: nice((15 + c.lvl) * (1 + 0.2 * fhN()) + (S.farmlands || []).length * 40), w: c.lvl + 5, src: 'Farming' });
  }
  return P.filter((x, i, A) => A.findIndex(y => y.id === x.id) === i);
}
function rollContract(f) {
  const P = facPool(f); if (!P.length) return null;
  const n = Math.min(P.length, tierOf(f.id) >= 2 ? 3 : 2), pick = [];
  const pool = [...P];
  while (pick.length < n && pool.length) { const tot = pool.reduce((a, x) => a + x.w, 0); let r = Math.random() * tot, k = 0; while ((r -= pool[k].w) > 0 && k < pool.length - 1) k++; pick.push(pool.splice(k, 1)[0]); }
  return { f: f.id, items: pick.map(x => [x.id, x.q, 0]), t0: now(), src: pick.map(x => x.src) };
}
function contracts() {
  const C = S.lifetime.contracts ||= {};
  for (const f of FACTIONS) if (!C[f.id]) { const c = rollContract(f); if (c) C[f.id] = c; }
  return C;
}
const conPay = c => { const base = c.items.reduce((a, [id, q]) => a + Math.max(5, ITEMS[id]?.value || 0) * q, 0); return Math.round(base * 3 * (1 + 0.25 * tierOf(c.f))); };
// bought goods don't count: contracts are for things you make or loot yourself
const boughtOf = id => Math.min(have(id), S.bought?.[id] || 0);
const ownOf = id => S.locked[id] ? 0 : Math.max(0, have(id) - boughtOf(id));
// (purchases are already tracked in S.bought for tributes; remove() keeps it ≤ what you hold)
const conReady = c => c.items.every(([id, q, d]) => d + ownOf(id) >= q);
const REROLL_FREE = 20 * 60e3;

function deliver(fid) {
  const C = contracts(), c = C[fid]; if (!c) return;
  let gave = 0;
  { for (const it of c.items) { const [id, q, d] = it; const g = Math.min(ownOf(id), q - d); if (g > 0) { remove(id, g); it[2] += g; gave += g; } } }
  if (!gave) return toast(c.items.some(([id]) => boughtOf(id)) ? '📜 Bought items don\'t count: contracts want things you made or looted yourself.' : '📜 You have nothing this contract needs yet.', 'warn', 4000);
  if (c.items.every(([, q, d]) => d >= q)) {
    const f = FAC_BY_ID[fid], t0 = tierOf(fid), pay = conPay(c), rush = now() - c.t0 < 2 * 3600e3, rep = 10 + (rush ? 5 : 0);
    gainCoins(pay); add('mystery_box', 1); if (Math.random() < 0.1 + 0.05 * t0) add(t0 >= 3 ? 'clue_elite' : 'clue_hard', 1);
    const R = S.lifetime.rep ||= {}; R[fid] = (R[fid] || 0) + rep; S.lifetime.conDone = (S.lifetime.conDone || 0) + 1;
    const t1 = tierOf(fid);
    toast(`📜 ${f.icon} ${f.name} contract complete! +🪙${fmt(pay)}, a mystery box and +${rep} reputation${rush ? ' (rush bonus)' : ''}.`, 'rare', 6000);
    if (t1 > t0) {
      if (t1 >= 4 && !(S.costume?.[f.skin[0]] > 0) && !have(f.skin[0])) add(f.skin[0], 1);
      setTimeout(() => (typeof fanLegend === 'function' ? fanLegend({ kind: `${f.icon} REPUTATION UP ${f.icon}`, icon: '<span class="emo">📜</span>', name: `${REP_TIERS[t1][1]} with the ${f.name}`, sub: perkTxt(f, t1) + (t1 >= 4 ? `. ${ITEMS[f.skin[0]].name} added to your bank!` : '') }) : toast(`📜 ${REP_TIERS[t1][1]} with the ${f.name}!`, 'pet', 6000)), 400);
    }
    C[fid] = rollContract(f); recalc();
  } else toast(`📜 Delivered ${fmt(gave)} item${gave === 1 ? '' : 's'} to the ${FAC_BY_ID[fid].name}.`);
  UI.force = true; render();
}

/* ---------- perks ---------- */
recalc4 = (orig => function () {
  orig(); if (!S?.lifetime?.rep) return;
  for (const f of FACTIONS) { const t = tierOf(f.id); if (!t) continue; if (f.combat) M.dmg *= 1 + 0.04 * t; else for (const st of f.sts) if (M.rate[st] !== undefined) M.rate[st] *= 1 + 0.05 * t; }
})(recalc4);
const FAC_SKILL = {}; FACTIONS.forEach(f => f.skills.forEach(s => { FAC_SKILL[s] ||= f.id; }));
gainXP = (orig => function (skill, amt) { const f = FAC_SKILL[skill]; if (f && S?.lifetime?.rep?.[f]) { const t = tierOf(f); if (t) amt *= 1 + 0.04 * t; } return orig(skill, amt); })(gainXP);

/* ---------- page ---------- */
function viewContracts() {
  const C = contracts();
  const cards = FACTIONS.map(f => {
    const c = C[f.id], t = tierOf(f.id), r = repOf(f.id), next = REP_TIERS[t + 1], prev = REP_TIERS[t][0];
    const pct = next ? Math.min(100, 100 * (r - prev) / (next[0] - prev)) : 100;
    const rows = c ? c.items.map(([id, q, d], k) => { const h = ownOf(id), left = q - d, ok = d >= q; return `<div class="con-item ${ok ? 'ok' : h >= left ? 'can' : ''}" data-act="info" data-id="${id}">${itemIcon(id)}<div><b>${fmt(q)} × ${ITEMS[id].name}</b><small>${ok ? '✔ delivered' : `${fmt(d)}/${fmt(q)} delivered · you have ${fmt(ownOf(id))}${boughtOf(id) ? ` (+${fmt(boughtOf(id))} bought, don't count)` : ''}${S.locked[id] ? ' 🔒 locked' : ''}`}${c.src?.[k] ? ` · from ${c.src[k]}` : ''}</small><div class="bar"><i style="width:${Math.min(100, 100 * d / q)}%"></i></div></div></div>`; }).join('') : '<p class="small muted">Nothing you can make for them yet. Level their skills to get orders.</p>';
    const free = c && now() - c.t0 >= REROLL_FREE, ready = c && conReady(c), any = c && c.items.some(([id, q, d]) => d < q && ownOf(id) > 0);
    return `<div class="panel con-card"><div class="con-head"><span class="con-icon">${f.icon}</span><div><b>${f.name}</b><small>${REP_TIERS[t][1]} · ${fmt(r)} rep${next ? ` / ${next[0]} for ${next[1]}` : ' · max'}</small><div class="bar rep"><i style="width:${pct}%"></i></div></div></div>
      <small class="con-perk">${t ? '✨ ' : ''}${perkTxt(f, t)}</small>
      ${rows}
      ${c ? `<div class="con-foot"><small>Pays 🪙${fmt(conPay(c))} + mystery box + ${now() - c.t0 < 2 * 3600e3 ? `15 rep <span class="y">(rush bonus for ${fmtTime((2 * 3600e3 - (now() - c.t0)) / 1000)})</span>` : '10 rep'}</small>
        <div class="row-btns"><button class="btn ${ready ? '' : any ? '' : 'poor'} ${ready ? 'glow' : ''}" data-act="con-deliver" data-id="${f.id}">${ready ? '✅ Complete' : 'Deliver what I have'}</button><button class="btn small" data-act="con-reroll" data-id="${f.id}">↻ ${free ? 'New order' : fmtTime((REROLL_FREE - (now() - c.t0)) / 1000)}</button></div></div>` : ''}</div>`;
  }).join('');
  return subHead('📜 Contracts') + `<div class="panel small">Factions post big orders sized to what you can make. Deliver bit by bit or all at once. Every contract pays coins, a mystery box and <b>reputation</b>, which is kept forever: each tier gives permanent speed and XP in that faction's skills, and Exalted gives their own 👑 wardrobe piece. Done: <b>${fmt(S.lifetime.conDone || 0)}</b>.</div>${cards}`;
}
VIEWS.contracts = () => rebrand(viewContracts());
HUB_VIEWS.push('contracts');
viewMenu = (orig => function () {
  const C = contracts(), ready = Object.values(C).filter(c => c && conReady(c)).length;
  return orig().replace('<button class="hub-tile" data-act="hub" data-id="worldboss">', `<button class="hub-tile" data-act="hub" data-id="contracts"><span class="ht-icon">📜</span><b>Contracts</b><small>${ready ? `<span class="y">${ready} ready to complete</span>` : '5 factions, big orders'}</small></button><button class="hub-tile" data-act="hub" data-id="worldboss">`);
})(viewMenu);
VIEWS.menu = (orig => function () { return rebrand(orig()); })(viewMenu);
// a nudge on the Skills page when an order can be completed
viewSkills = (orig => function () {
  const h = orig(); if (!S.lifetime.contracts) return h;
  const ready = FACTIONS.filter(f => S.lifetime.contracts[f.id] && conReady(S.lifetime.contracts[f.id]));
  return ready.length ? `<div class="panel row-between con-nudge"><div>📜 <b>${ready.length} contract${ready.length > 1 ? 's' : ''} ready</b><br><small class="muted">${ready.map(f => f.icon + ' ' + f.name).join(' · ')}</small></div><button class="btn" data-act="hub" data-id="contracts">Hand in</button></div>` + h : h;
})(viewSkills);
VIEWS.skills = (orig => function () { return rebrand(orig()); })(viewSkills);
viewSig = (orig => function () {
  if (UI.view === 'contracts') return 'con' + JSON.stringify(S.lifetime.contracts) + Object.values(S.lifetime.contracts || {}).flatMap(c => c ? c.items.map(([id]) => have(id)) : []).join() + Math.floor(now() / 30000);
  if (UI.view === 'skills') return orig() + '|cn' + Object.values(S.lifetime.contracts || {}).filter(c => c && conReady(c)).length;
  return orig();
})(viewSig);

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act, id = t.dataset.id;
  if (a === 'con-deliver') { e.stopImmediatePropagation(); deliver(id); }
  if (a === 'con-reroll') {
    e.stopImmediatePropagation(); const C = contracts(), c = C[id]; if (!c) return;
    if (now() - c.t0 < REROLL_FREE) return toast(`↻ A new order is available in ${fmtTime((REROLL_FREE - (now() - c.t0)) / 1000)}. Items already delivered stay with the faction.`, 'warn', 4000);
    C[id] = rollContract(FAC_BY_ID[id]); toast('📜 New order posted.'); UI.force = true; render();
  }
}, true);
// a fresh run can't fill a late-game order: untouched contracts are re-posted after an ascension
ascend = (orig => function () { const old = S; const r = orig.apply(this, arguments); if (S !== old) { const C = S.lifetime.contracts || {}; for (const f of FACTIONS) if (C[f.id] && C[f.id].items.every(([, , d]) => !d)) delete C[f.id]; } return r; })(ascend);
function boot41() { boot40(); contracts(); UI.force = true; render(); }
