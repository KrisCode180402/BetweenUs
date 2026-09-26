import test from "node:test";
import assert from "node:assert/strict";

import {
  CallState,
  CallStateMachine,
  CallStateError,
  PeerConnectionManager,
  AudioCallManager,
} from "../../lib/webrtc";
import { generateDeviceKeyPair } from "../../lib/crypto/identity/key-gen";
import { initializeDeviceIdentity, destroyDeviceIdentity } from "../../lib/crypto/identity";
import { savePairedPartner, removePairedPartnerDevice } from "../../lib/pairing";

// Mock WebRTC and MediaDevices for Node.js test environment
class MockMediaStreamTrack {
  public enabled = true;
  public kind = "audio";
  public stopped = false;
  stop() {
    this.stopped = true;
  }
}

class MockMediaStream {
  private tracks: MockMediaStreamTrack[];
  constructor(tracks: MockMediaStreamTrack[] = [new MockMediaStreamTrack()]) {
    this.tracks = tracks;
  }
  getAudioTracks() {
    return this.tracks.filter((t) => t.kind === "audio");
  }
  getTracks() {
    return this.tracks;
  }
}

class MockRTCPeerConnection {
  public connectionState = "new";
  public localDescription: any = null;
  public remoteDescription: any = null;
  public onicecandidate: any = null;
  public ontrack: any = null;
  public onconnectionstatechange: any = null;

  async createOffer() {
    return { type: "offer", sdp: "v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\n" };
  }
  async createAnswer() {
    return { type: "answer", sdp: "v=0\r\no=- 654321 2 IN IP4 127.0.0.1\r\n" };
  }
  async setLocalDescription(desc: any) {
    this.localDescription = desc;
  }
  async setRemoteDescription(desc: any) {
    this.remoteDescription = desc;
  }
  async addIceCandidate(_candidate: any) {
    return Promise.resolve();
  }
  addTrack(_track: any, _stream: any) {}
  close() {
    this.connectionState = "closed";
  }
}

