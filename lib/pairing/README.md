# Ephemeral Pairing Module (`lib/pairing`)

## Overview
Phase 10 implements the secure, out-of-band device pairing engine for **Between Us**.

The pairing protocol establishes mutual, authenticated cryptographic trust between two device identities (`ECDSA` P-256) without exposing private keys, without relying on central server trust for authentication, and with strict MITM/replay protection.

## Architectural & Security Invariants
- **Protocol Version:** `BETWEEN_US_PAIRING_V1`
- **Domain Separation:** Protocol signatures enforce prefix `BETWEEN_US_PAIRING_V1:RESP:` (Responder) and `BETWEEN_US_PAIRING_V1:CONF:` (Initiator).
- **Challenge Entropy:** 32 cryptographically random bytes (`crypto.getRandomValues()`) generated for `challengeA` and `challengeB`.
- **Session Expiration:** Invitations expire after 5 minutes (300,000 ms).
- **Dual User Confirmation:** Pairing requires explicit confirmation (`confirmPairing()`) from both participants after reviewing peer fingerprints.
- **Isolated Partner Trust Storage:** Partner public identity is persisted in a dedicated IndexedDB store (`between-us-identity`, store `partner_trust`) isolated from generic application state (`between-us-local`) and the device's own private identity key.
- **Reset Capability:** `removePairedPartnerDevice()` purges partner trust records without affecting the device's own identity key pair.
