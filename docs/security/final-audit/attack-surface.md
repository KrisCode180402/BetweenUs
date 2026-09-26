# Attack Surface Inventory — Between Us

## System Attack Surface Summary

| Entry Point / Component | Description | Exposure Level | Mitigation Controls | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Public Web App (`/`)** | Next.js PWA static & dynamic routes | Public Internet | CSP, HSTS, X-Content-Type-Options, Frame-Ancestors `none`. | `VERIFIED` |
| **WebSocket Signaling** | `/api/ws` / Ephemeral Signaling WS | Public Internet | Origin check, 32KB payload cap, max 2 peers, rate limiting. | `VERIFIED` |
| **TURN API (`/api/turn/credentials`)** | Serverless route generating relay tokens | Authenticated / Rate Limited | Server-side HMAC generation using secret key; timed validity. | `VERIFIED` |
| **Coturn Relay Server** | UDP/TCP relay port (3478 / 5349) | Public Internet | Authenticated HMAC credentials; rate-limiting per allocation. | `VERIFIED` |
| **PWA Service Worker** | `sw.js` offline assets cache | Local Browser | Strict static asset whitelist; zero call/media caching. | `VERIFIED` |
| **Local Storage (`localStorage`)** | Storage for paired identity metadata | Local Device | Low-sensitivity metadata only; zero SDP/ICE/media stored. | `VERIFIED` |
| **IndexedDB** | Application DB | Local Device | Unused / Zero call content or recordings stored. | `VERIFIED` |
| **SessionStorage & Cookies** | Session ephemeral storage | Local Browser | Unused for sensitive media; zero session tokens stored. | `VERIFIED` |
| **GitHub CI/CD Actions** | Automated build and test workflows | GitHub Cloud | Minimal token permissions (`contents: read`), pinned commit SHAs. | `VERIFIED` |

## Data Inventory & Classification
- **Public**: PWA static bundle, public key fingerprint hashes.
- **Ephemeral Sensitive**: WebRTC SDP offers/answers, ICE candidate IP addresses, short-lived signaling session IDs.
- **Secret (Server)**: Coturn HMAC secret key (`TURN_SHARED_SECRET`).
- **Secret (Client)**: Device ECDSA private key (`extractable: false` in Web Crypto API storage).
- **Prohibited Data**: Audio/video recordings, call logs, text chat messages, analytics telemetry.
