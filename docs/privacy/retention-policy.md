# Retention Policy — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 03 — Privacy & Data Classification  
**Status**: Authoritative Privacy Specification  

---

## 1. Explicit Retention Rules & TTL Matrix

Vague statements such as "deleted quickly" or "short-lived" are strictly prohibited in the **Between Us** architecture. Every temporary data item has an explicit maximum Time-To-Live (TTL) and precise purge trigger:

| Data Item | Storage Environment | Maximum Lifetime (TTL) | Purge Trigger | Enforcement Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **Ephemeral Pairing Code** | Signaling Server RAM | **Max 3 minutes (180 seconds)** | Code submission, 3 failed attempts, or 3m timer | Node.js `setTimeout` auto-delete |
| **Signaling Socket Session** | Signaling Server RAM | **Active WS socket lifespan** | Client disconnect or 60s idle timeout | WebSocket `close` event handler |
| **Anti-Replay Nonce Cache** | Signaling Server RAM | **Max 60 seconds** | 60-second sliding window expiry | Map eviction loop |
| **TURN REST Token** | Client RAM / coturn | **Max 15 minutes (900 seconds)** | 15m expiration or call teardown | Coturn credential time check |
| **SDP Offer / Answer** | Client RAM / Signaling RAM | **Handshake duration (<30 seconds)** | Peer SDP delivery or call cancellation | Explicit `null` assignment |
| **ICE Candidates** | Client RAM / Signaling RAM | **Handshake duration (<30 seconds)** | Peer candidate exchange complete | Array clear & `null` assignment |
| **DTLS-SRTP Master Keys** | Browser Process RAM | **Active media stream duration** | `RTCPeerConnection.close()` | Browser WebRTC C++ destructor |
| **Live Media Frames** | Volatile RAM / Hardware Buffers | **10 to 20 milliseconds** | Continuous frame rendering | Hardware buffer overwrite |
| **Client Console Logs** | Browser Console Memory | **Browser tab session duration** | Tab refresh or browser closure | Browser process termination |
| **Server Operational Logs** | Signaling VPS stdout | **Max 24 hours (Rolling)** | 24-hour log rotation timer | Linux `journald` / `logrotate` |
| **Prohibited Call History** | **N/A** | **0 seconds (NEVER STORED)** | Immediate rejection | Zero persistence code paths |
| **Prohibited Call Media** | **N/A** | **0 seconds (NEVER STORED)** | Immediate rejection | Zero recording code paths |

---

## 2. Server Retention Boundaries (`DATABASE = NONE FOR V1`)

1. **Zero Database Retention**: The signaling server and coturn relay maintain zero database tables, zero disk archives, zero KV stores, and zero object storage buckets.
2. **RAM-Only Ephemeral Scope**: Server-side data exists exclusively within volatile process memory (`node` and `turnserver`). If a daemon restarts, 100% of server RAM state is instantly destroyed.
3. **No Retained Signaling History**: Once a JSON signaling envelope (SDP, ICE candidate) is delivered over WebSocket to the destination peer, it is immediately discarded from signaling server memory.
