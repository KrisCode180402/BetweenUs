import {
  CallState,
  CallEvent,
  CallType,
  CallSessionOptions,
  CallSessionEvents,
  IncomingCallInvitation,
} from "./types";
import { CallStateMachine } from "./call-state-machine";
import { PeerConnectionManager } from "./peer-connection";
import { SupabaseSignalingClient, SupabaseSignalingPayload } from "../signaling/supabase-signaling";
import { buildRtcConfiguration } from "./ice";
import { getPairedPartner } from "../pairing";
import { initializeDeviceIdentity, getPublicIdentity } from "../crypto/identity";
import { cleanupCallSession } from "./cleanup";
import { ringtoneManager } from "../sound/ringtone";
import { pushManager } from "../push/push-manager";

export interface PendingIncomingCall {
  sessionId: string;
  callType: CallType;
  offerSdp: string;
  partnerIdentity?: any;
  timestamp: number;
}

let pendingCallStore: PendingIncomingCall | null = null;

export function setPendingIncomingCall(call: PendingIncomingCall | null): void {
  pendingCallStore = call;
}

export function getPendingIncomingCall(): PendingIncomingCall | null {
  return pendingCallStore;
}

export function clearPendingIncomingCall(): void {
  pendingCallStore = null;
}

export class AudioCallManager {
  private stateMachine = new CallStateMachine();
  private pcManager: PeerConnectionManager | null = null;
  private supabaseSignaling: SupabaseSignalingClient | null = null;
  private incomingInvitation: IncomingCallInvitation | null = null;

  // Session-scoped Timers
  private initiationTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private ringingTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectionTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly INITIATION_TIMEOUT_MS = 20000;  // 20s
  private readonly RINGING_TIMEOUT_MS = 30000;     // 30s
  private readonly CONNECTION_TIMEOUT_MS = 30000;  // 30s
  private readonly RECONNECTION_TIMEOUT_MS = 15000; // 15s

  private coupleId: string = "default-couple";
  private localUserId: string = "local-user";

