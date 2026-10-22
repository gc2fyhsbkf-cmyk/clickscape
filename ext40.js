'use strict';
/* =========================================================
   CLICKSCAPE v9.16 — drop fanfare in tiers, farming & sailing pages tidied
   ========================================================= */

/* ================= DROP FANFARE ================= */
// legendary: boss uniques, raid purples, pets, 1-in-1000+ drops, jackpot items → full-screen moment
// rare: a normal monster's best drops → a glowing banner that slides in and out
let FAN_MON = null;
killMonster = (orig => function (m) { const p = FAN_MON; FAN_MON = m; try { return orig.apply(this, arguments); } finally { FAN_MON = p; } })(killMonster);
function dropTier(id, why) {
  const it = ITEMS[id]; if (!it) return null;
  const m = FAN_MON;
  if (!m) return why === 'drop' || (it.value || 0) >= 1e7 ? ((it.value || 0) >= 1e8 ? 'legend' : 'rare') : null;
  const d = (m.drops || []).filter(x => x[0] === id), ch = d.length ? Math.min(...d.map(x => x[1])) : null;
  if (ch === null) return m.raid || m.boss ? 'legend' : 'rare';           // raid purples & chest uniques
  if ((m.boss && ch <= 1 / 50) || ch <= 1 / 1000 || (it.value || 0) >= 1e8) return 'legend';
  return 'rare';
}
const fanRate = id => { const m = FAN_MON, d = (m?.drops || []).filter(x => x[0] === id); if (!d.length) return ''; const ch = Math.min(...d.map(x => x[1])); return `1/${fmt(Math.max(1, Math.round(1 / (ch * M.luck))))}`; };
const FANQ = [];
function fanLegend(o) {
  FANQ.push(o); if (FANQ.length === 1) showLegend();
}
function showLegend() {
  const o = FANQ[0]; if (!o) return;
  let el = document.getElementById('fanfare'); if (!el) { el = document.createElement('div'); el.id = 'fanfare'; document.body.appendChild(el); }
  el.innerHTML = `<div class="fan-rays"></div><div class="fan-card"><div class="fan-kind">${o.kind}</div><div class="fan-icon">${o.icon}</div>
    <div class="fan-name">${o.name}</div><div class="fan-sub">${o.sub || ''}</div><div class="fan-tap">Tap to continue</div></div>`;
  el.className = 'show ' + (o.cls || '');
  el.onclick = () => { if (Date.now() - el._t < 700) return; el.className = ''; el.innerHTML = ''; FANQ.shift(); if (FANQ.length) setTimeout(showLegend, 250); };
  el._t = Date.now(); try { buzz([80, 60, 160]); SFX.play('pet'); } catch (e) {}
}
function fanBanner(icon, title, sub) {
  let el = document.getElementById('fanbanner'); if (!el) { el = document.createElement('div'); el.id = 'fanbanner'; document.body.appendChild(el); }
  el.innerHTML = `<div class="fb-icon">${icon}</div><div><b>${title}</b><small>${sub}</small></div>`;
  el.className = ''; void el.offsetWidth; el.className = 'show';
  clearTimeout(el._h); el._h = setTimeout(() => { el.className = ''; }, 4200);
  try { buzz(40); SFX.play('rare'); } catch (e) {}
}
rareGet = (orig => function (id, q, why) {
  const tier = OFF || S.settings?.fanfare === 'off' ? null : dropTier(id, why);
  if (!tier) return orig(id, q, why);
  // do the normal bookkeeping without the plain toast
  const T = toast; toast = () => {}; try { orig(id, q, why); } finally { toast = T; }
  const it = ITEMS[id], from = FAN_MON ? `from ${FAN_MON.name}` : why === 'drop' ? 'from a treasure chest' : '', rate = fanRate(id);
  const sub = [from, rate && `(${rate})`].filter(Boolean).join(' ');
  if (tier === 'legend' && S.settings?.fanfare !== 'small') fanLegend({ kind: FAN_MON?.raid ? '💜 RAID PURPLE 💜' : '✨ LEGENDARY DROP ✨', icon: itemIcon(id), name: `${q > 1 ? fmt(q) + ' × ' : ''}${it.name}`, sub, cls: FAN_MON?.raid ? 'purple' : '' });
  else fanBanner(itemIcon(id), `Rare drop: ${q > 1 ? fmt(q) + ' × ' : ''}${it.name}`, sub);
})(rareGet);
givePet = (orig => function (pid) {
  if (S.pets?.[pid] || OFF || S.settings?.fanfare === 'off') return orig(pid);
  const T = toast; toast = () => {}; try { orig(pid); } finally { toast = T; }
  const p = PETS[pid]; if (!p) return;
  if (S.settings?.fanfare === 'small') fanBanner(`<span class="emo">${p.icon}</span>`, `New pet: ${p.name}!`, p.desc);
  else fanLegend({ kind: '🐾 NEW PET 🐾', icon: `<span class="emo">${p.icon}</span>`, name: p.name, sub: `You have a funny feeling you're being followed… ${p.desc}`, cls: 'pet' });
})(givePet);
// setting
viewSettings = (orig => function () {
  const f = S.settings?.fanfare || 'big';
  return orig().replace('<div class="panel"><h3>💾 Save</h3>', `<div class="panel"><b>✨ Rare drop fanfare</b><br><small class="muted">Big = full-screen moment for boss uniques, raid purples and pets; banners for other rare drops.</small>
    <div class="chips">${[['big', 'Big'], ['small', 'Banners only'], ['off', 'Off']].map(([k, n]) => `<button class="chip ${f === k ? 'on' : ''}" data-act="fan-set" data-id="${k}">${n}</button>`).join('')}</div></div><div class="panel"><h3>💾 Save</h3>`);
})(viewSettings);
VIEWS.settings = (orig => function () { return rebrand(orig()); })(viewSettings);
viewSig = (orig => function () { return UI.view === 'settings' ? orig() + (S.settings?.fanfare || '') : orig(); })(viewSig);