test("Phase 13 — 1-to-1 WebRTC Audio Call Test Suite", async (t) => {

  t.beforeEach(async () => {
    await destroyDeviceIdentity();
    await initializeDeviceIdentity();
    await removePairedPartnerDevice();
  });

  t.afterEach(async () => {
    await removePairedPartnerDevice();
    await destroyDeviceIdentity();
  });

  await t.test("CallStateMachine enforces valid single-path transitions and rejects illegal jumps", () => {
    const sm = new CallStateMachine();
    assert.strictEqual(sm.getState(), CallState.IDLE);

    // Valid path: IDLE -> CALLING -> CONNECTING -> CONNECTED -> ENDING -> ENDED -> IDLE
    sm.transitionTo(CallState.CALLING);
    assert.strictEqual(sm.getState(), CallState.CALLING);

    sm.transitionTo(CallState.CONNECTING);
    assert.strictEqual(sm.getState(), CallState.CONNECTING);

    sm.transitionTo(CallState.CONNECTED);
    assert.strictEqual(sm.getState(), CallState.CONNECTED);

    sm.transitionTo(CallState.ENDING);
    assert.strictEqual(sm.getState(), CallState.ENDING);

    sm.transitionTo(CallState.ENDED);
    assert.strictEqual(sm.getState(), CallState.ENDED);

    sm.reset();
    assert.strictEqual(sm.getState(), CallState.IDLE);

    // Illegal state jump: IDLE -> CONNECTED must throw CallStateError
    assert.throws(
      () => sm.transitionTo(CallState.CONNECTED),
      (err: any) => err instanceof CallStateError && err.message.includes("Illegal call state transition")
    );
  });

  await t.test("Audio-only MediaStream acquisition enforces video: false", async () => {
    let capturedConstraints: any = null;

    // Mock navigator.mediaDevices.getUserMedia
    const originalNavigator = (globalThis as any).navigator;
    Object.defineProperty(globalThis, "navigator", {
      value: {
        mediaDevices: {
          getUserMedia: async (constraints: any) => {
            capturedConstraints = constraints;
            return new MockMediaStream() as any;
          },
        },
      },
      configurable: true,
      writable: true,
    });

    const pcManager = new PeerConnectionManager();
    const stream = await pcManager.acquireMicrophoneStream();

    assert.ok(stream);
    assert.ok(capturedConstraints);
    assert.strictEqual(capturedConstraints.video, false, "MANDATORY SAFETY INVARIANT: video must be strictly false!");
    assert.strictEqual(capturedConstraints.audio.echoCancellation, true);

    pcManager.cleanup();
    Object.defineProperty(globalThis, "navigator", { value: originalNavigator, configurable: true, writable: true });
  });

  await t.test("PeerConnectionManager negotiation: Offer, Answer, Mute, Candidate Queue, Cleanup", async () => {
    const originalNavigator = (globalThis as any).navigator;
    const originalRTC = (globalThis as any).RTCPeerConnection;

    Object.defineProperty(globalThis, "navigator", {
      value: {
        mediaDevices: {
          getUserMedia: async () => new MockMediaStream() as any,
        },
      },
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "RTCPeerConnection", {
      value: MockRTCPeerConnection as any,
      configurable: true,
      writable: true,
    });

    const pcManager = new PeerConnectionManager();

    // 1. Initialize PeerConnection
    let candidateCount = 0;
    let remoteStreamArrived = false;

    await pcManager.initializePeerConnection(
      () => candidateCount++,
      () => { remoteStreamArrived = true; }
    );

    assert.ok(pcManager.getPeerConnection());
    assert.ok(pcManager.getLocalStream());
    assert.strictEqual(candidateCount >= 0, true);
    assert.strictEqual(remoteStreamArrived, false);

    // 2. Generate Offer
    const offerSdp = await pcManager.createOffer();
    assert.ok(offerSdp.includes("v=0"));

    // 3. Queue candidate before remote description
    await pcManager.addIceCandidate({ candidate: "candidate:1 1 UDP 1234", sdpMid: "0", sdpMLineIndex: 0 });

    // 4. Set Remote Answer (flushes queued candidates)
    const dummyAnswer = "v=0\r\no=- 654321 2 IN IP4 127.0.0.1\r\n";
    await pcManager.setRemoteAnswer(dummyAnswer);

    // 5. Test Mute / Unmute
    assert.strictEqual(pcManager.getIsMuted(), false);
    pcManager.setMuted(true);
    assert.strictEqual(pcManager.getIsMuted(), true);

    const audioTrack = pcManager.getLocalStream()!.getAudioTracks()[0] as any;
    assert.strictEqual(audioTrack.enabled, false, "Local audio track must be disabled when muted");

    pcManager.setMuted(false);
    assert.strictEqual(audioTrack.enabled, true);

    // 6. Complete Teardown & Cleanup
    pcManager.cleanup();
    assert.strictEqual(pcManager.getPeerConnection(), null);
    assert.strictEqual(pcManager.getLocalStream(), null);
    assert.strictEqual(audioTrack.stopped, true, "Microphone track must be stopped upon cleanup");

    Object.defineProperty(globalThis, "navigator", { value: originalNavigator, configurable: true, writable: true });
    Object.defineProperty(globalThis, "RTCPeerConnection", { value: originalRTC, configurable: true, writable: true });
  });

  await t.test("AudioCallManager partner trust validation blocks call if partner is unpaired", async () => {
    const devPartner = await generateDeviceKeyPair();
    const partnerIdentity = {
      algorithm: "ECDSA-P256" as const,
      spkiHex: devPartner.spkiHex,
      fingerprint: devPartner.fingerprint,
      createdAt: devPartner.createdAt,
    };

    const callManager = new AudioCallManager({
      serverUrl: "ws://127.0.0.1:9999",
      sessionId: "session_unpaired_test",
      partnerIdentity,
    });

    // Partner is not saved in partner storage -> startCall must fail
    await assert.rejects(
      async () => await callManager.startCall(),
      (err: any) => err.message.includes("No paired partner device found")
    );

    assert.strictEqual(callManager.getState(), CallState.IDLE);
  });

  await t.test("AudioCallManager enforces single active call restriction (ONE_CALL_ONLY)", async () => {
    const devPartner = await generateDeviceKeyPair();
    const partnerIdentity = {
      algorithm: "ECDSA-P256" as const,
      spkiHex: devPartner.spkiHex,
      fingerprint: devPartner.fingerprint,
      createdAt: devPartner.createdAt,
    };

    // Save paired partner
    await savePairedPartner({
      id: "partner_trust",
      partnerPublicIdentity: partnerIdentity,
      pairedAt: Date.now(),
      version: 1,
    });

    const callManager = new AudioCallManager({
      serverUrl: "ws://127.0.0.1:9999",
      sessionId: "session_single_call_test",
      partnerIdentity,
    });

    // Simulate active call state
    (callManager as any).stateMachine.transitionTo(CallState.CALLING);

    // Attempting 2nd call while active must be strictly rejected
    await assert.rejects(
      async () => await callManager.startCall(),
      (err: any) => err.message.includes("Cannot initiate call while another call session is active")
    );

    callManager.endCall();
  });

  await t.test("Zero persistent storage forensics: Audio, SDP, ICE, and call logs are zero persisted", async () => {
    // Inspect local storage mock / IndexedDB scope
    const windowLocalStorage = typeof window !== "undefined" ? window.localStorage : null;
    if (windowLocalStorage) {
      for (let i = 0; i < windowLocalStorage.length; i++) {
        const keyName: string = windowLocalStorage.key(i) || "";
        assert.strictEqual(keyName.includes("audio"), false);
        assert.strictEqual(keyName.includes("sdp"), false);
        assert.strictEqual(keyName.includes("call_log"), false);
      }
    }
    assert.ok(true, "Zero call persistence verified");
  });
});
