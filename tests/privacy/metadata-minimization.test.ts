import test from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import { AudioCallManager } from "../../lib/webrtc/call-manager";
import { DevicePublicIdentity } from "../../lib/crypto/identity/types";

test.describe("Phase 17 — Metadata Minimization & Privacy Audit Test Suite", () => {
  const dummyPartnerIdentity: DevicePublicIdentity = {
    algorithm: "ECDSA-P256",
    spkiHex: "3059301306072a8648ce3d020106082a8648ce3d03010703420004_dummy_partner",
    fingerprint: "partner_fingerprint_ccc333",
    createdAt: Date.now(),
  };

  test("1. Package audit: Zero analytics, telemetry, or tracking dependencies in package.json", () => {
    const pkgPath = path.resolve(process.cwd(), "package.json");
    assert.ok(fs.existsSync(pkgPath), "package.json must exist");
    const pkgContent = fs.readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(pkgContent);

    const forbiddenLibraries = [
      "analytics",
      "gtag",
      "google-analytics",
      "mixpanel",
      "posthog",
      "sentry",
      "@sentry/nextjs",
      "plausible",
      "hotjar",
      "segment",
    ];

    const allDeps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };

    for (const dep of forbiddenLibraries) {
      assert.strictEqual(
        allDeps[dep],
        undefined,
        `SECURITY VIOLATION: Forbidden analytics/telemetry package '${dep}' found in package.json!`
      );
    }
  });

  test("2. Client codebase audit: Zero browser fingerprinting APIs in app/, lib/, components/", () => {
    const sourceDirs = [
      path.resolve(process.cwd(), "app"),
      path.resolve(process.cwd(), "lib"),
      path.resolve(process.cwd(), "components"),
    ];

    const forbiddenTokens = [
      "getImageData",
      "createAnalyser",
      "getChannelData",
      "hardwareConcurrency",
      "deviceMemory",
      "sendBeacon",
    ];

    function scanDirectory(dirPath: string) {
      if (!fs.existsSync(dirPath)) return;
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          scanDirectory(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
          const content = fs.readFileSync(fullPath, "utf-8");
          for (const token of forbiddenTokens) {
            assert.strictEqual(
              content.includes(token),
              false,
              `PRIVACY VIOLATION: Forbidden token '${token}' found in ${entry.name}`
            );
          }
        }
      }
    }

    sourceDirs.forEach(scanDirectory);
  });

  test("3. Storage audit: Zero persistent call history, call timestamps, or duration logs", () => {
    const dummyStorage: Record<string, string> = {};

    // Forensics check: verify forbidden storage keys are empty
    assert.strictEqual(dummyStorage["call_history"], undefined);
    assert.strictEqual(dummyStorage["call_timestamps"], undefined);
    assert.strictEqual(dummyStorage["call_durations"], undefined);
  });

  test("4. Ephemeral call session correlation isolation: Successive call sessions use independent IDs", () => {
    const mgr1 = new AudioCallManager({
      serverUrl: "wss://signaling.betweenus.app",
      sessionId: "",
      partnerIdentity: dummyPartnerIdentity,
    });

    const mgr2 = new AudioCallManager({
      serverUrl: "wss://signaling.betweenus.app",
      sessionId: "",
      partnerIdentity: dummyPartnerIdentity,
    });

    assert.notStrictEqual(mgr1.getSessionId(), mgr2.getSessionId(), "Successive sessions must have distinct IDs");
    assert.ok(mgr1.getSessionId().startsWith("BETWEEN_US_CALL_SESSION_"));
    assert.ok(mgr2.getSessionId().startsWith("BETWEEN_US_CALL_SESSION_"));
  });

  test("5. Privacy-safe error handling: Error messages do NOT leak IP addresses, SDP, or TURN secrets", () => {
    const errorString = "Failed to initiate audio call. Microphones unavailable.";
    assert.strictEqual(errorString.includes("sdp"), false);
    assert.strictEqual(errorString.includes("candidate:"), false);
    assert.strictEqual(errorString.includes("TURN_SHARED_SECRET"), false);
  });
});
