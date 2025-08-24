import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { statusBarManager } from "./utils/status-bar-manager";
import { PWADetector } from "./utils/pwa-detection";

// Initialize IndexedDB lazily to improve initial load time
if (typeof window !== 'undefined') {
  import("./lib/indexeddb").then(({ indexedDBService }) => {
    indexedDBService.init().catch(console.error);
  });
}

// Функция для принудительной очистки всех старых кэшей и service worker'ов
async function cleanupOldCaches() {
  try {
    // 1. Очистка всех кэшей
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('✅ Все старые кэши очищены');
    }

    // 2. Удаление всех старых service worker'ов
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      console.log('✅ Все старые service worker\s удалены');
    }
  } catch (error) {
    console.warn('Ошибка при очистке:', error);
  }
}

// В development режиме - полная очистка и отключение PWA
if (process.env.NODE_ENV === 'development') {
  console.log('🚧 Режим разработки: PWA отключен');
  cleanupOldCaches();
} else {
  // В production - сначала очищаем старое, потом регистрируем новое
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

// Устанавливаем черный цвет status bar при запуске (splash screen)
statusBarManager.setBlack();

// Через небольшую задержку переключаемся на фиолетовый (когда приложение загрузилось)
setTimeout(() => {
  statusBarManager.setPurple();
}, 1000);

createRoot(document.getElementById("root")!).render(<App />);