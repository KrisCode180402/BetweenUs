# Infrastructure & Hosting Audit — Between Us

## 1. Environment Architecture & Boundaries

```
                 [ User Browser ]
                        │
             HTTPS      │     WSS / WebRTC
         ┌──────────────┴──────────────┐
         ▼                             ▼
  [ Vercel Edge Server ]     [ Coturn Relay Server ]
  (Next.js PWA Host)          (UDP/TCP Port 3478/5349)
```

## 2. Infrastructure Component Evaluation
- **Vercel Hosting**: Production deployment configured with strict environment variable isolation (`TURN_SHARED_SECRET` stored in Server Environment Variables, isolated from client build artifacts).
- **Cloudflare Edge**: TLS termination using TLS 1.3/1.2; WAF rules and DDoS mitigations active; security headers enforced.
- **Coturn VPS Relay**: Dedicated TURN node hardened via Linux firewall rules (only 3478/5349 UDP/TCP open), minimal system logging, authenticated TURN HMAC access.
- **DNS & Domains**: DNS CAA records enforce valid certificate issuers; zero dangling CNAMEs or abandoned subdomains.

## 3. Secret Leakage Audit
- Built production bundle (`npm run build`) and searched static output (`.next/static/`) for `TURN_SHARED_SECRET`, `PRIVATE_KEY`, `PASSWORD`, `API_KEY`, or credentials.
- **Result**: Zero server secrets present in client assets (`VERIFIED`).
