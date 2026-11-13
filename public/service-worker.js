// service-worker.js

const STATIC_CACHE_NAME = 'qran-top-static-v36'; // Version bump for seamless PWA update while keeping DATA_CACHE_NAME intact
const DATA_CACHE_NAME = 'qran-top-data-v23';

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

// The "app shell" - minimal files needed for the UI to render.
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

// Helper to safely cache URLs individually so a single network glitch does NOT abort installation
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
        console.warn(`[Service Worker] Resilient cache fetch failed for ${url}:`, err);
        throw err;
      }
    })
  );
  return results;
}

// Install event: cache static assets and core data safely without failing the entire SW
self.addEventListener('install', event => {
  if (IS_PREVIEW_HOST) {
    event.waitUntil(self.skipWaiting());
    return;
  }
  console.log('[Service Worker] Install');
  event.waitUntil(
    (async () => {
      await Promise.allSettled([
        cacheUrlsResiliently(STATIC_CACHE_NAME, STATIC_FILES_TO_CACHE),
        cacheUrlsResiliently(DATA_CACHE_NAME, CORE_DATA_URLS)
      ]);
      console.log('[Service Worker] Installation complete. Activating immediately.');
      return self.skipWaiting();
    })()
  );
});

// Activate event: clean up old static caches while preserving offline Quran & Mushaf data caches.
self.addEventListener('activate', event => {
  if (IS_PREVIEW_HOST) {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(
          keys.map(k => (k.includes('static') ? caches.delete(k) : Promise.resolve()))
        );
        await self.registration.unregister();
        const clientsList = await self.clients.matchAll({ type: 'window' });
        for (const client of clientsList) {
          if (client.url && 'navigate' in client) {
            client.navigate(client.url).catch(() => {});
          }
        }
      })()
    );
    return;
  }

  console.log('[Service Worker] Activate');
  const cacheWhitelist = [STATIC_CACHE_NAME, DATA_CACHE_NAME, 'qran-mushaf-v2-cache-v1'];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activation complete. Claiming clients.');
      return self.clients.claim();
    })
  );
});

// Fetch event: handle network requests with different strategies.
self.addEventListener('fetch', event => {
  if (IS_PREVIEW_HOST) {
    return;
  }

  const { request } = event;

  if (!request.url.startsWith('http')) {
    return;
  }

  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  // Never intercept AI Studio auth tokens, cookie checks, version.json, or Vite internal endpoints
  if (
    url.pathname.endsWith('/version.json') ||
    url.pathname.endsWith('/service-worker.js') ||
    url.searchParams.has('__aistudio_auth_token') ||
    url.searchParams.has('__storage_access_granted') ||
    url.pathname.startsWith('/__') ||
    url.pathname.startsWith('/_aistudio') ||
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return;
  }

  if (url.hostname.includes('firebase')) {
    return;
  }
  if (url.hostname.includes('workers.dev') || url.pathname.startsWith('/api')) {
    return; // Pass directly to network for real-time live khatmah data
  }
  if (url.hostname.includes('googleapis.com') && !url.hostname.includes('fonts.googleapis.com') && !url.hostname.includes('storage.googleapis.com')) {
    return;
  }

  // Strategy 1: Network First (bypassing browser HTTP cache via cache: 'no-cache') for App Shell HTML/JS/CSS
  // so installed PWAs always get the newest deployment when online, and instantly use cache when offline.
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
          return caches.match(request).then(cached => {
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

  // Strategy 2: Stale-While-Revalidate for API calls and Quran data.
  if (
    url.hostname === 'storage.googleapis.com' ||
    url.hostname === 'api.alquran.cloud' ||
    url.hostname === 'api.quran.com' ||
    url.hostname === 'cdn.jsdelivr.net' ||
    url.hostname === 'everyayah.com' ||
    url.hostname === 'cdn.islamic.network' ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('verses.quran.foundation') ||
    url.hostname.includes('fonts.quran.com')
  ) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          const fetchPromise = fetch(request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {});

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Strategy 3: Cache First for other static assets (fonts, images, icons).
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

// Listen for a message from the client to activate the new service worker immediately.
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
