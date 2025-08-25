// Force refresh utility to clear all cached data
export function forceRefreshApp(): void {
  if (typeof window === 'undefined') return;

  try {
    // Clear all localStorage
    localStorage.clear();
    
    // Clear all sessionStorage
    sessionStorage.clear();
    
    // Clear React Query cache if it exists
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName);
        });
      });
    }

    console.log('All cached data cleared. Refreshing app...');
    
    // Hard refresh the page
    window.location.reload();
  } catch (error) {
    console.warn('Error during force refresh:', error);
    window.location.reload();
  }
}

// Add debug utility for development
export function debugUserSession(): void {
  if (typeof window === 'undefined') return;

  const sessionData = localStorage.getItem('ducharkha_user_session');
  console.log('Session data exists:', !!sessionData);
  
  const localStorageKeys = Object.keys(localStorage);
  console.log('localStorage keys count:', localStorageKeys.length);
}

// Auto-clear on app load if demo-user detected
export function autoFixDemoUser(): void {
  if (typeof window === 'undefined') return;

  try {
    let shouldRefresh = false;
    
    // Check localStorage for demo-user references
    const sessionData = localStorage.getItem('ducharkha_user_session');
    if (sessionData && sessionData.includes('demo-user')) {
      console.warn('Demo-user session detected in localStorage, clearing...');
      localStorage.removeItem('ducharkha_user_session');
      shouldRefresh = true;
    }

    // Clear any other demo-user related data
    Object.keys(localStorage).forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value && value.includes('demo-user')) {
          console.log('Clearing demo-user data (key hidden for security)');
          localStorage.removeItem(key);
          shouldRefresh = true;
        }
      } catch (error) {
        console.warn(`Failed to check/clear ${key}:`, error);
      }
    });

    // Clear service worker cache if present
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          if (cacheName.includes('demo-user') || cacheName.includes('workbox')) {
            console.log(`Clearing cache: ${cacheName}`);
            caches.delete(cacheName);
          }
        });
      }).catch(error => {
        console.warn('Failed to clear caches:', error);
      });
    }

    // Clear IndexedDB if present
    if ('indexedDB' in window) {
      try {
        // Try to delete common React Query cache databases
        indexedDB.deleteDatabase('keyval-store');
        indexedDB.deleteDatabase('react-query-cache');
        indexedDB.deleteDatabase('tanstack-query-cache');
      } catch (error) {
        console.warn('Failed to clear IndexedDB:', error);
      }
    }

    if (shouldRefresh) {
      console.log('Demo-user data found and cleared, refreshing page...');
      // Use replace to avoid back button issues
      window.location.replace(window.location.href);
    }
  } catch (error) {
    console.warn('Error during demo-user cleanup:', error);
  }
}