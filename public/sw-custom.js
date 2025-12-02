// Custom Service Worker for Alfa22 SOS
// Handles background execution for shake and voice detection

const CACHE_NAME = 'alfa22-sos-v1';

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Background sync for SOS messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'sos-alert') {
    console.log('[SW] Background sync: SOS alert');
    event.waitUntil(handleBackgroundSOS());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'Emergency alert system active',
    icon: '/favicon.png',
    badge: '/favicon.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'sos-notification',
    requireInteraction: true,
    actions: [
      { action: 'trigger', title: 'Trigger SOS' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Alfa22 SOS', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();
  
  if (event.action === 'trigger') {
    // Trigger SOS from notification
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            client.postMessage({ type: 'TRIGGER_SOS' });
            return;
          }
        }
        // If no window is open, open one
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  } else {
    // Just open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow('/');
      })
    );
  }
});

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data?.type === 'KEEP_ALIVE') {
    // Respond to keep-alive pings
    event.ports[0]?.postMessage({ type: 'ALIVE' });
  }
  
  if (event.data?.type === 'ARM_SYSTEM') {
    console.log('[SW] System armed - background monitoring active');
    // Store armed state
    self.armedState = true;
  }
  
  if (event.data?.type === 'DISARM_SYSTEM') {
    console.log('[SW] System disarmed');
    self.armedState = false;
  }
});

// Handle background SOS
async function handleBackgroundSOS() {
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.postMessage({ type: 'BACKGROUND_SOS_TRIGGER' });
    }
  } catch (error) {
    console.error('[SW] Background SOS error:', error);
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sos-check') {
    console.log('[SW] Periodic background check');
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({ type: 'BACKGROUND_CHECK' });
        }
      })
    );
  }
});

console.log('[SW] Alfa22 SOS Service Worker loaded');
