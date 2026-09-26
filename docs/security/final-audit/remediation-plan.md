# Security Remediation Plan — Between Us

## Findings & Remediation Tracking Matrix

| Finding ID | Severity | Affected Component | Description | Impact | Recommended Remediation | Retest Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REM-INF-01** | INFORMATIONAL | Next.js Linter Warning | `next lint` deprecation notice in Next.js 15.5 | Build warning only | Migrate to standard ESLint CLI in future maintenance cycle | `OPEN (ACCEPTED RISK)` |
| **REM-INF-02** | INFORMATIONAL | TURN Logs | Coturn infrastructure logs client IP allocations | Operational metadata retention | Maintain host logrotate policy to purge logs after 7 days | `VERIFIED (OUTSIDE CONTROL)` |
| **REM-INF-03** | INFORMATIONAL | CSP Policy | `script-src` includes `'unsafe-inline'` for Next.js hydration | Minor CSP relaxation | Transition to Nonce-based CSP in future core update | `OPEN (ACCEPTED RISK)` |

## Note on Retesting & Verification
All CRITICAL, HIGH, and MEDIUM security checks from prior phases were thoroughly retested and verified passed. No active blocking security remediations remain open.
