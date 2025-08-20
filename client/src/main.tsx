import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { indexedDBService } from "./lib/indexeddb";
import "./utils/pwa-debug";

// Initialize IndexedDB
indexedDBService.init().catch(console.error);

// Register Service Worker with aggressive update strategy
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker зарегистрирован:', registration);
        
        // Немедленно проверяем обновления
        registration.update();
        
        // Проверяем обновления каждые 30 секунд для быстрого деплоя
        setInterval(() => {
          console.log('🔄 Проверяем обновления Service Worker...');
          registration.update();
        }, 30000);
        
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
        
        // Проверяем обновления при получении фокуса
        window.addEventListener('focus', () => {
          console.log('👁️ Окно получило фокус, проверяем обновления');
          registration.update();
        });
      })
      .catch((registrationError) => {
        console.error('❌ Ошибка регистрации Service Worker:', registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
