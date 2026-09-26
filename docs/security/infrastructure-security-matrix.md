# Infrastructure Security Matrix — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 23 — Infrastructure Security Matrix  
**Status**: Authoritative Reference Matrix  

---

## Final Infrastructure Security & Visibility Matrix

| Infrastructure Component | Handles Media? | Handles Signaling? | Stores Call Content? | Public Endpoint? | Security Controls & Hardening |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cloudflare Edge** | NO | MAY (TLS Edge Proxy) | **NO** | YES | TLS 1.3, HSTS Preload, WAF Rules, DDoS Shield |
| **Vercel Platform** | NO | NO / MINIMAL | **NO** | YES | Serverless secret isolation, Security headers (CSP), PWA static distribution |
| **Signaling VPS** | NO | YES (WSS Payload Relay) | **NO** | YES | UFW Firewall (443/tcp only), Systemd service isolation, Schema validation, 32KB payload cap |
| **Coturn TURN VPS** | RELAYS ENCRYPTED TRAFFIC | NO | **NO** | YES | UFW Firewall (3478, 5349, 49152-65535), Short-lived HMAC REST tokens (10m TTL), Restricted port range |
| **Browser Endpoint** | YES (Local Capture / Playback) | YES (Client Socket) | **NO** (Zero retention on call end) | USER DEVICE | Web Crypto CSPRNG, Non-extractable identity keys, DTLS-SRTP E2EE, Phase 21 & 22 Teardown |
