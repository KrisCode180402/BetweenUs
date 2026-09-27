"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CallScreen } from "@/components/between-us/CallScreen";
import { ErrorState } from "@/components/between-us/ErrorState";
import { ConnectionCallState } from "@/components/between-us/ConnectionStatus";
import { AudioCallManager } from "@/lib/webrtc/call-manager";
import { CallState } from "@/lib/webrtc/types";
import { privacyModeManager } from "@/lib/privacy/privacy-mode";
import { loadPairedPartner } from "@/lib/pairing/partner-store";

export default function AudioCallPage() {
  const router = useRouter();
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [partnerName, setPartnerName] = useState<string>("Jona");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const callManagerRef = useRef<AudioCallManager | null>(null);

  const initializeCallManager = useCallback((partnerIdentity: any) => {
    if (!callManagerRef.current) {
      callManagerRef.current = new AudioCallManager(
        {
          serverUrl:
            process.env.NEXT_PUBLIC_SIGNALING_URL ||
            process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL ||
            "wss://signaling.betweenus.app",
          sessionId: `audio_call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          callType: "audio",
          partnerIdentity: partnerIdentity || {
            fingerprint: "partner_device_fingerprint",
            spkiHex: "partner_spki_hex",
            algorithm: "ECDSA-P256",
            createdAt: Date.now(),
          },
        },
        {
          onCallStateChange: (state) => {
            setCallState(state);
            if (
              state === CallState.ENDED ||
              state === CallState.CANCELLED ||
              state === CallState.REJECTED ||
              state === CallState.TIMED_OUT
            ) {
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
          onError: (err) => {
            if (
              err &&
              !err.includes("Connection closed") &&
              !err.includes("WebSocket") &&
              !err.includes("CHANNEL_ERROR")
            ) {
              setErrorMessage(err);
            }
          },
        }
      );
    }
    return callManagerRef.current;
  }, [router]);

  useEffect(() => {
    async function startAudioCallSession() {
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
          "Jona";
        setPartnerName(name);
        setIsInitializing(false);

        const manager = initializeCallManager(partner.partnerPublicIdentity);
        await manager.startCall("audio");
      } catch (err: any) {
        setIsInitializing(false);
        setErrorMessage(
          err.message ||
            "Microphone access is required for audio calls. Please check browser permissions."
        );
      }
    }

    startAudioCallSession();

    return () => {
      if (callManagerRef.current) {
        callManagerRef.current.endCall();
      }
    };
  }, [initializeCallManager, router]);

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

  const mapCallStateToConnectionStatus = (state: CallState): ConnectionCallState | string => {
    switch (state) {
      case CallState.OUTGOING_INITIATING:
        return "Calling...";
      case CallState.OUTGOING_RINGING:
        return "Ringing...";
      case CallState.INCOMING_RINGING:
        return "Incoming audio call";
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
        <p className="text-xs font-mono text-slate-400 animate-pulse">Initializing Audio Call...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <ErrorState
        title="AUDIO CALL ERROR"
        message={errorMessage}
        onRetry={() => {
          setErrorMessage(null);
          if (callManagerRef.current) {
            callManagerRef.current.startCall("audio");
          }
        }}
        onReturnHome={() => router.push("/home")}
      />
    );
  }

  return (
    <CallScreen
      type="audio"
      partnerName={partnerName}
      callState={mapCallStateToConnectionStatus(callState)}
      localStream={localStream}
      remoteStream={remoteStream}
      isMuted={isMuted}
      isVideoOff={true}
      onToggleMute={handleToggleMute}
      onEndCall={handleEndCall}
    />
  );
}
