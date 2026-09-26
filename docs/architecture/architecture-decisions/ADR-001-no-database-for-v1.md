# ADR-001: No Persistent Server Database for Version 1

* **Status**: Approved
* **Date**: 2026-09-13
* **Context**: Between Us is a private 1-to-1 PWA designed for minimal data retention and minimal infrastructure trust. Server-side databases represent a high-value attack target for data exfiltration, subpoenas, and metadata correlation.
* **Decision**: We explicitly decide that the backend signaling and TURN infrastructure for V1 will operate with **ZERO persistent database engines** (No SQL, No NoSQL, No Redis disk-persistence, No Object Storage). All signaling coordination occurs strictly in ephemeral Node.js server RAM.
* **Consequences**:
  * Positive: Eradicates server-side user data breaches, eliminates database maintenance overhead, guarantees data minimization.
  * Negative: User registration/lookup databases do not exist; peer discovery must use out-of-band numeric pairing codes. Account recovery is impossible.
