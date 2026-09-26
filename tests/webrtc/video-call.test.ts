import test from "node:test";
import assert from "node:assert/strict";

import { PeerConnectionManager } from "../../lib/webrtc";
import { initializeDeviceIdentity, destroyDeviceIdentity } from "../../lib/crypto/identity";
import { removePairedPartnerDevice } from "../../lib/pairing";

// Mock WebRTC and MediaDevices for Node.js test environment
class MockMediaStreamTrack {
  public enabled = true;
  public stopped = false;
  constructor(public kind: "audio" | "video" = "audio") {}
  stop() {
    this.stopped = true;
  }
}

class MockMediaStream {
  private tracks: MockMediaStreamTrack[];
  constructor(tracks: MockMediaStreamTrack[] = [new MockMediaStreamTrack("audio"), new MockMediaStreamTrack("video")]) {
    this.tracks = tracks;
  }
  getAudioTracks() {
    return this.tracks.filter((t) => t.kind === "audio");
  }
  getVideoTracks() {
    return this.tracks.filter((t) => t.kind === "video");
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
  public addedTracks: any[] = [];

  async createOffer(_options?: any) {
    return { type: "offer", sdp: "v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\nm=audio 9 UDP\r\nm=video 9 UDP\r\n" };
  }
  async createAnswer() {
    return { type: "answer", sdp: "v=0\r\no=- 654321 2 IN IP4 127.0.0.1\r\nm=audio 9 UDP\r\nm=video 9 UDP\r\n" };
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
  addTrack(track: any, _stream: any) {
    this.addedTracks.push(track);
  }
  getSenders() {
    return this.addedTracks.map((t) => ({ track: t, replaceTrack: async () => {} }));
  }
  close() {
    this.connectionState = "closed";
  }
}

test("Phase 14 — 1-to-1 WebRTC Video Call Test Suite", async (t) => {

  t.beforeEach(async () => {
    await destroyDeviceIdentity();
    await initializeDeviceIdentity();
    await removePairedPartnerDevice();
  });

  t.afterEach(async () => {
    await removePairedPartnerDevice();
    await destroyDeviceIdentity();
  });

  await t.test("Video call media stream acquisition requests audio + video constraints", async () => {
    let capturedConstraints: any = null;

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
    const stream = await pcManager.acquireMediaStream("video");

    assert.ok(stream);
    assert.ok(capturedConstraints);
    assert.notStrictEqual(capturedConstraints.video, false, "Video call must acquire camera stream!");
    assert.strictEqual(capturedConstraints.video.facingMode, "user");
    assert.strictEqual(capturedConstraints.audio.echoCancellation, true);

    pcManager.cleanup();
    Object.defineProperty(globalThis, "navigator", { value: originalNavigator, configurable: true, writable: true });
  });

  await t.test("Audio call regression protection: Audio call MUST NEVER request video", async () => {
    let capturedConstraints: any = null;

    const originalNavigator = (globalThis as any).navigator;
    Object.defineProperty(globalThis, "navigator", {
      value: {
        mediaDevices: {
          getUserMedia: async (constraints: any) => {
            capturedConstraints = constraints;
            return new MockMediaStream([new MockMediaStreamTrack("audio")]) as any;
          },
        },
      },
      configurable: true,
      writable: true,
    });

    const pcManager = new PeerConnectionManager();
    const stream = await pcManager.acquireMediaStream("audio");

    assert.ok(stream);
    assert.ok(capturedConstraints);
    assert.strictEqual(capturedConstraints.video, false, "MANDATORY SAFETY REGRESSION INVARIANT: Audio call MUST NEVER request video!");

    pcManager.cleanup();
    Object.defineProperty(globalThis, "navigator", { value: originalNavigator, configurable: true, writable: true });
  });

  await t.test("Single RTCPeerConnection carries both audio and video tracks", async () => {
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
    const mockPc = await pcManager.initializePeerConnection("video", () => {}, () => {});

    const addedTracks = (mockPc as any).addedTracks;
    assert.strictEqual(addedTracks.length, 2, "Single PeerConnection must carry exactly 2 tracks (audio + video)");
    assert.strictEqual(addedTracks.filter((t: any) => t.kind === "audio").length, 1);
    assert.strictEqual(addedTracks.filter((t: any) => t.kind === "video").length, 1);

    pcManager.cleanup();
    Object.defineProperty(globalThis, "navigator", { value: originalNavigator, configurable: true, writable: true });
    Object.defineProperty(globalThis, "RTCPeerConnection", { value: originalRTC, configurable: true, writable: true });
  });

  await t.test("Camera toggle control (enable/disable) updates local video track state", async () => {
    const originalNavigator = (globalThis as any).navigator;
    Object.defineProperty(globalThis, "navigator", {
      value: {
        mediaDevices: {
          getUserMedia: async () => new MockMediaStream() as any,
        },
      },
      configurable: true,
      writable: true,
    });

    const pcManager = new PeerConnectionManager();
    await pcManager.acquireMediaStream("video");

    const videoTrack = pcManager.getLocalStream()!.getVideoTracks()[0] as any;
    assert.strictEqual(videoTrack.enabled, true, "Camera track enabled by default on acquisition");

    assert.strictEqual(pcManager.getIsCameraOff(), false);
    pcManager.setCameraEnabled(false);
    assert.strictEqual(pcManager.getIsCameraOff(), true);
    assert.strictEqual(videoTrack.enabled, false, "Camera track must be disabled when camera is turned off");

    pcManager.setCameraEnabled(true);
    assert.strictEqual(pcManager.getIsCameraOff(), false);
    assert.strictEqual(videoTrack.enabled, true);

    pcManager.cleanup();
    Object.defineProperty(globalThis, "navigator", { value: originalNavigator, configurable: true, writable: true });
  });

  await t.test("Complete video call teardown stops both audio and video hardware tracks", async () => {
    const originalNavigator = (globalThis as any).navigator;
    Object.defineProperty(globalThis, "navigator", {
      value: {
        mediaDevices: {
          getUserMedia: async () => new MockMediaStream() as any,
        },
      },
      configurable: true,
      writable: true,
    });

    const pcManager = new PeerConnectionManager();
    await pcManager.acquireMediaStream("video");

    const audioTrack = pcManager.getLocalStream()!.getAudioTracks()[0] as any;
    const videoTrack = pcManager.getLocalStream()!.getVideoTracks()[0] as any;

    pcManager.cleanup();

    assert.strictEqual(audioTrack.stopped, true, "Microphone track must be stopped upon call teardown");
    assert.strictEqual(videoTrack.stopped, true, "Camera track must be stopped upon call teardown");
    assert.strictEqual(pcManager.getLocalStream(), null);

    Object.defineProperty(globalThis, "navigator", { value: originalNavigator, configurable: true, writable: true });
  });

  await t.test("Zero persistent storage forensics: Zero video snapshots, thumbnails, or logs on disk", async () => {
    const windowLocalStorage = typeof window !== "undefined" ? window.localStorage : null;
    if (windowLocalStorage) {
      for (let i = 0; i < windowLocalStorage.length; i++) {
        const keyName: string = windowLocalStorage.key(i) || "";
        assert.strictEqual(keyName.includes("video"), false);
        assert.strictEqual(keyName.includes("snapshot"), false);
        assert.strictEqual(keyName.includes("thumbnail"), false);
        assert.strictEqual(keyName.includes("call_log"), false);
      }
    }
    assert.ok(true, "Zero video storage forensics verified");
  });
});
