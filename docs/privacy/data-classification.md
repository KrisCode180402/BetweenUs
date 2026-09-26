# Master Data Classification Framework — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 03 — Privacy & Data Classification  
**Status**: Authoritative Privacy Specification  

---

## 1. Data Classification Levels

**Between Us** establishes a 6-tier data classification hierarchy to dictate security, handling, and storage controls across all system data:

* **LEVEL 0 — PUBLIC**: Non-sensitive static resources, hardcoded STUN server URLs, static PWA app shell assets.
* **LEVEL 1 — LOW SENSITIVITY**: Non-sensitive client preferences (UI theme mode, mute button toggle state).
* **LEVEL 2 — PRIVATE**: Public identity keys (Base64 SPKI), partner SAS fingerprints, paired relationship flags. Exposure carries low security risk but must be protected against tampering.
* **LEVEL 3 — SENSITIVE**: Ephemeral SDP offers/answers, trickle ICE candidate IPs, short-lived TURN REST tokens, pairing codes. Exposure could assist network tracking or connection disruption.
* **LEVEL 4 — CRITICAL SECRET**: Private identity cryptographic keys (`extractable: false`), DTLS-SRTP master keys, active live audio/video media streams. Unintended exposure destroys confidentiality guarantees.
* **LEVEL 5 — PROHIBITED PERSISTENT DATA**: Call recordings, call history databases, user account records, analytics logs, server-side private keys. **STRICTLY PROHIBITED FROM PERSISTENCE.**

---

## 2. Master Data Classification Table

| DATA ITEM | CATEGORY | PURPOSE | SENSITIVITY | CREATED BY | LOCATION | ACCESSIBLE BY | PROCESSING | ENCRYPTION | PERSISTENCE | MAX LIFETIME | DELETION EVENT | SERVER ACCESS | LOGGING ALLOWED | BACKUP ALLOWED | PROHIBITED? | SECURITY NOTES |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Live Audio Stream** | A. Audio | Voice call stream | **Level 4** | Mic / Browser | RAM / SRTP Transit | Peer Browser | Real-time playback | DTLS-SRTP E2EE | Ephemeral | Call duration | Call termination | Zero | No | No | No | Never persisted to disk |
| **Live Video Stream** | B. Video | Video call stream | **Level 4** | Cam / Browser | RAM / SRTP Transit | Peer Browser | Real-time playback | DTLS-SRTP E2EE | Ephemeral | Call duration | Call termination | Zero | No | No | No | Never persisted to disk |
| **Private Identity Key** | C. Identity | Signing handshake | **Level 4** | Web Crypto | IndexedDB | Local Browser | Signature creation | Non-extractable | Persistent | Device lifetime | Identity reset | Zero | No | No | No | `extractable: false` |
| **Public Identity Key** | C. Identity | Peer authentication | **Level 2** | Web Crypto | IndexedDB / Transit | Peer & Signaling | Signature check | Signed payload | Persistent | Paired lifetime | Unpair action | Transit only | No | No | No | Signed by identity key |
| **Pairing Code Token** | D. Pairing | Out-of-band setup | **Level 3** | Signaling | Signaling RAM | Peer & Signaling | Code matching | TLS 1.3 Transport | Ephemeral | Max 3 minutes | Pair / Timeout | Routing only | No | No | No | 3-minute TTL, single-use |
| **SAS Safety Fingerprint** | E. Verification | MITM protection | **Level 2** | HKDF-SHA256 | Client RAM | User UI Display | Visual comparison | Local derivation | Ephemeral | Pairing setup | UI closure | Zero | No | No | No | User visual check |
| **SDP Offer / Answer** | F. WebRTC | WebRTC parameter setup | **Level 3** | Peer Browser | RAM / Signaling | Peer & Signaling | Session setup | Signed payload | Ephemeral | Handshake (<30s) | Peer handshake | Routing only | No | No | No | Purged post-handshake |
| **ICE Candidates** | F. WebRTC | Socket path discovery | **Level 3** | Peer Browser | RAM / Signaling | Peer & Signaling | Candidate check | TLS 1.3 Transport | Ephemeral | Handshake (<30s) | Peer handshake | Routing only | No | No | No | mDNS masked where possible |
| **TURN Credentials** | G. Session | TURN allocation | **Level 3** | Next.js API HMAC | Client RAM / Coturn | Client & Coturn | Relay auth | HMAC Signature | Ephemeral | Max 10 minutes | Expiration / Hangup | Signer only | No | No | No | Short TTL (10m), HMAC-SHA1 |
| **Coturn Operational Logs** | H. Metadata | Network routing diagnostics | **Level 3** | Coturn Daemon | VPS Volatile Log | VPS Server Admin | Traffic auditing | Minimal simple-log | Log file | Max 7 days | Log rotation | Host Admin only | Minimal network metadata | No | No | No audio, video, or WebRTC keys logged |
| **Client IP Address** | H. Metadata | Socket routing | **Level 3** | Host Network | Socket Headers | Edge & Servers | IP routing | TLS Header | Ephemeral | Socket duration | Disconnect | Header processing | Anonymized | No | No | Relayed via TURN |
| **Ephemeral Signaling Msg** | F. WebRTC | Temporary SDP/ICE relay | **Level 3** | Signaling Client | Server Volatile RAM | Peer & Signaling | Envelope routing | TLS 1.3 / WSS | Ephemeral | Max 5 minutes | Disconnect / Expire | Routing only | No | No | No | Zero disk persistence |
| **Ephemeral Call Session State** | G. Session | Active call lifecycle state | **Level 3** | CallStateMachine | Client Volatile RAM | Client Manager | Lifecycle tracking | In-memory Object | Ephemeral | Call duration | Call termination | Zero | No | No | No | Zero disk persistence, wiped on hangup |
| **Call Recording File** | **Prohibited** | N/A | **Level 5** | N/A | N/A | N/A | N/A | N/A | **PROHIBITED** | 0 seconds | Immediate rejection | N/A | No | No | **YES** | Prohibited facility |
| **Call History DB** | **Prohibited** | N/A | **Level 5** | N/A | N/A | N/A | N/A | N/A | **PROHIBITED** | 0 seconds | Immediate rejection | N/A | No | No | **YES** | Prohibited facility |
| **Analytics Telemetry** | **Prohibited** | N/A | **Level 5** | N/A | N/A | N/A | N/A | N/A | **PROHIBITED** | 0 seconds | Immediate rejection | N/A | No | No | **YES** | Prohibited facility |

