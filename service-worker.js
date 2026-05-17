// Minimal service worker for app-shell offline support.
// We DO NOT cache Google API requests — those need a live network anyway,
// and caching them would be a security/freshness mess.

const CACHE = 'todo-shell-v10';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Pass through cross-origin APIs: no caching, no interception.
  if (url.host.includes('googleapis.com')
      || url.host.includes('accounts.google.com')
      || url.host.includes('openlibrary.org')) {
    return;
  }

  // Navigation requests: network-first, fall back to cached app shell.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Static assets: cache-first, with opportunistic refresh on success.
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const resp = await fetch(event.request);
      if (resp.ok && event.request.method === 'GET' && url.origin === self.location.origin) {
        const copy = resp.clone();
        const cache = await caches.open(CACHE);
        cache.put(event.request, copy);
      }
      return resp;
    } catch (e) {
      // Last-ditch: return cached navigation if any.
      const fallback = await caches.match('./index.html');
      return fallback || Response.error();
    }
  })());
});
