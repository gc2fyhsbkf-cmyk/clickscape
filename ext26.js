'use strict';
/* =========================================================
   CLICKSCAPE v9.3 — farmlands, chosen omens, essence perks that scale,
   stricter early game (no relic / omen on a new account, hard worker cap)
   ========================================================= */

/* ================= EARLY GAME: nothing handed out on a brand-new account ================= */
const freshAccount = () => !lifeAsc() && !tcount() && !apoCount();
relicNeed = (orig => function (i) { return freshAccount() ? 1e9 : orig(i); })(relicNeed);
relicPanel = (orig => function () { return freshAccount() ? '<div class="panel small muted">🔮 Relics unlock after your first ascension.</div>' : orig(); })(relicPanel);
// workers past the cap don't work (catches any older save or other route that went over)
recalc4 = (orig => function () {
  orig(); if (!S?.asc) return; const cap = workerCap();
  for (const st of STATION_ORDER) { const n = S.workers[st] || 0; if (n > cap && M.rate[st]) M.rate[st] *= cap / n; }
})(recalc4);

/* ================= OMENS: chosen after ascending, scaling with depth ================= */
const omenPow = () => 1 + 0.05 * Math.min(40, S.asc?.count || 0) + 0.5 * tcount() + apoCount();
function scaledOmen(base, p) {
  const id = base.id + '@' + p.toFixed(2); let o = OMENS.find(x => x.id === id); if (o) return o;
  const sc = v => typeof v === 'number' ? Math.pow(v, p) : v;
  o = { ...base, id, base: base.id, pow: p, st: base.st ? Object.fromEntries(Object.entries(base.st).map(([k, v]) => [k, sc(v)])) : undefined };
  for (const k of ['grow', 'luck', 'xp', 'sell', 'dmg', 'cxp', 'crew', 'mdmg', 'coins', 'hurt']) if (base[k]) o[k] = sc(base[k]);
  o.desc = p > 1.01 ? `${base.desc} (intensity ×${p.toFixed(2)})` : base.desc;
  OMENS.push(o); return o;
}
const BASE_OMENS = OMENS.filter(o => !o.base);
rollOmen = function () { S.omen = null; S.omenOffer = freshAccount() ? null : [...BASE_OMENS].sort(() => rnd() - 0.5).slice(0, 3).map(o => o.id); };
const omenBonus = () => { const o = omen(); return o ? 0.25 * (o.pow || 1) : 0; };
sigilGain = (orig => function () { return Math.floor(orig() * (1 + omenBonus())); })(sigilGain);
function omenOfferPanel() {
  if (!S.omenOffer?.length) return '';
  const p = omenPow();
  return `<div class="panel glow omen-offer"><h3>🔮 Choose an omen for this run <small class="muted">· optional</small></h3><p class="small">Omens bend the world for one run. Run with one for <b>+${Math.round(25 * p)}% sigils</b>. They grow stronger the deeper you go.</p>
    <div class="list">${S.omenOffer.map(id => { const o = scaledOmen(OMENS.find(x => x.id === id), p); return `<div class="upg"><div class="upg-icon">${o.icon}</div><div class="upg-main"><b>${o.name}</b><small>${o.desc}</small></div><button class="btn" data-act="omen-pick" data-id="${o.id}">Choose</button></div>`; }).join('')}</div>
    <button class="btn" data-act="omen-pick" data-id="">No omen this run</button></div>`;
}
viewSkills = (orig => function () { const h = orig(); return S.omenOffer?.length ? omenOfferPanel() + h : h; })(viewSkills);
viewAscension = (orig => function () { return orig().replace('<div class="ctabs asc-tabs">', omenOfferPanel() + '<div class="ctabs asc-tabs">'); })(viewAscension);
VIEWS.skills = (orig => function () { return rebrand(orig()); })(viewSkills);
VIEWS.ascension = (orig => function () { return rebrand(orig()); })(viewAscension);

