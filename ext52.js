'use strict';
/* =========================================================
   CLICKSCAPE v9.28 — worker wages (light), custom bank tabs, a sound pass for the new
   systems, and Journey steps for contracts, the world boss, specialists, codex & wardrobe
   ========================================================= */

/* ================= WORKER WAGES ================= */
// every worker earns a wage; it grows with the square of a station's crew, so a few deep stations
// cost less than hiring everything everywhere. Small crews cost next to nothing.
// If you can't pay, workers slow to half speed (nothing is lost).
const wageScale = () => 0.15 * Math.pow(3, Math.min(10, lifeAsc())) * Math.pow(2, tcount());
const extraOf = st => Math.max(0, Math.min(S.workers?.[st] || 0, workerCap()));
const wageOf = st => { const x = extraOf(st); return x ? x * x * (STATIONS[st]?.wbase || 20) * wageScale() : 0; };   // coins per hour
const wagesTotal = () => STATION_ORDER.concat(Object.keys(S.workers || {})).filter((v, i, a) => a.indexOf(v) === i && STATIONS[v]).reduce((a, st) => a + wageOf(st), 0);
let wageT = 0;
tickCore = (orig => function (dt) {
  orig(dt); wageT += dt; if (wageT < 60) return; const d = wageT; wageT = 0;
  const due = wagesTotal() * d / 3600; const was = !!S.unpaid;
  if (due <= 0) S.unpaid = false;
  else if (S.coins >= due) { S.coins -= due; S.lifetime.wages = (S.lifetime.wages || 0) + due; S.unpaid = false; }
  else S.unpaid = true;
  if (was !== !!S.unpaid) { recalc(); if (!OFF) toast(S.unpaid ? '💸 You can\'t cover your workers\' wages: they work at half speed until you can.' : '💰 Wages paid again: every worker is back to full speed.', S.unpaid ? 'warn' : 'rare', 6000); }
})(tickCore);
recalc4 = (orig => function () {
  orig(); if (!S?.unpaid) return;
  for (const st in S.workers) { const n = Math.min(S.workers[st] || 0, workerCap()), x = extraOf(st); if (x && M.rate[st]) M.rate[st] *= (n - x * 0.5) / n; }
})(recalc4);
viewSkill = (orig => function () {
  let h = orig(); const st = UI.curStation; if (!st || !STATIONS[st] || SK_SKIP()) return h;
  const w = wageOf(st), tot = wagesTotal();
  if (w) h = h.replace(/(<span data-ipm="[^"]+"><\/span> per min)/, `$1 · <span class="${S.unpaid ? 'cb-red' : 'wage'}">wages 🪙${fmt(w)}/h${S.unpaid ? ' unpaid' : ''}</span>`);
  return h.replace(/(<div class="sk-drawer [^"]*" data-drawer="work">)/, `$1<div class="panel small">💰 <b>Wages</b>: every worker is paid. Wages grow with the square of a station's crew (a few workers cost next to nothing, big crews cost more) (this station: 🪙${fmt(w)}/h · all stations: 🪙${fmt(tot)}/h). If you can't pay, workers work at half speed.</div>`);
})(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);

/* ================= CUSTOM BANK TABS ================= */
const tabsOf = () => (S.settings.bankTabs ||= []);
bankTiles = (orig => function () {
  const h = orig(); const T = tabsOf()[UI.bankTab]; if (UI.bankTab == null || !T) return h;
  const set = new Set(T.ids);
  const parts = h.split(/(?=<button class="tile)/).filter(x => x.startsWith('<button class="tile')).map(x => x.replace(/<div class="bank-h">[\s\S]*$/, ''));
  const seen = new Set(); const L = parts.filter(x => { const id = (x.match(/data-id="([^"]+)"/) || [])[1]; if (!id || !set.has(id) || seen.has(id)) return false; seen.add(id); return true; });
  return L.join('') || `<p class="muted small" style="grid-column:1/-1">This tab is empty. Open any item and tap "Add to ${esc(T.n)}".</p>`;
})(bankTiles);
viewBank = (orig => function () {
  const T = tabsOf();
  const row = `<div class="chips one-row btabs"><button class="chip ${UI.bankTab == null ? 'on' : ''}" data-act="btab" data-i="">🗂️ No tab</button>${T.map((t, i) => `<button class="chip ${UI.bankTab === i ? 'on' : ''}" data-act="btab" data-i="${i}">${esc(t.n)} <small>${t.ids.filter(id => have(id)).length}</small></button>`).join('')}${T.length < 8 ? '<button class="chip" data-act="btab-new">＋ Tab</button>' : ''}${UI.bankTab != null ? '<button class="chip" data-act="btab-del">🗑️</button>' : ''}</div>`;
  return orig().replace('<div class="bank-grid" id="bankgrid">', row + '<div class="bank-grid" id="bankgrid">');
})(viewBank);
VIEWS.bank = (orig => function () { return rebrand(orig()); })(viewBank);
viewSig = (orig => function () { return UI.view === 'bank' ? orig() + '|bt' + UI.bankTab + JSON.stringify(S.settings.bankTabs || []) : orig(); })(viewSig);
openItemModal = (orig => function (id, fromSlot) {
  orig(id, fromSlot); const T = tabsOf(); if (fromSlot || !T.length) return; const box = $('#modal .item-modal'); if (!box) return;
  box.insertAdjacentHTML('beforeend', `<div class="chips btab-add"><small class="muted">Bank tabs:</small>${T.map((t, i) => `<button class="chip ${t.ids.includes(id) ? 'on' : ''}" data-act="btab-item" data-i="${i}" data-id="${id}">${t.ids.includes(id) ? '✓ ' : '＋ '}${esc(t.n)}</button>`).join('')}</div>`);
})(openItemModal);
function newTabModal() {
  openModal(`<div class="item-modal"><h2>🗂️ New bank tab</h2><p class="small muted">Give it a name (an emoji at the start works nicely, like "⚔️ Combat" or "🌿 Herbs").</p>
    <input id="btab-name" class="btab-input" maxlength="16" placeholder="⭐ My tab" autocomplete="off"><div class="row-btns"><button class="btn big" data-act="btab-make">Create</button><button class="btn" data-act="close">Cancel</button></div></div>`);
  setTimeout(() => $('#btab-name')?.focus(), 50);
}

/* ================= SOUND PASS ================= */
const SFX2 = (() => {
  const vol = () => (S?.settings?.volume ?? 0.6);
  const tone = (f, d, type = 'triangle', v = 0.07, slide = 0, delay = 0) => { const c = SFX.unlock(); if (!c) return; const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d); g.gain.setValueAtTime(Math.max(0.0001, v * vol()), t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.03); };
  const noise = (d, v = 0.06, f = 1500, delay = 0) => { const c = SFX.unlock(); if (!c) return; const t = c.currentTime + delay, len = Math.floor(c.sampleRate * d), b = c.createBuffer(1, len, c.sampleRate), x = b.getChannelData(0); for (let i = 0; i < len; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / len); const s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; bp.type = 'bandpass'; bp.frequency.value = f; g.gain.value = v * vol(); s.connect(bp).connect(g).connect(c.destination); s.start(t); };
  const LIB = {
    legend: () => { [523, 659, 784, 1047, 1319, 1568].forEach((n, i) => tone(n, 0.3, 'triangle', 0.07, 0, i * 0.07)); [2093, 2637, 3136].forEach((n, i) => tone(n, 0.5, 'sine', 0.03, 0, 0.45 + i * 0.05)); },
    chest: () => { noise(0.18, 0.05, 400); tone(180, 0.2, 'sawtooth', 0.03, 1.6); [1568, 2093, 2637].forEach((n, i) => tone(n, 0.12, 'square', 0.025, 0, 0.25 + i * 0.06)); },
    contract: () => { noise(0.05, 0.08, 300); [659, 880, 1175].forEach((n, i) => tone(n, 0.16, 'triangle', 0.06, 0, 0.08 + i * 0.08)); },
    swing: () => noise(0.09, 0.035, 2500),
    bow: () => tone(260, 0.12, 'sawtooth', 0.04, 0.6),
    spell: () => { tone(900, 0.15, 'sine', 0.04, 2.2); noise(0.08, 0.02, 5000); },
    bossin: () => { tone(98, 0.6, 'sawtooth', 0.06, 0.9); tone(147, 0.6, 'sawtooth', 0.04, 0.9, 0.05); },
    quality: () => [1760, 2349, 2794].forEach((n, i) => tone(n, 0.18, 'sine', 0.04, 0, i * 0.05)),
  };
  return n => { if (OFF || !S?.settings?.sound) return; try { LIB[n]?.(); } catch (e) {} };
})();
fanLegend = (orig => function (o) { SFX2('legend'); return orig(o); })(fanLegend);
chestModal = (orig => function (all) { const r = orig(all); SFX2('chest'); return r; })(chestModal);
deliver = (orig => function (fid) { const n0 = S.lifetime.conDone || 0; const r = orig(fid); if ((S.lifetime.conDone || 0) > n0) SFX2('contract'); return r; })(deliver);
attackAnim = (orig => function (dmg) { const t0 = lastAnim; orig(dmg); if (lastAnim !== t0) SFX2(wclass() === 'ranged' ? 'bow' : wclass() === 'magic' ? 'spell' : 'swing'); })(attackAnim);
let lastSplash = 0;
setInterval(() => { if (UI._bossSplashT && UI._bossSplashT !== lastSplash) { lastSplash = UI._bossSplashT; if (UI.view === 'combat' && Date.now() - lastSplash < 1500) SFX2('bossin'); } }, 400);
fanBanner = (orig => function (icon, title, sub) { orig(icon, title, sub); if (/craft|Reforged/i.test(title)) SFX2('quality'); })(fanBanner);

/* ================= JOURNEY: newer systems ================= */
JOURNEY.push(
  ['con1', '📜 Complete a contract', 'Factions on the Contracts page (More) want things you make: finish an order for coins and permanent reputation.', () => (S.lifetime.conDone || 0) >= 1, () => totalLevel() >= 150],
  ['wb1', '🌍 Send your fighter to the World boss', 'A new giant every Monday: your fighter keeps hitting it even while you\'re away.', () => !!S.lifetime.wb?.on || (S.lifetime.wb?.dmg || 0) > 0, () => combatLevel() >= 20],
  ['codex1', '📖 Earn a codex star', 'Kill 10 of any monster to earn its first codex star (+2% damage and drops against it). See Collections.', () => MONSTERS.some(m => !m.boss && codexStars(m) >= 1), () => lifeAsc() >= 0],
  ['ward1', '👑 Store a cosmetic in the Wardrobe', 'Rare cosmetics stored in the Costume room give permanent bonuses and survive every reset.', () => wardOwned().length >= 1, () => WARD_IDS.some(id => have(id))],
  ['spec1', '⭐ Hire a specialist', 'Every worker you hire has a small chance to be a specialist with a trait. They stay with you forever.', () => Object.values(S.lifetime.spec || {}).some(L => L.length), () => lifeAsc() >= 1],
);

/* ---------- clicks & boot ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
  if (a === 'btab') { e.stopImmediatePropagation(); UI.bankTab = t.dataset.i === '' ? null : +t.dataset.i; UI.force = true; render(); }
  if (a === 'btab-new') { e.stopImmediatePropagation(); newTabModal(); }
  if (a === 'btab-make') { e.stopImmediatePropagation(); const n = ($('#btab-name')?.value || '').trim() || `Tab ${tabsOf().length + 1}`; tabsOf().push({ n: n.slice(0, 16), ids: [] }); UI.bankTab = tabsOf().length - 1; closeModal(); toast(`🗂️ Created "${n}". Open any item to add it.`); UI.force = true; render(); }
  if (a === 'btab-del') { e.stopImmediatePropagation(); const i = UI.bankTab; if (i == null) return; if (UI.btabDel !== i) { UI.btabDel = i; setTimeout(() => { UI.btabDel = null; }, 3000); return toast('Tap 🗑️ again to delete this tab (items stay in your bank).', 'warn', 3000); } tabsOf().splice(i, 1); UI.bankTab = null; UI.btabDel = null; UI.force = true; render(); }
  if (a === 'btab-item') { e.stopImmediatePropagation(); const T = tabsOf()[+t.dataset.i], id = t.dataset.id; if (!T) return; const k = T.ids.indexOf(id); if (k >= 0) T.ids.splice(k, 1); else T.ids.push(id); closeModal(); openItemModal(id); }
}, true);
function boot52() { boot51(); UI.force = true; render(); }

