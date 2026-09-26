# Storage Policy & Isolation Rules — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 03 — Privacy & Data Classification  
**Status**: Authoritative Privacy Specification  

---

## 1. Storage Isolation Architecture

```
+-----------------------------------------------------------------------------------+
| CLIENT BROWSER ORIGIN STORAGE (Local Device Only)                                 |
|                                                                                   |
|  ┌─────────────────────────────────────────────────────────────────────────────┐  |
|  │ PERMITTED PERSISTENT STORAGE: IndexedDB ("BetweenUs_Security_Store")        │  |
|  │ - "identityKeyPair": Ed25519 Keypair (extractable: false)                   │  |
|  │ - "pairedPeer": { partnerPublicKeySpki, sasVerificationStatus }              │  |
|  └─────────────────────────────────────────────────────────────────────────────┘  |
|  ┌─────────────────────────────────────────────────────────────────────────────┐  |
|  │ PERMITTED STATIC APP SHELL: Cache Storage ("BetweenUs_AppShell_v1")         │  |
|  │ - Static HTML, CSS, JS, Manifest, Icons (Zero dynamic payload caching)      │  |
|  └─────────────────────────────────────────────────────────────────────────────┘  |
|  ┌─────────────────────────────────────────────────────────────────────────────┐  |
|  │ PROHIBITED PERSISTENT STORAGE: LocalStorage / SessionStorage / Cookies      │  |
|  │ - PROHIBITED for private keys, SDP offers/answers, ICE candidates, tokens.  │  |
|  └─────────────────────────────────────────────────────────────────────────────┘  |
+-----------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------+
| BACKEND SERVER STORAGE (Zero Persistence)                                         |
|                                                                                   |
|  - Signaling Server VPS: ZERO Database, ZERO Filesystem storage (RAM maps only)   |
|  - coturn TURN Relay VPS: ZERO Database, ZERO Media storage (UDP relay only)      |
+-----------------------------------------------------------------------------------+
```

---

## 2. Browser Storage Rules & Risk Analysis

| Storage API | Allowed? | Permitted Contents | Prohibited Contents | Privacy Risk | Mandatory Security Controls |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **IndexedDB** | **YES** | Identity Keypair (`extractable: false`), Paired Peer Public Key | Unencrypted private keys, call history, media buffers | Stolen device file inspection | Origin isolation, `extractable: false` WebCrypto keys |
| **Cache Storage** | **YES** | Static static PWA code files (`index.html`, `main.css`, `app.js`) | Dynamic API responses, WebSockets, media blobs, SDPs | Serving backdoored app shell | Service Worker strictly scoped to static bundle assets |
| **LocalStorage** | **NO** | Non-sensitive UI theme preferences (`dark`/`light`) | Private keys, SDPs, tokens, ICE candidates, call history | XSS script access risk | Absolutely zero secret key or token storage |
| **SessionStorage**| **NO** | **PROHIBITED** for sensitive data | Private keys, SDPs, tokens, ICE candidates, call state | Browser session leakage | Zero session storage usage for call secrets |
| **Cookies** | **NO** | **PROHIBITED** (Zero cookies used) | Session tokens, tracking IDs, user identifiers | Cross-site tracking | `Set-Cookie` headers strictly disabled across app |
| **Volatile RAM** | **YES** | Active MediaStreamTracks, DTLS keys, SDP buffers, nonces | Persistent data storage | Cold-boot memory dump | Explicit `null` assignment and garbage collection on call end |
