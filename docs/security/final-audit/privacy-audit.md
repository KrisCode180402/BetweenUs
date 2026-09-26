# Privacy & Data Classification Audit — Between Us

## Data Minimization & Retention Verification

| Data Category | Expected Lifecycle | Actual Lifecycle In Code | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Audio Stream** | Transmitted in real-time via DTLS-SRTP; never stored | Processed in RAM only via `MediaStreamTrack`; hardware tracks closed on hangup | Storage Forensics & Source Audit | `VERIFIED` |
| **Video Stream** | Transmitted in real-time via DTLS-SRTP; never stored | Processed in RAM only via `MediaStreamTrack`; hardware tracks closed on hangup | Storage Forensics & Source Audit | `VERIFIED` |
| **Call History** | Zero retention | Zero DB schema or local storage logic for call logs | Codebase regex audit | `VERIFIED` |
| **Chat Messages** | Feature absent | Zero chat input/output components in UI/signaling | Codebase audit | `VERIFIED` |
| **Pairing Codes** | Ephemeral (600s TTL) | Stored in memory / ephemeral signaling map; auto-purged | Signaling test suite | `VERIFIED` |
| **Device Public Key** | Ephemeral / Local pairing reference | Saved in browser local repository (`bu_paired_partners`) | Local Storage audit | `VERIFIED` |
| **Device Private Key** | Persistent local browser key | Keypair generated via Web Crypto API with `extractable: false` | Web Crypto API audit | `VERIFIED` |
| **Analytics & Trackers**| Strictly 0 trackers | Zero Google Analytics, PostHog, Mixpanel, or third-party scripts | Production Bundle Review | `VERIFIED` |

## Data Flow Verification
1. **Media Stream**: Local Hardware -> Browser WebRTC API -> Encrypted Socket (DTLS-SRTP) -> Partner Browser. **Zero server interaction for media contents**.
2. **Signaling Payload**: Ephemeral WebSocket -> In-memory Router -> Partner Browser. **Zero database persistence**.
