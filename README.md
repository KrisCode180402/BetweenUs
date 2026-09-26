# Between Us

> **Tagline**: "Two People. One Private Connection."

---

## 1. Project Overview

**Between Us** is a security-focused, privacy-preserving Progressive Web Application (PWA) designed exclusively for 1-to-1 audio and video communication between two trusted individuals.

The system is intentionally minimal:
* **Audio Calling**: Direct 1-to-1 encrypted voice streaming.
* **Video Calling**: Direct 1-to-1 encrypted video streaming.

The platform is intentionally **NOT**:
* A social network
* A messaging or chat platform
* A group calling service
* A cloud media storage or recording platform
* An analytics or behavioral tracking system

---

## 2. Privacy & Security Philosophy

* **DATA MINIMIZATION**: Process only data technically required to establish 1-to-1 calls.
* **ZERO DATABASE (`DATABASE = NONE FOR V1`)**: No server-side user database, call history, or user registration tables exist.
* **ZERO CALL RECORDING**: The application contains zero code paths or cloud storage for recording media.
* **ZERO THIRD-PARTY ANALYTICS**: Absolutely zero tracking scripts, telemetry SDKs, or ad networks.
* **END-TO-END MEDIA PROTECTION**: Audio/video media is encrypted end-to-end between participants via WebRTC DTLS-SRTP.
* **MINIMAL INFRASTRUCTURE TRUST**: Servers coordinate signaling and relay UDP packets, but possess zero media decryption keys.

---

## 3. Technology Stack

* **Frontend**: Next.js (App Router), React 19, TypeScript (Strict Mode), Tailwind CSS v4.
* **Calling**: WebRTC (`RTCPeerConnection`, DTLS 1.3, SRTP AES-GCM).
* **Signaling**: Ephemeral Node.js TypeScript WebSocket daemon (`wss://signaling.betweenus.app`).
* **TURN Relay**: Hardened `coturn` relay server (`turn.betweenus.app`).
* **Cryptography**: W3C Web Crypto API (`window.crypto.subtle`, Ed25519, X25519, HKDF-SHA256).
* **Local Storage**: IndexedDB (Non-extractable key storage with `extractable: false`).
* **PWA**: Service Worker static app shell caching & Web App Manifest.
* **Deployment Target**: Cloudflare WAF + Vercel Edge Runtime (Frontend), Hardened Linux VPS (Signaling & TURN).

---

## 4. Current Status

> [!WARNING]
> **DEVELOPMENT STATUS: PHASE 04 UNDER DEVELOPMENT**
> This repository is currently in the **Project Foundation Phase (Phase 04)**.
> - The application skeleton and TypeScript strict baseline are established.
> - **Calling, signaling, pairing, and WebRTC functionality are NOT implemented yet.**
> - This software is currently **NOT PRODUCTION READY** and MUST NOT be used for real private calls yet.
> - Marketing claims such as "100% secure" or "military-grade guarantees" are explicitly rejected in favor of technically defensible security engineering.

---

## 5. Local Development Setup

### Prerequisites
* **Node.js**: `v24.x` (LTS)
* **npm**: `v11.x`

### Installation & Commands

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Type check TypeScript
npm run type-check

# 4. Run ESLint
npm run lint

# 5. Build for production
npm run build
```

---

## 6. Project Architecture & Contracts

For complete security specifications, threat models, system architecture diagrams, and ADRs, consult the [`docs/`](file:///x:/Between%20Us/docs) directory:
* [`docs/security/`](file:///x:/Between%20Us/docs/security): Threat model, security requirements, and invariants.
* [`docs/architecture/`](file:///x:/Between%20Us/docs/architecture): Trust boundaries, data flows, server specs, and ADRs (`ADR-001` through `ADR-010`).
* [`docs/privacy/`](file:///x:/Between%20Us/docs/privacy): Master data classification, retention policy, and zero retention definitions.
* [`docs/development/project-foundation.md`](file:///x:/Between%20Us/docs/development/project-foundation.md): Developer guide for Phase 04 foundation rules.
