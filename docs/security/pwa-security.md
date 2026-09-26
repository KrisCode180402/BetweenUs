# PWA & Service Worker Security Specification

## Executive Summary
This document establishes the security, privacy, and caching boundaries for the **Between Us** Progressive Web App (PWA).

Between Us is a privacy-first 1-to-1 calling application. The Service Worker and Web App Manifest exist **exclusively** to provide installability and reliable application-shell loading. Under no circumstances does Cache Storage or the Service Worker function as a database, media cache, secret store, or session queue.

---

## 1. Web App Manifest Design
- **Filename:** `public/manifest.json`
- **Application Name:** Between Us
- **Short Name:** Between Us
- **Tagline:** "Two People. One Private Connection."
- **Display Mode:** `standalone` (Provides a dedicated, address-bar-free app experience).
- **Start URL:** `/` (Strictly clean home route with **zero** query parameters, tokens, or session IDs).
- **Colors:** Background `#090d16`, Theme `#090d16`.
- **Permissions & Shortcuts:** No external permissions requested; no shortcuts exposing sensitive workflows.

---

## 2. Service Worker Architecture
- **Script Path:** `public/sw.js`
- **Scope:** `/` (Narrowest practical scope, constrained strictly to the application origin).
- **Dependency Model:** Zero third-party PWA framework packages. Uses native browser Service Worker APIs to maintain maximum supply-chain security and clarity.

---

## 3. Cache Storage Classification & Rules

### Approved Cache Categories
1. `STATIC_CACHE` (`between-us-static-v1`)
   - Pre-cached static UI application shell resources.

### Strictly Prohibited Caches
The application explicitly forbids the creation or use of:
- `CALL_CACHE`
- `MEDIA_CACHE`
- `SESSION_CACHE`
- `CRYPTO_CACHE`
- `PAIRING_CACHE`
- `PRIVATE_DATA_CACHE`

### Cacheable Resources
- Home route application shell (`/`)
- Web App Manifest (`/manifest.json`)
- Bundled static PNG icons (`/icons/*`)
- Immutable static JavaScript & CSS assets (`/_next/static/*`)

### Non-Cacheable Resources (Strict Exclusion)
- Audio / Video raw streams (`MediaStream`, `MediaStreamTrack`)
- WebRTC Session Descriptions (SDP) & ICE Candidates
- Signaling messages (WebSocket `wss://` connections)
- Pairing secrets, pair codes, or temporary exchange payloads
- Cryptographic private keys, identity fingerprints, or session keys
- TURN / STUN server credentials
- Authentication tokens or cookies
- Call metadata, duration, timestamps, or call history

---

## 4. Network & Fetch Handling Policies
- **Non-GET Requests:** Always `NETWORK-ONLY`. Never stored or intercepted for caching.
- **Real-Time Traffic (`wss://`, WebSocket, TURN/STUN):** Bypasses Service Worker cache completely.
- **App Shell Navigation:** `Network-First` with fallback to cached `/` shell when disconnected.
- **Static Assets:** `Cache-First` with network fallback for pre-cached immutable assets.
- **Dynamic Endpoints:** `Network-Only`.

---

## 5. Offline Safety & Non-Persistence
- **Offline Shell:** Loads the static presentation UI with a clear offline notice: *"You're offline. Reconnect to make a private call."*
- **Zero Delayed Transmission Queues:** No offline audio/video queues, message queues, signaling queues, or retry buffers exist. Real-time calls require an active network connection.

---

## 6. Cache Versioning & Automated Cleanup
- Caches are versioned explicitly (e.g., `between-us-static-v1`).
- During the `activate` lifecycle phase, the Service Worker inspects all `CacheStorage` keys and automatically deletes any obsolete `between-us-*` caches.

---

## 7. Service Worker Update Strategy
- Update detection runs on application launch.
- If a new Service Worker is waiting, an unobtrusive banner invites the user to update (*"A security & app update is available."*).
- Future Phase Requirement: A Service Worker update **must not** interrupt an active call session once WebRTC is active.

---

## 8. Permissions & Privacy Integrity
- PWA installation requires **zero** browser permissions.
- Microphone and Camera permissions are **not** requested during PWA setup or installation.
- No analytics, telemetry, tracking, or remote CDN dependencies are introduced by the Service Worker or Manifest.