---

## 3. Application Logging Rules & Level 5 Rules

### 3.1 Prohibited From Application-Controlled Logging
Under the `BETWEEN_US_LOGGING_V1` specification, the following Level 3, Level 4, and Level 5 data elements are strictly prohibited from being written to application-controlled logs (client `console` or server `stdout`):

1. **SDP Offers / Answers & Session Descriptions** (Redacted as `"[REDACTED_SDP_OR_CANDIDATE]"`)
2. **ICE Candidates & IP/Port Tuples** (Redacted as `"[REDACTED_FOR_PRIVACY]"`)
3. **Private Identity Cryptographic Keys** (Redacted as `"[REDACTED_PRIVATE_KEY]"`)
4. **Pairing Secrets, Pre-Shared Keys & Passphrases** (Redacted as `"[REDACTED_FOR_PRIVACY]"`)
5. **TURN Shared Secrets & REST Credentials** (Redacted as `"[REDACTED_FOR_PRIVACY]"`)
6. **Authentication Tokens, Authorization Headers, & Cookies** (Redacted as `"[REDACTED_FOR_PRIVACY]"`)
7. **Audio / Video Media Stream Buffers & Recordings** (Strictly excluded)

### 3.2 Automated Enforcement & Redaction
`AppLogger` (`lib/privacy/logger.ts`) and `SignalingLogger` (`server/signaling/logger.ts`) automatically scan, intercept, and redact prohibited parameters prior to output stream dispatch.

---

## 4. Forensic Storage Verification & Residual Lifecycle Controls

Under the Phase 19 (`BETWEEN_US_FORENSICS_V1`) specification, storage verification rules enforce the following lifecycle controls across all data items:

| DATA ITEM | STORAGE TYPE | MAX LIFETIME | CLEANUP TRIGGER | FORENSIC VERIFICATION PASS CONDITION |
| :--- | :--- | :--- | :--- | :--- |
| **Live Audio Stream** | Ephemeral RAM | Call duration | Call termination (`track.stop()`) | Zero `MediaRecorder` or audio buffer instances |
| **Live Video Stream** | Ephemeral RAM | Call duration | Call termination (`track.stop()`) | Zero video frame or canvas snapshot instances |
| **SDP Offer / Answer** | Ephemeral RAM | Handshake (<30s) | Peer handshake complete | Absent from `localStorage`, `IndexedDB`, `sessionStorage` |
| **ICE Candidates** | Ephemeral RAM | Handshake (<30s) | Peer handshake complete | Absent from `localStorage`, `IndexedDB`, `sessionStorage` |
| **TURN Credentials** | Ephemeral RAM | Max 10 minutes | Expiration / Hangup | Excluded from Service Worker `CacheStorage` |
| **Private Identity Key** | IndexedDB (`between-us-identity`) | Device lifetime | Identity destruction | `extractable: false`, non-exportable keypair |
| **Public Partner Key** | IndexedDB (`between-us-partners`) | Paired lifetime | Unpair action | Public SPKI string only; zero private keys |

---

## 5. Cryptographic Key Sensitivity & Lifecycle Classification

Under the Phase 20 (`BETWEEN_US_CRYPTO_REVIEW_V1`) specification, cryptographic key material is categorized according to strict storage, usage, and extractability constraints:

