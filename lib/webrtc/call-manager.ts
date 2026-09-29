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
import { wakeLockManager } from "./wakelock-manager";
import { callSessionStore } from "./call-session-store";

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
  private bufferedIceCandidates: RTCIceCandidateInit[] = [];
  private bufferedSdpOffer: string = "";

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

  public getFacingMode(): "user" | "environment" {
    return this.pcManager ? this.pcManager.getFacingMode() : "user";
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
      callSessionStore.notifyListeners();
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
      callSessionStore.notifyListeners();
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

  private async initializeIdentityAndCoupleId(): Promise<void> {
    const pairedPartner = await getPairedPartner();
    const identity = await initializeDeviceIdentity();
    if (identity?.fingerprint) {
      this.localUserId = identity.fingerprint;
    }
    const myFingerprint = identity?.fingerprint || this.localUserId;
    const partnerFingerprint =
      pairedPartner?.partnerPublicIdentity?.fingerprint ||
      this.options.partnerIdentity?.fingerprint;

    const storedCoupleId = (pairedPartner as any)?.coupleId;
    if (storedCoupleId) {
      this.coupleId = storedCoupleId;
    } else if (
      myFingerprint &&
      partnerFingerprint &&
      myFingerprint !== "local-user" &&
      partnerFingerprint !== "partner_device_fingerprint" &&
      partnerFingerprint !== "initiator_partner_device"
    ) {
      this.coupleId = [myFingerprint, partnerFingerprint].sort().join("_");
    } else if (pairedPartner) {
      this.coupleId = (pairedPartner as any).coupleId || pairedPartner.id || "partner_trust";
    }
  }

  /**
   * Initializes Supabase Realtime Signaling Client for this call session.
   */
  private async setupSupabaseSignaling(): Promise<SupabaseSignalingClient> {
    await this.initializeIdentityAndCoupleId();

    this.supabaseSignaling = new SupabaseSignalingClient(this.coupleId, this.localUserId, {
      onCallInvite: (payload: SupabaseSignalingPayload) => {
        if (this.stateMachine.getState() === CallState.IDLE) {
          const offerSdp = payload.sdp || this.bufferedSdpOffer || "";
          this.incomingInvitation = {
            sessionId: payload.sessionId,
            callerIdentity: this.options.partnerIdentity,
            callType: payload.callType || "audio",
            offerSdp: offerSdp,
            timestamp: payload.timestamp || Date.now(),
          };
          this.dispatchEvent(CallEvent.INCOMING_OFFER);
          this.startRingingTimeout();
          ringtoneManager.playIncomingRingtone();
        }
      },
      onCallAccept: (payload) => {
        if (payload.sessionId && payload.sessionId !== this.options.sessionId) return;
        this.clearRingingTimeout();
        ringtoneManager.stopAll();
      },
      onCallDecline: () => {
        this.clearAllTimers();
        ringtoneManager.stopAll();
        this.endCall();
      },
      onCallCancel: () => {
        this.clearAllTimers();
        ringtoneManager.stopAll();
        this.endCall();
      },
      onSdpOffer: async (payload) => {
        if (payload.sessionId && payload.sessionId !== this.options.sessionId) return;
        if (payload.sdp) {
          this.bufferedSdpOffer = payload.sdp;
          if (this.incomingInvitation) {
            this.incomingInvitation.offerSdp = payload.sdp;
          }
          if (this.pcManager) {
            await this.pcManager.setRemoteOffer(payload.sdp);
          }
        }
      },
      onSdpAnswer: async (payload) => {
        if (payload.sessionId && payload.sessionId !== this.options.sessionId) return;
        if (payload.sdp && this.pcManager) {
          await this.handleRemoteAnswer(payload.sdp);
        }
      },
      onIceCandidate: async (payload) => {
        if (payload.sessionId && payload.sessionId !== this.options.sessionId) return;
        if (payload.candidate) {
          const candidateInit = {
            candidate: payload.candidate.candidate || "",
            sdpMid: payload.candidate.sdpMid ?? null,
            sdpMLineIndex: payload.candidate.sdpMLineIndex ?? null,
          };
          if (this.pcManager) {
            await this.pcManager.addIceCandidate(candidateInit);
          } else {
            this.bufferedIceCandidates.push(candidateInit);
          }
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
    callSessionStore.setActiveSession(this);
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
        await this.supabaseSignaling.sendCallInvite(this.options.sessionId, callType, offerSdp);
      }

      // Trigger Web Push notification if partner device is backgrounded
      const partnerDeviceId = pairedPartner?.partnerPublicIdentity?.fingerprint;
      if (partnerDeviceId) {
        pushManager.sendIncomingCallPush(
          partnerDeviceId,
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
    await this.initializeIdentityAndCoupleId();
    if (!this.coupleId) return;

    this.supabaseSignaling = new SupabaseSignalingClient(this.coupleId, this.localUserId, {
      onCallInvite: (payload) => {
        const currentState = this.stateMachine.getState();
        if (currentState === CallState.IDLE) {
          const offerSdp = payload.sdp || this.bufferedSdpOffer || "";
          this.incomingInvitation = {
            sessionId: payload.sessionId,
            callerIdentity: this.options.partnerIdentity,
            callType: payload.callType || "audio",
            offerSdp: offerSdp,
            timestamp: payload.timestamp || Date.now(),
          };
          this.dispatchEvent(CallEvent.INCOMING_OFFER);
          this.startRingingTimeout();
          ringtoneManager.playIncomingRingtone();
          onIncomingCallCallback(this.incomingInvitation);
        }
      },
      onSdpOffer: (payload) => {
        if (payload.sdp) {
          this.bufferedSdpOffer = payload.sdp;
          if (this.incomingInvitation) {
            this.incomingInvitation.offerSdp = payload.sdp;
          }
        }
      },
      onIceCandidate: async (payload) => {
        if (payload.candidate) {
          const candidateInit = {
            candidate: payload.candidate.candidate || "",
            sdpMid: payload.candidate.sdpMid ?? null,
            sdpMLineIndex: payload.candidate.sdpMLineIndex ?? null,
          };
          if (this.pcManager) {
            await this.pcManager.addIceCandidate(candidateInit);
          } else {
            this.bufferedIceCandidates.push(candidateInit);
          }
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
    callSessionStore.setActiveSession(this);
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

      const offerSdp = this.incomingInvitation?.offerSdp || this.bufferedSdpOffer;
      if (offerSdp) {
        const answerSdp = await this.pcManager.createAnswer(offerSdp);
        if (this.supabaseSignaling) {
          await this.supabaseSignaling.sendCallAccept(this.options.sessionId);
          await this.supabaseSignaling.sendSdpAnswer(this.options.sessionId, answerSdp);
        }
      } else {
        if (this.supabaseSignaling) {
          await this.supabaseSignaling.sendCallAccept(this.options.sessionId);
        }
      }

      // Flush buffered remote ICE candidates after remote offer description is set
      while (this.bufferedIceCandidates.length > 0) {
        const candidate = this.bufferedIceCandidates.shift();
        if (candidate && candidate.candidate) {
          await this.pcManager.addIceCandidate({
            candidate: candidate.candidate,
            sdpMid: candidate.sdpMid ?? null,
            sdpMLineIndex: candidate.sdpMLineIndex ?? null,
          });
        }
      }

      // Re-transmit gathered local ICE candidates to guarantee peer connection
      if (this.pcManager && this.supabaseSignaling) {
        const localCandidates = this.pcManager.getGatheredLocalCandidates();
        for (const candidatePayload of localCandidates) {
          this.supabaseSignaling.sendIceCandidate(this.options.sessionId, candidatePayload);
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
  public async declineCall(): Promise<void> {
    if (this.supabaseSignaling) {
      try {
        await this.supabaseSignaling.sendCallDecline(this.options.sessionId);
      } catch {}
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
  public async cancelCall(): Promise<void> {
    if (this.supabaseSignaling) {
      try {
        await this.supabaseSignaling.sendCallCancel(this.options.sessionId);
      } catch {}
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

      // Re-transmit gathered local ICE candidates upon receiving remote answer
      if (this.supabaseSignaling) {
        const localCandidates = this.pcManager.getGatheredLocalCandidates();
        for (const candidatePayload of localCandidates) {
          this.supabaseSignaling.sendIceCandidate(this.options.sessionId, candidatePayload);
        }
      }

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
      wakeLockManager.acquire().catch(() => {});
    } else if (connectionState === "disconnected" || (connectionState as any) === "checking") {
      if (this.stateMachine.getState() === CallState.CONNECTED) {
        this.dispatchEvent(CallEvent.NETWORK_INTERRUPTED);
        this.startReconnectionTimeout();
        this.attemptIceRestart();
      }
    } else if (connectionState === "failed") {
      if (
        this.stateMachine.getState() === CallState.CONNECTED ||
        this.stateMachine.getState() === CallState.RECONNECTING
      ) {
        this.attemptIceRestart();
      } else {
        this.handleFailure("WebRTC peer connection failed.");
      }
    } else if (connectionState === "closed") {
      if (
        this.stateMachine.getState() === CallState.CONNECTED ||
        this.stateMachine.getState() === CallState.RECONNECTING
      ) {
        this.endCall();
      }
    }
  }

  public async attemptIceRestart(): Promise<void> {
    if (!this.pcManager || !this.supabaseSignaling) return;
    try {
      const restartOffer = await this.pcManager.restartIce(this.getCallType());
      await this.supabaseSignaling.sendSdpOffer(this.options.sessionId, restartOffer, this.getCallType());
    } catch (err) {
      console.warn("ICE restart negotiation notice:", err);
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

  public async switchCamera(): Promise<MediaStream | null> {
    if (this.pcManager) {
      const updatedStream = await this.pcManager.switchCamera();
      if (updatedStream && this.events.onLocalStream) {
        this.events.onLocalStream(updatedStream);
      }
      return updatedStream;
    }
    return null;
  }

  public stopListener(): void {
    ringtoneManager.stopAll();
    if (this.supabaseSignaling) {
      this.supabaseSignaling.unsubscribe().catch(() => {});
      this.supabaseSignaling = null;
    }
  }

  public async endCall(): Promise<void> {
    const state = this.stateMachine.getState();
    if (state === CallState.ENDED) return;

    if (this.supabaseSignaling) {
      try {
        await this.supabaseSignaling.sendCallEnd(this.options.sessionId);
      } catch {}
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
    wakeLockManager.release().catch(() => {});
    callSessionStore.clearActiveSession();

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
