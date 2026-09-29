import { bufferToHex, hexToBuffer } from "../crypto/identity/key-gen";

export const SAFETY_PROTOCOL_VERSION = "BETWEEN_US_SAFETY_FINGERPRINT_V2_HKDF";

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
 * Format: `BETWEEN_US_SAFETY_FINGERPRINT_V2_HKDF:ECDSA-P256:<spkiHex>`
 */
export function buildSafetyCanonicalPayload(spkiHex: string): Uint8Array {
  if (!spkiHex || typeof spkiHex !== "string") {
    throw new Error("Invalid SPKI hex string provided for safety canonicalization.");
  }
  const canonicalStr = `${SAFETY_PROTOCOL_VERSION}:ECDSA-P256:${spkiHex.toLowerCase()}`;
  return new TextEncoder().encode(canonicalStr);
}

/**
 * Computes context-bound HKDF-SHA-256 safety digest of partner public identity using Web Crypto API.
 * Uses explicit domain string 'BETWEEN_US_SAS_HKDF_V1' and HKDF key expansion for cryptographically binding identities.
 */
export async function computeSafetyDigestHKDF(
  spkiHex: string,
  localSpkiHex?: string
): Promise<{ digestBuffer: ArrayBuffer; digestHex: string }> {
  const subtle = getSubtleCrypto();
  if (!spkiHex || typeof spkiHex !== "string") {
    throw new Error("Invalid SPKI hex string provided for safety canonicalization.");
  }

  const partnerBytes = new Uint8Array(hexToBuffer(spkiHex.toLowerCase()));
  const localBytes = localSpkiHex
    ? new Uint8Array(hexToBuffer(localSpkiHex.toLowerCase()))
    : partnerBytes;

  const combinedInput = new Uint8Array(partnerBytes.byteLength + localBytes.byteLength);
  if (spkiHex.toLowerCase() <= (localSpkiHex || spkiHex).toLowerCase()) {
    combinedInput.set(partnerBytes, 0);
    combinedInput.set(localBytes, partnerBytes.byteLength);
  } else {
    combinedInput.set(localBytes, 0);
    combinedInput.set(partnerBytes, localBytes.byteLength);
  }

  const ikm = await subtle.importKey("raw", combinedInput, "HKDF", false, ["deriveBits"]);
  const info = new TextEncoder().encode("BETWEEN_US_SAS_HKDF_V1_CONTEXT_BINDING");
  const salt = new TextEncoder().encode(SAFETY_PROTOCOL_VERSION);

  const digestBuffer = await subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt,
      info,
    },
    ikm,
    256
  );

  const digestHex = bufferToHex(digestBuffer);
  return { digestBuffer, digestHex };
}

/**
 * Computes deterministic safety digest using HKDF-SHA-256 context-bound derivation.
 */
export async function computeSafetyDigest(
  spkiHex: string,
  localSpkiHex?: string
): Promise<{ digestBuffer: ArrayBuffer; digestHex: string }> {
  return computeSafetyDigestHKDF(spkiHex, localSpkiHex);
}
