# WebRTC Engine Module Contract (`lib/webrtc`)

* **Target Phase**: Phase 13–15 — Audio, Video & TURN Integration
* **Responsibility**: Manages `RTCPeerConnection` instance creation, DTLS 1.3 handshake negotiation, `MediaStreamTrack` hardware binding, and coturn TURN relay fallback.
* **Trust Boundary**: Direct P2P / Relayed DTLS-SRTP Media Transport.
* **Prohibitions**: Media stream recording, local disk buffering, unencrypted media fallback.
