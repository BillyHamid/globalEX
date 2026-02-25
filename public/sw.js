// Service Worker for Global Exchange Push Notifications

const CACHE_NAME = 'globalex-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(clients.claim());
});

// Push notification received
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'Global Exchange',
    body: 'Nouvelle notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    data: {}
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/badge-72.png',
    vibrate: data.vibrate || [200, 100, 200],
    tag: data.tag || 'globalex-notification',
    data: data.data,
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler (iOS 16.4+ : URL absolue requise pour openWindow)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let path = '/';

  if (event.action === 'view' && data.url) {
    path = data.url.startsWith('/') ? data.url : '/' + data.url;
  } else if (event.action === 'pay' && data.transferId) {
    path = `/transfers?action=pay&id=${data.transferId}`;
  } else if (data.url) {
    path = data.url.startsWith('/') ? data.url : '/' + data.url;
  }

  // iOS 16.4+ exige une URL absolue pour clients.openWindow
  const baseUrl = self.registration.scope.replace(/\/$/, '');
  const absoluteUrl = path.startsWith('http') ? path : baseUrl + (path.startsWith('/') ? path : '/' + path);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.startsWith(baseUrl) && 'focus' in client) {
            client.navigate(absoluteUrl);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(absoluteUrl);
        }
      })
  );
});

// Notification close handler
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
});

// Background sync (for offline transfers)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-transfers') {
    event.waitUntil(syncTransfers());
  }
});

async function syncTransfers() {
  // Implement offline transfer sync logic here
  console.log('[SW] Syncing offline transfers...');
}
