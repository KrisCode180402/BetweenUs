# Signaling Protocol Specification V1 (`BETWEEN_US_SIGNALING_V1`)

## Protocol Overview
The **Between Us Signaling Protocol V1** coordinates the temporary exchange of WebRTC negotiation metadata between two authenticated client endpoints using JSON envelope framing over WSS WebSockets.

---

## 1. Message Envelope Format

```json
{
  "version": 1,
  "type": "SESSION_JOIN | SESSION_READY | SDP_OFFER | SDP_ANSWER | ICE_CANDIDATE | PEER_LEFT | SESSION_END | ERROR | PING | PONG",
  "sessionId": "<128-bit hex string>",
  "sender": "<SHA-256 public key fingerprint hex>",
  "payload": { ... }
}
```

---

## 2. Message Types & Schemas

### 1. `SESSION_JOIN` (Client ➔ Server)
Sent by client to authenticate and join ephemeral session.
```json
{
  "version": 1,
  "type": "SESSION_JOIN",
  "sessionId": "a1b2c3d4e5f6...",
  "sender": "9893a79b461d...",
  "payload": {
    "publicIdentity": { "algorithm": "ECDSA-P256", "spkiHex": "...", "fingerprint": "...", "createdAt": 1700000000000 },
    "nonce": "<256-bit hex>",
    "timestamp": 1700000000000,
    "signature": "<ECDSA SHA-256 signature hex>"
  }
}
```

### 2. `SESSION_READY` (Server ➔ Client)
Sent by server when 2/2 participants are joined.
```json
{
  "version": 1,
  "type": "SESSION_READY",
  "sessionId": "a1b2c3d4e5f6...",
  "sender": "server",
  "payload": { "participantCount": 2 }
}
```

### 3. `SDP_OFFER` / `SDP_ANSWER` (Client ➔ Server ➔ Client)
Relays SDP string between peers.
```json
{
  "version": 1,
  "type": "SDP_OFFER",
  "sessionId": "a1b2c3d4e5f6...",
  "sender": "9893a79b461d...",
  "payload": { "type": "offer", "sdp": "v=0\r\no=- ..." }
}
```

### 4. `ICE_CANDIDATE` (Client ➔ Server ➔ Client)
Relays ICE candidate between peers.
```json
{
  "version": 1,
  "type": "ICE_CANDIDATE",
  "sessionId": "a1b2c3d4e5f6...",
  "sender": "9893a79b461d...",
  "payload": { "candidate": "candidate:1 1 UDP ...", "sdpMid": "0", "sdpMLineIndex": 0 }
}
```

### 5. `PEER_LEFT` / `SESSION_END`
Notifies peer of disconnection or session termination.
