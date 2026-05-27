const CACHE_VERSION = 'mona-v4';
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

// Debe coincidir con VITE_FIREBASE_* del cliente (src/firebase.ts). Si cambia el
// proyecto, actualizar ambos lugares — el SW no puede leer import.meta.env.
firebase.initializeApp({
  apiKey: 'AIzaSyDgW_zOZDs5Diz3latkkAkPa4nNton1xs0',
  authDomain: 'zhonyas-61c6f.firebaseapp.com',
  projectId: 'zhonyas-61c6f',
  storageBucket: 'zhonyas-61c6f.firebasestorage.app',
  messagingSenderId: '894416882406',
  appId: '1:894416882406:web:e8dd6a2062f91d35b80927',
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
    // No la dejamos pegada — son recordatorios de gastos fijos, no alertas críticas.
    // Si la pierde, vuelve a aparecer la próxima vez que arranque la app o entre
    // a la sección recurrentes (la lógica de prompt vive en FinanceContext).
    requireInteraction: false,
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
