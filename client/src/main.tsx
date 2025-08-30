import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { statusBarManager } from "./utils/status-bar-manager";
import { PWADetector } from "./utils/pwa-detection";

// Security: Disable console logs in production to prevent data leaks
if (import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  // console.error and console.warn are kept for debugging critical issues
}

// Initialize IndexedDB synchronously for faster access
import { indexedDBService } from "./lib/indexeddb";
if (typeof window !== 'undefined') {
  indexedDBService.init().catch(console.error);
}

// Быстрая очистка кэшей
function cleanupOldCaches() {
  if (import.meta.env.DEV && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => reg.unregister());
    });
  }
}

// Быстрая инициализация для dev/prod
if (import.meta.env.DEV) {
  cleanupOldCaches();
} else {
  PWADetector.debugPWAStatus();
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
    });
  }
}

// Сразу устанавливаем фиолетовый цвет status bar - убираем мигание
statusBarManager.setPurple();

createRoot(document.getElementById("root")!).render(<App />);