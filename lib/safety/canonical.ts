import { bufferToHex } from "../crypto/identity/key-gen";

export const SAFETY_PROTOCOL_VERSION = "BETWEEN_US_SAFETY_FINGERPRINT_V1";

function getSubtleCrypto(): SubtleCrypto {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  throw new Error("Web Crypto API (crypto.subtle) is unavailable.");
}

/**
 * Builds canonical Uint8Array payload byte array for safety fingerprint calculation.
 * Format: `BETWEEN_US_SAFETY_FINGERPRINT_V1:ECDSA-P256:<spkiHex>`
 */
export function buildSafetyCanonicalPayload(spkiHex: string): Uint8Array {
  if (!spkiHex || typeof spkiHex !== "string") {
    throw new Error("Invalid SPKI hex string provided for safety canonicalization.");
  }
  const canonicalStr = `${SAFETY_PROTOCOL_VERSION}:ECDSA-P256:${spkiHex.toLowerCase()}`;
  return new TextEncoder().encode(canonicalStr);
}

/**
 * Computes deterministic SHA-256 digest of partner public identity using Web Crypto API.
 */
export async function computeSafetyDigest(spkiHex: string): Promise<{ digestBuffer: ArrayBuffer; digestHex: string }> {
  const subtle = getSubtleCrypto();
  const payload = buildSafetyCanonicalPayload(spkiHex);
  const digestBuffer = await subtle.digest("SHA-256", payload.buffer as ArrayBuffer);
  const digestHex = bufferToHex(digestBuffer);
  return { digestBuffer, digestHex };
}
