// Utility to clean old cached data and ensure fresh start
export function cleanOldCacheData(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  try {
    // List of cache keys that might contain demo-user references
    const keysToCheck = [
      'ducharkha_user_session',
      'vite-ui-theme',
      'ducharkha-ui-theme',
      // Add any other keys that might store user-specific data
    ];

    let foundOldData = false;

    keysToCheck.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value && value.includes('demo-user')) {
          console.log(`Removing old cached data from ${key}`);
          localStorage.removeItem(key);
          foundOldData = true;
        }
      } catch (error) {
        console.warn(`Failed to check key ${key}:`, error);
      }
    });

    // More aggressive cleanup for all localStorage keys
    try {
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        try {
          if (key.includes('react-query') || 
              key.includes('tanstack') || 
              key.includes('query-cache') ||
              key.startsWith('rq-') ||
              key.startsWith('tanstack-query-')) {
            const value = localStorage.getItem(key);
            if (value && (value.includes('demo-user') || value.includes('"demo-user"'))) {
              console.log(`Removing old query cache from ${key}`);
              localStorage.removeItem(key);
              foundOldData = true;
            }
          }
        } catch (error) {
          console.warn(`Failed to process key ${key}:`, error);
        }
      });
    } catch (error) {
      console.warn('Failed to iterate localStorage keys:', error);
    }

    if (foundOldData) {
      console.log('Old cached data cleaned up. Fresh session will be created.');
    }
  } catch (error) {
    console.warn('Failed to clean old cache data:', error);
  }
}

// Run cleanup on app startup
export function initializeCacheCleanup(): void {
  // Clean old data immediately
  cleanOldCacheData();

  // Also set up periodic cleanup
  if (typeof window !== 'undefined') {
    // Clean up old data every 24 hours
    const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    const lastCleanup = localStorage.getItem('last_cache_cleanup');
    const now = Date.now();
    
    if (!lastCleanup || (now - parseInt(lastCleanup)) > CLEANUP_INTERVAL) {
      cleanOldCacheData();
      localStorage.setItem('last_cache_cleanup', now.toString());
    }
  }
}