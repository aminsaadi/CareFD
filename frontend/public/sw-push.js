/* eslint-disable no-restricted-globals */

// Service Worker for Push Notifications - CareFD

const CACHE_NAME = 'carefd-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Push notification received
self.addEventListener('push', (event) => {
  console.log('Push notification received', event);
  
  let notificationData = {
    title: 'CareFD',
    body: 'יש לך הודעה חדשה',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: {}
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        data: payload.data || {},
        timestamp: payload.timestamp
      };
    } catch (e) {
      console.error('Failed to parse push data:', e);
      notificationData.body = event.data.text();
    }
  }
  
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [200, 100, 200],
    tag: 'carefd-notification',
    renotify: true,
    requireInteraction: false,
    data: notificationData.data,
    actions: [
      { action: 'open', title: 'פתח', icon: '/logo192.png' },
      { action: 'close', title: 'סגור' }
    ],
    dir: 'rtl',
    lang: 'he'
  };
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked', event);
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  if (action === 'close') {
    return;
  }
  
  // Determine URL to open based on notification data
  let urlToOpen = '/';
  
  if (data.booking_id) {
    urlToOpen = `/bookings/${data.booking_id}`;
  } else if (data.provider_id) {
    urlToOpen = `/providers/${data.provider_id}`;
  } else if (data.chat_room_id) {
    urlToOpen = `/chat/${data.chat_room_id}`;
  } else if (data.from_admin) {
    urlToOpen = '/notifications';
  }
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close handler
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed', event);
});
