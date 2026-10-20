'use strict';
/* =========================================================
   CLICKSCAPE v9.25 — every item says what it's used for; smithable dragonfire wards for
   every metal (kiteshield + dragon scale dust), Dragonbane wards with a dragonheart,
   and a proper dragon-shield look
   ========================================================= */

/* ================= DRAGONFIRE WARDS ================= */
item('dragonheart', 'Dragonheart', 2e6, { cat: 'misc', kind: 'orb', tint: '#e8401a', rare: true });
const WARDS = [];
(STATION_ACTIONS.anvil || []).slice().forEach(a => {
  const kid = Object.keys(a.out || {}).find(id => /_kiteshield$/.test(id)); const k = kid && ITEMS[kid]; if (!k || k.cosmetic) return;
  const metal = kid.replace(/_kiteshield$/, ''), wid = metal + '_dfward', bid = metal + '_dbward', mname = k.name.replace(/ kiteshield$/i, '');
  const dust = Math.max(5, Math.round(a.lvl / 4));
  const base = { kind: 'dfs', tint: k.tint, antifire: true, req: k.req, value: Math.round((k.value || 100) * 0.95 + dust * 50) };
  ITEMS[wid] = { ...k, ...base, id: wid, name: `${mname} dragonfire ward`, trim: '#ff7a1a', def: Math.round((k.def || 0) * 1.1 * 10) / 10 };
  ITEMS[bid] = { ...k, ...base, id: bid, name: `${mname} dragonbane ward`, trim: "#ffd040", dragonbane: 1.25, rare: true, value: base.value + 1.5e6, def: Math.round((k.def || 0) * 1.25 * 10) / 10 };
  for (const s of ['atk', 'str', 'ratk', 'rstr', 'matk', 'mdmg', 'prayer']) if (k[s]) { ITEMS[wid][s] = k[s]; ITEMS[bid][s] = Math.round(k[s] * 1.15 * 10) / 10; }
  ITEM_ORDER[wid] = (ITEM_ORDER[kid] || 0) + 0.01; ITEM_ORDER[bid] = (ITEM_ORDER[kid] || 0) + 0.02;
  act3({ id: 'a_dfw_' + metal, st: 'anvil', metal: a.metal, name: `${mname} dragonfire ward`, lvl: a.lvl + 3, xp: a.xp * 2.5, hp: a.hp * 2, inp: { [kid]: 1, dragon_scale_dust: dust }, out: { [wid]: 1 }, icon: wid });
  RECIPES.push({ out: bid, inp: { [wid]: 1, dragonheart: 1 } });
  (SOURCES[wid] ||= []).push(`Smith: ${mname} kiteshield + ${dust} dragon scale dust (Smithing ${a.lvl + 3})`);
  (SOURCES[bid] ||= []).push(`Combine: ${mname} dragonfire ward + Dragonheart`);
  WARDS.push(wid, bid);
});
STATION_ACTIONS.anvil.sort((a, b) => a.lvl - b.lvl);
// dragonhearts: big dragons and dragon bosses
for (const m of MONSTERS) if (m.dragon || /dragon|wyrm|drake|vorkath/.test(m.id)) { const p = m.boss ? 1 / 120 : m.lvl >= 200 ? 1 / 600 : 1 / 2000; m.drops.push(['dragonheart', p, 1, 1]); (SOURCES.dragonheart ||= []).push(`Drop: ${m.name} (1/${Math.round(1 / p)})`); }
ITEMS.dragonfire_shield.kind = 'dfs'; ITEMS.dragonfire_shield.trim = '#ff7a1a';
ITEMS.anti_dragon_shield.kind = 'dfs';
// a dragonbane ward hits dragons 25% harder
weaponVs = (orig => function (m) { const s = ITEMS[S.equip?.shield]; return orig(m) * (s?.dragonbane && m?.dragon ? s.dragonbane : 1); })(weaponVs);
itemDesc = (orig => function (it) { let h = orig(it); if (it.dragonbane) h += `<br>🐉 +${Math.round((it.dragonbane - 1) * 100)}% damage against dragons`; if (it.id === 'dragonheart') h += '<br>Combine with any dragonfire ward to make a Dragonbane ward.'; return h; })(itemDesc);
GE_SET.add('dragonheart');

