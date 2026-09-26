# Software Supply Chain Security Specification — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 24 — Supply Chain Security (`BETWEEN_US_SUPPLY_CHAIN_SECURITY_V1`)  
**Status**: Authoritative Software Supply Chain Specification  

---

## 1. Executive Summary & Supply Chain Trust Pipeline

**Between Us** enforces strict software supply chain security across code authoring, dependency ingestion, GitHub repository management, CI pipeline verification, static build compilation, and edge deployment.

```text
DEVELOPER ──► GITHUB (CODEOWNERS) ──► CI SECURITY CHECKS ──► DEPENDENCY LOCK ──► BUILD ──► VERCEL DEPLOY
```

---

## 2. Lockfile & Dependency Policy

1. **Single Package Manager Enforcement**: The project strictly uses `npm` (v10+). Lockfile `package-lock.json` is committed to the repository and enforced.
2. **Deterministic Installation**: Production CI pipelines run `npm ci` (`--frozen-lockfile` equivalent) to prohibit floating or un-vetted transitive dependency updates during build steps.
3. **Dependency Minimization**: The runtime dependency footprint is kept minimal (`next`, `react`, `react-dom`, `ws`). Zero utility libraries added for trivial functions.
4. **Vulnerability Audit**: High and critical vulnerabilities flagged by `npm audit` trigger build blockages unless accompanied by a documented security risk assessment.

---

## 3. Secret Isolation & Bundle Verification

1. **Zero Public Secret Leakage**: No server credentials (`TURN_SHARED_SECRET`, SSH private keys, TLS keys, Cloudflare API tokens) may be prefixed with `NEXT_PUBLIC_*` or imported into client components.
2. **Automated Static Bundle Inspection**: CI pipelines scan production `.next/static/` chunks after compilation to verify 0 server secrets or private keys were bundled into client JavaScript.

---

## 4. Code Ownership & Branch Protection

1. **Protected Branch**: Direct pushes to `main` are restricted. All security-sensitive code changes must flow through pull request reviews.
2. **CODEOWNERS Enforcement**: Security-critical paths (`lib/crypto/`, `lib/signaling/`, `lib/webrtc/`, `lib/privacy/`, `lib/safety/`, `server/`, `.github/`, `docs/security/`) require explicit code owner review before merge.
