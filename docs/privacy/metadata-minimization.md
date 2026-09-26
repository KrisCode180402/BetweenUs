# Between Us — Data Minimization & Privacy Specification

> **Phase 17 Privacy & Metadata Specification**  
> **Version:** 1.0.0  
> **Status:** Authoritative Data Minimization Rules

---

## 1. The 9-Point Data Minimization Framework

For every data item and metadata element processed by Between Us, the system applies a strict 9-point evaluation rule:

1. **Requirement Check**: Is this metadata item mandatory for real-time WebRTC media, authentication, or connectivity? If NO → **REMOVE IT**.
2. **Security & Cryptography Check**: Is this metadata required for device identity verification or safety checks? If NO → **REMOVE IT**.
3. **Connectivity Check**: Is this metadata required for STUN/TURN NAT traversal? If NO → **REMOVE IT**.
4. **Operation Check**: Is this metadata required for real-time call state management? If NO → **REMOVE IT**.
5. **Ephemerality Enforcement**: Can this data exist exclusively in volatile RAM during active call setup? If YES → **ENFORCE EPHEMERALITY**.
6. **Removal & Purging**: Can this data be purged immediately when the call ends? If YES → **PURGE ON HANGUP**.
7. **Generalization & Obfuscation**: Can addresses or parameters be generalized (e.g. mDNS ICE candidate masking)? If YES → **GENERALIZE**.
8. **Memory Isolation**: Can data remain strictly in memory without hitting browser storage? If YES → **KEEP IN RAM**.
9. **Retention Reduction**: Can logging retention be reduced to minimal operational diagnostics? If YES → **MINIMIZE LOGS**.

---

## 2. Zero-Analytics & Zero-Telemetry Mandate

- **No Third-Party Scripts**: The application bundle includes zero external JavaScript SDKs, tracking pixels, or marketing beacons.
- **No Crash Reporting Services**: Error tracking services (e.g. Sentry, Bugsnag) that upload client metadata to third-party clouds are strictly prohibited.
- **No Network Reporting APIs**: The application does NOT use `navigator.sendBeacon()` or `RTCPeerConnection.getStats()` for analytics reporting.
- **No Fingerprinting**: The application does NOT execute WebGL, Canvas 2D, AudioContext, or screen resolution fingerprinting probes.

---

## 3. Ephemeral Call Session Correlation Isolation

- Each call attempt generates an unpredictable, single-use session ID (`BETWEEN_US_CALL_SESSION_<uuid>`).
- Successive calls between the same paired devices use **independent, uncorrelated** session IDs.
- The system does NOT create a persistent call log or master history record. When a call transitions to `ENDED`, `FAILED`, `TIMED_OUT`, `REJECTED`, or `CANCELLED`, all memory pointers are cleared and no session correlation state remains.

---

## 4. Privacy-Safe Error Handling & Client Hygiene

- User-facing error dialogs and notifications must display generic, privacy-safe descriptions (e.g., *"Connection failed. Please check network setup."*).
- User-facing error messages **MUST NEVER** reveal IP addresses, SDP descriptions, ICE candidates, TURN credentials, server paths, or stack traces.
- Client `console` statements in production bundles are restricted to non-sensitive state notifications. Private keys, SDP offers, ICE candidates, and TURN secrets are NEVER logged.

---

## 5. Technically Defensible User-Facing Privacy Disclosures

Between Us documentation and UI copy must adhere to technically defensible language:

- **Correct**: *"Between Us minimizes application metadata, encrypts media streams end-to-end, and does not store call history or recordings."*
- **Prohibited**: *"Zero metadata"*, *"100% untraceable"*, *"completely anonymous"*, *"unhackable"*, or *"military-grade"*.
