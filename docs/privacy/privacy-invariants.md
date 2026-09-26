# Privacy Invariants — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 03 — Privacy & Data Classification  
**Status**: Authoritative Privacy Specification  

---

## Formal System Privacy Invariants

The following 15 invariants are non-negotiable architectural constraints of **Between Us**. Any pull request, feature proposal, or code modification that violates any of these invariants must be rejected immediately during code review:

### Invariant 1: Zero Call Media Persistence
Between Us does not intentionally store, record, upload, or archive live audio or video streams to disk or cloud storage.

### Invariant 2: Zero Call History Log
Between Us does not intentionally maintain a call history database, call log, call timestamp record, or call duration archive.

### Invariant 3: Zero Audio / Video Files
The application contains zero code paths or media buffers designed to output saved `.wav`, `.mp3`, `.mp4`, or `.tmp` media files.

### Invariant 4: Zero Third-Party Analytics
No third-party or custom analytics, event tracking, user tracking, or telemetry SDKs shall exist anywhere within the client codebase or server infrastructure.

### Invariant 5: Zero Advertising Infrastructure
The application contains zero advertising networks, tracking pixels, retargeting scripts, or commercial monetization tracking hooks.

### Invariant 6: Zero Server Database for V1
The backend signaling server and TURN relay server operate with zero persistent database engines (`DATABASE = NONE FOR V1`).

### Invariant 7: Zero Server Object Storage
The application infrastructure zero-provisions object storage buckets (S3, Blob storage) or file uploads.

### Invariant 8: Endpoint Identity Isolation
Private cryptographic identity material generated in browser Web Crypto API (`extractable: false`) must never intentionally leave the trusted user device.

### Invariant 9: Time-Bounded Ephemeral State
All ephemeral signaling tokens, nonces, pairing codes (max 3m), and TURN credentials (max 15m) have explicitly defined maximum lifetimes (TTLs).

### Invariant 10: Zero Historical Signaling Archives
Signaling messages (SDP offers/answers, trickle ICE candidates) are routed ephemeral JSON envelopes and must never be converted into persistent call records.

### Invariant 11: TURN Key Opacity
The coturn relay server relays encrypted SRTP packets and must never possess or receive DTLS handshakes or media decryption keys.

### Invariant 12: Zero Key Logging
Sensitive cryptographic keys, session tokens, SDP payloads, and unmasked client IP addresses must never be written to server stdout, syslog, or client console logs.

### Invariant 13: Zero Media Caching
Audio streams, video streams, and WebAudio PCM buffers must never be cached in Service Worker `CacheStorage`, HTTP caches, or browser file systems.

### Invariant 14: Zero Secret Backup Exfiltration
Application backups are restricted strictly to source code and infrastructure scripts. User private keys and call secrets must never be included in server backups.

### Invariant 15: Mandatory Data Inventory Gate
No new data type, storage key, or network payload may be added to the software without prior document classification and explicit privacy purpose justification.
