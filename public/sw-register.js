// Function to clear all caches
async function clearAllCaches() {
  console.log('Clearing all caches...');
  
  if ('caches' in window) {
    try {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map(key => {
        console.log('Deleting cache:', key);
        return caches.delete(key);
      }));
      console.log('All caches cleared successfully');
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  }
}

// Function to clear auth-related storage
function clearAuthStorage() {
  console.log('Clearing auth storage...');
  
  if (typeof window !== 'undefined') {
    // Clear all Supabase-related items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth'))) {
        console.log('Removing from localStorage:', key);
        localStorage.removeItem(key);
      }
    }
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth'))) {
        console.log('Removing from sessionStorage:', key);
        sessionStorage.removeItem(key);
      }
    }
    
    console.log('Auth storage cleared');
  }
}

// Function to unregister all service workers
async function unregisterServiceWorkers() {
  console.log('Unregistering service workers...');
  
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => {
        console.log('Unregistering service worker:', registration.scope);
        return registration.unregister();
      }));
      console.log('All service workers unregistered');
    } catch (error) {
      console.error('Error unregistering service workers:', error);
    }
  }
}

// Function to send message to service worker to clear caches
async function sendClearCacheMessage() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data && event.data.success) {
          console.log('Successfully cleared caches via service worker');
          resolve();
        } else {
          reject(new Error('Failed to clear caches via service worker'));
        }
      };
      
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHES'
      }, [messageChannel.port2]);
      
      // Set a timeout in case the service worker doesn't respond
      setTimeout(() => {
        resolve(); // Resolve anyway after timeout
      }, 1000);
    });
  }
  return Promise.resolve();
}

// Check if we're on an admin page or authentication-related page - more specific matching
const isAdminOrAuthPage = 
  window.location.pathname === '/admin' || 
  window.location.pathname === '/admin-login' ||
  window.location.pathname === '/login' ||
  window.location.pathname === '/signup' ||
  window.location.pathname === '/magic-link-login' ||
  window.location.pathname === '/reset-password' ||
  window.location.pathname === '/forgot-password' ||
  window.location.pathname.startsWith('/auth/');

// Check if we're specifically on an admin page - more specific matching
const isAdminPage = 
  window.location.pathname === '/admin' || 
  window.location.pathname === '/admin-login' ||
  window.location.pathname.startsWith('/admin/');

// Main initialization function
async function initializeServiceWorker() {
  console.log('Initializing service worker management...');
  
  // For admin pages, completely disable service worker
  if (isAdminPage) {
    console.log('On admin page - disabling service worker completely');
    
    // Set flags to prevent service worker registration
    localStorage.setItem('disableServiceWorker', 'true');
    sessionStorage.setItem('disableServiceWorker', 'true');
    
    // Unregister service workers first
    await unregisterServiceWorkers();
    
    // Then clear caches and storage
    await clearAuthStorage();
    await sendClearCacheMessage();
    await clearAllCaches();
    
    // Add event listener to prevent future service worker registration
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('Preventing service worker installation on admin page');
      e.preventDefault();
      return false;
    });
    
    return; // Don't register service worker on admin pages
  }
  
  // For auth pages, clear everything but still allow service worker for non-admin pages
  if (isAdminOrAuthPage) {
    console.log('On auth page - clearing all caches and storage');
    await clearAuthStorage();
    await sendClearCacheMessage();
    await clearAllCaches();
    // Don't unregister service workers for regular auth pages
  } 
  
  // For non-admin pages, register or update the service worker
  try {
    // Check if service worker is already registered
    const existingRegistrations = await navigator.serviceWorker.getRegistrations();
    
    if (existingRegistrations.length > 0) {
      // If already registered, just update it
      for (const registration of existingRegistrations) {
        try {
          await registration.update();
          console.log('Existing ServiceWorker updated:', registration.scope);
        } catch (updateError) {
          console.error('Error updating service worker:', updateError);
        }
      }
    } else {
      // Otherwise register a new one
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          updateViaCache: 'none', // Don't use cached versions of the service worker
          scope: '/'
        });
        console.log('ServiceWorker registration successful with scope:', registration.scope);
      } catch (registerError) {
        console.error('Error registering new service worker:', registerError);
      }
    }
    
    // Add navigation preload support for faster navigation
    if ('navigationPreload' in navigator.serviceWorker) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.navigationPreload) {
          await registration.navigationPreload.enable();
          console.log('Navigation preload enabled');
        }
      } catch (preloadError) {
        console.error('Error enabling navigation preload:', preloadError);
      }
    }
    
    // Clear auth storage anyway to be safe
    clearAuthStorage();
  } catch (error) {
    console.error('ServiceWorker management failed:', error);
    // Continue without service worker
    clearAuthStorage();
  }
}

// Run initialization when page loads
if ('serviceWorker' in navigator) {
  window.addEventListener('load', initializeServiceWorker);
}

// Also run immediately in case the page is already loaded
if (document.readyState === 'complete') {
  if ('serviceWorker' in navigator) {
    initializeServiceWorker();
  }
}