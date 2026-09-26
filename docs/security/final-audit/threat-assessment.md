# Final Threat Assessment — Between Us

## 1. Threat Model & Attacker Profiles Evaluated

| Attacker Profile | Description & Capabilities | Mitigation Strategy | Verdict / Status |
| :--- | :--- | :--- | :--- |
| **A. Remote Internet Attacker** | Unauthenticated network adversary attempting to tap calls or probe API endpoints. | All traffic forced over HTTPS/WSS; WebRTC media encrypted via mandatory DTLS-SRTP. | `VERIFIED` |
| **B. Malicious Website** | External website attempting to access device identity or intercept signaling. | Strict Same-Site policy, CORS restriction, and frame-busting CSP (`frame-ancestors 'none'`). | `VERIFIED` |
| **C. Malicious Browser Extension** | Browser extension with broad DOM/network injection rights. | Endpoint compromise beyond web app scope; explicitly documented in privacy boundaries. | `OUTSIDE APPLICATION CONTROL` |
| **D. Compromised Dependency** | Malicious code injected into third-party NPM package. | Pinned lockfiles, `npm ci`, zero runtime UI third-party dependencies, Dependabot. | `VERIFIED` |
| **E. Malicious GitHub PR** | Unauthorized attempt to modify codebase or exfiltrate secrets via PR. | Read-only CI token scope (`contents: read`), mandatory code reviews, CODEOWNERS enforced. | `VERIFIED` |
| **F. Compromised CI Workflow** | Injection into build pipeline to tamper with JS bundles. | Environment secrets hidden from untrusted PR forks; build artifacts validated. | `VERIFIED` |
| **G. Malicious Signaling Client** | Rogue WebSocket client attempting to inject or spoof signaling messages. | Strict room size (max 2), pairing verification, JSON payload schema checking, rate limits. | `VERIFIED` |
| **H. Malicious Paired Device** | Rogue peer attempting to manipulate state or exfiltrate media. | HKDF SHA-256 safety verification fingerprint, ECDSA P-256 challenge-response identity checks. | `VERIFIED` |
| **I. Network Observer (Eavesdropper)** | ISP, rogue Wi-Fi operator, or TAP inspecting IP packets. | DTLS-SRTP media encryption prevents content decryption; metadata minimized. | `VERIFIED` |
| **J. Compromised TURN Server** | Rogue TURN operator inspecting relayed traffic. | TURN relays encrypted DTLS-SRTP packets; cannot decrypt media payload without DTLS keys. | `VERIFIED` |
| **K. Compromised Hosting Config** | Hosting platform misconfiguration leading to secret leakage. | Secrets strictly stored in server environment variables; client bundle scanning performed. | `VERIFIED` |
| **L. Local Attacker with Device Access** | Physical or malware access to victim's browser/device. | Application wipes local ephemeral call state; OS physical capture/malware is outside scope. | `OUTSIDE APPLICATION CONTROL` |
| **M. User Inspecting Own App** | User attempting to inspect DevTools or extract session state. | Open architecture; zero server secrets in client bundle; expected user-side visibility. | `VERIFIED` |
| **N. Partner Impersonator** | Impersonator attempting to reuse stolen pairing codes or identities. | Safety verification fingerprint comparison exposes public key mismatches immediately. | `VERIFIED` |

## 2. Security & Privacy Assumptions Evaluation
- **Assumption 1**: "WebRTC DTLS-SRTP ensures media confidentiality." -> `VERIFIED` (Mandatory in all modern browsers).
- **Assumption 2**: "The application does not persist call media." -> `VERIFIED` (No media storage logic present).
- **Assumption 3**: "Signaling server cannot decrypt media." -> `VERIFIED` (Signaling passes SDP/ICE only; SRTP keys exchanged via DTLS handshake directly between peers).
- **Assumption 4**: "Browser cannot be forced to output media without permissions." -> `VERIFIED` (Browser media permission model enforced).
- **Assumption 5**: "Application can prevent external physical cameras or OS-level screenshots." -> `FAILED / OUTSIDE CONTROL` (Strictly documented as impossible for web applications).
