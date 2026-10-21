'use strict';
/* =========================================================
   CLICKSCAPE v9.49 — tidier combat page (compact World boss/Bounty buttons, info chips, one slim
   stats line) and a tidier item window (stat grid, action chips, fold-out sections)
   ========================================================= */

/* ================= COMBAT PAGE ================= */
function cbTopHTML() {
  const sl = S.slayer, out = [];
  try { if (typeof wbState === 'function') { const W = wbState(); if (W.dmg < W.max) out.push(`<button class="cb-tb" data-act="hub" data-id="worldboss"><span class="emo">${wbBoss().icon}</span><span>World boss<small>${W.on ? 'your fighter is on it' : `${wbBoss().name} · ${fmt(100 * W.dmg / Math.max(1, W.max))}%`}</small></span></button>`); } } catch (e) {}
  if (!sl.mon || sl.left <= 0) out.push('<button class="cb-tb" data-act="area" data-id="slayer"><span class="emo">💀</span><span>Slayer<small>No task · get one</small></span></button>');
  else { const m = MONSTER_BY_ID[sl.mon], here = S.combat.mon === m.id && S.combat.fighting; out.push(`<button class="cb-tb ${here ? 'on' : ''}" ${here ? '' : 'data-act="fighttask"'}><span class="emo">💀</span><span>Slayer: ${m.name}<small><b class="y" data-live="taskleft">${sl.left}</b> / ${sl.total} left${here ? ' · on task' : ' · tap to fight'}</small></span></button>`); }
  return `<div class="cb-top">${out.join('')}</div>`;
}
const tipShort = t => { const s = t.replace(/<[^>]+>/g, ''); const c = s.split(/[:(]/)[0].trim(); return c.length > 34 ? c.slice(0, 32) + '…' : c; };
fightStripHTML = function () {
  const m = curMon(), f = fightCalc(m), [rc, rl, rd] = riskOf(f), tips = fightTip(f, m).filter(t => !/Weak to|dragonfire|anti-dragon/i.test(t));
  const food = String(rd).replace(/^Food lasts\s*/i, 'food ').replace(/\.$/, '');
  return `<div class="cb-hud"><div><b>${f.max}</b><small>hit · ${Math.round(f.hc * 100)}%</small></div><div><b>${fmtD(f.dps)}</b><small>dps</small></div><div><b>~${fmtTime(Math.max(1, f.ttk))}</b><small>per kill</small></div><div><b class="cb-red">${f.emh}</b><small>their hit</small></div><div><b>${fmtD(f.inc)}</b><small>taken/s</small></div></div>
    <div class="cb-chips"><span class="cb-chip risk ${rc}" data-act="cbtip" data-t="${esc(`${rl} ${rd} · ~${fmt(f.kph)} kills/h · ~${fmt(f.xph)} XP/h`)}">${rl} · ${food}</span><span class="cb-chip" data-act="cbtip" data-t="${esc(`~${fmt(f.kph)} kills/h · ~${fmt(f.xph)} XP/h`)}">~${fmt(f.xph)} XP/h</span>${tips.map(t => `<span class="cb-chip tip" data-act="cbtip" data-t="${esc(t.replace(/<[^>]+>/g, ''))}">${tipShort(t)}</span>`).join('')}</div>`;
};
viewCombat = (orig => function () {
  let h = orig();
  // World boss + Slayer panels → two compact buttons
  const top = cbTopHTML();
  h = h.replace(/<div class="panel row-between"><div><b>[^<]*World boss<\/b>[\s\S]*?data-id="worldboss">Open<\/button><\/div>/, '');
  h = h.replace(/<div class="panel task[^"]*">[\s\S]*?<\/div>/, top);
  if (!h.includes('class="cb-top"')) h = top + h;
  // the line under the monster → chips
  h = h.replace(/<div class="muted small">(Tap to (?:strike|attack)[\s\S]*?)<\/div>/, () => {
    const m = curMon(), C = S.combat, c = [];
    c.push(`<span class="cb-chip">${C.fighting ? `⚔️ Auto every ${fmtD(attackInterval())}s` : '👆 Tap to attack'}</span>`);
    if (m.weak) c.push(`<span class="cb-chip blue">🎯 Weak to ${m.weak}</span>`);
    if (m.dragon && typeof dragonfireMult === 'function' && dragonfireMult() > 1) c.push(`<span class="cb-chip red" data-act="cbtip" data-t="Dragonfire ×${dragonfireMult()}: bring an anti-dragon shield or an antifire potion.">🔥 Dragonfire ×${dragonfireMult()} · bring antifire</span>`);
    return `<div class="cb-chips mon">${c.join('')}</div>`;
  });
  return h;
})(viewCombat);
VIEWS.combat = (orig => function () { return rebrand(orig()); })(viewCombat);
document.addEventListener('click', e => { const t = e.target.closest('[data-act="cbtip"]'); if (!t) return; e.stopImmediatePropagation(); toast(rebrand(t.dataset.t), '', 4500); }, true);

/* ================= ITEM WINDOW ================= */
// top: a stat grid and small action chips; bottom: sections that fold out with a one-line preview
function tidyItemModal() {
  const box = $('#modal .item-modal'); if (!box || box._tidy || box.classList.contains('act-info') || box.classList.contains('vault')) return; box._tidy = true;
  const btns = box.querySelector('.im-btns'); if (!btns) return;
  const kids = [...box.children], bi = kids.indexOf(btns);
  // 1) stats paragraph → grid cells
  const stats = kids.slice(0, bi).find(k => k.tagName === 'P' && k.classList.contains('small') && !k.classList.contains('muted'));
  if (stats) {
    const parts = stats.innerHTML.split(/<br\s*\/?>/i).flatMap(s => s.split(' · ')).map(s => s.trim()).filter(s => s.replace(/<[^>]+>/g, '').trim());
    if (parts.length >= 2) { const g = document.createElement('div'); g.className = 'im-grid'; g.innerHTML = parts.map(p => `<div class="${p.replace(/<[^>]+>/g, '').length > 22 ? 'wide' : ''}">${p}</div>`).join(''); stats.replaceWith(g); }
  }
  // 2) single-purpose action rows → one row of chips under the main buttons
  const after = kids.slice(bi + 1), chips = document.createElement('div'); chips.className = 'im-chiprow';
  for (const k of after) if (k.classList?.contains('row-btns') && !k.classList.contains('destroy-row')) { const bs = [...k.querySelectorAll('button')]; if (!bs.length) continue; bs.forEach(b => { b.classList.add('im-chip'); chips.appendChild(b); }); [...k.querySelectorAll('p')].forEach(p => box.appendChild(p)); k.remove(); }
  if (chips.children.length) btns.after(chips);
  // 3) sections → fold-outs
  const rest = [...box.children].slice([...box.children].indexOf(chips.isConnected ? chips : btns) + 1);
  let cur = null;
  for (const k of rest) {
    if (k.tagName === 'H3') { const d = document.createElement('details'); d.className = 'im-acc'; d.innerHTML = `<summary>${k.innerHTML}<small></small></summary>`; k.replaceWith(d); cur = d; continue; }
    if (k.matches('.reforge')) { const d = document.createElement('details'); d.className = 'im-acc'; const t = (k.querySelector('button')?.textContent || '').replace(/^🔨\s*Reforge\s*·\s*/, ''); d.innerHTML = `<summary>🔨 Reforge<small>${t}</small></summary>`; k.replaceWith(d); d.appendChild(k); cur = null; continue; }
    if (cur && !k.matches('.row-btns,.sig-line,.ledger,.destroy-row,.btab-add,.bm-info')) { cur.appendChild(k); continue; }
    cur = null;
  }
  box.querySelectorAll('details.im-acc').forEach(d => { const s = d.querySelector('summary small'); if (s && !s.textContent) s.textContent = [...d.children].filter(c => c.tagName !== 'SUMMARY').map(c => c.textContent.trim()).join(' ').replace(/\s+/g, ' ').replace(/^•\s*/, '').slice(0, 44); });
}
openItemModal = (orig => function () { const r = orig.apply(this, arguments); try { tidyItemModal(); } catch (e) { console.warn(e); } return r; })(openItemModal);

function boot70() { boot69(); UI.force = true; render(); }
