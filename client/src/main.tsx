import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log('🚀 Starting app initialization...');

// Service Worker temporarily disabled for debugging
console.log('Service Worker отключен для диагностики');

// Initialize IndexedDB in background (don't block app startup)
import("./lib/indexeddb").then(({ indexedDBService }) => {
  indexedDBService.init().catch(console.error);
}).catch(console.error);

// Add debug logging
console.log('🎯 About to render React app...');

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('❌ Root element not found!');
} else {
  console.log('✅ Root element found, creating React root...');
  try {
    const root = createRoot(rootElement);
    console.log('✅ React root created, rendering App...');
    root.render(<App />);
    console.log('✅ App rendered successfully!');
  } catch (error) {
    console.error('❌ Error creating/rendering React app:', error);
  }
}
