import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { indexedDBService } from "./lib/indexeddb";
import "./utils/pwa-debug";

// Initialize IndexedDB
indexedDBService.init().catch(console.error);

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Проверяем обновления сразу при загрузке страницы
        registration.update();
        
        // Обработчик новых версий Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Показываем уведомление пользователю о новой версии
                if (confirm('Доступна новая версия приложения. Обновить сейчас?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
        
        // Слушаем сообщения от Service Worker о том, что новая версия готова
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
