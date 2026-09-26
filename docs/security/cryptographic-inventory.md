# Master Cryptographic Primitives Inventory

## Overview
This document contains a comprehensive inventory of every cryptographic algorithm, key type, digital signature scheme, key derivation function, hash function, and transport encryption protocol used across the **Between Us** 1-to-1 WebRTC audio/video calling application.

---

## 1. Primitives & Algorithms Inventory Table

| ID | Primitive / Algorithm | Standard / Specification | Key Type / Parameters | Purpose / Usage | Implementation API | Key Ownership | Storage Location | Key Lifetime | Extractability |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P1** | **ECDSA P-256** | FIPS 186-4 / SECG SEC1 | `ECDSA` with `P-256` curve (NIST SP 800-56A) | Device Cryptographic Identity generation & digital signatures | Web Crypto API (`crypto.subtle.generateKey`, `sign`, `verify`) | Local Device | IndexedDB (`between-us-identity`) | Device Lifetime / Persistent | `extractable: false` |
| **P2** | **SHA-256** | FIPS 180-4 | 256-bit hash digest | Public key SPKI hashing, safety fingerprint derivation, nonce tagging | Web Crypto API (`crypto.subtle.digest("SHA-256", ...)`) | N/A (One-way hash) | Memory / Calculated on-the-fly | Ephemeral | N/A |
| **P3** | **HKDF-SHA256** | RFC 5869 | HKDF using SHA-256 digest | Canonical SAS Safety Fingerprint derivation (`BETWEEN_US_SAFETY_FINGERPRINT_V1`) | Web Crypto API (`crypto.subtle.deriveBits`) | Local Device | Memory Only | Ephemeral (Session verification) | N/A |
| **P4** | **HMAC-SHA1** | RFC 2104 | 160-bit HMAC secret | TURN REST API short-lived password generation (`password = Base64(HMAC-SHA1(secret, username))`) | Node.js `crypto.createHmac("sha1", secret)` | Server-Side Only | Server Environment (`TURN_SHARED_SECRET`) | Short-Lived (10 min TTL) | N/A (Server secret) |
| **P5** | **DTLS 1.2 / 1.3** | RFC 6347 / RFC 9147 | ECDHE-ECDSA / RSA TLS handshake | WebRTC P2P peer authentication and SRTP key exchange | Native Browser WebRTC Engine (`RTCPeerConnection`) | Peer Endpoints | Browser Ephemeral RAM | Call Session Duration | Browser Managed |
| **P6** | **SRTP (AES-GCM / AES-CTR)** | RFC 3711 / RFC 7714 | `AES-128-GCM` / `AES-256-GCM` | Real-time audio & video media payload encryption | Native Browser WebRTC Engine (SRTP stack) | Peer Endpoints | Browser Volatile RAM | Call Duration | Browser Managed |
| **P7** | **CSPRNG** | W3C Web Crypto | 256-bit entropy buffers | Pairing challenge generation (`challengeA`, `challengeB`), signaling nonces | Web Crypto API (`crypto.getRandomValues(new Uint8Array(32))`) | Endpoints | Memory Only | Single-Use / Ephemeral | N/A |

---

## 2. Key Separation & Domain Separation Rules

To prevent cross-protocol signature re-use, all digital signature payloads in Between Us prepend explicit string prefixes:

- **Device Identity Signature**: `BETWEEN_US_IDENTITY_V1:<payload>`
- **Pairing Initiator Response**: `BETWEEN_US_PAIRING_V1:RESP:<sessionId>:<challengeA>:<challengeB>:<fingerprintA>:<fingerprintB>`
- **Pairing Responder Confirm**: `BETWEEN_US_PAIRING_V1:CONF:<sessionId>:<challengeA>:<challengeB>:<fingerprintA>:<fingerprintB>`
- **Signaling WebSocket Authentication**: `BETWEEN_US_SIGNALING_V1:AUTH:<sessionId>:<nonce>:<timestamp>:<fingerprint>`
- **Safety Fingerprint Derivation**: `BETWEEN_US_SAFETY_FINGERPRINT_V1:ECDSA-P256:<spkiHex>`

---

## 3. Cryptographic Non-Claims & Limits

1. **No Custom Ciphers**: Between Us uses strictly standard browser Web Crypto primitives (`crypto.subtle`) and native WebRTC DTLS-SRTP. Zero custom stream ciphers, bitwise XOR obfuscation, or ad-hoc encryption loops exist.
2. **Qualified E2EE Boundaries**: End-to-end media confidentiality is provided by WebRTC mandatory DTLS-SRTP. Out-of-band identity pairing and SAS safety check verify peer public keys against signaling MITM substitution attacks.
