// High-performance PWA Service Worker with Network-First strategy to guarantee instant code updates
const CACHE_NAME = 'chinese-study-v3';

// Установка воркера и немедленная активация
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Активация и полная очистка ВСЕХ старых кэшей
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Стратегия: Network First для HTML/JS/CSS (всегда свежий код сервера!), с фолбеком на кэш только при отсутствии сети
self.addEventListener('fetch', (event) => {
  // Не кэшируем динамические запросы к API
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Только GET запросы
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => {
        // Если интернет недоступен, берем из кэша
        return caches.match(event.request);
      })
  );
});
