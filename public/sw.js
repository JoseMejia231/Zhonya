const CACHE_VERSION = 'mona-v2';
const PRECACHE_URLS = ['/', '/index.html', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});

// === Firebase Cloud Messaging (background) ===
// Mismo SW para PWA cache y para FCM. La config Firebase es pública.
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBgPXix26Ml56I1Kd3WmBwlW2PwoUstdTU',
  authDomain: 'zencash-app-67503.firebaseapp.com',
  projectId: 'zencash-app',
  storageBucket: 'zencash-app.firebasestorage.app',
  messagingSenderId: '173957828623',
  appId: '1:173957828623:web:1823be858e3d883202137a',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'MONA';
  const body = (payload.notification && payload.notification.body) || '';
  const data = payload.data || {};
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data,
    tag: data.tag || 'mona-recurring',
    requireInteraction: true,
    actions: data.recurringId
      ? [
          { action: 'paid', title: 'Pagado' },
          { action: 'skip', title: 'Aún no' },
        ]
      : [],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const action = event.action || 'ask';
  const recurringId = data.recurringId;
  const periodKey = data.periodKey || '';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const open = clients.find((c) => c.url.startsWith(self.location.origin));
        if (open) {
          if (recurringId) {
            open.postMessage({
              type: 'mona-recurring-action',
              recurringId,
              periodKey,
              action,
            });
          }
          return 'focus' in open ? open.focus() : undefined;
        }
        const url = new URL('/', self.location.origin);
        if (recurringId) {
          url.searchParams.set('recurringId', recurringId);
          if (periodKey) url.searchParams.set('periodKey', periodKey);
          url.searchParams.set('rAction', action);
        }
        return self.clients.openWindow(url.toString());
      })
  );
});
