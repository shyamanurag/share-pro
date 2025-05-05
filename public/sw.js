const CACHE_NAME = 'tradepaper-india-v3';
const urlsToCache = [
  '/',
  '/dashboard',
  '/dashboard-india',
  '/login',
  '/signup',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Skip caching for any authentication, admin, or API related URLs
  if (
    event.request.url.includes('/admin') ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('/auth/') ||
    event.request.url.includes('admin-login') ||
    event.request.url.includes('/login') ||
    event.request.url.includes('/signup') ||
    event.request.url.includes('/magic-link-login') ||
    event.request.url.includes('/reset-password') ||
    event.request.url.includes('/forgot-password') ||
    // Add additional auth-related paths
    event.request.url.includes('supabase') ||
    event.request.url.includes('auth') ||
    // Skip caching for POST requests which are likely auth-related
    event.request.method === 'POST'
  ) {
    // Use no-cache for these requests to ensure fresh responses
    return event.respondWith(
      fetch(event.request, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    );
  }
  
  // For other requests, try the cache first
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // Don't cache API requests or authentication endpoints
                if (!event.request.url.includes('/api/') && 
                    !event.request.url.includes('/auth/') &&
                    !event.request.url.includes('/admin')) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});