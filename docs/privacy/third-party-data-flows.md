# Third-Party Infrastructure Data Flows — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 03 — Privacy & Data Classification  
**Status**: Authoritative Privacy Specification  

---

## 1. Third-Party Infrastructure Flow Matrix

Every third-party hosting, DNS, delivery, and VPS provider utilized in the deployment architecture of **Between Us** is evaluated for data access boundaries, content opacity, and metadata retention:

```
+-----------------------------------------------------------------------------------+
| THIRD-PARTY INFRASTRUCTURE ACCESS BOUNDARIES                                      |
|                                                                                   |
| Provider         Data Received           Media Content Opacity  Metadata Exposure |
| --------------   ----------------------  ---------------------  ----------------- |
| Cloudflare       HTTPS Headers / IPs     100% Opaque (TLS)      IP / TLS SNI      |
| Vercel           Static PWA Requests     100% Opaque            Access logs       |
| Signaling VPS    WSS JSON Envelopes      100% Opaque (No Keys)  IP / WSS Timing   |
| TURN VPS         Encrypted SRTP Packets  100% Opaque (SRTP)     IP / Packet Size  |
| GitHub / CI      Source Code / Secrets   N/A (Build Time)       Commit History    |
+-----------------------------------------------------------------------------------+
```

| Provider / Entity | Data Received | Rationale | Contains Call Media? | Contains Decryption Keys? | Provider Retention Policy | Application Control Level |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **Cloudflare Edge** | IP addresses, HTTP GET headers, TLS SNI | DNS resolution, WAF protection, edge TLS termination | **NO** | **NO** | Standard edge logs (Max 7 days) | Low (Infrastructure Provider Policy — Requires Verification) |
| **Vercel Serverless** | Static PWA file requests (`.html`, `.js`, `.css`) | Static frontend application delivery | **NO** | **NO** | Standard access logs (Max 7 days) | Medium (Configurable log settings) |
| **Signaling VPS Host** | WSS JSON envelopes (SDP offers/answers, candidates, nonces) | Relaying signaling connection parameters | **NO** | **NO** | Rolling syslog (Max 24 hours) | High (Full OS `logrotate` control) |
| **TURN VPS Host** | Encrypted UDP SRTP packets, STUN binding frames | Relaying WebRTC media packets when P2P is blocked | **NO** (SRTP E2EE) | **NO** | Minimal daemon logs (Max 24 hours) | High (Full `coturn.conf` logging control) |
| **GitHub Actions** | Source code, build workflow triggers, deploy tokens | Automated CI/CD testing & deployment build | **NO** | **NO** | Workflow run history (Max 90 days) | High (Configurable secret & log rules) |

---

## 2. Infrastructure Provider Policy Verification Rule

> [!NOTE]
> **INFRASTRUCTURE PROVIDER POLICY — REQUIRES VERIFICATION**
> While **Between Us** configures zero application logging and strict payload encryption, third-party network infrastructure providers (Cloudflare, Vercel, Cloud VPS hosts) independently maintain operational network logging. The application does not claim to alter or erase host ISP or cloud vendor network interface logging.
