// Стабильный Service Worker для PWA
const APP_VERSION = '1.0.0';
const CACHE_NAME = `ducharha-app-${APP_VERSION}`;
const STATIC_CACHE = `static-${APP_VERSION}`;

// Файлы для кэширования
const STATIC_FILES = [
  '/',
  '/manifest.webmanifest',
  '/icons/192.png',
  '/icons/512.png',
  '/icons/logo.png'
];

// Установка SW - кэшируем основные файлы
self.addEventListener('install', (event) => {
  console.log('📦 SW установка');
  event.waitUntil(
    Promise.all([
      // Очищаем все старые кэши при установке
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME && name !== STATIC_CACHE)
            .map(name => caches.delete(name))
        );
      }),
      // Кэшируем новые файлы
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_FILES);
      })
    ]).then(() => {
      // Принудительно активируем новую версию
      self.skipWaiting();
    })
  );
});

// Активация SW - берем контроль над всеми клиентами
self.addEventListener('activate', (event) => {
  console.log('⚡ SW активация');
  event.waitUntil(
    Promise.all([
      // Очищаем старые кэши
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME && name !== STATIC_CACHE)
            .map(name => caches.delete(name))
        );
      }),
      // Берем контроль над всеми клиентами
      self.clients.claim()
    ])
  );
});

// Обработка запросов - минимальная стратегия
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Только для GET запросов
  if (request.method !== 'GET') return;
  
  // Игнорируем API запросы - всегда идем в сеть
  if (request.url.includes('/api/')) return;
  
  event.respondWith(
    // Сначала пробуем сеть, потом кэш
    fetch(request)
      .then(response => {
        // Кэшируем успешные ответы с заголовками
        if (response.status === 200) {
          const responseClone = response.clone();
          // Добавляем заголовки для предотвращения перевода и стабильной работы PWA
          const headers = new Headers(response.headers);
          headers.set('Content-Language', 'ru');
          headers.set('X-Content-Type-Options', 'nosniff');
          headers.set('X-Frame-Options', 'SAMEORIGIN');
          
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // В случае ошибки сети - проверяем кэш
        return caches.match(request).then(cachedResponse => {
          return cachedResponse || new Response('Offline', { status: 503 });
        });
      })
  );
});

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});