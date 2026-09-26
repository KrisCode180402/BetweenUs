# Storage Forensics & Zero-Retention Audit — Between Us

## 1. Post-Call Storage State Inspection

| Storage Vector | Contents Post-Call | Policy Compliance | Verdict |
| :--- | :--- | :--- | :--- |
| **localStorage** | Low-sensitivity paired partner keys (`bu_paired_partners`), local identity hash (`bu_device_identity`). Zero SDP, zero ICE, zero media. | Allowed | `VERIFIED` |
| **sessionStorage** | Empty | Compliant | `VERIFIED` |
| **IndexedDB** | Web Crypto private key storage (`extractable: false`). Zero call logs/media. | Compliant | `VERIFIED` |
| **Cache Storage** | Service worker cached PWA static assets (JS, CSS, icons). Zero runtime media/APIs. | Compliant | `VERIFIED` |
| **Service Worker** | Volatile event handler state only. | Compliant | `VERIFIED` |
| **Cookies** | Empty / Zero session cookies. | Compliant | `VERIFIED` |

## 2. In-Memory Reference Purging
- **MediaStream & Tracks**: Teardown sequence invokes `MediaStreamTrack.stop()` and unbinds references.
- **RTCPeerConnection**: Closed via `.close()`, event listeners set to `null`, instance reference cleared.
- **Signaling State**: In-memory signaling session destroyed, WebSocket connection closed.

## 3. Storage Boundary Honesty
- **Application Controls**: The web app explicitly purges all memory pointers, state machine references, and temporary local keys.
- **Browser/OS Boundary**: Hardware-level RAM garbage collection scheduling, browser process memory dumps, or OS disk swapping are outside application JavaScript control.
