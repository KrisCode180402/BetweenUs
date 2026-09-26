# Data Classification Matrix — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 03 — Privacy & Data Classification  
**Status**: Approved Specification (Cross-Referenced to [`docs/privacy/data-classification.md`](file:///x:/Between%20Us/docs/privacy/data-classification.md))  

---

## 1. Overview & Classification Hierarchy

The master data classification table for **Between Us** is maintained in [`docs/privacy/data-classification.md`](file:///x:/Between%20Us/docs/privacy/data-classification.md). Data is classified into 6 levels:
* **LEVEL 0 — PUBLIC**: Static PWA app shell assets, hardcoded STUN URIs.
* **LEVEL 1 — LOW SENSITIVITY**: Non-sensitive UI theme preferences, mute button states.
* **LEVEL 2 — PRIVATE**: Public identity keys, paired relationship status, SAS fingerprints.
* **LEVEL 3 — SENSITIVE**: Ephemeral SDP offers/answers, trickle ICE candidate IPs, TURN REST tokens.
* **LEVEL 4 — CRITICAL SECRET**: Private identity keys (`extractable: false`), DTLS-SRTP master keys, live media streams.
* **LEVEL 5 — PROHIBITED PERSISTENT DATA**: Call recordings, call history, analytics logs, server private keys.

---

## 2. Summary Classification Matrix

| DATA | PURPOSE | LOCATION | ACCESS | SENSITIVITY | PERSISTENCE | RETENTION | DELETION | SECURITY REQUIREMENT |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Live Audio Stream** | Real-time voice call | RAM / SRTP Transit | Peer Endpoints | **Level 4** | Ephemeral | Call duration | Automatic on track stop | DTLS-SRTP E2EE, non-recordable |
| **Live Video Stream** | Real-time video call | RAM / SRTP Transit | Peer Endpoints | **Level 4** | Ephemeral | Call duration | Automatic on track stop | DTLS-SRTP E2EE, non-recordable |
| **Device Private Key** | Device identity auth | IndexedDB (`extractable: false`) | Local Browser | **Level 4** | Persistent | Device lifecycle | Manual identity reset | Web Crypto API non-extractable |
| **Device Public Key** | Peer identity verification | IndexedDB / Transit | Peer & Signaling | Level 2 | Semi-Persistent | Paired relationship | Explicit unpair | Cryptographically signed payload |
| **Pairing Code Token** | Out-of-band setup | Signaling RAM | Peer & Signaling | Level 3 | Ephemeral | Max 3 minutes | Immediate on pair/expiry | Cryptographically random, single-use |
| **SAS Fingerprint** | MITM safety check | Client RAM | User UI Display | Level 2 | Ephemeral | Pairing / Call setup | Purged on UI close | HKDF-SHA256 derived from identity keys |
| **SDP Offer / Answer** | WebRTC negotiation | Signaling Transport | Peer & Signaling | Level 3 | Ephemeral | Handshake (<30s) | Immediate after handshake | JSON schema validated, encrypted WSS |
| **ICE Candidates** | Network path discovery | Signaling Transport | Peer & Signaling | Level 3 | Ephemeral | Handshake (<30s) | Immediate after handshake | mDNS candidate masking |
| **TURN REST Token** | Relay authorization | Signaling / Client RAM | Client & Coturn | Level 3 | Ephemeral | Max 15 minutes | Automatic expiration | Short-lived HMAC-SHA-1 token |
| **IndexedDB Storage** | Storing identity & partner | Local Browser | Local PWA Origin | Level 4 | Persistent | Until reset / clearance | Origin storage clearance | W3C origin isolation & non-extractable |

---

## 3. Explicitly Prohibited Data List

```
❌ PROHIBITED APPLICATION-LEVEL DATA
----------------------------------------------------------------------
1. Audio or Video Recordings (Server or Local Disk)
2. Call History / Call Log Databases
3. User Account Databases / Email Addresses / Phone Numbers
4. Private Cryptographic Keys on Server or TURN Relay
5. Media Decryption Keys (SRTP Master Keys) on Server or TURN Relay
6. Analytics / User Behavior Tracking Logs
7. Advertising Data / Device Fingerprinting Identifiers
8. Chat / Text Message Archives
```
