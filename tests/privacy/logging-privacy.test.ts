import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

import { AppLogger, FORBIDDEN_LOG_KEYS, sanitizeMeta, sanitizeError } from "../../lib/privacy/logger";
import { SignalingLogger } from "../../server/signaling/logger";

test("Phase 18 — Logging Privacy Test Suite", async (t) => {
  await t.test("FORBIDDEN_LOG_KEYS set contains all mandatory sensitive key identifiers", () => {
    const expectedKeys = [
      "sdp",
      "candidate",
      "credential",
      "username",
      "password",
      "secret",
      "privatekey",
      "token",
      "authorization",
      "cookie",
      "pairingcode",
    ];

    for (const key of expectedKeys) {
      assert.ok(FORBIDDEN_LOG_KEYS.has(key), `FORBIDDEN_LOG_KEYS must contain '${key}'`);
    }
  });

  await t.test("sanitizeMeta recursively redacts sensitive fields and raw secret strings", () => {
    const dirtyMeta = {
      sessionId: "session-123",
      sdp: "v=0\r\no=- 123456 2 IN IP4 127.0.0.1",
      iceCandidate: "candidate:842163049 1 udp 2122260223 192.168.1.50 54321 typ host",
      credential: {
        username: "testuser",
        password: "supersecretpassword",
        secret: "myhmacsecret",
      },
      tokens: ["auth_token_abc123", "bearer_xyz789"],
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----",
      nestedObject: {
        safeField: "safeValue",
        pairingCode: "849201",
      },
    };

    const sanitized = sanitizeMeta(dirtyMeta);

    assert.strictEqual(sanitized.sessionId, "session-123");
    assert.strictEqual(sanitized.sdp, "[REDACTED_SDP_OR_CANDIDATE]");
    assert.strictEqual(sanitized.iceCandidate, "[REDACTED_SDP_OR_CANDIDATE]");
    assert.strictEqual(sanitized.privateKey, "[REDACTED_PRIVATE_KEY]");
    assert.strictEqual(sanitized.credential, "[REDACTED_FOR_PRIVACY]");
    assert.strictEqual(sanitized.tokens, "[REDACTED_FOR_PRIVACY]");

    const nested = sanitized.nestedObject as Record<string, unknown>;
    assert.strictEqual(nested.safeField, "safeValue");
    assert.strictEqual(nested.pairingCode, "[REDACTED_FOR_PRIVACY]");
  });

  await t.test("sanitizeMeta detects raw SDP and Private Key strings even in safe key names", () => {
    const payload = {
      rawMessage: "Here is the raw offer: v=0\r\no=- 98765 2 IN IP4 10.0.0.1\r\ns=-",
      keyDump: "-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEI...\n-----END EC PRIVATE KEY-----",
    };

    const sanitized = sanitizeMeta(payload);

    assert.strictEqual(sanitized.rawMessage, "[REDACTED_SDP_OR_CANDIDATE]");
    assert.strictEqual(sanitized.keyDump, "[REDACTED_PRIVATE_KEY]");
  });

  await t.test("sanitizeError redacts sensitive properties from Error instances", () => {
    const rawError = new Error("Connection failed due to invalid authentication token");
    (rawError as unknown as Record<string, unknown>).token = "secret_auth_token_999";
    (rawError as unknown as Record<string, unknown>).password = "raw_password_val";

    const sanitizedErr = sanitizeError(rawError);

    assert.strictEqual(sanitizedErr.name, "Error");
    assert.strictEqual(sanitizedErr.message, "Connection failed due to invalid authentication token");
    assert.strictEqual(sanitizedErr.token, "[REDACTED_FOR_PRIVACY]");
    assert.strictEqual(sanitizedErr.password, "[REDACTED_FOR_PRIVACY]");
  });

  await t.test("AppLogger dispatches sanitized meta without throwing", () => {
    assert.doesNotThrow(() => {
      AppLogger.info("Testing safe info dispatch", {
        sessionId: "sess-99",
        sdp: "v=0\r\no=- 12345 2 IN IP4 127.0.0.1",
      });
      AppLogger.warn("Testing safe warn dispatch", {
        candidate: "candidate:1 1 UDP 1 127.0.0.1 80 typ host",
      });
      AppLogger.error("Testing safe error dispatch", {
        error: new Error("Test error"),
        secret: "mysecret",
      });
      AppLogger.debug("Testing safe debug dispatch", {
        token: "tok-123",
      });
    });
  });

  await t.test("SignalingLogger dispatches sanitized messages without throwing", () => {
    assert.doesNotThrow(() => {
      SignalingLogger.info("Signaling session created", {
        sessionId: "ws-sess-1",
        pairingCode: "123456",
      });
      SignalingLogger.warn("Signaling session timeout warning", {
        credential: "secret_cred",
      });
      SignalingLogger.error("Signaling error occurred", {
        error: new Error("Socket broken"),
        authorization: "Bearer secret_token",
      });
    });
  });

  await t.test("Static Analysis: Source code leak scan across lib/, app/, and server/", () => {
    const scanDirs = [
      path.join(process.cwd(), "lib"),
      path.join(process.cwd(), "app"),
      path.join(process.cwd(), "server"),
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
    for (const dir of scanDirs) {
      allFiles = allFiles.concat(scanFiles(dir));
    }

    const forbiddenPatterns = [
      /console\.log\([^)]*privateKey/i,
      /console\.log\([^)]*sdp/i,
      /console\.log\([^)]*pairingCode/i,
      /console\.log\([^)]*credential/i,
      /console\.log\([^)]*secret/i,
    ];

    for (const filePath of allFiles) {
      // Exclude the logger definitions themselves which wrap console calls
      if (filePath.endsWith("privacy\\logger.ts") || filePath.endsWith("privacy/logger.ts") ||
          filePath.endsWith("signaling\\logger.ts") || filePath.endsWith("signaling/logger.ts")) {
        continue;
      }

      const code = fs.readFileSync(filePath, "utf8");
      for (const pattern of forbiddenPatterns) {
        assert.strictEqual(
          pattern.test(code),
          false,
          `Forbidden un-sanitized console pattern ${pattern} found in ${filePath}`
        );
      }
    }
  });
});
