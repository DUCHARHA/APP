import { useEffect, useState } from 'react';
import { Shield, Wifi, WifiOff } from 'lucide-react';

export function PWAStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isServiceWorkerActive, setIsServiceWorkerActive] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                     (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        setIsServiceWorkerActive(!!registration?.active);
      });
    }

    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Only show status in development or when offline
  if (!(!isOnline || !isStandalone || !isServiceWorkerActive)) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white text-xs p-2 flex items-center justify-center gap-2">
      {!isOnline && (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Offline режим</span>
        </>
      )}
      {isOnline && (
        <>
          <Wifi className="w-4 h-4" />
          <span>Online</span>
        </>
      )}
      {isServiceWorkerActive && <Shield className="w-3 h-3 text-green-400" />}
      {isStandalone && <span className="text-green-400">PWA</span>}
    </div>
  );
}