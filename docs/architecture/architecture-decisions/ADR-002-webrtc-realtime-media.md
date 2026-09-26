# ADR-002: Selection of WebRTC for Real-Time Media Transport

* **Status**: Approved
* **Date**: 2026-09-13
* **Context**: Real-time 1-to-1 audio and video communication requires low-latency, peer-to-peer streaming with mandatory end-to-end encryption.
* **Decision**: We adopt standard W3C WebRTC (`RTCPeerConnection`) with mandatory DTLS-SRTP encryption for media transport between client browsers.
* **Consequences**:
  * Positive: Native browser implementation, ultra-low latency, mandatory DTLS-SRTP payload encryption, direct P2P connectivity.
  * Negative: Direct P2P mode exposes client IP addresses to the peer; requires TURN fallback when symmetric NATs block direct sockets.
