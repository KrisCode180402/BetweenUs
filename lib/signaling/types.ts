import { DevicePublicIdentity } from "../crypto/identity/types";
import {
  SdpPayload,
  IceCandidatePayload,
} from "../../server/signaling/types";

export enum ClientSignalingState {
  DISCONNECTED = "DISCONNECTED",
  CONNECTING = "CONNECTING",
  AUTHENTICATING = "AUTHENTICATING",
  JOINED = "JOINED",
  READY = "READY",
  ERROR = "ERROR",
}

export interface ClientSignalingEvents {
  onStateChange?: (state: ClientSignalingState) => void;
  onSessionReady?: (sessionId: string) => void;
  onSdpOffer?: (offer: SdpPayload, senderFingerprint: string) => void;
  onSdpAnswer?: (answer: SdpPayload, senderFingerprint: string) => void;
  onIceCandidate?: (candidate: IceCandidatePayload, senderFingerprint: string) => void;
  onPeerLeft?: (reason: string) => void;
  onError?: (errorReason: string) => void;
}

export interface SignalingClientOptions {
  serverUrl: string;
  sessionId: string;
  localIdentity: DevicePublicIdentity;
  privateKey?: CryptoKey;
  signer?: (data: Uint8Array) => Promise<ArrayBuffer>;
  events?: ClientSignalingEvents;
}