  constructor(
    private options: CallSessionOptions,
    private events: CallSessionEvents = {}
  ) {
    if (!this.options.sessionId) {
      this.options.sessionId = `BETWEEN_US_CALL_SESSION_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    this.stateMachine.setSessionId(this.options.sessionId);

    const identity = getPublicIdentity();
    if (identity) {
      this.localUserId = identity.fingerprint;
    }
  }

  public getState(): CallState {
    return this.stateMachine.getState();
  }

  public getSessionId(): string {
    return this.options.sessionId;
  }

  public getCallType(): CallType {
    return this.options.callType || "audio";
  }

  public getIsMuted(): boolean {
    return this.pcManager ? this.pcManager.getIsMuted() : false;
  }

  public getIsCameraOff(): boolean {
    return this.pcManager ? this.pcManager.getIsCameraOff() : false;
  }

  public getIsScreenSharing(): boolean {
    return this.pcManager ? this.pcManager.getIsScreenSharing() : false;
  }

  public getLocalStream(): MediaStream | null {
    return this.pcManager ? this.pcManager.getLocalStream() : null;
  }

  public getRemoteStream(): MediaStream | null {
    return this.pcManager ? this.pcManager.getRemoteStream() : null;
  }

  private setState(nextState: CallState): void {
    if (this.stateMachine.canTransitionTo(nextState)) {
      this.stateMachine.transitionTo(nextState);
      if (this.events.onCallStateChange) {
        try {
          this.events.onCallStateChange(nextState);
        } catch {}
      }
    }
  }

  private dispatchEvent(event: CallEvent): CallState {
    try {
      const nextState = this.stateMachine.dispatch(event);
      if (this.events.onCallStateChange) {
        try {
          this.events.onCallStateChange(nextState);
        } catch {}
      }
      return nextState;
    } catch {
      return this.stateMachine.getState();
    }
  }

  /**
   * Initializes Supabase Realtime Signaling Client for this call session.
   */
  private async setupSupabaseSignaling(): Promise<SupabaseSignalingClient> {
    const pairedPartner = await getPairedPartner();
    const identity = await initializeDeviceIdentity();
    if (identity) {
      this.localUserId = identity.fingerprint;
    }
    const myFingerprint = identity?.fingerprint || this.localUserId;
    const partnerFingerprint =
      pairedPartner?.partnerPublicIdentity?.fingerprint ||
      this.options.partnerIdentity?.fingerprint;

    if (myFingerprint && partnerFingerprint) {
      this.coupleId = [myFingerprint, partnerFingerprint].sort().join("_");
    } else if (pairedPartner) {
      this.coupleId = (pairedPartner as any).coupleId || pairedPartner.id || "partner_trust";
    }

    this.supabaseSignaling = new SupabaseSignalingClient(this.coupleId, this.localUserId, {
      onCallInvite: (payload: SupabaseSignalingPayload) => {
        if (this.stateMachine.getState() === CallState.IDLE) {
          this.incomingInvitation = {
            sessionId: payload.sessionId,
            callerIdentity: this.options.partnerIdentity,
            callType: payload.callType || "audio",
            offerSdp: payload.sdp || "",
            timestamp: payload.timestamp || Date.now(),
          };
          this.dispatchEvent(CallEvent.INCOMING_OFFER);
          this.startRingingTimeout();
          ringtoneManager.playIncomingRingtone();
        }
      },
      onCallAccept: (_payload) => {
        this.clearRingingTimeout();
        ringtoneManager.stopAll();
      },
      onCallDecline: (_payload) => {
        this.clearAllTimers();
        ringtoneManager.stopAll();
        this.endCall();
      },
      onCallCancel: (_payload) => {
        this.clearAllTimers();
        ringtoneManager.stopAll();
        this.endCall();
      },
      onSdpOffer: async (payload) => {
        if (payload.sdp && this.pcManager) {
          await this.pcManager.setRemoteOffer(payload.sdp);
        }
      },
      onSdpAnswer: async (payload) => {
        if (payload.sdp && this.pcManager) {
          await this.handleRemoteAnswer(payload.sdp);
        }
      },
      onIceCandidate: async (payload) => {
        if (payload.candidate && this.pcManager) {
          await this.pcManager.addIceCandidate({
            candidate: payload.candidate.candidate || "",
            sdpMid: payload.candidate.sdpMid ?? null,
            sdpMLineIndex: payload.candidate.sdpMLineIndex ?? null,
          });
        }
      },
      onCallEnd: () => {
        this.endCall();
      },
      onError: (err) => {
        if (this.stateMachine.getState() !== CallState.IDLE) {
          this.handleFailure(err);
        } else {
          console.warn("Background signaling connection notice while idle:", err);
        }
      },
    });

    await this.supabaseSignaling.subscribe();
    return this.supabaseSignaling;
  }

  /**
   * Starts an outgoing 1-to-1 audio or video call (Caller flow).
   */
  public async startCall(callType: CallType = "audio"): Promise<void> {
    const state = this.stateMachine.getState();
    if (state !== CallState.IDLE) {
      throw new Error("Cannot initiate call while another call session is active.");
    }

    const pairedPartner = await getPairedPartner();
    if (!pairedPartner) {
      throw new Error("No paired partner device found. Call rejected.");
    }

    this.options.callType = callType;
    this.dispatchEvent(CallEvent.START_CALL);
    this.startInitiationTimeout();

    try {
      // 1. Setup ICE Configuration with STUN/TURN
      const rtcConfig = buildRtcConfiguration(this.options.rtcConfig?.iceServers);

      // 2. Initialize PeerConnectionManager
      this.pcManager = new PeerConnectionManager(rtcConfig, this.options.audioSettings);

      // 3. Acquire Media Stream (Mic/Camera requested ONLY upon startCall)
      await this.pcManager.initializePeerConnection(
        callType,
        (candidatePayload: { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null }) => {
          if (this.supabaseSignaling) {
            this.supabaseSignaling.sendIceCandidate(this.options.sessionId, {
              candidate: candidatePayload.candidate,
              sdpMid: candidatePayload.sdpMid,
              sdpMLineIndex: candidatePayload.sdpMLineIndex,
            });
          }
        },
        (remoteStream: MediaStream) => {
          this.handleRemoteStreamArrived(remoteStream);
        },
        (connectionState: RTCPeerConnectionState) => {
          this.handleRtcStateChange(connectionState);
        }
      );

      const localStream = this.pcManager.getLocalStream();
      if (localStream && this.events.onLocalStream) {
        this.events.onLocalStream(localStream);
      }

      // 4. Setup Supabase Realtime Signaling
      await this.setupSupabaseSignaling();

      // 5. Create SDP Offer & Send via Supabase Realtime
      const offerSdp = await this.pcManager.createOffer(callType);
      if (this.supabaseSignaling) {
        await this.supabaseSignaling.sendSdpOffer(this.options.sessionId, offerSdp, callType);
        await this.supabaseSignaling.sendCallInvite(this.options.sessionId, callType);
      }

      // Trigger Web Push notification if partner device is backgrounded
      if (pairedPartner && (pairedPartner as any).id) {
        pushManager.sendIncomingCallPush(
          (pairedPartner as any).id,
          this.options.sessionId,
          callType,
          this.options.partnerIdentity?.fingerprint || "Partner"
        ).catch(() => {});
      }

      this.clearInitiationTimeout();
      this.dispatchEvent(CallEvent.OFFER_SENT);
      this.startRingingTimeout();
      ringtoneManager.playOutgoingRingtone();
    } catch (err: any) {
      this.handleFailure(err.message || `Failed to initiate ${callType} call.`);
    }
  }

  /**
   * Subscribes to incoming call signaling invitations (Receiver listener setup).
   */
  public async listenForIncomingCall(
    onIncomingCallCallback: (invitation: IncomingCallInvitation) => void
  ): Promise<void> {
    const pairedPartner = await getPairedPartner();
    if (!pairedPartner) {
      return;
    }
    const identity = await initializeDeviceIdentity();
    if (identity) {
      this.localUserId = identity.fingerprint;
    }
    const myFingerprint = identity?.fingerprint || this.localUserId;
    const partnerFingerprint = pairedPartner.partnerPublicIdentity?.fingerprint;

    if (myFingerprint && partnerFingerprint) {
      this.coupleId = [myFingerprint, partnerFingerprint].sort().join("_");
    } else {
      this.coupleId = (pairedPartner as any).coupleId || pairedPartner.id;
    }
    if (!this.coupleId) return;

    this.supabaseSignaling = new SupabaseSignalingClient(this.coupleId, this.localUserId, {
      onCallInvite: (payload) => {
        const currentState = this.stateMachine.getState();
        if (currentState === CallState.IDLE) {
          this.incomingInvitation = {
            sessionId: payload.sessionId,
            callerIdentity: this.options.partnerIdentity,
            callType: payload.callType || "audio",
            offerSdp: payload.sdp || "",
            timestamp: payload.timestamp || Date.now(),
          };
          this.dispatchEvent(CallEvent.INCOMING_OFFER);
          this.startRingingTimeout();
          onIncomingCallCallback(this.incomingInvitation);
        }
      },
      onSdpOffer: (payload) => {
        if (this.incomingInvitation) {
          this.incomingInvitation.offerSdp = payload.sdp || "";
        }
      },
      onIceCandidate: async (payload) => {
        if (payload.candidate && this.pcManager) {
          await this.pcManager.addIceCandidate({
            candidate: payload.candidate.candidate || "",
            sdpMid: payload.candidate.sdpMid ?? null,
            sdpMLineIndex: payload.candidate.sdpMLineIndex ?? null,
          });
        }
      },
      onCallCancel: () => {
        this.clearAllTimers();
        this.endCall();
      },
      onCallEnd: () => {
        this.endCall();
      },
      onError: (err) => {
        if (this.stateMachine.getState() !== CallState.IDLE) {
          this.handleFailure(err);
        } else {
          console.warn("Background signaling connection notice while listening:", err);
        }
      },
    });

    await this.supabaseSignaling.subscribe();
  }

  /**
   * Accepts a pending incoming call invitation directly (Receiver handoff flow).
   */
  public async acceptIncomingInvitation(invitation: PendingIncomingCall): Promise<void> {
    this.incomingInvitation = {
      sessionId: invitation.sessionId,
      callerIdentity: invitation.partnerIdentity || this.options.partnerIdentity,
      callType: invitation.callType,
      offerSdp: invitation.offerSdp,
      timestamp: invitation.timestamp,
    };
    this.options.sessionId = invitation.sessionId;
    this.options.callType = invitation.callType;
    this.stateMachine.setSessionId(invitation.sessionId);

    if (this.stateMachine.getState() === CallState.IDLE) {
      this.dispatchEvent(CallEvent.INCOMING_OFFER);
    }

    await this.acceptCall();
  }

  /**
   * Accepts incoming call (Receiver explicit action).
   */
  public async acceptCall(): Promise<void> {
    const currentState = this.stateMachine.getState();
    if (
      currentState !== CallState.INCOMING_RINGING &&
      currentState !== CallState.RINGING &&
      !this.incomingInvitation
    ) {
      throw new Error("No incoming call ringing to accept.");
    }

    this.clearRingingTimeout();
    this.dispatchEvent(CallEvent.ACCEPT);
    const callType = this.incomingInvitation?.callType || this.getCallType();

    try {
      const rtcConfig = buildRtcConfiguration(this.options.rtcConfig?.iceServers);
      this.pcManager = new PeerConnectionManager(rtcConfig, this.options.audioSettings);

      await this.pcManager.initializePeerConnection(
        callType,
        (candidatePayload: { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null }) => {
          if (this.supabaseSignaling) {
            this.supabaseSignaling.sendIceCandidate(this.options.sessionId, {
              candidate: candidatePayload.candidate,
              sdpMid: candidatePayload.sdpMid,
              sdpMLineIndex: candidatePayload.sdpMLineIndex,
            });
          }
        },
        (remoteStream: MediaStream) => {
          this.handleRemoteStreamArrived(remoteStream);
        },
        (connectionState: RTCPeerConnectionState) => {
          this.handleRtcStateChange(connectionState);
        }
      );

      const localStream = this.pcManager.getLocalStream();
      if (localStream && this.events.onLocalStream) {
        this.events.onLocalStream(localStream);
      }

      if (!this.supabaseSignaling) {
        await this.setupSupabaseSignaling();
      }

      if (this.incomingInvitation?.offerSdp) {
        const answerSdp = await this.pcManager.createAnswer(this.incomingInvitation.offerSdp);
        if (this.supabaseSignaling) {
          await this.supabaseSignaling.sendCallAccept(this.options.sessionId);
          await this.supabaseSignaling.sendSdpAnswer(this.options.sessionId, answerSdp);
        }
      }

      this.dispatchEvent(CallEvent.SDP_EXCHANGE);
      this.startConnectionTimeout();
    } catch (err: any) {
      this.handleFailure(err.message || `Failed to accept incoming ${callType} call.`);
    }
  }

  /**
   * Declines incoming call.
   */
  public declineCall(): void {
    if (this.supabaseSignaling) {
      this.supabaseSignaling.sendCallDecline(this.options.sessionId).catch(() => {});
    }
    if (
      this.stateMachine.getState() === CallState.INCOMING_RINGING ||
      this.stateMachine.getState() === CallState.RINGING
    ) {
      this.dispatchEvent(CallEvent.DECLINE);
    }
    this.cleanupAndEnd();
  }

  /**
   * Cancels an outgoing call before acceptance.
   */
  public cancelCall(): void {
    if (this.supabaseSignaling) {
      this.supabaseSignaling.sendCallCancel(this.options.sessionId).catch(() => {});
    }
    const currentState = this.stateMachine.getState();
    if (
      currentState === CallState.OUTGOING_INITIATING ||
      currentState === CallState.OUTGOING_RINGING ||
      currentState === CallState.CALLING
    ) {
      this.dispatchEvent(CallEvent.CANCEL);
    }
    this.cleanupAndEnd();
  }

  private async handleRemoteAnswer(answerSdp: string): Promise<void> {
    if (!this.pcManager) return;
    try {
      this.clearRingingTimeout();
      await this.pcManager.setRemoteAnswer(answerSdp);
      this.dispatchEvent(CallEvent.SDP_EXCHANGE);
      this.startConnectionTimeout();
    } catch (err: any) {
      this.handleFailure("Failed to apply remote SDP answer.");
    }
  }

  private handleRemoteStreamArrived(stream: MediaStream): void {
    if (this.events.onRemoteStream) {
      try {
        this.events.onRemoteStream(stream);
      } catch {}
    }
  }

  private handleRtcStateChange(connectionState: RTCPeerConnectionState): void {
    if (connectionState === "connected") {
      this.clearAllTimers();
      this.dispatchEvent(CallEvent.ICE_CONNECTED);
    } else if (connectionState === "disconnected" || (connectionState as any) === "checking") {
      if (this.stateMachine.getState() === CallState.CONNECTED) {
        this.dispatchEvent(CallEvent.NETWORK_INTERRUPTED);
        this.startReconnectionTimeout();
      }
    } else if (connectionState === "failed") {
      this.handleFailure("WebRTC peer connection failed.");
    } else if (connectionState === "closed") {
      if (
        this.stateMachine.getState() === CallState.CONNECTED ||
        this.stateMachine.getState() === CallState.RECONNECTING
      ) {
        this.endCall();
      }
    }
  }

  public toggleMute(): boolean {
    if (!this.pcManager) return false;
    const isMuted = this.pcManager.setMuted(!this.pcManager.getIsMuted());
    if (this.events.onMuteChange) {
      try {
        this.events.onMuteChange(isMuted);
      } catch {}
    }
    return isMuted;
  }

  public toggleCamera(): boolean {
    if (!this.pcManager) return false;
    const isCameraOn = this.pcManager.setCameraEnabled(this.pcManager.getIsCameraOff());
    const isCameraOff = !isCameraOn;
    if (this.events.onCameraChange) {
      try {
        this.events.onCameraChange(isCameraOff);
      } catch {}
    }
    return isCameraOff;
  }

  public async toggleScreenShare(): Promise<boolean> {
    if (!this.pcManager) return false;
    if (this.pcManager.getIsScreenSharing()) {
      await this.pcManager.stopScreenShare();
      return false;
    } else {
      const stream = await this.pcManager.startScreenShare();
      if (this.events.onLocalStream) {
        this.events.onLocalStream(stream);
      }
      return true;
    }
  }

  public async switchCamera(): Promise<void> {
    if (this.pcManager) {
      await this.pcManager.switchCamera();
    }
  }

  public endCall(): void {
    const state = this.stateMachine.getState();
    if (state === CallState.IDLE || state === CallState.ENDED) return;

    if (this.supabaseSignaling) {
      this.supabaseSignaling.sendCallEnd(this.options.sessionId).catch(() => {});
    }

    if (this.stateMachine.canTransitionTo(CallState.ENDING)) {
      this.dispatchEvent(CallEvent.HANGUP);
    }
    this.cleanupAndEnd();
  }

  private handleFailure(errorMessage: string): void {
    this.clearAllTimers();
    if (this.events.onError) {
      try {
        this.events.onError(errorMessage);
      } catch {}
    }

    const state = this.stateMachine.getState();
    if (state !== CallState.IDLE && state !== CallState.ENDED) {
      try {
        this.dispatchEvent(CallEvent.ERROR);
      } catch {}
    }
    this.cleanupAndEnd();
  }

  // --- Session Timers ---

  private startInitiationTimeout(): void {
    this.clearInitiationTimeout();
    this.initiationTimeoutTimer = setTimeout(() => {
      if (this.stateMachine.getState() === CallState.OUTGOING_INITIATING) {
        this.handleTimeout("Call initiation timed out.");
      }
    }, this.INITIATION_TIMEOUT_MS);
  }

  private clearInitiationTimeout(): void {
    if (this.initiationTimeoutTimer) {
      clearTimeout(this.initiationTimeoutTimer);
      this.initiationTimeoutTimer = null;
    }
  }

  private startRingingTimeout(): void {
    this.clearRingingTimeout();
    this.ringingTimeoutTimer = setTimeout(() => {
      const state = this.stateMachine.getState();
      if (
        state === CallState.OUTGOING_RINGING ||
        state === CallState.INCOMING_RINGING ||
        state === CallState.CALLING ||
        state === CallState.RINGING
      ) {
        this.handleTimeout("Call offer timed out with no response.");
      }
    }, this.RINGING_TIMEOUT_MS);
  }

  private clearRingingTimeout(): void {
    if (this.ringingTimeoutTimer) {
      clearTimeout(this.ringingTimeoutTimer);
      this.ringingTimeoutTimer = null;
    }
  }

  private startConnectionTimeout(): void {
    this.clearConnectionTimeout();
    this.connectionTimeoutTimer = setTimeout(() => {
      const state = this.stateMachine.getState();
      if (
        state === CallState.ACCEPTING ||
        state === CallState.NEGOTIATING ||
        state === CallState.CONNECTING
      ) {
        this.handleTimeout("WebRTC connection setup timed out.");
      }
    }, this.CONNECTION_TIMEOUT_MS);
  }

  private clearConnectionTimeout(): void {
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }
  }

  private startReconnectionTimeout(): void {
    this.clearReconnectionTimeout();
    this.reconnectionTimeoutTimer = setTimeout(() => {
      if (this.stateMachine.getState() === CallState.RECONNECTING) {
        this.handleFailure("WebRTC reconnection timed out after network interruption.");
      }
    }, this.RECONNECTION_TIMEOUT_MS);
  }

  private clearReconnectionTimeout(): void {
    if (this.reconnectionTimeoutTimer) {
      clearTimeout(this.reconnectionTimeoutTimer);
      this.reconnectionTimeoutTimer = null;
    }
  }

  private clearAllTimers(): void {
    this.clearInitiationTimeout();
    this.clearRingingTimeout();
    this.clearConnectionTimeout();
    this.clearReconnectionTimeout();
  }

  private handleTimeout(reason: string): void {
    this.clearAllTimers();
    if (this.events.onError) {
      try {
        this.events.onError(reason);
      } catch {}
    }
    try {
      this.dispatchEvent(CallEvent.TIMEOUT);
    } catch {}
    this.cleanupAndEnd();
  }

  private cleanupAndEnd(): void {
    this.clearAllTimers();
    ringtoneManager.stopAll();

    if (this.pcManager) {
      const pc = this.pcManager.getPeerConnection();
      const localStream = this.pcManager.getLocalStream();
      const remoteStream = this.pcManager.getRemoteStream();

      cleanupCallSession({
        pc,
        localStream,
        remoteStream,
        stateMachine: this.stateMachine,
        timers: [
          this.initiationTimeoutTimer,
          this.ringingTimeoutTimer,
          this.connectionTimeoutTimer,
          this.reconnectionTimeoutTimer,
        ],
        sessionRef: { currentSessionId: this.options.sessionId },
      });

      this.pcManager.cleanup();
      this.pcManager = null;
    }

    if (this.supabaseSignaling) {
      this.supabaseSignaling.unsubscribe().catch(() => {});
      this.supabaseSignaling = null;
    }

    this.incomingInvitation = null;

    const state = this.stateMachine.getState();
    if (
      state === CallState.ENDING ||
      state === CallState.CONNECTED ||
      state === CallState.CONNECTING ||
      state === CallState.RECONNECTING ||
      state === CallState.NEGOTIATING ||
      state === CallState.ACCEPTING ||
      state === CallState.OUTGOING_RINGING ||
      state === CallState.INCOMING_RINGING ||
      state === CallState.CALLING ||
      state === CallState.RINGING
    ) {
      try {
        this.setState(CallState.ENDING);
        this.setState(CallState.ENDED);
      } catch {}
    } else if (
      state === CallState.FAILED ||
      state === CallState.TIMED_OUT ||
      state === CallState.REJECTED ||
      state === CallState.CANCELLED
    ) {
      try {
        this.setState(CallState.ENDED);
      } catch {}
    }

    this.stateMachine.reset();
  }
}
