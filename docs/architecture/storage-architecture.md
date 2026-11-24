# Storage Architecture — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 03 — Privacy & Data Classification  
**Status**: Approved Specification (Cross-Referenced to [`docs/privacy/storage-policy.md`](../privacy/storage-policy.md))  

---

## 1. Zero Database Posture (`DATABASE = NONE FOR V1`)

**Between Us** enforces an explicit architectural constraint for Version 1: **DATABASE = NONE**.

```
+-----------------------------------------------------------------------------------+
| ARCHITECTURAL INVARIANT: ZERO SERVER-SIDE PERSISTENT DATABASE                     |
|                                                                                   |
| The backend signaling server and TURN relay servers operate with ZERO persistent   |
| storage engines (No PostgreSQL, No MySQL, No MongoDB, No Redis disk-persistence,  |
| No SQLite, No S3/Blob storage).                                                   |
|                                                                                   |
| Rationale:                                                                        |
| If data is not stored, it cannot be leaked, subpoenaed, stolen, or compromised.   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Device Storage vs. Server Storage Allocation

For full details, see [`docs/privacy/storage-policy.md`](../privacy/storage-policy.md).

### 2.1 Server Storage Specification (ZERO PERSISTENCE)
* **Application Database**: **NONE**.
* **Call History Database**: **NONE**.
* **User Identity Database**: **NONE**.
* **Media / File Storage**: **NONE**.
* **Ephemeral Server RAM**: Short-lived Node.js in-memory WebSocket channel maps, single-use pairing codes, and sliding nonce caches. All server RAM state is lost on daemon restart.

### 2.2 Client Device Storage Specification (MINIMAL ISOLATED STORAGE)

```
[ Browser Client Origin Storage ]
         │
         ├─► IndexedDB ("BetweenUs_Security_Store")
         │     ├── Store "identityKeyPair": Ed25519 Keypair (extractable: false)
         │     └── Store "pairedPeer": { partnerPublicKeySpki, sasVerificationStatus }
         │
         ├─► Service Worker Cache Storage ("BetweenUs_AppShell_v1")
         │     └── Static PWA assets (index.html, app.js, main.css, manifest.json)
         │
         ├─► LocalStorage / SessionStorage
         │     └── PROHIBITED for sensitive cryptographic keys, tokens, or SDP payloads.
         │
         └─► Volatile Browser RAM
               └── Active MediaStreamTracks, WebRTC DTLS keys, transient SDP buffers.
```
