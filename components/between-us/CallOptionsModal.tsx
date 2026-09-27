"use client";

import React, { useState, useEffect } from "react";

interface CallOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  isSpeakerOn: boolean;
  onToggleSpeaker: () => void;
  onOpenSafetyVerification: () => void;
  onEndCall: () => void;
  iceState?: string | undefined;
  connectionState?: string | undefined;
}

export const CallOptionsModal: React.FC<CallOptionsModalProps> = ({
  isOpen,
  onClose,
  partnerName,
  isSpeakerOn,
  onToggleSpeaker,
  onOpenSafetyVerification,
  onEndCall,
  iceState = "connected",
  connectionState = "Connected",
}) => {
  const [showConnectionInfo, setShowConnectionInfo] = useState(false);
  const [sinkIdSupported, setSinkIdSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "setSinkId" in HTMLAudioElement.prototype) {
      setSinkIdSupported(true);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in select-none">
      <div
        className="w-full max-w-sm bg-[#091325] border border-slate-700/80 rounded-3xl p-5 shadow-2xl space-y-4 font-outfit"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Call Options
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close call options"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
          {/* Audio Output Option */}
          <button
            type="button"
            onClick={() => {
              onToggleSpeaker();
            }}
            aria-label="Toggle audio output device"
            className="w-full p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-slate-200 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                🔊
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Audio Output</p>
                <p className="text-[11px] text-slate-400">
                  {isSpeakerOn ? "Speakerphone" : "Device Earpiece / Default"}
                  {!sinkIdSupported && " (System default)"}
                </p>
              </div>
            </div>
            <span className="text-xs text-emerald-400 font-semibold">
              {isSpeakerOn ? "ON" : "OFF"}
            </span>
          </button>

          {/* Connection Info Toggle */}
          <button
            type="button"
            onClick={() => setShowConnectionInfo(!showConnectionInfo)}
            aria-label="Toggle connection information"
            className="w-full p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-slate-200 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
                📡
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Connection Info</p>
                <p className="text-[11px] text-slate-400">
                  WebRTC P2P & Signaling state
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-400">{showConnectionInfo ? "▲" : "▼"}</span>
          </button>

          {/* Expanded Connection Info Details */}
          {showConnectionInfo && (
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold">{connectionState}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ICE State:</span>
                <span className="text-sky-300">{iceState}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Encryption:</span>
                <span className="text-emerald-300">DTLS-SRTP (E2EE)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Codec:</span>
                <span className="text-slate-200">Opus 48kHz HD</span>
              </div>
            </div>
          )}

          {/* Safety Code Verification */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSafetyVerification();
            }}
            aria-label="Verify safety code"
            className="w-full p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-slate-200 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center">
                🛡️
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Safety Code</p>
                <p className="text-[11px] text-slate-400">
                  Verify E2EE fingerprint with {partnerName}
                </p>
              </div>
            </div>
            <span className="text-xs text-teal-400 font-semibold">Verify</span>
          </button>
        </div>

        {/* End Call Button inside menu */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEndCall();
            }}
            aria-label="End active call"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs tracking-wide shadow-lg cursor-pointer transition-all active:scale-98"
          >
            End Call
          </button>
        </div>
      </div>
    </div>
  );
};
