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

// Check if we're on an admin page or authentication-related page
const isAdminOrAuthPage = 
  window.location.pathname.includes('/admin') || 
  window.location.pathname.includes('/admin-login') ||
  window.location.pathname.includes('/login') ||
  window.location.pathname.includes('/signup') ||
  window.location.pathname.includes('/magic-link-login') ||
  window.location.pathname.includes('/reset-password') ||
  window.location.pathname.includes('/forgot-password') ||
  window.location.pathname.includes('/auth/');

// Main initialization function
async function initializeServiceWorker() {
  console.log('Initializing service worker management...');
  
  // For auth pages, always clear everything
  if (isAdminOrAuthPage) {
    console.log('On auth/admin page - clearing all caches and storage');
    await clearAuthStorage();
    await sendClearCacheMessage();
    await clearAllCaches();
    await unregisterServiceWorkers();
  } else {
    // For non-admin pages, register or update the service worker
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none', // Don't use cached versions of the service worker
        scope: '/'
      });
      
      // Force update on each page load
      await registration.update();
      console.log('ServiceWorker registration successful with scope:', registration.scope);
      
      // Clear auth storage anyway to be safe
      clearAuthStorage();
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
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