| KEY ITEM | ALGORITHM | SENSITIVITY LEVEL | EXTRACTABLE? | STORAGE MECHANISM | LIFETIME | DELETION EVENT |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Device Private Key** | ECDSA P-256 | **Level 4** (Critical Secret) | **NO** (`extractable: false`) | IndexedDB (`between-us-identity`) | Device Lifetime | `destroyDeviceIdentity()` |
| **Device Public Key** | Base64 SPKI | **Level 2** (Private Data) | **YES** (Public Metadata) | IndexedDB / Memory | Device Lifetime | `destroyDeviceIdentity()` |
| **Partner Public Key** | Base64 SPKI | **Level 2** (Private Data) | **YES** (Public Metadata) | IndexedDB (`between-us-partners`) | Relationship Lifetime | `removePartner()` |
| **Pairing Nonce / Challenge** | CSPRNG 256-bit | **Level 3** (Sensitive) | N/A (RAM Buffer) | Ephemeral RAM | Handshake (<5m) | Session Completion |
| **TURN Shared Secret** | HMAC-SHA1 | **Level 4** (Critical Secret) | N/A (Server Env) | Node.js Process Environment | Deployment Lifetime | Server Shutdown |
| **TURN REST Password** | HMAC-SHA1 Digest | **Level 3** (Sensitive) | N/A (RAM Buffer) | Ephemeral Client RAM | Max 10 minutes | Expiration / Hangup |
| **DTLS-SRTP Media Key** | AES-GCM 128/256 | **Level 4** (Critical Secret) | **NO** (Browser Managed) | Browser WebRTC Stack | Call Session Duration | Call Teardown (`pc.close()`) |

---

## 6. Zero-Retention Cleanup Triggers & Ephemeral Expiration Rules

Under the Phase 21 (`BETWEEN_US_ZERO_RETENTION_V1`) specification, all Level 3 and Level 4 ephemeral call data are governed by strict zero-retention triggers:

1. **Call Teardown Execution**: Invoking `cleanupCallSession()` halts all active media tracks, closes RTCPeerConnections, and invalidates session references.
2. **Session Invalidation**: Setting `sessionRef.currentSessionId = null` ensures asynchronous callbacks from prior call sessions cannot resurrect state or corrupt new sessions.
3. **Storage Isolation**: Browser persistent storage (IndexedDB, localStorage, sessionStorage, CacheStorage) is strictly forbidden from persisting call media, SDP, ICE candidates, or call duration logs.
4. **Honest Boundary Acknowledgment**: While application references are purged, system memory garbage collection, OS virtual memory paging, and hardware flash controllers operate below browser JS application control.

---

## 7. Privacy Mode & Emergency Exit Data Persistence Rules

Under the Phase 22 (`BETWEEN_US_PRIVACY_MODE_V1`) specification:

1. **Zero New Persistent Storage**: Privacy Mode activation, emergency exit events, and state machine transitions introduce 0 new keys into `localStorage`, `sessionStorage`, `IndexedDB`, or `CacheStorage`.
2. **Zero Activity Logging**: Activating Privacy Mode or Emergency Exit does NOT create persistent user activity logs, analytics metrics, or call duration records.
3. **Storage Forensics Compliance**: Storage forensics audits after Emergency Exit verify zero retained session data or call remnants.

---

## 8. Infrastructure Metadata Visibility & Edge Security Rules

Under the Phase 23 (`BETWEEN_US_INFRASTRUCTURE_HARDENING_V1`) specification:

1. **Cloudflare Edge Visibility**: Cloudflare observes TLS SNI, HTTP headers, request IP addresses, and encrypted edge packet counts. It cannot observe WebRTC audio/video payload content.
2. **Vercel Serverless Visibility**: Vercel receives static PWA asset requests and dynamic TURN credential REST requests. It receives 0 WebRTC media streams and logs 0 SDP offers/answers or ICE candidate tuples.
3. **Signaling VPS Visibility**: Node.js signaling daemon receives ephemeral WebSocket JSON messages (SDP offers/answers, ICE candidate IPs). Payloads exist strictly in volatile RAM and are zero-persisted to disk.
4. **Coturn TURN VPS Visibility**: Coturn daemon receives relayed DTLS-SRTP WebRTC packets. It relays encrypted payloads but possesses 0 media decryption keys. Log retention is capped at max 7 days of network connection metadata.

---

## 9. CI/CD & Build Pipeline Data Non-Retention Rules

Under the Phase 24 (`BETWEEN_US_SUPPLY_CHAIN_SECURITY_V1`) specification:

1. **Zero Media Data in CI/CD**: CI/CD pipelines, build runner environments, and static artifact outputs are strictly forbidden from receiving, generating, or caching audio streams, video frames, call recordings, or partner relationship metadata.
2. **Zero Secret Persistence in Artifacts**: Static build outputs (`.next/static/`) are audited during CI compilation to verify 0 server environment secrets (`TURN_SHARED_SECRET`, private keys) are persisted in client assets.
3. **Runner Ephemeral Memory**: GitHub-hosted CI runner environments are ephemeral; all build memory and temporary files are destroyed immediately upon job completion.
