// Clickscape service worker — keeps the game playable offline.
// Bump VERSION whenever you change any file so phones pick up the update.
const VERSION = 'clickscape-v7.3';
const FILES = ['./', 'index.html', 'style.css?v=7.3', 'data.js?v=7.3', 'data3.js?v=7.3', 'data4.js?v=7.3', 'icons.js?v=7.3', 'game.js?v=7.3', 'systems.js?v=7.3', 'ui3.js?v=7.3', 'ext4.js?v=7.3', 'ext5.js?v=7.3', 'ext6.js?v=7.3', 'ext7.js?v=7.3', 'ext8.js?v=7.3', 'ext9.js?v=7.3', 'ext10.js?v=7.3', 'ext11.js?v=7.3', 'ext12.js?v=7.3', 'ext13.js?v=7.3', 'ext14.js?v=7.3', 'ext15.js?v=7.3', 'ext16.js?v=7.3', 'ext17.js?v=7.3',
  'manifest.webmanifest?v=7.3', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];
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
