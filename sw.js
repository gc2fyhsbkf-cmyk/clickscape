// Clickscape service worker — keeps the game playable offline.
// Bump VERSION whenever you change any file so phones pick up the update.
const VERSION = 'clickscape-v8.0';
const FILES = ['./', 'index.html', 'style.css?v=8.0', 'data.js?v=8.0', 'data3.js?v=8.0', 'data4.js?v=8.0', 'icons.js?v=8.0', 'game.js?v=8.0', 'systems.js?v=8.0', 'ui3.js?v=8.0', 'ext4.js?v=8.0', 'ext5.js?v=8.0', 'ext6.js?v=8.0', 'ext7.js?v=8.0', 'ext8.js?v=8.0', 'ext9.js?v=8.0', 'ext10.js?v=8.0', 'ext11.js?v=8.0', 'ext12.js?v=8.0', 'ext13.js?v=8.0', 'ext14.js?v=8.0', 'ext15.js?v=8.0', 'ext16.js?v=8.0', 'ext17.js?v=8.0', 'ext18.js?v=8.0', 'ext19.js?v=8.0', 'ext20.js?v=8.0', 'ext21.js?v=8.0', 'ext22.js?v=8.0',
  'manifest.webmanifest?v=8.0', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];
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
