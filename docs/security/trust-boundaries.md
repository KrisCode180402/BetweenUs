# Explicit Trust Boundaries — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 23 — Infrastructure Trust Boundaries (`BETWEEN_US_INFRASTRUCTURE_HARDENING_V1`)  
**Status**: Authoritative Architectural Reference  

---

## 1. System Trust Boundary Map

```text
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

## 2. Infrastructure Boundary Analysis

1. **Boundary A (Browser ↔ OS)**: Host operating system sandbox.
2. **Boundary B (Browser ↔ Signaling VPS)**: WSS TLS 1.3 payload relay. Ephemeral SDP/ICE JSON. Signaling server possesses 0 media keys and 0 private identity keys.
3. **Boundary C (Browser ↔ Coturn TURN VPS)**: Encrypted WebRTC DTLS-SRTP packet relay. Coturn daemon possesses 0 media decryption keys.
4. **Boundary D (Cloudflare ↔ Vercel)**: PWA App Shell static asset distribution and short-lived TURN token REST endpoint. Receives 0 audio/video streams.
