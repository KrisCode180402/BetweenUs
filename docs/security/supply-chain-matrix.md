# Supply Chain Security Matrix — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 24 — Supply Chain Threat & Control Matrix  
**Status**: Authoritative Reference Matrix  

---

## Supply Chain Threat & Control Matrix

| Supply Chain Threat | Security Control | Verification Method | Status |
| :--- | :--- | :--- | :--- |
| **Vulnerable Dependency** | Deterministic `npm ci`, `npm audit` gate | Automated CI audit step | **PASS** |
| **Malicious Package Injection** | Minimal runtime dependencies, lockfile pinning | Manual code review & `package-lock.json` lock | **PASS** |
| **Typosquatting Attack** | Scoped package verification, explicit registry check | `.npmrc` & lockfile audit | **PASS** |
| **Malicious GitHub Action** | Version pinning (`@v4.2.2`), `contents: read` permissions | `.github/workflows/ci.yml` inspection | **PASS** |
| **Secret Leak in CI Logs / Bundles** | Static build bundle secret scan, `.env.example` audit | Post-build secret grep check | **PASS** |
| **Unreviewed PR Code** | Protected `main` branch, CODEOWNERS policies | `.github/CODEOWNERS` enforcement | **PASS** |
| **CI Cache Poisoning** | Isolated GitHub-hosted runners, `npm` cache keys | GitHub runner isolation model | **PASS** |
| **Build Artifact Tampering** | Serverless static bundle audit (`.next/static/`) | Automated bundle secret check | **PASS** |
