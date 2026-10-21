'use strict';
/* =========================================================
   CLICKSCAPE v9.43 — the Vault: a few slots of gear you choose that survive ascension
   (and transcendence). Unlocks at your first ascension with 2 slots; more with essence or coins.
   Anything that comes out of the vault in a later run can be worn but not sold.
   ========================================================= */
const VAULT_MAX = 12, VAULT_FREE = 2;
const vault = () => (S.lifetime.vault ||= { bought: 0, items: [] });
const vaultOpen = () => lifeAsc() >= 1;
const vaultSlots = () => vaultOpen() ? Math.min(VAULT_MAX, VAULT_FREE + vault().bought) : 0;
const runKey = () => `${lifeAsc()}:${tcount()}:${S.apo?.count || 0}`;
const vaultEss = k => Math.round(10 * Math.pow(1.6, k));
const vaultCoin = k => Math.round(5e6 * Math.pow(8, k));
const vaultable = id => { const it = ITEMS[id]; return !!it && !!it.slot && !it.cosmetic && !it.outfit && !it.costumeSet && !it.perk; };
function vaultPut(id) {
  const V = vault(); if (!vaultable(id) || have(id) < 1) return false;
  if (V.items.length >= vaultSlots()) { toast('🔐 The vault is full. Buy another slot or take something out.', 'warn'); return false; }
  // a carried-over copy goes in first, and stays unsellable when it comes back out
  const wasCarried = typeof carriedInBank === 'function' ? carriedInBank(id) > 0 : isCarried(id);
  remove(id, 1); V.items.push({ id, run: wasCarried ? 'carried' : runKey() });
  if (wasCarried && typeof carryN === 'function') { carryN()[id]--; syncCarried(); }
  toast(`🔐 ${ITEMS[id].name} is in your vault. It'll still be here after you ascend.`, 'rare', 3500); return true;
}
function vaultTake(i) {
  const V = vault(), e = V.items[i]; if (!e) return; V.items.splice(i, 1); add(e.id, 1);
  if (e.run !== runKey()) { carryAdd(e.id); toast(`🔐 ${ITEMS[e.id].name} is back in your bank. It came from an earlier run, so it can be worn but not sold.`, '', 4500); }
  else toast(`🔐 ${ITEMS[e.id].name} is back in your bank.`, '', 2500);
}
function vaultBuy(cur) {
  const V = vault(), k = V.bought; if (!vaultOpen() || vaultSlots() >= VAULT_MAX) return;
  if (cur === 'ess') { const c = vaultEss(k); if ((S.asc.essence || 0) < c) return toast(`🔐 You need ${fmt(c)} essence for the next vault slot.`, 'warn'); S.asc.essence -= c; }
  else { const c = vaultCoin(k); if (S.coins < c) return toast(`🔐 You need 🪙${fmt(c)} for the next vault slot.`, 'warn'); S.coins -= c; }
  V.bought++; toast(`🔐 Vault slot ${vaultSlots()} unlocked!`, 'rare', 3000);
}
function vaultModal() {
  const V = vault(), n = vaultSlots();
  if (!vaultOpen()) return openModal(`<div class="item-modal vault"><h2>🔐 The Vault</h2><p>Keep a few pieces of gear through ascension: a spare Barrows body, a collection piece, a weapon you're not using yet.</p><p class="y">Unlocks at your first ascension with ${VAULT_FREE} slots.</p><div class="row-btns"><button class="btn big" data-act="close">OK</button></div></div>`);
  const slots = Array.from({ length: n }, (_, i) => { const e = V.items[i]; return e ? `<button class="v-slot full" data-act="vault-take" data-i="${i}">${itemIcon(e.id)}<b>${ITEMS[e.id].name}</b><small>${e.run === runKey() ? 'Take out' : 'Take out · kept from an earlier run'}</small></button>` : '<div class="v-slot empty"><span>Empty</span></div>'; }).join('');
  const k = V.bought, more = n < VAULT_MAX;
  const gear = Object.keys(S.bank).filter(id => have(id) > 0 && vaultable(id)).sort((a, b) => (ITEMS[b].value || 0) - (ITEMS[a].value || 0)).slice(0, 40);
  openModal(`<div class="item-modal vault"><h2>🔐 The Vault <small class="muted">${V.items.length}/${n}</small></h2>
    <p class="small muted">Gear in here survives ascension and transcendence. Taken out in a later run, it can be worn but not sold.</p>
    <div class="v-grid">${slots}</div>
    ${more ? `<div class="row-btns"><button class="btn ${(S.asc.essence || 0) >= vaultEss(k) ? '' : 'poor'}" data-act="vault-buy" data-cur="ess">+1 slot · ${fmt(vaultEss(k))} ✨</button><button class="btn ${S.coins >= vaultCoin(k) ? '' : 'poor'}" data-act="vault-buy" data-cur="coin">+1 slot · 🪙${fmt(vaultCoin(k))}</button></div>` : '<p class="small y">All 12 slots unlocked.</p>'}
    ${V.items.length < n ? `<h3>Put gear in</h3>${gear.length ? `<div class="v-pick">${gear.map(id => `<button class="v-row" data-act="vault-put" data-id="${id}">${itemIcon(id)}<span>${ITEMS[id].name}${have(id) > 1 ? ` <small class="muted">×${fmt(have(id))}</small>` : ''}</span><b>＋</b></button>`).join('')}</div>` : '<p class="small muted">No gear in your bank.</p>'}` : ''}
    <div class="row-btns"><button class="btn big" data-act="close">Done</button></div></div>`);
}
// bank: a vault bar
viewBank = (orig => function () {
  const V = vault(), bar = `<div class="panel row-between small vault-bar"><div>🔐 <b>Vault</b> <small class="muted">${vaultOpen() ? `${V.items.length}/${vaultSlots()} · gear kept through ascension` : 'unlocks at your first ascension'}</small></div><button class="btn small" data-act="vault-open">Open</button></div>`;
  return orig().replace(/(<div class="chips one-row auto-tabs">)/, bar + '$1');
})(viewBank);
VIEWS.bank = (orig => function () { return rebrand(orig()); })(viewBank);
viewSig = (orig => function () { return UI.view === 'bank' ? orig() + '|v' + vault().items.length + vaultSlots() : orig(); })(viewSig);
// item window: one-tap "keep in vault"
openItemModal = (orig => function (id, fromSlot) {
  orig.apply(this, arguments); if (fromSlot || !vaultOpen() || !vaultable(id) || have(id) < 1) return;
  const V = vault(), free = V.items.length < vaultSlots(); const box = $('#modal .item-modal') || $('#modal'); if (!box) return;
  box.insertAdjacentHTML('beforeend', `<div class="row-btns"><button class="btn ${free ? '' : 'poor'}" data-act="vault-put" data-id="${id}" data-close="1">🔐 Keep in vault <small>${V.items.length}/${vaultSlots()}</small></button></div>`);
})(openItemModal);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
  if (!a.startsWith('vault-')) return; e.stopImmediatePropagation();
  if (a === 'vault-open') vaultModal();
  if (a === 'vault-put') { if (vaultPut(t.dataset.id) && t.dataset.close) closeModal(); else if (!t.dataset.close) vaultModal(); }
  if (a === 'vault-take') { vaultTake(+t.dataset.i); vaultModal(); }
  if (a === 'vault-buy') { vaultBuy(t.dataset.cur); vaultModal(); }
  UI.force = true; render();
}, true);
// the first ascension mentions it
ascend = (orig => function () { const n0 = lifeAsc(); const r = orig.apply(this, arguments); if (n0 === 0 && lifeAsc() === 1) setTimeout(() => toast(`🔐 The Vault is unlocked (Bank page): ${VAULT_FREE} slots for gear you want to keep through future ascensions.`, 'rare', 8000), 2500); return r; })(ascend);

function boot64() { boot63(); vault(); UI.force = true; render(); }
