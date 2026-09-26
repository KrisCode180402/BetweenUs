# ADR-009: Minimal Third-Party Dependency Policy

* **Status**: Approved
* **Date**: 2026-09-13
* **Context**: Open-source supply-chain attacks frequently target deeply nested npm transitive dependencies.
* **Decision**: We enforce a strict minimal dependency policy. We rely strictly on standard web platform APIs (W3C Web Crypto API, native WebSockets, native WebRTC, IndexedDB) and core UI frameworks (React, Next.js, Tailwind CSS, `ws` for Node.js). Third-party utility libraries are avoided.
* **Consequences**:
  * Positive: Drastically reduces supply-chain attack surface, eliminates transitive dependency vulnerabilities, reduces bundle size.
  * Negative: Requires writing thin, focused wrapper modules for cryptographic operations and WebSocket state management using native APIs.
