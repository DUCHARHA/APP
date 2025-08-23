
const CACHE_NAME = 'ducharkha-v1.0.0';
const STATIC_CACHE = 'ducharkha-static-v1.0.0';
const API_CACHE = 'ducharkha-api-v1.0.0';

// Ресурсы для кеширования при установке
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/192.png',
  '/icons/512.png',
  '/icons/logo.png'
];

// API маршруты для кеширования
const API_ROUTES = [
  '/api/categories',
  '/api/products',
  '/api/banners'
];

self.addEventListener('install', event => {
  console.log('SW: Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      self.skipWaiting()
    ])
  );
});

self.addEventListener('activate', event => {
  console.log('SW: Activating...');
  event.waitUntil(
    Promise.all([
      // Удаляем старые кеши
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Кешируем только GET запросы
  if (request.method !== 'GET') {
    return;
  }

  // API запросы
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then(cache => {
        return cache.match(request).then(cachedResponse => {
          const fetchPromise = fetch(request).then(networkResponse => {
            // Кешируем только успешные ответы для определенных маршрутов
            if (networkResponse.ok && API_ROUTES.some(route => url.pathname.startsWith(route))) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Возвращаем кешированный ответ при ошибке сети
            return cachedResponse;
          });

          // Возвращаем кешированный ответ немедленно, обновляем в фоне
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Статические ресурсы
  event.respondWith(
    caches.match(request).then(response => {
      if (response) {
        return response;
      }

      return fetch(request).then(response => {
        // Кешируем статические ресурсы
        if (response.ok && (
          request.destination === 'image' ||
          request.destination === 'style' ||
          request.destination === 'script' ||
          url.pathname.endsWith('.js') ||
          url.pathname.endsWith('.css') ||
          url.pathname.endsWith('.png') ||
          url.pathname.endsWith('.jpg') ||
          url.pathname.endsWith('.svg')
        )) {
          const responseToCache = response.clone();
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });
        }

        return response;
      });
    })
  );
});

// Обработка сообщений
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
