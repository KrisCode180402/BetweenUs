# Security Requirements — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 01 — Security Foundation & Threat Model  
**Status**: Approved Specification  

---

## 1. Cryptographic Requirements

### 1.1 Established Primitives & Web Crypto API
* **No Custom Cryptography**: All cryptographic operations must rely exclusively on established, standard primitives supplied by the W3C Web Crypto API (`window.crypto.subtle`). Custom symmetric algorithms, unreviewed key expansion routines, or non-standard hash functions are strictly prohibited.
* **Identity Cryptography**:
  * Identity Key Pairs: Generated using **Ed25519** (or ECDSA with NIST P-256 curve where Ed25519 is unsupported by browser target).
  * Storage: Identity keys are generated as non-extractable (`extractable: false`) and persisted securely in IndexedDB.
* **Ephemeral Session Key Exchange**:
  * ECDH key agreement using **X25519** (or ECDH with P-256 curve) for ephemeral session initialization.
  * Ephemeral secrets are stored strictly in volatile RAM and destroyed upon call termination.
* **Randomness**: All nonces, initialization vectors (IVs), pairing codes, and session identifiers must be generated using `window.crypto.getRandomValues()`. Standard `Math.random()` usage is strictly prohibited across the entire codebase.

### 1.2 Peer Authentication & SAS Safety Verification
* **Pairing Authentication**:
  * Peer devices pair out-of-band via an ephemeral numeric pairing code (6 to 8 digits) and a cryptographic public identity exchange.
  * Out-of-Band Short Authentication String (SAS): The client derives a visual/verbal fingerprint (e.g., SAS word list or hexadecimal hash string) computed via HKDF-SHA256 from the combined public identity keys.
  * Users must manually verify SAS equality prior to establishing trusted identity state.
* **Identity Change Detection**:
  * If a paired peer's identity key changes (e.g., browser storage cleared, device replacement), the application must block communication, display a prominent warning banner, and force an explicit out-of-band re-pairing protocol. Automatic or silent re-trust is strictly prohibited.

---

## 2. WebRTC Security Requirements

### 2.1 Media Confidentiality & Integrity
* **Mandatory DTLS-SRTP**: Audio and video media streams must be encrypted using Secure Real-time Transport Protocol (SRTP), with keys negotiated directly between peer browsers via Datagram Transport Layer Security (DTLS 1.2/1.3).
* **Signaling Trust Separation**: Signaling servers transmit DTLS fingerprints during WebRTC session negotiation but never possess DTLS private keys or SRTP master keys.

### 2.2 Connectivity & IP Exposure
* **Direct P2P vs TURN Relay**:
  * Direct P2P mode establishes a direct socket connection between peer IP addresses, offering lowest latency.
  * TURN Relay mode forces all media through the coturn relay server, masking client IP addresses from network observers and peer endpoints.
* **ICE Candidate Filtering**:
  * Non-host candidates and private local IP addresses must be filtered or handled according to `mdns` (Multicast DNS) browser privacy standards to prevent local network layout leakage.

### 2.3 Explicit Security Distinction Boundary

> [!IMPORTANT]
> **Core Architectural Security Distinctions**
> 1. **ENCRYPTION is NOT ANONYMITY**: DTLS-SRTP protects media payload content from interception. It does not conceal packet timing, bandwidth consumption, packet counts, or IP endpoints from network-level observers.
> 2. **END-TO-END ENCRYPTION is NOT ENDPOINT SECURITY**: E2EE protects media transit between browser runtimes. It cannot protect against host OS keyloggers, screen recording trojans, or compromised browser process memory.
> 3. **ENCRYPTION does NOT PREVENT SCREENSHOT / CAMERA RECORDING**: E2EE ensures only the authorized recipient receives decoded media frames. It is physically impossible for software cryptography to prevent a recipient from taking screenshots, running desktop screen capture, or filming the display with an external physical camera.

---

## 3. Signaling Infrastructure Requirements

### 3.1 Responsibilities & Scoping
* **Allowed Responsibilities**:
  * Routing temporary out-of-band pairing codes and public key offers.
  * Relaying WebRTC SDP offer and answer descriptions.
  * Relaying trickle ICE candidates between paired peers.
  * Ephemeral WebSocket connection state management.
* **Strictly Prohibited Responsibilities**:
  * No media frame proxying or processing.
  * No persistent database connections or storage engines.
  * No user account or identity indexing.
  * No chat or message history storage.
  * No analytics or telemetry recording.

### 3.2 Ephemeral Lifecycle & Anti-Replay
* **Ephemeral Memory State**: All signaling connection objects must exist purely in server RAM and automatically expire when WebSocket connections close.
* **TTL Limits**: Signaling sessions terminate automatically after a maximum inactive timeout (e.g., 60 seconds during handshake, or upon call termination).
* **Anti-Replay**: Signaling payloads must carry strict monotonic sequence numbers, random nonces, and short-lived UTC timestamps (valid within a ±30 second drift window).
* **Rate Limiting**: Hardened socket rate limiters (e.g., maximum 10 messages per second per socket) with immediate connection drop upon violation.

---

## 4. TURN Server Requirements

### 4.1 Architecture & Encryption Opacity
* **Relay-Only Role**: The TURN server (coturn) acts solely as an IP packet relay for encrypted WebRTC SRTP frames.
* **Zero Decryption Key Access**: TURN does not participate in DTLS handshakes and possesses zero cryptographic key material required to decrypt media payloads.

### 4.2 Credential & Hardening Policy
* **Ephemeral REST API Credentials**: TURN credentials must be generated dynamically using short-lived HMAC-SHA-1 signatures with a maximum lifetime (TTL) of 15 minutes.
* **No Permanent Users**: Coturn configuration must strictly forbid permanent database user accounts.
* **Logging Minimization**: Coturn must run with minimal operational logging. Packet-level logging, payload logging, and IP tracking logs are disabled.

---

## 5. Browser & PWA Security Requirements

### 5.1 Content Security Policy (CSP) & Headers
The production web server (Cloudflare / Vercel) must enforce strict HTTP headers on all responses:

```http
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self' wss://signaling.betweenus.app https://turn.betweenus.app; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none';
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(self), microphone=(self), geolocation=(), display-capture=()
```

### 5.2 Storage & Caching Isolation
* **IndexedDB**: Restrict storage to non-extractable identity cryptographic keys and paired partner identity fingerprints.
* **No Sensitive LocalStorage/SessionStorage**: Call session secrets, SDP offers, and ICE candidates must NEVER be written to `localStorage` or `sessionStorage`.
* **Service Worker Scope**: The PWA Service Worker is restricted to caching static frontend application bundles (HTML, CSS, JS, icons). Dynamic API routes, WebSockets, and TURN requests must bypass Service Worker caching.
