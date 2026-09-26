import React, { useState, useEffect, useRef } from "react";
import { SecurityStatus } from "./SecurityStatus";
import { ConnectionStatus, ConnectionCallState } from "./ConnectionStatus";
import { CallControls } from "./CallControls";
import { SafetyVerification } from "./SafetyVerification";
import { PrivacyOverlay } from "./PrivacyOverlay";
import { privacyModeManager } from "../../lib/privacy/privacy-mode";

interface CallScreenProps {
  type: "audio" | "video";
  callState: ConnectionCallState;
  partnerName?: string;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isScreenSharing?: boolean;
  onToggleMute?: () => void;
  onToggleVideo?: () => void;
  onToggleScreenShare?: () => void;
  onSwitchCamera?: () => void;
  onEmergencyExit?: () => void;
  onEndCall: () => void;
}

export const CallScreen: React.FC<CallScreenProps> = ({
  type,
  callState,
  partnerName = "Your Private Connection",
  localStream,
  remoteStream,
  isMuted = false,
  isVideoOff = type === "audio",
  isScreenSharing = false,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onSwitchCamera,
  onEmergencyExit,
  onEndCall,
}) => {
  const [localMuted, setLocalMuted] = useState(isMuted);
  const [localCameraOff, setLocalCameraOff] = useState(isVideoOff);
  const [showSafetyCheck, setShowSafetyCheck] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isPrivacyActive, setIsPrivacyActive] = useState(privacyModeManager.isActive());
  const [isBackgrounded, setIsBackgrounded] = useState(
    typeof document !== "undefined" ? document.visibilityState === "hidden" : false
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setLocalMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    setLocalCameraOff(isVideoOff);
  }, [isVideoOff]);

  useEffect(() => {
    const unsubscribe = privacyModeManager.subscribe((state) => {
      setIsPrivacyActive(state === "PRIVACY_MODE_ACTIVE");
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsBackgrounded(document.visibilityState === "hidden");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (onEmergencyExit) {
          onEmergencyExit();
        } else {
          privacyModeManager.activateEmergencyExit();
          onEndCall();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onEmergencyExit, onEndCall]);

  // Remote Audio Stream Playback
  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
      audioRef.current
        .play()
        .then(() => setAutoplayBlocked(false))
        .catch(() => {
          setAutoplayBlocked(true);
        });
    }
  }, [remoteStream]);

  // Local Video Preview
  useEffect(() => {
    if (localVideoRef.current && localStream && (type === "video" || isScreenSharing) && !localCameraOff) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, type, localCameraOff, isScreenSharing]);

  // Remote Video Stream Rendering
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && type === "video") {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, type]);

  const handleManualPlayAudio = () => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => setAutoplayBlocked(false))
        .catch(() => {});
    }
  };

  const handleMuteClick = () => {
    setLocalMuted(!localMuted);
    if (onToggleMute) {
      onToggleMute();
    }
  };

  const handleVideoClick = () => {
    setLocalCameraOff(!localCameraOff);
    if (onToggleVideo) {
      onToggleVideo();
    }
  };

  const handleTogglePrivacyMode = () => {
    if (privacyModeManager.isActive()) {
      privacyModeManager.disablePrivacyMode();
    } else {
      privacyModeManager.enablePrivacyMode();
    }
  };

  const handleEmergencyExitTrigger = () => {
    privacyModeManager.activateEmergencyExit();
    if (onEmergencyExit) {
      onEmergencyExit();
    } else {
      onEndCall();
    }
  };

  return (
    <div className="relative w-full max-w-lg min-h-[85vh] flex flex-col justify-between p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden select-none">
      {/* Privacy Mode Overlay */}
      <PrivacyOverlay
        isVisible={isPrivacyActive || isBackgrounded}
        onExitPrivacyMode={isPrivacyActive ? handleTogglePrivacyMode : undefined}
        onEmergencyExit={handleEmergencyExitTrigger}
      />

      {/* Hidden Audio Element for Remote Audio Stream */}
      <audio ref={audioRef} autoPlay playsInline className="hidden" />

      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between z-10 pt-1">
        <SecurityStatus status={isVerified ? "VERIFIED" : "UNKNOWN"} />
        <ConnectionStatus state={callState} />
      </div>

      {/* Main Stream Area */}
      <div className="w-full flex-1 flex flex-col items-center justify-center relative my-4 z-10">
        {(type === "video" || isScreenSharing) && !localCameraOff ? (
          <div className="relative w-full h-[50vh] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
            {/* Remote Video Stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Local Video Stream Preview */}
            <div className="absolute top-4 right-4 w-28 h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shadow-2xl z-20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : (
          /* Audio Call / Video Off Card */
          <div className="w-full py-12 flex flex-col items-center justify-center space-y-6 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm text-center shadow-xl">
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 border border-teal-500/40 flex items-center justify-center shadow-2xl animate-pulse">
              <svg className="w-14 h-14 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wide">{partnerName}</h2>
              <p className="text-xs font-mono text-teal-400 mt-1 uppercase tracking-wider">
                {type === "video"
                  ? "📹 CAMERA OFF (Audio Active)"
                  : localMuted
                  ? "🎙 MUTED (Microphone Off)"
                  : "🎙 MICROPHONE ACTIVE"}
              </p>
            </div>

            {/* Autoplay Policy Manual Play Banner */}
            {autoplayBlocked && (
              <div className="mx-4 p-3 rounded-xl bg-amber-950/80 border border-amber-500/50 text-center space-y-2">
                <p className="text-xs text-amber-200 font-mono">
                  Browser blocked audio playback due to autoplay restrictions.
                </p>
                <button
                  type="button"
                  onClick={handleManualPlayAudio}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer"
                >
                  🔊 Enable Audio Playback
                </button>
              </div>
            )}
          </div>
        )}

        {/* Safety Code Verification Button */}
        <button
          type="button"
          onClick={() => setShowSafetyCheck(!showSafetyCheck)}
          aria-label="Toggle Safety Verification Code"
          className="mt-4 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer shadow-md"
        >
          {showSafetyCheck ? "Hide Safety Code" : "🛡 Verify Safety Code"}
        </button>

        {showSafetyCheck && (
          <div className="mt-4 w-full">
            <SafetyVerification
              onVerified={() => setIsVerified(true)}
              onClose={() => setShowSafetyCheck(false)}
            />
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="w-full pb-2 z-10">
        <CallControls
          isMuted={localMuted}
          isVideoOff={localCameraOff}
          isScreenSharing={isScreenSharing}
          isPrivacyModeActive={isPrivacyActive}
          onToggleMute={handleMuteClick}
          onToggleVideo={handleVideoClick}
          onToggleScreenShare={onToggleScreenShare}
          onSwitchCamera={onSwitchCamera}
          onTogglePrivacyMode={handleTogglePrivacyMode}
          onEmergencyExit={handleEmergencyExitTrigger}
          onEndCall={onEndCall}
        />
      </div>
    </div>
  );
};
