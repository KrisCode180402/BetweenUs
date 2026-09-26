import test from "node:test";
import assert from "node:assert/strict";

import { VerificationStateMachine, VerificationStateError } from "../../lib/safety/state-machine";
import { VerificationState } from "../../lib/safety/types";
import {
  buildSafetyCanonicalPayload,
  SAFETY_PROTOCOL_VERSION,
} from "../../lib/safety/canonical";
import {
  SafetyVerificationManager,
  calculateSafetyRepresentation,
  initializeSafetySession,
  confirmVerificationMatch,
  removePartnerVerification,
  getSafetyVerificationState,
} from "../../lib/safety/service";
import { loadVerificationRecord } from "../../lib/safety/store";
import { generateDeviceKeyPair } from "../../lib/crypto/identity/key-gen";
import { removePairedPartnerDevice } from "../../lib/pairing/service";

test("Phase 11 — Safety Verification Test Suite", async (t) => {

  await t.test("Verification state machine enforces valid transitions and rejects illegal jumps", () => {
    const sm = new VerificationStateMachine();
    assert.strictEqual(sm.getState(), VerificationState.UNPAIRED);

    sm.transitionTo(VerificationState.PAIRED_UNVERIFIED);
    assert.strictEqual(sm.getState(), VerificationState.PAIRED_UNVERIFIED);

    sm.transitionTo(VerificationState.VERIFICATION_PENDING);
    assert.strictEqual(sm.getState(), VerificationState.VERIFICATION_PENDING);

    sm.transitionTo(VerificationState.VERIFIED);
    assert.strictEqual(sm.getState(), VerificationState.VERIFIED);

    // Illegal state jump (VERIFIED directly to PAIRED_UNVERIFIED without reset)
    assert.throws(
      () => {
        sm.transitionTo(VerificationState.PAIRED_UNVERIFIED);
      },
      VerificationStateError,
      "Illegal state jump directly from VERIFIED to PAIRED_UNVERIFIED must throw"
    );
  });

  await t.test("Canonical safety payload enforces protocol version domain separation", () => {
    const mockSpkiHex = "3059301306072a8648ce3d020106082a8648ce3d03010703420004" + "00".repeat(32);
    const payloadBytes = buildSafetyCanonicalPayload(mockSpkiHex);
    const payloadStr = new TextDecoder().decode(payloadBytes);

    assert.ok(payloadStr.startsWith(SAFETY_PROTOCOL_VERSION));
    assert.ok(payloadStr.includes("ECDSA-P256"));
    assert.ok(payloadStr.includes(mockSpkiHex.toLowerCase()));
  });

  await t.test("Safety representation derivation is 100% deterministic", async () => {
    const keyRecord = await generateDeviceKeyPair();
    const identity = {
      algorithm: "ECDSA-P256" as const,
      spkiHex: keyRecord.spkiHex,
      fingerprint: keyRecord.fingerprint,
      createdAt: keyRecord.createdAt,
    };

    const rep1 = await calculateSafetyRepresentation(identity);
    const rep2 = await calculateSafetyRepresentation(identity);

    assert.strictEqual(rep1.shortCode, rep2.shortCode);
    assert.deepEqual(rep1.words, rep2.words);
    assert.deepEqual(rep1.emojis, rep2.emojis);
    assert.strictEqual(rep1.fullFingerprintHex, rep2.fullFingerprintHex);

    // Verify word and emoji counts
    assert.strictEqual(rep1.words.length, 6);
    assert.strictEqual(rep1.emojis.length, 5);
    assert.strictEqual(rep1.shortCode.split("-").length, 4);
    assert.strictEqual(rep1.fullFingerprintHex.length, 64);
  });

  await t.test("Distinct public identities produce distinct safety representations", async () => {
    const devA = await generateDeviceKeyPair();
    const devB = await generateDeviceKeyPair();

    const identityA = { algorithm: "ECDSA-P256" as const, spkiHex: devA.spkiHex, fingerprint: devA.fingerprint, createdAt: devA.createdAt };
    const identityB = { algorithm: "ECDSA-P256" as const, spkiHex: devB.spkiHex, fingerprint: devB.fingerprint, createdAt: devB.createdAt };

    const repA = await calculateSafetyRepresentation(identityA);
    const repB = await calculateSafetyRepresentation(identityB);

    assert.notStrictEqual(repA.shortCode, repB.shortCode);
    assert.notStrictEqual(repA.fullFingerprintHex, repB.fullFingerprintHex);
  });

  await t.test("Full safety session lifecycle: initialize, confirm match, pinning, and reset", async () => {
    await removePartnerVerification();
    await removePairedPartnerDevice();

    const partnerKeyPair = await generateDeviceKeyPair();
    const partnerIdentity = {
      algorithm: "ECDSA-P256" as const,
      spkiHex: partnerKeyPair.spkiHex,
      fingerprint: partnerKeyPair.fingerprint,
      createdAt: partnerKeyPair.createdAt,
    };

    const manager = new SafetyVerificationManager();
    let state = await manager.initializeSafetySession(partnerIdentity);
    assert.strictEqual(state.state, VerificationState.PAIRED_UNVERIFIED);
    assert.ok(state.representation);

    // Confirm match
    state = await manager.confirmVerificationMatch();
    assert.strictEqual(state.state, VerificationState.VERIFIED);
    assert.strictEqual(state.isPinnedMatch, true);

    // Reload session to verify persistence
    const reloadedManager = new SafetyVerificationManager();
    state = await reloadedManager.initializeSafetySession(partnerIdentity);
    assert.strictEqual(state.state, VerificationState.VERIFIED);
    assert.strictEqual(state.isPinnedMatch, true);

    // Reset verification
    state = await reloadedManager.resetVerification();
    assert.strictEqual(state.state, VerificationState.PAIRED_UNVERIFIED);
    assert.strictEqual(state.isPinnedMatch, false);
  });

  await t.test("Identity change detection triggers IDENTITY_CHANGED security state", async () => {
    await removePartnerVerification();

    const originalPartner = await generateDeviceKeyPair();
    const originalIdentity = {
      algorithm: "ECDSA-P256" as const,
      spkiHex: originalPartner.spkiHex,
      fingerprint: originalPartner.fingerprint,
      createdAt: originalPartner.createdAt,
    };

    const manager = new SafetyVerificationManager();
    await manager.initializeSafetySession(originalIdentity);
    await manager.confirmVerificationMatch();
    assert.strictEqual(manager.getSessionState().state, VerificationState.VERIFIED);

    // Attacker or replaced device identity
    const substitutedPartner = await generateDeviceKeyPair();
    const substitutedIdentity = {
      algorithm: "ECDSA-P256" as const,
      spkiHex: substitutedPartner.spkiHex,
      fingerprint: substitutedPartner.fingerprint,
      createdAt: substitutedPartner.createdAt,
    };

    // Re-initialize session with substituted identity key
    const state = await manager.initializeSafetySession(substitutedIdentity);
    assert.strictEqual(state.state, VerificationState.IDENTITY_CHANGED);
    assert.strictEqual(state.isPinnedMatch, false);
    assert.ok(state.errorReason);
    assert.ok(state.errorReason.includes("different from the identity you previously verified"));
  });

  await t.test("User rejection triggers VERIFICATION_FAILED state", async () => {
    await removePartnerVerification();

    const partnerKeyPair = await generateDeviceKeyPair();
    const partnerIdentity = {
      algorithm: "ECDSA-P256" as const,
      spkiHex: partnerKeyPair.spkiHex,
      fingerprint: partnerKeyPair.fingerprint,
      createdAt: partnerKeyPair.createdAt,
    };

    const manager = new SafetyVerificationManager();
    await manager.initializeSafetySession(partnerIdentity);
    const state = await manager.rejectVerificationMismatch();

    assert.strictEqual(state.state, VerificationState.VERIFICATION_FAILED);
    assert.ok(state.errorReason);
    assert.ok(state.errorReason.includes("Identity verification failed"));
  });

  await t.test("removePartnerVerification purges storage record completely", async () => {
    await removePartnerVerification();

    const partnerKeyPair = await generateDeviceKeyPair();
    const partnerIdentity = {
      algorithm: "ECDSA-P256" as const,
      spkiHex: partnerKeyPair.spkiHex,
      fingerprint: partnerKeyPair.fingerprint,
      createdAt: partnerKeyPair.createdAt,
    };

    await initializeSafetySession(partnerIdentity);
    await confirmVerificationMatch();
    assert.strictEqual(getSafetyVerificationState().state, VerificationState.VERIFIED);

    await removePartnerVerification();
    const stored = await loadVerificationRecord();
    assert.strictEqual(stored, null);
  });
});
