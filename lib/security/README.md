# Security & Hardening Module Contract (`lib/security`)

* **Target Phase**: Phase 05 (Browser Security) & Phase 18 (Logging Privacy)
* **Responsibility**: Manages Content Security Policy guardrails, frame-busting checks, Permissions Policy verification, input schema validators, and developer log output sanitizers (`sanitizeLogOutput`).
* **Trust Boundary**: Application Runtime Security Guardrails.
* **Prohibitions**: Bypassing CSP headers, allowing inline script execution (`'unsafe-inline'`), permitting framing, logging raw payload secrets.
