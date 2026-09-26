# Infrastructure Inventory & Resource Mapping — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 23 — Infrastructure Resource Mapping  
**Status**: Authoritative Inventory Document  

---

## Production Infrastructure Inventory

| Component | Provider | Public Hostname / IP | Exposed Ports | Data Handled | Trust Level | Log Policy | Retention |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Edge DNS & WAF** | Cloudflare | `app.betweenus.app`, `signal.betweenus.app` | 80/tcp, 443/tcp | TLS Edge Routing, WAF inspection | Semi-Trusted Proxy | Anonymized Edge Metadata | Max 30 Days |
| **Application Hosting** | Vercel PWA | `app.betweenus.app` | 443/tcp | App Shell static assets, TURN token API | High (Client Delivery) | Serverless execution logs | Max 7 Days |
| **Signaling Daemon** | Dedicated VPS | `signal.betweenus.app` | 22/tcp (SSH), 443/tcp (WSS) | Ephemeral SDP/ICE JSON messages | Untrusted Relay | Minimal operational logs | Max 24 Hours |
| **TURN Relay Daemon** | Dedicated VPS | `turn.betweenus.app` | 3478/udp/tcp, 5349/udp/tcp, 49152-65535 | Encrypted WebRTC SRTP packets | Untrusted Relay | Minimal connection log | Max 7 Days |
| **Client PWA App** | User Browser | Client Device | N/A | E2EE Audio/Video, Device Identity | Trusted Client | Zero application log disk persistence | 0 Seconds (Post-call) |
