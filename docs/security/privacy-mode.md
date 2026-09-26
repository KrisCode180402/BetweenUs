# Privacy Mode & Emergency Controls Specification — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 22 — Privacy Mode & Emergency Controls (`BETWEEN_US_PRIVACY_MODE_V1`)  
**Status**: Authoritative Privacy & Security Controls Specification  

---

## 1. Executive Summary & Core Philosophy

**Between Us** provides application-level privacy controls through **Privacy Mode** and an immediate **Emergency Exit** mechanism.

Privacy Mode operates on a single core principle:

```text
MINIMIZE  →  HIDE  →  DISCONNECT  →  CLEAN  →  RETURN TO SAFE STATE
```

---

## 2. Privacy Mode States

The Privacy Mode state machine enforces four deterministic states:

```text
NORMAL
  ↓
[Privacy Mode Activated]
  ↓
PRIVACY_MODE_ACTIVE
  ↓
[Emergency Exit Triggered]
  ↓
EMERGENCY_EXITING
  ↓
[Phase 21 Teardown Executed]
  ↓
SAFE_HOME
```

1. **`NORMAL`**: Standard call UI with encrypted WebRTC media streams active.
2. **`PRIVACY_MODE_ACTIVE`**: Application screen overlay (`PrivacyOverlay`) obscures visual previews, partner details, safety codes, and call controls.
3. **`EMERGENCY_EXITING`**: Immediate session teardown in progress via Phase 21 `cleanupCallSession()`.
4. **`SAFE_HOME`**: Teardown complete. Application returned to neutral home screen with zero lingering session UI.

---

## 3. Emergency Exit Teardown Architecture

The Emergency Exit flow provides a single-step, low-latency call termination mechanism (`⚡ PRIVACY EXIT`).

### Execution Workflow:
1. **User Trigger**: Click `⚡ PRIVACY EXIT` button or press `Escape` key.
2. **Phase 21 Invocation**: Calls `privacyModeManager.activateEmergencyExit(target)` which executes `cleanupCallSession()`.
3. **Hardware Track Halt**: Immediate `MediaStreamTrack.stop()` and `track.enabled = false` executed on local and remote streams.
4. **Session Reference Invalidation**: `sessionRef.currentSessionId = null` ensures late signaling messages or ICE candidates are rejected.
5. **Connection Teardown**: `RTCPeerConnection.close()` and listener nullification.
6. **State Reset**: `CallStateMachine` reset to `CallState.IDLE`.
7. **Safe Home Screen**: Application UI transitions immediately to `SAFE_HOME`.

### Idempotency Guarantee
Calling `activateEmergencyExit()` repeatedly, during race conditions, or while a call is already ending produces 0 exceptions and maintains `CleanupStatus.CLEAN`.

---

## 4. Hardware Track & Background Visibility Controls

### 4.1 Camera & Microphone Capture vs UI Display
- **Camera Off**: Stops the `MediaStreamTrack` hardware capture; camera status indicator accurately displays "Camera Off".
- **Microphone Mute**: Disables/stops microphone track; status indicator accurately displays "Muted".
- **Backgrounding (`visibilitychange`)**: When `document.visibilityState === "hidden"`, `PrivacyOverlay` is rendered to obscure visual content without claiming physical memory erasure.

---

## 5. Technical Non-Claims & System Boundaries

> [!IMPORTANT]
> **Defensible Security Language**: Web applications operating inside browser sandboxes cannot physically prevent OS-level screenshots, hardware screen recording, or compromised operating systems.
>
> **Approved Language**:
> - "Between Us does not intentionally record or store your calls."
> - "Privacy Mode provides application-level privacy controls."
>
> **Prohibited Language**:
> - "Nobody can screenshot this."
> - "100% un-recordable."
> - "Military-grade screenshot protection."
