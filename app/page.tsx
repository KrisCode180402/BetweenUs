"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { HomeScreen } from "@/components/between-us/HomeScreen";
import { CallScreen } from "@/components/between-us/CallScreen";
import { EndCallScreen } from "@/components/between-us/EndCallScreen";
import { ErrorState } from "@/components/between-us/ErrorState";
import { IncomingCallModal } from "@/components/between-us/IncomingCallModal";
import { ConnectionCallState } from "@/components/between-us/ConnectionStatus";
import { AudioCallManager } from "@/lib/webrtc/call-manager";
import { CallState, CallType, IncomingCallInvitation } from "@/lib/webrtc/types";
import { privacyModeManager } from "@/lib/privacy/privacy-mode";

export default function BetweenUsApp() {
  const [isMounted, setIsMounted] = useState(false);
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [callType, setCallType] = useState<CallType>("audio");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallInvitation | null>(null);

  const callManagerRef = useRef<AudioCallManager | null>(null);

  // Mark client hydration complete
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const initializeCallManager = useCallback(() => {
    if (!callManagerRef.current) {
      callManagerRef.current = new AudioCallManager(
        {
          serverUrl: process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || "wss://signaling.betweenus.app",
          sessionId: `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          partnerIdentity: {
            fingerprint: "partner_device_fingerprint",
            spkiHex: "partner_spki_hex",
            algorithm: "ECDSA-P256",
            createdAt: Date.now(),
          },
        },
        {
          onCallStateChange: (state) => {
            setCallState(state);
          },
          onLocalStream: (stream) => {
            setLocalStream(stream);
          },
          onRemoteStream: (stream) => {
            setRemoteStream(stream);
          },
          onMuteChange: (muted) => {
            setIsMuted(muted);
          },
          onCameraChange: (cameraOff) => {
            setIsVideoOff(cameraOff);
          },
          onError: (err) => {
            setErrorMessage(err);
          },
        }
      );
    }
    return callManagerRef.current;
  }, []);

  // Listen for incoming call invitations ONLY after client mounting
  useEffect(() => {
    if (!isMounted) return;

    try {
      const manager = initializeCallManager();
      manager.listenForIncomingCall((invitation) => {
        setIncomingCall(invitation);
      }).catch(() => {});
    } catch (err) {
      console.warn("Call manager init warning:", err);
    }

    // Clean up media tracks and peer connection on page refresh / tab close
    const handleBeforeUnload = () => {
      if (callManagerRef.current) {
        callManagerRef.current.endCall();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (callManagerRef.current) {
        callManagerRef.current.endCall();
      }
    };
  }, [isMounted, initializeCallManager]);

  const handleStartAudioCall = async () => {
    privacyModeManager.reset();
    setErrorMessage(null);
    setCallType("audio");
    setIsVideoOff(true);

    try {
      const manager = initializeCallManager();
      await manager.startCall("audio");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to start audio call. Please check microphone permissions.");
    }
  };

  const handleStartVideoCall = async () => {
    privacyModeManager.reset();
    setErrorMessage(null);
    setCallType("video");
    setIsVideoOff(false);

    try {
      const manager = initializeCallManager();
      await manager.startCall("video");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to start video call. Please check camera and microphone permissions.");
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    setIncomingCall(null);
    privacyModeManager.reset();
    setErrorMessage(null);

    try {
      const manager = initializeCallManager();
      await manager.acceptCall();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to accept incoming call.");
    }
  };

  const handleDeclineCall = () => {
    if (callManagerRef.current) {
      callManagerRef.current.declineCall();
    }
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    if (callManagerRef.current) {
      callManagerRef.current.endCall();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsScreenSharing(false);
  };

  const handleEmergencyExit = () => {
    privacyModeManager.activateEmergencyExit();
    handleEndCall();
  };

  const handleToggleMute = () => {
    if (callManagerRef.current) {
      const muted = callManagerRef.current.toggleMute();
      setIsMuted(muted);
    }
  };

  const handleToggleVideo = () => {
    if (callManagerRef.current) {
      const videoOff = callManagerRef.current.toggleCamera();
      setIsVideoOff(videoOff);
    }
  };

  const handleToggleScreenShare = async () => {
    if (callManagerRef.current) {
      try {
        const sharing = await callManagerRef.current.toggleScreenShare();
        setIsScreenSharing(sharing);
      } catch (err: any) {
        setErrorMessage(err.message || "Screen sharing failed.");
      }
    }
  };

  const handleSwitchCamera = async () => {
    if (callManagerRef.current) {
      await callManagerRef.current.switchCamera();
    }
  };

  const mapCallStateToConnectionStatus = (state: CallState): ConnectionCallState => {
    switch (state) {
      case CallState.OUTGOING_INITIATING:
      case CallState.OUTGOING_RINGING:
        return "Ringing";
      case CallState.ACCEPTING:
      case CallState.NEGOTIATING:
      case CallState.CONNECTING:
        return "Connecting";
      case CallState.CONNECTED:
        return "Connected";
      case CallState.RECONNECTING:
        return "Reconnecting";
      case CallState.ENDING:
        return "Ending";
      default:
        return "Connected";
    }
  };

  const isCallActive =
    callState === CallState.OUTGOING_INITIATING ||
    callState === CallState.OUTGOING_RINGING ||
    callState === CallState.INCOMING_RINGING ||
    callState === CallState.ACCEPTING ||
    callState === CallState.NEGOTIATING ||
    callState === CallState.CONNECTING ||
    callState === CallState.CONNECTED ||
    callState === CallState.RECONNECTING ||
    callState === CallState.ENDING;

  // Loading Shell during initial SSR hydration
  if (!isMounted) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[90vh] py-4 px-2 sm:px-4 bg-[#060B14]">
        <div className="w-full max-w-lg min-h-[92vh] mx-auto flex items-center justify-center p-8 bg-[#060B14] rounded-[2.5rem] border border-slate-800/80">
          <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[90vh] py-4 px-2 sm:px-4">
      {/* Incoming Call Overlay Modal */}
      {incomingCall && (
        <IncomingCallModal
          callerName="Your Partner"
          callType={incomingCall.callType}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}

      {/* Main UI State Routing based on actual WebRTC Call Lifecycle */}
      {errorMessage ? (
        <ErrorState
          title="CALL ERROR"
          message={errorMessage}
          onRetry={callType === "video" ? handleStartVideoCall : handleStartAudioCall}
          onReturnHome={() => {
            setErrorMessage(null);
            setCallState(CallState.IDLE);
          }}
        />
      ) : isCallActive ? (
        <CallScreen
          type={callType}
          callState={mapCallStateToConnectionStatus(callState)}
          localStream={localStream}
          remoteStream={remoteStream}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isScreenSharing={isScreenSharing}
          onToggleMute={handleToggleMute}
          onToggleVideo={handleToggleVideo}
          onToggleScreenShare={handleToggleScreenShare}
          onSwitchCamera={handleSwitchCamera}
          onEmergencyExit={handleEmergencyExit}
          onEndCall={handleEndCall}
        />
      ) : callState === CallState.ENDED || callState === CallState.CANCELLED || callState === CallState.REJECTED ? (
        <EndCallScreen
          onReturnHome={() => {
            setCallState(CallState.IDLE);
          }}
        />
      ) : (
        <HomeScreen
          onInitiateAudioCall={handleStartAudioCall}
          onInitiateVideoCall={handleStartVideoCall}
        />
      )}
    </div>
  );
}
