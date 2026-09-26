import { StorageClassification } from "./types";
import { STORAGE_CONFIG, ALLOWED_CLASSIFICATIONS_FOR_PERSISTENCE, FORBIDDEN_STORAGE_KEYS } from "./schema";

export class StorageValidationError extends Error {
  constructor(message: string) {
    super(`StorageValidationError: ${message}`);
    this.name = "StorageValidationError";
  }
}

/**
 * Inspects payload structure to detect forbidden media, WebRTC, cryptographic, or session objects.
 */
function containsForbiddenTypes(obj: unknown, depth = 0): boolean {
  if (depth > 5) return true; // Abort deep nesting to prevent loop/stack issues
  if (obj === null || obj === undefined) return false;

  // Check primitive types
  if (typeof obj === "function") return true;

  // Check DOM / Media / Stream / Crypto objects by constructor name or global instances
  if (typeof window !== "undefined") {
    if (typeof MediaStream !== "undefined" && obj instanceof MediaStream) return true;
    if (typeof MediaStreamTrack !== "undefined" && obj instanceof MediaStreamTrack) return true;
    if (typeof Blob !== "undefined" && obj instanceof Blob) return true;
    if (typeof File !== "undefined" && obj instanceof File) return true;
    if (typeof CryptoKey !== "undefined" && obj instanceof CryptoKey) return true;
    if (typeof RTCPeerConnection !== "undefined" && obj instanceof RTCPeerConnection) return true;
    if (typeof RTCSessionDescription !== "undefined" && obj instanceof RTCSessionDescription) return true;
    if (typeof RTCIceCandidate !== "undefined" && obj instanceof RTCIceCandidate) return true;
  }

  // Inspect constructor name strings as secondary defense
  const constructorName = (obj as { constructor?: { name?: string } })?.constructor?.name || "";
  if (
    [
      "MediaStream",
      "MediaStreamTrack",
      "Blob",
      "File",
      "CryptoKey",
      "RTCPeerConnection",
      "RTCSessionDescription",
      "RTCIceCandidate",
      "WebSocket",
    ].includes(constructorName)
  ) {
    return true;
  }

  // Inspect objects & arrays recursively for forbidden property names or sensitive signatures
  if (typeof obj === "object") {
    const keys = Object.keys(obj as Record<string, unknown>);
    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("sdp") ||
        lowerKey.includes("icecandidate") ||
        lowerKey.includes("privatekey") ||
        lowerKey.includes("pairingsecret") ||
        lowerKey.includes("paircode") ||
        lowerKey.includes("authtoken") ||
        lowerKey.includes("turnpassword") ||
        lowerKey.includes("mediastream") ||
        lowerKey.includes("callhistory")
      ) {
        return true;
      }

      const val = (obj as Record<string, unknown>)[key];
      if (containsForbiddenTypes(val, depth + 1)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validates storage key, classification, and payload against Phase 08 storage policy.
 */
export function validateStoragePayload(
  key: string,
  value: unknown,
  classification: StorageClassification = StorageClassification.PERSISTENT_LOW_SENSITIVITY
): void {
  // 1. Validate Key
  if (!key || typeof key !== "string" || key.trim() === "") {
    throw new StorageValidationError("Storage key must be a non-empty string.");
  }

  const lowerKey = key.toLowerCase();
  for (const forbiddenKey of FORBIDDEN_STORAGE_KEYS) {
    if (lowerKey.includes(forbiddenKey)) {
      throw new StorageValidationError(
        `Persistence rejected: Key '${key}' references forbidden classification '${forbiddenKey}'.`
      );
    }
  }

  // 2. Validate Classification
  if (!ALLOWED_CLASSIFICATIONS_FOR_PERSISTENCE.has(classification)) {
    throw new StorageValidationError(
      `Persistence rejected: Classification '${classification}' is not allowed in persistent local state.`
    );
  }

  // 3. Inspect Payload Types
  if (containsForbiddenTypes(value)) {
    throw new StorageValidationError(
      `Persistence rejected: Value for '${key}' contains forbidden media, WebRTC, cryptographic, or session types.`
    );
  }

  // 4. Validate Size Limits
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new StorageValidationError(`Persistence rejected: Value for '${key}' is not serializable JSON.`);
  }

  const byteLength = new TextEncoder().encode(serialized).length;
  if (byteLength > STORAGE_CONFIG.maxRecordSizeBytes) {
    throw new StorageValidationError(
      `Persistence rejected: Record size (${byteLength} bytes) exceeds maximum limit of ${STORAGE_CONFIG.maxRecordSizeBytes} bytes.`
    );
  }
}
