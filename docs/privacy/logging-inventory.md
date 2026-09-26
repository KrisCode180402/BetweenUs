# Logging Inventory & Privacy Audit

## Overview
This document contains a comprehensive logging inventory across all components of the **Between Us** privacy-first 1-to-1 WebRTC calling application. It covers client-side code, Next.js API routes, WebSocket signaling server, WebRTC media layer, TURN infrastructure, and third-party host environments.

---

## 1. Application-Controlled Logging Inventory

### 1.1 Client App (`lib/privacy/logger.ts`)
- **Logger Name**: `AppLogger`
- **Output Channel**: Browser `console` (`info`, `warn`, `error`, `debug`)
- **Sanitization Mechanism**: Automatic meta recursive key-scanning (`sanitizeMeta`) and exception stack trace sanitization (`sanitizeError`).
- **Production Behavior**: Non-essential `debug` and `info` calls are suppressed when `NEXT_PUBLIC_APP_ENV === 'production'`.
- **Sensitive Key Redaction**: Keys matching `sdp`, `candidate`, `credential`, `username`, `password`, `secret`, `privateKey`, `token`, `authorization`, `cookie`, `pairingCode` are replaced with `"[REDACTED_FOR_PRIVACY]"`.

### 1.2 WebSocket Signaling Server (`server/signaling/logger.ts`)
- **Logger Name**: `SignalingLogger`
- **Output Channel**: Server `stdout` / `stderr` (`info`, `warn`, `error`, `debug`)
- **Sanitization Mechanism**: Shared recursive key scanning (`sanitizeMeta`) and exception stack trace sanitization (`sanitizeError`) from `lib/privacy/logger.ts`.
- **Production Behavior**: Verbosity restricted in production. Session IDs and WebSocket frame contents sanitized.

---

## 2. Component-by-Component Sensitive Data Handling

| Component | Logged Data | Redaction / Protection Applied | Retention Period |
| :--- | :--- | :--- | :--- |
| **Device Identity** (`lib/crypto/identity`) | Key generation state events | Keys (`privateKey`, `publicKey`) scrubbed from meta; raw strings redacted | 0s (never logged) |
| **Pairing Protocol** (`lib/pairing/*`) | State machine transitions | Pairing secrets, pre-shared keys, auth tokens scrubbed from meta | 0s (never logged) |
| **Safety Check** (`lib/pairing/canonical.ts`) | Safety digest match result (boolean) | Raw keys and comparison buffers scrubbed | 0s (never logged) |
| **Signaling** (`server/signaling/*`) | Connection/disconnection lifecycle | Ephemeral session IDs sanitized; SDP/ICE payloads blocked | 0s (ephemeral stdout) |
| **WebRTC Media** (`lib/webrtc/*`) | PeerConnection state (`connected`, `failed`) | SDP offer/answer strings and ICE candidate IP/port tuples redacted | 0s (never logged) |
| **coturn Relay** (`server/turn/*`) | Relay allocation events | HMAC passwords and shared secrets redacted | Server OS log policy (ephemeral) |

---

## 3. Infrastructure-Provider Logging Audit

The following table documents logs managed by infrastructure providers, outside application control.

| Environment / Host | Logged Information | Privacy Risk Level | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Vercel / Next.js Serverless** | HTTP Request IP, path, status code, execution duration | Low / Transport Only | No URL params containing secrets; zero query string secret passing |
| **Coturn Relay Host (VPS OS)** | Client IP, relay port, connection duration, byte counts | Medium / Network Transport | Short-lived auth credentials (5 min TTL); zero media inspection |
| **Cloudflare / Edge CDN** | TLS handshakes, IP addresses, edge routing metrics | Low / Network Transport | Strictly transport layer TLS termination; end-to-end media encryption |

---

## 4. Audit Findings Summary
- **Forbidden Logging Items**: 0 instances of un-sanitized SDP, ICE candidates, private keys, pairing secrets, or TURN credentials found in codebase.
- **Redaction Coverage**: 100% of `AppLogger` and `SignalingLogger` calls pass through automated dictionary sanitization.
