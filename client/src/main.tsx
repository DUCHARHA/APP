import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { statusBarManager } from "./utils/status-bar-manager";
import { PWADetector } from "./utils/pwa-detection";
import { initializeGlobalErrorHandler } from "./utils/global-error-handler";

// Security: Disable console logs in production to prevent data leaks
if (import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  // console.error and console.warn are kept for debugging critical issues
}

// Initialize global error handler for catching unhandled errors
initializeGlobalErrorHandler();

// Initialize IndexedDB lazily to improve initial load time
if (typeof window !== 'undefined') {
  import("./lib/indexeddb").then(({ indexedDBService }) => {
    indexedDBService.init().catch(console.error);
  });
}

// Умная очистка только устаревших кэшей (версионированная)
async function cleanupOldCaches() {
  try {
    const APP_CACHE_VERSION = 'v2';
    const APP_CACHE_PREFIX = 'ducharha-';
    
    // 1. Очистка только старых версий наших кэшей
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      // Удаляем только старые версии наших кэшей, не все кэши
      const oldCaches = cacheNames.filter(name => 
        name.startsWith(APP_CACHE_PREFIX) && 
        !name.includes(APP_CACHE_VERSION)
      );
      
      if (oldCaches.length > 0) {
        await Promise.all(oldCaches.map(name => caches.delete(name)));
        console.log(`✅ Очищено ${oldCaches.length} устаревших кэшей`);
      } else {
        console.log('✅ Нет устаревших кэшей для очистки');
      }
    }

    // 2. В dev режиме отписываем SW для чистого тестирования
    if (import.meta.env.DEV && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      console.log('🧹 Dev: Service Workers отписаны для чистого тестирования');
    }
  } catch (error) {
    console.warn('Ошибка при очистке:', error);
  }
}

// В development режиме - отключение PWA и очистка для тестирования
if (import.meta.env.DEV) {
  console.log('🚧 Режим разработки: PWA отключен');
  cleanupOldCaches();
} else {
  // В production - умная очистка и регистрация PWA
  console.log('🚀 Production режим: настройка PWA');
  PWADetector.debugPWAStatus();
  cleanupOldCaches().then(() => {
    // Регистрируем новый service worker только после очистки старых
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', {
          updateViaCache: 'none', // Не кэшируем сам service worker
        })
        .then((registration) => {
          console.log('✅ Новый Service Worker зарегистрирован');
          
          // Автоматическое обновление при обнаружении новой версии
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Активируем новую версию сразу
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            }
          });

          // Перезагружаем страницу при смене контроллера
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 Обновление активировано, перезагружаем страницу');
            window.location.reload();
          });
        })
        .catch((error) => {
          console.error('❌ Ошибка регистрации SW:', error);
        });
      });
    }
  });
}

// Сразу устанавливаем фиолетовый цвет status bar - убираем мигание
try {
  statusBarManager.setPurple();
} catch (error) {
  console.warn('Error setting initial status bar color:', error);
}

createRoot(document.getElementById("root")!).render(<App />);