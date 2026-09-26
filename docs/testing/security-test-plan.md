# Security Test Plan — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 01 — Security Foundation & Threat Model  
**Status**: Approved Testing Strategy Specification  

---

## 1. Unit Security Tests

### 1.1 Cryptographic Wrappers & Key Management
* **Test ID-01**: Verify identity key generation creates `extractable: false` keys in IndexedDB.
* **Test ID-02**: Verify raw private key export attempts fail with `DOMException` / `NotAllowedError`.
* **Test ID-03**: Verify Ed25519 signature generation and verification across valid and tampered payloads.
* **Test ID-04**: Verify HKDF-SHA256 SAS derivation produces identical 8-character hex strings regardless of public key order input ($K_A, K_B$ vs $K_B, K_A$).

### 1.2 Input Validation & State Machines
* **Test VAL-01**: Validate JSON schema parser rejects WebSocket frames missing required headers (`nonce`, `timestamp`, `signature`).
* **Test VAL-02**: Validate JSON schema parser rejects payloads containing unauthorized extra properties (`additionalProperties: false`).
* **Test ST-01**: Validate call state machine transitions strictly along permitted paths (`IDLE` → `CONNECTING` → `CONNECTED` → `ENDING` → `DESTROYING` → `IDLE`). Illegal state transitions (e.g. `IDLE` → `CONNECTED`) must trigger immediate state reset.

---

## 2. Integration Security Tests

### 2.1 Ephemeral Pairing & Key Exchange
* **Test PAIR-01**: Execute end-to-end pairing handshake; verify paired public keys are stored in IndexedDB.
* **Test PAIR-02**: Verify pairing code expiration (code submitted after 3 minutes is rejected with `EXPIRED_CODE`).
* **Test PAIR-03**: Verify pairing attempt lockout after 3 consecutive invalid code submissions.

### 2.2 WebRTC Lifecycle & Zero-Retention Memory Cleanup
* **Test CLEAN-01**: Initiate call, transmit media, invoke hangup; verify `RTCPeerConnection.signalingState` transitions to `closed`.
* **Test CLEAN-02**: Verify all `MediaStreamTrack` instances have `readyState === 'ended'` post-hangup.
* **Test CLEAN-03**: Verify ephemeral RAM session objects (SDP strings, ICE candidate arrays) are garbage collected and set to `null` post-call.

---

## 3. Browser Security & Storage Isolation Tests

### 3.1 HTTP Security Headers & Content Security Policy
* **Test CSP-01**: Execute Automated Playwright test inspecting response headers; assert `Content-Security-Policy` contains `frame-ancestors 'none'` and disallows `'unsafe-inline'`.
* **Test CSP-02**: Verify application loaded inside an `<iframe>` is blocked by browser frame policy.
* **Test PERM-01**: Verify `Permissions-Policy` header explicitly disables `geolocation`, `display-capture`, and `payment`.

### 3.2 Storage Isolation Audits
* **Test STOR-01**: Inspect `localStorage` and `sessionStorage` post-call; assert zero private keys, session tokens, or SDP parameters exist.
* **Test STOR-02**: Audit IndexedDB object stores; assert only `identityKeyPair` and `pairedPeer` entries exist.
* **Test CACHE-01**: Audit Service Worker Cache Storage; assert zero dynamic WebSocket frames or audio/video blobs are present.

---

## 4. Penetration & Security Resilience Tests

### 4.1 Replay & Anti-Brute-Force Attacks
* **Test PEN-01 (Replay)**: Capture valid signed signaling envelope, resend exact payload after 40 seconds; assert server rejects frame (`TIMESTAMP_OUT_OF_BOUNDS`).
* **Test PEN-02 (Replay Nonce)**: Re-send valid envelope within 5 seconds with duplicate `nonce`; assert server rejects frame (`NONCE_REPLAY_DETECTED`).
* **Test PEN-03 (Brute Force)**: Automate 100 pairing code submissions per second; assert socket drops after 3 attempts.

### 4.2 Identity Substitution & MITM Attacks
* **Test PEN-04 (MITM Identity)**: Intercept signaling SDP Offer, replace Sender Public Key with attacker key; assert recipient signature check fails (`SIGNATURE_INVALID`).
* **Test PEN-05 (Key Change Warning)**: Modify stored public key of paired peer in IndexedDB to simulate identity substitution; assert application displays warning banner and blocks connection.

---

## 5. Privacy & Data Leakage Tests

* **Test PRIV-01 (Log Audit)**: Scan client console logs during active call; assert zero cryptographic key material, SDP payloads, or audio/video frame data are logged.
* **Test PRIV-02 (Server Log Scrub)**: Inspect signaling server stdout; verify logs contain only high-level connection events stripped of IP addresses and payload text.
* **Test PRIV-03 (Media Leakage)**: Intercept host OS file system activity during call; assert zero temporary `.wav`, `.mp4`, or `.tmp` media buffer files are written to disk.

---

## 6. Infrastructure & Supply-Chain Hardening Tests

* **Test INF-01 (TURN Credential Expiry)**: Request TURN credentials; attempt relay authentication after 16 minutes; assert coturn rejects connection (`401 Unauthorized`).
* **Test INF-02 (TLS Configuration)**: Test signaling and TURN domain SSL labs rating; assert A+ score with TLS 1.3 enforced and weak ciphers disabled.
* **Test SUP-01 (Dependency Audit)**: Run `npm audit --audit-level=high` in CI/CD pipeline; assert zero high/critical vulnerabilities.
* **Test SUP-02 (Lockfile Pinning)**: Assert `package-lock.json` hash matches expected integrity signature in GitHub Actions build step.

---

## 7. Security Testing Matrix Summary

| Test Domain | Automation Framework | Execution Frequency | Target Pass Criteria |
| :--- | :--- | :--- | :--- |
| **Unit Crypto & Schemas** | Vitest / Web Crypto API | Every Git Commit / PR | 100% Pass / 100% Coverage |
| **Integration Teardown** | Vitest / Mock WebRTC | CI/CD Pipeline | Zero memory leaks / Clean teardown |
| **Browser Security (CSP/Storage)** | Playwright E2E | CI/CD Pre-Deploy | Zero policy violations |
| **Security & Replay** | Custom Fuzzing Scripts | Weekly / Pre-Release | 0 successful replays / rate limits enforced |
| **Privacy & Leakage** | Memory & Disk Audit Scripts | Pre-Release | Zero disk writes / clean logs |
| **Infrastructure & TURN** | SSL Labs API / Coturn CLI | Monthly / Post-Deploy | A+ SSL / Credentials expire strictly |
| **Supply-Chain** | GitHub Actions / Dependabot | Daily Automated Run | 0 Vulnerabilities |
