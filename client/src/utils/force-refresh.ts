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
  console.log('Current session data:', sessionData);
  
  const allLocalStorage = {...localStorage};
  console.log('All localStorage data:', allLocalStorage);
}

// Auto-clear on app load if demo-user detected
export function autoFixDemoUser(): void {
  if (typeof window === 'undefined') return;

  try {
    const sessionData = localStorage.getItem('ducharkha_user_session');
    if (sessionData && sessionData.includes('demo-user')) {
      console.warn('Demo-user session detected in localStorage, clearing...');
      localStorage.removeItem('ducharkha_user_session');
      
      // Also clear any other demo-user related data
      Object.keys(localStorage).forEach(key => {
        const value = localStorage.getItem(key);
        if (value && value.includes('demo-user')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('Demo-user data cleared, page will refresh');
      window.location.reload();
    }
  } catch (error) {
    console.warn('Error during demo-user cleanup:', error);
  }
}