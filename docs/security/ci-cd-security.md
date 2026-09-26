# CI/CD Pipeline & GitHub Actions Security — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 24 — CI/CD Pipeline Security Specification  
**Status**: Authoritative CI/CD Security Reference  

---

## 1. GitHub Actions Permission Isolation

All GitHub Actions workflows in `.github/workflows/` enforce least-privilege permissions:

```yaml
permissions:
  contents: read
```

Workflows operate with default-read access; write permissions (`contents: write`) are strictly prohibited unless explicitly authorized for automated release tags.

---

## 2. Action Version Control & Pinning

Third-party GitHub Actions are pinned to verified versions:
- `actions/checkout@v4.2.2` (with `persist-credentials: false`)
- `actions/setup-node@v4.1.0` (with Node.js v20 & npm caching)
- `github/codeql-action/init@v3.28.0`
- `github/codeql-action/analyze@v3.28.0`

Unversioned actions (`@main` or `@master`) are forbidden in production CI workflows.

---

## 3. Mandatory Build Quality Gates

Every pull request and commit to `main` MUST pass all 6 CI pipeline gates before deployment:

1. **`npm ci`**: Lockfile synchronization and deterministic installation.
2. **`npm run type-check`**: TypeScript compilation check (`tsc --noEmit`) with 0 errors.
3. **`npm run lint`**: ESLint analysis with 0 warnings/errors.
4. **`npm test`**: Complete automated security test suite (133+ tests across 16 test suites).
5. **`npm audit`**: Vulnerability scanning (`--audit-level=high`).
6. **`npm run build` & Secret Scan**: Production bundle compilation and `.next/static/` secret scanning.

Failure of any single gate aborts the pipeline and blocks deployment.
