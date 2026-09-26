# ADR-003: WebSocket Architecture for Signaling & Coordination

* **Status**: Approved
* **Date**: 2026-09-13
* **Context**: WebRTC connection setup requires lightweight, bidirectional routing of SDP offers/answers, ICE candidates, and out-of-band pairing messages.
* **Decision**: We implement a Node.js TypeScript daemon using the native `ws` WebSocket library hosted on a hardened Linux VPS (`wss://signaling.betweenus.app`).
* **Consequences**:
  * Positive: Full bidirectional real-time messaging, low memory footprint, zero third-party cloud service lock-in, complete control over rate limiters and logging minimization.
  * Negative: Requires managing a hardened VPS systemd service and configuring SSL/TLS certificates.
