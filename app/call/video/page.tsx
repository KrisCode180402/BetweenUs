"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CallScreen } from "@/components/between-us/CallScreen";
import { ErrorState } from "@/components/between-us/ErrorState";
import { ConnectionCallState } from "@/components/between-us/ConnectionStatus";
import { AudioCallManager } from "@/lib/webrtc/call-manager";
import { CallState } from "@/lib/webrtc/types";
import { privacyModeManager } from "@/lib/privacy/privacy-mode";

export default function VideoCallPage() {
  const router = useRouter();
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const callManagerRef = useRef<AudioCallManager | null>(null);

  const initializeCallManager = useCallback(() => {
    if (!callManagerRef.current) {
      callManagerRef.current = new AudioCallManager(
        {
          serverUrl: process.env.NEXT_PUBLIC_SIGNALING_URL || process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || "wss://signaling.betweenus.app",
          sessionId: `video_call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          callType: "video",
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
            if (state === CallState.ENDED || state === CallState.CANCELLED || state === CallState.REJECTED) {
              setTimeout(() => router.push("/home"), 1200);
            }
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
            if (err && !err.includes("Connection closed") && !err.includes("WebSocket") && !err.includes("CHANNEL_ERROR")) {
              setErrorMessage(err);
            }
          },
        }
      );
    }
    return callManagerRef.current;
  }, [router]);

  useEffect(() => {
    privacyModeManager.reset();
    const manager = initializeCallManager();
    manager.startCall("video").catch((err) => {
      setErrorMessage(err.message || "Failed to start video call. Please check camera and microphone permissions.");
    });

    return () => {
      if (callManagerRef.current) {
        callManagerRef.current.endCall();
      }
    };
  }, [initializeCallManager]);

  const handleEndCall = () => {
    if (callManagerRef.current) {
      callManagerRef.current.endCall();
    }
    setLocalStream(null);
    setRemoteStream(null);
    router.push("/home");
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
    <CallScreen
      type="video"
      callState={mapCallStateToConnectionStatus(callState)}
      localStream={localStream}
      remoteStream={remoteStream}
      isMuted={isMuted}
      isVideoOff={isVideoOff}
      onToggleMute={handleToggleMute}
      onToggleVideo={handleToggleVideo}
      onSwitchCamera={handleSwitchCamera}
      onEndCall={handleEndCall}
    />
  );
}
