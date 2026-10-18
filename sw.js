// Clickscape service worker — keeps the game playable offline.
// Bump VERSION whenever you change any file so phones pick up the update.
const VERSION = 'clickscape-v5.2';
const FILES = ['./', 'index.html', 'style.css?v=5.2', 'data.js?v=5.2', 'data3.js?v=5.2', 'data4.js?v=5.2', 'icons.js?v=5.2', 'game.js?v=5.2', 'systems.js?v=5.2', 'ui3.js?v=5.2', 'ext4.js?v=5.2', 'ext5.js?v=5.2', 'ext6.js?v=5.2', 'ext7.js?v=5.2', 'ext8.js?v=5.2', 'ext9.js?v=5.2',
  'manifest.webmanifest?v=5.2', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];
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
