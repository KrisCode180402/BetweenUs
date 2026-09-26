# Project Foundation Specification — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 04 — Project Foundation  
**Status**: Approved Foundation Baseline  

---

## 1. Technical Stack & Environment

| Component | Technology | Version / Specification |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `v15.1.x` |
| **UI Library** | React | `v19.0.x` |
| **Language** | TypeScript | `v5.7.x` (Strict Mode) |
| **Styling** | Tailwind CSS | `v4.0.x` |
| **Node Runtime** | Node.js | `>=24.0.0` (LTS) |
| **Package Manager** | npm | `v11.x` |

---

## 2. Standard Development Commands

```bash
# Install exact dependencies via lockfile
npm ci

# Start local development server
npm run dev

# Run strict TypeScript compilation check (no emit)
npm run type-check

# Run ESLint check
npm run lint

# Build production bundle
npm run build
```

---

## 3. Environment Variable Policy

1. **PUBLIC CONFIGURATION**: Exposed to browser via `NEXT_PUBLIC_*` strictly for non-sensitive public parameters (e.g. public signaling WSS URL, public STUN URI).
2. **PROHIBITED IN PUBLIC ENV**: Private keys, HMAC shared secrets, server deployment tokens, and coturn credentials must NEVER be placed in `NEXT_PUBLIC_*` variables or committed to Git.
3. **EXAMPLE TEMPLATE**: All environment configuration must be documented in `.env.example` using placeholder values only.

---

## 4. Git Security & Ignore Rules

The `.gitignore` file enforces exclusion of:
* Local environment files (`.env`, `.env.local`, `.env.*.local`).
* Compiled build outputs (`.next/`, `out/`, `dist/`).
* Dependency storage (`node_modules/`).
* OS and IDE metadata (`.DS_Store`, `.vscode/*`).

---

## 5. Security-Sensitive Directory Contracts

The `lib/` directory is partitioned into 8 isolated subdirectories, each governed by a dedicated contract README explaining future module ownership:

* [`lib/crypto/README.md`](file:///x:/Between%20Us/lib/crypto/README.md) — Web Crypto API identity & key exchange wrappers (Phase 09).
* [`lib/pairing/README.md`](file:///x:/Between%20Us/lib/pairing/README.md) — Out-of-band numeric pairing state machine (Phase 10).
* [`lib/signaling/README.md`](file:///x:/Between%20Us/lib/signaling/README.md) — WSS WebSocket client driver & JSON validators (Phase 12).
* [`lib/webrtc/README.md`](file:///x:/Between%20Us/lib/webrtc/README.md) — PeerConnection manager & DTLS-SRTP engine (Phase 13–15).
* [`lib/storage/README.md`](file:///x:/Between%20Us/lib/storage/README.md) — IndexedDB non-extractable key store (Phase 08).
* [`lib/security/README.md`](file:///x:/Between%20Us/lib/security/README.md) — CSP verification & log sanitizers (Phase 05 & 18).
* [`lib/privacy/README.md`](file:///x:/Between%20Us/lib/privacy/README.md) — Zero-retention RAM scrubbers & GC triggers (Phase 21).
* [`lib/session/README.md`](file:///x:/Between%20Us/lib/session/README.md) — Ephemeral call lifecycle state machine (Phase 16).
