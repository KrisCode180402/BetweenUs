import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

import { generateDeviceKeyPair } from "../../lib/crypto/identity/key-gen";
import { signIdentityData, verifyIdentitySignature, DOMAIN_SEPARATION_PREFIX } from "../../lib/crypto/identity/signing";
import {
  initializeDeviceIdentity,
  getPublicIdentity,
  getIdentityFingerprint,
  getLifecycleState,
  destroyDeviceIdentity,
} from "../../lib/crypto/identity/service";
import { IdentityLifecycleState } from "../../lib/crypto/identity/types";

test("Phase 09 — Device Cryptographic Identity Test Suite", async (t) => {

  await t.test("Key generation creates non-extractable ECDSA P-256 key pair", async () => {
    const record = await generateDeviceKeyPair();

    assert.strictEqual(record.publicKey.type, "public");
    assert.strictEqual(record.privateKey.type, "private");
    assert.strictEqual(record.publicKey.algorithm.name, "ECDSA");
    assert.strictEqual((record.publicKey.algorithm as EcKeyAlgorithm).namedCurve, "P-256");

    // STRICT SECURITY INVARIANT: Private key must be non-extractable!
    assert.strictEqual(record.privateKey.extractable, false, "Private key extractable flag MUST be false");

    assert.strictEqual(typeof record.spkiHex, "string");
    assert.strictEqual(record.spkiHex.length > 0, true);
    assert.strictEqual(typeof record.fingerprint, "string");
    assert.strictEqual(record.fingerprint.length, 64, "SHA-256 fingerprint must be 64 hex characters");

    // Attempting exportKey on non-extractable private key must fail
    await assert.rejects(
      async () => {
        await crypto.subtle.exportKey("pkcs8", record.privateKey);
      },
      "exportKey on non-extractable private key must throw an error"
    );
  });

  await t.test("Domain-separated digital signatures generate and verify correctly", async () => {
    const record = await generateDeviceKeyPair();
    const message = new TextEncoder().encode("test_sign_payload_123");

    const signature = await signIdentityData(record.privateKey, message);
    assert.strictEqual(signature.byteLength > 0, true);

    const isValid = await verifyIdentitySignature(record.publicKey, signature, message);
    assert.strictEqual(isValid, true, "Signature verification must succeed for valid message");

    // Verification must fail if message is tampered with
    const tamperedMessage = new TextEncoder().encode("test_sign_payload_456");
    const isTamperedValid = await verifyIdentitySignature(record.publicKey, signature, tamperedMessage);
    assert.strictEqual(isTamperedValid, false, "Signature verification must fail for tampered message");
  });

  await t.test("Domain separation prefix is enforced", () => {
    assert.strictEqual(DOMAIN_SEPARATION_PREFIX, "BETWEEN_US_IDENTITY_V1:");
  });

  await t.test("Identity Service lifecycle initializes and exposes public identity safely", async () => {
    await destroyDeviceIdentity();

    const publicId = await initializeDeviceIdentity();
    assert.strictEqual(publicId.algorithm, "ECDSA-P256");
    assert.strictEqual(typeof publicId.spkiHex, "string");
    assert.strictEqual(publicId.fingerprint.length, 64);
    assert.strictEqual(getLifecycleState(), IdentityLifecycleState.AVAILABLE);

    // Verify public identity getters never return private key
    const retrievedId = getPublicIdentity();
    assert.ok(retrievedId);
    assert.strictEqual(retrievedId.fingerprint, publicId.fingerprint);
    assert.strictEqual((retrievedId as unknown as Record<string, unknown>).privateKey, undefined);

    const fingerprint = getIdentityFingerprint();
    assert.strictEqual(fingerprint, publicId.fingerprint);
  });

  await t.test("Identity destruction purges active identity and forces new identity creation", async () => {
    const initialPublicId = await initializeDeviceIdentity();
    const initialFingerprint = initialPublicId.fingerprint;

    await destroyDeviceIdentity();
    assert.strictEqual(getLifecycleState(), IdentityLifecycleState.DESTROYED);
    assert.strictEqual(getPublicIdentity(), null);

    const newPublicId = await initializeDeviceIdentity();
    assert.notStrictEqual(newPublicId.fingerprint, initialFingerprint, "Post-destruction identity must produce a new distinct key pair");
  });

  await t.test("Source code leak scan: Ensures zero private key exports or console leaks", () => {
    const libDir = path.join(process.cwd(), "lib", "crypto");

    const scanFiles = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
          results = results.concat(scanFiles(filePath));
        } else if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
          results.push(filePath);
        }
      });
      return results;
    };

    const files = scanFiles(libDir);
    for (const filePath of files) {
      const code = fs.readFileSync(filePath, "utf8");
      // Check for dangerous exportKey usage on private keys
      assert.strictEqual(code.includes('exportKey("pkcs8"'), false, `Forbidden exportKey pkcs8 in ${filePath}`);
      assert.strictEqual(code.includes('exportKey("jwk"'), false, `Forbidden exportKey jwk in ${filePath}`);

      // Check for console logging of private key or secret objects
      assert.strictEqual(code.includes("console.log(privateKey"), false, `Forbidden console.log of private key in ${filePath}`);
    }
  });
});
