import { WebSocket } from "ws";
import { DevicePublicIdentity } from "../../lib/crypto/identity/types";

export enum SignalingMessageType {
  SESSION_JOIN = "SESSION_JOIN",
  SESSION_READY = "SESSION_READY",
  SDP_OFFER = "SDP_OFFER",
  SDP_ANSWER = "SDP_ANSWER",
  ICE_CANDIDATE = "ICE_CANDIDATE",
  PEER_LEFT = "PEER_LEFT",
  SESSION_END = "SESSION_END",
  ERROR = "ERROR",
  PING = "PING",
  PONG = "PONG",
}

export interface SignalingEnvelope<T = any> {
  version: 1;
  type: SignalingMessageType;
  sessionId: string;
  sender: string; // SHA-256 public identity fingerprint hex
  payload: T;
}

export interface SessionJoinPayload {
  publicIdentity: DevicePublicIdentity;
  nonce: string; // 256-bit random hex nonce
  timestamp: number; // UTC timestamp ms
  signature: string; // ECDSA signature over canonical auth string
}

export interface SdpPayload {
  type: "offer" | "answer";
  sdp: string;
}

export interface IceCandidatePayload {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

export interface SignalingParticipant {
  fingerprint: string;
  publicIdentity: DevicePublicIdentity;
  socket: WebSocket;
  joinedAt: number;
}

export interface EphemeralSignalingSession {
  sessionId: string;
  participants: Map<string, SignalingParticipant>; // Keyed by fingerprint
  createdAt: number;
  lastActivityAt: number;
  expirationTimer: ReturnType<typeof setTimeout> | null;
}
