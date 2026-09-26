# Between Us — Call State Machine Architecture Specification

> **Phase 16 Architecture Specification**  
> **Version:** 1.0.0  
> **Status:** Authoritative Call Lifecycle Specification

---

## 1. Overview & Principle

**Between Us** requires a deterministic, race-condition-resistant, and privacy-preserving call lifecycle architecture for 1-to-1 WebRTC audio and video calls (`BETWEEN_US_AUDIO_V1`, `BETWEEN_US_VIDEO_V1`, `BETWEEN_US_TURN_V1`).

### Core Invariants
1. **Single Authoritative State Model**: The call lifecycle is governed strictly by an authoritative state machine (`CallStateMachine`). Scattered, contradictory boolean flags (e.g. `isCalling`, `isConnected`, `isEnding`) are strictly prohibited.
2. **Single Active Call Session**: At most **ONE** active call session may exist between paired devices. Multiple concurrent calls or duplicate `RTCPeerConnection` instances are strictly prevented.
3. **Ephemeral Session Ownership**: Every call attempt generates a unique, unpredictable, non-persisted session ID (`BETWEEN_US_CALL_SESSION_<uuid>`). All signaling envelopes, state transitions, and timers are bound to this `sessionId`. Late or stale envelopes belonging to prior or expired sessions are dropped immediately.
4. **Deterministic Simultaneous Call Resolution**: If both paired devices initiate a call simultaneously, the tie-breaker rule compares device public key fingerprints lexicographically (`localFingerprint < partnerFingerprint`). The device with the **lower** fingerprint wins the caller role; the device with the **higher** fingerprint yields its outgoing attempt and accepts the incoming invitation.
5. **Guaranteed Hardware Teardown**: Upon reaching any terminal state (`ENDED`, `FAILED`, `TIMED_OUT`, `REJECTED`, `CANCELLED`), all owned microphone and camera hardware tracks are stopped immediately (`track.stop()`), `RTCPeerConnection` is closed, DOM elements are detached, and transient RAM memory is wiped. Zero data is persisted to disk.

---

## 2. Call State Definitions

| State | Purpose | Allowed Outgoing Transitions | Timers | Owned Resources | Cleanup Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`IDLE`** | Ready for new call; no active call | `OUTGOING_INITIATING`, `INCOMING_RINGING` | None | None | Reset state machine |
| **`OUTGOING_INITIATING`** | Outgoing call requested; preparing TURN & signaling | `OUTGOING_RINGING`, `CANCELLED`, `FAILED`, `TIMED_OUT` | 10s Initiation | Temporary Signaling Client | Clear timers, close signaling |
| **`OUTGOING_RINGING`** | Offer sent; waiting for remote answer | `ACCEPTING`, `NEGOTIATING`, `CONNECTING`, `REJECTED`, `CANCELLED`, `FAILED`, `TIMED_OUT` | 30s Ringing | Local MediaStream, Signaling | Stop tracks, close PC |
| **`INCOMING_RINGING`** | Offer received from paired partner; ringing UI | `ACCEPTING`, `REJECTED`, `CANCELLED`, `FAILED`, `TIMED_OUT` | 30s Ringing | Incoming invitation payload | Clear invitation, reset UI |
| **`ACCEPTING`** | User accepted incoming call; acquiring local stream | `NEGOTIATING`, `CONNECTING`, `FAILED`, `TIMED_OUT` | 30s Connection | Local MediaStream | Stop tracks, close PC |
| **`NEGOTIATING`** | SDP offer/answer & ICE candidate exchange in progress | `CONNECTING`, `RECONNECTING`, `FAILED`, `TIMED_OUT` | 30s Connection | `RTCPeerConnection`, Local/Remote Streams | Stop tracks, close PC |
| **`CONNECTING`** | PeerConnection established; waiting for ICE candidate completion | `CONNECTED`, `RECONNECTING`, `FAILED`, `TIMED_OUT` | 30s Connection | `RTCPeerConnection`, Local/Remote Streams | Stop tracks, close PC |
| **`CONNECTED`** | Real-time audio/video media active | `RECONNECTING`, `ENDING`, `FAILED` | None | Active `RTCPeerConnection`, Hardware Tracks | Stop tracks, close PC |
| **`RECONNECTING`** | Temporary network interruption detected (`ICE checking/disconnected`) | `CONNECTED`, `FAILED`, `TIMED_OUT` | 15s Reconnection | `RTCPeerConnection`, Hardware Tracks | Stop tracks, close PC |
| **`ENDING`** | Local or remote hangup initiated; tearing down resources | `ENDED` | Immediate | Teardown lock | Purge RAM references |
| **`ENDED`** | Terminal state; call ended cleanly | `IDLE` | Immediate | None | Return to `IDLE` |
| **`FAILED`** | Terminal state; call setup or connection failed | `IDLE`, `ENDED` | Immediate | None | Return to `IDLE` |
| **`TIMED_OUT`** | Terminal state; session timer expired | `IDLE`, `ENDED` | Immediate | None | Return to `IDLE` |
| **`REJECTED`** | Terminal state; incoming call declined by remote user | `IDLE`, `ENDED` | Immediate | None | Return to `IDLE` |
| **`CANCELLED`** | Terminal state; outgoing call cancelled by caller | `IDLE`, `ENDED` | Immediate | None | Return to `IDLE` |

