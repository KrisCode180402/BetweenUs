/* eslint-disable no-restricted-globals */
/**
 * Between Us — Service Worker
 * Phase 07: PWA / Installable Application
 * 
 * SECURITY ARCHITECTURE INVARIANTS:
 * - Cache ONLY safe static application shell assets.
 * - ZERO caching of WebRTC, audio/video, SDP, ICE candidates, signaling, pairing secrets, or keys.
 * - NETWORK-ONLY for all dynamic, real-time, signaling, TURN, or stateful requests.
 * - NO offline queues for calls, audio, video, signaling, or pairing.
 */

const CACHE_NAME = 'between-us-static-v1';

// Static application shell resources safe for offline pre-caching
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-512x512.png',
];

// Install event: Pre-cache safe static application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event: Remove old/obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('between-us-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event: Network-First for navigation, Cache-First for static assets, Network-Only for signaling/TURN/APIs
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. NON-GET requests are strictly Network-Only (NEVER cached)
  if (request.method !== 'GET') {
    return;
  }

  // 2. WebSocket / Signaling / TURN / Development / Third-Party / Sensitive Endpoints bypass cache completely
  if (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.protocol === 'ws:' ||
    url.protocol === 'wss:' ||
    url.hostname.includes('turn') ||
    url.hostname.includes('signaling') ||
    url.pathname.startsWith('/api/') ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // 3. Navigation requests (App Shell loading): Network-First, fallback to cached '/' if offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Verify response is valid before caching app shell
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached safe home shell when offline
          return caches.match('/');
        })
    );
    return;
  }

  // 4. Immutable build assets and static assets: Cache-First, fallback to network
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 5. Default fetch behavior: Network-Only for uncategorized dynamic requests
  event.respondWith(fetch(request));
});

// Listener for update messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
