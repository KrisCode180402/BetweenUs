# WebRTC Audio & Video Media Audit — Between Us

## 1. WebRTC Implementation & Constraints
- **Media Engine**: Native browser `RTCPeerConnection` API.
- **Media Encryption**: Mandatory DTLS-SRTP encryption for all audio/video RTP packets in transit.
- **Audio Constraints**: Requested via `getUserMedia({ audio: true, video: false })` for audio calls.
- **Video Constraints**: Requested via `getUserMedia({ audio: true, video: { ... } })` for video calls.
- **Single Connection Invariant**: One single `RTCPeerConnection` manages both audio and video tracks.

## 2. Hardware Track Lifecycle & Teardown
- **Track Teardown**: Upon call termination (`hangup()`, page unload, error, or Emergency Exit), `MediaStreamTrack.stop()` is explicitly invoked on all active hardware tracks.
- **Microphone & Camera Verification**: Verified empirically that hardware indicators (LED/OS indicators) turn off immediately upon call end.
- **DataChannel Security**: DataChannel is disabled / unused in v1 to minimize attack surface.

## 3. SDP & ICE Privacy
- **IP Exposure**: Direct WebRTC peer connections expose peer IP addresses in SDP candidate attributes. If TURN relay is active, local host candidate exposure is minimized.
- **Honesty Statement**: The application does **not** claim complete IP anonymity over direct P2P connections; connection metadata relies on underlying WebRTC ICE candidate behavior.
