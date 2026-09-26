# Session Lifecycle Contract (`lib/session`)

* **Target Phase**: Phase 16 — Ephemeral Call State Machine
* **Responsibility**: Controls high-level call state machine transitions (`IDLE`, `INITIATING`, `INCOMING`, `CONNECTING`, `CONNECTED`, `ENDING`, `DESTROYING`), managing UI timers and teardown triggers.
* **Trust Boundary**: Volatile UI Application State.
* **Prohibitions**: Maintaining persistent call logs, history records, or duration databases.
