# Storage Module (`lib/storage`)

## Overview
Phase 08 establishes the minimal, privacy-preserving local-state layer for **Between Us**.

The application uses native browser IndexedDB (`between-us-local`, Version 1) strictly for low-sensitivity application state (e.g. UI theme preference, schema version).

## Architectural & Security Invariants
- **Database Name:** `between-us-local`
- **Object Store:** `app_state` (Key path: `key`)
- **Payload Limits:** Maximum 2048 bytes (2 KB) per record; 10240 bytes (10 KB) total store limit.
- **Classification Restriction:** Only `PERSISTENT_LOW_SENSITIVITY` state is permitted in persistent storage.
- **Strict Prohibitions:** Audio, video, MediaStream, MediaStreamTrack, SDP offers, ICE candidates, call history, chat, pairing secrets, private keys, authentication tokens, and analytics are **forbidden** and rejected by `validateStoragePayload()`.
- **Reset Capability:** `clearApplicationState()` deletes `between-us-local` records safely without touching unrelated origin storage.
- **Graceful Degradation:** If IndexedDB is restricted or unavailable (e.g. private browsing), storage falls back gracefully to volatile in-memory storage. No sensitive data is ever written to `localStorage` or `sessionStorage`.
