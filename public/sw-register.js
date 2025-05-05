if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    // Check if we're on an admin page
    const isAdminPage = window.location.pathname.includes('/admin') || 
                        window.location.pathname.includes('/admin-login');
    
    if (isAdminPage) {
      // For admin pages, unregister any existing service workers to prevent caching issues
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
          console.log('ServiceWorker unregistered for admin page');
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