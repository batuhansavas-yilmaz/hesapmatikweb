const CACHE_NAME = 'hesapmatik-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon.png',
  './icon-180.png',
  './icon-192.png',
  './assets/aquarium.png',
  './assets/car.png',
  './assets/commission.png',
  './assets/github.png',
  './assets/horse-power.png',
  './assets/love.png',
  './assets/percentage.png',
  './assets/petrol.png',
  './assets/yuzde.png',
  './assets/zraporu.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(APP_SHELL.map((url) =>
      cache.add(url).catch(() => {})
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(APP_SHELL.map((url) =>
      cache.match(url).then((hit) => hit || cache.add(url).catch(() => {}))
    ));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cached = await caches.match('./index.html');
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put('./index.html', response.clone());
        }
        return response;
      } catch (e) {
        return (await caches.match('./')) || new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    })());
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
