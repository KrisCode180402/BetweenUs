# Deletion Policy & Destruction Events — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 03 — Privacy & Data Classification  
**Status**: Authoritative Privacy Specification  

---

## 1. Deletion Event Matrix

The **Between Us** architecture defines 9 explicit deletion events that trigger systemic data destruction:

```
[ EVENT TRIGGER ] ──► [ STOP HARDWARE / SOCKETS ] ──► [ PURGE RAM ] ──► [ SCRUB STORAGE ] ──► [ VERIFY CLEANUP ]
```

| Event Trigger | Initiated By | Target Data for Destruction | Deletion Mechanism | Verification Protocol |
| :--- | :--- | :--- | :--- | :--- |
| **`CALL_ENDED`** | User tap "Hang Up" / Tab Close | MediaStreamTracks, DTLS-SRTP keys, SDP, ICE, TURN tokens | `Track.stop()`, `PeerConnection.close()`, `null` assignment | Inspect `readyState === 'ended'` & `signalingState === 'closed'` |
| **`SESSION_TIMEOUT`** | Timer (60s idle / 15m TURN) | Ephemeral session tokens, WS socket state, TURN credentials | Socket `terminate()`, RAM map `delete()` | Assert socket closed & token map empty |
| **`PAIRING_CANCELLED`** | User tap "Cancel Pairing" | Pairing code, pairing challenge token, temporary keys | Clear pairing UI state, purge pairing RAM objects | Assert pairing code nullified |
| **`PAIRING_EXPIRED`** | Timer (3m expiration) | Ephemeral numeric pairing code in signaling RAM | Node.js `setTimeout` map deletion | Assert pairing code lookup returns `null` |
| **`IDENTITY_REPLACED`** | User reset identity | Stored local Ed25519 identity keypair in IndexedDB | `IndexedDB.delete()` transaction | Assert IndexedDB key lookup returns `undefined` |
| **`DEVICE_UNPAIRED`** | User tap "Unpair Partner" | Stored partner public identity key & SAS fingerprint | Delete `pairedPeer` entry in IndexedDB | Assert `pairedPeer` record deleted |
| **`APPLICATION_RESET`** | User tap "Full Reset" | All IndexedDB origin data, Service Worker caches, RAM | Origin storage wipe (`indexedDB.deleteDatabase`) | Assert origin storage fully empty |
| **`BROWSER_DATA_CLEARED`**| User browser action | IndexedDB, Cache Storage, Service Worker registrations | Browser storage origin purge | Assert fresh app initialization state |
| **`SECURITY_FAILURE`** | Tampered signature / Key alert | Active call session, SDP parameters, unverified candidate | Fail-closed state, socket drop, RAM purge | Assert UI locked & media tracks stopped |

---

## 2. Technical Destruction Protocols

### 2.1 Hardware Media Stream Destruction
```javascript
// Technical Protocol: Stop hardware capture tracks
function destroyMediaStream(stream) {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop(); // Releases camera/mic hardware control
      stream.removeTrack(track);
    });
  }
}
```

### 2.2 WebRTC PeerConnection Teardown
```javascript
// Technical Protocol: Destroy WebRTC sockets and master keys
function destroyPeerConnection(pc) {
  if (pc) {
    pc.ontrack = null;
    pc.onicecandidate = null;
    pc.close(); // Triggers C++ core SRTP master key destruction
  }
}
```

### 2.3 Ephemeral Memory Scrubbing
```javascript
// Technical Protocol: Nullify transient RAM references for GC
function scrubSessionRAM(sessionState) {
  sessionState.sdpOffer = null;
  sessionState.sdpAnswer = null;
  sessionState.iceCandidates = [];
  sessionState.turnCredentials = null;
  // Invoke garbage collection hint
}
```
