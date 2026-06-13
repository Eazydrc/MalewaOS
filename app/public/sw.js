// ── Cache PWA — shell app ─────────────────────────────────────────────────────

const CACHE_NAME = 'elengi-v1';
const SHELL = ['/', '/manifest.json', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network first, fallback cache pour les assets statiques
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Ne pas intercepter les requêtes API
  if (url.pathname.startsWith('/api/')) return;
  // Ne pas intercepter les requêtes externes
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(res => {
        // Mettre en cache les assets statiques réussis
        if (res.ok && (event.request.method === 'GET')) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request).then(cached => cached ?? caches.match('/')))
  );
});

// ── Push notifications ────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    return;
  }
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Elengi', {
      body:  data.body ?? '',
      icon:  data.icon ?? '/icon-192.png',
      badge: '/icon-192.png',
      data:  { url: data.url ?? '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      const rawUrl = event.notification.data?.url ?? '/';
      // Validate: only allow relative paths or same-origin URLs
      const isRelative = typeof rawUrl === 'string' && rawUrl.startsWith('/');
      const isSameOrigin = (() => {
        try {
          return new URL(rawUrl).origin === self.location.origin;
        } catch {
          return false;
        }
      })();
      if (!isRelative && !isSameOrigin) return;
      const resolvedUrl = new URL(rawUrl, self.location.origin).href;
      for (const client of clientList) {
        if (client.url === resolvedUrl && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(resolvedUrl);
    })
  );
});
