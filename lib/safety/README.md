# Between Us — Safety Verification Module (`lib/safety`)

## Module Purpose
The `lib/safety` module provides local out-of-band safety verification and cryptographic identity pinning for paired **Between Us** devices.

---

## Security Principles & Invariants

1. **Domain-Separated Canonical Payload**: All safety fingerprints are derived from `BETWEEN_US_SAFETY_FINGERPRINT_V1:ECDSA-P256:<spkiHex>` hashed via Web Crypto API SHA-256 (`crypto.subtle.digest`).
2. **Deterministic Human-Readable Mappings**: Converts 256-bit SHA-256 digests into 6-word sequences, 5-emoji sequences, 16-character alphanumeric short codes (`ABCD-1234-EFGH-5678`), and full 64-char hex strings. No `Math.random()`.
3. **Identity Pinning & Change Detection**: When a user confirms pairing match, the partner's public key fingerprint is pinned. If the partner public key changes, the system immediately flags `IDENTITY_CHANGED` and invalidates trust.
4. **No Server Trust & Zero Leakage**: Fingerprint generation is strictly local. Private keys are never touched, read, or exposed.
5. **No Telemetry / Analytics**: Verification outcomes, timestamps, location, and IP addresses are NEVER logged or transmitted to external services.
