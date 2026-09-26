import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

import { privacyModeManager } from "../../lib/privacy/privacy-mode";
import { CleanupStatus } from "../../lib/webrtc/cleanup";
import { CallStateMachine } from "../../lib/webrtc/call-state-machine";
import { CallState } from "../../lib/webrtc/types";

test("Phase 22 — Privacy Mode & Emergency Controls Test Suite", async (t) => {
  t.afterEach(() => {
    privacyModeManager.reset();
  });

  await t.test("1. Privacy Mode state transitions: NORMAL -> PRIVACY_MODE_ACTIVE -> NORMAL", () => {
    assert.equal(privacyModeManager.getState(), "NORMAL");
    assert.equal(privacyModeManager.isActive(), false);

    privacyModeManager.enablePrivacyMode();
    assert.equal(privacyModeManager.getState(), "PRIVACY_MODE_ACTIVE");
    assert.equal(privacyModeManager.isActive(), true);

    privacyModeManager.disablePrivacyMode();
    assert.equal(privacyModeManager.getState(), "NORMAL");
    assert.equal(privacyModeManager.isActive(), false);
  });

  await t.test("2. Emergency Exit triggers Phase 21 cleanup and transitions to SAFE_HOME", () => {
    let trackStopped = false;
    let trackEnabled = true;
    let pcClosed = false;
    const sessionRef = { currentSessionId: "session-privacy-123" };
    const stateMachine = new CallStateMachine();
    stateMachine.transitionTo(CallState.CALLING);

    const mockLocalStream: any = {
      getTracks: () => [
        {
          get enabled() { return trackEnabled; },
          set enabled(val: boolean) { trackEnabled = val; },
          stop: () => { trackStopped = true; },
        },
      ],
    };

    const mockPc: any = {
      connectionState: "connected",
      close: () => { pcClosed = true; },
    };

    const status = privacyModeManager.activateEmergencyExit({
      pc: mockPc,
      localStream: mockLocalStream,
      sessionRef,
      stateMachine,
    });

    assert.equal(status, CleanupStatus.CLEAN);
    assert.equal(privacyModeManager.getState(), "SAFE_HOME");
    assert.equal(trackEnabled, false);
    assert.equal(trackStopped, true);
    assert.equal(pcClosed, true);
    assert.equal(sessionRef.currentSessionId, null);
    assert.equal(stateMachine.getState(), CallState.IDLE);
  });

  await t.test("3. Emergency Exit is idempotent under repeated calls", () => {
    const sessionRef = { currentSessionId: "session-repeat" };

    const status1 = privacyModeManager.activateEmergencyExit({ sessionRef });
    const status2 = privacyModeManager.activateEmergencyExit({ sessionRef });
    const status3 = privacyModeManager.activateEmergencyExit({ sessionRef });

    assert.equal(status1, CleanupStatus.CLEAN);
    assert.equal(status2, CleanupStatus.CLEAN);
    assert.equal(status3, CleanupStatus.CLEAN);
    assert.equal(privacyModeManager.getState(), "SAFE_HOME");
  });

  await t.test("4. Storage Forensics: Zero persistent privacy mode or emergency exit logs", () => {
    if (typeof localStorage !== "undefined") {
      assert.equal(localStorage.getItem("privacy_mode_log"), null);
      assert.equal(localStorage.getItem("emergency_exit_event"), null);
      assert.equal(localStorage.getItem("call_history"), null);
    }
  });

  await t.test("5. Codebase Audit: Zero prohibited security claims in UI or application codebase", () => {
    const componentsDir = path.join(process.cwd(), "components");
    
    function scanDirectory(dirPath: string): string[] {
      let files: string[] = [];
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        if (item.isDirectory()) {
          files = files.concat(scanDirectory(fullPath));
        } else if (item.name.endsWith(".tsx") || item.name.endsWith(".ts")) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const codeFiles = scanDirectory(componentsDir);
    const forbiddenPhrases = [
      "Nobody can screenshot this",
      "Nobody can record this",
      "100% un-recordable",
      "100% secure",
      "unhackable",
      "Military-grade protection against every attacker",
    ];

    for (const filePath of codeFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      for (const phrase of forbiddenPhrases) {
        assert.equal(
          content.includes(phrase),
          false,
          `Forbidden phrase "${phrase}" found in ${filePath}`
        );
      }
    }
  });
});
