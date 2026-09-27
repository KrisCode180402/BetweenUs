"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ConnectionCallState } from "./ConnectionStatus";
import { SafetyVerification } from "./SafetyVerification";
import { PrivacyOverlay } from "./PrivacyOverlay";
import { privacyModeManager } from "@/lib/privacy/privacy-mode";

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
  callState: _callState,
  partnerName = "Jona",
  localStream,
  remoteStream,
  isMuted = false,
  isVideoOff = type === "audio",
  isScreenSharing = false,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare: _onToggleScreenShare,
  onSwitchCamera,
  onEmergencyExit: _onEmergencyExit,
  onEndCall,
}) => {
  const [localMuted, setLocalMuted] = useState(isMuted);
  const [localCameraOff, setLocalCameraOff] = useState(isVideoOff);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showSafetyCheck, setShowSafetyCheck] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isPrivacyActive, setIsPrivacyActive] = useState(privacyModeManager.isActive());
  const [isBackgrounded, setIsBackgrounded] = useState(
    typeof document !== "undefined" ? document.visibilityState === "hidden" : false
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Call duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Remote Audio Playback
  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  // Local Video Preview
  useEffect(() => {
    if (localVideoRef.current && localStream && (type === "video" || isScreenSharing) && !localCameraOff) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, type, localCameraOff, isScreenSharing]);

  // Remote Video Rendering
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && type === "video") {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, type]);

  const handleMuteClick = () => {
    setLocalMuted(!localMuted);
    onToggleMute?.();
  };

  const handleVideoClick = () => {
    setLocalCameraOff(!localCameraOff);
    onToggleVideo?.();
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#040814] text-white flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden font-outfit select-none">
      
      {/* Privacy Overlay */}
      <PrivacyOverlay
        isVisible={isPrivacyActive || isBackgrounded}
        onExitPrivacyMode={() => privacyModeManager.disablePrivacyMode()}
        onEmergencyExit={() => {
          privacyModeManager.activateEmergencyExit();
          onEndCall();
        }}
      />

      {/* Hidden Remote Audio Stream */}
      <audio ref={audioRef} autoPlay playsInline className="hidden" />

      {/* Background Image Artwork for Audio Calls */}
      {type === "audio" && (
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
          <Image
            src="/images/background-person.png"
            alt="Call background"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_30%] w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#040814]/60 via-[#040814]/30 to-[#040814]/90" />
        </div>
      )}

      {/* Main Call Mobile Container */}
      <div className="relative w-full max-w-md mx-auto min-h-[95vh] flex flex-col justify-between pt-2 pb-4 z-10">
        
        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onEndCall}
            aria-label="Back / End Call"
            className="w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-800 border border-slate-700/60 backdrop-blur-md flex items-center justify-center text-slate-200 hover:text-white transition-all cursor-pointer shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <h1 className="font-script text-3.5xl font-normal text-white tracking-wide drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
              Between Us <span className="text-rose-400">💕</span>
            </h1>
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-400 drop-shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>🔒 End-to-End Encrypted</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            aria-label="More options"
            className="w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-800 border border-slate-700/60 backdrop-blur-md flex items-center justify-center text-slate-200 hover:text-white transition-all cursor-pointer shadow-lg"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>

        {/* More Menu Dropdown Overlay */}
        {showMoreMenu && (
          <div className="absolute top-16 right-4 z-40 w-48 bg-[#091325] border border-slate-700/80 rounded-2xl p-2 shadow-2xl backdrop-blur-xl animate-fade-in text-xs space-y-1">
            <button
              type="button"
              onClick={() => {
                setShowSafetyCheck(!showSafetyCheck);
                setShowMoreMenu(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 flex items-center gap-2"
            >
              <span>🛡️ Verify Safety Code</span>
            </button>
            <button
              type="button"
              onClick={() => {
                privacyModeManager.enablePrivacyMode();
                setShowMoreMenu(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 flex items-center gap-2"
            >
              <span>🔒 Privacy Lock</span>
            </button>
            <button
              type="button"
              onClick={() => {
                privacyModeManager.activateEmergencyExit();
                onEndCall();
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-rose-300 hover:bg-rose-950/50 flex items-center gap-2 font-semibold"
            >
              <span>🚨 Emergency Exit</span>
            </button>
          </div>
        )}

        {/* Main Call View Container */}
        {type === "video" ? (
          /* Video Call View (4 Video page.png) */
          <div className="relative w-full flex-1 rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl my-2 flex items-center justify-center min-h-[60vh]">
            {/* Remote Video Stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Top Timer Overlay */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-slate-950/70 border border-slate-700/60 backdrop-blur-md text-xs font-mono font-bold text-white tracking-widest shadow-lg">
              {formatTimer(secondsElapsed)}
            </div>

            {/* Local PiP Video Stream Preview (Bottom Right) */}
            <div className="absolute bottom-4 right-4 w-32 h-44 rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700/80 shadow-2xl group">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {onSwitchCamera && (
                <button
                  type="button"
                  onClick={onSwitchCamera}
                  aria-label="Flip Camera"
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center text-white backdrop-blur-md hover:scale-110 transition-transform cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Audio Call View (3 Audio page.png) */
          <div className="w-full flex-1 flex flex-col items-center justify-center my-4 text-center">
            {/* Partner Avatar with Glowing Ring */}
            <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full p-1 bg-gradient-to-tr from-emerald-400 via-teal-400 to-sky-400 shadow-[0_0_35px_rgba(52,211,153,0.5)]">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden border-2 border-slate-900">
                <div className="w-full h-full bg-gradient-to-tr from-teal-900 to-slate-900 flex items-center justify-center text-white font-bold text-5xl select-none">
                  {partnerName.charAt(0)}
                </div>
              </div>
            </div>

            {/* Partner Name */}
            <h2 className="font-script text-4xl text-white font-normal mt-4 tracking-wide drop-shadow-md">
              {partnerName} <span className="text-rose-400">♡</span>
            </h2>

            {/* Timer Counter */}
            <p className="text-sm font-mono text-slate-300 font-bold mt-1 tracking-widest">
              {formatTimer(secondsElapsed)}
            </p>

            {/* Animated Audio Waveform Visualizer */}
            <div className="flex items-center justify-center gap-1.5 my-6 h-8">
              {[0.4, 0.7, 1.0, 0.6, 0.9, 0.5, 0.8, 0.4].map((scale, i) => (
                <span
                  key={i}
                  className="w-1 bg-emerald-400 rounded-full animate-pulse"
                  style={{
                    height: `${scale * 100}%`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Safety Code Modal Overlay */}
        {showSafetyCheck && (
          <div className="my-2 w-full">
            <SafetyVerification
              onVerified={() => setShowSafetyCheck(false)}
              onClose={() => setShowSafetyCheck(false)}
            />
          </div>
        )}

        {/* Bottom Call Action Control Buttons */}
        <div className="w-full pt-2">
          {type === "video" ? (
            /* Video Controls Row (Mic, Camera, End Call, Speaker, More) */
            <div className="flex items-center justify-around py-3 px-4 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-2xl">
              {/* Mic Toggle */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleMuteClick}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    localMuted
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  </svg>
                </button>
                <span className="text-[10px] text-slate-400 mt-1 font-medium">Mic</span>
              </div>

              {/* Camera Toggle */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleVideoClick}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    localCameraOff
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                  </svg>
                </button>
                <span className="text-[10px] text-slate-400 mt-1 font-medium">Camera</span>
              </div>

              {/* Red End Call Button */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={onEndCall}
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.5)] transition-all cursor-pointer active:scale-95"
                >
                  <svg className="w-7 h-7 fill-current rotate-[135deg]" viewBox="0 0 24 24">
                    <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z" />
                  </svg>
                </button>
                <span className="text-[10px] text-rose-400 mt-1 font-bold">End Call</span>
              </div>

              {/* Speaker Toggle */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleToggleSpeaker}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isSpeakerOn
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                  </svg>
                </button>
                <span className="text-[10px] text-slate-400 mt-1 font-medium">Speaker</span>
              </div>

              {/* More Toggle */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </button>
                <span className="text-[10px] text-slate-400 mt-1 font-medium">More</span>
              </div>
            </div>
          ) : (
            /* Audio Controls Layout (3 Audio page.png) */
            <div className="flex flex-col items-center space-y-4">
              {/* Controls Row: Mute, Speaker, More */}
              <div className="flex items-center justify-center gap-6">
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={handleMuteClick}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                      localMuted
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        : "bg-slate-900/80 text-white border border-slate-700/60 hover:bg-slate-800"
                    }`}
                  >
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    </svg>
                  </button>
                  <span className="text-xs text-slate-300 mt-1 font-medium">Mute</span>
                </div>

                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={handleToggleSpeaker}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                      isSpeakerOn
                        ? "bg-emerald-500/25 text-emerald-400 border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                        : "bg-slate-900/80 text-slate-400 border border-slate-700/60"
                    }`}
                  >
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                    </svg>
                  </button>
                  <span className="text-xs text-slate-300 mt-1 font-medium">Speaker</span>
                </div>

                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="w-14 h-14 rounded-full bg-slate-900/80 border border-slate-700/60 text-white flex items-center justify-center hover:bg-slate-800 transition-all cursor-pointer shadow-lg"
                  >
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </button>
                  <span className="text-xs text-slate-300 mt-1 font-medium">More</span>
                </div>
              </div>

              {/* Big Red Circular End Call Button */}
              <div className="flex flex-col items-center pt-2">
                <button
                  type="button"
                  onClick={onEndCall}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.5)] hover:shadow-[0_0_40px_rgba(244,63,94,0.7)] transition-all cursor-pointer active:scale-95"
                >
                  <svg className="w-8 h-8 fill-current rotate-[135deg]" viewBox="0 0 24 24">
                    <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z" />
                  </svg>
                </button>
                <span className="text-xs text-rose-400 mt-1.5 font-bold">End Call</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
