// Clickscape service worker — keeps the game playable offline.
// Bump VERSION whenever you change any file so phones pick up the update.
const VERSION = 'clickscape-v9.1';
const FILES = ['./', 'index.html', 'style.css?v=9.1', 'data.js?v=9.1', 'data3.js?v=9.1', 'data4.js?v=9.1', 'icons.js?v=9.1', 'game.js?v=9.1', 'systems.js?v=9.1', 'ui3.js?v=9.1', 'ext4.js?v=9.1', 'ext5.js?v=9.1', 'ext6.js?v=9.1', 'ext7.js?v=9.1', 'ext8.js?v=9.1', 'ext9.js?v=9.1', 'ext10.js?v=9.1', 'ext11.js?v=9.1', 'ext12.js?v=9.1', 'ext13.js?v=9.1', 'ext14.js?v=9.1', 'ext15.js?v=9.1', 'ext16.js?v=9.1', 'ext17.js?v=9.1', 'ext18.js?v=9.1', 'ext19.js?v=9.1', 'ext20.js?v=9.1', 'ext21.js?v=9.1', 'ext22.js?v=9.1', 'ext23.js?v=9.1', 'ext24.js?v=9.1',
  'manifest.webmanifest?v=9.1', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).catch(() => { })); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Always ask the network for a fresh copy (bypassing the browser's HTTP cache), fall back to the offline copy.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => {
    const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: false }).then(m => m || caches.match(e.request, { ignoreSearch: true }))));
});
