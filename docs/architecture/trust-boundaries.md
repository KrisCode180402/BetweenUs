# Explicit Trust Boundaries — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 02 — Final System & Trust Architecture  
**Status**: Approved Specification  

---

## 1. System Trust Boundary Map

```
  +-----------------------------------------------------------------------------------------+
  |                                   DEVELOPMENT & CI/CD                                   |
  |  [ Developer ] ===(Push)===> [ GitHub ] ===(Trigger)===> [ GitHub Actions ]             |
  |                                                                 │ (Boundary H)          |
  +----------------------------------------------------------------─┼-----------------------+
                                                                    ▼
  +-----------------------------------------------------------------------------------------+
  |                                   CLOUD INFRASTRUCTURE                                  |
  |  [ Vercel Serverless ] <===(Boundary D)===> [ Cloudflare Edge ]                         |
  +--------------------------------------------------▲--------------------------------------+
                                                     │ (Boundary E)
  +--------------------------------------------------┴--------------------------------------+
  |                                   USER DEVICE A                                         |
  |  [ Host Operating System ] <===(Boundary A)===> [ Browser Origin (PWA Context) ]        |
  +-----------------------▲--------------------------▲--------------------------------------+
                          │                          │
              (Boundary F)│              (Boundary B)│ (Boundary C)
       Direct Media P2P   │                          │              coturn Relay
                          ▼                          ▼                   ▼
  +-------------------------------+     +--------------------+   +---------------------+
  | USER DEVICE B                 |     | SIGNALING VPS      |   | TURN RELAY VPS      |
  | [ Browser Origin (PWA Context)|     | Node.js WebSocket  |   | coturn Daemon       |
  +-------------------------------+     +--------------------+   +---------------------+
```

---

## 2. Comprehensive Boundary Analysis Matrix

### Boundary A: User Device ↔ Browser / PWA Origin Context
* **Trust Level**: **Trusted Core (TCB)**.
* **Data Crossing**: DOM events, camera/microphone hardware streams, IndexedDB key transactions, Web Crypto execution.
* **Security Mechanism**: W3C same-origin policy, browser permission prompts (`getUserMedia`), `extractable: false` WebCrypto key storage.
* **Attack Possibilities**: Host OS malware, keyloggers, rogue browser extensions, malicious physical access.
* **Expected Mitigation**: Out of application scope; clear warning documentation regarding endpoint security limits.

### Boundary B: Browser / PWA ↔ Node.js Signaling Server
* **Trust Level**: **Untrusted for Content / Limited Trust for Transport**.
* **Data Crossing**: JSON signaling envelopes (pairing codes, public keys, SDP offers/answers, trickle ICE candidates).
* **Security Mechanism**: WSS (TLS 1.3), payload Ed25519 cryptographic signatures, anti-replay nonces.
* **Attack Possibilities**: Compromised signaling server attempting SDP manipulation or MITM identity substitution.
* **Expected Mitigation**: Out-of-band SAS fingerprint verification between users; zero media decryption keys sent to signaling.

### Boundary C: Browser / PWA ↔ coturn TURN Relay Server
* **Trust Level**: **Untrusted for Content / Relayed Transport Only**.
* **Data Crossing**: Encrypted SRTP audio/video UDP packets, STUN binding frames, TURN allocation requests.
* **Security Mechanism**: WebRTC DTLS-SRTP end-to-end payload encryption; ephemeral HMAC-SHA-1 REST API credentials (15m TTL).
* **Attack Possibilities**: Relayed packet inspection, packet dropping, traffic volume analysis at coturn VPS.
* **Expected Mitigation**: coturn has zero access to DTLS handshakes or SRTP master keys; zero packet logging configuration.

### Boundary D: Browser / PWA ↔ Vercel Frontend Serverless Origin
* **Trust Level**: **Limited Infrastructure Trust**.
* **Data Crossing**: HTTP GET requests for static PWA bundles (HTML, JS, CSS, icons, manifest), response headers.
* **Security Mechanism**: HTTPS (TLS 1.3), Subresource Integrity (SRI), Service Worker offline app shell caching.
* **Attack Possibilities**: Compromised Vercel deployment serving backdoored frontend JavaScript.
* **Expected Mitigation**: PWA Service Worker caching reduces dynamic bundle fetches; strict CSP headers enforce script origins.

### Boundary E: Browser / PWA ↔ Cloudflare Edge (DNS / WAF / TLS)
* **Trust Level**: **Limited Edge Security Perimeter**.
* **Data Crossing**: DNS queries, TLS SNI handshake, HTTP request/response headers, WAF threat scoring.
* **Security Mechanism**: Cloudflare DDoS mitigation, Strict HSTS (`max-age=63072000`), edge TLS termination.
* **Attack Possibilities**: Cloudflare Worker script tampering or edge TLS certificate compromise.
* **Expected Mitigation**: Minimal edge logic; zero application secrets hosted on Cloudflare edge.

### Boundary F: User Device A ↔ User Device B (Direct WebRTC Media)
* **Trust Level**: **End-to-End Encrypted Media Channel**.
* **Data Crossing**: Real-time audio and video media streams (Opus/VP8/AV1), RTCP status frames.
* **Security Mechanism**: Direct P2P UDP sockets encrypted via DTLS-SRTP (AES-GCM / AES-CTR).
* **Attack Possibilities**: Direct peer IP address disclosure to network observers; partner endpoint screen recording.
* **Expected Mitigation**: Optional forced TURN mode to obfuscate IP addresses; explicit non-claim regarding partner screen capture.

### Boundary G: GitHub ↔ GitHub Actions CI/CD Pipeline
* **Trust Level**: **High Supply-Chain Trust**.
* **Data Crossing**: Git commits, pull requests, automated workflow scripts, npm dependency downloads.
* **Security Mechanism**: GitHub branch protection rules, mandatory code reviews, automated `npm audit` dependency checks.
* **Attack Possibilities**: Malicious npm package injection, compromised CI/CD workflow script, secret exfiltration.
* **Expected Mitigation**: Lockfile pinning (`package-lock.json`), minimal third-party dependencies, strict secret scoping.

### Boundary H: CI/CD Pipeline ↔ Vercel Deployment Endpoint
* **Trust Level**: **High Deployment Trust**.
* **Data Crossing**: Compiled static assets, deployment tokens, Vercel environment variables.
* **Security Mechanism**: Encrypted GitHub Actions secrets store, restricted scoped Vercel deployment tokens.
* **Attack Possibilities**: Stolen deployment token allowing unauthorized static bundle publishing.
* **Expected Mitigation**: Ephemeral deployment tokens with automated rotation; audit logs enabled on Vercel.
