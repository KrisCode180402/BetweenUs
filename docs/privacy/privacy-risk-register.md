# Privacy Risk Register — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 03 — Privacy & Data Classification  
**Status**: Authoritative Privacy Specification  

---

## Comprehensive Privacy Risk Matrix

| Risk ID | Privacy Risk Description | Impact | Likelihood | Affected Data | Trust Boundary | Technical Mitigation Strategy | Residual Privacy Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PR-01** | **Browser Cache Leakage**: Service Worker caches dynamic signaling or media state | High | Low | SDP offers, ICE candidates, tokens | Device ↔ Browser | Strict Service Worker cache filtering; static PWA app shell assets only | Zero dynamic data cached in Service Worker |
| **PR-02** | **IndexedDB Key Theft**: Rogue script extracts private identity key from local origin | Critical | Low | Private Identity Key (Ed25519) | Browser Origin | Web Crypto API `extractable: false` flag; strict CSP (`script-src 'self'`) | Key cannot be exported via JS APIs |
| **PR-03** | **Infrastructure Log Leakage**: Signaling VPS logs raw SDP offers containing IPs & nonces | Medium | Medium | SDP offers, ICE candidates, IPs | Signaling VPS | Automated log sanitizer filter (`sanitizeLogOutput`); 24h rolling logrotate | High-level metrics logged only |
| **PR-04** | **Peer IP Disclosure**: Direct P2P WebRTC socket reveals public IP address to peer | Medium | High | Public IP Address | User A ↔ User B | Forced TURN relay mode option to mask direct client IP sockets | Relayed mode adds minor latency |
| **PR-05** | **TURN Metadata Inspection**: Coturn host inspects packet volume & call duration | Low | Medium | Packet volume, timing, relay IPs | Browser ↔ TURN | End-to-end SRTP encryption; coturn zero packet logging configuration | Network packet timing visible to relay host |
| **PR-06** | **Compromised Delivery Edge**: Vercel/Cloudflare compromise serves backdoored JS | Critical | Low | App JS Bundle, Web Crypto | Browser ↔ CDN | Service Worker app shell caching; Subresource Integrity (SRI); strict CSP | CDN compromise before first SW install |
| **PR-07** | **Malicious Dependency**: Compromised npm package exfiltrates DOM/session state | High | Medium | UI State, Session tokens | CI/CD ↔ Build | Minimal dependency policy; lockfile pinning (`npm ci`); Dependabot audits | Supply-chain risk minimized |
| **PR-08** | **Partner Screen Capture**: Paired recipient secretly records screen or films display | Critical | Medium | Decrypted Video/Audio | Physical / Partner | Cryptographic boundary non-claim; explicit user warning documentation | Physical recording cannot be software blocked |
| **PR-09** | **Host OS Malware / RAT**: Malware on endpoint records PCM audio or hooks camera | Critical | Low | Audio/Video streams, RAM | Host OS ↔ Browser | Explicit security boundary non-claim; endpoint security prerequisites | Endpoint compromise invalidates app E2EE |
| **PR-10** | **Browser Extension Tap**: Malicious browser extension injects scripts into DOM | High | Medium | Unencrypted DOM state | Host OS ↔ Browser | Strict CSP headers; origin storage isolation; native Web Crypto | Malicious browser extension running in host |
| **PR-11** | **Third-Party Telemetry**: Accidental inclusion of third-party analytics script | High | Low | User IP, User-Agent, behavior | Browser ↔ External | CI/CD build rule failing builds on external analytics imports | Zero telemetry SDKs permitted |
| **PR-12** | **Accidental Disk Persistence**: WebAudio buffers write swap files to host disk | Medium | Low | Audio PCM buffers | Host OS ↔ RAM | In-memory WebAudio processing; short buffer frames (10-20ms) | OS memory paging swap file |
| **PR-13** | **Pairing Code Brute Force**: Attacker guesses 6-digit numeric pairing code | High | Medium | Pairing handshake | Browser ↔ Signaling | 3-minute TTL; 3 failed attempt lockout per IP; out-of-band SAS check | Code expires rapidly |
| **PR-14** | **Identity Substitution**: MITM signaling server substitutes public key during pairing | Critical | Medium | Public Identity Key | Browser ↔ Signaling | Mandatory out-of-band SAS fingerprint (HKDF-SHA256) visual/verbal check | Failure to visually verify SAS |
| **PR-15** | **Expired Session Token Use**: Attacker reuses old signaling/TURN credential | Medium | Low | Signaling socket, TURN relay | Browser ↔ Server | Short TTL enforcement (3m pairing, 15m TURN); anti-replay nonces | Invalid token rejected immediately |
| **PR-16** | **Unsanitized Error Logs**: Exception handler logs sensitive payload objects | Medium | Low | Error trace, tokens | Client / Server Log | Strict error sanitization wrappers filtering payload keys | Error messages scrubbed |
| **PR-17** | **Backup Data Exfiltration**: Server backup script archives active RAM dumps | High | Low | Signaling RAM state | Server ↔ Backup | Prohibited backup scripts on signaling/TURN VPS; zero DB backups | Backup limited to git repository |
| **PR-18** | **Unmatched Identity Silently Accepted**: App auto-accepts changed peer identity key | Critical | Low | Identity Trust | Client ↔ Client | Mandatory fail-closed state on identity change; red alert banner | Requires explicit SAS re-pairing |