/* ================= FARMING PAGE: hands-on first, automation clearly visible ================= */
// record what the automation actually does, so the page can show it working
let FH_ON = false;
farmhandTick = (orig => function () { FH_ON = true; try { return orig(); } finally { FH_ON = false; } })(farmhandTick);
harvest = (orig => function (i) {
  const p = S.plots[i], c = p && p.c, y = orig(i);
  if (FH_ON && y && c) { const L = S.fhLog ||= { n: 0 }; L.n += y; L.t = now(); L.c = c; L.y = (L.t0 && now() - L.t0 < 3000) ? (L.y || 0) + y : y; L.t0 = now(); }
  return y;
})(harvest);
farmlandTick = (orig => function (dt) {
  const F = S.farmlands || [], m0 = F.map(f => f.made || 0); orig(dt);
  F.forEach((f, i) => { const d = (f.made || 0) - m0[i]; if (d > 0) f.last = { t: now(), y: d }; });
})(farmlandTick);
const ago = t => { const s = Math.max(0, (now() - t) / 1000); return s < 5 ? 'just now' : s < 90 ? `${Math.round(s)}s ago` : `${fmtTime(s)} ago`; };
function farmAutoStrip() {
  const n = fhN(), F = (S.farmlands || []).filter(f => CROP_BY_ID[f.crop] && f.hands), L = S.fhLog;
  const fhLine = n ? `🧑‍🌾 <b>${n} farmhand${n > 1 ? 's' : ''}</b> harvest & replant your patches${L?.t ? ` · last: <b>${fmt(L.y || 0)} ${CROP_BY_ID[L.c]?.name || ''}</b> ${ago(L.t)}` : ' · waiting for a crop to be ready'}` : '🧑‍🌾 No farmhands yet: patches only grow when you plant them';
  const rate = F.reduce((a, f) => { const c = CROP_BY_ID[f.crop]; return a + flYield(c) * 60 * flCps(f, c); }, 0);
  const idle = F.filter(f => f.idle).length;
  const flLine = F.length ? `🌾 <b>${F.length} farmland${F.length > 1 ? 's' : ''}</b> producing ≈ <b>${fmtD(rate)}/min</b>${idle ? ` · <span class="cb-red">${idle} out of seeds</span>` : ''}` : '🌾 No working farmland yet: buy one below for non-stop crops';
  return `<div class="panel small farm-auto"><b>🤖 Running on its own</b><div class="${n ? 'on' : ''}">${fhLine}</div><div class="${F.length ? 'on' : ''}">${flLine}</div></div>`;
}
farmlandPanel = (orig => function () {
  let h = orig();
  (S.farmlands || []).forEach((f, i) => {
    const c = CROP_BY_ID[f.crop], on = c && f.hands && !f.idle;
    const bar = `<div class="fl-status ${on ? 'on' : f.idle ? 'bad' : ''}">${on ? `<span class="fl-work">🧑‍🌾</span><div class="bar"><i data-flprog="${i}" style="width:${Math.round(100 * (flAcc[i] || 0))}%"></i></div><small>${f.last ? `+${fmt(f.last.y)} ${ago(f.last.t)}` : 'growing…'} · ${fmt(f.made || 0)} total</small>` : f.idle ? '<small>⚠️ Out of seeds and not enough coins to buy more</small>' : '<small>Idle: pick a crop and hire hands</small>'}</div>`;
    h = h.replace(`<div class="shop-btns"><button class="btn small" data-act="fl-crop" data-i="${i}"`, bar + `<div class="shop-btns"><button class="btn small" data-act="fl-crop" data-i="${i}"`);
  });
  return h.replace('<h3>🌾 Farmlands <small class="muted">', '<h3>🌾 Farmlands <small class="muted">automatic ');
})(farmlandPanel);
liveUpdate = (orig => function () {
  orig(); document.querySelectorAll('[data-flprog]').forEach(e => { e.style.width = Math.round(100 * (flAcc[+e.dataset.flprog] || 0)) + '%'; });
})(liveUpdate);
viewFarming = (orig => function () {
  const tpl = document.createElement('template'); tpl.innerHTML = orig();
  const kids = [...tpl.content.children];
  const rank = el => { const c = el.className || '', t = el.textContent || '';
    if (c.includes('farm-guide')) return 13; if (c.includes('skill-head')) return 0; if (c.includes('milestones')) return 1; if (c.includes('prestige-row')) return 2;
    if (c.includes('farm-auto')) return 3; if (t.includes('Harvest all')) return 4; if (c.includes('plots')) return 5;
    if (/^\s*Seeds/.test(t) && c.includes('panel')) return 6; if (c === 'list') return 7;
    if (t.includes('Farmlands')) return 9; if (t.includes('Farmhands')) return 10; if (t.includes('contract')) return 11; if (c.includes('farm-guide')) return 13; return 8; };
  kids.sort((a, b) => rank(a) - rank(b));
  const out = kids.map(el => {
    const r = rank(el);
    if (r === 13) { const h = el.querySelector('h3'); const title = h ? h.innerHTML : 'How your farm works'; h?.remove(); return `<details class="panel farm-guide"><summary><b>${title}</b> <small class="muted">tap to read</small></summary>${el.innerHTML}</details>`; }
    if (r === 6) { const p = el.querySelector('p'); if (p) p.className = 'small muted'; }
    if (r === 7 && !UI.seedAll) { // only the seeds you hold (the rest fold away)
      const rows = [...el.children], zero = rows.filter(x => { const q = (x.lastElementChild || x).textContent.trim(); return /^\D*0$/.test(q) || x.classList.contains('locked'); });
      if (zero.length && zero.length < rows.length) zero.forEach(x => x.remove()); else if (zero.length === rows.length) rows.slice(5).forEach(x => x.remove());
      const hid = rows.length - el.children.length;
      if (hid) return el.outerHTML + `<button class="btn small more-voy" data-act="seed-all">Show all seeds (+${hid} you don't have)</button>`;
    }
    if (r === 7 && UI.seedAll) return el.outerHTML + '<button class="btn small more-voy" data-act="seed-all">Only show seeds I have</button>';
    let pre = '';
    if (r === 4) pre = '<h3 class="sec-h">🟫 Your patches <small class="muted">· tap a patch to plant or harvest</small></h3>';
    if (r === 9) pre = '<h3 class="sec-h">🤖 Automation</h3>';
    return pre + el.outerHTML;
  });
  const i = out.findIndex(x => x.includes('prestige-row')) + 1 || 1;
  out.splice(i, 0, farmAutoStrip());
  return out.join('');
})(viewFarming);
viewSig = (orig => function () {
  if (UI.view !== 'skill' || UI.skill !== 'farming') return orig();
  return orig() + '|' + (UI.seedAll ? 'S' : '') + (S.fhLog?.n || 0) + (S.farmlands || []).map(f => (f.idle ? 'i' : '') + Math.floor((f.made || 0) / 50)).join();
})(viewSig);

