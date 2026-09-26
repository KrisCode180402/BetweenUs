# Complete Data Flows — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 02 — Final System & Trust Architecture  
**Status**: Approved Specification  

---

## Data Flow A: Application Startup
1. User navigates to `https://betweenus.app`.
2. Cloudflare Edge validates HTTPS TLS 1.3 request and passes to Vercel Serverless Origin.
3. Vercel responds with static HTML, CSS, JS, and `manifest.json` bundle.
4. Browser Service Worker intercepts response, checks app version, and serves cached static shell if offline.
5. Content Security Policy (CSP) headers are parsed and enforced by browser.

---

## Data Flow B: Device Initialization & Local Identity Setup
1. PWA opens and checks IndexedDB store for existing `identityKeyPair`.
2. If absent:
   * Browser calls `window.crypto.subtle.generateKey()` for an **Ed25519** keypair (`extractable: false`).
   * Private key is stored in IndexedDB. Public key is exported in SPKI Base64 format.
3. System transitions to `IDLE_UNPAIRED` or `IDLE_PAIRED` state.

---

## Data Flow C: Ephemeral Out-of-Band Pairing
```
USER A (Initiator)                   SIGNALING VPS                   USER B (Responder)
     │                                     │                                 │
     │── 1. PAIRING_REQUEST (WSS) ────────>│                                 │
     │<── 2. Return Code "849201" (3m TTL)─│                                 │
     │                                     │                                 │
     │════════ 3. User Shares Code "849201" Out-of-Band (Verbal) ════════════>│
     │                                     │                                 │
     │                                     │<── 4. PAIRING_SUBMIT (Code+PubKey_B)
     │<── 5. Relay PubKey_B + Challenge────│                                 │
     │── 6. Submit Signed PubKey_A ───────>│                                 │
     │                                     │── 7. Relay Signed PubKey_A ────>│
```

---

## Data Flow D: Partner Identity Verification (SAS Fingerprint)
1. Both devices compute $\text{SAS} = \text{HKDF-SHA256}(PubKey_{\text{min}} \parallel PubKey_{\text{max}})$.
2. SAS formatted as an 8-character hex string (e.g. `A4B8-91F2`) displayed on both UIs.
3. Users verbally compare SAS strings out-of-band.
4. Upon manual UI confirmation, both devices save each other's public key as trusted partner in IndexedDB.

---

## Data Flow E: Audio Call Initiation
1. Initiator taps "Voice Call". Session manager transitions state to `CALL_INITIATING`.
2. Browser calls `getUserMedia({ audio: true, video: false })`.
3. WebRTC engine creates `RTCPeerConnection`, adds audio track, and generates SDP Offer.
4. Offer fingerprint signed with Ed25519 identity key and sent over WebSocket as `SDP_OFFER`.

---

## Data Flow F: Video Call Initiation
1. Initiator taps "Video Call". Session manager transitions state to `CALL_INITIATING`.
2. Browser calls `getUserMedia({ audio: true, video: { width: 1280, height: 720 } })`.
3. WebRTC engine creates `RTCPeerConnection`, adds audio + video tracks, and generates SDP Offer.
4. Signed SDP Offer sent via signaling to responder.

---

## Data Flow G: Direct WebRTC Connection Setup
1. Responder accepts call, obtains media tracks via `getUserMedia()`, applies SDP Offer, generates SDP Answer.
2. Responder signs SDP Answer and sends back via signaling envelope `SDP_ANSWER`.
3. Initiator applies SDP Answer. Both endpoints exchange trickle ICE candidates via signaling (`ICE_CANDIDATE`).
4. WebRTC engines negotiate direct P2P socket over UDP using DTLS-SRTP handshake. Media begins playback.

---

## Data Flow H: TURN Fallback Connection Setup
1. Direct P2P ICE candidate checks fail (e.g., symmetric NAT blocking UDP ports).
2. Endpoints fetch short-lived coturn REST API credentials (HMAC-SHA-1) from signaling server.
3. WebRTC engines select `relay` candidate, routing encrypted SRTP frames through coturn VPS (`turn.betweenus.app:3478`).
4. Coturn forwards raw UDP SRTP packets without decrypting media.

---

## Data Flow I: Call Termination
1. Participant clicks "End Call" or closes browser tab.
2. Client sends ephemeral `DISCONNECT` frame over WebSocket.
3. Session manager stops all `MediaStreamTrack` instances (releasing hardware camera/mic).
4. `RTCPeerConnection.close()` invoked, destroying DTLS-SRTP sockets and master keys in browser C++ process memory.

---

## Data Flow J: Session Destruction
1. Signaling server receives `DISCONNECT` or detects WebSocket socket drop.
2. Signaling server purges all socket references, candidate buffers, and active session tokens from Node.js RAM.
3. Client PWA nullifies ephemeral SDP, ICE, and key agreement variables. Garbage collector reclaims memory.

---

## Data Flow K: Identity Change Detection & Interception
```
USER A                                SIGNALING VPS                          USER B (Re-installed)
  │                                         │                                         │
  │                                         │<── 1. SDP_OFFER (New Unrecognized Key)──│
  │<── 2. Relay SDP_OFFER ──────────────────│                                         │
  │                                         │                                         │
[ Compare Offer Key vs Stored Partner Key ]                                           │
  │                                                                                   │
  ▼                                                                                   │
[ UNMATCHED KEY DETECTED! ]                                                           │
  │                                                                                   │
  ├─► 3. FAIL CLOSED (Reject Connection)                                              │
  ├─► 4. Display Red Alert Banner: "Partner Identity Changed!"                        │
  └─► 5. Require Manual Out-of-Band Re-Pairing + SAS Verification                     │
```

---

## Data Flow L: Security Initialization Failure (Fail-Closed)
1. PWA attempts to initialize Web Crypto API or load IndexedDB identity key.
2. Browser returns error (e.g. storage corrupted, Web Crypto unsupported, script origin violated).
3. System immediately halts initialization, displays locked error screen, and prevents call setup (**Fail-Closed**).
