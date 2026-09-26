import { DevicePublicIdentity } from "../crypto/identity/types";

/**
 * State machine states for partner identity safety verification.
 */
export enum VerificationState {
  UNPAIRED = "UNPAIRED",
  PAIRED_UNVERIFIED = "PAIRED_UNVERIFIED",
  VERIFICATION_PENDING = "VERIFICATION_PENDING",
  VERIFIED = "VERIFIED",
  IDENTITY_CHANGED = "IDENTITY_CHANGED",
  VERIFICATION_FAILED = "VERIFICATION_FAILED",
  TRUST_REMOVED = "TRUST_REMOVED",
}

/**
 * Persisted partner verification record in IndexedDB (`partner_verification` store).
 * Bound to the pinned partner device's public key fingerprint.
 */
export interface PartnerVerificationRecord {
  id: "partner_verification";
  schemaVersion: 1;
  pinnedPartnerFingerprint: string;
  verificationStatus: VerificationState;
}

/**
 * Deterministic human-readable safety verification representation.
 */
export interface SafetyRepresentation {
  /** Formatted 16-character alphanumeric code (e.g. "A1B2-C3D4-E5F6-G7H8") */
  shortCode: string;
  /** 6-word deterministic sequence from fixed 256-entry dictionary */
  words: string[];
  /** 5-emoji deterministic sequence from fixed 64-entry vocabulary */
  emojis: string[];
  /** Complete 64-character SHA-256 hex digest for technical review */
  fullFingerprintHex: string;
}

/**
 * Runtime safety verification session state exposed to UI.
 */
export interface SafetyVerificationState {
  state: VerificationState;
  partnerPublicIdentity: DevicePublicIdentity | null;
  representation: SafetyRepresentation | null;
  isPinnedMatch: boolean;
  errorReason: string | null;
}
