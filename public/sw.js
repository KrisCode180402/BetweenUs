/* eslint-disable no-restricted-globals */
/**
 * Between Us — Production Service Worker
 * PWA Offline App Shell & Web Push Notification Handler
 * Privacy-First: Never caches WebRTC signaling, SDP, ICE, tokens, or media streams.
 */

const CACHE_NAME = 'between-us-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-192x192.png',
  '/icons/maskable-icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

// Install event: Pre-cache static PWA assets & app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event: Reclaim clients & purge legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event: Handles PWA installability & offline fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Non-GET requests bypass SW
  if (request.method !== 'GET') return;

  // 2. Bypass WebSockets, WebRTC, APIs, Supabase, and cross-origin requests
  if (
    url.protocol === 'ws:' ||
    url.protocol === 'wss:' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('turn') ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // 3. Navigation requests (App Shell)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const cacheCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', cacheCopy));
          }
          return response;
        })
        .catch(() => {
          return caches.match('/').then((cached) => cached || fetch(request));
        })
    );
    return;
  }

  // 4. Static PWA assets (Cache-First)
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request);
      })
    );
    return;
  }

  // 5. Default Network-First fallback with Cache Fallback for same-origin GET
  event.respondWith(
    fetch(request)
      .then((response) => response)
      .catch(() => caches.match(request).then((cached) => cached || fetch(request)))
  );
});

// ==================================================
// WEB PUSH & INCOMING CALL NOTIFICATIONS
// ==================================================

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { type: 'incoming-call', callType: 'audio', callId: '' };
  }

  if (payload.type === 'incoming-call') {
    const callType = payload.callType === 'video' ? 'video' : 'audio';
    const callerName = payload.callerName || 'Partner';
    const callId = payload.callId || '';

    const title = 'Between Us ❤️';
    const options = {
      body: `Incoming ${callType} call from ${callerName}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: `incoming-call-${callId}`,
      renotify: true,
      requireInteraction: true,
      vibrate: [300, 150, 300, 150, 300, 150, 300],
      data: {
        callId,
        callType,
        url: `/call/${callType}?callId=${callId}&autoAnswer=true`,
      },
      actions: [
        { action: 'answer', title: 'Answer' },
        { action: 'decline', title: 'Decline' },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/home';

  if (action === 'decline') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({
            type: 'CALL_DECLINED_VIA_PUSH',
            callId: notificationData.callId,
          });
        }
      })
    );
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  const notificationData = event.notification.data || {};
  if (notificationData.callId) {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        client.postMessage({
          type: 'NOTIFICATION_DISMISSED',
          callId: notificationData.callId,
        });
      }
    });
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
