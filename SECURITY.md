# Security Policy — Between Us

## Supported Versions

Only the current `main` branch of **Between Us** receives active security updates and vulnerability patches.

| Branch | Supported |
| :--- | :--- |
| `main` | Yes |
| Older commits / tags | No |

---

## Reporting a Vulnerability

If you discover a security vulnerability, privacy flaw, or accidental credential exposure in **Between Us**, **please do not open a public GitHub issue**.

### Private Reporting Process

1. **GitHub Private Vulnerability Reporting (Preferred)**:
   Use the **Security → Advisories → Report a vulnerability** workflow on the repository page (`https://github.com/KrisCode180402/BetweenUs/security/advisories/new`).
   *(Note for maintainers: ensure GitHub Private Vulnerability Reporting is enabled under Repository Settings → Code security and analysis before making the repository public.)*
2. **Information to Include**:
   - Affected file(s) or module(s) (e.g., `lib/webrtc/`, `lib/crypto/`, `lib/signaling/`, `lib/pairing/`, `app/api/`, `next.config.ts`)
   - Clear description of the vulnerability and reproduction steps (avoid sharing live user credentials or personal call data)
   - Potential impact on confidentiality, call integrity, authentication, or privacy
   - Suggested remediation, if any
3. **Coordinated Disclosure**:
   Please allow up to **90 days** for triage, fix development, and verification before public disclosure.

---

## Scope & Honest Security Expectations

Between Us uses standard WebRTC DTLS-SRTP transport encryption for peer-to-peer media and browser-managed non-extractable ECDSA P-256 device keys in IndexedDB. It does **not** claim to be unhackable or immune to endpoint compromise, malicious browser extensions, or network metadata analysis. See [`docs/security/SECURITY_OVERVIEW.md`](docs/security/SECURITY_OVERVIEW.md) for a detailed overview of implemented controls and known limitations.

---

## Credential Exposure Response

If a server-side secret (`TURN_SHARED_SECRET`, `VAPID_PRIVATE_KEY`, Supabase service-role key, or deployment token) is ever exposed:

1. Revoke and rotate the credential immediately in the respective provider dashboard.
2. Update environment variables in local and production hosting environments.
3. Audit Git history and remove any committed secret before continuing public distribution.
