"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ConnectionCallState } from "./ConnectionStatus";
import { SafetyVerification } from "./SafetyVerification";
import { PrivacyOverlay } from "./PrivacyOverlay";
import { AudioVisualizer } from "./AudioVisualizer";
import { CallOptionsModal } from "./CallOptionsModal";
import { privacyModeManager } from "@/lib/privacy/privacy-mode";

interface CallScreenProps {
  type: "audio" | "video";
  callState: ConnectionCallState | string;
  partnerName?: string | undefined;
  partnerAvatarUrl?: string | undefined;
  localStream?: MediaStream | null | undefined;
  remoteStream?: MediaStream | null | undefined;
  isMuted?: boolean | undefined;
  isVideoOff?: boolean | undefined;
  isScreenSharing?: boolean | undefined;
  isFrontCamera?: boolean | undefined;
  screenShareNotice?: string | null | undefined;
  onToggleMute?: (() => void) | undefined;
  onToggleVideo?: (() => void) | undefined;
  onToggleScreenShare?: (() => void) | undefined;
  onSwitchCamera?: (() => void) | undefined;
  onEmergencyExit?: (() => void) | undefined;
  onEndCall: () => void;
}

export const CallScreen: React.FC<CallScreenProps> = ({
  type,
  callState,
  partnerName = "Jona",
  partnerAvatarUrl,
  localStream,
  remoteStream,
  isMuted = false,
  isVideoOff = type === "audio",
  isScreenSharing = false,
  screenShareNotice,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onSwitchCamera,
  onEmergencyExit: _onEmergencyExit,
  onEndCall,
}) => {
  const [localMuted, setLocalMuted] = useState(isMuted);
  const [localCameraOff, setLocalCameraOff] = useState(isVideoOff);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showSafetyCheck, setShowSafetyCheck] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isStreamSwapped, setIsStreamSwapped] = useState(false);
  const [isPrivacyActive, setIsPrivacyActive] = useState(privacyModeManager.isActive());
  const [isBackgrounded, setIsBackgrounded] = useState(
    typeof document !== "undefined" ? document.visibilityState === "hidden" : false
  );

  // Draggable PiP Window State
  const [pipPos, setPipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });
  const dragDistanceRef = useRef(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);

  const isConnected = callState === "Connected";

  // Call duration counter — Starts ONLY when WebRTC is connected!
  useEffect(() => {
    if (!isConnected) {
      setSecondsElapsed(0);
      return;
    }
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isConnected]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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

  // Remote Audio Stream Playback
  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch((err) => {
        console.warn("Remote audio play notice:", err);
      });
    }
  }, [remoteStream]);

  // Stream Resolution for Fullscreen vs PiP Views
  const fullscreenStream = isStreamSwapped ? localStream : remoteStream;
  const pipStream = isStreamSwapped ? remoteStream : localStream;
  const isPipCameraOff = isStreamSwapped ? false : localCameraOff;

  // Fullscreen Video Stream Binding
  useEffect(() => {
    if (fullscreenVideoRef.current && fullscreenStream && type === "video") {
      fullscreenVideoRef.current.srcObject = fullscreenStream;
      fullscreenVideoRef.current.play().catch((err) => {
        console.warn("Fullscreen video play notice:", err);
      });
    }
  }, [fullscreenStream, type]);

  // PiP Video Stream Binding
  useEffect(() => {
    if (pipVideoRef.current && pipStream && type === "video" && !isPipCameraOff) {
      pipVideoRef.current.srcObject = pipStream;
      pipVideoRef.current.play().catch((err) => {
        console.warn("PiP video play notice:", err);
      });
    }
  }, [pipStream, isPipCameraOff, type]);

  const pipRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pointer event handlers for fluid dragging of the PiP Window with strict viewport clamping
  const handlePipPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pipPos.x,
      initialY: pipPos.y,
    };
  };

  const handlePipPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    dragDistanceRef.current = Math.sqrt(dx * dx + dy * dy);

    let targetX = dragStartRef.current.initialX + dx;
    let targetY = dragStartRef.current.initialY + dy;

    // Strict clamping so PiP NEVER leaves visible screen bounds!
    if (containerRef.current && pipRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const pipRect = pipRef.current.getBoundingClientRect();

      const minX = -(containerRect.width - pipRect.width - 12);
      const maxX = 12;
      const minY = -(containerRect.height - pipRect.height - 110);
      const maxY = 12;

      targetX = Math.max(minX, Math.min(maxX, targetX));
      targetY = Math.max(minY, Math.min(maxY, targetY));
    }

    setPipPos({ x: targetX, y: targetY });
  };

  const handlePipPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    // Tap vs Drag threshold check (if moved < 6px, treat as tap to swap stream)
    if (dragDistanceRef.current < 6) {
      setIsStreamSwapped((prev) => !prev);
    }
  };

  const handleMuteClick = () => {
    setLocalMuted(!localMuted);
    onToggleMute?.();
  };

  const handleVideoClick = () => {
    setLocalCameraOff(!localCameraOff);
    onToggleVideo?.();
  };

  const handleToggleSpeaker = () => {
    const nextSpeakerState = !isSpeakerOn;
    setIsSpeakerOn(nextSpeakerState);
    if (audioRef.current && "setSinkId" in HTMLAudioElement.prototype) {
      try {
        (audioRef.current as any).setSinkId(nextSpeakerState ? "speaker" : "default").catch(() => {});
      } catch {}
    }
  };

  const handleBackButtonClick = () => {
    if (isConnected || callState === "Connecting" || callState === "Ringing") {
      setShowBackConfirm(true);
    } else {
      onEndCall();
    }
  };

  // Dynamic status text mapping
  const getDisplayStatusText = () => {
    if (isConnected) {
      return formatTimer(secondsElapsed);
    }
    if (callState === "Ringing" || callState === "OUTGOING_RINGING") {
      return "Ringing...";
    }
    if (callState === "OUTGOING_INITIATING" || callState === "CALLING") {
      return "Calling...";
    }
    if (callState === "INCOMING_RINGING") {
      return "Incoming call";
    }
    if (callState === "Connecting" || callState === "NEGOTIATING" || callState === "ACCEPTING") {
      return "Connecting...";
    }
    if (callState === "Reconnecting" || callState === "RECONNECTING") {
      return "Reconnecting...";
    }
    if (callState === "Ending" || callState === "ENDED") {
      return "Call ended";
    }
    return callState || "Connecting...";
  };

  return (
    <div
      ref={containerRef}
      onClick={() => setControlsVisible((prev) => !prev)}
      className="fixed inset-0 w-screen h-dvh min-h-dvh max-h-dvh bg-[#040814] text-white flex flex-col items-center justify-between p-3 sm:p-4 overflow-hidden font-outfit select-none cursor-pointer touch-none overscroll-none"
    >
      {/* Privacy Mode Overlay */}
      <PrivacyOverlay
        isVisible={isPrivacyActive || isBackgrounded}
        onExitPrivacyMode={() => privacyModeManager.disablePrivacyMode()}
        onEmergencyExit={() => {
          privacyModeManager.activateEmergencyExit();
          onEndCall();
        }}
      />

      {/* Hidden HTML Audio Element for Peer Audio Stream */}
      <audio ref={audioRef} autoPlay playsInline className="hidden" />

      {/* Background Layer */}
      {type === "video" ? (
        /* Video Background View: Full-bleed Stream or Romantic Background Fallback */
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none bg-slate-950">
          <video
            ref={fullscreenVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Fallback Artwork if active video stream is inactive or connecting */}
          {!fullscreenStream && (
            <>
              <Image
                src="/images/background.png"
                alt="Video call romantic background"
                fill
                priority
                sizes="100vw"
                className="object-cover object-[center_20%] w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#040814]/50 via-[#040814]/30 to-[#040814]/85" />
            </>
          )}
          {/* Subtle top & bottom dark gradients for control legibility (Fades completely when controls hide!) */}
          <div className={`absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#040814]/85 to-transparent pointer-events-none transition-opacity duration-300 ${
            controlsVisible ? "opacity-100" : "opacity-0"
          }`} />
          <div className={`absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#040814]/90 to-transparent pointer-events-none transition-opacity duration-300 ${
            controlsVisible ? "opacity-100" : "opacity-0"
          }`} />
        </div>
      ) : (
        /* Audio Background View */
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
          <Image
            src="/images/background.png"
            alt="Audio call background artwork"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_20%] w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#040814]/60 via-[#040814]/40 to-[#040814]/90 pointer-events-none" />
        </div>
      )}

      {/* Non-blocking Screen Sharing Notice Toast */}
      {screenShareNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-amber-500/90 text-slate-950 font-semibold px-4 py-2 rounded-2xl text-xs shadow-2xl backdrop-blur-md animate-bounce pointer-events-auto border border-amber-300 max-w-xs text-center">
          {screenShareNotice}
        </div>
      )}

      {/* Active Screen Sharing Indicator Banner */}
      {isScreenSharing && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-xl backdrop-blur-md animate-pulse pointer-events-auto">
          <span>🖥️ Sharing Screen</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleScreenShare?.();
            }}
            className="ml-1 px-2.5 py-0.5 rounded-full bg-slate-950 text-white text-[10px] font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Stop
          </button>
        </div>
      )}

      {/* Main Mobile App View Container */}
      <div className="relative w-full max-w-md mx-auto h-full flex flex-col justify-between pt-0.5 pb-2 z-10 pointer-events-none">
        
        {/* Top Header Bar */}
        <div className={`w-full flex items-center justify-between pt-1 transition-all duration-300 ${
          controlsVisible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}>
          {/* Top Left Back Button (Clean arrow back icon, gear settings removed) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleBackButtonClick();
            }}
            aria-label="Back / Exit call"
            className="w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-800/90 border border-white/15 backdrop-blur-md flex items-center justify-center text-slate-200 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Center Branding & E2EE Status */}
          <div className="text-center flex flex-col items-center">
            <h1 className="font-script text-[32px] sm:text-[40px] leading-tight font-normal text-white tracking-wide drop-shadow-[0_0_15px_rgba(255,255,255,0.7)] flex items-center justify-center gap-1">
              Between Us <span className="text-rose-400 text-2xl sm:text-3xl leading-none">💕</span>
            </h1>
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-400 drop-shadow mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>🔒 End-to-End Encrypted</span>
            </div>
            {/* Call Duration Counter (Only rendered in top header for video calls to prevent duplicate timers) */}
            {type === "video" && (
              <p className="text-xs font-mono text-slate-200 font-medium mt-0.5 tracking-widest drop-shadow">
                {getDisplayStatusText()}
              </p>
            )}
          </div>

          {/* Top Right Balance Spacer */}
          <div className="w-10 h-10 pointer-events-none" />
        </div>

        {/* Back Confirmation Dialog Overlay */}
        {showBackConfirm && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in pointer-events-auto"
          >
            <div className="bg-[#091325] border border-slate-700 rounded-3xl p-5 max-w-xs w-full text-center space-y-3 shadow-2xl">
              <h3 className="text-sm font-bold text-white">Leave Call?</h3>
              <p className="text-xs text-slate-300">
                Are you sure you want to exit this active call with {partnerName}?
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBackConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                >
                  Stay in Call
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBackConfirm(false);
                    onEndCall();
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-md transition-all cursor-pointer"
                >
                  End Call
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {type === "video" ? (
          /* Video Call View: Draggable Floating PiP Preview Card */
          <div className="relative w-full flex-1 min-h-[50vh] sm:min-h-[55vh] flex flex-col justify-end items-end p-2 pointer-events-none">
            
            {/* Draggable PiP Card Container */}
            <div
              ref={pipRef}
              onPointerDown={handlePipPointerDown}
              onPointerMove={handlePipPointerMove}
              onPointerUp={handlePipPointerUp}
              style={{
                transform: `translate3d(${pipPos.x}px, ${pipPos.y}px, 0)`,
                touchAction: "none",
              }}
              aria-label="Drag PiP window or tap to swap fullscreen stream"
              className="relative w-32 h-44 sm:w-36 sm:h-48 rounded-[22px] overflow-hidden bg-slate-950 border-2 border-white/30 shadow-2xl pointer-events-auto group backdrop-blur-md cursor-grab active:cursor-grabbing transition-shadow hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
            >
              {!isPipCameraOff && pipStream ? (
                <video
                  ref={pipVideoRef}
                  autoPlay
                  playsInline
                  muted={!isStreamSwapped}
                  className="w-full h-full object-cover pointer-events-none"
                />
              ) : (
                /* Camera Off Placeholder */
                <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-400 p-2 text-center pointer-events-none">
                  <span className="text-xl mb-1">📷</span>
                  <span className="text-[10px] font-semibold text-slate-300">
                    {isStreamSwapped ? "Partner Off" : "Cam Off"}
                  </span>
                </div>
              )}

              {/* Stream Swap Indicator Badge */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/80 border border-white/20 backdrop-blur-md text-[9px] font-bold text-white flex items-center gap-1 shadow pointer-events-none">
                <span>⇄</span>
                <span>{isStreamSwapped ? "Remote" : "You"}</span>
              </div>

              {/* Front/Rear Camera Flip Button inside PiP (Bottom Right) */}
              {onSwitchCamera && !isStreamSwapped && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSwitchCamera();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label="Switch front or back camera"
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-slate-950/85 hover:bg-slate-900 border border-white/30 flex items-center justify-center text-white backdrop-blur-md transition-transform active:scale-90 cursor-pointer shadow-lg z-20"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Audio Call View */
          <div className="w-full flex-1 flex flex-col items-center justify-center my-2 sm:my-4 text-center pointer-events-none">
            {/* Partner Avatar with Glowing Border Ring */}
            <div className="relative pointer-events-auto">
              <div
                className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-full p-[3px] bg-gradient-to-tr from-amber-400/90 via-emerald-400 to-sky-400 transition-all duration-500 ${
                  isConnected
                    ? "shadow-[0_0_35px_rgba(52,211,153,0.5)]"
                    : "shadow-[0_0_40px_rgba(52,211,153,0.7)] animate-pulse"
                }`}
              >
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden border-2 border-slate-900 relative">
                  {partnerAvatarUrl ? (
                    <Image
                      src={partnerAvatarUrl}
                      alt={partnerName}
                      fill
                      sizes="160px"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-teal-900 via-slate-900 to-indigo-950 flex items-center justify-center text-white font-bold text-5xl select-none">
                      {partnerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Floating Pink Heart Accent */}
              <div className="absolute -top-1 -right-2 text-rose-400 text-xl animate-bounce duration-1000">
                💕
              </div>
            </div>

            {/* Partner Name Display */}
            <h2 className="font-script text-3.5xl sm:text-4.5xl text-white font-normal mt-3 tracking-wide drop-shadow-md flex items-center gap-1.5 justify-center">
              <span>{partnerName}</span>
              <span className="text-rose-400 text-2xl sm:text-3xl">♡</span>
            </h2>

            {/* Call Status / Elapsed Timer */}
            <p className="text-sm font-mono text-slate-200 font-semibold mt-1 tracking-wider drop-shadow">
              {getDisplayStatusText()}
            </p>

            {/* Audio Waveform Visualizer */}
            <AudioVisualizer
              stream={remoteStream || localStream}
              isMuted={localMuted}
              isConnected={isConnected}
            />
          </div>
        )}

        {/* Safety Code Verification Overlay */}
        {showSafetyCheck && (
          <div className="my-2 w-full pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <SafetyVerification
              onVerified={() => setShowSafetyCheck(false)}
              onClose={() => setShowSafetyCheck(false)}
            />
          </div>
        )}

        {/* Bottom Call Controls Panel (Fades out seamlessly when controlsVisible === false) */}
        <div className={`w-full pt-2 transition-all duration-300 ${
          controlsVisible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        }`}>
          {/* Unified Controls Layout (Mic, Camera, End Call, Speaker, More) */}
          <div className="flex flex-col items-center space-y-4">
            {/* Control Buttons Row */}
            <div className="flex items-center justify-center gap-3.5 sm:gap-5 w-full px-2">
              
              {/* 1. Mic Toggle Button */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMuteClick();
                  }}
                  aria-label={localMuted ? "Unmute microphone" : "Mute microphone"}
                  className={`w-13 h-13 sm:w-15 sm:h-15 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                    localMuted
                      ? "bg-rose-500/25 text-rose-400 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.35)]"
                      : "bg-slate-900/80 text-white border border-white/15 hover:bg-slate-800"
                  }`}
                >
                  {localMuted ? (
                    /* Muted Mic Icon */
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12C19.5 15.5847 16.897 18.558 13.5 19.0494V21.75M12 21.75H8.25M12 21.75H15.75M12 15.75C13.6569 15.75 15 14.4069 15 12.75V8.87109M4.5 4.5L19.5 19.5M9.75 4.75736C10.4056 4.59074 11.1895 4.5 12 4.5C13.6569 4.5 15 5.84315 15 7.5V10.25M9 7.82843V12.75C9 14.4069 10.3431 15.75 12 15.75" />
                    </svg>
                  ) : (
                    /* Active Mic Icon */
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 003-3V4.5a3 3 0 00-6 0v8.25a3 3 0 003 3z" />
                    </svg>
                  )}
                </button>
                <span className="text-xs text-slate-300 mt-1.5 font-medium">
                  {localMuted ? "Muted" : "Mic"}
                </span>
              </div>

              {/* 2. Camera Toggle Button */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVideoClick();
                  }}
                  aria-label={localCameraOff ? "Turn camera on" : "Turn camera off"}
                  className={`w-13 h-13 sm:w-15 sm:h-15 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                    localCameraOff
                      ? "bg-rose-500/25 text-rose-400 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.35)]"
                      : "bg-slate-900/80 text-white border border-white/15 hover:bg-slate-800"
                  }`}
                >
                  {localCameraOff ? (
                    /* Camera Off Icon */
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                      <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                    </svg>
                  ) : (
                    /* Camera Active Icon */
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  )}
                </button>
                <span className="text-xs text-slate-300 mt-1.5 font-medium">
                  {localCameraOff ? "Cam Off" : "Camera"}
                </span>
              </div>

              {/* 3. Big Red Circular End Call Button */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEndCall();
                  }}
                  aria-label="End call"
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.55)] hover:shadow-[0_0_40px_rgba(244,63,94,0.75)] border border-rose-400/40 transition-all cursor-pointer active:scale-95 group"
                >
                  <svg className="w-8 h-8 sm:w-9 sm:h-9 fill-current rotate-[135deg] group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                    <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z" />
                  </svg>
                </button>
                <span className="text-xs text-rose-400 mt-1.5 font-bold tracking-wide">
                  End Call
                </span>
              </div>

              {/* 4. Speaker Toggle Button */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSpeaker();
                  }}
                  aria-label={isSpeakerOn ? "Turn speaker off" : "Turn speaker on"}
                  className={`w-13 h-13 sm:w-15 sm:h-15 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                    isSpeakerOn
                      ? "bg-emerald-500/25 text-emerald-400 border border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                      : "bg-slate-900/80 text-slate-400 border border-white/15"
                  }`}
                >
                  {isSpeakerOn ? (
                    /* Speaker Loud Icon */
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.287a5.25 5.25 0 010 7.426M11.25 4.5l-4.5 3.75H3.75a.75.75 0 00-.75.75v6c0 .414.336.75.75.75h3l4.5 3.75V4.5z" />
                    </svg>
                  ) : (
                    /* Speaker Off Icon */
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25M11.25 4.5l-4.5 3.75H3.75a.75.75 0 00-.75.75v6c0 .414.336.75.75.75h3l4.5 3.75V4.5z" />
                    </svg>
                  )}
                </button>
                <span className="text-xs text-slate-300 mt-1.5 font-medium">
                  Speaker
                </span>
              </div>

              {/* 5. More Menu Toggle Button */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoreMenu(true);
                  }}
                  aria-label="More call options"
                  className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-slate-900/80 border border-white/15 text-white flex items-center justify-center hover:bg-slate-800 transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                  </svg>
                </button>
                <span className="text-xs text-slate-300 mt-1.5 font-medium">
                  More
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CallOptionsModal Component */}
      <CallOptionsModal
        isOpen={showMoreMenu}
        onClose={() => setShowMoreMenu(false)}
        partnerName={partnerName}
        isSpeakerOn={isSpeakerOn}
        isScreenSharing={isScreenSharing}
        onToggleSpeaker={handleToggleSpeaker}
        onToggleScreenShare={onToggleScreenShare}
        onSwitchCamera={onSwitchCamera}
        onOpenSafetyVerification={() => setShowSafetyCheck(true)}
        onEndCall={onEndCall}
        connectionState={typeof callState === "string" ? callState : "Connected"}
      />
    </div>
  );
};
