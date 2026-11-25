import {
  VerificationState,
  PartnerVerificationRecord,
  SafetyRepresentation,
  SafetyVerificationState,
} from "./types";
import { computeSafetyDigest } from "./canonical";
import { deriveSafetyRepresentation } from "./mapping";
import {
  saveVerificationRecord,
  loadVerificationRecord,
  removeVerificationRecord,
} from "./store";
import { VerificationStateMachine } from "./state-machine";
import { DevicePublicIdentity } from "../crypto/identity/types";
import { getPublicIdentity } from "../crypto/identity";
import { getPairedPartner } from "../pairing/service";

export class SafetyVerificationManager {
  private stateMachine = new VerificationStateMachine();
  private partnerIdentity: DevicePublicIdentity | null = null;
  private representation: SafetyRepresentation | null = null;
  private pinnedFingerprint: string | null = null;
  private errorReason: string | null = null;

  public getSessionState(): Readonly<SafetyVerificationState> {
    return {
      state: this.stateMachine.getState(),
      partnerPublicIdentity: this.partnerIdentity,
      representation: this.representation,
      isPinnedMatch: Boolean(
        this.pinnedFingerprint &&
          this.partnerIdentity &&
          this.pinnedFingerprint === this.partnerIdentity.fingerprint
      ),
      errorReason: this.errorReason,
    };
  }

  /**
   * Derives deterministic safety representation for any given partner public identity.
   * Binds both remote and local cryptographic identities symmetrically via HKDF-SHA-256
   * when local identity is initialized, with graceful hex fingerprint fallback for legacy records.
   */
  public async calculateSafetyRepresentation(
    partnerIdentity: DevicePublicIdentity
  ): Promise<SafetyRepresentation> {
    const partnerKeyHex = partnerIdentity?.spkiHex || partnerIdentity?.fingerprint || "";
    if (!partnerIdentity || !partnerKeyHex || !/^[0-9a-f]+$/i.test(partnerKeyHex)) {
      throw new Error("Invalid partner public identity provided for safety representation.");
    }

    const localIdentity = getPublicIdentity();
    const localKeyHex = partnerIdentity.spkiHex
      ? localIdentity?.spkiHex
      : localIdentity?.fingerprint;

    const { digestBuffer, digestHex } = await computeSafetyDigest(
      partnerKeyHex,
      localKeyHex && /^[0-9a-f]+$/i.test(localKeyHex) ? localKeyHex : undefined
    );
    return deriveSafetyRepresentation(digestBuffer, digestHex);
  }

  /**
   * Initializes or refreshes safety verification session for active partner device.
   */
  public async initializeSafetySession(
    overridePartnerIdentity?: DevicePublicIdentity
  ): Promise<Readonly<SafetyVerificationState>> {
    let targetPartner: DevicePublicIdentity | null = overridePartnerIdentity || null;

    if (!targetPartner) {
      const partnerRecord = await getPairedPartner();
      targetPartner = partnerRecord ? partnerRecord.partnerPublicIdentity : null;
    }

    if (!targetPartner) {
      this.partnerIdentity = null;
      this.representation = null;
      this.pinnedFingerprint = null;
      this.stateMachine.reset();
      return this.getSessionState();
    }

    this.partnerIdentity = targetPartner;
    this.representation = await this.calculateSafetyRepresentation(targetPartner);

    // Load persisted verification record to check identity pinning
    const storedRecord = await loadVerificationRecord();

    if (this.stateMachine.getState() === VerificationState.UNPAIRED) {
      this.stateMachine.transitionTo(VerificationState.PAIRED_UNVERIFIED);
    }

    if (storedRecord) {
      this.pinnedFingerprint = storedRecord.pinnedPartnerFingerprint;

      if (storedRecord.pinnedPartnerFingerprint === targetPartner.fingerprint) {
        // Identity matches pinned record
        if (storedRecord.verificationStatus === VerificationState.VERIFIED) {
          try {
            if (this.stateMachine.getState() !== VerificationState.VERIFICATION_PENDING) {
              this.stateMachine.transitionTo(VerificationState.VERIFICATION_PENDING);
            }
            this.stateMachine.transitionTo(VerificationState.VERIFIED);
          } catch {
            this.stateMachine.reset();
            this.stateMachine.transitionTo(VerificationState.PAIRED_UNVERIFIED);
          }
        }
      } else {
        // CRITICAL: Identity Substitution / Key Change Detected!
        this.errorReason =
          "The cryptographic identity of this device is different from the identity you previously verified.";
        try {
          this.stateMachine.transitionTo(VerificationState.IDENTITY_CHANGED);
        } catch {
          this.stateMachine.reset();
          this.stateMachine.transitionTo(VerificationState.PAIRED_UNVERIFIED);
          this.stateMachine.transitionTo(VerificationState.IDENTITY_CHANGED);
        }
      }
    }

    return this.getSessionState();
  }

