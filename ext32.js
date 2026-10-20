'use strict';
/* =========================================================
   CLICKSCAPE v9.8.1 — tribute panel fix for new accounts, locked features
   greyed out until they unlock, Transcendence/Apotheosis revealed gradually
   ========================================================= */

/* ---------- fix: the tribute panel anchors on the relic panel, which a new account didn't render ---------- */
relicPanel = (orig => function () {
  const h = orig();
  return h.includes('class="panel relics"') ? h : `<div class="panel relics"><p class="small muted">🔮 Relics unlock after your first ascension.</p></div>`;
})(relicPanel);

/* ---------- Transcendence & Apotheosis stay mysterious until you're close ---------- */
const transRevealed = () => tcount() > 0 || apoCount() > 0 || sigils() >= 0.25 * transTarget() || lifeAsc() >= 8;
const apoRevealed = () => apoCount() > 0 || (S.trans?.earned || 0) >= 0.25 * apoTarget();
const teaser = (icon, name, hint) => `<div class="panel row-between locked-feature"><div><b>${icon} ${name}</b><br><small class="muted">${hint}</small></div><button class="btn disabled" disabled>🔒</button></div>`;
viewAscension = (orig => function () {
  let h = orig();
  if (!transRevealed()) {
    h = h.replace(/<div class="panel row-between"><div><b>✴️ Transcendence<\/b>[\s\S]*?<\/button><\/div>/, teaser('✴️', '???', 'Something stirs beyond ascension… keep gathering sigils.'))
      .replace(/<small class="muted">✴️ Transcendence at [^<]*<\/small>/, '<small class="muted">✴️ ??? · a deeper power awaits</small>')
      .replace(', Transcendence adds lots more', '');
  }
  return h;
})(viewAscension);
VIEWS.ascension = (orig => function () { return rebrand(orig()); })(viewAscension);
apoPanel = (orig => function () { if (!tcount() && !apoCount()) return ''; return apoRevealed() ? orig() : teaser('☀️', '???', 'Even the Pantheon answers to something… earn more divine shards.'); })(apoPanel);
go = (orig => function (v, ...r) {
  if (v === 'transcend' && !transRevealed()) return toast('✴️ Something lies beyond ascension… you are not ready yet.', 'warn', 3500);
  if (v === 'apotheosis' && !apoRevealed()) return toast('☀️ You are not ready for this yet.', 'warn', 3500);
  return orig(v, ...r);
})(go);

/* ---------- More menu: locked tiles are greyed out instead of failing on tap ---------- */
const tileLock = id => (id === 'ge' && !unlocked('ge')) ? 'after your first ascension' : (id === 'academy' && !unlocked('academy')) ? 'after your first ascension' : (id === 'transcend' && !transRevealed()) ? '???' : null;
viewMenu = (orig => function () {
  return orig().replace(/<button class="hub-tile" data-act="hub" data-id="([a-z]+)">([\s\S]*?)<\/button>/g, (m, id, inner) => {
    const why = tileLock(id); if (!why) return m;
    return `<button class="hub-tile locked" disabled>${inner.replace(/<small>[\s\S]*?<\/small>/, `<small>🔒 Unlocks ${why}</small>`)}</button>`;
  });
})(viewMenu);
VIEWS.menu = (orig => function () { return rebrand(orig()); })(viewMenu);
// Combat academy entry on the combat page
viewCombat = (orig => function () {
  const h = orig(); if (unlocked('academy')) return h;
  return h.replace(/<div class="panel row-between"><div><b>🎓 Combat academy<\/b>[\s\S]*?<\/button><\/div>/, teaser('🎓', 'Combat academy', 'Opens after your first ascension.'));
})(viewCombat);
VIEWS.combat = (orig => function () { return rebrand(orig()); })(viewCombat);
// Trading Post buttons on the shop page
viewShop = (orig => function () { const h = orig(); return unlocked('ge') ? h : h.replace(/<button([^>]*)data-nav="ge"([^>]*)>/g, '<button$1disabled class="btn disabled"$2>🔒 ').replace(/<button([^>]*)data-act="hub" data-id="ge"([^>]*)>/g, '<button$1disabled class="btn disabled"$2>🔒 '); })(viewShop);
VIEWS.shop = (orig => function () { return rebrand(orig()); })(viewShop);

function boot32() { boot31(); UI.force = true; render(); }
