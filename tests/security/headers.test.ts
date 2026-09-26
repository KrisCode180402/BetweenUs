import test from "node:test";
import assert from "node:assert/strict";
import nextConfig from "../../next.config";

test("Security Headers Configuration Test Suite", async (t) => {
  assert.ok(nextConfig.headers, "nextConfig.headers should be defined");
  const headersConfig = await nextConfig.headers();
  assert.ok(Array.isArray(headersConfig), "headersConfig should be an array");

  const globalHeadersObj = headersConfig.find((h) => h.source === "/(.*)");
  assert.ok(globalHeadersObj, "Global route header configuration should exist");

  const headers = globalHeadersObj.headers;
  assert.ok(Array.isArray(headers), "headers list should be an array");

  // Helper function to extract header by key
  const getHeader = (key: string) =>
    headers.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value;

  await t.test("Content-Security-Policy enforces strict default-deny rules", () => {
    const csp = getHeader("Content-Security-Policy");
    assert.ok(csp, "CSP header must be defined");
    assert.ok(csp.includes("default-src 'none'"), "CSP must enforce default-src 'none'");
    assert.ok(csp.includes("frame-ancestors 'none'"), "CSP must enforce frame-ancestors 'none'");
    assert.ok(
      csp.includes("connect-src 'self' wss://signaling.betweenus.app https://turn.betweenus.app"),
      "CSP connect-src must strictly limit connections to self and authorized servers"
    );
    assert.strictEqual(csp.includes("connect-src *"), false, "CSP must not allow wildcard connect-src");
  });

  await t.test("Strict-Transport-Security (HSTS) enforces strong HTTPS preload", () => {
    const hsts = getHeader("Strict-Transport-Security");
    assert.ok(hsts, "HSTS header must be defined");
    assert.ok(hsts.includes("max-age=63072000"), "HSTS max-age must be at least 2 years");
    assert.ok(hsts.includes("includeSubDomains"), "HSTS must include subdomains");
    assert.ok(hsts.includes("preload"), "HSTS must include preload directive");
  });

  await t.test("X-Frame-Options enforces DENY", () => {
    const xfo = getHeader("X-Frame-Options");
    assert.strictEqual(xfo, "DENY", "X-Frame-Options must be DENY");
  });

  await t.test("X-Content-Type-Options enforces nosniff", () => {
    const xcto = getHeader("X-Content-Type-Options");
    assert.strictEqual(xcto, "nosniff", "X-Content-Type-Options must be nosniff");
  });

  await t.test("Referrer-Policy enforces no-referrer", () => {
    const rp = getHeader("Referrer-Policy");
    assert.strictEqual(rp, "no-referrer", "Referrer-Policy must be no-referrer");
  });

  await t.test("Permissions-Policy restricts sensitive device APIs", () => {
    const pp = getHeader("Permissions-Policy");
    assert.ok(pp, "Permissions-Policy header must be defined");
    assert.ok(pp.includes("camera=(self)"), "camera must be restricted to self");
    assert.ok(pp.includes("microphone=(self)"), "microphone must be restricted to self");
    assert.ok(pp.includes("geolocation=()"), "geolocation must be disabled ()");
    assert.ok(pp.includes("display-capture=()"), "display-capture must be disabled ()");
  });

  await t.test("Cross-Origin isolation policies enforce same-origin isolation", () => {
    const coop = getHeader("Cross-Origin-Opener-Policy");
    assert.strictEqual(coop, "same-origin", "COOP must be same-origin");
    const corp = getHeader("Cross-Origin-Resource-Policy");
    assert.strictEqual(corp, "same-origin", "CORP must be same-origin");
  });
});
