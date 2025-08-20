// PWA utility functions

// Check if app is running in standalone mode
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}

// Check if PWA is installable
export function isPWAInstallable(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Get PWA display mode
export function getPWADisplayMode(): string {
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  return 'browser';
}

// Add to home screen analytics
export function trackA2HSEvent(action: 'prompt_shown' | 'prompt_accepted' | 'prompt_dismissed'): void {
  // Analytics tracking for PWA install events
  console.log(`A2HS Event: ${action}`);
  // Here you would send analytics to your preferred service
}

// Check if app was launched from home screen
export function isLaunchedFromHomeScreen(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('source') === 'a2hs';
}