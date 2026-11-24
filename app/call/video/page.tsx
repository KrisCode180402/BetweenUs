"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CallScreen } from "@/components/between-us/CallScreen";
import { ErrorState } from "@/components/between-us/ErrorState";
import { ConnectionCallState } from "@/components/between-us/ConnectionStatus";
import { AudioCallManager, getPendingIncomingCall, clearPendingIncomingCall } from "@/lib/webrtc/call-manager";
import { callSessionStore } from "@/lib/webrtc/call-session-store";
import { CallState } from "@/lib/webrtc/types";
import { privacyModeManager } from "@/lib/privacy/privacy-mode";
import { loadPairedPartner } from "@/lib/pairing/partner-store";

export default function VideoCallPage() {
  const router = useRouter();
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [partnerName, setPartnerName] = useState<string>("Partner");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const callManagerRef = useRef<AudioCallManager | null>(null);

  const attachEventsToManager = useCallback((manager: AudioCallManager) => {
    setCallState(manager.getState());
    setLocalStream(manager.getLocalStream());
    setRemoteStream(manager.getRemoteStream());
    setIsMuted(manager.getIsMuted());
    setIsVideoOff(manager.getIsCameraOff());

    // We override events to sync component state
    (manager as any).events = {
      ...(manager as any).events,
      onCallStateChange: (state: CallState) => {
        setCallState(state);
        if (
          state === CallState.ENDED ||
          state === CallState.CANCELLED ||
          state === CallState.REJECTED ||
          state === CallState.TIMED_OUT ||
          state === CallState.FAILED
        ) {
          if (typeof window !== "undefined") {
            window.location.href = "/home";
          }
        }
      },
      onLocalStream: (stream: MediaStream) => setLocalStream(stream),
      onRemoteStream: (stream: MediaStream) => setRemoteStream(stream),
      onMuteChange: (muted: boolean) => setIsMuted(muted),
      onCameraChange: (cameraOff: boolean) => setIsVideoOff(cameraOff),
      onError: (err: string) => {
        if (
          err &&
          !err.includes("Connection closed") &&
          !err.includes("WebSocket") &&
          !err.includes("CHANNEL_ERROR")
        ) {
          setErrorMessage(err);
        }
      },
    };
  }, []);

  const initializeCallManager = useCallback((partnerIdentity: any) => {
    if (!callManagerRef.current) {
      callManagerRef.current = new AudioCallManager(
        {
          serverUrl:
            process.env.NEXT_PUBLIC_SIGNALING_URL ||
            process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL ||
            "wss://signaling.betweenus.app",
          sessionId: `video_call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          callType: "video",
          partnerIdentity: partnerIdentity || {
            fingerprint: "partner_device_fingerprint",
            spkiHex: "partner_spki_hex",
            algorithm: "ECDSA-P256",
            createdAt: Date.now(),
          },
        },
        {}
      );
      callSessionStore.setActiveSession(callManagerRef.current);
    }
    attachEventsToManager(callManagerRef.current);
    return callManagerRef.current;
  }, [attachEventsToManager]);

  useEffect(() => {
    async function startVideoCallSession() {
      privacyModeManager.reset();
      try {
        const partner = await loadPairedPartner();
        if (!partner) {
          router.push("/pairing");
          return;
        }

        const name =
          (partner as any).partnerName ||
          partner.partnerPublicIdentity?.fingerprint?.substring(0, 6) ||
          "Partner";
        setPartnerName(name);

        // Check if global active call session already exists (e.g. user minimized and returned)
        const activeSession = callSessionStore.getActiveSession();
        if (activeSession && activeSession.getCallType() === "video") {
          callManagerRef.current = activeSession;
          attachEventsToManager(activeSession);
          setIsInitializing(false);
          return;
        }

        const manager = initializeCallManager(partner.partnerPublicIdentity);
        setIsInitializing(false);

        const searchParams = new URLSearchParams(window.location.search);
        const isAutoAnswer = searchParams.get("autoAnswer") === "true";
        const pendingCall = getPendingIncomingCall();

        if (pendingCall && (isAutoAnswer || pendingCall.callType === "video")) {
          await manager.acceptIncomingInvitation(pendingCall);
          clearPendingIncomingCall();
        } else if (isAutoAnswer) {
          await manager.listenForIncomingCall(async () => {
            await manager.acceptCall();
          });
        } else {
          await manager.startCall("video");
        }
      } catch (err: any) {
        setIsInitializing(false);
        setErrorMessage(
          err.message ||
            "Camera and microphone access is required for video calls. Please check browser permissions."
        );
      }
    }

    startVideoCallSession();

    return () => {};
  }, [attachEventsToManager, initializeCallManager, router]);

  // Global Call Session Store listener: Immediately returns home if call session terminates
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = callSessionStore.subscribe((_session, state) => {
      if (!isMounted) return;
      if (
        state === CallState.ENDED ||
        state === CallState.CANCELLED ||
        state === CallState.REJECTED ||
        state === CallState.TIMED_OUT ||
        state === CallState.FAILED
      ) {
        if (typeof window !== "undefined") {
          window.location.href = "/home";
        }
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Mobile Swipe Back / Hardware Back Navigation Protection
  useEffect(() => {
    if (typeof window === "undefined") return;

    const state = callManagerRef.current?.getState();
    if (
      state === CallState.CONNECTED ||
      state === CallState.CONNECTING ||
      state === CallState.RECONNECTING ||
      state === CallState.OUTGOING_RINGING
    ) {
      window.history.pushState(null, "", window.location.href);
    }

    const handlePopState = (_e: PopStateEvent) => {
      const currentState = callManagerRef.current?.getState();
      if (
        currentState === CallState.CONNECTED ||
        currentState === CallState.CONNECTING ||
        currentState === CallState.RECONNECTING ||
        currentState === CallState.OUTGOING_RINGING
      ) {
        window.history.pushState(null, "", window.location.href);
        setShowLeaveConfirm(true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleEndCall = async () => {
    if (callManagerRef.current) {
      await callManagerRef.current.endCall();
    }
    setLocalStream(null);
    setRemoteStream(null);
    if (typeof window !== "undefined") {
      window.location.href = "/home";
    }
  };

  const handleMinimizeCall = () => {
    setShowLeaveConfirm(false);
    router.push("/home");
  };

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareError, setScreenShareError] = useState<string | null>(null);

  const handleToggleScreenShare = async () => {
    if (callManagerRef.current) {
      try {
        setScreenShareError(null);
        const isSharing = await callManagerRef.current.toggleScreenShare();
        setIsScreenSharing(isSharing);
      } catch (err: any) {
        const msg = err.message || "Screen sharing is not supported on this browser/device.";
        setScreenShareError(msg);
        setTimeout(() => setScreenShareError(null), 4000);
      }
    }
  };

  const handleToggleMute = () => {
    if (callManagerRef.current) {
      const muted = callManagerRef.current.toggleMute();
      setIsMuted(muted);
    }
  };

  const handleToggleVideo = () => {
    if (callManagerRef.current) {
      const cameraOff = callManagerRef.current.toggleCamera();
      setIsVideoOff(cameraOff);
    }
  };

  const [isFrontCamera, setIsFrontCamera] = useState(true);

  const handleSwitchCamera = async () => {
    if (callManagerRef.current) {
      const freshStream = await callManagerRef.current.switchCamera();
      if (freshStream) {
        setLocalStream(freshStream);
      }
      setIsFrontCamera(callManagerRef.current.getFacingMode() === "user");
    }
  };

  const mapCallStateToConnectionStatus = (state: CallState): ConnectionCallState | string => {
    switch (state) {
      case CallState.OUTGOING_INITIATING:
        return "Calling...";
      case CallState.OUTGOING_RINGING:
        return "Ringing...";
      case CallState.INCOMING_RINGING:
        return "Incoming video call";
      case CallState.ACCEPTING:
      case CallState.NEGOTIATING:
      case CallState.CONNECTING:
        return "Connecting...";
      case CallState.CONNECTED:
        return "Connected";
      case CallState.RECONNECTING:
        return "Reconnecting...";
      case CallState.TIMED_OUT:
        return "Call timed out";
      case CallState.REJECTED:
        return "Call declined";
      case CallState.CANCELLED:
        return "Call cancelled";
      case CallState.FAILED:
        return "Connection failed";
      case CallState.ENDING:
      case CallState.ENDED:
        return "Call ended";
      default:
        return "Connecting...";
    }
  };

  if (isInitializing) {
    return (
      <div className="w-full min-h-screen bg-[#040814] flex flex-col items-center justify-center p-6 text-center select-none font-outfit">
        <div className="w-10 h-10 rounded-full border-3 border-teal-400 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-mono text-slate-400 animate-pulse">Initializing Video Call...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <ErrorState
        title="VIDEO CALL ERROR"
        message={errorMessage}
        onRetry={() => {
          setErrorMessage(null);
          if (callManagerRef.current) {
            callManagerRef.current.startCall("video");
          }
        }}
        onReturnHome={() => router.push("/home")}
      />
    );
  }

  return (
    <>
      <CallScreen
        type="video"
        partnerName={partnerName}
        callState={mapCallStateToConnectionStatus(callState)}
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        isFrontCamera={isFrontCamera}
        screenShareNotice={screenShareError}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onSwitchCamera={handleSwitchCamera}
        onEndCall={handleEndCall}
      />

      {/* Swipe Back / Navigation Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 font-outfit animate-fade-in">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-white">Call in Progress</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Are you sure you want to leave or end your video call?
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="w-full py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-black font-semibold text-sm transition-all shadow-lg shadow-teal-500/20"
              >
                Stay in Call
              </button>
              <button
                onClick={handleMinimizeCall}
                className="w-full py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm transition-all border border-neutral-700"
              >
                Keep Active in Background
              </button>
              <button
                onClick={handleEndCall}
                className="w-full py-3 rounded-2xl bg-red-600/80 hover:bg-red-600 text-white font-semibold text-sm transition-all shadow-lg shadow-red-600/20"
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
