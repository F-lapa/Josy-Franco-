// Configuração do Cache
const CACHE_NAME = 'app-cache-v2';
const OFFLINE_PAGE = '/offline.html';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/app.js',
  '/image.png'
];

// Instalação (Cache essencial)
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Estratégia Offline-First
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request)
      .then(response => response || fetch(e.request))
      .catch(() => caches.match(OFFLINE_PAGE))
  );
});

// Background Sync (Exemplo prático)
self.addEventListener('sync', (e) => {
  if (e.tag === 'sync-forms') {
    e.waitUntil(syncPendingForms());
  }
});

// Push Notifications (Configuração básica)
self.addEventListener('push', (e) => {
  const data = e.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icons/icon-192.png'
  });
});
