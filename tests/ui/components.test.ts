import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("UI Components & Permission Safety Test Suite", async (t) => {
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

  const componentsDir = path.join(process.cwd(), "components");
  const appDir = path.join(process.cwd(), "app");
  const uiFiles = [...scanFiles(componentsDir), ...scanFiles(appDir)];

  await t.test("UI codebase contains ZERO navigator.mediaDevices or getUserMedia calls", () => {
    assert.ok(uiFiles.length > 0, "UI source files must exist for scanning");

    uiFiles.forEach((filePath) => {
      const content = fs.readFileSync(filePath, "utf-8");
      assert.strictEqual(
        content.includes("getUserMedia"),
        false,
        `File ${filePath} must NOT call getUserMedia()`
      );
      assert.strictEqual(
        content.includes("navigator.mediaDevices"),
        false,
        `File ${filePath} must NOT access navigator.mediaDevices`
      );
    });
  });

  await t.test("UI codebase contains ZERO prohibited marketing buzzwords", () => {
    const prohibitedWords = [
      "military grade",
      "100% secure",
      "unhackable",
      "impossible to hack",
      "100% anonymous",
    ];

    uiFiles.forEach((filePath) => {
      const content = fs.readFileSync(filePath, "utf-8").toLowerCase();
      prohibitedWords.forEach((word) => {
        assert.strictEqual(
          content.includes(word),
          false,
          `File ${filePath} must NOT contain prohibited term: "${word}"`
        );
      });
    });
  });

  await t.test("UI codebase contains ZERO analytics or tracking script imports", () => {
    const prohibitedImports = [
      "analytics",
      "mixpanel",
      "gtag",
      "google-analytics",
      "sentry",
      "posthog",
    ];

    uiFiles.forEach((filePath) => {
      const content = fs.readFileSync(filePath, "utf-8").toLowerCase();
      prohibitedImports.forEach((imp) => {
        assert.strictEqual(
          content.includes(`from "${imp}"`) || content.includes(`from '${imp}'`),
          false,
          `File ${filePath} must NOT import analytics package: "${imp}"`
        );
      });
    });
  });
});
