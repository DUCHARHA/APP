import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { indexedDBService } from "./lib/indexeddb";
import "./utils/pwa-debug";

// Initialize IndexedDB
indexedDBService.init().catch((error) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('IndexedDB init error:', error);
  }
});

// Register Service Worker with aggressive update strategy
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Service Worker зарегистрирован:', registration);
        }
        
        // Немедленно проверяем обновления
        registration.update();
        
        // Обработчик новых версий Service Worker
        registration.addEventListener('updatefound', () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🆕 Найдена новая версия Service Worker');
          }
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (process.env.NODE_ENV === 'development') {
                console.log('📊 Статус нового SW:', newWorker.state);
              }
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // Автоматически активируем новую версию
                  if (process.env.NODE_ENV === 'development') {
                    console.log('⚡ Активируем новую версию Service Worker');
                  }
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                } else {
                  // Первая установка
                  if (process.env.NODE_ENV === 'development') {
                    console.log('🎉 Service Worker установлен впервые');
                  }
                }
              }
            });
          }
        });
        
        // Перезагружаем страницу при смене контроллера
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Контроллер изменился, перезагружаем страницу');
          }
          window.location.reload();
        });
        
        // Проверяем обновления при каждом обновлении страницы
        window.addEventListener('beforeunload', () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Страница обновляется, проверяем обновления SW');
          }
          registration.update();
        });
      })
      .catch((registrationError) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Ошибка регистрации Service Worker:', registrationError);
        }
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
