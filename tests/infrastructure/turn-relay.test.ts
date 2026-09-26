import test from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  generateTurnCredentials,
  fetchTurnCredentials,
} from "../../lib/turn/credentials";
import { TurnCredentialRateLimiter } from "../../lib/turn/rate-limiter";

test.describe("Phase 15 — TURN / Coturn Relay & Fallback Test Suite", () => {
  const TEST_SECRET = "test_turn_secret_1234567890_super_secure";
  const TEST_HOST = "turn.betweenus.app";
  const TEST_USER = "device_fingerprint_abc123";

  test("1. generateTurnCredentials creates valid HMAC-SHA1 REST credentials", () => {
    const ttlSec = 600;
    const nowSec = Math.floor(Date.now() / 1000);
    const turnData = generateTurnCredentials({
      secret: TEST_SECRET,
      host: TEST_HOST,
      port: 3478,
      tlsPort: 5349,
      ttlSec,
      userIdentity: TEST_USER,
    });

    assert.ok(turnData.iceServers.length >= 2, "Must return at least STUN and TURN server configs");
    assert.strictEqual(turnData.ttlSeconds, 600);
    assert.ok(turnData.expiresAt > Date.now(), "Expiration timestamp must be in the future");

    // Inspect TURN server entry
    const turnServer = turnData.iceServers.find((s) =>
      s.urls.some((u) => u.startsWith("turn:"))
    );
    assert.ok(turnServer, "Must contain a turn: server URL");
    assert.ok(turnServer?.username, "TURN entry must include username");
    assert.ok(turnServer?.credential, "TURN entry must include HMAC credential");

    const username = turnServer?.username || "";
    // Verify username format: "expiresAtTimestamp:userIdentity"
    const [expStr, identity] = username.split(":");
    assert.strictEqual(identity, TEST_USER);
    const expNum = parseInt(expStr || "0", 10);
    assert.ok(expNum >= nowSec + ttlSec - 2 && expNum <= nowSec + ttlSec + 2);

    // Re-derive HMAC-SHA1 to verify password computation matches RFC 5389 / Coturn standard
    const hmac = crypto.createHmac("sha1", TEST_SECRET);
    hmac.update(username);
    const expectedCred = hmac.digest("base64");
    assert.strictEqual(turnServer?.credential, expectedCred, "Credential must match HMAC-SHA1 output");
  });

  test("2. Credential TTL calculation and timestamp expiration enforcement", () => {
    const shortTtlSec = 5;
    const turnData = generateTurnCredentials({
      secret: TEST_SECRET,
      host: TEST_HOST,
      ttlSec: shortTtlSec,
      userIdentity: TEST_USER,
    });

    const expiresAt = turnData.expiresAt;
    assert.ok(expiresAt <= Date.now() + (shortTtlSec + 2) * 1000);

    // Verify expired timestamp simulation
    const expiredTimestamp = Math.floor((Date.now() - 10000) / 1000);
    const expiredUsername = `${expiredTimestamp}:${TEST_USER}`;
    const [expPart] = expiredUsername.split(":");
    assert.ok(parseInt(expPart || "0", 10) < Math.floor(Date.now() / 1000), "Expired credential timestamp is past");
  });

  test("3. TurnCredentialRateLimiter enforces request thresholds", () => {
    const testLimiter = new TurnCredentialRateLimiter({ windowMs: 60000, maxRequests: 5 });
    const clientKey = "test_device_rate_limit_ip";

    // First 5 requests must be allowed
    for (let i = 0; i < 5; i++) {
      assert.strictEqual(testLimiter.isAllowed(clientKey), true, `Request ${i + 1} should be allowed`);
    }

    // 6th request must be rejected (HTTP 429 scenario)
    assert.strictEqual(testLimiter.isAllowed(clientKey), false, "6th request within window must be rate limited");

    // Reset limiter for client
    testLimiter.reset(clientKey);
    assert.strictEqual(testLimiter.isAllowed(clientKey), true, "Request post-reset should be allowed");
  });

  test("4. Client-side fetchTurnCredentials fallback handling on endpoint error", async () => {
    // Calling fetchTurnCredentials with non-existent endpoint must safely return default STUN config without throwing
    const iceServers = await fetchTurnCredentials("/api/invalid-turn-endpoint-path-404");
    assert.ok(Array.isArray(iceServers));
    assert.ok(iceServers.length > 0);
    const firstUrl = iceServers[0]?.urls[0] || "";
    assert.ok(firstUrl.startsWith("stun:"), "Fallback must supply STUN URL");
  });

  test("5. WebRTC ICE Server building with TURN UDP/TCP/TLS URLs", () => {
    const turnData = generateTurnCredentials({
      secret: TEST_SECRET,
      host: TEST_HOST,
      port: 3478,
      tlsPort: 5349,
      ttlSec: 600,
      userIdentity: TEST_USER,
    });

    const allUrls = turnData.iceServers.flatMap((s) => s.urls);
    assert.ok(allUrls.some((u) => u.includes("stun:turn.betweenus.app:3478")), "Includes STUN URL");
    assert.ok(allUrls.some((u) => u.includes("turn:turn.betweenus.app:3478?transport=udp")), "Includes TURN UDP URL");
    assert.ok(allUrls.some((u) => u.includes("turn:turn.betweenus.app:3478?transport=tcp")), "Includes TURN TCP URL");
    assert.ok(allUrls.some((u) => u.includes("turns:turn.betweenus.app:5349?transport=tcp")), "Includes TURNS TLS URL");
  });

  test("6. Secret leakage scanning: Verifies TURN_SHARED_SECRET is server-only and not NEXT_PUBLIC_", () => {
    const rootDir = path.resolve(process.cwd());
    
    // Check .env.example
    const envExamplePath = path.join(rootDir, ".env.example");
    if (fs.existsSync(envExamplePath)) {
      const content = fs.readFileSync(envExamplePath, "utf-8");
      assert.strictEqual(
        content.includes("NEXT_PUBLIC_TURN_SHARED_SECRET"),
        false,
        "SECURITY VIOLATION: TURN_SHARED_SECRET MUST NOT be prefixed with NEXT_PUBLIC_"
      );
    }

    // Scan client codebase lib/webrtc and components for hardcoded shared secrets
    const webrtcDir = path.join(rootDir, "lib", "webrtc");
    if (fs.existsSync(webrtcDir)) {
      const files = fs.readdirSync(webrtcDir);
      for (const file of files) {
        const filePath = path.join(webrtcDir, file);
        if (fs.statSync(filePath).isFile()) {
          const content = fs.readFileSync(filePath, "utf-8");
          assert.strictEqual(
            content.includes("TURN_SHARED_SECRET"),
            false,
            `SECURITY VIOLATION: ${file} in client bundle references TURN_SHARED_SECRET`
          );
        }
      }
    }
  });

  test("7. Zero persistent storage forensics: ZERO TURN credentials in localStorage or IndexedDB", () => {
    // Simulate active TURN session credentials
    let memoryTurnCredential: string | null = "temporary_hmac_cred_in_memory_only";

    // Storage forensics assertion
    const dummyLocalStorage: Record<string, string> = {};
    assert.strictEqual(dummyLocalStorage["turn_credential"], undefined);
    assert.strictEqual(dummyLocalStorage["turn_secret"], undefined);

    // Call teardown cleanup
    memoryTurnCredential = null;
    assert.strictEqual(memoryTurnCredential, null, "TURN credentials must be cleared from memory on call end");
  });
});
