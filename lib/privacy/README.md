# Privacy & Zero Retention Contract (`lib/privacy`)

* **Target Phase**: Phase 21 — Zero Retention Engine
* **Responsibility**: Manages call teardown RAM scrubbing, explicit `null` assignment of SDP/ICE variables, and triggering V8 garbage collection hints upon call termination.
* **Trust Boundary**: Volatile Browser Process RAM.
* **Prohibitions**: Retaining transient session references post-call, writing audio/video buffers to disk.
