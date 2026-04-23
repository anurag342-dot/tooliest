const ASSET_VERSION = '20260423v38';
// [TOOLIEST AUDIT] Tie the offline cache name to the asset version so old release caches are purged automatically.
const CACHE_NAME = `tooliest-${ASSET_VERSION}-offline`;
const GOOGLE_FONTS_STYLESHEET = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400&display=swap&subset=latin';
const TOOL_ROUTES = [
  '/word-counter',
  '/character-counter',
  '/case-converter',
  '/lorem-ipsum',
  '/text-reverser',
  '/remove-duplicates',
  '/slug-generator',
  '/string-encoder',
  '/meta-tag-generator',
  '/sitemap-generator',
  '/robots-txt-generator',
  '/og-preview',
  '/schema-generator',
  '/keyword-density',
  '/css-minifier',
  '/css-beautifier',
  '/gradient-generator',
  '/box-shadow-generator',
  '/flexbox-playground',
  '/css-animation-generator',
  '/color-picker',
  '/palette-generator',
  '/contrast-checker',
  '/hex-to-rgb',
  '/color-blindness-sim',
  '/image-compressor',
  '/image-resizer',
  '/image-cropper',
  '/image-to-base64',
  '/base64-to-image',
  '/image-converter',
  '/qr-code-generator',
  '/pdf-merger',
  '/pdf-splitter',
  '/pdf-compressor',
  '/pdf-rotate',
  '/pdf-reorder',
  '/pdf-extract',
  '/pdf-delete-pages',
  '/pdf-watermark',
  '/pdf-page-numbers',
  '/pdf-protect',
  '/pdf-to-images',
  '/images-to-pdf',
  '/text-to-pdf',
  '/pdf-to-text',
  '/json-formatter',
  '/json-validator',
  '/json-to-csv',
  '/csv-to-json',
  '/json-minifier',
  '/html-minifier',
  '/html-beautifier',
  '/html-entity-encoder',
  '/html-table-generator',
  '/markdown-to-html',
  '/js-minifier',
  '/js-beautifier',
  '/regex-tester',
  '/js-obfuscator',
  '/unit-converter',
  '/temperature-converter',
  '/number-base-converter',
  '/timezone-converter',
  '/base64-encoder',
  '/url-encoder',
  '/jwt-decoder',
  '/hash-generator',
  '/percentage-calculator',
  '/age-calculator',
  '/bmi-calculator',
  '/tip-calculator',
  '/twitter-counter',
  '/instagram-caption',
  '/hashtag-generator',
  '/youtube-thumbnail',
  '/password-security-suite',
  '/uuid-generator',
  '/fake-data-generator',
  '/image-exif-stripper',
  '/ai-text-summarizer',
  '/ai-paraphraser',
  '/ai-email-writer',
  '/ai-blog-ideas',
  '/ai-meta-writer',
  '/cron-parser',
  '/diff-checker',
  '/sql-formatter',
  '/chmod-calculator',
  '/loan-mortgage-analyzer',
  '/compound-interest',
  '/sip-calculator',
  '/retirement-calculator',
  '/roi-calculator',
  '/debt-payoff',
  '/audio-converter',
  '/inflation-calculator',
];
const URLS_TO_CACHE = [
  '/',
  '/?source=pwa',
  '/index.html',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/word-counter?source=pwa-shortcut',
  '/json-formatter?source=pwa-shortcut',
  '/color-picker?source=pwa-shortcut',
  '/software',
  '/category/text',
  '/category/seo',
  '/category/css',
  '/category/color',
  '/category/image',
  '/category/pdf',
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
  ...TOOL_ROUTES,
  '/manifest.json',
  `/css/styles3.min.css?v=${ASSET_VERSION}`,
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

// Fetch Event: Network-first for HTML navigations, stale-while-revalidate for assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const legacyToolMatch = requestUrl.pathname.match(/^\/tool\/([^/]+)\/?$/);
  if (event.request.mode === 'navigate' && legacyToolMatch) {
    requestUrl.pathname = `/${legacyToolMatch[1]}`;
    event.respondWith(Promise.resolve(Response.redirect(requestUrl.toString(), 301)));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
          await cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        const cachedNavigation = await cache.match(event.request);
        if (cachedNavigation) {
          return cachedNavigation;
        }

        return cache.match('/') || cache.match('/index.html');
      }
    })());
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
      throw error;
    }
  })());
});
