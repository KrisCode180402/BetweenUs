# Ephemeral WebSocket Signaling Audit — Between Us

## 1. Signaling Architecture & Lifecycle
- **Protocol**: Ephemeral WebSocket (`/api/ws` or dedicated WSS signaling node).
- **Session Capacity**: Strictly limited to **maximum 2 participants per session**. A 3rd join attempt is immediately rejected.
- **Data Persistence**: Zero database or filesystem storage. Session routing tables reside entirely in volatile memory (`Map<string, Session>`).

## 2. Security Controls & Protections
- **Payload Bounding**: WebSocket messages capped at **32 KB**. Oversized payloads trigger instant socket termination.
- **JSON Schema Validation**: Strict parsing of message types (`JOIN`, `OFFER`, `ANSWER`, `ICE_CANDIDATE`, `LEAVE`). Malformed JSON yields controlled socket error and disconnection.
- **Origin Check**: Verification of request `Origin` header against application domain whitelist.
- **Rate Limiting**: IP and session-level message throttling to prevent flooding attacks.
- **Session ID Predictability**: Session IDs generated using cryptographically secure random values (`crypto.randomUUID()` / `getRandomValues()`), preventing enumeration.

## 3. Disconnection & Cleanup
- **Disconnect Triggers**: Client hangup, tab close, browser crash, network loss, socket timeout.
- **Purge Behavior**: Unused session records are deleted immediately from memory once all peers disconnect or timeout.
