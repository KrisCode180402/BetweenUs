# Zero Retention Policy — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 21 — Zero Retention (Call / Session Destruction — `BETWEEN_US_ZERO_RETENTION_V1`)  
**Status**: Authoritative Security & Data Retention Policy  

---

## 1. Executive Summary & Philosophy

**Between Us** is designed with a fundamental privacy principle: **Zero Retention of Ephemeral Call State and Media Content**.

Once a private 1-to-1 audio or video call ends—whether by explicit user hangup, call rejection, cancellation, network timeout, connection error, browser tab closure, or page navigation—the application MUST immediately destroy all ephemeral call objects, peer connections, media stream tracks, SDP session descriptions, ICE candidates, temporary credentials, and session timers.

---

## 2. In-Scope Ephemeral Call Data vs Long-Term Identity

| Category | Storage Target | Retention Policy | Teardown Trigger |
| :--- | :--- | :--- | :--- |
| **Long-Term Device Identity** | IndexedDB (`identityKey`, `partnerIdentity`) | Persistent (survives app restarts) | Explicit User Unpair / Reset Identity |
| **Media Stream Tracks** | Browser RAM (`MediaStreamTrack`) | Ephemeral (`enabled=false`, `stop()`) | Hangup / Tab Close / Error |
| **Peer Connection (`RTCPeerConnection`)** | Browser RAM | Ephemeral (`close()`, handlers `null`) | Hangup / Teardown |
| **SDP Offers / Answers** | Client RAM / Signaling WebSocket | Ephemeral (Wiped immediately) | Session Teardown |
| **ICE Candidates** | Client RAM / Signaling WebSocket | Ephemeral (Wiped immediately) | Session Teardown |
| **TURN REST Credentials** | Client RAM (`fetchTurnCredentials`) | Short-Lived TTL (Max 10 minutes) | Expiration / Call Hangup |
| **Call Lifecycle Timers** | Client RAM (`setTimeout` handles) | Ephemeral (`clearTimeout`) | State Transition / Teardown |
| **Call Session ID** | Client RAM (`sessionRef`) | Ephemeral (Invalidated to `null`) | Cleanup Trigger |

---

## 3. Destruction Triggers & Lifecycle Events

1. **User Hangup (`endCall`)**: Explicit user action triggers `cleanupCallSession()`.
2. **Call Rejection / Cancellation**: Recipient declines or caller cancels before connection; immediately triggers `cleanupCallSession()`.
3. **Network / Connection Timeout**: Ringing, signaling, or ICE connection timeout fires; triggers `cleanupCallSession()`.
4. **Unhandled Call Error**: Hardware access failure or WebRTC exception triggers `cleanupCallSession()`.
5. **Page Unload / Tab Closure**: Browser `beforeunload` / `unload` events invoke `cleanupCallSession()`.
6. **Partner Disconnect**: Remote peer disconnect signal triggers local state destruction.

---

## 4. Idempotency & Late Callback Protection

To prevent race conditions, ghost state recovery, or memory leaks:
- `cleanupCallSession()` is **idempotent**. Calling it multiple times in rapid succession produces no errors and maintains `CleanupStatus.CLEAN`.
- Session ID invalidation (`sessionRef.currentSessionId = null`) ensures that any late-arriving signaling messages, delayed ICE candidates, or asynchronous callbacks associated with previous sessions are safely dropped.

---

## 5. Explicit System Boundary Non-Claims

1. **Browser Garbage Collection**: JavaScript code cannot force immediate physical RAM zeroing; garbage collection is scheduled asynchronously by the browser V8/JS engine.
2. **OS Memory & Swap**: Operating system virtual memory page swapping and RAM management exist below application JS runtime boundaries.
3. **Hardware Storage Controllers**: SSD wear-leveling and physical memory cell remanence are outside web application execution boundaries.
