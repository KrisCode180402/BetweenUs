import test from "node:test";
import assert from "node:assert/strict";

import { StorageClassification } from "../../lib/storage/types";
import { validateStoragePayload, StorageValidationError } from "../../lib/storage/validation";
import { getItem, setItem, removeItem, clearApplicationState } from "../../lib/storage/repository";

test("Phase 08 — Local Storage & Data Boundary Test Suite", async (t) => {

  await t.test("Valid low-sensitivity application state payload is accepted", () => {
    assert.doesNotThrow(() => {
      validateStoragePayload("ui_theme", { theme: "dark", fontSize: 14 }, StorageClassification.PERSISTENT_LOW_SENSITIVITY);
    });
  });

  await t.test("Oversized payload exceeding 2KB limit is strictly rejected", () => {
    const largeObject = { data: "x".repeat(3000) };
    assert.throws(
      () => {
        validateStoragePayload("large_pref", largeObject, StorageClassification.PERSISTENT_LOW_SENSITIVITY);
      },
      StorageValidationError,
      "Payload exceeding 2048 bytes must be rejected"
    );
  });

  await t.test("Forbidden storage keys are strictly rejected", () => {
    const forbiddenKeys = [
      "active_call",
      "call_history",
      "sdp_offer",
      "ice_candidates",
      "pairing_secret",
      "private_key",
      "auth_token",
      "media_stream",
      "analytics_event",
    ];

    for (const key of forbiddenKeys) {
      assert.throws(
        () => {
          validateStoragePayload(key, "test-val", StorageClassification.PERSISTENT_LOW_SENSITIVITY);
        },
        StorageValidationError,
        `Key '${key}' must be rejected`
      );
    }
  });

  await t.test("Forbidden classification types are strictly rejected for persistence", () => {
    const prohibitedClassifications = [
      StorageClassification.EPHEMERAL_MEMORY,
      StorageClassification.CALL_SESSION_DATA,
      StorageClassification.MEDIA_DATA,
      StorageClassification.CRYPTOGRAPHIC_MATERIAL,
    ];

    for (const classification of prohibitedClassifications) {
      assert.throws(
        () => {
          validateStoragePayload("sample_key", "value", classification);
        },
        StorageValidationError,
        `Classification '${classification}' must be rejected for persistence`
      );
    }
  });

  await t.test("Forbidden runtime object properties (SDP, keys, stream pointers) are rejected", () => {
    const forbiddenObjects = [
      { sdp: "v=0\r\no=- 12345 2 IN IP4 127.0.0.1" },
      { iceCandidate: "candidate:1 1 UDP 2013266431" },
      { privateKey: "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg" },
      { turnPassword: "secret-turn-pass" },
    ];

    for (const forbiddenObj of forbiddenObjects) {
      assert.throws(
        () => {
          validateStoragePayload("app_pref", forbiddenObj, StorageClassification.PERSISTENT_LOW_SENSITIVITY);
        },
        StorageValidationError,
        "Forbidden object structures must be rejected"
      );
    }
  });

  await t.test("Repository setItem and getItem operate safely for approved keys", async () => {
    await clearApplicationState();

    const success = await setItem("app_mode", { mode: "standalone" });
    assert.strictEqual(success, true);

    const value = await getItem<{ mode: string }>("app_mode");
    assert.deepStrictEqual(value, { mode: "standalone" });
  });

  await t.test("Repository removeItem deletes specific key", async () => {
    await setItem("temp_key", "to_delete");
    let stored = await getItem<string>("temp_key");
    assert.strictEqual(stored, "to_delete");

    await removeItem("temp_key");
    stored = await getItem<string>("temp_key");
    assert.strictEqual(stored, null);
  });

  await t.test("clearApplicationState purges all application-local state", async () => {
    await setItem("pref_a", 1);
    await setItem("pref_b", 2);

    await clearApplicationState();

    const valA = await getItem("pref_a");
    const valB = await getItem("pref_b");
    assert.strictEqual(valA, null);
    assert.strictEqual(valB, null);
  });
});
