# Safe Production Logging Schema

## Overview
This document defines the standard schema for operational events permitted in **Between Us** logs. Any event logged by `AppLogger` or `SignalingLogger` must conform to this schema to ensure auditability and zero risk of sensitive data exposure.

---

## 1. Event Log Schema Format

All structured log records follow this interface:

```typescript
export interface SafeLogRecord {
  /** Timestamp in ISO 8601 UTC format */
  timestamp: string;

  /** Log severity level */
  level: "info" | "warn" | "error" | "debug";

  /** High-level component emitting the log */
  component: "APP_CORE" | "SIGNALING_SERVER" | "WEBRTC_MEDIA" | "PAIRING_ENGINE" | "IDENTITY_VAULT" | "TURN_RELAY";

  /** Pre-approved event identifier */
  event: string;

  /** Optional sanitized context metadata object */
  meta?: Record<string, unknown>;

  /** Optional sanitized error payload */
  error?: {
    name: string;
    message: string;
    code?: string;
  };
}
```

---

## 2. Approved Event Identifiers Allowlist

| Event Name | Severity | Component | Description |
| :--- | :--- | :--- | :--- |
| `IDENTITY_GENERATED` | info | `IDENTITY_VAULT` | Local device identity keypair successfully generated |
| `PAIRING_STARTED` | info | `PAIRING_ENGINE` | Device pairing flow initiated |
| `PAIRING_COMPLETED` | info | `PAIRING_ENGINE` | Device pairing handshake successfully verified |
| `SAFETY_CHECK_VERIFIED` | info | `PAIRING_ENGINE` | Safety fingerprint comparison verified |
| `SIGNALING_CONNECTED` | info | `SIGNALING_SERVER` | Client WebSocket connected to signaling service |
| `SIGNALING_DISCONNECTED` | info | `SIGNALING_SERVER` | Client WebSocket disconnected |
| `CALL_STATE_TRANSITION` | info | `WEBRTC_MEDIA` | Call state machine state change (`IDLE` -> `DIALING`) |
| `ICE_STATE_CHANGED` | info | `WEBRTC_MEDIA` | ICE connection state update (`checking`, `connected`) |
| `TURN_ALLOCATION_SUCCESS` | info | `TURN_RELAY` | COTURN relay allocation created |
| `LOGGING_PRIVACY_REDIST` | info | `APP_CORE` | Redaction rules applied to log event |

---

## 3. Redaction Standards & Replacement Tokens

When sanitizing key-value metadata or raw string payloads, the following standard replacement tokens MUST be used:

- **Forbidden Keys** (`sdp`, `candidate`, `credential`, `token`, `secret`, `privateKey`, etc.):
  `"[REDACTED_FOR_PRIVACY]"`
- **Raw SDP / ICE Strings**:
  `"[REDACTED_SDP_OR_CANDIDATE]"`
- **Raw PEM / Hex Private Keys**:
  `"[REDACTED_PRIVATE_KEY]"`
- **Stack Traces with Sensitive References**:
  `"[REDACTED_STACK_TRACE]"`
