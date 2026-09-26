# Cryptographic Module (`lib/crypto`)

## Overview
Phase 09 establishes the local device cryptographic identity for **Between Us**.

Each device generates a local, persistent ECDSA P-256 (`secp256r1`) digital signature key pair using the native W3C Web Crypto API (`window.crypto.subtle`).

## Architectural & Security Invariants
- **Algorithm:** `ECDSA` curve `P-256` (`secp256r1`) with `SHA-256`.
- **Private Key Extractability:** Strictly `extractable = false`. The private key material cannot be exported or serialized into raw text/base64 strings by browser JavaScript.
- **Dedicated Key Store:** Persisted in a dedicated IndexedDB database (`between-us-identity`, store `keys`) via native WebIDL structured cloning of `CryptoKey` objects.
- **Zero Server Transmission:** The private key is strictly local to the device. It is **never** transmitted to signaling servers, TURN servers, backend APIs, or third parties.
- **Domain-Separated Signatures:** Protocol digital signatures enforce domain separation prefix (`BETWEEN_US_IDENTITY_V1:`).
- **Strict No-Auto-Regeneration:** If a stored identity is corrupted or fails validation, the system transitions to `ERROR` state rather than silently generating a replacement key pair.
- **Explicit Destruction:** `destroyDeviceIdentity()` purges the active key pair from memory and IndexedDB.
