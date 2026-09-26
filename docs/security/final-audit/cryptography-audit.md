# Cryptography Audit — Between Us

## Cryptographic Primitives & Key Management

| Purpose | Algorithm / Primitive | Implementation | Key Lifecycle | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Device Identity** | ECDSA P-256 (SHA-256) | Web Crypto API (`subtle.generateKey`) | Non-extractable (`extractable: false`), stored in IndexedDB/WebCrypto key store | `VERIFIED` |
| **Identity Challenge Signing** | ECDSA P-256 Signature | `subtle.sign` with SHA-256 | Ephemeral challenge payload signed per pairing session | `VERIFIED` |
| **Safety Verification Fingerprint** | HKDF-SHA256 & SHA-256 | Web Crypto API (`subtle.digest` / HKDF) | Derived from sorted partner public keys; mapped to human-readable verification format | `VERIFIED` |
| **TURN Token Authentication** | HMAC-SHA1 / HMAC-SHA256 | Server-side Node.js `crypto` | Shared secret on server; timed credentials with 10-minute expiry | `VERIFIED` |
| **WebRTC Media Encryption** | DTLS 1.2 / SRTP | Standard Browser WebRTC Engine | Ephemeral key exchange per session; managed directly by browser engine | `VERIFIED` |

## Code & Algorithm Audit
- **Standard Primitives**: Native Web Crypto API (`crypto.subtle`) is used exclusively. No custom implementation of block ciphers, hashing functions, or key exchange protocols.
- **Randomness**: All security-critical random values (pairing challenges, session IDs, NONCEs) use `crypto.getRandomValues()`. `Math.random()` is **strictly prohibited** and zero instances exist in security paths.
- **Key Extraction**: Device private keys are generated with `extractable: false`, preventing JavaScript exfiltration or serialization into plain text.
- **E2EE Claim Verification**: Media payload confidentiality is enforced by WebRTC DTLS-SRTP. Signaling and pairing data are protected by TLS/WSS.
