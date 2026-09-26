# Signaling Client Module Contract (`lib/signaling`)

* **Target Phase**: Phase 12 — WebSocket Signaling System
* **Responsibility**: Manages client WSS WebSocket connection lifecycle, JSON envelope framing, timestamp/nonce header generation, and SDP/ICE routing messages.
* **Trust Boundary**: Browser ↔ Signaling Server VPS.
* **Prohibitions**: Media packet proxying, unencrypted WS fallback, logging payload text.
