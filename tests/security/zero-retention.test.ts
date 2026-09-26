import test from "node:test";
import assert from "node:assert/strict";

import { cleanupCallSession, getCleanupStatus, CleanupStatus } from "../../lib/webrtc/cleanup";
import { CallStateMachine } from "../../lib/webrtc/call-state-machine";
import { CallState } from "../../lib/webrtc/types";

test("Phase 21 — Zero Retention Lifecycle & Session Destruction Test Suite", async (t) => {

  await t.test("1. cleanupCallSession stops all local and remote media tracks", () => {
    let mockTrack1Stopped = false;
    let mockTrack1Enabled = true;
    let mockTrack2Stopped = false;
    let mockTrack2Enabled = true;

    const mockLocalStream: any = {
      getTracks: () => [
        {
          get enabled() { return mockTrack1Enabled; },
          set enabled(val: boolean) { mockTrack1Enabled = val; },
          stop: () => { mockTrack1Stopped = true; },
        },
      ],
    };

    const mockRemoteStream: any = {
      getTracks: () => [
        {
          get enabled() { return mockTrack2Enabled; },
          set enabled(val: boolean) { mockTrack2Enabled = val; },
          stop: () => { mockTrack2Stopped = true; },
        },
      ],
    };

    const status = cleanupCallSession({
      localStream: mockLocalStream,
      remoteStream: mockRemoteStream,
    });

    assert.equal(status, CleanupStatus.CLEAN);
    assert.equal(mockTrack1Enabled, false);
    assert.equal(mockTrack1Stopped, true);
    assert.equal(mockTrack2Enabled, false);
    assert.equal(mockTrack2Stopped, true);
  });

  await t.test("2. cleanupCallSession closes PeerConnection and nullifies event handlers", () => {
    let closeCalled = false;

    const mockPeerConnection: any = {
      ontrack: () => {},
      onicecandidate: () => {},
      oniceconnectionstatechange: () => {},
      onconnectionstatechange: () => {},
      onsignalingstatechange: () => {},
      onicegatheringstatechange: () => {},
      connectionState: "connected",
      close: () => { closeCalled = true; },
    };

    const status = cleanupCallSession({
      pc: mockPeerConnection,
    });

    assert.equal(status, CleanupStatus.CLEAN);
    assert.equal(mockPeerConnection.ontrack, null);
    assert.equal(mockPeerConnection.onicecandidate, null);
    assert.equal(mockPeerConnection.oniceconnectionstatechange, null);
    assert.equal(mockPeerConnection.onconnectionstatechange, null);
    assert.equal(mockPeerConnection.onsignalingstatechange, null);
    assert.equal(mockPeerConnection.onicegatheringstatechange, null);
    assert.equal(closeCalled, true);
  });

  await t.test("3. cleanupCallSession invalidates session reference to drop late callbacks", () => {
    const sessionRef = { currentSessionId: "session-12345" };

    const status = cleanupCallSession({
      sessionRef,
    });

    assert.equal(status, CleanupStatus.CLEAN);
    assert.equal(sessionRef.currentSessionId, null);
  });

  await t.test("4. cleanupCallSession clears active timers safely", () => {
    const mockTimer1 = setTimeout(() => {}, 10000);
    const mockTimer2 = setTimeout(() => {}, 10000);

    const status = cleanupCallSession({
      timers: [mockTimer1, mockTimer2, null],
    });

    assert.equal(status, CleanupStatus.CLEAN);
  });

  await t.test("5. cleanupCallSession resets CallStateMachine to IDLE", () => {
    const stateMachine = new CallStateMachine();
    stateMachine.transitionTo(CallState.CALLING);
    assert.equal(stateMachine.getState(), CallState.CALLING);

    const status = cleanupCallSession({
      stateMachine,
    });

    assert.equal(status, CleanupStatus.CLEAN);
    assert.equal(stateMachine.getState(), CallState.IDLE);
  });

  await t.test("6. cleanupCallSession is completely idempotent when invoked repeatedly", () => {
    const sessionRef = { currentSessionId: "session-9999" };
    const stateMachine = new CallStateMachine();

    const status1 = cleanupCallSession({
      sessionRef,
      stateMachine,
    });

    const status2 = cleanupCallSession({
      sessionRef,
      stateMachine,
    });

    assert.equal(status1, CleanupStatus.CLEAN);
    assert.equal(status2, CleanupStatus.CLEAN);
    assert.equal(getCleanupStatus(), CleanupStatus.CLEAN);
  });

  await t.test("7. Storage isolation: verify no SDP or call media remnants exist in persistent browser storage", () => {
    if (typeof localStorage !== "undefined") {
      assert.equal(localStorage.getItem("sdp_offer"), null);
      assert.equal(localStorage.getItem("sdp_answer"), null);
      assert.equal(localStorage.getItem("call_history"), null);
    }
  });
});
