# GitHub Repository & Supply Chain Hardening Checklist — Between Us

[x] **Dependency Graph Enabled**: Automatic detection of npm & GitHub Actions dependencies.  
[x] **Dependabot Alerts Configured**: Automated vulnerability notification active.  
[x] **Dependabot Security Updates Active**: `.github/dependabot.yml` configured for weekly scans.  
[x] **Dependabot Grouped Updates**: Configured to group updates and prevent PR spam.  
[x] **Secret Scanning**: Scans codebase and git tracking for exposed tokens (`.gitignore` verified).  
[x] **CodeQL Static Analysis Active**: `.github/workflows/codeql.yml` scans Javascript/Typescript.  
[x] **Dependency Review Action Configured**: `.github/workflows/dependency-review.yml` inspects PRs.  
[x] **Dedicated Security CI Pipeline**: `.github/workflows/security.yml` runs full security gates.  
[x] **Minimal Actions Permissions**: Workflows specify `permissions: contents: read`.  
[x] **SHA-Pinned Third-Party Actions**: All actions pinned to full 40-character commit SHAs.  
[x] **Production Secret Isolation**: Zero client-side exposition of server-side credentials.  
[x] **CODEOWNERS Enforced**: `.github/CODEOWNERS` assigns security paths to @KrisCode180402.  
[x] **SECURITY.md Published**: Responsible disclosure and secret rotation policy added.  
[x] **Private Issue Guidance**: `.github/ISSUE_TEMPLATE/config.yml` directs security reports privately.  
[x] **Lockfile Integrity**: Deterministic `npm ci` enforced in all CI pipelines.  
[x] **TypeScript Validation**: `npm run type-check` (`tsc --noEmit`) passes cleanly (0 errors).  
[x] **ESLint Code Quality**: `npm run lint` passes cleanly (0 errors).  
[x] **Automated Security Test Suite**: 133/133 tests passing (100% pass rate).  
[x] **Production Build Secret Scanner**: Automated verification against `NEXT_PUBLIC_` secret leakage in `.next/`.  
