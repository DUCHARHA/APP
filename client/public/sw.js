// Service Worker для PWA с улучшенной совместимостью
const CACHE_NAME = 'ducharkha-v2025-02';
const STATIC_CACHE = 'static-v2025-02';
const DYNAMIC_CACHE = 'dynamic-v2025-02';

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
        // Кэшируем успешные ответы
        if (response.status === 200) {
          const responseClone = response.clone();
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

// Событие для отслеживания установки PWA
self.addEventListener('appinstalled', (event) => {
  console.log('✅ PWA успешно установлено');
  
  // Отправляем сообщение клиенту об успешной установке
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'PWA_INSTALLED',
        message: 'PWA успешно установлено'
      });
    });
  });
});

// Улучшенная обработка запросов для Honor/Huawei устройств
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Только для GET запросов
  if (request.method !== 'GET') return;
  
  // Игнорируем API запросы
  if (request.url.includes('/api/')) return;
  
  // Для Honor устройств - всегда обновляем кэш
  const isHonorDevice = self.navigator.userAgent.includes('Honor') || 
                       self.navigator.userAgent.includes('HONOR') ||
                       self.navigator.userAgent.includes('Huawei');
  
  if (isHonorDevice) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then(cachedResponse => {
            return cachedResponse || new Response('Offline', { status: 503 });
          });
        })
    );
  } else {
    // Стандартная обработка для других устройств
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then(cachedResponse => {
            return cachedResponse || new Response('Offline', { status: 503 });
          });
        })
    );
  }
});