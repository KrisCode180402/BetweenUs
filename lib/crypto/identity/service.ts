import {
  DevicePublicIdentity,
  IdentityLifecycleState,
  IdentityRecord,
} from "./types";
import {
  loadIdentityRecord,
  saveIdentityRecord,
  deleteIdentityRecord,
} from "./store";
import {
  generateDeviceKeyPair,
  bufferToHex,
  computePublicKeyFingerprint,
} from "./key-gen";
import { signIdentityData } from "./signing";

let activeIdentityRecord: IdentityRecord | null = null;
let currentState: IdentityLifecycleState = IdentityLifecycleState.NOT_INITIALIZED;

/**
 * Returns current identity lifecycle state.
 */
export function getLifecycleState(): IdentityLifecycleState {
  return currentState;
}

/**
 * Validates a loaded identity record for structural and cryptographic consistency.
 */
async function validateIdentityRecord(record: IdentityRecord): Promise<boolean> {
  if (!record || record.id !== "device_identity") return false;
  if (!record.publicKey || !record.privateKey) return false;
  if (record.publicKey.type !== "public" || record.privateKey.type !== "private") return false;
  if (!record.spkiHex || !record.fingerprint) return false;

  try {
    const subtle = typeof globalThis !== "undefined" && globalThis.crypto?.subtle ? globalThis.crypto.subtle : window.crypto.subtle;
    // Export public key and verify canonical SPKI hex match
    const spkiBuffer = await subtle.exportKey("spki", record.publicKey);
    const calculatedSpkiHex = bufferToHex(spkiBuffer);
    if (calculatedSpkiHex !== record.spkiHex) return false;

    // Verify canonical fingerprint match
    const calculatedFingerprint = await computePublicKeyFingerprint(spkiBuffer);
    if (calculatedFingerprint !== record.fingerprint) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Initializes local device cryptographic identity.
 * Loads existing persistent key pair or generates a new key pair if absent.
 * Strict No-Auto-Regeneration: If a stored identity is corrupted, enters ERROR state.
 */
export async function initializeDeviceIdentity(): Promise<DevicePublicIdentity> {
  if (activeIdentityRecord && currentState === IdentityLifecycleState.AVAILABLE) {
    return getPublicIdentity()!;
  }

  // 1. Attempt to load existing identity record from IndexedDB
  let storedRecord: IdentityRecord | null = null;
  try {
    storedRecord = await loadIdentityRecord();
  } catch {
    currentState = IdentityLifecycleState.ERROR;
    throw new Error("Device identity storage read error.");
  }

  if (storedRecord) {
    // 2. Validate stored identity record
    const isValid = await validateIdentityRecord(storedRecord);
    if (!isValid) {
      // STRICT SECURITY INVARIANT: Do NOT silently regenerate if existing identity is corrupted!
      currentState = IdentityLifecycleState.ERROR;
      throw new Error(
        "Stored device identity is invalid or corrupted. Automatic key regeneration is prohibited."
      );
    }

    activeIdentityRecord = storedRecord;
    currentState = IdentityLifecycleState.AVAILABLE;
    return getPublicIdentity()!;
  }

  // 3. No identity exists: Generate new local device identity
  currentState = IdentityLifecycleState.GENERATING;
  try {
    const newRecord = await generateDeviceKeyPair();
    await saveIdentityRecord(newRecord);
    activeIdentityRecord = newRecord;
    currentState = IdentityLifecycleState.AVAILABLE;
    return getPublicIdentity()!;
  } catch (err) {
    currentState = IdentityLifecycleState.ERROR;
    throw err instanceof Error
      ? err
      : new Error("Failed to generate and persist device identity.");
  }
}

/**
 * Returns safe public identity representation. NEVER exposes private keys.
 */
export function getPublicIdentity(): DevicePublicIdentity | null {
  if (!activeIdentityRecord || currentState !== IdentityLifecycleState.AVAILABLE) {
    return null;
  }

  return {
    algorithm: "ECDSA-P256",
    spkiHex: activeIdentityRecord.spkiHex,
    fingerprint: activeIdentityRecord.fingerprint,
    createdAt: activeIdentityRecord.createdAt,
  };
}

/**
 * Returns canonical SHA-256 fingerprint of the public identity key.
 */
export function getIdentityFingerprint(): string | null {
  const publicId = getPublicIdentity();
  return publicId ? publicId.fingerprint : null;
}

/**
 * Signs data using local device private key without exposing private CryptoKey to caller.
 */
export async function signDataWithIdentity(data: Uint8Array): Promise<ArrayBuffer> {
  if (!activeIdentityRecord || currentState !== IdentityLifecycleState.AVAILABLE) {
    throw new Error("Device identity is not initialized or available for signing.");
  }

  return signIdentityData(activeIdentityRecord.privateKey, data);
}

/**
 * Explicitly destroys local device cryptographic identity from memory and storage.
 */
export async function destroyDeviceIdentity(): Promise<boolean> {
  activeIdentityRecord = null;
  const deleted = await deleteIdentityRecord();
  currentState = IdentityLifecycleState.DESTROYED;
  return deleted;
}
