# Device Cryptographic Identity Security Specification

## Executive Summary
This document defines the cryptographic architecture, primitives, storage isolation, signing mechanics, and security boundaries for **Between Us** device identities.

Each device maintains a locally generated, persistent cryptographic identity using the native W3C Web Crypto API (`window.crypto.subtle`). The private key is **never** transmitted to any backend server, signaling server, relay, or third party.

---

## 1. Identity Purpose
The device identity answers the fundamental question: *"Which cryptographic device identity am I?"*
It serves as the authenticating anchor for future out-of-band pairing (Phase 10) and safety verification (Phase 11). It is independent of partner identities, user profile details, or network addresses.

---

## 2. Cryptographic Primitive & Algorithm Selection
- **Primitive:** Elliptic Curve Digital Signature Algorithm (ECDSA).
- **Curve:** NIST P-256 (`secp256r1`).
- **Hash Algorithm:** SHA-256.
- **Key Usages:** `["sign", "verify"]`.
- **Private Key Extractability:** Strictly `extractable = false`.

### Rationale
- **Universal Browser Compatibility:** ECDSA P-256 is natively supported across 100% of modern mobile and desktop browsers (iOS Safari, Android Chrome, Safari, Firefox, Edge, Chrome) without polyfills or external third-party WASM binaries.
- **Structured Clone Storage:** Native browser WebIDL supports persisting non-extractable ECDSA `CryptoKey` objects directly into IndexedDB via structured clone.

---

## 3. Key Generation & Extractability
- Key generation invokes `crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, ["sign", "verify"])`.
- The private key is created as a non-extractable `CryptoKey` object. Browser JavaScript cannot invoke `crypto.subtle.exportKey` on the private key.
- Key material is generated locally using browser cryptographically secure pseudorandom number generators (`window.crypto`). `Math.random()` or predictable seeds are strictly forbidden.

---

## 4. Key Storage Isolation
- **Database Name:** `between-us-identity`
- **Object Store:** `keys` (Key path: `id = "device_identity"`)
- IndexedDB stores the non-extractable `CryptoKey` objects directly. Private keys are **never** serialized into raw text, JSON, base64 strings, or `localStorage`/`sessionStorage`.
- Identity key storage is isolated from generic application state (`between-us-local`).

---

## 5. Public Key Representation & Canonical Fingerprint
- **Public Key Format:** Standardized W3C `SPKI` (SubjectPublicKeyInfo) ArrayBuffer exported via `crypto.subtle.exportKey("spki", publicKey)`.
- **SPKI Encoding:** Canonical hexadecimal string (`spkiHex`).
- **Identity Fingerprint:** Canonical SHA-256 hash of public key SPKI bytes (`fingerprint`).
- Fingerprints are derived strictly from canonical public key material; they are never derived from usernames, IP addresses, or browser fingerprints.

---

## 6. Domain-Separated Signing Architecture
- Protocol signatures use ECDSA SHA-256 with an explicit domain separation prefix:
  ```
  BETWEEN_US_IDENTITY_V1:<payload_data>
  ```
- Domain separation prevents cross-protocol signature reuse attacks across future pairing or authentication protocols.
- UI components invoke `signDataWithIdentity(data)` and never receive the private `CryptoKey` directly.

---

## 7. Identity Lifecycle & Strict No-Auto-Regeneration
```
NOT_INITIALIZED ──► GENERATING ──► INITIALIZED ──► AVAILABLE
       │                                              │
       ▼                                              ▼
     ERROR ◄───────────────────────────────────── DESTROYED
```
- **Strict No-Auto-Regeneration Invariant:** If a stored identity is corrupted or fails structural/cryptographic validation upon startup, the system transitions immediately to `ERROR` state.
- The application **will not** automatically generate a replacement identity when an existing identity is unreadable. Automatic regeneration would silently sever established peer trust relationships.

---

## 8. Identity Destruction & Reset
- Executing `destroyDeviceIdentity()` purges the active key pair from in-memory state and deletes the record in `between-us-identity`.
- Subsequent initialization after destruction produces a **new, distinct** cryptographic identity with a different public key and fingerprint.

---

## 9. Security Boundaries & Non-Claims
1. **Zero Cloud Backup:** Private identity keys are not backed up to Vercel, Cloudflare, GitHub, or cloud servers.
2. **XSS Limitation:** While `extractable = false` prevents an XSS payload from calling `exportKey`, an active XSS attacker in the same origin can still request signatures via `crypto.subtle.sign`. Strict CSP remains the primary defense against XSS.
3. **Extension & Host Compromise:** Browser storage relies on origin isolation. Malicious extensions with broad origin access or host OS malware fall outside browser API boundaries. IndexedDB is not a hardware enclave.
