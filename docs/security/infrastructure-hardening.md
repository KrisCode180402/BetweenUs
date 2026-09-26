# Infrastructure Hardening Specification — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 23 — Infrastructure Hardening (`BETWEEN_US_INFRASTRUCTURE_HARDENING_V1`)  
**Status**: Authoritative Infrastructure Security Specification  

---

## 1. Executive Summary & Core Infrastructure Topology

**Between Us** employs a modern, minimalist edge and server topology designed strictly around real-time 1-to-1 WebRTC audio/video communication.

```text
                    INTERNET
                       │
                       ▼
                ┌───────────────┐
                │  CLOUDFLARE   │
                │ DNS / WAF /   │
                │ TLS / Edge    │
                └───────┬───────┘
                        │
                        ▼
                 ┌────────────┐
                 │   VERCEL   │
                 │ Next.js    │
                 │ PWA        │
                 └────────────┘

                        +
                        
                 ┌────────────┐
                 │ SIGNALING  │
                 │ NODE + WS  │
                 │ VPS        │
                 └────────────┘

                        +

                 ┌────────────┐
                 │   COTURN   │
                 │ TURN VPS   │
                 └────────────┘
```

---

## 2. Cloudflare Edge Security

1. **DNS Security**: Minimal DNS record exposure (`A`, `AAAA`, `CNAME`). Obsolete development or staging records are purged. DNSSEC enabled.
2. **HTTP/HTTPS Proxying**: Proxying enabled for Next.js PWA app (`app.betweenus.app`) and signaling HTTPS/WSS endpoints (`signal.betweenus.app`).
3. **TURN Direct Connectivity**: Coturn TURN relay traffic (`turn.betweenus.app`) operates on direct UDP/TCP ports (3478, 5349, 49152-65535) and is NOT routed through standard Cloudflare HTTP proxies.
4. **TLS 1.3 Strict Enforcement**: Minimum TLS version configured to TLS 1.2 with preference for TLS 1.3. Plaintext HTTP traffic automatically redirected to HTTPS.
5. **HSTS Preload Policy**: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` enforced on all production origins.
6. **WAF & Rate Limiting**: WAF rules protect API endpoints and WSS handshake endpoints against volumetric abuse, brute force, and malformed requests without disrupting WebRTC ICE media.

---

## 3. Vercel PWA Hosting & Secret Management

1. **Security Headers**: Production HTTP headers set via `next.config.ts` include:
   - `Content-Security-Policy`: Strict default-deny policy with explicit `connect-src` to production signaling and TURN origins.
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: no-referrer`
   - `Permissions-Policy: camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), bluetooth=()`
   - `Cross-Origin-Opener-Policy: same-origin`
   - `Cross-Origin-Resource-Policy: same-origin`
2. **Environment Variable Secret Isolation**:
   - `TURN_SHARED_SECRET` exists strictly in server-side process environment variables.
   - **Zero Secret Exposure**: Zero `NEXT_PUBLIC_*` variables contain private keys, shared secrets, database credentials, or tokens.
   - Production static build bundles (`.next/static/`) verified clean of server secret leaks.

---

## 4. Node.js Signaling VPS Hardening

1. **Minimal Service Footprint**: Dedicated minimal Linux VPS running Node.js signaling daemon as a restricted system service (`systemd`).
2. **SSH Hardening**: Password authentication disabled; root login disabled; SSH key-based authentication enforced (`ed25519` keys).
3. **Firewall (UFW / iptables)**: Inbound access restricted strictly to:
   - Port `22/tcp` (Admin SSH)
   - Port `443/tcp` / `57000/tcp` (HTTPS / WSS signaling relay)
   - All other ports default-denied.
4. **WebSocket Security**:
   - Mandatory `wss://` transport.
   - Schema validation, 32KB payload size limit, origin check, and rate limiting (max 10 msgs/sec).
   - Zero storage of signaling payloads or media content.

---

## 5. Coturn TURN Relay VPS Hardening

1. **Dedicated Service Role**: Coturn daemon (`turnserver`) isolated on dedicated VPS infrastructure.
2. **Restricted Relay Port Range**: Min relay port `49152` to max relay port `65535`.
3. **Short-Lived HMAC Credentials**: Time-limited REST credentials (`HMAC-SHA1` with 10-minute TTL) generated on-demand by serverless API. Zero permanent client-side passwords.
4. **Firewall (UFW / iptables)**:
   - Port `3478/tcp`, `3478/udp`, `5349/tcp`, `5349/udp`
   - UDP/TCP relay port range `49152-65535`
   - All other ports default-denied.
5. **Zero Media Storage**: Coturn relays encrypted DTLS-SRTP media packets; possesses 0 media decryption keys and generates 0 media files.

---

## 6. Infrastructure Logging & Monitoring

1. **Logging Minimization**:
   - No audio, video, SDP offers/answers, ICE candidate tuples, private keys, or TURN REST credentials logged to disk or console.
   - Operational logs restricted to simple connection counts and error states.
2. **Operational Monitoring**: Service health monitoring limited to CPU, RAM, disk space, network availability, and TLS certificate expiration alerts. Zero call-content telemetry.

---

## 7. GitHub CI/CD & Build Pipeline Supply Chain Integration

Under Phase 24 (`BETWEEN_US_SUPPLY_CHAIN_SECURITY_V1`):
1. **GitHub Workflow Hardening**: Workflows in `.github/workflows/` run with `permissions: contents: read` and SHA-pinned actions (`actions/checkout@v4.2.2`).
2. **Automated Static & Build Gates**: Every commit and PR must pass TypeScript checks (`tsc --noEmit`), ESLint, 133+ automated security tests, `npm audit`, CodeQL static analysis, and post-build static bundle secret checks (`.next/static/`).
3. **CODEOWNERS Access Controls**: Critical security paths require explicit code owner review (`.github/CODEOWNERS`).
