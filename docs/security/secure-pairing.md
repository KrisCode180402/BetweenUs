# Secure Device Pairing Security Specification

## Executive Summary
This document defines the cryptographic pairing protocol, state machine, proof-of-possession, domain separation, replay protection, and security boundaries for **Between Us**.

The pairing protocol establishes mutual, cryptographically authenticated trust between exactly two device identities without exposing private keys, without placing trust in central servers for identity authentication, and with strict protection against Man-in-the-Middle (MITM) and replay attacks.

---

## 1. Security Goals
1. **Mutual Device Identity Authentication:** Device A learns and verifies Device B's authentic public identity, and vice versa.
2. **Proof-of-Possession:** Each participant proves possession of their non-extractable ECDSA P-256 private identity key using fresh, unpredictable 32-byte challenges.
3. **Private Key Confidentiality:** Private keys are **never** transmitted over network calls or exposed to the UI.
4. **Replay & Reflection Protection:** Sessions use unique 128-bit session IDs, 256-bit challenge entropy, role separation (`INITIATOR` vs `RESPONDER`), and domain-separated signatures.
5. **Explicit Dual User Confirmation:** Trust is established only when both users review the peer public fingerprint and explicitly confirm pairing.

---

## 2. Pairing State Machine & Transitions
```
IDLE ──► CREATING_INVITATION ──► WAITING_FOR_PEER ──► PEER_DETECTED
                                                           │
                                                           ▼
AWAITING_USER_CONFIRMATION ◄── AUTHENTICATING ◄── EXCHANGING_IDENTITIES
            │
            ▼
        FINALIZING ──► PAIRED
```
- **Terminal Failure States:** `CANCELLED`, `EXPIRED`, `FAILED`. Any failure cleanly invalidates temporary session secrets and resets state.

---

## 3. Cryptographic Challenge-Response & Domain Separation
- **Domain Separation Prefix:** `BETWEEN_US_PAIRING_V1:`
- **Responder Signature Payload (`signatureB`):**
  ```
  BETWEEN_US_PAIRING_V1:RESP:<sessionId>:<challengeA>:<initiatorFingerprint>:<responderFingerprint>
  ```
- **Initiator Signature Payload (`signatureA`):**
  ```
  BETWEEN_US_PAIRING_V1:CONF:<sessionId>:<challengeB>:<initiatorFingerprint>:<responderFingerprint>
  ```

---

## 4. Threat & Attack Model Protections

### Man-in-the-Middle (MITM) & Server Compromise Model
- Transport TLS (HTTPS/WSS) protects network integrity to the server.
- End-to-end cryptographic challenge-response authentication ensures that even if a signaling server is fully compromised, an attacker cannot substitute their own identity without triggering signature verification failure or fingerprint mismatch during dual user confirmation.

### Replay & Reflection Protection
- Session IDs (128-bit random) and challenges (256-bit random) are fresh for every pairing attempt.
- Role binding (`RESP` vs `CONF`) prevents an attacker from reflecting an initiator's signature back as a responder's response.
- Self-pairing and identity reflection are explicitly rejected.

---

## 5. Storage Isolation & Reset Mechanics
- **Partner Trust Store:** Persisted in IndexedDB (`between-us-identity`, store `partner_trust`).
- **Data Minimization:** Stores only partner public identity SPKI hex, SHA-256 fingerprint, and timestamp (`pairedAt`).
- **Reset Capability:** `removePairedPartnerDevice()` purges partner trust records while keeping the device's own private identity key intact.
