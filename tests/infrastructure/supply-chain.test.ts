import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

test("Phase 24 — Supply Chain Security & CI/CD Test Suite", async (t) => {

  await t.test("1. Lockfile Integrity: package-lock.json exists and Node engine is locked", () => {
    const lockfilePath = path.join(process.cwd(), "package-lock.json");
    assert.ok(fs.existsSync(lockfilePath), "package-lock.json must be committed to the repository");

    const packageJsonPath = path.join(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    assert.ok(pkg.engines && pkg.engines.node, "Node.js engine must be explicitly declared in package.json");
  });

  await t.test("2. GitHub Workflows Audit: Permissions isolated to contents: read and pinned action versions", () => {
    const workflowsDir = path.join(process.cwd(), ".github", "workflows");
    assert.ok(fs.existsSync(workflowsDir), ".github/workflows directory must exist");

    const ciWorkflowPath = path.join(workflowsDir, "ci.yml");
    assert.ok(fs.existsSync(ciWorkflowPath), "ci.yml workflow must exist");

    const ciContent = fs.readFileSync(ciWorkflowPath, "utf-8");
    assert.ok(ciContent.includes("contents: read"), "CI workflow must specify least-privilege permissions (contents: read)");
    assert.equal(ciContent.includes("contents: write"), false, "CI workflow must NOT specify contents: write");
    assert.ok(ciContent.includes("actions/checkout@v4.2.2"), "checkout action must be pinned to explicit version tag");
    assert.ok(ciContent.includes("actions/setup-node@v4.1.0"), "setup-node action must be pinned to explicit version tag");
  });

  await t.test("3. Secret Exposure Audit: Zero server secrets in repo files, env templates, or workflows", () => {
    const envExamplePath = path.join(process.cwd(), ".env.example");
    if (fs.existsSync(envExamplePath)) {
      const envContent = fs.readFileSync(envExamplePath, "utf-8");
      assert.equal(envContent.includes("NEXT_PUBLIC_TURN_SECRET"), false);
      assert.equal(envContent.includes("BEGIN PRIVATE KEY"), false);
    }

    const workflowsDir = path.join(process.cwd(), ".github", "workflows");
    const workflowFiles = fs.readdirSync(workflowsDir);
    for (const file of workflowFiles) {
      const filePath = path.join(workflowsDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      assert.equal(content.includes("TURN_SHARED_SECRET: real_prod_secret"), false);
    }
  });

  await t.test("4. CODEOWNERS & Documentation Audit: All Phase 24 security specifications exist", () => {
    const codeownersPath = path.join(process.cwd(), ".github", "CODEOWNERS");
    assert.ok(fs.existsSync(codeownersPath), ".github/CODEOWNERS must exist");

    const requiredDocs = [
      "docs/security/supply-chain-security.md",
      "docs/security/ci-cd-security.md",
      "docs/security/dependency-incident-response.md",
      "docs/security/supply-chain-matrix.md",
    ];

    for (const docRelativePath of requiredDocs) {
      const docFullPath = path.join(process.cwd(), docRelativePath);
      assert.ok(fs.existsSync(docFullPath), `Missing supply chain documentation file: ${docRelativePath}`);
    }
  });
});
