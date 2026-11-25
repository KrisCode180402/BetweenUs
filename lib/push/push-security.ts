import {
  computePublicKeyFingerprint,
  hexToBuffer,
  importPublicKeyFromSpkiHex,
} from "../crypto/identity/key-gen";
import { verifyIdentitySignature } from "../crypto/identity/signing";

export interface PushRequestProof {
  timestamp: number;
  spkiHex: string;
  signatureHex: string;
}

const MAX_AUTH_DRIFT_MS = 5 * 60 * 1000;

/**
 * Canonical payload bytes for signing/verifying Web Push API requests.
 */
export function buildPushAuthPayload(
  action: string,
  deviceId: string,
  timestamp: number
): Uint8Array {
  return new TextEncoder().encode(`PUSH_AUTH_V1:${action}:${deviceId}:${timestamp}`);
}

/**
 * Validates that a Web Push subscription endpoint is a safe external HTTPS URL
 * and blocks SSRF against localhost, loopback, private RFC1918, or link-local hosts.
 */
export function isValidWebPushEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== "string" || endpoint.length < 12 || endpoint.length > 2048) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(endpoint);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") return false;
  if (parsed.username || parsed.password) return false;

  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "0.0.0.0" ||
    host === "[::1]" ||
    host === "[::]"
  ) {
    return false;
  }

  // Block IPv6 private / loopback / link-local literals
  if (host.startsWith("[")) {
    const bare = host.slice(1, -1);
    if (
      bare === "::1" ||
      bare.startsWith("fc") ||
      bare.startsWith("fd") ||
      bare.startsWith("fe80")
    ) {
      return false;
    }
  }

  // Block IPv4 loopback, private, link-local, CGNAT, and multicast ranges
  const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4Match) {
    const a = Number(ipv4Match[1]);
    const b = Number(ipv4Match[2]);
    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Validates Web Push subscription keys object (`p256dh` and `auth`).
 */
export function isValidPushKeys(
  keys: unknown
): keys is { p256dh: string; auth: string } {
  if (!keys || typeof keys !== "object") return false;
  const k = keys as Record<string, unknown>;
  return (
    typeof k.p256dh === "string" &&
    k.p256dh.length >= 16 &&
    k.p256dh.length <= 256 &&
    typeof k.auth === "string" &&
    k.auth.length >= 8 &&
    k.auth.length <= 128
  );
}

/**
 * Verifies an optional ECDSA P-256 signature proof attached to a push request.
 * When `proof` is provided, enforces timestamp freshness, signature validity,
 * and (for subscribe/unsubscribe) exact match between `spkiHex` fingerprint and `deviceId`.
 */
export async function verifyPushRequestProof(
  action: string,
  targetId: string,
  proof: unknown,
  requireFingerprintMatch: boolean
): Promise<{ valid: boolean; reason?: string }> {
  if (!proof || typeof proof !== "object") {
    return { valid: true };
  }

  const p = proof as Partial<PushRequestProof>;
  if (
    typeof p.timestamp !== "number" ||
    typeof p.spkiHex !== "string" ||
    typeof p.signatureHex !== "string" ||
    p.spkiHex.length < 64 ||
    p.spkiHex.length > 512 ||
    p.signatureHex.length < 64 ||
    p.signatureHex.length > 512
  ) {
    return { valid: false, reason: "Malformed cryptographic proof" };
  }

  if (Math.abs(Date.now() - p.timestamp) > MAX_AUTH_DRIFT_MS) {
    return { valid: false, reason: "Expired push request timestamp" };
  }

  try {
    if (requireFingerprintMatch) {
      const derivedFp = await computePublicKeyFingerprint(hexToBuffer(p.spkiHex));
      if (derivedFp.toLowerCase() !== targetId.toLowerCase()) {
        return { valid: false, reason: "Public key fingerprint does not match deviceId" };
      }
    }

    const publicKey = await importPublicKeyFromSpkiHex(p.spkiHex);
    const payloadBytes = buildPushAuthPayload(action, targetId, p.timestamp);
    const sigValid = await verifyIdentitySignature(
      publicKey,
      hexToBuffer(p.signatureHex),
      payloadBytes
    );

    return sigValid
      ? { valid: true }
      : { valid: false, reason: "Invalid ECDSA push signature" };
  } catch {
    return { valid: false, reason: "Cryptographic verification failed" };
  }
}

/**
 * Lightweight sliding-window rate limiter for Push API routes.
 */
export class PushApiRateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}

  public allow(clientKey: string): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const prev = this.hits.get(clientKey) || [];
    const recent = prev.filter((t) => t > cutoff);

    if (recent.length >= this.maxRequests) {
      this.hits.set(clientKey, recent);
      return false;
    }

    recent.push(now);
    this.hits.set(clientKey, recent);

    if (this.hits.size > 1000) {
      const oldestKey = this.hits.keys().next().value;
      if (oldestKey) this.hits.delete(oldestKey);
    }

    return true;
  }
}

export const pushSubscribeLimiter = new PushApiRateLimiter(15, 5 * 60 * 1000);
export const pushSendLimiter = new PushApiRateLimiter(20, 5 * 60 * 1000);

export function extractClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") || "local-client";
}
