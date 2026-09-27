"use client";

import React, { useState } from "react";
import Image from "next/image";
import { SettingsModal } from "./SettingsModal";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onReturnHome?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Connection Failed",
  message = "We couldn't establish a connection right now. Please try again.",
  onRetry,
  onReturnHome,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [checkingConn, setCheckingConn] = useState(false);
  const [connStatus, setConnStatus] = useState<string | null>(null);

  const handleCheckConnection = () => {
    setCheckingConn(true);
    setConnStatus(null);
    setTimeout(() => {
      setCheckingConn(false);
      if (typeof window !== "undefined" && navigator.onLine) {
        setConnStatus("Online • Network connection active");
      } else {
        setConnStatus("Offline • Please connect to Wi-Fi or mobile data");
      }
    }, 1200);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#040814] text-white flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden font-outfit select-none">
      {/* Background Artwork */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <Image
          src="/images/background-person.png"
          alt="Sunset background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_30%] w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040814]/50 via-transparent to-[#040814]/95" />
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-md mx-auto min-h-[95vh] flex flex-col justify-between pt-2 pb-4 z-10">
        
        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Open Settings"
            className="w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-800/90 border border-slate-700/60 backdrop-blur-md flex items-center justify-center text-slate-200 hover:text-white transition-all cursor-pointer shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <div className="text-center">
            <h1 className="font-script text-3.5xl font-normal text-white tracking-wide drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
              Between Us <span className="text-rose-400">💕</span>
            </h1>
            <p className="text-[11px] text-slate-200/90 font-medium">
              Just the two of us <span className="text-rose-400">♡</span>
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-400/50 backdrop-blur-md flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.35)]">
            <svg className="w-5 h-5 fill-current animate-pulse" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        </div>

        {/* Center Graphic: Red Glowing Sad Cloud & Broken Heart */}
        <div className="w-full flex flex-col items-center justify-center text-center my-2">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Sad Cloud Graphic */}
            <div className="w-20 h-14 rounded-full bg-rose-500/25 border border-rose-400/60 shadow-[0_0_35px_rgba(244,63,94,0.5)] flex items-center justify-center relative">
              <div className="flex gap-2">
                <span className="w-2.5 h-1 bg-rose-300 rounded-full rotate-12" />
                <span className="w-2.5 h-1 bg-rose-300 rounded-full -rotate-12" />
              </div>
              <div className="absolute bottom-3.5 w-3 h-1.5 border-t-2 border-rose-300 rounded-t-full" />
            </div>
            {/* Floating Broken Heart */}
            <svg className="absolute -top-1 -right-1 w-7 h-7 text-rose-400 fill-current animate-bounce drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-wide mt-2">{title}</h2>
          <p className="text-xs text-slate-300/80 font-medium max-w-xs mt-1 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Diagnostic Options List (4 Cards) */}
        <div className="w-full space-y-2 my-2">
          {/* Card 1: Internet Connection */}
          <div className="p-3 rounded-2xl bg-[#091325]/80 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-xs font-bold text-white">No Internet Connection</h3>
              <p className="text-[10px] text-slate-400">Check your Wi-Fi or mobile data.</p>
            </div>
          </div>

          {/* Card 2: Signaling Server */}
          <div className="p-3 rounded-2xl bg-[#091325]/80 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-xs font-bold text-white">Signaling Server Unavailable</h3>
              <p className="text-[10px] text-slate-400">Please try again in a few moments.</p>
            </div>
          </div>

          {/* Card 3: TURN Connection */}
          <div className="p-3 rounded-2xl bg-[#091325]/80 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-xs font-bold text-white">TURN Connection Failed</h3>
              <p className="text-[10px] text-slate-400">Your network may be blocking calls.</p>
            </div>
          </div>

          {/* Card 4: Camera / Mic */}
          <div className="p-3 rounded-2xl bg-[#091325]/80 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-xs font-bold text-white">Camera or Microphone Unavailable</h3>
              <p className="text-[10px] text-slate-400">Check app permissions in settings.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5 pt-1">
          {/* Button 1: Try Again */}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="w-full py-3.5 px-5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-500 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.4)] border border-emerald-400/40 cursor-pointer transition-all duration-300 active:scale-[0.98]"
            >
              <svg className="w-4.5 h-4.5 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Try Again</span>
            </button>
          )}

          {/* Button 2: Check Connection */}
          <button
            type="button"
            onClick={handleCheckConnection}
            disabled={checkingConn}
            className="w-full py-3.5 px-5 rounded-full bg-[#091325]/90 hover:bg-[#0B182E] text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 border border-slate-700 backdrop-blur-md cursor-pointer transition-all duration-300 active:scale-[0.98]"
          >
            <svg className="w-4.5 h-4.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{checkingConn ? "Testing network..." : "Check Connection"}</span>
          </button>

          {connStatus && (
            <p className="text-[11px] font-medium text-emerald-400 text-center animate-fade-in">
              {connStatus}
            </p>
          )}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="w-full grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 mt-2 text-center text-xs">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="flex flex-col items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer py-1"
          >
            <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            <span className="text-[10px] font-medium">Go to Settings</span>
          </button>

          <button
            type="button"
            onClick={() => window.open("/pairing", "_blank")}
            className="flex flex-col items-center justify-center text-slate-400 hover:text-teal-300 transition-colors cursor-pointer py-1"
          >
            <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px] font-bold mb-0.5">
              ?
            </div>
            <span className="text-[10px] font-medium">Get Help</span>
          </button>

          {onReturnHome && (
            <button
              type="button"
              onClick={onReturnHome}
              className="flex flex-col items-center justify-center text-rose-400 hover:text-rose-300 transition-colors cursor-pointer py-1"
            >
              <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-[10px] font-medium">Return Home</span>
            </button>
          )}
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