  /**
   * User explicitly confirms that displayed safety codes match.
   * Pins current partner public identity fingerprint and marks state as VERIFIED.
   */
  public async confirmVerificationMatch(): Promise<Readonly<SafetyVerificationState>> {
    if (!this.partnerIdentity) {
      throw new Error("Cannot confirm verification match: No active partner public identity.");
    }

    const current = this.stateMachine.getState();
    if (
      current !== VerificationState.PAIRED_UNVERIFIED &&
      current !== VerificationState.VERIFICATION_PENDING &&
      current !== VerificationState.IDENTITY_CHANGED &&
      current !== VerificationState.VERIFICATION_FAILED
    ) {
      if (current !== VerificationState.VERIFIED) {
        throw new Error(`Cannot confirm verification match from state ${current}.`);
      }
    }

    if (
      current === VerificationState.PAIRED_UNVERIFIED ||
      current === VerificationState.IDENTITY_CHANGED ||
      current === VerificationState.VERIFICATION_FAILED
    ) {
      this.stateMachine.transitionTo(VerificationState.VERIFICATION_PENDING);
    }

    this.pinnedFingerprint = this.partnerIdentity.fingerprint;
    this.errorReason = null;

    const record: PartnerVerificationRecord = {
      id: "partner_verification",
      schemaVersion: 1,
      pinnedPartnerFingerprint: this.partnerIdentity.fingerprint,
      verificationStatus: VerificationState.VERIFIED,
    };

    await saveVerificationRecord(record);
    this.stateMachine.transitionTo(VerificationState.VERIFIED);

    return this.getSessionState();
  }

  /**
   * User explicitly flags that safety codes DO NOT match.
   * Sets verification state to VERIFICATION_FAILED and records security warning.
   */
  public async rejectVerificationMismatch(): Promise<Readonly<SafetyVerificationState>> {
    if (!this.partnerIdentity) {
      throw new Error("Cannot reject verification: No active partner public identity.");
    }

    const current = this.stateMachine.getState();
    if (current === VerificationState.PAIRED_UNVERIFIED || current === VerificationState.VERIFIED || current === VerificationState.IDENTITY_CHANGED) {
      this.stateMachine.transitionTo(VerificationState.VERIFICATION_PENDING);
    }

    this.errorReason = "Identity verification failed. Do not continue trusting this device until the identity is resolved.";

    const record: PartnerVerificationRecord = {
      id: "partner_verification",
      schemaVersion: 1,
      pinnedPartnerFingerprint: this.pinnedFingerprint || this.partnerIdentity.fingerprint,
      verificationStatus: VerificationState.VERIFICATION_FAILED,
    };

    await saveVerificationRecord(record);
    this.stateMachine.transitionTo(VerificationState.VERIFICATION_FAILED);

    return this.getSessionState();
  }

  /**
   * Resets verification state to UNVERIFIED while retaining partner pairing.
   */
  public async resetVerification(): Promise<Readonly<SafetyVerificationState>> {
    await removeVerificationRecord();
    this.pinnedFingerprint = null;
    this.errorReason = null;

    if (this.partnerIdentity) {
      this.stateMachine.reset();
      this.stateMachine.transitionTo(VerificationState.PAIRED_UNVERIFIED);
    } else {
      this.stateMachine.reset();
    }

    return this.getSessionState();
  }

  /**
   * Clears verification state completely when partner device is removed.
   */
  public async removePartnerVerification(): Promise<void> {
    await removeVerificationRecord();
    this.partnerIdentity = null;
    this.representation = null;
    this.pinnedFingerprint = null;
    this.errorReason = null;
    this.stateMachine.reset();
  }
}

// Global Singleton Instance
const globalSafetyManager = new SafetyVerificationManager();

export function getSafetyVerificationState(): Readonly<SafetyVerificationState> {
  return globalSafetyManager.getSessionState();
}

export function calculateSafetyRepresentation(
  partnerIdentity: DevicePublicIdentity
): Promise<SafetyRepresentation> {
  return globalSafetyManager.calculateSafetyRepresentation(partnerIdentity);
}

export function initializeSafetySession(
  overridePartnerIdentity?: DevicePublicIdentity
): Promise<Readonly<SafetyVerificationState>> {
  return globalSafetyManager.initializeSafetySession(overridePartnerIdentity);
}

export function confirmVerificationMatch(): Promise<Readonly<SafetyVerificationState>> {
  return globalSafetyManager.confirmVerificationMatch();
}

export function rejectVerificationMismatch(): Promise<Readonly<SafetyVerificationState>> {
  return globalSafetyManager.rejectVerificationMismatch();
}

export function resetVerification(): Promise<Readonly<SafetyVerificationState>> {
  return globalSafetyManager.resetVerification();
}

export function removePartnerVerification(): Promise<void> {
  return globalSafetyManager.removePartnerVerification();
}
