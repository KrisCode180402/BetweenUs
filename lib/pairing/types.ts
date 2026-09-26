import { DevicePublicIdentity } from "../crypto/identity/types";

/**
 * Between Us — Secure Device Pairing Types & Enums
 * Phase 10: Secure Device Pairing
 */

export enum PairingState {
  IDLE = "IDLE",
  CREATING_INVITATION = "CREATING_INVITATION",
  WAITING_FOR_PEER = "WAITING_FOR_PEER",
  PEER_DETECTED = "PEER_DETECTED",
  EXCHANGING_IDENTITIES = "EXCHANGING_IDENTITIES",
  AUTHENTICATING = "AUTHENTICATING",
  AWAITING_USER_CONFIRMATION = "AWAITING_USER_CONFIRMATION",
  FINALIZING = "FINALIZING",
  PAIRED = "PAIRED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
  FAILED = "FAILED",
}

export enum PairingRole {
  INITIATOR = "INITIATOR",
  RESPONDER = "RESPONDER",
}

export type PairingMessageType =
  | "PAIRING_INVITATION"
  | "PAIRING_RESPONSE"
  | "PAIRING_CONFIRM"
  | "PAIRING_COMPLETE"
  | "PAIRING_CANCEL";

export interface PairingInvitationMessage {
  type: "PAIRING_INVITATION";
  version: "BETWEEN_US_PAIRING_V1";
  sessionId: string;
  tokenHex: string;
  initiatorPublicIdentity: DevicePublicIdentity;
  challengeA: string; // 32-byte hex challenge from Initiator
  expiresAt: number;
}

export interface PairingResponseMessage {
  type: "PAIRING_RESPONSE";
  version: "BETWEEN_US_PAIRING_V1";
  sessionId: string;
  responderPublicIdentity: DevicePublicIdentity;
  challengeB: string; // 32-byte hex challenge from Responder
  signatureB: string; // Hex signature from Responder
  expiresAt: number;
}

export interface PairingConfirmMessage {
  type: "PAIRING_CONFIRM";
  version: "BETWEEN_US_PAIRING_V1";
  sessionId: string;
  signatureA: string; // Hex signature from Initiator
}

export interface PairingCompleteMessage {
  type: "PAIRING_COMPLETE";
  version: "BETWEEN_US_PAIRING_V1";
  sessionId: string;
}

export interface PairingCancelMessage {
  type: "PAIRING_CANCEL";
  version: "BETWEEN_US_PAIRING_V1";
  sessionId: string;
  reason: string;
}

export type PairingMessage =
  | PairingInvitationMessage
  | PairingResponseMessage
  | PairingConfirmMessage
  | PairingCompleteMessage
  | PairingCancelMessage;

export interface PairedPartnerRecord {
  id: "partner_trust";
  partnerPublicIdentity: DevicePublicIdentity;
  pairedAt: number;
  version: 1;
}

export interface PairingSessionState {
  state: PairingState;
  role: PairingRole | null;
  sessionId: string | null;
  tokenHex: string | null;
  challengeA: string | null;
  challengeB: string | null;
  peerPublicIdentity: DevicePublicIdentity | null;
  initiatorUserConfirmed: boolean;
  responderUserConfirmed: boolean;
  errorReason: string | null;
  expiresAt: number | null;
}
