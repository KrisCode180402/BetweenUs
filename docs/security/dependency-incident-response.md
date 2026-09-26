# Dependency & Supply Chain Incident Response Protocol — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 24 — Incident Response Protocol  
**Status**: Authoritative Operational Protocol  

---

## 1. Trigger Conditions
This protocol is activated upon detection of:
- Malicious npm package injection or typosquatting attack affecting runtime or build dependencies.
- Security advisory published for a direct or transitive dependency (`npm audit` high/critical alert).
- Suspected compromise of a third-party GitHub Action or CI runner.
- Secret exposure detected in GitHub Actions logs or static build outputs.

---

## 2. Step-by-Step Response Workflow

```text
[IDENTIFY & ISOLATE] → [HALT DEPLOYMENT] → [REMOVE / PATCH] → [ROTATE SECRETS] → [VERIFY & REDEPLOY]
```

1. **Halt Deployment**: Immediately freeze Vercel deployments and pause GitHub Actions workflows.
2. **Isolate Package**: Identify affected package name, exact version, and transitive dependency path.
3. **Remediate**:
   - For malicious/vulnerable package: Remove or pin safe version in `package.json` and regenerate `package-lock.json`.
   - For compromised GitHub Action: Revert workflow to previous trusted commit SHA or remove action.
   - For secret leak: Rotate affected production secrets (`TURN_SHARED_SECRET`, Cloudflare tokens, Vercel tokens) immediately.
4. **Build Bundle Audit**: Execute `npm run build` and inspect `.next/static/` chunks to verify zero payload remanence.
5. **Re-Run Full Test Suite**: Execute `npm test`, `npm run type-check`, `npm run lint`.
6. **Deploy Clean Release**: Re-enable deployment pipeline and confirm clean production release.
