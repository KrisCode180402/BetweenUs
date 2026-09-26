# Comprehensive Data Lifecycle — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 03 — Privacy & Data Classification  
**Status**: Authoritative Privacy Specification  

---

## Stage-by-Stage Privacy & Data Lifecycle

```
IDLE ──► CALL_INITIATION ──► SESSION_CREATION ──► SIGNALING ──► WEBRTC_NEGOTIATION ──► CONNECTED
                                                                                             │
IDLE ◄── DESTRUCTION ◄── CLEANUP ◄── CALL_END ◄────────────────────────────── ACTIVE_MEDIA ◄─┘
```

---

### Stage 1: IDLE
* **Data Created**: None.
* **Data Residing in Storage**: Non-extractable identity key pair in IndexedDB, paired partner public key, static PWA app shell in Cache Storage.
* **Access Control**: Local PWA origin context only.
* **Persistence & Lifetime**: Persistent across sessions until manual identity reset or app clearance.

### Stage 2: CALL_INITIATION
* **Data Created**: Transient call initiation trigger event, `getUserMedia()` hardware access request.
* **Data Processed**: Local camera/microphone media tracks created in browser process memory.
* **Persistence & Lifetime**: Ephemeral. MediaStream objects held in volatile browser RAM.

### Stage 3: SESSION_CREATION
* **Data Created**: Ephemeral signaling WebSocket connection request, anti-replay nonce, short-lived timestamp.
* **Data Transmitted**: TLS 1.3 encrypted WebSocket connection request (`wss://signaling.betweenus.app`).
* **Persistence & Lifetime**: Nonces held in server RAM cache for max 60 seconds.

### Stage 4: SIGNALING
* **Data Created**: Signed SDP Offer created by initiator WebRTC engine.
* **Data Processed**: Ed25519 identity key creates signature over SDP Offer hash.
* **Data Transmitted**: JSON signaling envelope containing signed SDP Offer sent over WSS.
* **Server Access**: Signaling server inspects JSON envelope headers for routing; SDP content is not logged or written to disk.

### Stage 5: WEBRTC_NEGOTIATION
* **Data Created**: Responder generates signed SDP Answer; both peers trickle ICE candidates.
* **Data Transmitted**: SDP Answer and candidate envelopes routed via signaling server.
* **Persistence & Lifetime**: SDP and ICE payloads exist in signaling server RAM strictly during negotiation (<30 seconds) and are purged upon delivery.

### Stage 6: CONNECTED
* **Data Created**: Peer WebRTC engines perform DTLS 1.3 mutual handshake directly between socket endpoints.
* **Data Negotiated**: Ephemeral SRTP master keys negotiated inside browser C++ WebRTC core.
* **Signaling Isolation**: Signaling server WebSocket may be closed or kept idle; signaling possesses zero DTLS keys.

### Stage 7: ACTIVE_MEDIA
* **Data Processed**: Encrypted audio (Opus) and video (VP8/AV1) SRTP packets transmitted real-time (Direct P2P or coturn relay).
* **Data Buffering**: Ephemeral 10-20ms audio PCM hardware buffers and current video display frame in GPU memory.
* **Persistence & Lifetime**: Zero disk persistence. Media frames are overwritten continuously during playback.

### Stage 8: CALL_END
* **Data Created**: Ephemeral `DISCONNECT` frame sent over WebSocket.
* **Trigger Event**: User taps "End Call", closes tab, or experiences network drop.
* **Immediate Actions**: MediaStreamTracks stopped; RTCPeerConnection closed.

### Stage 9: CLEANUP
* **Hardware Release**: Camera and microphone drivers released, extinguishing hardware indicator lights.
* **Socket Teardown**: DTLS-SRTP sockets terminated; SRTP master keys destroyed in C++ process memory.
* **Server Cleanup**: Signaling server purges active socket references and candidate buffers from Node.js RAM.

### Stage 10: DESTRUCTION
* **RAM Scrubbing**: Local session JavaScript references (SDP strings, ICE arrays, TURN tokens) explicitly set to `null`.
* **Garbage Collection**: Browser V8/WebKit garbage collector reclaims allocated memory.

### Stage 11: RETURN TO IDLE
* **Final State**: System returns to `IDLE` state. Zero residual call data, timestamps, or media frames remain in client RAM, browser storage, or server memory.
