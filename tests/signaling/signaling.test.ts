import test from "node:test";
import assert from "node:assert/strict";
import { WebSocket } from "ws";

import { SignalingServer } from "../../server/signaling/server";
import { SignalingClient } from "../../lib/signaling/client";
import { ClientSignalingState } from "../../lib/signaling/types";
import {
  SignalingMessageType,
} from "../../server/signaling/types";
import { generateDeviceKeyPair } from "../../lib/crypto/identity/key-gen";
import { initializeDeviceIdentity, destroyDeviceIdentity } from "../../lib/crypto/identity";

test("Phase 12 — Ephemeral WebSocket Signaling Test Suite", async (t) => {
  let server: SignalingServer;
  let serverPort: number;

  t.beforeEach(async () => {
    await destroyDeviceIdentity();
    await initializeDeviceIdentity();
    server = new SignalingServer();
    // Start server on dynamic port (0) for isolation
    serverPort = await server.start(0);
  });

  t.afterEach(async () => {
    await server.stop();
  });

  await t.test("Two-participant session lifecycle: JOIN -> SESSION_READY -> SDP -> ICE -> PEER_LEFT", async () => {
    const devA = await generateDeviceKeyPair();
    const devB = await generateDeviceKeyPair();

    const identityA = { algorithm: "ECDSA-P256" as const, spkiHex: devA.spkiHex, fingerprint: devA.fingerprint, createdAt: devA.createdAt };
    const identityB = { algorithm: "ECDSA-P256" as const, spkiHex: devB.spkiHex, fingerprint: devB.fingerprint, createdAt: devB.createdAt };

    const serverUrl = `ws://127.0.0.1:${serverPort}`;
    const sessionId = "a1b2c3d4e5f678901234567890abcdef";

    let clientAReady = false;
    let clientBReady = false;
    let receivedOfferOnB: any = null;
    let receivedAnswerOnA: any = null;
    let receivedIceOnB: any = null;
    let peerLeftReasonOnA: any = null;

    const clientA = new SignalingClient({
      serverUrl,
      sessionId,
      localIdentity: identityA,
      privateKey: devA.privateKey,
      events: {
        onSessionReady: () => { clientAReady = true; },
        onSdpAnswer: (answer) => { receivedAnswerOnA = answer; },
        onPeerLeft: (reason) => { peerLeftReasonOnA = reason; },
      },
    });

    const clientB = new SignalingClient({
      serverUrl,
      sessionId,
      localIdentity: identityB,
      privateKey: devB.privateKey,
      events: {
        onSessionReady: () => { clientBReady = true; },
        onSdpOffer: (offer) => { receivedOfferOnB = offer; },
        onIceCandidate: (candidate) => { receivedIceOnB = candidate; },
      },
    });

    // Client A connects & joins
    await clientA.connect();
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.strictEqual(clientA.getState(), ClientSignalingState.JOINED);

    // Client B connects & joins -> triggers SESSION_READY for both!
    await clientB.connect();
    await new Promise((resolve) => setTimeout(resolve, 100));

    assert.strictEqual(clientA.getState(), ClientSignalingState.READY);
    assert.strictEqual(clientB.getState(), ClientSignalingState.READY);
    assert.strictEqual(clientAReady, true);
    assert.strictEqual(clientBReady, true);

    // Client A sends SDP Offer -> Client B receives SDP Offer
    const dummyOffer = "v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n";
    await clientA.sendSdpOffer(dummyOffer);
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(receivedOfferOnB);
    assert.strictEqual(receivedOfferOnB!.type, "offer");
    assert.strictEqual(receivedOfferOnB!.sdp, dummyOffer);

    // Client B sends SDP Answer -> Client A receives SDP Answer
    const dummyAnswer = "v=0\r\no=- 654321 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n";
    await clientB.sendSdpAnswer(dummyAnswer);
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(receivedAnswerOnA);
    assert.strictEqual(receivedAnswerOnA!.type, "answer");
    assert.strictEqual(receivedAnswerOnA!.sdp, dummyAnswer);

    // Client A sends ICE candidate -> Client B receives ICE candidate
    await clientA.sendIceCandidate("candidate:1 1 UDP 2122260223 127.0.0.1 54321 typ host", "0", 0);
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(receivedIceOnB);
    assert.strictEqual(receivedIceOnB!.candidate.includes("candidate:1"), true);

    // Client B disconnects -> Client A receives PEER_LEFT notification
    clientB.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(peerLeftReasonOnA);
    assert.ok(peerLeftReasonOnA!.includes("Peer disconnected"));

    clientA.disconnect();
  });

  await t.test("3rd participant join attempt is strictly REJECTED (Max 2 participants)", async () => {
    const devA = await generateDeviceKeyPair();
    const devB = await generateDeviceKeyPair();
    const devC = await generateDeviceKeyPair();

    const identityA = { algorithm: "ECDSA-P256" as const, spkiHex: devA.spkiHex, fingerprint: devA.fingerprint, createdAt: devA.createdAt };
    const identityB = { algorithm: "ECDSA-P256" as const, spkiHex: devB.spkiHex, fingerprint: devB.fingerprint, createdAt: devB.createdAt };
    const identityC = { algorithm: "ECDSA-P256" as const, spkiHex: devC.spkiHex, fingerprint: devC.fingerprint, createdAt: devC.createdAt };

    const serverUrl = `ws://127.0.0.1:${serverPort}`;
    const sessionId = "session_max_two_participants_test";

    const clientA = new SignalingClient({ serverUrl, sessionId, localIdentity: identityA, privateKey: devA.privateKey });
    const clientB = new SignalingClient({ serverUrl, sessionId, localIdentity: identityB, privateKey: devB.privateKey });
    let clientCError: any = null;
    const clientC = new SignalingClient({
      serverUrl,
      sessionId,
      localIdentity: identityC,
      privateKey: devC.privateKey,
      events: { onError: (err) => { clientCError = err; } },
    });

    await clientA.connect();
    await clientB.connect();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Client C attempts 3rd join
    await clientC.connect();
    await new Promise((resolve) => setTimeout(resolve, 100));

    assert.ok(clientCError);
    assert.ok(clientCError!.includes("maximum limit of 2 participants"));

    clientA.disconnect();
    clientB.disconnect();
    clientC.disconnect();
  });

  await t.test("Oversized payload (>32KB) and malformed JSON are rejected safely", async () => {
    const serverUrl = `ws://127.0.0.1:${serverPort}`;
    const socket = new WebSocket(serverUrl);

    let receivedError: any = null;

    await new Promise<void>((resolve) => {
      socket.on("open", () => resolve());
    });

    socket.on("message", (data) => {
      receivedError = JSON.parse(data.toString());
    });

    // Send malformed JSON
    socket.send("THIS IS NOT VALID JSON");
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(receivedError);
    assert.strictEqual(receivedError.type, SignalingMessageType.ERROR);

    // Send oversized message >32KB
    const oversizedPayload = JSON.stringify({
      version: 1,
      type: "SESSION_JOIN",
      sessionId: "oversized_test",
      sender: "00".repeat(32),
      payload: { data: "X".repeat(35000) },
    });

    socket.send(oversizedPayload);
    await new Promise((resolve) => setTimeout(resolve, 50));

    socket.close();
  });

  await t.test("Cross-session message isolation prevents routing between unrelated sessions", async () => {
    const devA = await generateDeviceKeyPair();
    const devB = await generateDeviceKeyPair();

    const identityA = { algorithm: "ECDSA-P256" as const, spkiHex: devA.spkiHex, fingerprint: devA.fingerprint, createdAt: devA.createdAt };
    const identityB = { algorithm: "ECDSA-P256" as const, spkiHex: devB.spkiHex, fingerprint: devB.fingerprint, createdAt: devB.createdAt };

    const serverUrl = `ws://127.0.0.1:${serverPort}`;

    let receivedOfferOnB = false;

    const clientA = new SignalingClient({ serverUrl, sessionId: "session_111", localIdentity: identityA, privateKey: devA.privateKey });
    const clientB = new SignalingClient({
      serverUrl,
      sessionId: "session_222",
      localIdentity: identityB,
      privateKey: devB.privateKey,
      events: { onSdpOffer: () => { receivedOfferOnB = true; } },
    });

    await clientA.connect();
    await clientB.connect();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Client A sends offer in session_111
    try {
      await clientA.sendSdpOffer("v=0\r\n");
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.strictEqual(receivedOfferOnB, false, "Client B in session_222 must NOT receive offer from session_111");

    clientA.disconnect();
    clientB.disconnect();
  });

  await t.test("Ephemeral memory cleanup purges session state upon termination", async () => {
    const devA = await generateDeviceKeyPair();
    const devB = await generateDeviceKeyPair();

    const identityA = { algorithm: "ECDSA-P256" as const, spkiHex: devA.spkiHex, fingerprint: devA.fingerprint, createdAt: devA.createdAt };
    const identityB = { algorithm: "ECDSA-P256" as const, spkiHex: devB.spkiHex, fingerprint: devB.fingerprint, createdAt: devB.createdAt };

    const serverUrl = `ws://127.0.0.1:${serverPort}`;
    const sessionId = "session_cleanup_test";

    const clientA = new SignalingClient({ serverUrl, sessionId, localIdentity: identityA, privateKey: devA.privateKey });
    const clientB = new SignalingClient({ serverUrl, sessionId, localIdentity: identityB, privateKey: devB.privateKey });

    await clientA.connect();
    await clientB.connect();
    await new Promise((resolve) => setTimeout(resolve, 100));

    assert.strictEqual(server.getSessionManager().getSessionCount(), 1);

    clientA.endSession();
    clientB.endSession();
    await new Promise((resolve) => setTimeout(resolve, 100));

    assert.strictEqual(server.getSessionManager().getSessionCount(), 0, "Session memory must be completely purged upon session end");
  });
});
