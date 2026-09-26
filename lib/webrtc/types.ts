import { DevicePublicIdentity } from "../crypto/identity/types";

export type CallType = "audio" | "video";

export enum CallState {
  IDLE = "IDLE",
  OUTGOING_INITIATING = "OUTGOING_INITIATING",
  OUTGOING_RINGING = "OUTGOING_RINGING",
  INCOMING_RINGING = "INCOMING_RINGING",
  ACCEPTING = "ACCEPTING",
  NEGOTIATING = "NEGOTIATING",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  RECONNECTING = "RECONNECTING",
  ENDING = "ENDING",
  ENDED = "ENDED",
  FAILED = "FAILED",
  TIMED_OUT = "TIMED_OUT",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",

  // Backward-compatibility enum members for Phase 13/14/15
  CALLING = "CALLING",
  RINGING = "RINGING",
}

export enum CallEvent {
  START_CALL = "START_CALL",
  OFFER_SENT = "OFFER_SENT",
  RINGING_RECEIVED = "RINGING_RECEIVED",
  INCOMING_OFFER = "INCOMING_OFFER",
  ACCEPT = "ACCEPT",
  DECLINE = "DECLINE",
  CANCEL = "CANCEL",
  SDP_EXCHANGE = "SDP_EXCHANGE",
  ICE_CONNECTED = "ICE_CONNECTED",
  NETWORK_INTERRUPTED = "NETWORK_INTERRUPTED",
  RECONNECTED = "RECONNECTED",
  HANGUP = "HANGUP",
  TIMEOUT = "TIMEOUT",
  ERROR = "ERROR",
  RESET = "RESET",
}

export interface AudioCallSettings {
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export interface CallSessionOptions {
  serverUrl: string;
  sessionId: string;
  partnerIdentity: DevicePublicIdentity;
  callType?: CallType;
  audioSettings?: AudioCallSettings;
  rtcConfig?: RTCConfiguration;
  turnApiEndpoint?: string;
  enableTurnRelay?: boolean;
}

export interface CallSessionEvents {
  onCallStateChange?: (state: CallState) => void;
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onMuteChange?: (isMuted: boolean) => void;
  onCameraChange?: (isCameraOff: boolean) => void;
  onError?: (errorMessage: string) => void;
}

export interface IncomingCallInvitation {
  sessionId: string;
  callerIdentity: DevicePublicIdentity;
  callType: CallType;
  offerSdp: string;
  timestamp: number;
}
