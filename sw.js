const ASSET_VERSION = '20260415v3';
const CACHE_NAME = 'tooliest-v23-offline';
const GOOGLE_FONTS_STYLESHEET = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/category/text',
  '/category/seo',
  '/category/css',
  '/category/color',
  '/category/image',
  '/category/json',
  '/category/html',
  '/category/javascript',
  '/category/converter',
  '/category/encoding',
  '/category/finance',
  '/category/math',
  '/category/social',
  '/category/privacy',
  '/category/ai',
  '/category/developer',
  '/manifest.json',
  `/css/styles.min.css?v=${ASSET_VERSION}`,
  `/bundle.min.js?v=${ASSET_VERSION}`,
  `/js/consent.js?v=${ASSET_VERSION}`,
  '/social-card.jpg',
  '/favicon.svg',
  '/favicon-48.png',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
];

async function warmGoogleFontsCache(cache) {
  try {
    const response = await fetch(GOOGLE_FONTS_STYLESHEET, { mode: 'cors' });
    if (!response.ok) return;

    await cache.put(GOOGLE_FONTS_STYLESHEET, response.clone());
    const cssText = await response.text();
    const fontUrls = cssText.match(/https:\/\/fonts\.gstatic\.com\/[^)"'\s]+/g) || [];

    await Promise.all(fontUrls.map(async (fontUrl) => {
      try {
        const fontResponse = await fetch(fontUrl, { mode: 'cors' });
        if (fontResponse.ok || fontResponse.type === 'opaque') {
          await cache.put(fontUrl, fontResponse);
        }
      } catch (error) {
        console.warn('[Service Worker] Failed to warm font cache:', fontUrl, error);
      }
    }));
  } catch (error) {
    console.warn('[Service Worker] Failed to cache Google Fonts stylesheet.', error);
  }
}

// Install Event: Cache all critical files
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(URLS_TO_CACHE);
    await warmGoogleFontsCache(cache);
  })());
});

// Activate Event: Clean up old caches and notify clients to reload
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName !== CACHE_NAME) {
          return caches.delete(cacheName);
        }
        return Promise.resolve();
      })
    );

    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'SW_UPDATED' });
    });
  })());

  return self.clients.claim();
});

// Fetch Event: Stale-While-Revalidate with navigation fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const legacyToolMatch = requestUrl.pathname.match(/^\/tool\/([^/]+)\/?$/);
  if (event.request.mode === 'navigate' && legacyToolMatch) {
    requestUrl.pathname = `/${legacyToolMatch[1]}`;
    event.respondWith(Promise.resolve(Response.redirect(requestUrl.toString(), 301)));
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(event.request);

    const fetchPromise = fetch(event.request)
      .then(async (networkResponse) => {
        if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
          await cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      });

    if (cachedResponse) {
      fetchPromise.catch(() => {}); // Suppress unhandled rejection for background revalidation
      return cachedResponse;
    }

    try {
      return await fetchPromise;
    } catch (error) {
      if (event.request.mode === 'navigate') {
        return cache.match('/') || cache.match('/index.html');
      }

      throw error;
    }
  })());
});