/* ================= "USED FOR" ================= */
let USES = null;
function buildUses() {
  const U = {}; const put = (id, o) => { if (!ITEMS[id]) return; (U[id] ||= []); if (!U[id].some(x => x.t === o.t)) U[id].push(o); };
  for (const a of Object.values(ACTIONS)) { if (!a.inp || !STATIONS[a.st]) continue; const sk = STATIONS[a.st].skill; for (const id in a.inp) put(id, { t: `${STATIONS[a.st].name}: ${a.name}`, s: `${SKILLS[sk]?.name || ''} ${a.lvl} · needs ${a.inp[id]}`, sk, st: a.st, lvl: a.lvl, out: Object.keys(a.out || {})[0] }); }
  RECIPES.forEach(r => Object.keys(r.inp).forEach(id => put(id, { t: `Combine into ${ITEMS[r.out]?.name}`, s: Object.keys(r.inp).filter(x => x !== id).map(x => ITEMS[x]?.name).join(' + ') ? `with ${Object.keys(r.inp).filter(x => x !== id).map(x => ITEMS[x]?.name).join(' + ')}` : '', out: r.out, comb: true })));
  (CROPS || []).forEach(c => { const sd = c.id + '_seed'; if (ITEMS[sd]) put(sd, { t: `Plant: ${c.name}`, s: `Farming ${c.lvl}`, farm: true, out: c.cropItem || c.id }); });
  (UPGRADES || []).forEach(u => Object.keys(u.items || {}).forEach(id => put(id, { t: `Upgrade: ${u.name}`, s: `needs ${u.items[id]}`, upg: true })));
  if (typeof SHIP !== 'undefined') SHIP.forEach(([, n, , cost]) => Object.keys(cost || {}).forEach(id => put(id, { t: `Ship upgrade: ${n.replace(/^\S+\s/, '')}`, s: 'Sailing', sk: 'sailing' })));
  if (typeof VOY !== 'undefined') Object.entries(VOY).forEach(([k, [, sup]]) => Object.keys(sup || {}).forEach(id => put(id, { t: `Voyage supplies: ${ACTIONS[k]?.name}`, s: `Sailing ${ACTIONS[k]?.lvl}`, sk: 'sailing' })));
  for (const id in U) {
    // many near-identical lines (one per metal) collapse into one
    const W = U[id].filter(u => / dragonfire ward$/.test(u.t));
    if (W.length > 2) { const lv = W.map(u => u.lvl); U[id] = U[id].filter(u => !W.includes(u)); U[id].push({ t: 'Anvil: dragonfire wards (any metal)', s: `Smithing ${Math.min(...lv)}–${Math.max(...lv)} · a kiteshield + dragon scale dust`, sk: 'smithing', st: 'anvil', lvl: Math.min(...lv), out: W[0].out }); }
    U[id].sort((a, b) => (a.lvl || 0) - (b.lvl || 0));
  }
  return U;
}
function usedFor(id) {
  USES ||= buildUses(); const it = ITEMS[id]; const L = [...(USES[id] || [])];
  if (it?.heal) L.unshift({ t: `Food: heals ${fmt(it.heal)} HP`, s: 'Pick it as auto-eat food in Combat' });
  if (it?.potion) L.unshift({ t: 'Drink it for a boost', s: 'Or pick it as an auto-drink potion in Combat' });
  if (it?.antifire) L.unshift({ t: '🔥 Blocks dragonfire when worn', s: 'Equip in the shield slot to fight dragons safely' });
  const T = S.tribute?.items?.find(([x]) => x === id); if (T) L.unshift({ t: `Ascension tribute: ${fmt(T[1])} needed`, s: 'Hand it in at the Ascension altar' });
  for (const f of (typeof FACTIONS !== 'undefined' ? FACTIONS : [])) { const c = S.lifetime.contracts?.[f.id]; const x = c?.items.find(([y, q, d]) => y === id && d < q); if (x) L.unshift({ t: `Contract: ${f.name}`, s: `${fmt(x[1] - x[2])} still wanted`, con: true }); }
  return L;
}
openItemModal = (orig => function (id, fromSlot) {
  orig(id, fromSlot); const box = $('#modal .item-modal'); if (!box) return;
  const L = usedFor(id); const more = L.length > 6;
  const rows = L.slice(0, UI.usesAll ? 99 : 6).map(u => `<div class="use-row" ${u.st ? `data-act="quick-st" data-sk="${u.sk}" data-st="${u.st}"` : u.con ? 'data-act="hub" data-id="contracts"' : u.farm ? 'data-act="skill" data-id="farming"' : u.sk === 'sailing' ? 'data-act="skill" data-id="sailing"' : ''}>${u.out && ITEMS[u.out] ? itemIcon(u.out) : '<span class="emo">➜</span>'}<div><b>${u.t}</b>${u.s ? `<small>${u.s}</small>` : ''}</div>${u.st || u.con || u.farm || u.sk ? '<i>›</i>' : ''}</div>`).join('');
  const html = `<h3>What it's used for</h3>${L.length ? `<div class="uses">${rows}${more && !UI.usesAll ? `<button class="btn small" data-act="uses-all" data-id="${id}">Show all ${L.length}</button>` : ''}</div>` : `<p class="small muted">${ITEMS[id]?.slot ? 'Wear it.' : 'Nothing uses this. It\'s for selling (or collecting).'}</p>`}`;
  const src = box.querySelector('h3'); if (src && /Where to get/.test(src.textContent)) src.insertAdjacentHTML('beforebegin', html); else box.insertAdjacentHTML('beforeend', html);
})(openItemModal);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  if (t.dataset.act === 'uses-all') { e.stopImmediatePropagation(); UI.usesAll = true; closeModal(); openItemModal(t.dataset.id); UI.usesAll = false; }
  if (t.closest('.use-row') && $('#modal') && !$('#modal').hidden) setTimeout(() => closeModal(), 0);
}, true);

