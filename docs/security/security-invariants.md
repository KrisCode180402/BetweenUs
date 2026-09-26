# Security Invariants — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 01 — Security Foundation & Threat Model  
**Status**: Formal System Requirements  

---

## 1. Core Mandated Security Invariants

The following invariants are absolute constraints of the **Between Us** architecture. Any software pull request, configuration change, or deployment that violates any of these invariants must be immediately rejected as a security defect.

### Invariant 1: Identity Key Isolation
Private identity keys are generated locally via Web Crypto API and must **NEVER** leave the trusted user endpoint browser storage under any circumstances.

### Invariant 2: Signaling Media Isolation
The signaling server processes only structural JSON routing envelopes and must **NEVER** receive, proxy, or decrypt live audio or video media streams.

### Invariant 3: TURN Key Opacity
The coturn relay server relays raw encrypted SRTP packets and must **NEVER** possess or receive DTLS handshakes, SRTP master keys, or media decryption material.

### Invariant 4: Zero Call Recording Code Paths
The application contains **ZERO** code paths, storage buffers, or API integrations for recording, storing, or uploading call audio/video content.

### Invariant 5: Zero Call History Persistence
The application contains **ZERO** databases, local tables, or file outputs for maintaining a call history, call duration log, or timestamp history.

### Invariant 6: Zero Analytics & Telemetry
No third-party or custom analytics, event tracking, user tracking, or performance telemetry SDKs shall exist anywhere within the codebase or build chain.

### Invariant 7: Temporary Single-Use Pairing Codes
Pairing codes must be generated cryptographically, expire within a maximum window of 3 minutes, and be invalidated immediately upon first use or failed attempt limit.

### Invariant 8: Pairing Replay Resistance
Pairing protocols must enforce anti-replay nonces, strict monotonic sequence counters, and maximum time-drift windows (±30 seconds).

### Invariant 9: Mandatory Identity Change Detection & Re-Verification
If a paired peer's public identity key changes, the application must **FAIL CLOSED**, block incoming connection attempts, alert the user, and require explicit out-of-band SAS re-verification.

### Invariant 10: Time-Bounded Ephemeral Credentials
All TURN relay access tokens and signaling session tokens must carry a maximum time-to-live (TTL) of 15 minutes or less.

### Invariant 11: Non-Caching of Sensitive Browser State
Call session secrets, SDP parameters, and ICE candidates must exist exclusively in volatile browser RAM and must **NEVER** be stored in `localStorage`, `sessionStorage`, or Service Worker caches.

### Invariant 12: Standard Cryptographic Primitives Only
All encryption, hashing, key derivation, and signature validation must use standard Web Crypto API primitives (`SubtleCrypto`). Custom symmetric algorithms or unreviewed cryptographic code are strictly forbidden.

### Invariant 13: Mandatory Security Automated Test Coverage
All security state machines, cryptographic wrappers, input validators, and rate limiters must have 100% automated test coverage in CI/CD before deployment.

### Invariant 14: Secure Fail-Closed Behavior
Security initialization failures, invalid signatures, expired credentials, or unverified peer connections must cause the application to **FAIL CLOSED** immediately, rather than degrading into an unencrypted or unauthenticated state.

---

## 2. Proposed Architectural Invariants

### Invariant 15: Non-Extractable Key Storage Enforcement
*Proposed Addition*: All identity key generation calls to `window.crypto.subtle.generateKey` must explicitly specify `extractable: false`. Raw private key export functions must not exist in the codebase.

### Invariant 16: Strict CSP Nonce / No Unsafe-Inline Policy
*Proposed Addition*: Production HTTP deployments must strictly disallow `'unsafe-inline'` and `'unsafe-eval'` for JavaScript execution in Content Security Policy headers.

### Invariant 17: Ephemeral Session Purge on Disconnect
*Proposed Addition*: Disconnection of a signaling WebSocket or termination of an RTCPeerConnection must trigger an immediate memory scrub of ephemeral session keys and active MediaStream objects.
