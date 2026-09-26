# Adversarial Test Results — Between Us

## Adversarial Test Suites & Vector Execution

| Attack Vector | Target Component | Attack Methodology | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ATK-01: Session Hijacking** | WebSocket Signaling | Attempt to send `JOIN` to active session from 3rd peer | 3rd client rejected | Client rejected instantly with `SESSION_FULL` | `VERIFIED` |
| **ATK-02: Message Flooding** | WebSocket Signaling | Send rapid stream of >1000 malformed JSON packets | Connection throttled & closed | Socket terminated gracefully | `VERIFIED` |
| **ATK-03: Oversized Payload** | WebSocket Signaling | Send 100KB JSON payload via WebSocket | Payload rejected (>32KB limit) | Socket closed with error | `VERIFIED` |
| **ATK-04: Malicious Pairing Code** | Secure Pairing | Attempt brute-force guessing of 6-digit code | Exponential rate limit + 10m TTL | Session expires before brute force succeeds | `VERIFIED` |
| **ATK-05: Identity Spoofing** | Safety Verification | MitM peer presents forged ECDSA public key | Fingerprint hash mismatch | Safety verification fingerprint changes, alerting peer | `VERIFIED` |
| **ATK-06: Open Relay Abuse** | Coturn TURN Server | Request relay allocation without HMAC token | TURN server denies allocation | `401 Unauthorized` | `VERIFIED` |
| **ATK-07: Unintended Recording** | Client Runtime | Inspect window for `MediaRecorder` or recording blobs | Zero recording capabilities | `MediaRecorder` absent from call stack | `VERIFIED` |
| **ATK-08: Stale State Access** | Call State Machine | Trigger rapid double hangup / invalid state jump | State machine remains stable | State machine rejects invalid jump without crash | `VERIFIED` |
| **ATK-09: Emergency Exit Wipe** | Privacy Mode | Trigger Emergency Exit during active call | Tracks stop, session cleared, redirected to safe home | Ephemeral state zeroed, redirected to home | `VERIFIED` |
| **ATK-10: Secret Leakage** | Client Bundle | Scan `.next/static/` JS files for `TURN_SHARED_SECRET` | Zero server secrets in client bundle | Zero secrets found | `VERIFIED` |

## Summary Test Suite Results
- **Automated Tests**: 133 / 133 Passed.
- **Type Checking**: 0 Errors (`tsc --noEmit`).
- **Linting**: 0 Errors (`next lint`).
- **Production Build**: Successful static and serverless build (`next build`).