/* ================= ESSENCE PERKS THAT SCALE UPWARDS ================= */
// every levelled perk gets steadily pricier, and two endless perks soak up late-game essence
for (const p of ASC_PERKS) if (p.max > 1 && !p.endless) { const c0 = p.cost; p.cost = l => Math.round(c0(l) * Math.pow(2, l)); }
[{ id: 'might', icon: '💪', name: 'Ascendant might', max: 9999, endless: true, cost: l => Math.round(100 * Math.pow(1.45, l)), desc: l => `All production +${10 * l}%` },
 { id: 'insightx', icon: '🧠', name: 'Ascendant insight', max: 9999, endless: true, cost: l => Math.round(120 * Math.pow(1.45, l)), desc: l => `All XP +${10 * l}%` },
].forEach(p => { if (!ASC_PERKS.some(x => x.id === p.id)) ASC_PERKS.push(p); });
recalc4 = (orig => function () {
  orig(); if (!S?.asc) return;
  const m = 1 + 0.1 * perk('might'), x = 1 + 0.1 * perk('insightx');
  for (const st of STATION_ORDER) { M.rate[st] *= m; M.tap[st] *= m; } M.xp *= x;
})(recalc4);

/* ================= FARMLANDS: big herb farms run by farmhands ================= */
const FL_MAX = 6;
const flCost = n => Math.round(100000 * Math.pow(10, n));
const flHandCost = (f, i, k = 1) => Math.ceil(5000 * (1 + i) * Math.pow(1.35, f.hands) * (Math.pow(1.35, k) - 1) / 0.35);
const flCrops = () => CROPS.filter(c => !c.livestock && LV.farming >= c.lvl);
const flYield = c => (c.y[0] + c.y[1]) / 2 * M.yield * farmMult() * (1 + 0.2 * fhN());
let flAcc = {};
// harvest cycles per second for a field (v9.54: slower, and extra hands help less and less)
function flCps(f, c) { return 1.5 * Math.pow(f.hands, 0.75) / Math.max(10, c.time * M.grow); }
function farmlandTick(dt) {
  (S.farmlands || []).forEach((f, i) => {
    const c = CROP_BY_ID[f.crop]; if (!c || !f.hands) return;
    const cycles = (flAcc[i] || 0) + flCps(f, c) * dt;
    let n = Math.floor(cycles); flAcc[i] = cycles - n; if (!n) return;
    const seed = c.id + '_seed';
    if (have(seed) < n) { const sp = SHOP.seeds.find(s => s.id === seed); const need = n - have(seed); if (sp && S.coins >= sp.price * need * 2) { S.coins -= sp.price * need; add(seed, need); } }
    n = Math.min(n, have(seed)); if (!n) { f.idle = true; return; } f.idle = false;
    remove(seed, n);
    const y = Math.max(1, Math.round(n * flYield(c)));
    add(c.cropItem || c.id, y); logItem(c.cropItem || c.id, y);
    gainXP('farming', (c.pxp + c.hxp * y / n) * n * 0.5);
    f.made = (f.made || 0) + y;
  });
}
tickCore = (orig => function (dt) { orig(dt); farmlandTick(dt); })(tickCore);
function farmlandPanel() {
  const F = S.farmlands || [], crops = flCrops(), cap = workerCap();
  const rows = F.map((f, i) => {
    const c = CROP_BY_ID[f.crop], rate = c && f.hands ? flYield(c) * 60 * flCps(f, c) : 0;
    return `<div class="upg"><div class="upg-icon">${c ? itemIcon(c.cropItem || c.id) : '🟫'}</div><div class="upg-main"><b>Farmland ${i + 1}: ${c ? c.name : 'nothing planted'}</b>
      <small>🧑‍🌾 ${f.hands}/${cap} hands · ${c && f.hands ? `≈${fmtD(rate)}/min` : 'needs a crop and hands'}${f.idle ? ' · <span class="cb-red">out of seeds</span>' : ''}</small>
      <div class="shop-btns"><button class="btn small" data-act="fl-crop" data-i="${i}" data-d="-1">◀</button><button class="btn small" data-act="fl-crop" data-i="${i}" data-d="1">▶ crop</button>
      <button class="btn small ${S.coins < flHandCost(f, i) || f.hands >= cap ? 'poor' : ''}" data-act="fl-hand" data-i="${i}" data-k="1">+1 hand 🪙${fmt(flHandCost(f, i))}</button><button class="btn small ${f.hands + 10 > cap ? 'poor' : ''}" data-act="fl-hand" data-i="${i}" data-k="10">+10</button></div></div></div>`;
  }).join('');
  const buy = F.length < FL_MAX ? `<button class="btn ${S.coins < flCost(F.length) ? 'poor' : ''}" data-act="fl-buy">Buy farmland ${F.length + 1} · 🪙${fmt(flCost(F.length))}</button>` : '';
  return `<div class="panel"><h3>🌾 Farmlands <small class="muted">· whole fields worked by hired hands, kept through ascension</small></h3>
    <p class="small muted">Pick any crop you can grow (herbs too), hire hands, and the field produces non-stop, buying seeds from the shop as it goes. More hands = faster harvests.</p>
    <div class="list">${rows || '<p class="muted small">No farmland yet.</p>'}</div>${buy}</div>`;
}
viewFarming = (orig => function () { const h = orig(); return h.replace('<div class="plots', farmlandPanel() + '<div class="plots'); })(viewFarming);
// farmlands survive ascension (like the house)
ascend = (orig => function () { const old = S, fl = old.farmlands, fh = old.farmhands; orig(); if (S !== old) { S.farmlands = fl; S.farmhands = Math.floor((fh || 0) / 2); rollOmen(); recalc(); } })(ascend);

