# Storage Forensics Audit Results & Technical Evidence

## Executive Summary
This report documents the forensic storage audit conducted under **Phase 19** (`BETWEEN_US_FORENSICS_V1`) for the **Between Us** 1-to-1 WebRTC audio/video calling application. The objective of this audit is to verify empirically that sensitive call data (audio/video streams, SDP offers/answers, ICE candidates, TURN credentials, pairing secrets, private keys, authentication tokens) does not persist in browser storage, memory stores, server filesystems, or build artifacts after call termination.

---

## 1. Summary Evidence Matrix

| Forensic Audit Target | Test Procedure | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **localStorage Audit** | Enumerated `window.localStorage` before, during, and post-call | Zero call keys or sensitive markers found | Verified clean; only non-sensitive UI settings exist | **PASS** |
| **sessionStorage Audit** | Inspected `window.sessionStorage` keys | Zero application keys (`length === 0`) | `sessionStorage.length === 0` | **PASS** |
| **IndexedDB Audit** | Evaluated object stores across `between-us-identity`, `between-us-partners`, `between-us-local` | Zero call content, SDP, ICE, or media streams | Verified clean; only non-extractable keys & public partner IDs | **PASS** |
| **Cache Storage Audit** | Enumerated `caches.keys()` for `between-us-v1` | Static app shell assets only (HTML/JS/CSS) | Zero call payloads or API credentials in cache | **PASS** |
| **Cookie Audit** | Inspected `document.cookie` | Zero cookies set (`document.cookie === ""`) | `document.cookie === ""` | **PASS** |
| **Service Worker Audit** | Inspected `public/sw.js` route handlers | Static asset caching only; no signaling or API caching | Zero call data intercepted or cached | **PASS** |
| **OPFS & File API Audit** | Searched codebase for `getDirectory`, `showOpenFilePicker` | 0 occurrences found | 0 occurrences | **PASS** |
| **MediaRecorder Audit** | Searched codebase for `MediaRecorder` API | 0 occurrences found | 0 occurrences | **PASS** |
| **Audio/Video Buffer Audit** | Searched codebase for `AudioWorklet`, `VideoFrame`, `captureStream` | 0 occurrences found | 0 occurrences | **PASS** |
| **WebRTC Object Teardown** | Inspected `RTCPeerConnection` and `MediaStreamTrack` cleanup | Connection closed, tracks stopped (`readyState === "ended"`) | Verified complete teardown on call end | **PASS** |
| **WebSocket Teardown** | Inspected signaling client disconnect handling | Socket closed, listeners removed, temporary session cleared | Ephemeral session destroyed | **PASS** |
| **Server Memory Cleanup** | Evaluated `SignalingServer` session `Map` | Active sessions deleted on disconnect / timeout | `sessions.size === 0` after termination | **PASS** |
| **Server Filesystem Audit** | Searched filesystem for temporary files (`.wav`, `.webm`, `.tmp`, `.bin`) | 0 application-generated temporary call files | 0 media/temp call files | **PASS** |
| **Build Bundle Audit** | Scanned compiled JavaScript chunks in `.next/` | Zero embedded secrets or synthetic test markers | Clean bundle scan | **PASS** |
| **Log Remnants Audit** | Evaluated `AppLogger` and `SignalingLogger` redaction | 100% of sensitive keys/values redacted | All forbidden items redacted | **PASS** |
| **Synthetic Marker Tests** | Injected synthetic markers (`FORENSIC_*`) into call setup flows | Zero markers found in persistent storage | All markers absent post-call | **PASS** |
| **Idempotent Cleanup** | Executed `cleanupAndEnd()` 3x sequentially | Safe execution with 0 unhandled exceptions | Safe and idempotent | **PASS** |
| **RAM Garbage Collection** | V8 JS engine memory heap de-allocation | References dropped; physical RAM managed by OS/V8 | Controlled by OS / Browser GC | **OUTSIDE APP CONTROL** |

---

## 2. Synthetic Marker Test Verification Results

During automated forensic testing (`tests/privacy/storage-forensics.test.ts`), synthetic test markers were injected into active session memory structures to trace potential persistence leakage:

- `FORENSIC_AUDIO_MARKER_9876`: **NOT FOUND IN PERSISTENT STORAGE** (PASS)
- `FORENSIC_SDP_MARKER_5432`: **NOT FOUND IN PERSISTENT STORAGE** (PASS)
- `FORENSIC_ICE_MARKER_1122`: **NOT FOUND IN PERSISTENT STORAGE** (PASS)
- `FORENSIC_TURN_MARKER_3344`: **NOT FOUND IN PERSISTENT STORAGE** (PASS)
- `FORENSIC_PAIRING_MARKER_7788`: **NOT FOUND IN PERSISTENT STORAGE** (PASS)
- `FORENSIC_TOKEN_MARKER_9900`: **NOT FOUND IN PERSISTENT STORAGE** (PASS)

---

## 3. Detailed Forensic Findings by Layer

### 3.1 Browser Storage Layer
- **`localStorage`**: Keys are limited strictly to `between_us_app_state`. Schema validation (`validateStoragePayload`) enforces maximum 2KB payload size and rejects non-primitive objects (`CryptoKey`, `MediaStream`, `Blob`, `RTCPeerConnection`).
- **`IndexedDB`**: Database stores strictly hold `identityKeyPair` (`extractable: false`), `partnerPublicKey`, and `safetyVerificationRecord`. Zero call records, call timestamps, SDP strings, or ICE candidates are stored.
- **`CacheStorage` & `ServiceWorker`**: Service worker caches static assets defined in `CACHE_ASSETS`. Network fetch handler excludes WebSocket signaling routes (`ws://`, `wss://`) and API endpoints (`/api/turn/credentials`).

### 3.2 WebRTC Media & Memory Lifecycle Layer
- **MediaStreamTrack Teardown**: Upon calling `endCall()`, `MediaStream.getTracks()` iterates through all audio and video tracks, invoking `track.stop()` and `track.enabled = false`. Stream pointers are detached from HTML `<audio>` and `<video>` DOM elements.
- **`RTCPeerConnection` Teardown**: Executing `cleanupAndEnd()` closes the `RTCPeerConnection` instance, unregisters `onicecandidate`, `ontrack`, `oniceconnectionstatechange`, and `onnegotiationneeded` event listeners, and sets peer connection references to `null`.

### 3.3 Server & Infrastructure Layer
- **Node.js Signaling Server**: Active sessions are maintained in volatile `Map<string, SignalingSession>` memory structures. Session objects are explicitly deleted upon `close`, `error`, or explicit peer disconnect. Timed-out abandoned sessions expire after 5 minutes.
- **Server Filesystem**: Zero temporary media files, recordings, signaling transcripts, or debug dumps are created on server disk.

---

## 4. Documented Technical Limitations & Infrastructure Boundaries

1. **JavaScript V8 Heap Memory**: JavaScript engine memory de-allocation relies on V8 mark-and-sweep garbage collection. While application code purges all references, the precise moment of physical memory zeroization is managed by the browser engine.
2. **Operating System Swap & GPU Buffers**: OS virtual memory paging files and hardware GPU frame buffers operate at the operating system level, outside browser application scope.
3. **Hardware Storage Media (SSDs)**: Physical flash memory cells on solid-state drives utilize wear-leveling controllers, which operate below filesystem abstractions.
4. **Third-Party Host Transport Logs**: Infrastructure providers (Vercel, Cloudflare, Coturn VPS OS) log network transport TCP/UDP packet metrics (IP addresses, packet timing, byte counts) independently of application code.
