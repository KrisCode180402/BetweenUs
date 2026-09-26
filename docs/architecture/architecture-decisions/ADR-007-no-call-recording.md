# ADR-007: Architectural Prohibition of Call Recording Facilities

* **Status**: Approved
* **Date**: 2026-09-13
* **Context**: User trust depends on absolute confidence that live audio/video streams are never recorded or archived by the platform.
* **Decision**: We establish a strict architectural prohibition against adding call recording code paths, cloud storage buckets, or local disk buffering mechanisms anywhere within the application or backend.
* **Consequences**:
  * Positive: Eliminates media data liability, enforces total call privacy, simplifies infrastructure requirements.
  * Negative: Users cannot save or record calls through the application interface.
