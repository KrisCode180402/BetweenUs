# Server Maintenance & Security Patching Policy — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 23 — Patching & Maintenance Maintenance Policy  
**Status**: Authoritative Operational Policy  

---

## Patching & Maintenance Cadence

| Infrastructure Layer | Component | Patch Frequency | Testing Requirement | Rollback Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Operating System** | VPS Linux Kernel & Security Patches | Monthly (Immediate for Critical CVEs) | Staging VPS verification | LVM / VPS Cloud Snapshot Restore |
| **Runtime Engine** | Node.js LTS Engine | Bi-monthly (or Security Release) | Full automated test suite execution (`npm test`) | Previous Node.js LTS version binary switch |
| **Media Relay Daemon** | Coturn `turnserver` | Quarterly (Immediate for Critical CVEs) | WebRTC P2P & TURN fallback smoke test | Package version downgrade & config restore |
| **Frontend Dependencies** | Next.js & React | Monthly | Type-check, lint, build & automated test suite | Git tag revert on Vercel deployment |

---

## Mandatory Maintenance Rules
1. **Zero Downtime Interruption to Active Calls**: Maintenance restarts must be scheduled during maintenance windows; active WebRTC media streams operate P2P independent of signaling server restarts once established.
2. **Pre-Deployment Smoke Testing**: Every server software or dependency upgrade must be validated against automated test suites (`npm test`, `npm run type-check`, `npm run build`) prior to production deployment.
3. **Secret Preservation**: Server updates must never alter or expose environment variable secrets (`TURN_SHARED_SECRET`, SSH private keys).
