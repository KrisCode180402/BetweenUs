# Local Storage & IndexedDB Security Specification

## Executive Summary
This document defines the storage security architecture, classifications, boundaries, and validation policies for **Between Us**.

The application enforces a minimal local-state model. IndexedDB is used strictly for low-sensitivity application state. Call sessions, WebRTC parameters, media streams, cryptographic secrets, pairing data, and user history are strictly prohibited from persistence.

---

## 1. Storage Philosophy
- **Default Persistence Rule:** If data does not need to survive a page reload or browser restart, it **must not** be persisted.
- **In-Memory First:** Real-time communications, audio/video tracks, and active session state exist strictly in volatile memory.
- **Zero Call Persistence:** Calls leave zero local database records, timestamps, or duration logs upon completion or termination.

---

## 2. Storage Classification Matrix

| Classification | Storage Location | Retention | Permitted Content |
| :--- | :--- | :--- | :--- |
| **`EPHEMERAL_MEMORY`** | RAM / Volatile Memory | Active Session Only | Real-time call state, WebRTC connection state, active media tracks |
| **`PERSISTENT_LOW_SENSITIVITY`** | IndexedDB (`between-us-local`) | Reload / Restart Persistent | UI theme preferences, app schema version, installation preferences |
| **`SENSITIVE_PERSISTENT`** | Protected Storage | Phase-Gated | Strictly phase-justified non-ephemeral state |
| **`CRYPTOGRAPHIC_MATERIAL`** | Protected KeyStore | Phase 09 | Device identity key pairs (Phase 09 only) |
| **`CALL_SESSION_DATA`** | RAM Only | Call Duration Only | SDP, ICE candidates, signaling session parameters |
| **`MEDIA_DATA`** | RAM Only | Immediate Playback | Microphone audio, camera video, MediaStream objects |

---

## 3. Database Architecture & Schema
- **Database Name:** `between-us-local`
- **Schema Version:** `1`
- **Object Store:** `app_state` (Key path: `key`)
- **Indexes:** Zero secondary indexes. Indexes on sensitive identifiers or fields are explicitly forbidden.

---

## 4. Storage Validation & Limits
- **Record Size Limit:** Maximum 2048 bytes (2 KB) per record.
- **Total Store Capacity:** Maximum 10240 bytes (10 KB) total across all records.
- **Validation Engine:** All payloads pass through `validateStoragePayload()` prior to write operations.

### Prohibited Types & Payloads (Strictly Rejected)
- `MediaStream`, `MediaStreamTrack`, audio/video `Blob`, or `File` instances.
- WebRTC SDP offers/answers (`RTCSessionDescription`) and ICE candidates (`RTCIceCandidate`).
- Cryptographic private keys (`CryptoKey`, raw private key bytes/strings).
- Pairing codes, pairing secrets, or safety verification signatures.
- Signaling messages, authentication tokens, cookies, or TURN credentials.
- Call history records, outgoing/incoming call logs, message payloads, or user profiles.

---

## 5. Application Reset & Clear Safety
- Programmatic reset is provided via `clearApplicationState()`.
- Operation targets **only** `between-us-local` object stores.
- Does **not** wipe unrelated origin browser storage, cookies, or unrelated application databases.
- Does **not** log stored or deleted values to browser developer consoles.

---

## 6. Private Browsing & Graceful Degradation
- If IndexedDB is blocked, restricted, or unavailable (e.g. private browsing mode), the storage layer falls back to `memoryFallback` (in-memory Map).
- Storage operations degradation is silent and non-disruptive.
- The storage layer **never** falls back to `localStorage` or `sessionStorage` for sensitive state.

---

## 7. Storage Isolation & Cache Separation
- **Cache Storage (`between-us-static-v1`):** Stores static, public PWA app shell assets (HTML, CSS, JS, icons).
- **IndexedDB (`between-us-local`):** Stores validated, low-sensitivity application state (`app_state`).
- Neither cache nor IndexedDB serves as a database for calls, media, or private identities.
