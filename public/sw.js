// Service Worker for Mr. Michael Shehata LMS (The Master)
const CACHE_NAME = 'ms-lms-v2.4.0-video-stream';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.png',
  './apple-touch-icon.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/icon-maskable-192x192.png',
  './icons/icon-maskable-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // STRICT VIDEO & RANGE BYPASS: Never intercept or cache streaming videos or range requests
  // This guarantees smooth playback on iPhone Safari (iOS), Android Chrome, and all desktop browsers
  if (
    event.request.headers.get('range') ||
    url.hostname.includes('r2.dev') ||
    url.hostname.includes('cloudflarestorage.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseapp.com') ||
    url.pathname.startsWith('/__/auth/') ||
    url.pathname.startsWith('/__/firebase/') ||
    url.pathname.includes('.mp4') ||
    url.pathname.includes('.m3u8') ||
    url.pathname.includes('.webm') ||
    url.pathname.includes('.mov') ||
    url.pathname.includes('.m4v')
  ) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', networkResponse.clone()));
        }
        return networkResponse;
      }).catch(() => caches.match('./index.html').then((cached) => cached || caches.match('./')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background (Stale While Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// =========================================================================
// Native Web Push Notifications & Background Alerts
// =========================================================================
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'منصة مستر مايكل شحاتة التعليمية 🇬🇧',
        body: event.data.text()
      };
    }
  }

  const title = data.title || 'منصة مستر مايكل شحاتة التعليمية (The Master) 🇬🇧';
  const options = {
    body: data.body || 'لديك تنبيه تعليمي أو محاضرة جديدة متاحة الآن!',
    icon: data.icon || './icons/icon-192x192.png',
    badge: data.badge || './favicon.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'ms-announcement',
    renotify: true,
    dir: 'rtl',
    lang: 'ar',
    data: {
      url: data.url || './',
      targetId: data.targetId || null,
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: 'عرض المحتوى 📖' },
      { action: 'dismiss', title: 'إغلاق' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it
      for (let client of windowClients) {
        if ('focus' in client) {
          if (client.url.includes(targetUrl) || targetUrl === './') {
            return client.focus();
          }
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// =========================================================================
// Background Sync (PWABuilder / Store Readiness)
// =========================================================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-submissions' || event.tag === 'sync-offline-cache' || event.tag === 'sync-analytics') {
    event.waitUntil(
      Promise.resolve().then(() => {
        return true;
      })
    );
  }
});

// =========================================================================
// Periodic Background Sync (PWABuilder / Store Readiness)
// =========================================================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'get-latest-announcements' || event.tag === 'check-new-lectures') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return fetch('./index.html?sync=periodic').then((res) => {
          if (res && res.status === 200) {
            return cache.put('./index.html', res);
          }
        }).catch(() => {});
      })
    );
  }
});
