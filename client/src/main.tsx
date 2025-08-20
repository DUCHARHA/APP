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
                // Автоматически активируем новую версию без запроса согласия
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
        
        // Слушаем сообщения от Service Worker и автоматически перезагружаем
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