/* ================= DRAGON SHIELD LOOK ================= */
SHAPES.dfs = t => `<path d="M16 2.5 L27.5 6.5 C 27.5 17, 23.5 24.5, 16 30.5 C 8.5 24.5, 4.5 17, 4.5 6.5 Z" fill="${t}" ${K}/>
  <path d="M16 5 L25 8.2 C 25 16.5, 21.6 22.6, 16 27.6 C 10.4 22.6, 7 16.5, 7 8.2 Z" fill="${shade(t, -0.35)}"/>
  <path d="M10 11 Q13 8 16 10 Q19 8 22 11 L20.5 13 Q23 15 21 19 Q18.5 17.5 16 21 Q13.5 17.5 11 19 Q9 15 11.5 13 Z" fill="#e8501a" stroke="#000" stroke-width=".9" stroke-linejoin="round"/>
  <path d="M13.5 13.2 L14.6 14 M18.5 13.2 L17.4 14" stroke="#ffe08a" stroke-width="1.3" stroke-linecap="round"/>
  <path d="M11 8.5 L9.5 5.8 M21 8.5 L22.5 5.8" stroke="#3a1a0a" stroke-width="1.4" stroke-linecap="round"/>`;
for (const id of [...WARDS, 'dragonfire_shield', 'anti_dragon_shield']) delete _iconCache[id];

function boot49() { boot48(); USES = null; UI.force = true; render(); }
boot49();
