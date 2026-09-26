import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

test("Phase 07 — PWA & Service Worker Test Suite", async (t) => {
  const rootDir = process.cwd();
  const manifestPath = path.join(rootDir, "public", "manifest.json");
  const swPath = path.join(rootDir, "public", "sw.js");
  const layoutPath = path.join(rootDir, "app", "layout.tsx");
  const icon192Path = path.join(rootDir, "public", "icons", "icon-192x192.png");
  const icon512Path = path.join(rootDir, "public", "icons", "icon-512x512.png");
  const maskablePath = path.join(rootDir, "public", "icons", "maskable-icon-512x512.png");

  await t.test("Web App Manifest exists and contains valid metadata", () => {
    assert.strictEqual(fs.existsSync(manifestPath), true, "manifest.json must exist");
    const content = fs.readFileSync(manifestPath, "utf8");
    const manifest = JSON.parse(content);

    assert.strictEqual(manifest.name, "Between Us");
    assert.strictEqual(manifest.short_name, "Between Us");
    assert.strictEqual(manifest.description, "Two People. One Private Connection.");
    assert.strictEqual(manifest.start_url, "/");
    assert.strictEqual(manifest.display, "standalone");
    assert.strictEqual(manifest.background_color, "#090d16");
    assert.strictEqual(manifest.theme_color, "#090d16");
    assert.strictEqual(Array.isArray(manifest.icons), true);
    assert.strictEqual(manifest.icons.length >= 3, true);
  });

  await t.test("Manifest start_url contains no query parameters or secrets", () => {
    const content = fs.readFileSync(manifestPath, "utf8");
    const manifest = JSON.parse(content);
    assert.strictEqual(manifest.start_url.includes("?"), false, "start_url must not contain query parameters");
    assert.strictEqual(manifest.start_url.includes("#"), false, "start_url must not contain fragments");
    assert.strictEqual(manifest.start_url.includes("token"), false, "start_url must not contain tokens");
    assert.strictEqual(manifest.start_url.includes("secret"), false, "start_url must not contain secrets");
  });

  await t.test("Required PWA icon assets exist on filesystem", () => {
    assert.strictEqual(fs.existsSync(icon192Path), true, "icon-192x192.png must exist");
    assert.strictEqual(fs.existsSync(icon512Path), true, "icon-512x512.png must exist");
    assert.strictEqual(fs.existsSync(maskablePath), true, "maskable-icon-512x512.png must exist");
  });

  await t.test("Service Worker file exists and implements secure caching strategy", () => {
    assert.strictEqual(fs.existsSync(swPath), true, "sw.js must exist");
    const swCode = fs.readFileSync(swPath, "utf8");

    // Verify cache versioning
    assert.strictEqual(swCode.includes("between-us-static-v1"), true, "sw.js must define cache version 'between-us-static-v1'");

    // Verify network-only protection for WebSocket / TURN / API
    assert.strictEqual(swCode.includes("wss:"), true, "sw.js must explicitly handle wss: signaling protocol");
    assert.strictEqual(swCode.includes("turn"), true, "sw.js must explicitly exclude turn domains from cache");
    assert.strictEqual(swCode.includes("/api/"), true, "sw.js must explicitly exclude api routes from cache");

    // Verify cleanup of obsolete caches
    assert.strictEqual(swCode.includes("caches.delete"), true, "sw.js must perform cache cleanup on activate");

    // Verify NO forbidden caching keywords or sensitive persistence
    assert.strictEqual(swCode.includes("IndexedDB"), false, "sw.js must not interact with IndexedDB");
    assert.strictEqual(swCode.includes("localStorage"), false, "sw.js must not interact with localStorage");
    assert.strictEqual(swCode.includes("sessionStorage"), false, "sw.js must not interact with sessionStorage");
    assert.strictEqual(swCode.includes("privateKey"), false, "sw.js must not handle private keys");
    assert.strictEqual(swCode.includes("pairingSecret"), false, "sw.js must not handle pairing secrets");
    assert.strictEqual(swCode.includes("pushManager"), false, "sw.js must not implement push notifications");
    assert.strictEqual(swCode.includes("analytics"), false, "sw.js must not contain analytics");
  });

  await t.test("Root layout embeds PWA metadata and Service Worker registration", () => {
    assert.strictEqual(fs.existsSync(layoutPath), true, "layout.tsx must exist");
    const layoutCode = fs.readFileSync(layoutPath, "utf8");

    assert.strictEqual(layoutCode.includes("/manifest.json"), true, "layout.tsx must reference /manifest.json");
    assert.strictEqual(layoutCode.includes("SWRegister"), true, "layout.tsx must include SWRegister component");
  });
});
