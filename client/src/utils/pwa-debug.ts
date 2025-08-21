// PWA Debug utilities
export function debugPWAStatus() {
  console.log('=== PWA DEBUG INFO ===');
  
  // Check service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      console.log('Service Workers:', registrations.length);
      registrations.forEach((reg, index) => {
        console.log(`SW ${index}:`, {
          scope: reg.scope,
          state: reg.active?.state,
          hasUpdateHandler: !!reg.onupdatefound
        });
      });
    });
  } else {
    console.log('Service Worker: Not supported');
  }
  
  // Check manifest
  const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  if (manifestLink) {
    fetch(manifestLink.href)
      .then(response => response.json())
      .then(manifest => {
        console.log('Manifest:', manifest);
        console.log('Display mode:', manifest.display);
        console.log('Icons:', manifest.icons?.length || 0);
      })
      .catch(err => console.error('Manifest error:', err));
  } else {
    console.log('Manifest: Not found');
  }
  
  // Check display mode
  const displayMode = window.matchMedia('(display-mode: standalone)').matches ? 'standalone' :
                     window.matchMedia('(display-mode: fullscreen)').matches ? 'fullscreen' :
                     window.matchMedia('(display-mode: minimal-ui)').matches ? 'minimal-ui' : 'browser';
  console.log('Current display mode:', displayMode);
  
  // Check if beforeinstallprompt is supported
  let installPromptSupported = false;
  const handleInstallPrompt = () => {
    installPromptSupported = true;
    console.log('beforeinstallprompt event fired - PWA is installable!');
  };
  window.addEventListener('beforeinstallprompt', handleInstallPrompt);
  
  const timeoutId = setTimeout(() => {
    if (!installPromptSupported) {
      console.log('beforeinstallprompt: Not fired (may already be installed or not installable)');
    }
    // Cleanup event listener after check
    window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, 2000);
  
  // Check HTTPS
  console.log('Protocol:', location.protocol);
  console.log('Is HTTPS:', location.protocol === 'https:');
  
  console.log('=== END PWA DEBUG ===');
  
  // Return cleanup function
  return () => {
    clearTimeout(timeoutId);
    window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  };
}

// Auto-run debug in development
if (typeof window !== 'undefined') {
  let cleanupFn: (() => void) | null = null;
  const timeoutId = setTimeout(() => {
    cleanupFn = debugPWAStatus();
  }, 1000);
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    clearTimeout(timeoutId);
    if (cleanupFn) cleanupFn();
  });
}