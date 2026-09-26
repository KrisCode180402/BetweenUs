# Secrets Architecture — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 02 — Final System & Trust Architecture  
**Status**: Approved Specification  

---

## 1. Secrets Classification & Storage Boundaries

```
+-----------------------------------------------------------------------------------+
| CLIENT SECRETS (Trusted Endpoint Only)                                            |
| - Private Identity Key (Ed25519)                                                  |
| - Storage: Browser IndexedDB (extractable: false)                                 |
| - Boundary: NEVER leaves browser process; NEVER sent to server or partner         |
+-----------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------+
| INFRASTRUCTURE SECRETS (Server Environments Only)                                 |
| - TURN HMAC Shared Secret (`TURN_SHARED_SECRET`)                                 |
| - Storage: Signaling VPS Environment & coturn `turnserver.conf`                   |
| - Boundary: Shared strictly between Signaling VPS & coturn VPS; NEVER in client    |
+-----------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------+
| DEPLOYMENT SECRETS (CI/CD Pipeline Only)                                          |
| - Vercel Deployment Tokens, SSH Deployment Keys                                   |
| - Storage: GitHub Actions Encrypted Secrets Store                                 |
| - Boundary: CI/CD build execution environment only                                |
+-----------------------------------------------------------------------------------+
```

---

## 2. Secrets Management Matrix

| Secret Identifier | Location | Access Authority | Encryption Method | Leakage Exposure Risk | Prevention & Mitigation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Client Private Key** | Client IndexedDB | Local PWA Origin (`SubtleCrypto`) | Non-extractable CryptoKey API | XSS key theft, storage exfiltration | `extractable: false`, strict CSP, no third-party scripts |
| **TURN HMAC Secret** | Signaling & TURN VPS | Signaling Daemon & Coturn Daemon | Encrypted env variables / VPS file perms | Unauthorized relay bandwidth abuse | Scoped systemd file permissions (`0600`), key rotation |
| **Vercel Deploy Token** | GitHub Actions | CI/CD Runner | GitHub Secrets Vault (AES-256) | Unauthorized static app deployment | Scoped deploy tokens, GitHub branch protection |
| **VPS SSH Admin Key** | Admin Workstation | Infrastructure Admin | Ed25519 SSH Keypair with passphrase | Server takeover, process tampering | Passwordless SSH disabled, IP restriction, fail2ban |

---

## 3. Strict Secrets Invariants

1. **PROHIBITED IN SOURCE CONTROL**: Zero static secrets, API keys, HMAC shared secrets, private SSH keys, or environment secrets shall ever be committed to the Git repository or exposed in source code.
2. **PROHIBITED IN FRONTEND BUNDLES**: Frontend environment variables prefixed with `NEXT_PUBLIC_` must NEVER contain private keys, HMAC shared secrets, or administrative API tokens.
3. **PROHIBITED IN APPLICATION LOGS**: Client console logs, signaling server stdout, coturn logs, Vercel build logs, and Cloudflare access logs must be actively scrubbed of key material, token values, and nonces.
