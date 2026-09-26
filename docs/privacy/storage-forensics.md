# Storage Forensics & Storage Inventory Specification

## Overview
This document contains a comprehensive forensic storage inventory and classification across all layers of the **Between Us** privacy-first 1-to-1 WebRTC audio/video calling application. It covers browser-side storage, application memory, server process memory, server filesystem, build artifacts, and third-party hosting infrastructure.

---

## 1. Master Storage Location Inventory

| Location # | Storage Target | Mechanism / API | Classification | Purpose | Can Sensitive Data Enter? | Expected Lifetime | Deletion / Cleanup Mechanism | Forensic Verification Method |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `window.localStorage` | Web Storage API | `PERSISTENT` | Persists non-sensitive UI preferences (`between_us_app_state`) | **NO** (Validated by schema) | Permanent until manual clear | `clearApplicationState()` | Key enumeration & schema payload validation |
| **2** | `window.sessionStorage` | Web Storage API | `NOT USED` | N/A | **NO** | 0s (Never written) | N/A | Enumeration (`sessionStorage.length === 0`) |
| **3** | `IndexedDB` (`between-us-identity`) | IndexedDB API | `PERSISTENT` | Holds non-extractable device identity keypair | **YES** (Public SPKI & non-extractable private key) | Permanent per device | `destroyDeviceIdentity()` | Store inspection (`spkiHex`, `fingerprint`) |
| **4** | `IndexedDB` (`between-us-partners`) | IndexedDB API | `PERSISTENT` | Holds authenticated partner public identity & SAS pinning | **NO** (Only public key & fingerprint) | Relationship lifetime | `removePartner()` | Store inspection (partner public identity only) |
| **5** | `IndexedDB` (`between-us-local`) | IndexedDB API | `PERSISTENT` | Holds UI settings (`PERSISTENT_LOW_SENSITIVITY`) | **NO** | Permanent until clear | `clearApplicationState()` | Store inspection & schema check |
| **6** | `Cache Storage` | Cache API (`caches`) | `BROWSER MANAGED` | PWA static app shell caching (`between-us-v1`) | **NO** (Only static JS/CSS/HTML/icons) | App version lifetime | Service worker update | Cache request URL enumeration |
| **7** | Browser Cookies | `document.cookie` | `NOT USED` | N/A | **NO** | 0s (Never written) | N/A | Inspection (`document.cookie === ""`) |
| **8** | Service Worker | SW API (`sw.js`) | `BROWSER MANAGED` | Caching static app shell & offline fallback | **NO** | Service worker lifetime | SW unregistration | Interception inspection (no call routing) |
| **9** | Origin Private FS (OPFS) | `navigator.storage.getDirectory()` | `NOT USED` | N/A | **NO** | 0s (Never called) | N/A | Code scan (0 calls to `getDirectory`) |
| **10** | File System Access | `showOpenFilePicker` | `NOT USED` | N/A | **NO** | 0s (Never called) | N/A | Code scan (0 calls to File System API) |
| **11** | Application RAM (React) | Component State | `MEMORY ONLY` | Active call UI state & session status | Ephemeral (Call UI state) | Call duration | `cleanupAndEnd()` | State machine transition to `IDLE` |
| **12** | Application RAM (WebRTC) | `RTCPeerConnection` | `MEMORY ONLY` | E2EE audio/video media transport | **YES** (In-flight encrypted media) | Call duration | `pc.close()`, track `stop()` | MediaStreamTrack `.readyState === "ended"` |
| **13** | WebSocket Connection | WebSocket API | `MEMORY ONLY` | Temporary signaling SDP/ICE envelope relay | Ephemeral (SDP/ICE envelopes) | Handshake (<30s) | `ws.close()` | `readyState === CLOSED` |
| **14** | Server Memory (Signaling) | Node.js `Map` | `SERVER MANAGED` | Signaling session pair mapping | Ephemeral (Session metadata) | Handshake / Max 5 min | `sessions.delete(sessionId)` | Session map size inspection (`size === 0`) |
| **15** | Server Filesystem | Node.js `fs` / `/tmp` | `SERVER MANAGED` | Static assets only | **NO** | Build lifetime | OS restart / build purge | Filesystem scan for `.wav`/`.webm`/`.tmp` |
| **16** | COTURN Relay Memory | coturn Daemon RAM | `THIRD-PARTY CONTROLLED` | Relay packet forwarding | Ephemeral (SRTP packets) | Call duration | Session expiration | COTURN allocation lifecycle |
| **17** | Build Output | Next.js `.next/` | `SERVER MANAGED` | Compiled JS/CSS production bundles | **NO** (Zero embedded secrets) | Deployment lifetime | Build deployment | Bundle string scan for synthetic secrets |
| **18** | Application Logs | `stdout` / `console` | `EPHEMERAL` | Operational component lifecycle events | **NO** (Sanitized by `AppLogger`) | Log buffer lifetime | Rotation | Automated log redaction scanning |

---

## 2. Forensic Boundary Principles & Non-Claims

1. **Zero Intentional Persistence**: Between Us does not write call media, recordings, SDP session descriptions, ICE candidate tuples, pairing secrets, or authentication tokens to any persistent browser or server storage.
2. **Memory Garbage Collection Acknowledgment**: JavaScript application code cannot force physical hardware RAM zeroization. Modern browser runtimes and V8 garbage collectors manage memory lifecycle automatically. Application code releases all object references, closes connections, and stops media tracks upon call termination.
3. **Hardware & Infrastructure Boundaries**: Physical SSD wear-leveling flash cells, OS swap space, GPU frame buffers, and hosting provider edge packet buffers (Vercel, Cloudflare, Coturn host OS) operate outside application-level execution context.
