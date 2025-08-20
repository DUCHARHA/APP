const CACHE_NAME = 'ducharha-pwa-v3';
const STATIC_CACHE = 'static-v3';
const DYNAMIC_CACHE = 'dynamic-v3';

// App Shell - core files that make the app work
const appShellUrls = [
  '/',
  '/catalog',
  '/cart',
  '/profile',
  '/orders',
  '/addresses',
  '/payment-methods',
  '/help',
  '/manifest.webmanifest'
];

// Static assets
const staticAssets = [
  '/icons/192.png',
  '/icons/512.png'
];

// Install event - cache app shell and static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Caching app shell...');
        return cache.addAll(appShellUrls);
      }),
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Caching static assets...');
        return cache.addAll(staticAssets);
      })
    ])
  );
  self.skipWaiting();
});

// Fetch event - improved caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Handle app shell and static assets with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Fetch from network and cache the response
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseClone = response.clone();
            const cacheName = staticAssets.includes(url.pathname) ? STATIC_CACHE : DYNAMIC_CACHE;
            
            caches.open(cacheName).then((cache) => {
              cache.put(request, responseClone);
            });

            return response;
          })
          .catch(() => {
            // For navigation requests, return cached index.html as fallback
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
            return new Response('Offline', { 
              status: 503, 
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  const currentCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
  console.log('Service Worker activated!');
});

// Push notification event
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/192.png',
      badge: '/icons/192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'Открыть приложение',
          icon: '/icons/192.png'
        },
        {
          action: 'close',
          title: 'Закрыть',
          icon: '/icons/192.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});