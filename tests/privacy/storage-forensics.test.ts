import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

import { CallStateMachine } from "../../lib/webrtc/call-state-machine";
import { CallState } from "../../lib/webrtc/types";
import { validateStoragePayload } from "../../lib/storage/validation";

test("Phase 19 — Storage Forensics Audit Test Suite", async (t) => {

  await t.test("1. Storage Payload Validation: Rejects sensitive call objects and synthetic markers", () => {
    const syntheticSdp = "FORENSIC_SDP_MARKER_v=0\r\no=- 123456";
    const syntheticIce = "FORENSIC_ICE_MARKER_candidate:1 1 UDP 1 127.0.0.1 80";
    const syntheticTurn = "FORENSIC_TURN_MARKER_secret123";

    // Validate payload validator rejects forbidden storage keys by throwing StorageValidationError
    const forbiddenPayload = {
      theme: "dark",
      sdp: syntheticSdp,
      ice: syntheticIce,
      credential: syntheticTurn,
    };

    assert.throws(
      () => {
        validateStoragePayload("between_us_app_state", forbiddenPayload);
      },
      /StorageValidationError/,
      "validateStoragePayload MUST throw StorageValidationError when payload contains forbidden keys"
    );
  });

  await t.test("2. Codebase Audit: Zero prohibited media recording or filesystem access APIs", () => {
    const scanDirs = [
      path.join(process.cwd(), "lib"),
      path.join(process.cwd(), "app"),
      path.join(process.cwd(), "components"),
    ];

    const prohibitedAPIs = [
      "MediaRecorder",
      "showOpenFilePicker",
      "showSaveFilePicker",
      "getDirectory",
      "AudioWorklet",
      "VideoFrame",
      "captureStream",
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

    for (const filePath of allFiles) {
      const code = fs.readFileSync(filePath, "utf8");
      for (const api of prohibitedAPIs) {
        assert.strictEqual(
          code.includes(api),
          false,
          `Prohibited API '${api}' found in source file ${filePath}`
        );
      }
    }
  });

  await t.test("3. Filesystem Forensic Scan: Zero temporary call or media files in runtime/server directories", () => {
    const mediaExtensions = [
      ".wav",
      ".mp3",
      ".m4a",
      ".webm",
      ".mp4",
      ".mkv",
      ".mov",
      ".ogg",
      ".opus",
      ".dump",
    ];

    const scanDirs = [
      process.cwd(),
      path.join(process.cwd(), "server"),
      path.join(process.cwd(), "public"),
    ];

    for (const dir of scanDirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        assert.strictEqual(
          mediaExtensions.includes(ext),
          false,
          `Forbidden temporary media file '${file}' found in directory ${dir}`
        );
      }
    }
  });

  await t.test("4. Call Lifecycle Teardown: CallStateMachine returns safely to IDLE upon cleanup", () => {
    const csm = new CallStateMachine();
    assert.strictEqual(csm.getState(), CallState.IDLE);

    csm.transitionTo(CallState.OUTGOING_INITIATING);
    assert.strictEqual(csm.getState(), CallState.OUTGOING_INITIATING);

    csm.transitionTo(CallState.OUTGOING_RINGING);
    assert.strictEqual(csm.getState(), CallState.OUTGOING_RINGING);

    csm.transitionTo(CallState.CONNECTED);
    assert.strictEqual(csm.getState(), CallState.CONNECTED);

    csm.transitionTo(CallState.ENDING);
    assert.strictEqual(csm.getState(), CallState.ENDING);

    csm.transitionTo(CallState.ENDED);
    assert.strictEqual(csm.getState(), CallState.ENDED);

    csm.reset();
    assert.strictEqual(csm.getState(), CallState.IDLE);
  });

  await t.test("5. Idempotent Teardown Verification: Repeated reset calls execute safely", () => {
    const csm = new CallStateMachine();
    csm.transitionTo(CallState.OUTGOING_INITIATING);
    
    assert.doesNotThrow(() => {
      csm.reset();
      csm.reset();
      csm.reset();
    }, "Repeated reset calls must be safe and idempotent");

    assert.strictEqual(csm.getState(), CallState.IDLE);
  });

  await t.test("6. Service Worker Caching Audit: Excludes WebSocket & API routes", () => {
    const swPath = path.join(process.cwd(), "public", "sw.js");
    assert.strictEqual(fs.existsSync(swPath), true, "Service Worker file public/sw.js must exist");

    const swCode = fs.readFileSync(swPath, "utf8");
    assert.strictEqual(swCode.includes("ws://"), false, "Service Worker must not cache WebSocket ws://");
    assert.strictEqual(swCode.includes("wss://"), false, "Service Worker must not cache WebSocket wss://");
    assert.strictEqual(swCode.includes("/api/turn/credentials"), false, "Service Worker must not cache TURN credentials endpoint");
  });
});
