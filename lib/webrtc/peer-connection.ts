import { AudioCallSettings, CallType } from "./types";
import { IceCandidatePayload } from "../../server/signaling/types";

export class PeerConnectionManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private gatheredLocalCandidates: IceCandidatePayload[] = [];
  private isRemoteDescriptionSet = false;
  private isMuted = false;
  private isCameraOff = false;
  private currentFacingMode: "user" | "environment" = "user";

  constructor(
    private rtcConfig: RTCConfiguration = {},
    private audioSettings: AudioCallSettings = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    }
  ) {}

  public getPeerConnection(): RTCPeerConnection | null {
    return this.pc;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  public getGatheredLocalCandidates(): IceCandidatePayload[] {
    return [...this.gatheredLocalCandidates];
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsCameraOff(): boolean {
    return this.isCameraOff;
  }

  /**
   * Alias for acquireMediaStream("audio") to maintain Phase 13 backwards compatibility.
   */
  public async acquireMicrophoneStream(): Promise<MediaStream> {
    return this.acquireMediaStream("audio");
  }

  /**
   * Requests media stream access ONLY when user explicitly starts or accepts a call.
   * If `callType === "audio"`: strict `video: false` invariant is enforced.
   * If `callType === "video"`: audio + video stream is requested.
   */
  public async acquireMediaStream(callType: CallType = "audio"): Promise<MediaStream> {
    if (this.localStream) return this.localStream;

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      throw new Error("MediaDevices API (navigator.mediaDevices.getUserMedia) is unavailable.");
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: this.audioSettings.echoCancellation ?? true,
          noiseSuppression: this.audioSettings.noiseSuppression ?? true,
          autoGainControl: this.audioSettings.autoGainControl ?? true,
        },
        video:
          callType === "video"
            ? { facingMode: this.currentFacingMode }
            : false, // MANDATORY SAFETY INVARIANT FOR AUDIO CALLS
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      return stream;
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        throw new Error(
          callType === "video"
            ? "Camera and/or microphone permission denied by user or browser policy."
            : "Microphone permission denied by user or browser policy."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        throw new Error(
          callType === "video"
            ? "No camera or microphone device found on this system."
            : "No microphone device found on this system."
        );
      } else {
        throw new Error(`Failed to acquire media stream: ${err.message || err.name}`);
      }
    }
  }

  /**
   * Initializes single RTCPeerConnection instance and binds local audio/video tracks.
   * Backwards compatible with both (callType, onIce, onRemote, onState) and (onIce, onRemote, onState).
   */
  public async initializePeerConnection(
    callTypeOrOnIce: CallType | ((candidate: IceCandidatePayload) => void),
    onIceOrRemote?: any,
    onRemoteOrState?: any,
    onStateCallback?: (state: RTCPeerConnectionState) => void
  ): Promise<RTCPeerConnection> {
    let callType: CallType = "audio";
    let onIceCandidateCallback: (candidate: IceCandidatePayload) => void;
    let onRemoteStreamCallback: (stream: MediaStream) => void;
    let onConnectionStateCallback: ((state: RTCPeerConnectionState) => void) | undefined = onStateCallback;

    if (typeof callTypeOrOnIce === "string") {
      callType = callTypeOrOnIce;
      onIceCandidateCallback = onIceOrRemote;
      onRemoteStreamCallback = onRemoteOrState;
    } else {
      callType = "audio";
      onIceCandidateCallback = callTypeOrOnIce;
      onRemoteStreamCallback = onIceOrRemote;
      onConnectionStateCallback = onRemoteOrState;
    }

    const stream = await this.acquireMediaStream(callType);

    const RTCPeerConnectionImpl =
      typeof globalThis !== "undefined" && globalThis.RTCPeerConnection
        ? globalThis.RTCPeerConnection
        : typeof window !== "undefined" && window.RTCPeerConnection
        ? window.RTCPeerConnection
        : null;

    if (!RTCPeerConnectionImpl) {
      throw new Error("RTCPeerConnection is not supported in this environment.");
    }

    this.pc = new RTCPeerConnectionImpl(this.rtcConfig);
    this.gatheredLocalCandidates = [];

    // Add local media tracks (audio + video) to the single peer connection
    stream.getTracks().forEach((track) => {
      if (this.pc) {
        this.pc.addTrack(track, stream);
      }
    });

    // Handle ICE candidates
    this.pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        const payload: IceCandidatePayload = {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
        };
        this.gatheredLocalCandidates.push(payload);
        onIceCandidateCallback(payload);
      }
    };

    // Handle remote media track arrival with fresh MediaStream instances for React re-render detection
    this.pc.ontrack = (event: RTCTrackEvent) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else {
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream([event.track]);
        } else {
          this.remoteStream.addTrack(event.track);
        }
      }
      if (this.remoteStream) {
        const freshStream = new MediaStream(this.remoteStream.getTracks());
        onRemoteStreamCallback(freshStream);
      }
    };

    // Connection & ICE state monitoring for cross-platform mobile compatibility
    if (onConnectionStateCallback) {
      const updateState = () => {
        if (!this.pc) return;
        const connState = this.pc.connectionState;
        const iceState = this.pc.iceConnectionState;

        if (connState === "connected" || iceState === "connected" || iceState === "completed") {
          onConnectionStateCallback("connected");
        } else if (connState === "failed" || iceState === "failed") {
          onConnectionStateCallback("failed");
        } else if (connState === "disconnected" || iceState === "disconnected") {
          onConnectionStateCallback("disconnected");
        } else if (connState === "connecting" || iceState === "checking") {
          onConnectionStateCallback("connecting" as any);
        }
      };

      this.pc.onconnectionstatechange = updateState;
      this.pc.oniceconnectionstatechange = updateState;
    }

    return this.pc;
  }

  /**
   * Generates SDP Offer (Caller flow).
   */
  public async createOffer(callType: CallType = "audio"): Promise<string> {
    if (!this.pc) throw new Error("RTCPeerConnection not initialized.");

    const offerOptions: RTCOfferOptions = {
      offerToReceiveAudio: true,
      offerToReceiveVideo: callType === "video",
    };

    const offer = await this.pc.createOffer(offerOptions);
    await this.pc.setLocalDescription(offer);

    if (!this.pc.localDescription?.sdp) {
      throw new Error("Failed to generate valid local SDP offer description.");
    }

    return this.pc.localDescription.sdp;
  }

  /**
   * Generates SDP Answer (Receiver flow).
   */
  public async createAnswer(remoteOfferSdp: string): Promise<string> {
    if (!this.pc) throw new Error("RTCPeerConnection not initialized.");

    await this.setRemoteOffer(remoteOfferSdp);

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    if (!this.pc.localDescription?.sdp) {
      throw new Error("Failed to generate valid local SDP answer description.");
    }

    return this.pc.localDescription.sdp;
  }

  /**
   * Applies remote SDP offer description.
   */
  public async setRemoteOffer(sdp: string): Promise<void> {
    if (!this.pc) throw new Error("RTCPeerConnection not initialized.");
    if (!sdp || typeof sdp !== "string") {
      throw new Error("Invalid remote SDP offer payload received.");
    }

    const sessionDesc: RTCSessionDescriptionInit = { type: "offer", sdp };
    await this.pc.setRemoteDescription(sessionDesc);
    this.isRemoteDescriptionSet = true;
    await this.flushPendingIceCandidates();
  }

  /**
   * Applies remote SDP answer description.
   */
  public async setRemoteAnswer(sdp: string): Promise<void> {
    if (!this.pc) throw new Error("RTCPeerConnection not initialized.");
    if (!sdp || typeof sdp !== "string") {
      throw new Error("Invalid remote SDP answer payload received.");
    }

    const sessionDesc: RTCSessionDescriptionInit = { type: "answer", sdp };
    await this.pc.setRemoteDescription(sessionDesc);
    this.isRemoteDescriptionSet = true;
    await this.flushPendingIceCandidates();
  }

  /**
   * Integrates received remote ICE candidate into active connection or candidate queue.
   */
  public async addIceCandidate(candidatePayload: IceCandidatePayload): Promise<void> {
    if (!candidatePayload || !candidatePayload.candidate) return;

    const candidateInit: RTCIceCandidateInit = {
      candidate: candidatePayload.candidate,
      sdpMid: candidatePayload.sdpMid,
      sdpMLineIndex: candidatePayload.sdpMLineIndex,
    };

    if (this.pc && this.isRemoteDescriptionSet) {
      try {
        await this.pc.addIceCandidate(candidateInit);
      } catch (err) {
        // Safe rejection for transient candidate errors
      }
    } else {
      this.pendingIceCandidates.push(candidateInit);
    }
  }

  private async flushPendingIceCandidates(): Promise<void> {
    if (!this.pc || !this.isRemoteDescriptionSet) return;

    while (this.pendingIceCandidates.length > 0) {
      const candidate = this.pendingIceCandidates.shift();
      if (candidate) {
        try {
          await this.pc.addIceCandidate(candidate);
        } catch {}
      }
    }
  }

  /**
   * Toggles local microphone mute state.
   */
  public setMuted(muted: boolean): boolean {
    this.isMuted = muted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
    return this.isMuted;
  }

  /**
   * Toggles local camera enable/disable state.
   */
  public setCameraEnabled(enabled: boolean): boolean {
    this.isCameraOff = !enabled;
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
    return !this.isCameraOff;
  }

  /**
   * Switches between front and rear cameras (if supported).
   */
  public async switchCamera(): Promise<void> {
    if (!this.localStream || !this.pc) return;

    const oldVideoTrack = this.localStream.getVideoTracks()[0];
    if (!oldVideoTrack) return;

    this.currentFacingMode = this.currentFacingMode === "user" ? "environment" : "user";

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.currentFacingMode },
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return;

      // Find RTCRtpSender for video
      const senders = this.pc.getSenders();
      const videoSender = senders.find((s) => s.track?.kind === "video");
      if (videoSender && typeof videoSender.replaceTrack === "function") {
        await videoSender.replaceTrack(newVideoTrack);
      }

      // Replace track in localStream
      this.localStream.removeTrack(oldVideoTrack);
      oldVideoTrack.stop();
      this.localStream.addTrack(newVideoTrack);
    } catch {}
  }

  private screenStream: MediaStream | null = null;
  private isScreenSharing = false;

  public getIsScreenSharing(): boolean {
    return this.isScreenSharing;
  }

  /**
   * Starts real screen sharing via navigator.mediaDevices.getDisplayMedia().
   * Replaces video sender track with the screen track via replaceTrack().
   */
  public async startScreenShare(): Promise<MediaStream> {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getDisplayMedia
    ) {
      throw new Error("Screen sharing (getDisplayMedia) is not supported in this browser.");
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) {
        throw new Error("No video track found in screen share stream.");
      }

      this.screenStream = displayStream;
      this.isScreenSharing = true;

      // Replace video sender track if RTCPeerConnection exists
      if (this.pc) {
        const senders = this.pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");
        if (videoSender && typeof videoSender.replaceTrack === "function") {
          await videoSender.replaceTrack(screenTrack);
        }
      }

      // Handle user stopping screen share externally via browser UI
      screenTrack.onended = () => {
        this.stopScreenShare().catch(() => {});
      };

      return displayStream;
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        throw new Error("Screen sharing permission was denied.");
      }
      throw new Error(`Failed to start screen sharing: ${err.message || err.name}`);
    }
  }

  /**
   * Stops screen sharing and restores camera video track.
   */
  public async stopScreenShare(): Promise<void> {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.screenStream = null;
    }

    this.isScreenSharing = false;

    // Restore camera video track on peer connection
    if (this.pc && this.localStream) {
      const cameraTrack = this.localStream.getVideoTracks()[0];
      if (cameraTrack) {
        const senders = this.pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");
        if (videoSender && typeof videoSender.replaceTrack === "function") {
          await videoSender.replaceTrack(cameraTrack);
        }
      }
    }
  }

  /**
   * Completely closes PeerConnection, stops microphone and camera hardware tracks, and clears state.
   */
  public cleanup(): void {
    // 0. Stop screen sharing if active
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.screenStream = null;
    }
    this.isScreenSharing = false;

    // 1. Stop all local microphone & camera tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.localStream = null;
    }

    // 2. Clear remote stream tracks & reference
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.remoteStream = null;
    }

    // 3. Close RTCPeerConnection
    if (this.pc) {
      this.pc.onicecandidate = null;
      this.pc.ontrack = null;
      this.pc.onconnectionstatechange = null;
      try {
        this.pc.close();
      } catch {}
      this.pc = null;
    }

    // 4. Reset memory flags & candidate queue
    this.pendingIceCandidates = [];
    this.isRemoteDescriptionSet = false;
    this.isMuted = false;
    this.isCameraOff = false;
  }
}