---

## 3. Transition Matrix & Event Reducer

```
IDLE
 ├── START_CALL ─────────► OUTGOING_INITIATING
 └── INCOMING_OFFER ─────► INCOMING_RINGING

OUTGOING_INITIATING
 ├── OFFER_SENT ─────────► OUTGOING_RINGING
 ├── CANCEL ─────────────► CANCELLED
 ├── ERROR ──────────────► FAILED
 └── TIMEOUT ────────────► TIMED_OUT

OUTGOING_RINGING
 ├── SDP_EXCHANGE ───────► NEGOTIATING
 ├── ACCEPT ─────────────► ACCEPTING
 ├── DECLINE ────────────► REJECTED
 ├── CANCEL ─────────────► CANCELLED
 └── TIMEOUT ────────────► TIMED_OUT

INCOMING_RINGING
 ├── ACCEPT ─────────────► ACCEPTING
 ├── DECLINE ────────────► REJECTED
 └── TIMEOUT ────────────► TIMED_OUT

ACCEPTING
 ├── SDP_EXCHANGE ───────► NEGOTIATING
 └── ERROR ──────────────► FAILED

NEGOTIATING / CONNECTING
 ├── ICE_CONNECTED ──────► CONNECTED
 ├── NETWORK_INTERRUPTED ► RECONNECTING
 └── TIMEOUT ────────────► TIMED_OUT

CONNECTED
 ├── NETWORK_INTERRUPTED ► RECONNECTING
 └── HANGUP ─────────────► ENDING

RECONNECTING
 ├── RECONNECTED ────────► CONNECTED
 └── TIMEOUT / ERROR ────► FAILED

ENDING ──────────────────► ENDED ──► IDLE
```

---

## 4. Resource & Media Teardown Protocol

When transitioning to ANY terminal state (`ENDED`, `FAILED`, `TIMED_OUT`, `REJECTED`, `CANCELLED`), the manager executes `cleanupAndEnd()`:

1. **Session Timer Cancellation**: All initiation, ringing, connection, and reconnection timers are cleared (`clearTimeout`).
2. **Hardware Track Termination**: `localStream.getTracks().forEach(track => track.stop())`. Microphones and cameras are immediately powered down.
3. **PeerConnection Teardown**: `pc.close()`, `pc.onicecandidate = null`, `pc.ontrack = null`, `pc.onconnectionstatechange = null`.
4. **Signaling Connection Disconnect**: Ephemeral WebSocket signaling session is ended and disconnected.
5. **Memory Wiping**: Transient memory pointers (`localStream`, `remoteStream`, `pcManager`, `incomingInvitation`) are nullified.
6. **Zero Disk Persistence**: Zero call session data, SDP descriptions, ICE candidate lists, or TURN credentials are saved to `localStorage`, `IndexedDB`, or `CacheStorage`.
