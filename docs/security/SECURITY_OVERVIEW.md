# Security Overview — Between Us

This document provides an accurate, public-safe overview of the security and privacy controls implemented in **Between Us**, along with explicit boundaries and known limitations.

---

## 1. Security Objectives & Honest Scope

Between Us is designed to minimize server-side data collection and protect 1-to-1 voice and video streams in transit between two paired devices.

**What Between Us does NOT claim:**
- It does **not** claim "100% security", "unhackable" operation, or "military-grade encryption".
- It cannot protect against a compromised OS, malicious browser extensions, hardware keyloggers, or screen/audio capture running on a participant's device.
- It does **not** hide network metadata (such as client IP addresses, connection timestamps, or packet volumes) from ISPs, Supabase, STUN/TURN operators, or hosting providers.

---

## 2. Implemented Security Controls

### 2.1 Device Cryptographic Identity (`lib/crypto/identity/`)
- Uses the browser W3C Web Crypto API (`window.crypto.subtle`) to generate **ECDSA P-256** key pairs with `extractable: false`.
- Private keys cannot be exported to JavaScript memory via `exportKey` and are stored as opaque `CryptoKey` handles in browser IndexedDB (`between-us-app-db`, store `keys`).
- Public keys are exported in SPKI format and hashed with `SHA-256` to produce device fingerprints.
- Domain-separated signing (`BETWEEN_US_IDENTITY_V1:`) is implemented and unit-tested.

### 2.2 Media Transport Encryption (`lib/webrtc/`)
- All WebRTC peer connections rely on standard WebRTC **DTLS-SRTP** encryption for audio and video tracks.
- `RTCConfiguration` enforces `bundlePolicy: "max-bundle"` and `rtcpMuxPolicy: "require"`.
- Neither the Next.js application server, Supabase Realtime, nor TURN relays receive DTLS-SRTP media decryption keys.

> **Important Distinction:** WebRTC DTLS-SRTP provides encrypted transport between peer endpoints, but its security against an active man-in-the-middle on the signaling channel depends on authenticating SDP DTLS fingerprints with verified device keys. Full end-to-end cryptographic identity binding over the active Supabase signaling path is a planned hardening milestone (see Section 4).

### 2.3 Signaling Validation & Anti-Replay (`lib/signaling/`)
- `SupabaseSignalingClient` enforces:
  - Self-message rejection (`senderId === localUserId`)
  - Timestamp skew validation (rejects messages older/newer than 10 minutes)
  - Payload size cap (`64 KB`)
  - Bounded replay deduplication cache (`200` message IDs)
- The optional standalone WebSocket signaling server (`server/signaling/`) additionally implements ECDSA P-256 `SESSION_JOIN` verification, 60-second timestamp skew checks, nonce replay tracking, prototype-pollution guards, 32 KB payload limits, and per-IP/per-socket rate limiting.

### 2.4 HTTP Security Headers (`next.config.ts`)
Applied globally to `/(.*)`:
- `Content-Security-Policy` (`default-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `object-src` blocked via default-src, `upgrade-insecure-requests` in production)
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: camera=(self), microphone=(self), geolocation=(), display-capture=(), payment=(), usb=(), bluetooth=(), serial=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`
- `poweredByHeader: false`

### 2.5 Privacy Mode, Cleanup & Log Sanitization (`lib/privacy/`, `lib/webrtc/cleanup.ts`)
- **Zero Application Call Retention**: No audio/video recording, no call history database, and zero third-party analytics SDKs (verified by `tests/ui/components.test.ts` and `tests/security/zero-retention.test.ts`).
- **Call Teardown**: `cleanupCallSession()` stops all `MediaStreamTrack`s, closes `RTCPeerConnection`, clears timers, and releases Screen Wake Lock.
- **Privacy Mode & Emergency Exit**: `PrivacyOverlay` blurs active calls when the tab is backgrounded; emergency exit tears down the active call and clears Cache Storage.
- **Log Sanitization**: `AppLogger` suppresses `info`/`debug` output in production and redacts private keys, SDP blobs, ICE candidates, secrets, and token fields.

### 2.6 Service Worker & Storage Isolation (`public/sw.js`)
- Caches only static PWA app shell assets (`between-us-static-v1`).
- Explicitly bypasses non-GET requests, `/api/`, `ws:`/`wss:`, `supabase`, `turn`, and cross-origin traffic.
- Never accesses IndexedDB, `localStorage`, private keys, or media streams.

### 2.7 Supply Chain & CI Hardening (`.github/`)
- Lockfile-pinned builds (`npm ci`), `CODEOWNERS` review requirements on security-sensitive paths, least-privilege `contents: read` workflow permissions, commit-SHA pinned GitHub Actions, CodeQL analysis, Dependency Review, Dependabot, and automated bundle checks preventing server secrets from leaking into `.next/`.

---

## 3. Environment Secret Isolation

- **Client-safe variables** (`NEXT_PUBLIC_*`) are restricted to public endpoints/keys (Supabase URL & public `anon` key, STUN URI, VAPID public key).
- **Server-only secrets** (`TURN_SHARED_SECRET`, `VAPID_PRIVATE_KEY`) are read exclusively inside server-side Next.js API routes and must never be prefixed with `NEXT_PUBLIC_` or committed to Git.

---

## 4. Known Security Limitations & Planned Hardening

Transparency about current gaps is essential:

1. **Pairing & Signaling Authentication**: Active Supabase pairing (`lib/pairing/supabase-pairing.ts`) and Realtime broadcast (`lib/signaling/supabase-signaling.ts`) do not yet perform the ECDSA mutual challenge-response or store the partner's SPKI public key, which also prevents live two-party HKDF Safety Verification (`lib/safety/`) from binding both identities.
2. **Push API Route Authorization**: `/api/push/subscribe` and `/api/push/send` currently accept requests without cryptographic caller authentication and store subscriptions in volatile server RAM.
3. **Public Fallback TURN Relay**: `lib/webrtc/ice.ts` includes public OpenRelay fallback credentials (`openrelay.metered.ca`) for NAT traversal; wiring the server-side HMAC-SHA1 Coturn API (`/api/turn/credentials`) into `AudioCallManager` is recommended for self-hosted production deployments.
4. **CSP Inline Script Allowance**: Next.js App Router runtime currently uses `'unsafe-inline' 'unsafe-eval'` in `script-src` and broad `connect-src` protocol wildcards in `next.config.ts`. Nonce-based CSP and stricter origin allowlists are planned hardening improvements.
5. **Upstream Dependency Advisories**: Monitor and address `npm audit` findings (particularly Next.js framework updates) before deploying publicly.

---

## 5. Reporting Vulnerabilities

See [`SECURITY.md`](../../SECURITY.md) for private vulnerability reporting instructions.
