# Supply Chain & CI/CD Security Audit — Between Us

## 1. Dependency Analysis & Auditing
- **Lockfile Enforcement**: `package-lock.json` committed and enforced in build pipeline via `npm ci`.
- **Runtime Dependencies**: Zero external UI dependencies (React, Next.js core only). Zero third-party tracking, analytics, or UI library bloat.
- **Security Audit**: Executed `npm audit` — 0 vulnerabilities reported.

## 2. GitHub Actions CI Hardening
- **Workflow Security**: `.github/workflows/ci.yml` explicitly defines restrictive top-level permissions:
  ```yaml
  permissions:
    contents: read
  ```
- **Action Pinning**: Third-party GitHub Actions (`actions/checkout`, `actions/setup-node`) pinned to verified commit SHAs.
- **PR Isolation**: Pull requests from forks cannot access production deployment secrets.

## 3. Secret Scanning & Integrity
- **Branch Protection**: `main` branch protected requiring passing CI checks and mandatory code review.
- **CodeQL & Dependabot**: Automated static security scanning and automated dependency vulnerability alerts enabled.
