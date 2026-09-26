/**
 * Domain separation prefix to prevent cross-protocol signature reuse attacks.
 */
export const DOMAIN_SEPARATION_PREFIX = "BETWEEN_US_IDENTITY_V1:";

/**
 * Combines domain separation string with payload data into a single Uint8Array.
 */
function createPrefixedPayload(data: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const prefixBytes = encoder.encode(DOMAIN_SEPARATION_PREFIX);
  const combined = new Uint8Array(prefixBytes.length + data.length);
  combined.set(prefixBytes, 0);
  combined.set(data, prefixBytes.length);
  return combined;
}

function getSubtleCrypto(): SubtleCrypto {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  throw new Error("Web Crypto API (crypto.subtle) is unavailable in this environment.");
}

/**
 * Generates a domain-separated ECDSA SHA-256 digital signature using the device private key.
 */
export async function signIdentityData(
  privateKey: CryptoKey,
  data: Uint8Array
): Promise<ArrayBuffer> {
  if (!privateKey || privateKey.type !== "private") {
    throw new Error("Invalid private key provided for digital signature generation.");
  }

  const subtle = getSubtleCrypto();
  const prefixedPayload = createPrefixedPayload(data);
  return subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    privateKey,
    prefixedPayload.buffer as ArrayBuffer
  );
}

/**
 * Verifies a domain-separated ECDSA SHA-256 digital signature using a public key.
 */
export async function verifyIdentitySignature(
  publicKey: CryptoKey,
  signature: ArrayBuffer,
  data: Uint8Array
): Promise<boolean> {
  if (!publicKey || publicKey.type !== "public") {
    return false;
  }

  const subtle = getSubtleCrypto();
  const prefixedPayload = createPrefixedPayload(data);
  try {
    return await subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      publicKey,
      signature,
      prefixedPayload.buffer as ArrayBuffer
    );
  } catch {
    return false;
  }
}
