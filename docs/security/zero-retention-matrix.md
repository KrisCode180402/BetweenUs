# Resource Retention Matrix — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 21 — Zero Retention (Resource Lifecycle Matrix)  
**Status**: Authoritative Reference Matrix  

---

## Resource Teardown Matrix

| Resource / Asset | In-Call State | Post-Call Teardown Action | Verification Test |
| :--- | :--- | :--- | :--- |
| **Microphone Hardware Track** | Active capture stream | `track.enabled = false`, `track.stop()` | Stream active tracks count = 0 |
| **Camera Hardware Track** | Active capture stream | `track.enabled = false`, `track.stop()` | Stream active tracks count = 0 |
| **`RTCPeerConnection`** | Active peer socket (`connected`) | Handlers set to `null`, `pc.close()` | `connectionState === "closed"` |
| **Remote Media Stream** | Active audio/video playback | `track.stop()`, DOM elements detached | Attached DOM source = null |
| **Signaling WebSocket** | Active `ws://` / `wss://` socket | `signalingClient.disconnect()` | Socket readyState = `CLOSED` |
| **Call Session ID** | Valid UUID string | `sessionRef.currentSessionId = null` | Reference is `null` |
| **Session Timers** | Active `setTimeout` handles | `clearTimeout(timer)` | No orphaned callbacks executed |
| **SDP Offer / Answer** | Ephemeral buffer in RAM | Purged from RAM / Garbage Collected | In-memory reference `null` |
| **ICE Candidates** | Ephemeral candidate array | Purged from RAM / Garbage Collected | In-memory reference `null` |
| **TURN REST Tokens** | Ephemeral token object | Expiration / Dereferenced | Client cache cleared |
| **Call State Machine** | `CONNECTED` / `RINGING` | Reset to `CallState.IDLE` | State = `IDLE` |
| **IndexedDB Identity** | Paired device keys | Intentionally Preserved | Device identity intact |
