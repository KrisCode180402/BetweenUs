import {
  PairingState,
  PairingRole,
  PairingMessage,
  PairingInvitationMessage,
  PairingResponseMessage,
  PairingConfirmMessage,
  PairingCompleteMessage,
  PairingCancelMessage,
  PairingSessionState,
  PairedPartnerRecord,
} from "./types";
import { PairingStateMachine } from "./state-machine";
import { PairingTransport } from "./transport";
import {
  PAIRING_PROTOCOL_VERSION,
  buildResponderPayload,
  buildInitiatorPayload,
} from "./canonical";
import {
  savePairedPartner,
  loadPairedPartner,
  removePairedDevice as removePartnerFromStore,
} from "./partner-store";
import {
  initializeDeviceIdentity,
  getPublicIdentity,
  signDataWithIdentity,
  verifyIdentitySignature,
} from "../crypto/identity";
import { signIdentityData } from "../crypto/identity/signing";
import { bufferToHex, hexToBuffer } from "../crypto/identity/key-gen";
import { DevicePublicIdentity } from "../crypto/identity/types";

const PAIRING_EXPIRATION_MS = 5 * 60 * 1000; // 5 Minutes maximum lifetime
const MAXIMUM_FAILED_ATTEMPTS = 3;

function getRandomHex(bytesLength: number): string {
  const bytes = new Uint8Array(bytesLength);
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    throw new Error("Cryptographically secure random values API unavailable.");
  }
  return bufferToHex(bytes.buffer as ArrayBuffer);
}

function getSubtleCrypto(): SubtleCrypto {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  throw new Error("Web Crypto API unavailable.");
}

async function importPublicKeyFromSpkiHex(spkiHex: string): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const spkiBuffer = hexToBuffer(spkiHex);
  return subtle.importKey(
    "spki",
    spkiBuffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"]
  );
}

export class PairingSessionManager {
  private stateMachine = new PairingStateMachine();
  private activeSession: PairingSessionState = {
    state: PairingState.IDLE,
    role: null,
    sessionId: null,
    tokenHex: null,
    challengeA: null,
    challengeB: null,
    peerPublicIdentity: null,
    initiatorUserConfirmed: false,
    responderUserConfirmed: false,
    errorReason: null,
    expiresAt: null,
  };
  private activeTransport: PairingTransport | null = null;
  private expirationTimer: ReturnType<typeof setTimeout> | null = null;
  private failedAttemptsCount = 0;
  private lockoutUntil: number | null = null;
  private localIdentity: DevicePublicIdentity | null = null;

