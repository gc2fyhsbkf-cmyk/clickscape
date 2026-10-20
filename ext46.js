'use strict';
/* =========================================================
   CLICKSCAPE v9.22 — Personal records + a shareable run card image,
   one-tap "Equip best" on the Character screen
   ========================================================= */

/* ================= RECORDS ================= */
const REC = () => (S.lifetime.records ||= {});
function recSet(key, val, extra, lower) {
  const R = REC(), cur = R[key];
  if (cur && (lower ? val >= cur.v : val <= cur.v)) return false;
  R[key] = { v: val, t: now(), ...(extra || {}) }; return true;
}
// fastest ascension / richest run, from the run history
ascend = (orig => function () {
  const old = S, n = (S.lifetime.runs || []).length; const r = orig.apply(this, arguments);
  if (S !== old) { const run = (S.lifetime.runs || [])[(S.lifetime.runs || []).length - 1]; if (run && (S.lifetime.runs.length > n || n >= 60)) {
    if (recSet('fastAC', run.dur, { n: run.n }, true) && !OFF && run.dur > 60) setTimeout(() => toast(`🏅 New record: fastest ascension, ${fmtTime(run.dur)}!`, 'pet', 6000), 2500);
    recSet('richRun', run.coins); recSet('xpRun', run.xp);
  } }
  return r;
})(ascend);
transcend2 = (orig => function (auto) {
  const t0 = tcount(), start = S.lifetime.tdStart || S.stats?.started || now(); const r = orig(auto);
  if (tcount() > t0) { const d = (now() - start) / 1000; recSet('fastTD', d, { n: tcount() }, true); S.lifetime.tdStart = now(); }
  return r;
})(transcend2);
rareGet = (orig => function (id, q, why) {
  const r = orig(id, q, why); const it = ITEMS[id];
  if (it && !OFF) { const v = (it.value || 0) * q; if (v > (REC().bestDrop?.v || 0)) recSet('bestDrop', v, { id, q, from: typeof FAN_MON !== 'undefined' && FAN_MON ? FAN_MON.name : '' }); }
  return r;
})(rareGet);
playerAttack = (orig => function () { const d = orig.apply(this, arguments); if (typeof d === 'number' && d > (REC().bigHit?.v || 0)) recSet('bigHit', d, { mon: curMon()?.name }); return d; })(playerAttack);
let recT = 0;
tickCore = (orig => function (dt) {
  orig(dt); recT += dt; if (recT < 15) return; recT = 0;
  const tl = totalLevel(); if (tl > (REC().maxTotal?.v || 0)) recSet('maxTotal', tl);
  const cb = combatLevel(); if (cb > (REC().maxCombat?.v || 0)) recSet('maxCombat', cb);
  if (S.coins > (REC().maxCoins?.v || 0)) recSet('maxCoins', S.coins);
})(tickCore);
function topBoss() { let best = null; for (const m of MONSTERS) if (m.boss && !m.raid) { const k = lifeKills(m.id); if (k && (!best || k > best[1])) best = [m, k]; } return best; }
function recordRows() {
  const R = REC(), L = S.lifetime, tb = topBoss();
  const evo = Object.values(L.evo || {}).filter(e => e >= 2).length, spec = Object.values(L.spec || {}).flat().length;
  return [
    ['⏱️', 'Fastest ascension', R.fastAC ? `${fmtTime(R.fastAC.v)} <small>(AC ${R.fastAC.n})</small>` : '—'],
    ['✴️', 'Fastest Transcendence', R.fastTD ? fmtTime(R.fastTD.v) : '—'],
    ['💎', 'Best drop', R.bestDrop ? `${itemIcon(R.bestDrop.id)} ${R.bestDrop.q > 1 ? fmt(R.bestDrop.q) + ' × ' : ''}${ITEMS[R.bestDrop.id]?.name || ''} <small>🪙${fmt(R.bestDrop.v)}${R.bestDrop.from ? ` · ${R.bestDrop.from}` : ''}</small>` : '—'],
    ['💥', 'Biggest hit', R.bigHit ? `${fmt(R.bigHit.v)}${R.bigHit.mon ? ` <small>on ${R.bigHit.mon}</small>` : ''}` : '—'],
    ['🪙', 'Richest run', R.richRun ? `🪙${fmt(R.richRun.v)}` : '—'],
    ['📈', 'Highest total level', fmt(R.maxTotal?.v || totalLevel())],
    ['⚔️', 'Highest combat level', fmt(R.maxCombat?.v || combatLevel())],
    ['💀', 'Monsters killed', fmt(L.kills || 0)],
    ['👑', 'Most-killed boss', tb ? `${tb[0].icon} ${tb[0].name} <small>${fmt(tb[1])} KC</small>` : '—'],
    ['🌀', 'Ascensions · TD · Apotheosis', `${fmt(lifeAsc())} · ${fmt(tcount())} · ${fmt(apoCount())}`],
    ['📜', 'Contracts done', fmt(L.conDone || 0)],
    ['📖', 'Codex sets · trophies', `${codexSets()} · +${fmtD((M.trophy || 0) * 100)}% dmg`],
    ['⭐', 'Specialists · Elder pets', `${spec} · ${evo}`],
    ['👗', 'Wardrobe pieces', `${wardOwned().length}/${WARD_IDS.length}`],
    ['📅', 'Best login streak', fmt(L.streak?.best || 0)],
  ];
}
function viewRecords() {
  return subHead('🏅 Records') + `<div class="panel small">Your personal bests, kept forever. Share a run card to show off your character and best moments.</div>
    <button class="btn big" data-act="runcard">📸 Make my run card</button>
    <div class="panel"><div class="rec-list">${recordRows().map(([i, n, v]) => `<div class="rec"><span>${i}</span><b>${n}</b><em>${v}</em></div>`).join('')}</div></div>`;
}
VIEWS.records = () => rebrand(viewRecords());
HUB_VIEWS.push('records');
viewMenu = (orig => function () {
  return orig().replace('<button class="hub-tile" data-act="hub" data-id="collections">', `<button class="hub-tile" data-act="hub" data-id="records"><span class="ht-icon">🏅</span><b>Records</b><small>Personal bests & run card</small></button><button class="hub-tile" data-act="hub" data-id="collections">`);
})(viewMenu);
VIEWS.menu = (orig => function () { return rebrand(orig()); })(viewMenu);