/* ================= SAILING: a little more hand-holding ================= */
voyReturn = (orig => function (sh) { const r = orig(sh); S.lifetime.voys = (S.lifetime.voys || 0) + 1; return r; })(voyReturn);
const SRC = {};
const itemSource = id => { if (id in SRC) return SRC[id]; const e = Object.entries(STATION_ACTIONS).find(([, L]) => L.some(x => x.out?.[id])); return SRC[id] = e ? `${STATIONS[e[0]]?.name} (${SKILLS[STATIONS[e[0]]?.skill]?.name || ''})` : ''; };
function sailGuide() {
  const lv = S.lifetime.voys || 0, sailing = (S.voy || []).some(Boolean);
  if (lv >= 3 && !UI.sailHelp) return '';
  const st = [
    [lv > 0 || sailing, 'Send a ship', 'Tap <b>Send</b> on a voyage. The Coastal trade run needs no supplies, so start there.'],
    [lv > 0, 'Let it sail', 'Ships sail in real time, even while you\'re away. The bar on your fleet shows when they\'re back.'],
    [lv >= 3, 'Grow your fleet', 'Each voyage brings cargo and big XP. Hire deckhands for more ships, turn on Auto-resend, and upgrade your ship at the bottom of the page.'],
  ];
  return `<div class="panel sail-guide"><h3>🧭 How sailing works ${lv >= 3 ? '<button class="btn small" data-act="sail-help">Hide</button>' : ''}</h3>${st.map(([ok, t, d], k) => `<div class="sg-step ${ok ? 'ok' : ''}"><span>${ok ? '✔' : k + 1}</span><div><b class="sg-t">${t}</b><small>${d}</small></div></div>`).join('')}</div>`;
}
viewSkill = (orig => function () {
  let h = orig(); if (UI.skill !== 'sailing') return h;
  // where to get missing supplies
  h = h.replace(/<span class="cb-red">(\d+) ([^<]+)<\/span>/g, (m, n, name) => { const id = Object.keys(ITEMS).find(k => ITEMS[k].name.toLowerCase() === name); const src = id && itemSource(id); return src ? `${m} <i class="src">(${src})</i>` : m; });
  // only show the next locked voyage; the rest fold away
  let k = 0, hidden = 0, maxL = 0;
  h = h.replace(/<div class="upg locked">[\s\S]*?<span class="muted">Lv (\d+)<\/span><\/div>/g, (m, l) => { k++; if (k === 1 || UI.voyAll) return m; hidden++; maxL = Math.max(maxL, +l); return ''; });
  if (hidden) h = h.replace(/(<h3>🗺️ Voyages[\s\S]*?<div class="list">[\s\S]*?)(<\/div><\/div>)(?=<div class="panel"><h3>🚢|[\s\S]*?🚢)/, (m, a, b) => `${a}<button class="btn small more-voy" data-act="voy-all">+${hidden} more voyages unlock up to Lv ${maxL} · show</button>${b}`);
  if (UI.voyAll) h = h.replace('<h3>🗺️ Voyages', '<h3>🗺️ Voyages <button class="btn small" data-act="voy-all">Fold</button>');
  return h.replace('<div class="panel voy">', sailGuide() + '<div class="panel voy">');
})(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);
viewSig = (orig => function () { return UI.view === 'skill' && UI.skill === 'sailing' ? orig() + (UI.voyAll ? 'A' : '') + (UI.sailHelp ? 'H' : '') + (S.lifetime.voys || 0) : orig(); })(viewSig);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
  if (a === 'seed-all') { e.stopImmediatePropagation(); UI.seedAll = !UI.seedAll; UI.force = true; render(); }
  if (a === 'voy-all') { e.stopImmediatePropagation(); UI.voyAll = !UI.voyAll; UI.force = true; render(); }
  if (a === 'sail-help') { e.stopImmediatePropagation(); UI.sailHelp = false; S.lifetime.voys = Math.max(3, S.lifetime.voys || 0); UI.force = true; render(); }
}, true);

/* ---------- clicks & boot ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
  if (a === 'fan-set') { e.stopImmediatePropagation(); S.settings.fanfare = t.dataset.id; UI.force = true; render(); if (t.dataset.id === 'big') fanLegend({ kind: '✨ LEGENDARY DROP ✨', icon: '<span class="emo">🗡️</span>', name: 'Preview', sub: 'This is what a boss unique looks like' }); }
}, true);
function boot40() { boot39(); UI.force = true; render(); }
