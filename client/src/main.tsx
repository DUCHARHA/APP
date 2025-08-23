import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize IndexedDB lazily to improve initial load time
if (typeof window !== 'undefined') {
  import("./lib/indexeddb").then(({ indexedDBService }) => {
    indexedDBService.init().catch(console.error);
  });

  // Load PWA debug only in development
  if (process.env.NODE_ENV === 'development') {
    import("./utils/pwa-debug");
  }
}

// Register Service Worker with aggressive update strategy
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker зарегистрирован:', registration);
        
        // Немедленно проверяем обновления
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
        
        // Перезагружаем страницу при смене контроллера
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('🔄 Контроллер изменился, перезагружаем страницу');
          window.location.reload();
        });
        
        // Проверяем обновления при каждом обновлении страницы
        window.addEventListener('beforeunload', () => {
          console.log('🔄 Страница обновляется, проверяем обновления SW');
          registration.update();
        });
      })
      .catch((registrationError) => {
        console.error('❌ Ошибка регистрации Service Worker:', registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