/* ---------- run card image ---------- */
const svgImg = svg => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')); });
const plain = h => String(h).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
async function makeRunCard() {
  const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2a2216'); bg.addColorStop(1, '#120e09'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#c8a040'; g.lineWidth = 10; g.strokeRect(24, 24, W - 48, H - 48); g.strokeStyle = '#5a4a2a'; g.lineWidth = 3; g.strokeRect(44, 44, W - 88, H - 88);
  g.textAlign = 'center'; g.fillStyle = '#ffd76a'; g.font = '900 78px Georgia, serif'; g.shadowColor = '#000'; g.shadowOffsetY = 4; g.fillText('CLICKSCAPE', W / 2, 140); g.shadowOffsetY = 0;
  g.fillStyle = '#b0a083'; g.font = '32px system-ui, sans-serif'; g.fillText(`Total level ${fmt(totalLevel())} · Combat ${combatLevel()} · AC ${lifeAsc()} · TD ${tcount()}${apoCount() ? ' · Apotheosis ' + apoCount() : ''}`, W / 2, 196);
  // stage + character
  const sg = g.createRadialGradient(300, 560, 40, 300, 560, 380); sg.addColorStop(0, 'rgba(255,200,110,.35)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.fillRect(70, 240, 470, 720);
  try { const im = await svgImg(dollSVG()); g.drawImage(im, 70, 250, 460, 600); } catch (e) {}
  // records column
  const rows = recordRows().filter(([, , v]) => v !== '—' && /[1-9]/.test(plain(v).replace(/\/\d+$/, ''))).slice(0, 10);
  g.textAlign = 'left'; let y = 290;
  for (const [i, n, v] of rows) { g.fillStyle = '#b0a083'; g.font = '26px system-ui, sans-serif'; g.fillText(`${i} ${n}`, 560, y); g.fillStyle = '#ffe9a8'; g.font = '700 32px system-ui, sans-serif'; const t = plain(v); g.fillText(t.length > 26 ? t.slice(0, 25) + '…' : t, 560, y + 38); y += 72; }
  // best drop banner
  const bd = REC().bestDrop;
  if (bd && ITEMS[bd.id]) {
    g.fillStyle = 'rgba(150,60,230,.25)'; g.fillRect(90, 1010, W - 180, 170); g.strokeStyle = '#b060ff'; g.lineWidth = 3; g.strokeRect(90, 1010, W - 180, 170);
    try { const ic = await svgImg(itemIcon(bd.id).replace(/class="ico"/, 'width="120" height="120"')); g.drawImage(ic, 120, 1035, 120, 120); } catch (e) {}
    g.fillStyle = '#e3b8ff'; g.font = '700 30px system-ui, sans-serif'; g.fillText('✨ BEST DROP', 270, 1068); g.fillStyle = '#fff'; g.font = '800 44px system-ui, sans-serif'; g.fillText(ITEMS[bd.id].name, 270, 1122);
    g.fillStyle = '#c8b8a0'; g.font = '28px system-ui, sans-serif'; g.fillText(`worth 🪙${fmt(bd.v)}${bd.from ? ' · from ' + bd.from : ''}`, 270, 1160);
  }
  g.textAlign = 'center'; g.fillStyle = '#7a6a50'; g.font = '26px system-ui, sans-serif'; g.fillText(new Date().toLocaleDateString(), W / 2, H - 80);
  return cv;
}
async function shareRunCard() {
  toast('📸 Drawing your run card…', '', 1500);
  const cv = await makeRunCard();
  const url = cv.toDataURL('image/png');
  openModal(`<div class="item-modal runcard"><h2>📸 Your run card</h2><img src="${url}" alt="Run card"><p class="small muted">Long-press the image to save it, or use Share.</p>
    <div class="row-btns"><button class="btn big" data-act="runcard-share">Share</button><a class="btn" href="${url}" download="clickscape-run.png">Download</a></div></div>`);
  UI.runCardCanvas = cv;
}
async function doShare() {
  const cv = UI.runCardCanvas; if (!cv) return;
  cv.toBlob(async b => {
    const f = new File([b], 'clickscape-run.png', { type: 'image/png' });
    try { if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f], title: 'My Clickscape run' }); else toast('Sharing isn\'t supported here: long-press the image or tap Download.', 'warn', 4000); } catch (e) {}
  });
}

