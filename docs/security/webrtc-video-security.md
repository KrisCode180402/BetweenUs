# WebRTC Video Calling Security Specification (`BETWEEN_US_VIDEO_V1`)

## Overview

Phase 14 extends the **Between Us** WebRTC architecture to support 1-to-1 real-time video calling (`BETWEEN_US_VIDEO_V1`).

The system maintains strict privacy, media isolation, and endpoint encryption principles across both audio and video streams.

---

## Key Security Principles

### 1. Single PeerConnection Architecture
```
RTCPeerConnection (Single P2P Connection)
    ├── Microphone Audio Track (DTLS-SRTP AES-GCM)
    └── Camera Video Track (DTLS-SRTP AES-GCM)
```
- Both audio and video media tracks are multiplexed over a **single** `RTCPeerConnection`.
- No separate or secondary PeerConnections are created for video.

### 2. On-Demand Camera Permission Model
- Camera permission (`getUserMedia({ audio: true, video: { facingMode: "user" } })`) is requested **only** when the user explicitly initiates or accepts a **video call**.
- Audio-only calls strictly enforce `video: false` and **never** request camera access.

### 3. Local Video Preview Isolation
- The local camera preview element is rendered with `autoPlay muted playsInline`.
- Local video frames exist only in RAM for rendering and are **never** recorded, buffered to disk, or sent to server APIs.

### 4. Zero Server Video Relay & Zero Persistence
- The Node.js WebSocket signaling server handles temporary negotiation envelopes (SDP/ICE) only and **never** touches camera frames or video streams.
- **Zero Disk Storage**: No `MediaRecorder`, `canvas.captureStream()`, video blobs, thumbnails, screenshots, or call history are persisted.

---

## Endpoint Trust Boundary

- **Trusted Computing Base**: The application relies on the browser WebRTC implementation and the host operating system for camera hardware I/O.
- **Endpoint Recording Disclaimer**: The local application guarantees zero recording and zero persistence. However, standard browser APIs cannot prevent a remote participant's endpoint from taking a physical hardware recording outside the browser container.
