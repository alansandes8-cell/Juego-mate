/* Service worker: red primero, caché como respaldo (para jugar offline) */
const CACHE = 'mate-perfecto-v3';
const FILES = ['./', 'index.html', 'style.css', 'manifest.webmanifest', 'icon.svg', 'icon-512.png',
  'fonts/lilita-one-latin.woff2', 'fonts/lilita-one-latin-ext.woff2', 'fonts/nunito-latin.woff2', 'fonts/nunito-latin-ext.woff2',
  'js/config.js', 'js/gfx.js', 'js/audio.js', 'js/data.js', 'js/economy.js', 'js/ads.js',
  'js/game.js', 'js/truco.js', 'js/mini.js', 'js/shop.js', 'js/main.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r.ok && new URL(e.request.url).origin === location.origin) {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