/* ---------- clicks & boot ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act; if (!['omen-pick', 'fl-buy', 'fl-crop', 'fl-hand'].includes(a)) return;
  e.stopImmediatePropagation();
  const F = S.farmlands ||= [];
  if (a === 'omen-pick') { S.omen = t.dataset.id || null; S.omenOffer = null; recalc(); toast(S.omen ? `${omen().icon} ${omen().name} hangs over this run.` : 'No omen this run.'); }
  else if (a === 'fl-buy') { const c = flCost(F.length); if (F.length >= FL_MAX) return; if (S.coins < c) toast("You don't have enough coins.", 'warn'); else { S.coins -= c; F.push({ crop: null, hands: 0 }); toast('🌾 New farmland bought.', 'rare'); } }
  else if (a === 'fl-crop') { const f = F[+t.dataset.i], cs = flCrops(); if (!cs.length) return; let j = cs.findIndex(c => c.id === f.crop); j = (j + (+t.dataset.d) + cs.length) % cs.length; f.crop = cs[j].id; }
  else if (a === 'fl-hand') { const i = +t.dataset.i, f = F[i], k = Math.min(+t.dataset.k, workerCap() - f.hands), c = flHandCost(f, i, k); if (k <= 0) toast(`Farmland ${i + 1} is full (${workerCap()} hands).`, 'warn'); else if (S.coins < c) toast("You don't have enough coins.", 'warn'); else { S.coins -= c; f.hands += k; } }
  UI.force = true; render(); liveUpdate();
}, true);
viewSig = (orig => function () { return (UI.view === 'skill' && UI.skill === 'farming') || UI.view === 'skills' ? orig() + JSON.stringify(S.farmlands || []) + JSON.stringify(S.omenOffer || '') + S.omen : orig(); })(viewSig);
function boot26() {
  boot25();
  if (freshAccount() && S.omen && !S.lifetime.omenFix) { S.omen = null; S.omenOffer = null; }
  S.lifetime.omenFix = 1;
  recalc(); UI.force = true; render();
}
