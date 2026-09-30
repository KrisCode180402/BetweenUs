# GitHub Security & Supply Chain Hardening — Between Us

**Repository**: `KrisCode180402/BetweenUs`  
**Visibility**: Private  
**Status**: Authoritative GitHub Repository Security Architecture Document  

---

## 1. Summary of Implemented Controls

| Security Mechanism | Configuration / Location | Status | Function |
|---|---|---|---|
| **Dependabot Security Updates** | `.github/dependabot.yml` | **Enabled** | Scans npm and GitHub Actions ecosystems weekly for vulnerable dependencies; groups updates. |
| **CodeQL Static Analysis** | `.github/workflows/codeql.yml` | **Enabled** | Runs Javascript/Typescript security query suites on PRs, pushes, and weekly schedule. |
| **Dependency Review** | `.github/workflows/dependency-review.yml` | **Enabled** | Fails PRs if newly introduced dependencies contain high-severity vulnerabilities. |
| **Security CI Pipeline** | `.github/workflows/security.yml` & `ci.yml` | **Enabled** | Runs full TypeScript, ESLint, 133/133 tests, `npm audit`, and build secret bundle scanner. |
| **SHA-Pinned Actions** | `.github/workflows/*.yml` | **Enabled** | Third-party GitHub Actions are pinned to verified 40-character commit SHAs. |
| **Least Privilege Tokens** | All Workflows | **Enabled** | Workflows set `permissions: contents: read` by default to prevent secret/token abuse. |
| **Code Ownership** | `.github/CODEOWNERS` | **Enabled** | Mandates code owner review (@KrisCode180402) for security-sensitive modules. |
| **Security Policy** | `.github/SECURITY.md` | **Enabled** | Establishes responsible disclosure guidelines and emergency secret rotation procedures. |
| **Issue Guidance** | `.github/ISSUE_TEMPLATE/config.yml` | **Enabled** | Directs vulnerability reporters to private reporting instead of public issue trackers. |

---

## 2. GitHub Actions Supply Chain Protections

### A. Commit SHA Pinning Matrix
All workflows pin third-party actions to immutable full 40-character commit hashes:
- `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683` (`v4.2.2`)
- `actions/setup-node@39370e3970a6d050c38046917d8e3780d128491b` (`v4.1.0`)
- `github/codeql-action/init@df7a5f271701ed570d2422584614673c9614d8d2` (`v3.28.0`)
- `github/codeql-action/analyze@df7a5f271701ed570d2422584614673c9614d8d2` (`v3.28.0`)
- `actions/dependency-review-action@5a5eaabe274a2f8d38ef8bfcf0cf1cb2fb03248c` (`v4.5.0`)

### B. Untrusted PR Egress & Secret Isolation
- `pull_request` workflows are executed without production secret access.
- `pull_request_target` is **strictly avoided** to prevent execution of untrusted branch code with elevated privileges.
- Production credentials (`TURN_SHARED_SECRET`, Supabase service role keys, Vercel tokens) are isolated strictly to production deployment environments.

---

## 3. Branch Protection & GitHub Plan Feature Status

- **Repository Visibility**: Kept strictly **Private** to protect personal audio/video signaling infrastructure code.
- **Plan Capabilities & Limitations**:
  - CodeQL analysis, Dependabot alerts, and GitHub Actions CI pipelines are fully functional on this repository.
  - Advanced repository branch protection rulesets and secret scanning push protection for private repositories depend on GitHub plan tier (Pro / Team / Enterprise).
  - Main branch workflow checks (`security`, `codeql`, `build-and-test`) validate all incoming commits prior to deployment.
