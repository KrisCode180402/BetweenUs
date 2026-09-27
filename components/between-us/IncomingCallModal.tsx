"use client";

import React, { useEffect } from "react";
import { ringtoneManager } from "@/lib/sound/ringtone";

interface IncomingCallModalProps {
  callerName?: string;
  callType: "audio" | "video";
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  callerName = "Your Partner",
  callType,
  onAccept,
  onDecline,
}) => {
  useEffect(() => {
    // Play incoming ringtone on display mount
    ringtoneManager.playIncomingRingtone();

    return () => {
      ringtoneManager.stopAll();
    };
  }, []);

  const handleAccept = () => {
    ringtoneManager.stopAll();
    onAccept();
  };

  const handleDecline = () => {
    ringtoneManager.stopAll();
    onDecline();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-[#040814] text-white p-6 sm:p-10 select-none animate-in fade-in duration-300 font-outfit overflow-hidden">
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-rose-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-emerald-500/15 blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <div className="pt-10 text-center space-y-1.5 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wider font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          INCOMING {callType.toUpperCase()} CALL
        </div>
        <p className="text-xs text-slate-400">
          Between Us — Private Encrypted Channel
        </p>
      </div>

      {/* Main Avatar & Caller Identity */}
      <div className="flex flex-col items-center text-center space-y-7 z-10 my-auto">
        <div className="relative">
          {/* Pulsing Ripple Rings */}
          <div className="absolute -inset-6 rounded-full bg-emerald-500/20 animate-ping opacity-60" />
          <div className="absolute -inset-10 rounded-full bg-rose-500/10 animate-pulse" />

          {/* Core Avatar Display */}
          <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-emerald-400/60 shadow-[0_0_60px_rgba(52,211,153,0.35)] flex items-center justify-center">
            <span className="text-6xl">
              {callType === "video" ? "📹" : "🎙️"}
            </span>
          </div>

          <div className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-rose-500 border-2 border-[#040814] flex items-center justify-center text-white text-base shadow-md">
            ❤️
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {callerName}
          </h3>
          <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest animate-pulse">
            Calling you right now...
          </p>
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="w-full max-w-xs pb-12 z-10 flex items-center justify-around gap-8">
        {/* Decline Button */}
        <div className="flex flex-col items-center gap-2.5">
          <button
            type="button"
            onClick={handleDecline}
            aria-label="Decline call"
            className="w-20 h-20 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-950/80 transition-all active:scale-90 cursor-pointer"
          >
            <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 8l-8 8m0-8l8 8" />
            </svg>
          </button>
          <span className="text-xs text-slate-400 font-semibold tracking-wide">Decline</span>
        </div>

        {/* Accept Button */}
        <div className="flex flex-col items-center gap-2.5">
          <button
            type="button"
            onClick={handleAccept}
            aria-label="Accept call"
            className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-emerald-500/50 transition-all active:scale-90 cursor-pointer animate-bounce"
          >
            <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <span className="text-xs text-emerald-400 font-bold tracking-wide">Accept</span>
        </div>
      </div>
    </div>
  );
};