  private clearExpirationTimer(): void {
    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
    }
  }

  private startExpirationTimer(durationMs: number): void {
    this.clearExpirationTimer();
    this.expirationTimer = setTimeout(() => {
      this.handleTimeout();
    }, durationMs);
  }

  private handleTimeout(): void {
    if (this.activeSession.state !== PairingState.PAIRED && this.activeSession.state !== PairingState.IDLE) {
      this.failSession("Pairing session expired after 5 minutes.", PairingState.EXPIRED);
    }
  }

  private failSession(reason: string, targetState: PairingState = PairingState.FAILED): void {
    if (targetState === PairingState.FAILED || targetState === PairingState.EXPIRED) {
      this.failedAttemptsCount++;
      if (this.failedAttemptsCount >= MAXIMUM_FAILED_ATTEMPTS) {
        this.lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 minutes lockout window
      }
    }
    this.clearExpirationTimer();
    this.activeSession.errorReason = reason;

    if (this.activeTransport) {
      try {
        if (this.activeSession.sessionId) {
          this.activeTransport
            .send({
              type: "PAIRING_CANCEL",
              version: PAIRING_PROTOCOL_VERSION,
              sessionId: this.activeSession.sessionId,
              reason,
            })
            .catch(() => {});
        }
        this.activeTransport.close();
      } catch {
        // Ignore transport close errors
      }
      this.activeTransport = null;
    }

    try {
      this.stateMachine.transitionTo(targetState);
    } catch {
      this.stateMachine.reset();
    }

    this.activeSession.challengeA = null;
    this.activeSession.challengeB = null;
    this.activeSession.tokenHex = null;

    if (this.isLockedOut()) {
      this.activeSession.errorReason = "Maximum pairing failure attempts exceeded. Rate limited for 15 minutes.";
    }
  }

  private isLockedOut(): boolean {
    if (this.lockoutUntil && Date.now() < this.lockoutUntil) {
      return true;
    }
    if (this.lockoutUntil && Date.now() >= this.lockoutUntil) {
      this.lockoutUntil = null;
      this.failedAttemptsCount = 0;
    }
    return this.failedAttemptsCount >= MAXIMUM_FAILED_ATTEMPTS;
  }

  public getSessionState(): Readonly<PairingSessionState> {
    return { ...this.activeSession, state: this.stateMachine.getState() };
  }

  public async createPairingInvitation(
    transport: PairingTransport
  ): Promise<{ invitation: PairingInvitationMessage; displayCode: string }> {
    if (this.isLockedOut()) {
      throw new Error("Maximum failed pairing attempts exceeded. Rate limited for 15 minutes.");
    }

    const myIdentity = await initializeDeviceIdentity();
    this.localIdentity = myIdentity;

    if (this.stateMachine.getState() !== PairingState.IDLE) {
      this.stateMachine.reset();
    }
    this.stateMachine.transitionTo(PairingState.CREATING_INVITATION);

    const sessionId = getRandomHex(16);
    const tokenHex = getRandomHex(16);
    const challengeA = getRandomHex(32);
    const expiresAt = Date.now() + PAIRING_EXPIRATION_MS;

    this.activeTransport = transport;
    this.activeSession = {
      state: PairingState.CREATING_INVITATION,
      role: PairingRole.INITIATOR,
      sessionId,
      tokenHex,
      challengeA,
      challengeB: null,
      peerPublicIdentity: null,
      initiatorUserConfirmed: false,
      responderUserConfirmed: false,
      errorReason: null,
      expiresAt,
    };

    const invitation: PairingInvitationMessage = {
      type: "PAIRING_INVITATION",
      version: PAIRING_PROTOCOL_VERSION,
      sessionId,
      tokenHex,
      initiatorPublicIdentity: myIdentity,
      challengeA,
      expiresAt,
    };

    const displayCode = tokenHex.substring(0, 6).toUpperCase();

    this.stateMachine.transitionTo(PairingState.WAITING_FOR_PEER);
    this.startExpirationTimer(PAIRING_EXPIRATION_MS);

    transport.onMessage((msg) => this.handleIncomingMessage(msg));

    return { invitation, displayCode };
  }

  public async joinPairingSession(
    transport: PairingTransport,
    invitation: PairingInvitationMessage,
    overrideResponderRecord?: { identity: DevicePublicIdentity; privateKey: CryptoKey }
  ): Promise<void> {
    if (this.isLockedOut()) {
      throw new Error("Maximum failed pairing attempts exceeded. Rate limited for 15 minutes.");
    }

    if (
      !invitation ||
      invitation.type !== "PAIRING_INVITATION" ||
      invitation.version !== PAIRING_PROTOCOL_VERSION
    ) {
      throw new Error("Invalid or unsupported pairing invitation format.");
    }

    if (Date.now() > invitation.expiresAt) {
      throw new Error("Pairing invitation has expired.");
    }

    const myIdentity = overrideResponderRecord
      ? overrideResponderRecord.identity
      : await initializeDeviceIdentity();
    this.localIdentity = myIdentity;

    if (myIdentity.fingerprint === invitation.initiatorPublicIdentity.fingerprint) {
      throw new Error("Self-pairing is prohibited. Initiator and responder identities cannot be identical.");
    }

    if (this.stateMachine.getState() !== PairingState.IDLE) {
      this.stateMachine.reset();
    }
    this.stateMachine.transitionTo(PairingState.PEER_DETECTED);
    this.stateMachine.transitionTo(PairingState.EXCHANGING_IDENTITIES);

    this.activeTransport = transport;
    transport.onMessage((msg) => this.handleIncomingMessage(msg));

    const challengeB = getRandomHex(32);
    this.activeSession = {
      state: PairingState.EXCHANGING_IDENTITIES,
      role: PairingRole.RESPONDER,
      sessionId: invitation.sessionId,
      tokenHex: invitation.tokenHex,
      challengeA: invitation.challengeA,
      challengeB,
      peerPublicIdentity: invitation.initiatorPublicIdentity,
      initiatorUserConfirmed: false,
      responderUserConfirmed: false,
      errorReason: null,
      expiresAt: invitation.expiresAt,
    };

    const responderPayload = buildResponderPayload(
      invitation.sessionId,
      invitation.challengeA,
      invitation.initiatorPublicIdentity.fingerprint,
      myIdentity.fingerprint
    );

    const signatureBBuffer = overrideResponderRecord
      ? await signIdentityData(overrideResponderRecord.privateKey, responderPayload)
      : await signDataWithIdentity(responderPayload);

    const signatureBHex = bufferToHex(signatureBBuffer);

    const responseMessage: PairingResponseMessage = {
      type: "PAIRING_RESPONSE",
      version: PAIRING_PROTOCOL_VERSION,
      sessionId: invitation.sessionId,
      responderPublicIdentity: myIdentity,
      challengeB,
      signatureB: signatureBHex,
      expiresAt: invitation.expiresAt,
    };

    this.stateMachine.transitionTo(PairingState.AUTHENTICATING);
    this.startExpirationTimer(invitation.expiresAt - Date.now());

    await transport.send(responseMessage);
  }

  private async handleIncomingMessage(message: PairingMessage): Promise<void> {
    if (!message || message.version !== PAIRING_PROTOCOL_VERSION) {
      return;
    }

    if (this.activeSession.sessionId && message.sessionId !== this.activeSession.sessionId) {
      return;
    }

    if (message.type === "PAIRING_CANCEL") {
      this.failSession((message as PairingCancelMessage).reason || "Peer cancelled pairing.", PairingState.CANCELLED);
      return;
    }

    if (this.activeSession.role === PairingRole.INITIATOR) {
      await this.handleInitiatorMessages(message);
    } else if (this.activeSession.role === PairingRole.RESPONDER) {
      await this.handleResponderMessages(message);
    }
  }

  private async handleInitiatorMessages(message: PairingMessage): Promise<void> {
    const current = this.stateMachine.getState();

    if (message.type === "PAIRING_RESPONSE") {
      if (current !== PairingState.WAITING_FOR_PEER && current !== PairingState.PEER_DETECTED) {
        this.failSession("Unexpected PAIRING_RESPONSE message in current state.");
        return;
      }

      const response = message as PairingResponseMessage;
      const myIdentity = this.localIdentity || getPublicIdentity()!;

      if (response.responderPublicIdentity.fingerprint === myIdentity.fingerprint) {
        this.failSession("Reflection attack detected: Responder identity matches Initiator identity.");
        return;
      }

      this.stateMachine.transitionTo(PairingState.PEER_DETECTED);
      this.stateMachine.transitionTo(PairingState.EXCHANGING_IDENTITIES);

      try {
        const responderPublicKey = await importPublicKeyFromSpkiHex(response.responderPublicIdentity.spkiHex);
        const responderPayload = buildResponderPayload(
          response.sessionId,
          this.activeSession.challengeA!,
          myIdentity.fingerprint,
          response.responderPublicIdentity.fingerprint
        );
        const signatureBBuffer = hexToBuffer(response.signatureB);

        const isValid = await verifyIdentitySignature(responderPublicKey, signatureBBuffer, responderPayload);
        if (!isValid) {
          this.failSession("Responder identity signature verification failed.");
          return;
        }
      } catch {
        this.failSession("Responder signature validation error.");
        return;
      }

      this.stateMachine.transitionTo(PairingState.AUTHENTICATING);
      this.activeSession.peerPublicIdentity = response.responderPublicIdentity;
      this.activeSession.challengeB = response.challengeB;

      const initiatorPayload = buildInitiatorPayload(
        response.sessionId,
        response.challengeB,
        myIdentity.fingerprint,
        response.responderPublicIdentity.fingerprint
      );

      const signatureABuffer = await signDataWithIdentity(initiatorPayload);
      const signatureAHex = bufferToHex(signatureABuffer);

      const confirmMsg: PairingConfirmMessage = {
        type: "PAIRING_CONFIRM",
        version: PAIRING_PROTOCOL_VERSION,
        sessionId: response.sessionId,
        signatureA: signatureAHex,
      };

      this.stateMachine.transitionTo(PairingState.AWAITING_USER_CONFIRMATION);
      await this.activeTransport!.send(confirmMsg);
    } else if (message.type === "PAIRING_COMPLETE") {
      this.activeSession.responderUserConfirmed = true;
      this.checkAtomicFinalization();
    }
  }

  private async handleResponderMessages(message: PairingMessage): Promise<void> {
    const current = this.stateMachine.getState();

    if (message.type === "PAIRING_CONFIRM") {
      if (current !== PairingState.AUTHENTICATING) {
        this.failSession("Unexpected PAIRING_CONFIRM message in current state.");
        return;
      }

      const confirm = message as PairingConfirmMessage;
      const myIdentity = this.localIdentity || getPublicIdentity()!;
      const peerIdentity = this.activeSession.peerPublicIdentity!;

      try {
        const initiatorPublicKey = await importPublicKeyFromSpkiHex(peerIdentity.spkiHex);
        const initiatorPayload = buildInitiatorPayload(
          confirm.sessionId,
          this.activeSession.challengeB!,
          peerIdentity.fingerprint,
          myIdentity.fingerprint
        );
        const signatureABuffer = hexToBuffer(confirm.signatureA);

        const isValid = await verifyIdentitySignature(initiatorPublicKey, signatureABuffer, initiatorPayload);
        if (!isValid) {
          this.failSession("Initiator identity signature verification failed.");
          return;
        }
      } catch {
        this.failSession("Initiator signature validation error.");
        return;
      }

      this.stateMachine.transitionTo(PairingState.AWAITING_USER_CONFIRMATION);
    } else if (message.type === "PAIRING_COMPLETE") {
      this.activeSession.initiatorUserConfirmed = true;
      this.checkAtomicFinalization();
    }
  }

  public async confirmPairing(): Promise<boolean> {
    if (this.stateMachine.getState() !== PairingState.AWAITING_USER_CONFIRMATION) {
      throw new Error("Cannot confirm pairing: Session is not awaiting user confirmation.");
    }

    if (this.activeSession.role === PairingRole.INITIATOR) {
      this.activeSession.initiatorUserConfirmed = true;
    } else {
      this.activeSession.responderUserConfirmed = true;
    }

    this.stateMachine.transitionTo(PairingState.FINALIZING);

    if (this.activeTransport && this.activeSession.sessionId) {
      const completeMsg: PairingCompleteMessage = {
        type: "PAIRING_COMPLETE",
        version: PAIRING_PROTOCOL_VERSION,
        sessionId: this.activeSession.sessionId,
      };
      await this.activeTransport.send(completeMsg);
    }

    return this.checkAtomicFinalization();
  }

  private async checkAtomicFinalization(): Promise<boolean> {
    if (!this.activeSession.peerPublicIdentity) return false;
    if (!this.activeSession.initiatorUserConfirmed || !this.activeSession.responderUserConfirmed) {
      return false;
    }

    const current = this.stateMachine.getState();
    if (current !== PairingState.FINALIZING && current !== PairingState.AWAITING_USER_CONFIRMATION) {
      return false;
    }

    const partnerRecord: PairedPartnerRecord = {
      id: "partner_trust",
      partnerPublicIdentity: this.activeSession.peerPublicIdentity,
      pairedAt: Date.now(),
      version: 1,
    };

    await savePairedPartner(partnerRecord);

    try {
      this.stateMachine.transitionTo(PairingState.PAIRED);
    } catch {
      // Ignore if state is already transitioning
    }

    this.clearExpirationTimer();
    this.failedAttemptsCount = 0;

    this.activeSession.challengeA = null;
    this.activeSession.challengeB = null;
    this.activeSession.tokenHex = null;

    if (this.activeTransport) {
      const transportToClose = this.activeTransport;
      this.activeTransport = null;
      setTimeout(() => {
        try {
          transportToClose.close();
        } catch {
          // Ignore
        }
      }, 50);
    }

    return true;
  }

  public async cancelPairing(reason = "User cancelled pairing"): Promise<void> {
    this.failSession(reason, PairingState.CANCELLED);
  }
}

