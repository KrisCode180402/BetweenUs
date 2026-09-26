/**
 * Between Us — Local Storage Types & Classifications
 * Phase 08: Secure Minimal Local State
 */

export enum StorageClassification {
  /** Data exists only in memory while session is active. Never persisted. */
  EPHEMERAL_MEMORY = "EPHEMERAL_MEMORY",
  /** Non-sensitive UI application preferences requiring persistence across reloads. */
  PERSISTENT_LOW_SENSITIVITY = "PERSISTENT_LOW_SENSITIVITY",
  /** Sensitive data requiring protected persistence (Strictly controlled). */
  SENSITIVE_PERSISTENT = "SENSITIVE_PERSISTENT",
  /** Cryptographic keys and identity material (Reserved for Phase 09). */
  CRYPTOGRAPHIC_MATERIAL = "CRYPTOGRAPHIC_MATERIAL",
  /** Real-time communication call session information (In-memory only). */
  CALL_SESSION_DATA = "CALL_SESSION_DATA",
  /** Audio/video media streams or chunks (NEVER STORED). */
  MEDIA_DATA = "MEDIA_DATA",
}

export interface StorageRecord<T = unknown> {
  key: string;
  value: T;
  updatedAt: number;
  classification: StorageClassification;
}

export interface StorageConfig {
  dbName: string;
  version: number;
  storeName: string;
  maxRecordSizeBytes: number;
  maxTotalSizeBytes: number;
}
