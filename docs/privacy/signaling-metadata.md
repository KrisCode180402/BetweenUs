# Between Us — Signaling Metadata Audit & Specification

> **Phase 17 Privacy & Metadata Specification**  
> **Version:** 1.0.0  
> **Status:** Authoritative Signaling Payload Audit

---

## 1. WebSocket Signaling Envelope Audit

The ephemeral WebSocket signaling server (`SignalingClient` / `SignalingServer`) exists solely to exchange negotiation envelopes between paired devices for WebRTC P2P setup.

### Envelope Schema

```json
{
  "type": "JOIN | SESSION_READY | SDP_OFFER | SDP_ANSWER | ICE_CANDIDATE | PEER_LEFT | ERROR",
  "sessionId": "BETWEEN_US_CALL_SESSION_<uuid>",
  "callType": "audio | video",
  "senderFingerprint": "partner_fingerprint_hex",
  "payload": { ... },
  "signature": "ECDSA_P256_Signature_Hex",
  "timestamp": 1726227600000
}
```

---

## 2. Field-by-Field Metadata Audit

| Envelope Field | Category | Purpose | Sensitivity | Minimization & Retention Policy |
| :--- | :--- | :--- | :--- | :--- |
| `type` | Control | Message routing classifier | Level 1 | Restricted to 7 valid enum types; no arbitrary extensions |
| `sessionId` | Session | Call session ownership | Level 3 | Ephemeral random UUID; discarded from server RAM when session ends |
| `callType` | Media | Selects WebRTC constraints | Level 2 | Value is `"audio"` or `"video"`; never saved as call history |
| `senderFingerprint` | Auth | Sender device identity check | Level 2 | SHA-256 fingerprint of device public key; verifies paired partner trust |
| `payload` | WebRTC | Contains SDP or ICE candidate | Level 3 | Encrypted SDP or ICE candidate string; held in server RAM during transit only |
| `signature` | Cryptography | Authenticates message origin | Level 3 | Domain-separated ECDSA P-256 signature; verified in RAM, zero persistence |
| `timestamp` | Replay Guard | Prevents message replay attacks | Level 2 | Millisecond timestamp validated against 5-minute replay window; discarded |

---

## 3. Server-Side Retention & Hygiene Guarantees

1. **Volatile RAM Only**: Active signaling sessions and candidate queues are maintained strictly in Node.js volatile memory.
2. **Immediate Session Teardown**: When a peer disconnects or sends `PEER_LEFT`, the signaling server purges the session object, candidate buffer, and socket reference immediately.
3. **Zero Database Integration**: The signaling server has **zero database client dependencies**, zero SQL/NoSQL ORM libraries, and zero file writing routines.
4. **Max 2 Participants**: Maximum 2 sockets per session; 3rd participant join attempts are rejected immediately (`MAXIMUM_PARTICIPANTS_EXCEEDED`).
