const CACHE_NAME = 'tradepaper-india-v5';
const urlsToCache = [
  '/',
  '/dashboard',
  '/dashboard-india',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// List of paths that should never be cached
const neverCachePaths = [
  '/admin',
  '/admin-login',
  '/login',
  '/signup',
  '/magic-link-login',
  '/reset-password',
  '/forgot-password',
  '/auth/',
  '/api/',
  '/_next/data/', // Next.js data requests
  '/_next/static/', // Next.js static files
  'supabase',
  'auth'
];

// List of paths that should always be network-first
const networkFirstPaths = [
  '/',
  '/dashboard',
  '/dashboard-india',
  '/portfolio',
  '/profile',
  '/watchlist'
];

// Check if a URL should be excluded from caching
function shouldExcludeFromCache(url) {
  const urlObj = new URL(url);
  return neverCachePaths.some(path => urlObj.pathname.includes(path)) || 
         urlObj.search.includes('t=') || // URLs with timestamp parameter
         urlObj.pathname.endsWith('.js') || // JavaScript files
         urlObj.pathname.endsWith('.json'); // JSON files
}

// Check if a URL should use network-first strategy
function shouldUseNetworkFirst(url) {
  const urlObj = new URL(url);
  return networkFirstPaths.some(path => urlObj.pathname === path);
}

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing new cache: ' + CACHE_NAME);
  self.skipWaiting(); // Force activation
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Skip handling for non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip caching for authentication, admin, or API related URLs
  if (shouldExcludeFromCache(event.request.url)) {
    console.log('[Service Worker] Bypassing cache for:', event.request.url);
    return event.respondWith(
      fetch(event.request, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }).catch(error => {
        console.error('[Service Worker] Fetch error:', error);
        throw error;
      })
    );
  }
  
  // For navigation requests to main routes, use network-first strategy
  if (shouldUseNetworkFirst(event.request.url)) {
    console.log('[Service Worker] Using network-first for:', event.request.url);
    return event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the response for future use
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(error => {
          console.log('[Service Worker] Network request failed, falling back to cache for:', event.request.url);
          return caches.match(event.request);
        })
    );
  }
  
  // For other requests, try the cache first (cache-first strategy)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request - a request is a stream and can only be consumed once
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(
          (response) => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response - a response is a stream and can only be consumed once
            const responseToCache = response.clone();

            // Don't cache if URL should be excluded
            if (!shouldExcludeFromCache(event.request.url)) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating new service worker');
  
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[Service Worker] Deleting cache by request:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('[Service Worker] All caches cleared by request');
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })
    );
  }
});