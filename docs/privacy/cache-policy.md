# Cache Policy & Service Worker Scope — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 03 — Privacy & Data Classification  
**Status**: Authoritative Privacy Specification  

---

## 1. Service Worker Caching Boundaries

The Service Worker for **Between Us** serves exclusively to enable offline PWA app shell execution. It operates under a strict "App Shell Only" caching model:

```
                               SERVICE WORKER CACHE FILTER
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               ▼                                                         ▼
     ALLOW CACHING (Static Only)                               DENY CACHING (Dynamic Data)
  - index.html                                              - WSS WebSocket Signaling Frames
  - static/js/app.js                                        - SDP Offers & SDP Answers
  - static/css/main.css                                     - ICE Candidate Objects
  - manifest.json                                           - Ephemeral TURN REST Credentials
  - icons/icon-192.png                                      - Live Audio & Video Blobs
```

---

## 2. HTTP Cache-Control Headers Policy

All HTTP responses served by Vercel Serverless Origins and Cloudflare Edge must specify explicit `Cache-Control` directives according to resource classification:

### 2.1 Static Application Assets (HTML, JS, CSS, Icons)
```http
Cache-Control: public, max-age=31536000, immutable
```

### 2.2 Dynamic API & Signaling Handshake Endpoints (WebSocket Upgrade / TURN Token Requests)
```http
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
Pragma: no-cache
Expires: 0
```

---

## 3. Strict Caching Invariants

1. **PROHIBITED MEDIA CACHING**: Audio streams, video streams, canvas frame snapshots, and WebAudio PCM buffers must **NEVER** be cached in Service Worker `CacheStorage`, `HTTP Cache`, or temporary file system storage.
2. **PROHIBITED SIGNALING CACHING**: Signaling payloads, SDP offer/answer text strings, trickle ICE candidate arrays, and single-use numeric pairing codes must **NEVER** pass through or be retained in any browser cache.
3. **SERVICE WORKER NETWORK BYPASS**: All dynamic network fetches targeting `wss://signaling.betweenus.app` and `https://turn.betweenus.app` must bypass Service Worker caching using explicit network-only fetch strategies.
