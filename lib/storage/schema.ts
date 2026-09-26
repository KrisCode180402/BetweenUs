import { StorageConfig } from "./types";

/**
 * Between Us — Local Storage Schema Configuration
 * Phase 08: Secure Minimal Local State
 */
export const STORAGE_CONFIG: StorageConfig = {
  dbName: "between-us-local",
  version: 1,
  storeName: "app_state",
  maxRecordSizeBytes: 2048, // 2 KB maximum per record
  maxTotalSizeBytes: 10240,  // 10 KB maximum store capacity
};

export const ALLOWED_CLASSIFICATIONS_FOR_PERSISTENCE = new Set([
  "PERSISTENT_LOW_SENSITIVITY",
]);

export const FORBIDDEN_STORAGE_KEYS = new Set([
  "call",
  "active_call",
  "call_history",
  "sdp",
  "ice_candidates",
  "pairing_secret",
  "pair_code",
  "private_key",
  "session_key",
  "turn_credentials",
  "signaling_token",
  "auth_token",
  "user_profile",
  "messages",
  "media",
  "audio",
  "video",
  "telemetry",
  "analytics",
]);
