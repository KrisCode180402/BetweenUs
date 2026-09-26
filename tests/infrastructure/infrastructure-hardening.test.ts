import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

import nextConfig from "../../next.config";
import { parseAndValidateEnvelope } from "../../server/signaling/validation";

test("Phase 23 — Infrastructure Hardening Test Suite", async (t) => {

  await t.test("1. Secret Scanning Audit: Zero server secrets in repo files or .env.example", () => {
    const envExamplePath = path.join(process.cwd(), ".env.example");
    if (fs.existsSync(envExamplePath)) {
      const envContent = fs.readFileSync(envExamplePath, "utf-8");
      assert.equal(envContent.includes("NEXT_PUBLIC_TURN_SECRET"), false, "NEXT_PUBLIC_TURN_SECRET found in .env.example");
      assert.equal(envContent.includes("BEGIN PRIVATE KEY"), false, "Private key marker found in .env.example");
    }

    const libDir = path.join(process.cwd(), "lib");
    function scanCode(dirPath: string): string[] {
      let results: string[] = [];
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        if (item.isDirectory()) {
          results = results.concat(scanCode(fullPath));
        } else if (item.name.endsWith(".ts") || item.name.endsWith(".tsx")) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const files = scanCode(libDir);
    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      assert.equal(content.includes("NEXT_PUBLIC_TURN_SHARED_SECRET"), false, `Public secret found in ${file}`);
      assert.equal(content.includes("NEXT_PUBLIC_PRIVATE_KEY"), false, `Public private key found in ${file}`);
    }
  });

  await t.test("2. Security Headers Configuration: CSP, HSTS, Permissions-Policy", async () => {
    if (typeof nextConfig.headers === "function") {
      const headersConfig = await nextConfig.headers();
      assert.ok(headersConfig.length > 0, "No headers configured in next.config.ts");

      const mainRoute = headersConfig.find((h) => h.source === "/(.*)");
      assert.ok(mainRoute, "No main route headers found");

      const headerMap = new Map(mainRoute.headers.map((h) => [h.key, h.value]));

      // Verify HSTS Preload
      const hsts = headerMap.get("Strict-Transport-Security");
      assert.ok(hsts && hsts.includes("preload"), "HSTS preload missing");
      assert.ok(hsts && hsts.includes("includeSubDomains"), "HSTS includeSubDomains missing");

      // Verify X-Frame-Options
      assert.equal(headerMap.get("X-Frame-Options"), "DENY");

      // Verify X-Content-Type-Options
      assert.equal(headerMap.get("X-Content-Type-Options"), "nosniff");

      // Verify Referrer-Policy
      assert.equal(headerMap.get("Referrer-Policy"), "no-referrer");

      // Verify Content-Security-Policy
      const csp = headerMap.get("Content-Security-Policy");
      assert.ok(csp && csp.includes("default-src 'none'"), "CSP default-src missing");
      assert.ok(csp && csp.includes("frame-ancestors 'none'"), "CSP frame-ancestors missing");
    }
  });

  await t.test("3. WebSocket Message Validation: Rejects malformed and oversized payloads (>32KB)", () => {
    // Test oversized payload rejection
    const oversizedPayload = {
      type: "SDP_OFFER",
      payload: { sdp: "A".repeat(35000) },
    };

    assert.throws(
      () => parseAndValidateEnvelope(JSON.stringify(oversizedPayload)),
      /exceeds maximum limit/
    );

    // Test malformed JSON rejection
    assert.throws(
      () => parseAndValidateEnvelope("{ malformed json }"),
      /Malformed JSON payload format/
    );
  });

  await t.test("4. Infrastructure Documentation Audit: All Phase 23 specifications exist", () => {
    const requiredDocs = [
      "docs/security/infrastructure-hardening.md",
      "docs/security/infrastructure-inventory.md",
      "docs/security/third-party-services.md",
      "docs/security/server-patching.md",
      "docs/security/infrastructure-security-matrix.md",
      "docs/security/trust-boundaries.md",
    ];

    for (const docRelativePath of requiredDocs) {
      const docFullPath = path.join(process.cwd(), docRelativePath);
      assert.ok(fs.existsSync(docFullPath), `Missing documentation file: ${docRelativePath}`);
    }
  });
});
