# Protocol Overview & Control-Plane Wire Specifications — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 02 — Final System & Trust Architecture  
**Status**: Approved Specification  

---

## 1. Control-Plane Messaging Framing & Rules

All WebSocket control-plane communication between client PWAs and the signaling server uses JSON text frames over WSS (TLS 1.3). Messages carry strict cryptographic signatures and anti-replay header parameters.

### 1.1 Base Control Frame Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "type", "timestamp", "nonce", "senderIdentityFingerprint", "signature"],
  "additionalProperties": false,
  "properties": {
    "version": { "type": "string", "enum": ["1.0"] },
    "type": { 
      "type": "string", 
      "enum": ["PAIRING_REQUEST", "PAIRING_SUBMIT", "SDP_OFFER", "SDP_ANSWER", "ICE_CANDIDATE", "DISCONNECT", "ERROR"] 
    },
    "timestamp": { "type": "integer", "minimum": 1700000000000 },
    "nonce": { "type": "string", "minLength": 32, "maxLength": 64 },
    "senderIdentityFingerprint": { "type": "string", "pattern": "^[a-f0-9]{64}$" },
    "signature": { "type": "string", "minLength": 32 },
    "payload": { "type": "object" }
  }
}
```

---

## 2. SAS Safety Verification Fingerprint Calculation

Short Authentication String (SAS) fingerprint derivation prevents MITM key substitution during out-of-band peer pairing:

$$\text{PRK} = \text{HKDF-Extract}(\text{salt}=\text{"BetweenUs-SAS-v1"}, \text{IKM}=\min(PubKey_A, PubKey_B) \parallel \max(PubKey_A, PubKey_B))$$
$$\text{OKM} = \text{HKDF-Expand}(\text{PRK}, \text{info}=\text{"sas-derivation"}, \text{L}=32)$$

Take the first 4 bytes of $\text{OKM}$, format as an 8-character uppercase hex string (e.g. `A4B8 - 91F2`) displayed on both client UIs for verbal/visual confirmation.

---

## 3. Control-Plane Anti-Replay & Throttling Enforcement

1. **Timestamp Drift Window**: Server rejects frames with timestamp drift $> \pm 30$ seconds.
2. **Sliding Nonce Cache**: In-memory nonce cache drops duplicate nonces submitted within 60 seconds.
3. **Throttling Rules**:
   * Pairing Code Rate Limit: Max 3 attempts per IP per 15 minutes.
   * WebSocket Traffic Limit: Max 10 frames/sec per socket; violation drops connection.
