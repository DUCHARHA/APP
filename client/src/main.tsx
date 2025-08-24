import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize IndexedDB lazily to improve initial load time
if (typeof window !== 'undefined') {
  import("./lib/indexeddb").then(({ indexedDBService }) => {
    indexedDBService.init().catch(console.error);
  });

  // Development-specific initialization
  if (process.env.NODE_ENV === 'development') {
    import("./utils/pwa-debug");
    import("./utils/cache-killer").then(({ clearAllCaches, unregisterAllServiceWorkers }) => {
      // Очищаем кэши и отключаем SW в разработке
      Promise.all([
        clearAllCaches(),
        unregisterAllServiceWorkers()
      ]).then(() => {
        console.log('🧹 Среда разработки очищена от кэшей');
      });
    });
  }
}

// Service Worker registration - only in production
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker зарегистрирован:', registration);
        
        // Агрессивная стратегия обновления для production
        registration.update();
        
        // Обработчик новых версий Service Worker
        registration.addEventListener('updatefound', () => {
          console.log('🆕 Найдена новая версия Service Worker');
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              console.log('📊 Статус нового SW:', newWorker.state);
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // Автоматически активируем новую версию
                  console.log('⚡ Активируем новую версию Service Worker');
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                } else {
                  // Первая установка
                  console.log('🎉 Service Worker установлен впервые');
                }
              }
            });
          }
        });
        
        // Автоматическое обновление при смене контроллера
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('🔄 Контроллер изменился, обновляем страницу');
          // Принудительно очищаем кэши перед перезагрузкой
          if ('caches' in window) {
            caches.keys().then((cacheNames) => {
              return Promise.all(
                cacheNames.map((cacheName) => caches.delete(cacheName))
              );
            }).then(() => {
              window.location.reload();
            }).catch(() => {
              // В случае ошибки очистки кэша все равно перезагружаемся
              window.location.reload();
            });
          } else {
            window.location.reload();
          }
        });
        
        // Периодическая проверка обновлений
        setInterval(() => {
          registration.update();
        }, 60000); // Каждую минуту
        
        // Проверяем обновления при фокусе на странице
        window.addEventListener('focus', () => {
          registration.update();
        });
        
        // Проверяем обновления при каждом обновлении страницы
        window.addEventListener('beforeunload', () => {
          registration.update();
        });
      })
      .catch((registrationError) => {
        console.error('❌ Ошибка регистрации Service Worker:', registrationError);
      });
  });
} else if (process.env.NODE_ENV === 'development') {
  console.log('🚧 Разработка: Service Worker отключен для избежания проблем с кэшем');
  
  // Очищаем все кэши в разработке
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    });
  }
  
  // Отключаем существующие service worker'ы
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.unregister();
      }
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