// Global Singleton Instance for convenient application usage
const globalPairingManager = new PairingSessionManager();

export function getPairingSessionState(): Readonly<PairingSessionState> {
  return globalPairingManager.getSessionState();
}

export function createPairingInvitation(
  transport: PairingTransport
): Promise<{ invitation: PairingInvitationMessage; displayCode: string }> {
  return globalPairingManager.createPairingInvitation(transport);
}

export function joinPairingSession(
  transport: PairingTransport,
  invitation: PairingInvitationMessage,
  overrideResponderRecord?: { identity: DevicePublicIdentity; privateKey: CryptoKey }
): Promise<void> {
  return globalPairingManager.joinPairingSession(transport, invitation, overrideResponderRecord);
}

export function confirmPairing(): Promise<boolean> {
  return globalPairingManager.confirmPairing();
}

export function cancelPairing(reason?: string): Promise<void> {
  return globalPairingManager.cancelPairing(reason);
}

export async function removePairedPartnerDevice(): Promise<boolean> {
  const removed = await removePartnerFromStore();
  if (globalPairingManager.getSessionState().state !== PairingState.IDLE) {
    await globalPairingManager.cancelPairing("Partner device removed");
  }
  return removed;
}

export async function getPairedPartner(): Promise<PairedPartnerRecord | null> {
  return loadPairedPartner();
}
