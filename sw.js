/* Pre-Sales Cockpit service worker — psc-v1.3.0-pro */
'use strict';

const CACHE_NAME = 'psc-v1.3.0-pro';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './favicon.svg',
  './apple-touch-icon.png',
  './pwa-192.png',
  './pwa-512.png',
  './pwa-maskable-512.png',
  './js/ui.js',
  './js/storage.js',
  './js/state.js',
  './js/defaults.js',
  './js/carteira-seed.js',
  './js/projects.js',
  './js/finance.js',
  './js/charts.js',
  './js/ops.js',
  './js/diretoria.js',
  './js/dashboard.js',
  './js/app.js',
  './data/PreSales_Cockpit_Carteira_Completa.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Only handle same-origin
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first, fallback to cache shell
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // App shell + data: cache-first with network update
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
