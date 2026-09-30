# Security Policy — Between Us

## Supported Versions

Only the current `main` branch of **Between Us** receives active security updates and vulnerability patches.

| Version / Branch | Supported          |
| ---------------- | ------------------ |
| `main`           | :white_check_mark: |
| Older releases   | :x:                |

---

## Reporting a Vulnerability

We take the security and privacy of **Between Us** extremely seriously. If you discover a potential security flaw, vulnerability, or secret exposure, **do not open a public GitHub issue**.

### Responsible Disclosure Protocol

1. **Private Disclosure**: Report security findings privately to the repository owner (`@KrisCode180402`) or via GitHub Private Vulnerability Reporting on the repository page.
2. **Details to Include**:
   - Component / module affected (e.g. `lib/webrtc`, `lib/crypto`, `lib/signaling`, `next.config.ts`)
   - Proof-of-concept description or reproduction steps (without actionable exploit code)
   - Impact assessment on privacy, confidentiality, or call integrity
   - Any recommended remediation steps
3. **Coordinated Disclosure**: We request that you allow up to **90 days** for investigation, patch creation, and deployment before disclosing findings publicly.

---

## Emergency Secret Rotation Procedure

If a secret or private key (such as `TURN_SHARED_SECRET`, Supabase service role keys, or Cloudflare API tokens) is accidentally exposed:

1. **Immediate Revocation**: Revoke and regenerate the secret immediately in the platform dashboard (Cloudflare, Vercel, Supabase, Coturn).
2. **Update Environment Variables**: Replace the compromised secret in production hosting environment variables.
3. **Commit Cleaning**: Remove any local traces from git staging and verify `.gitignore` prevents future exposure.
4. **Audit History**: If a secret was pushed to git history, follow secret rotation procedures and sanitize the environment immediately.
