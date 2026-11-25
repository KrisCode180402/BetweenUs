import { IdentityRecord } from "./types";

/**
 * Converts an ArrayBuffer into a canonical hex string.
 */
export function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      hex += byte.toString(16).padStart(2, "0");
    }
  }
  return hex;
}

/**
 * Converts a hex string into an ArrayBuffer.
 */
export function hexToBuffer(hex: string): ArrayBuffer {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string length.");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
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
 * Computes SHA-256 fingerprint of a public key SPKI ArrayBuffer.
 */
export async function computePublicKeyFingerprint(spkiBuffer: ArrayBuffer): Promise<string> {
  const subtle = getSubtleCrypto();
  const hashBuffer = await subtle.digest("SHA-256", spkiBuffer);
  return bufferToHex(hashBuffer);
}

/**
 * Imports an SPKI hex string into a Web Crypto ECDSA P-256 public CryptoKey.
 */
export async function importPublicKeyFromSpkiHex(spkiHex: string): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  return subtle.importKey(
    "spki",
    hexToBuffer(spkiHex),
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    false,
    ["verify"]
  );
}

/**
 * Generates a new local ECDSA P-256 key pair with a non-extractable private key.
 */
export async function generateDeviceKeyPair(): Promise<IdentityRecord> {
  const subtle = getSubtleCrypto();

  // Generate ECDSA P-256 key pair with extractable = false
  const keyPair = (await subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    false, // extractable = false (Private key cannot be exported by JavaScript)
    ["sign", "verify"]
  )) as CryptoKeyPair;

  // Export public key to SPKI format
  const spkiBuffer = await subtle.exportKey("spki", keyPair.publicKey);
  const spkiHex = bufferToHex(spkiBuffer);

  // Compute canonical SHA-256 fingerprint from SPKI bytes
  const fingerprint = await computePublicKeyFingerprint(spkiBuffer);

  return {
    id: "device_identity",
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    spkiHex,
    fingerprint,
    createdAt: Date.now(),
    version: 1,
  };
}
