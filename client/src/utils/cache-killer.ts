// Cache killing utilities for development

export function clearAllCaches(): Promise<void> {
  return new Promise((resolve) => {
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        Promise.all(
          cacheNames.map(cacheName => {
            console.log('🗑️ Удаляем кэш:', cacheName);
            return caches.delete(cacheName);
          })
        ).then(() => {
          console.log('✅ Все кэши очищены');
          resolve();
        }).catch(() => resolve());
      }).catch(() => resolve());
    } else {
      resolve();
    }
  });
}

export function unregisterAllServiceWorkers(): Promise<void> {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        Promise.all(
          registrations.map(registration => {
            console.log('🗑️ Отключаем Service Worker:', registration.scope);
            return registration.unregister();
          })
        ).then(() => {
          console.log('✅ Все Service Worker отключены');
          resolve();
        }).catch(() => resolve());
      }).catch(() => resolve());
    } else {
      resolve();
    }
  });
}

export function forceReload(): void {
  // Принудительная перезагрузка с очисткой кэша
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'FORCE_UPDATE' });
  }
  
  // Очищаем localStorage для принудительного обновления
  const currentVersion = Date.now();
  localStorage.setItem('app-version', currentVersion.toString());
  
  // Перезагрузка с обходом кэша
  window.location.reload();
}

// Проверка версии приложения для принудительного обновления
export function checkAppVersion(): boolean {
  const APP_VERSION = '1.0.0'; // Обновляйте при деплое
  const storedVersion = localStorage.getItem('app-version');
  
  if (!storedVersion || storedVersion !== APP_VERSION) {
    localStorage.setItem('app-version', APP_VERSION);
    return true; // Требуется обновление
  }
  
  return false;
}