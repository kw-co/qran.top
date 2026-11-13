// service-worker.js

const STATIC_CACHE_NAME = 'qran-top-static-v37'; // Auto-stamped on every build by vite.config.ts
const DATA_CACHE_NAME = 'qran-top-data-v23'; // Persistent cache for Quran texts & Mushaf fonts (never deleted on UI updates)

const IS_PREVIEW_HOST =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname.endsWith('.run.app') ||
  self.location.hostname.endsWith('.googleusercontent.com');

// Core data files that are essential for the app to work offline.
const CORE_DATA_URLS = [
  'https://api.alquran.cloud/v1/quran/quran-simple-clean',
  'https://api.alquran.cloud/v1/quran/quran-uthmani-quran-academy',
];

// Minimal offline fallback shell
const STATIC_FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192x192.png',
  './icon-512x512.png',
  './icon-maskable-512x512.png',
  './apple-touch-icon.png'
];

async function cacheUrlsResiliently(cacheName, urls) {
  const cache = await caches.open(cacheName);
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      try {
        const req = new Request(url, { cache: 'reload' });
        const res = await fetch(req);
        if (res && res.status === 200) {
          await cache.put(req, res);
          return url;
        }
        throw new Error(`Status ${res ? res.status : 'unknown'}`);
      } catch (err) {
        throw err;
      }
    })
  );
  return results;
}

self.addEventListener('install', event => {
  if (IS_PREVIEW_HOST) {
    event.waitUntil(self.skipWaiting());
    return;
  }
  event.waitUntil(
    (async () => {
      await Promise.allSettled([
        cacheUrlsResiliently(STATIC_CACHE_NAME, STATIC_FILES_TO_CACHE),
        cacheUrlsResiliently(DATA_CACHE_NAME, CORE_DATA_URLS)
      ]);
      return self.skipWaiting();
    })()
  );
});

// Activate event: delete old UI static caches while strictly preserving Quran data & Mushaf font caches.
self.addEventListener('activate', event => {
  if (IS_PREVIEW_HOST) {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(
          keys.map(k => (k.includes('static') ? caches.delete(k) : Promise.resolve()))
        );
        await self.registration.unregister();
      })()
    );
    return;
  }

  const cacheWhitelist = [STATIC_CACHE_NAME, DATA_CACHE_NAME, 'qran-mushaf-v2-cache-v1'];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          const isPersistentDataOrFont =
            cacheWhitelist.indexOf(cacheName) !== -1 ||
            cacheName.includes('data') ||
            cacheName.includes('mushaf') ||
            cacheName.includes('font');
          if (!isPersistentDataOrFont) {
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (IS_PREVIEW_HOST) {
    return;
  }

  const { request } = event;
  if (!request.url.startsWith('http') || request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Never intercept version.json, service-worker.js, or internal/live APIs
  if (
    url.pathname.endsWith('/version.json') ||
    url.pathname.endsWith('/service-worker.js') ||
    url.searchParams.has('__aistudio_auth_token') ||
    url.searchParams.has('__storage_access_granted') ||
    url.pathname.startsWith('/__') ||
    url.pathname.startsWith('/_aistudio') ||
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/node_modules/') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('workers.dev') ||
    url.pathname.startsWith('/api')
  ) {
    return;
  }

  // Strategy 1 (Persistent Offline Cache First): Quran Data, Mushaf Page Fonts (.woff2), & Web Fonts
  // These are NEVER deleted during app UI updates and load in 0ms offline.
  const isQuranDataOrFont =
    url.pathname.includes('/fonts/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ttf') ||
    url.hostname === 'storage.googleapis.com' ||
    url.hostname === 'api.alquran.cloud' ||
    url.hostname === 'api.quran.com' ||
    url.hostname === 'cdn.jsdelivr.net' ||
    url.hostname === 'everyayah.com' ||
    url.hostname === 'cdn.islamic.network' ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('verses.quran.foundation') ||
    url.hostname.includes('fonts.quran.com');

  if (isQuranDataOrFont) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Strategy 2 (Network First with Offline Fallback): App Shell, UI Components, and Tools (.html, .js, .css)
  // Always fetches fresh UI code when online (bypassing HTTP disk cache) and falls back to STATIC_CACHE_NAME when offline.
  const isAppShellFile =
    request.mode === 'navigate' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.jsx') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('manifest.json');

  if (isAppShellFile) {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .then(networkResponse => {
          if (
            networkResponse &&
            (networkResponse.type === 'opaqueredirect' ||
              networkResponse.redirected ||
              (networkResponse.status >= 300 && networkResponse.status < 400 && networkResponse.status !== 304))
          ) {
            return networkResponse;
          }
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
            return networkResponse;
          }
          return caches.match(request).then(cached => cached || networkResponse);
        })
        .catch(() => {
          // Offline fallback: serve cached UI shell immediately
          return caches.match(request, { ignoreSearch: true }).then(cached => {
            if (cached) return cached;
            if (request.mode === 'navigate' || request.destination === 'document') {
              return caches.match('./index.html').then(htmlCached => htmlCached || caches.match('./'));
            }
            return new Response('', { status: 503, statusText: 'Offline' });
          });
        })
    );
    return;
  }

  // Strategy 3: Other static assets (icons, images)
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      return (
        cachedResponse ||
        fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
            return networkResponse;
          }
          return networkResponse;
        })
      );
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
