/* sw.js — SolarCalc PH Service Worker
 * Cache-first for local app assets; network-first for CDN resources.
 * Bump CACHE_NAME version whenever any cached file changes.
 */

const CACHE_NAME = 'solarcalc-ph-v3';
const RUNTIME_CACHE = 'solarcalc-runtime-v3';

const APP_ASSETS = [
  '/solar-roi-calculator/',
  '/solar-roi-calculator/index.html',
  '/solar-roi-calculator/sunhours.html',
  '/solar-roi-calculator/manifest.json',
  '/solar-roi-calculator/css/themes.css',
  '/solar-roi-calculator/js/app.js',
  '/solar-roi-calculator/js/state.js',
  '/solar-roi-calculator/js/calc.js',
  '/solar-roi-calculator/js/ui.js',
  '/solar-roi-calculator/js/format.js',
  '/solar-roi-calculator/js/narrative.js',
  '/solar-roi-calculator/js/specs.js',
  '/solar-roi-calculator/js/packages.js',
];

/* ── Install: pre-cache all local app assets ── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: clean up old caches ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch: cache-first for local assets, network-first for CDN ── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Local app assets — cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request)
        .then((cached) => cached || fetchAndCache(request, CACHE_NAME))
        .catch(() => caches.match('/solar-roi-calculator/index.html'))
    );
    return;
  }

  // External CDN (Tailwind, Google Fonts) — network-first, fallback to cache
  if (
    url.hostname.includes('cdn.tailwindcss.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});

/* ── Helper: fetch and store in cache ── */
function fetchAndCache(request, cacheName) {
  return fetch(request).then((response) => {
    if (response.ok) {
      const clone = response.clone();
      caches.open(cacheName).then((cache) => cache.put(request, clone));
    }
    return response;
  });
}
