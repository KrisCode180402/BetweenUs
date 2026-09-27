/* eslint-disable no-restricted-globals */
/**
 * Between Us — Service Worker
 * Robust PWA Service Worker for Next.js App Router on Vercel
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

// Skip waiting signal
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
