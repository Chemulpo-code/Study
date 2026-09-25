// High-performance PWA Service Worker with Network-First strategy to guarantee instant code updates
const CACHE_NAME = 'chinese-study-v8';

// Установка воркера и немедленная активация
self.addEventListener('install', () => {
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

// Стратегия: Network First с гарантированным фолбеком для iOS Standalone PWA
self.addEventListener('fetch', (event) => {
  // Не кэшируем динамические запросы к API
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Только GET запросы
  if (event.request.method !== 'GET') {
    return;
  }

  // Навигация (открытие PWA с иконки на экране «Домой» / переходы)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', responseToCache.clone());
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedIndex = await cache.match('/index.html') || await cache.match('/');
          if (cachedIndex) {
            return cachedIndex;
          }
          return new Response(
            '<!doctype html><html style="background:#0b0f19;"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#0b0f19;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px;"><div><h3 style="margin-bottom:8px;">Загрузка...</h3><p style="color:#a7afba;font-size:0.9rem;">Пожалуйста, подключитесь к сети для запуска приложения.</p><button onclick="location.reload()" style="background:#00f2fe;border:none;color:#04070a;padding:12px 24px;border-radius:12px;font-weight:700;font-size:0.95rem;cursor:pointer;">Перезагрузить</button></div></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Статические ресурсы (JS, CSS, изображения)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response('Resource unavailable offline', { status: 404, statusText: 'Not Found' });
      })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(self.registration.showNotification(data.title || 'Китайский на сегодня', {
    body: data.body || 'Откройте приложение и продолжите занятие.',
    icon: '/apple-touch-icon.png',
    badge: '/apple-touch-icon.png',
    data: { url: data.url || '/' }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
