# Third-Party Infrastructure Services Disclosure — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 23 — Third-Party Disclosure & Risk Assessment  
**Status**: Authoritative Disclosure Document  

---

## Production Third-Party Services Audit

| Service Name | Provider | Purpose | Data Exposed | Metadata Exposed | Storage Retention | Security Risk & Boundaries |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Cloudflare DNS & Edge** | Cloudflare, Inc. | Edge DNS, TLS termination, WAF protection | HTTP headers, TLS SNI, App Shell static assets | Client IP, TLS handshake timing, request counts | Edge operational logs (max 30 days) | Cannot observe WebRTC audio/video content (E2EE DTLS-SRTP). Observes TLS SNI & HTTP headers. |
| **Vercel PWA Platform** | Vercel, Inc. | Next.js app hosting, TURN token REST endpoint | App Shell HTML/JS bundles | Request IP, HTTP User-Agent, API request timestamps | Serverless execution logs (max 7 days) | Delivers static web bundle and generates short-lived TURN HMAC tokens. Receives 0 media streams. |
| **Signaling VPS Host** | Cloud VPS Provider | Node.js WebSocket signaling relay | Ephemeral SDP offers/answers, trickle ICE candidate IPs | Client IP, WebSocket socket state, connection duration | Volatile RAM only (max 24 hours log) | Untrusted message relay. Possesses 0 media decryption keys or identity private keys. |
| **Coturn TURN VPS Host** | Cloud VPS Provider | Coturn media relay daemon | Encrypted SRTP WebRTC packets (AES-GCM) | Client IP, relay port tuples, bandwidth volume | Volatile log file (max 7 days) | Relays encrypted SRTP packets. Possesses 0 media decryption keys; cannot read voice or video. |

---

## Mandatory Third-Party Privacy Principles
1. **Zero Call Content Sharing**: No third-party provider receives unencrypted call audio, call video, call recordings, or private identity keys.
2. **Zero Analytics SDKs**: No Google Analytics, PostHog, Mixpanel, Segment, or tracking scripts are integrated.
3. **No Database Dependencies**: Zero external database SaaS (Supabase, Firebase, PlanetScale, MongoDB Atlas) used in Between Us architecture.
