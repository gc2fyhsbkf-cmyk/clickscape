'use strict';
/* =========================================================
   CLICKSCAPE v9.8 — automatic save backups, restore, safer "new game"
   ========================================================= */
const BAK_KEY = 'clickscape_backups', BAK_MAX = 3;
const readBaks = () => { try { return JSON.parse(localStorage.getItem(BAK_KEY) || '[]'); } catch (e) { return []; } };
function backupNow(reason) {
  try {
    save(); const data = localStorage.getItem(SAVE_KEY); if (!data) return;
    let B = readBaks(); if (B[0]?.data === data) return;
    B.unshift({ t: Date.now(), reason, data, lvl: totalLevel(), asc: lifeAsc(), td: tcount() });
    B = B.slice(0, BAK_MAX);
    while (B.length) { try { localStorage.setItem(BAK_KEY, JSON.stringify(B)); break; } catch (e) { B.pop(); } }
  } catch (e) { console.warn('backup failed', e); }
}
// every 30 minutes, and before every big reset
let bakT = 0;
tickCore = (orig => function (dt) { orig(dt); if (OFF) return; bakT += dt; if (bakT >= 1800) { bakT = 0; backupNow('auto'); } })(tickCore);
ascend = (orig => function () { if (!OFF && !S.trans?.perks?.autoasc) backupNow('before ascending'); return orig(); })(ascend);
transcend2 = (orig => function (auto) { if (!auto) backupNow('before Transcendence'); return orig(auto); })(transcend2);
apotheosis = (orig => function () { backupNow('before Apotheosis'); return orig(); })(apotheosis);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act;
  if (a === 'import-go') backupNow('before importing a save');
  else if (a === 'wipe-yes') backupNow('before starting a new game');
  else if (a === 'bak-restore') { e.stopImmediatePropagation(); const b = readBaks()[+t.dataset.i]; if (!b) return; openModal(`<h2>🛟 Restore this backup?</h2><p>Your current progress will be replaced by the backup from <b>${new Date(b.t).toLocaleString()}</b> (total level ${fmt(b.lvl || 0)}). A backup of your current game is made first.</p><button class="btn big danger" data-act="bak-yes" data-i="${t.dataset.i}">Restore</button><button class="btn" data-act="close">Cancel</button>`); }
  else if (a === 'bak-yes') { e.stopImmediatePropagation(); const b = readBaks()[+t.dataset.i]; if (!b) return; const keep = b.data; backupNow('before restoring'); SAVE_LOCK = true; localStorage.setItem(SAVE_KEY, keep); toast('🛟 Backup restored, reloading…'); setTimeout(() => location.reload(), 300); }
  else if (a === 'bak-now') { e.stopImmediatePropagation(); backupNow('manual'); toast('🛟 Backup saved.'); UI.force = true; render(); }
}, true);
viewSettings = (orig => function () {
  const B = readBaks();
  const rows = B.map((b, i) => `<div class="upg"><div class="upg-icon">🛟</div><div class="upg-main"><b>${new Date(b.t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</b><small>${b.reason} · total level ${fmt(b.lvl || 0)} · ${fmt(b.asc || 0)} ascensions${b.td ? ` · ${b.td} TD` : ''}</small></div><button class="btn" data-act="bak-restore" data-i="${i}">Restore</button></div>`).join('') || '<p class="muted small">No backups yet. One is made every 30 minutes and before every ascension, Transcendence, import or new game.</p>';
  return orig().replace('Delete save &amp; restart', 'Start a new game').replace('Delete save & restart', 'Start a new game')
    .replace('<div class="panel"><h3>💾 Save</h3>', `<div class="panel"><h3>🛟 Backups <small class="muted">· last ${BAK_MAX}, kept on this device</small></h3><div class="list">${rows}</div><button class="btn" data-act="bak-now">Back up now</button></div><div class="panel"><h3>💾 Save</h3>`);
})(viewSettings);
VIEWS.settings = (orig => function () { return rebrand(orig()); })(viewSettings);
function boot31() { boot30(); UI.force = true; render(); }
