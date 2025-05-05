// Immediately clear ALL caches on page load
if ('caches' in window) {
  caches.keys().then(function(cacheNames) {
    cacheNames.forEach(function(cacheName) {
      console.log('Deleting cache:', cacheName);
      caches.delete(cacheName);
    });
  });
}

// Clear localStorage and sessionStorage
if (typeof window !== 'undefined') {
  // Only clear auth-related items to preserve other settings
  localStorage.removeItem('supabase.auth.token');
  sessionStorage.removeItem('supabase.auth.token');
  console.log('Cleared auth tokens from storage');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    // Check if we're on an admin page or authentication-related page
    const isAdminOrAuthPage = window.location.pathname.includes('/admin') || 
                             window.location.pathname.includes('/admin-login') ||
                             window.location.pathname.includes('/login') ||
                             window.location.pathname.includes('/signup') ||
                             window.location.pathname.includes('/magic-link-login') ||
                             window.location.pathname.includes('/reset-password') ||
                             window.location.pathname.includes('/forgot-password') ||
                             window.location.pathname.includes('/auth/');
    
    // Always unregister service workers on auth pages
    if (isAdminOrAuthPage) {
      // For admin/auth pages, aggressively unregister any existing service workers
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
          console.log('ServiceWorker unregistered for admin/auth page');
        }
        
        // Also clear any localStorage auth data on auth pages
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.removeItem('supabase.auth.token');
          console.log('Cleared auth tokens from storage');
        }
      });
    } else {
      // For non-admin pages, register the service worker
      navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none', // Don't use cached versions of the service worker
        scope: '/'
      }).then(function(registration) {
        // Force update on each page load
        registration.update();
        
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(err) {
        console.log('ServiceWorker registration failed: ', err);
      });
    }
  });
}