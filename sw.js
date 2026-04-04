const CACHE_NAME = 'tooliest-v7-offline';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './about.html',
  './contact.html',
  './privacy.html',
  './terms.html',
  './manifest.json',
  './css/styles.css',
  './bundle.min.js'
];

// Install Event: Cache all critical files
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching all files for offline use');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event: Stale-While-Revalidate Strategy
// This serves the cached file immediately for instant load speeds, 
// then fetches the fresh version in the background to update the cache for the NEXT load.
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache the new response for future
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch((e) => {
        // If fetch fails (completely offline) and we don't have it in cache,
        // we can't do much, but since we aggressively inject all core logic locally,
        // this shouldn't normally happen for app shells.
        console.warn('[Service Worker] Fetch failed, serving offline cache.');
      });

      // Return cached version immediately if available, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