/* ================= EQUIP BEST ================= */
const BEST_SLOTS = ['weapon', 'head', 'body', 'legs', 'shield', 'hands', 'feet'];
function bestScore(it, cls) {
  if (!it) return -1;
  const d = (it.def || 0) * 0.5;
  return cls === 'ranged' ? (it.ratk || 0) + (it.rstr || 0) * 2 + d : cls === 'magic' ? (it.matk || 0) + (it.mdmg || 0) * 3 + d : (it.atk || 0) + (it.str || 0) * 1.2 + d;
}
function equipBest() {
  const cls = wclass(); let n = 0; const T = toast; toast = () => {};
  try {
    for (const s of BEST_SLOTS) {
      const cur = S.equip[s] ? ITEMS[S.equip[s]] : null;
      const cands = Object.keys(S.bank).filter(id => { const it = ITEMS[id]; return it?.slot === s && have(id) && !it.cosmetic && reqOk(it.req) && (s !== 'weapon' || (it.wclass || 'melee') === cls) && !(s === 'shield' && ITEMS[S.equip.weapon]?.twoHanded); });
      const best = cands.sort((a, b) => bestScore(ITEMS[b], cls) - bestScore(ITEMS[a], cls))[0];
      if (best && bestScore(ITEMS[best], cls) > bestScore(cur, cls) + 0.01) { equip(best); n++; }
    }
  } finally { toast = T; }
  recalc(); toast(n ? `⚡ Equipped ${n} better item${n > 1 ? 's' : ''} for ${cls}.` : `⚡ You're already wearing your best ${cls} gear.`, n ? 'rare' : '', 3500);
  UI.force = true; render();
}
viewCharacter = (orig => function () {
  return orig().replace('<div class="char-stats">', `<button class="btn big equip-best" data-act="equip-best">⚡ Equip best ${wclass()} gear</button><div class="char-stats">`);
})(viewCharacter);
VIEWS.character = (orig => function () { return rebrand(orig()); })(viewCharacter);


