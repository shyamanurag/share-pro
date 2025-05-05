if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    // Check if we're on an admin page or authentication-related page
    const isAdminOrAuthPage = window.location.pathname.includes('/admin') || 
                             window.location.pathname.includes('/admin-login') ||
                             window.location.pathname.includes('/login') ||
                             window.location.pathname.includes('/signup') ||
                             window.location.pathname.includes('/magic-link-login') ||
                             window.location.pathname.includes('/reset-password') ||
                             window.location.pathname.includes('/forgot-password');
    
    if (isAdminOrAuthPage) {
      // For admin pages, unregister any existing service workers to prevent caching issues
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
          console.log('ServiceWorker unregistered for admin/auth page');
        }
      });
    } else {
      // For non-admin pages, register the service worker
      navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none' // Don't use cached versions of the service worker
      }).then(function(registration) {
        // Check for updates on each page load
        registration.update();
        
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(err) {
        console.log('ServiceWorker registration failed: ', err);
      });
    }
  });
}