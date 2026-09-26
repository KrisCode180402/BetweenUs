# Safety Verification Security Specification

## Executive Summary
This document specifies the privacy-preserving out-of-band safety verification mechanism for **Between Us**.

Safety verification enables two paired devices to independently verify each other's cryptographic identity (`ECDSA` P-256) through an independent communication channel (e.g. in person or via trusted out-of-band contact), detecting Man-in-the-Middle (MITM) attacks, signaling server compromise, and identity substitution.

---

## 1. Core Security Model & Requirements

1. **Endpoint Identity Authority**: The signaling server is treated as potentially untrusted/compromised. Safety verification decisions are made exclusively locally on peer devices.
2. **Cryptographic Identity Source of Truth**: The safety fingerprint is derived strictly from the authenticated partner device's public key (`spkiHex`) established during Phase 10 pairing.
3. **Domain Separation**: All safety fingerprint calculations use the explicit domain prefix `BETWEEN_US_SAFETY_FINGERPRINT_V1:ECDSA-P256:<spkiHex>`.
4. **Deterministic Mapping**: Fingerprint byte digests are deterministically mapped to human-readable representations (words, emojis, short codes, full SHA-256 hex). No random numbers or server input are involved.
5. **Identity Pinning & Substitution Detection**: Upon explicit user confirmation (`MATCH`), the partner's public identity fingerprint is pinned. If the partner public identity key changes, the system immediately invalidates verification and flags `IDENTITY_CHANGED`.
6. **Data Minimization & Privacy**: No verification history, location, IP address, timestamp tracking, or analytics are stored or transmitted.

---

## 2. Verification State Machine

```
UNPAIRED ──► PAIRED_UNVERIFIED ──► VERIFICATION_PENDING ──► VERIFIED
                                            │                   │
                                            ▼                   ▼
                                   VERIFICATION_FAILED   IDENTITY_CHANGED
```

- **`UNPAIRED`**: No partner device paired.
- **`PAIRED_UNVERIFIED`**: Device paired via Phase 10, human verification pending.
- **`VERIFICATION_PENDING`**: Safety verification active on user screen.
- **`VERIFIED`**: User explicitly confirmed `MATCH` for the pinned partner identity.
- **`IDENTITY_CHANGED`**: Current partner identity differs from previously verified/pinned key.
- **`VERIFICATION_FAILED`**: User explicitly marked `DOESN'T MATCH` or signature mismatch detected.
- **`TRUST_REMOVED`**: Partner trust or verification record purged.

---

## 3. Storage Forensics & Isolation

- **Storage Location**: IndexedDB (`between-us-identity`, store `partner_verification`).
- **Persisted Payload**: Only `{ id: "partner_verification", schemaVersion: 1, pinnedPartnerFingerprint, verificationStatus }`.
- **Reset Mechanics**: `removePartnerVerification()` and `removePairedPartnerDevice()` purge verification state cleanly without touching the device's own private identity key.
