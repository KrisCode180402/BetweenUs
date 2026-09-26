# Between Us Pairing Protocol Specification — V1 (`BETWEEN_US_PAIRING_V1`)

## Protocol Overview
The **Between Us Pairing Protocol V1** coordinates the mutual authentication and persistent trust establishment between two device cryptographic identities (`ECDSA` P-256).

---

## 1. Message Definitions & Schema

### Message 1: `PAIRING_INVITATION` (Initiator ➔ Responder)
Sent by `PAIRING_INITIATOR` to open a temporary pairing session.
```json
{
  "type": "PAIRING_INVITATION",
  "version": "BETWEEN_US_PAIRING_V1",
  "sessionId": "<128-bit hex string>",
  "tokenHex": "<128-bit hex string>",
  "initiatorPublicIdentity": {
    "algorithm": "ECDSA-P256",
    "spkiHex": "<canonical SPKI hex>",
    "fingerprint": "<SHA-256 hex>",
    "createdAt": 1700000000000
  },
  "challengeA": "<256-bit hex challenge>",
  "expiresAt": 1700000300000
}
```

### Message 2: `PAIRING_RESPONSE` (Responder ➔ Initiator)
Sent by `PAIRING_RESPONDER` in response to invitation, proving possession of private key.
```json
{
  "type": "PAIRING_RESPONSE",
  "version": "BETWEEN_US_PAIRING_V1",
  "sessionId": "<128-bit hex string>",
  "responderPublicIdentity": {
    "algorithm": "ECDSA-P256",
    "spkiHex": "<canonical SPKI hex>",
    "fingerprint": "<SHA-256 hex>",
    "createdAt": 1700000000000
  },
  "challengeB": "<256-bit hex challenge>",
  "signatureB": "<ECDSA signature over canonical RESP payload>",
  "expiresAt": 1700000300000
}
```
**Canonical Signed Payload (`signatureB`):**
`BETWEEN_US_PAIRING_V1:RESP:<sessionId>:<challengeA>:<initiatorFingerprint>:<responderFingerprint>`

---

### Message 3: `PAIRING_CONFIRM` (Initiator ➔ Responder)
Sent by `PAIRING_INITIATOR` after verifying Responder's signature, proving possession of Initiator's private key.
```json
{
  "type": "PAIRING_CONFIRM",
  "version": "BETWEEN_US_PAIRING_V1",
  "sessionId": "<128-bit hex string>",
  "signatureA": "<ECDSA signature over canonical CONF payload>"
}
```
**Canonical Signed Payload (`signatureA`):**
`BETWEEN_US_PAIRING_V1:CONF:<sessionId>:<challengeB>:<initiatorFingerprint>:<responderFingerprint>`

---

### Message 4: `PAIRING_COMPLETE` (Participant ➔ Peer)
Sent when a user confirms pairing to notify peer transport of atomic finalization.
```json
{
  "type": "PAIRING_COMPLETE",
  "version": "BETWEEN_US_PAIRING_V1",
  "sessionId": "<128-bit hex string>"
}
```

---

### Message 5: `PAIRING_CANCEL` (Participant ➔ Peer)
Sent upon explicit cancellation, timeout, or signature verification failure.
```json
{
  "type": "PAIRING_CANCEL",
  "version": "BETWEEN_US_PAIRING_V1",
  "sessionId": "<128-bit hex string>",
  "reason": "Signature verification failed"
}
```

---

## 2. Validation & Security Checks
1. **Protocol Version Match:** All messages must strictly specify `version: "BETWEEN_US_PAIRING_V1"`.
2. **Session Identifier Match:** `sessionId` must match active session ID; mismatched session IDs are silently dropped.
3. **Expiration Check:** Messages received past `expiresAt` trigger immediate session cancellation (`EXPIRED`).
4. **Signature Verification:** Failed signature verification immediately aborts pairing and sends `PAIRING_CANCEL`.
