# Audio Calls Security Architecture (`BETWEEN_US_AUDIO_V1`)

## Overview

Phase 13 establishes the security, privacy, and technical implementation model for 1-to-1 WebRTC audio calling in **Between Us**.

The primary objective is to allow two authenticated devices to exchange real-time voice media directly over peer-to-peer WebRTC (`DTLS-SRTP`), while keeping the Node.js signaling server completely isolated from audio media streams.

---

## Security Principles

### 1. Mandatory Media Isolation
```
SIGNALING SERVER (Node.js / WebSocket)
    │
    ├── SDP Offers / Answers
    ├── ICE Candidates
    └── Session Control Envelopes
         │
         X (NO AUDIO MEDIA ACCESS)
         │
    RTCPeerConnection (Browser P2P Transport)
         │
         └── Encrypted Voice Media (DTLS-SRTP)
```
- The signaling server handles envelope routing only.
- Voice media streams NEVER flow through WebSockets, HTTP APIs, or server processes.

### 2. Strict Audio-Only Acquisition
- Microphone streams are acquired exclusively via `navigator.mediaDevices.getUserMedia({ audio: true, video: false })`.
- Camera permissions are **never** requested during Phase 13.
- Video track creation is strictly prohibited.

### 3. On-Demand Permission Model
- Microphone access is requested **only** when the user explicitly initiates or accepts an audio call.
- Permission requests on app launch, pairing, or safety verification are prohibited.

### 4. Zero Persistence & Zero Call Logs
- Audio streams exist exclusively in RAM during active call state.
- **Zero Disk Buffering**: No `MediaRecorder`, `AudioWorklet`, audio blobs, or temporary files are created.
- **Zero Call History**: Call durations, timestamps, and partner identifiers are **never** persisted in IndexedDB, localStorage, or CacheStorage.

---

## Call Lifecycle & State Machine

The call lifecycle is governed by an explicit `CallStateMachine`:

```
[ IDLE ] ──(startCall / incoming)──> [ CALLING / RINGING ]
                                           │
                                     (accept / answer)
                                           │
                                           ▼
[ ENDED ] <──(cleanup)── [ ENDING ] <── [ CONNECTED ]
```

---

## Endpoint & Browser Trust Model

1. **Trusted Computing Base**: The application relies on standard browser WebRTC APIs (`RTCPeerConnection`) and the operating system for hardware audio I/O.
2. **Endpoint Limitation**: Between Us guarantees that the local application does not record or store audio. However, standard browser APIs cannot prevent a compromised endpoint or external hardware recorder from capturing audio at the OS layer.
3. **Endpoint Vulnerability**: A compromised browser, operating system, or malicious browser extension can capture microphone input prior to WebRTC encryption or after endpoint decryption.
