import test from "node:test";
import assert from "node:assert/strict";

import { PairingStateMachine, PairingStateError } from "../../lib/pairing/state-machine";
import { PairingState } from "../../lib/pairing/types";
import { LocalInMemoryPairingTransport } from "../../lib/pairing/transport";
import {
  createPairingInvitation,
  cancelPairing,
  removePairedPartnerDevice,
  getPairedPartner,
  getPairingSessionState,
  PairingSessionManager,
} from "../../lib/pairing/service";
import { initializeDeviceIdentity, destroyDeviceIdentity, getPublicIdentity } from "../../lib/crypto/identity";
import { generateDeviceKeyPair } from "../../lib/crypto/identity/key-gen";

test("Phase 10 — Secure Device Pairing Test Suite", async (t) => {

  await t.test("Pairing state machine enforces valid state transitions and rejects illegal jumps", () => {
    const sm = new PairingStateMachine();
    assert.strictEqual(sm.getState(), PairingState.IDLE);

    sm.transitionTo(PairingState.CREATING_INVITATION);
    assert.strictEqual(sm.getState(), PairingState.CREATING_INVITATION);

    sm.transitionTo(PairingState.WAITING_FOR_PEER);
    assert.strictEqual(sm.getState(), PairingState.WAITING_FOR_PEER);

    // Illegal state jump (WAITING_FOR_PEER directly to PAIRED) must throw
    assert.throws(
      () => {
        sm.transitionTo(PairingState.PAIRED);
      },
      PairingStateError,
      "Illegal state jump directly to PAIRED must throw"
    );
  });

  await t.test("Two-device pairing walkthrough completes successfully", async () => {
    await destroyDeviceIdentity();
    await removePairedPartnerDevice();

    const initiatorIdentity = await initializeDeviceIdentity();
    assert.ok(initiatorIdentity);

    // Create isolated pairing session managers for Device A and Device B
    const managerA = new PairingSessionManager();
    const managerB = new PairingSessionManager();

    // Create in-memory pairing transport pair
    const transportA = new LocalInMemoryPairingTransport();
    const transportB = new LocalInMemoryPairingTransport();
    transportA.connectPeer(transportB);

    // Device A: Create pairing invitation
    const { invitation, displayCode } = await managerA.createPairingInvitation(transportA);
    assert.strictEqual(typeof displayCode, "string");
    assert.strictEqual(displayCode.length, 6);
    assert.strictEqual(invitation.initiatorPublicIdentity.fingerprint, initiatorIdentity.fingerprint);

    assert.strictEqual(managerA.getSessionState().state, PairingState.WAITING_FOR_PEER);

    // Device B: Generate distinct device identity B
    const deviceBRecord = await generateDeviceKeyPair();
    const identityB = {
      algorithm: "ECDSA-P256" as const,
      spkiHex: deviceBRecord.spkiHex,
      fingerprint: deviceBRecord.fingerprint,
      createdAt: deviceBRecord.createdAt,
    };

    // Device B: Join pairing session using identity B
    await managerB.joinPairingSession(transportB, invitation, { identity: identityB, privateKey: deviceBRecord.privateKey });

    // Allow asynchronous dispatch ticks for transport & signature verification
    await new Promise((resolve) => setTimeout(resolve, 150));

    const updatedSessionA = managerA.getSessionState();
    assert.strictEqual(
      updatedSessionA.state,
      PairingState.AWAITING_USER_CONFIRMATION,
      "Initiator should reach AWAITING_USER_CONFIRMATION"
    );
    assert.ok(updatedSessionA.peerPublicIdentity);

    const updatedSessionB = managerB.getSessionState();
    assert.strictEqual(
      updatedSessionB.state,
      PairingState.AWAITING_USER_CONFIRMATION,
      "Responder should reach AWAITING_USER_CONFIRMATION"
    );

    // Dual User Confirmation
    const confirmedA = await managerA.confirmPairing();
    assert.strictEqual(confirmedA, false); // Initiator confirms first, pending responder confirmation

    // Allow transport tick for Responder B to receive Initiator A's PAIRING_COMPLETE
    await new Promise((resolve) => setTimeout(resolve, 50));

    const confirmedB = await managerB.confirmPairing();
    assert.strictEqual(confirmedB, true); // Responder confirms, completing atomic finalization

    // Allow transport tick for Initiator to receive Responder's PAIRING_COMPLETE
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.strictEqual(managerA.getSessionState().state, PairingState.PAIRED);
    assert.strictEqual(managerB.getSessionState().state, PairingState.PAIRED);

    // Verify partner public identity was saved in storage
    const partnerRecord = await getPairedPartner();
    assert.ok(partnerRecord);
    assert.strictEqual(partnerRecord.partnerPublicIdentity.algorithm, "ECDSA-P256");

    // Clean up test transport
    transportA.close();
    transportB.close();
  });

  await t.test("Attacker substitution with invalid signature fails closed", async () => {
    await destroyDeviceIdentity();
    await removePairedPartnerDevice();

    const transportA = new LocalInMemoryPairingTransport();
    const transportB = new LocalInMemoryPairingTransport();
    transportA.connectPeer(transportB);

    const { invitation } = await createPairingInvitation(transportA);

    // Simulate forged response message from attacker with tampered signature
    const forgedMessage = {
      type: "PAIRING_RESPONSE",
      version: "BETWEEN_US_PAIRING_V1",
      sessionId: invitation.sessionId,
      responderPublicIdentity: invitation.initiatorPublicIdentity, // Forged identity
      challengeB: "00".repeat(32),
      signatureB: "ff".repeat(64), // Invalid signature
      expiresAt: Date.now() + 300000,
    };

    // Inject forged message into Transport A
    await transportB.send(forgedMessage as any);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const sessionA = getPairingSessionState();
    assert.notStrictEqual(sessionA.state, PairingState.PAIRED);

    const partnerRecord = await getPairedPartner();
    assert.strictEqual(partnerRecord, null, "No partner trust record should be saved for invalid signature");

    transportA.close();
    transportB.close();
  });

  await t.test("User cancellation cleans up session state and prevents pairing", async () => {
    await destroyDeviceIdentity();
    await removePairedPartnerDevice();

    const transportA = new LocalInMemoryPairingTransport();
    await createPairingInvitation(transportA);

    assert.strictEqual(getPairingSessionState().state, PairingState.WAITING_FOR_PEER);

    await cancelPairing("User pressed cancel");

    assert.strictEqual(getPairingSessionState().state, PairingState.CANCELLED);
    assert.strictEqual(getPairingSessionState().challengeA, null);

    const partnerRecord = await getPairedPartner();
    assert.strictEqual(partnerRecord, null);

    transportA.close();
  });

  await t.test("removePairedPartnerDevice purges partner record without affecting device identity", async () => {
    await initializeDeviceIdentity();
    const myIdBefore = getPublicIdentity();

    const removed = await removePairedPartnerDevice();
    assert.strictEqual(removed, true);

    const partnerRecord = await getPairedPartner();
    assert.strictEqual(partnerRecord, null);

    // Device's own identity remains intact
    const myIdAfter = getPublicIdentity();
    assert.ok(myIdAfter);
    if (myIdBefore) {
      assert.strictEqual(myIdAfter.fingerprint, myIdBefore.fingerprint);
    }
  });
});
