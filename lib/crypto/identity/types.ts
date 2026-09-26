/**
 * Between Us — Device Cryptographic Identity Types
 * Phase 09: Device Cryptographic Identity
 */

export enum IdentityLifecycleState {
  NOT_INITIALIZED = "NOT_INITIALIZED",
  GENERATING = "GENERATING",
  INITIALIZED = "INITIALIZED",
  AVAILABLE = "AVAILABLE",
  ERROR = "ERROR",
  DESTROYED = "DESTROYED",
}

export interface DevicePublicIdentity {
  /** Algorithm identifier used for device identity key pair */
  algorithm: "ECDSA-P256";
  /** Canonical hex representation of exported SPKI public key */
  spkiHex: string;
  /** SHA-256 hex fingerprint derived from canonical SPKI public key */
  fingerprint: string;
  /** Creation timestamp in milliseconds */
  createdAt: number;
}

export interface IdentityRecord {
  id: "device_identity";
  publicKey: CryptoKey;
  privateKey: CryptoKey; // Non-extractable CryptoKey (extractable = false)
  spkiHex: string;
  fingerprint: string;
  createdAt: number;
  version: 1;
}

export interface IdentityStoreConfig {
  dbName: string;
  version: number;
  storeName: string;
}