/* ================= BANK: sort & "new" ================= */
const RECENT = {};
add = (orig => function (id, n = 1) { if (n > 0) RECENT[id] = now(); return orig.apply(this, arguments); })(add);
const SORTS = [['', 'Default'], ['value', 'Value'], ['qty', 'Amount'], ['name', 'A–Z']];
bankTiles = (orig => function () {
  const h = orig(); if (!UI.bankSort && !UI.bankNew) return h;
  const parts = h.split(/(?=<button class="tile)/).filter(x => x.startsWith('<button class="tile'));
  const idOf = x => (x.match(/data-id="([^"]+)"/) || [])[1];
  let L = parts.map(x => [idOf(x), x.replace(/<div class="bank-h">[\s\S]*$/, '')]).filter(([id]) => id && ITEMS[id]);
  L = L.filter((x, i) => L.findIndex(y => y[0] === x[0]) === i);
  if (UI.bankNew) L = L.filter(([id]) => now() - (RECENT[id] || 0) < 15 * 60e3);
  const key = { value: id => -sellPrice(id) * have(id), qty: id => -have(id), name: id => ITEMS[id].name }[UI.bankSort];
  if (key) L.sort((a, b) => { const x = key(a[0]), y = key(b[0]); return typeof x === 'string' ? x.localeCompare(y) : x - y; });
  else if (UI.bankNew) L.sort((a, b) => (RECENT[b[0]] || 0) - (RECENT[a[0]] || 0));
  return L.map(x => x[1]).join('') || '<p class="muted small" style="grid-column:1/-1">Nothing new in the last 15 minutes.</p>';
})(bankTiles);
viewBank = (orig => function () {
  const s = SORTS.find(x => x[0] === (UI.bankSort || '')) || SORTS[0];
  return orig().replace('<div class="chips">', `<div class="chips"><button class="chip ${UI.bankNew ? 'on' : ''}" data-act="bank-new">🆕 New</button><button class="chip ${UI.bankSort ? 'on' : ''}" data-act="bank-sort">↕ ${s[1]}</button>`);
})(viewBank);
VIEWS.bank = (orig => function () { return rebrand(orig()); })(viewBank);
viewSig = (orig => function () { return UI.view === 'bank' ? orig() + (UI.bankSort || '') + (UI.bankNew ? 'N' : '') : orig(); })(viewSig);

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
  if (a === 'bank-new') { e.stopImmediatePropagation(); UI.bankNew = !UI.bankNew; UI.force = true; render(); }
  if (a === 'bank-sort') { e.stopImmediatePropagation(); const i = SORTS.findIndex(x => x[0] === (UI.bankSort || '')); UI.bankSort = SORTS[(i + 1) % SORTS.length][0]; UI.force = true; render(); }
  if (a === 'runcard') { e.stopImmediatePropagation(); shareRunCard(); }
  if (a === 'runcard-share') { e.stopImmediatePropagation(); doShare(); }
  if (a === 'equip-best') { e.stopImmediatePropagation(); equipBest(); }
}, true);
function boot46() { boot45(); UI.force = true; render(); }

