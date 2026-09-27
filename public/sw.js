/* eslint-disable no-restricted-globals */
/**
 * Between Us — Service Worker
 * Robust PWA Service Worker with Web Push & Ephemeral Call Signaling Support
 */

const CACHE_NAME = 'between-us-static-v1';

const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-512x512.png',
];

// Install event: Pre-cache static icons & manifest
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event: Purge outdated caches & claim clients immediately
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

// Fetch event: Network-First for HTML/Next.js, Network-Only for APIs/Supabase/Signaling/TURN
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Non-GET requests bypass SW
  if (request.method !== 'GET') return;

  // 2. Bypass SW for Next.js assets, APIs, Supabase, WebSockets, wss:, turn, Vercel internal routes
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('vercel') ||
    url.hostname.includes('turn') ||
    url.protocol === 'ws:' ||
    url.protocol === 'wss:' ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // 3. For navigation requests, use Network-First with Cache Fallback for PWA offline support
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

  // 4. For icons and manifest, use Cache-First
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request);
      })
    );
    return;
  }
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
    // Post message to active clients if available to handle decline signal
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

  // Otherwise (action === 'answer' or notification body clicked), open/focus application window
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
  // Ephemeral cleanup on notification dismiss
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

// Skip waiting signal
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
