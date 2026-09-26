import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

import { generateDeviceKeyPair } from "../../../lib/crypto/identity/key-gen";
import { signIdentityData, verifyIdentitySignature, DOMAIN_SEPARATION_PREFIX } from "../../../lib/crypto/identity/signing";
import { calculateSafetyRepresentation } from "../../../lib/safety/service";
import { SAFETY_PROTOCOL_VERSION as SAFETY_PREFIX } from "../../../lib/safety/canonical";

test("Phase 20 — Cryptographic Implementation & Security Review Test Suite", async (t) => {

  await t.test("1. Randomness API: Security randomness uses Web Crypto CSPRNG (getRandomValues)", () => {
    const bytes = new Uint8Array(32);
    assert.strictEqual(bytes.every((b) => b === 0), true);

    crypto.getRandomValues(bytes);

    // Verify bytes are populated with non-zero entropy
    assert.strictEqual(bytes.some((b) => b !== 0), true);
    assert.strictEqual(bytes.byteLength, 32);
  });

  await t.test("2. Key Generation Properties: ECDSA P-256 with extractable: false", async () => {
    const keyPairRecord = await generateDeviceKeyPair();

    assert.strictEqual(keyPairRecord.publicKey.type, "public");
    assert.strictEqual(keyPairRecord.privateKey.type, "private");
    assert.strictEqual(keyPairRecord.publicKey.algorithm.name, "ECDSA");
    assert.strictEqual((keyPairRecord.publicKey.algorithm as EcKeyAlgorithm).namedCurve, "P-256");

    // STRICT SECURITY INVARIANT: Private key extractable flag MUST be false!
    assert.strictEqual(keyPairRecord.privateKey.extractable, false, "Private key extractable flag MUST be false");

    // Attempting exportKey on non-extractable private key must fail
    await assert.rejects(
      async () => {
        await crypto.subtle.exportKey("pkcs8", keyPairRecord.privateKey);
      },
      "exportKey on non-extractable private key must throw an error"
    );
  });

  await t.test("3. Signature Domain Separation & Verification", async () => {
    const record = await generateDeviceKeyPair();
    const message = new TextEncoder().encode("test_crypto_review_payload_123");

    const signature = await signIdentityData(record.privateKey, message);
    assert.strictEqual(signature.byteLength > 0, true);

    const isValid = await verifyIdentitySignature(record.publicKey, signature, message);
    assert.strictEqual(isValid, true, "Signature verification must succeed for untampered payload");

    assert.strictEqual(DOMAIN_SEPARATION_PREFIX, "BETWEEN_US_IDENTITY_V1:");
  });

  await t.test("4. Signature Tampering & Key Mismatch Rejection", async () => {
    const recordA = await generateDeviceKeyPair();
    const recordB = await generateDeviceKeyPair();
    const message = new TextEncoder().encode("original_message_data");

    const signatureA = await signIdentityData(recordA.privateKey, message);

    // Verifying with wrong public key MUST return false
    const isValidWithWrongKey = await verifyIdentitySignature(recordB.publicKey, signatureA, message);
    assert.strictEqual(isValidWithWrongKey, false, "Verification with wrong public key MUST return false");

    // Verifying with tampered message MUST return false
    const tamperedMessage = new TextEncoder().encode("tampered_message_data");
    const isValidWithTamperedMsg = await verifyIdentitySignature(recordA.publicKey, signatureA, tamperedMessage);
    assert.strictEqual(isValidWithTamperedMsg, false, "Verification with tampered message MUST return false");
  });

  await t.test("5. Safety Verification Fingerprint Determinism & Domain Separation", async () => {
    const recordA = await generateDeviceKeyPair();
    const recordB = await generateDeviceKeyPair();

    const publicIdA = { algorithm: "ECDSA-P256" as const, spkiHex: recordA.spkiHex, fingerprint: recordA.fingerprint, createdAt: Date.now() };
    const publicIdB = { algorithm: "ECDSA-P256" as const, spkiHex: recordB.spkiHex, fingerprint: recordB.fingerprint, createdAt: Date.now() };

    const safetyA1 = await calculateSafetyRepresentation(publicIdA);
    const safetyA2 = await calculateSafetyRepresentation(publicIdA);
    const safetyB = await calculateSafetyRepresentation(publicIdB);

    // Derivation is 100% deterministic
    assert.strictEqual(safetyA1.fullFingerprintHex, safetyA2.fullFingerprintHex);
    assert.strictEqual(safetyA1.shortCode, safetyA2.shortCode);
    assert.deepStrictEqual(safetyA1.words, safetyA2.words);

    // Distinct public keys produce distinct safety representations
    assert.notStrictEqual(safetyA1.fullFingerprintHex, safetyB.fullFingerprintHex);

    assert.strictEqual(SAFETY_PREFIX, "BETWEEN_US_SAFETY_FINGERPRINT_V1");
  });

  await t.test("6. Production Bundle & Client Code Audit: Zero embedded secret leaks", () => {
    const clientDirs = [
      path.join(process.cwd(), "lib"),
      path.join(process.cwd(), "app"),
      path.join(process.cwd(), "components"),
    ];

    const scanFiles = (dir: string): string[] => {
      let results: string[] = [];
      if (!fs.existsSync(dir)) return results;
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

    let allFiles: string[] = [];
    for (const dir of clientDirs) {
      allFiles = allFiles.concat(scanFiles(dir));
    }

    const forbiddenStrings = [
      "NEXT_PUBLIC_TURN_SHARED_SECRET",
      "BEGIN PRIVATE KEY",
    ];

    for (const filePath of allFiles) {
      // Exclude logger and server credential definition files
      if (filePath.endsWith("privacy\\logger.ts") || filePath.endsWith("privacy/logger.ts") ||
          filePath.endsWith("signaling\\logger.ts") || filePath.endsWith("signaling/logger.ts") ||
          filePath.endsWith("turn\\credentials.ts") || filePath.endsWith("turn/credentials.ts")) {
        continue;
      }

      const code = fs.readFileSync(filePath, "utf8");
      for (const secretToken of forbiddenStrings) {
        assert.strictEqual(
          code.includes(secretToken),
          false,
          `Forbidden secret token '${secretToken}' found in client file ${filePath}`
        );
      }
    }
  });
});
