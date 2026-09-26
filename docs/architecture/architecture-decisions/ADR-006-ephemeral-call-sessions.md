# ADR-006: Ephemeral Call Sessions & RAM-Only State Model

* **Status**: Approved
* **Date**: 2026-09-13
* **Context**: Call state management must enforce zero-retention privacy principles.
* **Decision**: All call session parameters (DTLS-SRTP master keys, SDP offers/answers, trickle ICE candidates, nonces) exist strictly in volatile RAM and are purged immediately upon call termination or socket disconnect.
* **Consequences**:
  * Positive: Zero residual call state left on client disk or server disk; complete alignment with zero-retention requirements.
  * Negative: Call connection recovery across browser crashes requires fresh call signaling handshake.
