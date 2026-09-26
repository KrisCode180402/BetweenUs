# Future Phase Privacy Compliance Mapping — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 03 — Privacy & Data Classification  
**Status**: Authoritative Privacy Specification  

---

## Mapping Privacy Requirements to Implementation Phases

Every future implementation phase of **Between Us** must satisfy explicit privacy compliance gates defined in Phase 03 before moving to subsequent phases:

```
+-----------------------------------------------------------------------------------+
| PHASE PRIVACY COMPLIANCE GATES                                                     |
|                                                                                   |
| Future Phase                      Mandatory Privacy Compliance Gate               |
| --------------------------------  ----------------------------------------------  |
| Phase 04 (Project Foundation)     Zero telemetry / minimal package footprint      |
| Phase 05 (Browser Security)       Strict CSP, HSTS, Permissions Policy            |
| Phase 07 (PWA Infrastructure)     Service Worker app shell caching ONLY           |
| Phase 08 (Local Storage)          IndexedDB extractable: false key store ONLY     |
| Phase 09 (Device Identity)        Web Crypto Ed25519 non-extractable keys         |
| Phase 10 (Secure Pairing)         3m TTL codes, rate limits, SAS derivation      |
| Phase 12 (Signaling System)       Zero DB, ephemeral RAM, log scrubbing           |
| Phase 13 (Audio Engine)           Zero recording, RAM PCM buffers, auto-stop      |
| Phase 14 (Video Engine)           Zero recording, RAM video frames, auto-stop     |
| Phase 15 (TURN Infrastructure)    15m REST TTL, zero packet logs, relay mode      |
| Phase 17 (Metadata Minimization)  mDNS ICE masking, optional TURN relay mode      |
| Phase 18 (Logging Privacy)        Log sanitizer integration on client & server    |
| Phase 19 (Storage Forensics)      Empirical disk inspection (verify zero writes)  |
| Phase 21 (Zero Retention Engine)  Automated RAM scrub & GC triggers on hangup     |
| Phase 23 (Server Hardening)       Systemd sandboxing, read-only app mounts        |
| Phase 24 (CI/CD & Supply Chain)   Lockfile pinning (`npm ci`), Dependabot audit   |
| Phase 25 (Adversarial Testing)    Penetration testing against privacy invariants  |
+-----------------------------------------------------------------------------------+
```

---

## Phase-by-Phase Compliance Verification Matrix

* **Phase 04 (Project Foundation)**: Verify zero analytics, zero tracking scripts, and zero database drivers in `package.json`.
* **Phase 05 (Browser Security)**: Verify HTTP response headers enforce `Content-Security-Policy: default-src 'none'`, `X-Frame-Options: DENY`, and `Permissions-Policy`.
* **Phase 07 (PWA Infrastructure)**: Verify Service Worker caching rule rejects dynamic WebSocket, WebRTC, SDP, or media blob requests.
* **Phase 08 (Local Storage)**: Audit browser storage wrappers; verify `localStorage` and `sessionStorage` contain zero cryptographic keys or SDP parameters.
* **Phase 09 (Device Identity)**: Verify `window.crypto.subtle.generateKey()` passes `extractable: false`.
* **Phase 10 (Secure Pairing)**: Verify pairing code generator enforces 3-minute TTL and 3-attempt lockout.
* **Phase 12 (Signaling System)**: Verify signaling server runs in Node.js RAM without database connections or persistent file writes.
* **Phase 13 & 14 (Audio & Video Calling)**: Verify `MediaStreamTrack.stop()` is invoked upon call teardown, turning off hardware lights.
* **Phase 15 (TURN Infrastructure)**: Verify `coturn` uses ephemeral HMAC credentials and zero packet logging.
* **Phase 18 (Logging Privacy)**: Verify `sanitizeLogOutput()` filters SDPs, keys, nonces, and IP addresses.
* **Phase 19 (Storage Forensics)**: Inspect client file system during call playback; verify zero `.wav`, `.mp4`, or `.tmp` media files exist on disk.
* **Phase 21 (Zero Retention Engine)**: Verify all transient RAM variables (`sdpOffer`, `iceCandidates`, `turnCredentials`) are set to `null` on teardown.
* **Phase 25 (Adversarial Privacy Testing)**: Execute automated penetration tests asserting 100% compliance with all 15 Privacy Invariants.
