// Clickscape service worker — keeps the game playable offline.
// Bump VERSION whenever you change any file so phones pick up the update.
const VERSION = 'clickscape-v11.99';
const FILES = ['./', 'index.html', 'style.css?v=11.99', 'app.js?v=11.99', 'manifest.webmanifest?v=11.99', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).catch(() => { })); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Versioned files (?v=…) never change, so serve them from the cache instantly; everything else (the page itself) is network-first.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url); if (url.origin !== location.origin) return;
  if (url.searchParams.has('v') || url.searchParams.has('h')) {
    // only a good response is ever cached; on a miss the network is asked directly ('reload'), never the browser's own
    // cache, so a "not found" saved while files were still uploading can't come back
    e.respondWith(caches.match(e.request).then(m => (m && m.ok) ? m : fetch(e.request, { cache: 'reload' }).then(r => { if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); } return r; })));
    return;
  }
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); } return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: false }).then(m => m || caches.match(e.request, { ignoreSearch: true }))));
});
