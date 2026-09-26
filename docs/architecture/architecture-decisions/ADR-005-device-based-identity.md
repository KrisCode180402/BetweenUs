# ADR-005: Device-Based Web Crypto Identity Architecture

* **Status**: Approved
* **Date**: 2026-09-13
* **Context**: User identity authentication must avoid centralized databases, accounts, passwords, or phone numbers.
* **Decision**: We generate cryptographic identity keypairs (Ed25519) locally on each client device using the W3C Web Crypto API (`window.crypto.subtle`) with `extractable: false`, stored in browser IndexedDB.
* **Consequences**:
  * Positive: Zero central identity authority, cryptographic identity verification, private keys cannot be extracted by JavaScript or server code.
  * Negative: Identity is bound to the device/browser storage origin. Clearing browser storage deletes identity, requiring explicit out-of-band re-pairing.
