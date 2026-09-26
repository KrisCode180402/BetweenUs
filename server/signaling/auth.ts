import { SessionJoinPayload } from "./types";
import { SIGNALING_CONFIG } from "./config";
import { hexToBuffer } from "../../lib/crypto/identity/key-gen";
import { verifyIdentitySignature } from "../../lib/crypto/identity/signing";

const SIGNALING_AUTH_PREFIX = "BETWEEN_US_SIGNALING_V1:AUTH:";
const usedNonces = new Map<string, number>(); // Nonce -> Timestamp

function getSubtleCrypto(): SubtleCrypto {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  throw new Error("Web Crypto API unavailable.");
}

/**
 * Periodically purges expired nonces from memory tracker.
 */
function cleanupExpiredNonces(): void {
  const now = Date.now();
  for (const [nonce, timestamp] of usedNonces.entries()) {
    if (now - timestamp > SIGNALING_CONFIG.AUTH_TIMESTAMP_MAX_SKEW_MS * 2) {
      usedNonces.delete(nonce);
    }
  }
}

/**
 * Builds canonical byte payload for signaling authentication signature.
 * Format: `BETWEEN_US_SIGNALING_V1:AUTH:<sessionId>:<nonce>:<timestamp>:<fingerprint>`
 */
export function buildSignalingAuthPayload(
  sessionId: string,
  nonce: string,
  timestamp: number,
  fingerprint: string
): Uint8Array {
  const str = `${SIGNALING_AUTH_PREFIX}${sessionId}:${nonce}:${timestamp}:${fingerprint}`;
  return new TextEncoder().encode(str);
}

/**
 * Verifies client SESSION_JOIN signature using Web Crypto ECDSA SHA-256.
 */
export async function verifySignalingAuthentication(
  sessionId: string,
  senderFingerprint: string,
  joinPayload: SessionJoinPayload
): Promise<boolean> {
  const { publicIdentity, nonce, timestamp, signature } = joinPayload;

  // 1. Verify fingerprint match
  if (publicIdentity.fingerprint !== senderFingerprint) {
    return false;
  }

  // 2. Verify timestamp freshness
  const now = Date.now();
  if (Math.abs(now - timestamp) > SIGNALING_CONFIG.AUTH_TIMESTAMP_MAX_SKEW_MS) {
    return false;
  }

  // 3. Replay Protection: Verify nonce has not been used
  cleanupExpiredNonces();
  if (usedNonces.has(nonce)) {
    return false; // Replay attack detected
  }

  // 4. Verify ECDSA signature using client's public key
  try {
    const subtle = getSubtleCrypto();
    const spkiBuffer = hexToBuffer(publicIdentity.spkiHex);
    const publicKey = await subtle.importKey(
      "spki",
      spkiBuffer,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );

    const canonicalPayload = buildSignalingAuthPayload(sessionId, nonce, timestamp, senderFingerprint);
    const signatureBuffer = hexToBuffer(signature);

    const isValid = await verifyIdentitySignature(publicKey, signatureBuffer, canonicalPayload);

    if (isValid) {
      usedNonces.set(nonce, timestamp);
    }

    return isValid;
  } catch {
    return false;
  }
}
