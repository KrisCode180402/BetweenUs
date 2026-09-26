import React, { useState } from "react";
import { Brand } from "./Brand";
import { CallButton } from "./CallButton";
import { PairingSection } from "./PairingSection";

interface HomeScreenProps {
  partnerName?: string;
  onInitiateAudioCall: () => void;
  onInitiateVideoCall: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onInitiateAudioCall,
  onInitiateVideoCall,
}) => {
  const [isPaired, setIsPaired] = useState<boolean>(false);

  return (
    <div className="relative w-full max-w-lg min-h-[92vh] mx-auto flex flex-col justify-between p-6 sm:p-8 bg-[#060B14] text-white overflow-hidden rounded-[2.5rem] border border-slate-800/80 shadow-2xl">
      {/* Background Aurora Glow */}
      <div className="absolute inset-x-0 bottom-0 h-96 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-500/20 via-teal-900/10 to-transparent opacity-80 pointer-events-none" />

      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between z-10 pt-2">
        <Brand />

        {/* Top Right Status Badge */}
        <div className="px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md flex items-center gap-2 text-xs text-slate-300">
          <span className={`w-2 h-2 rounded-full ${isPaired ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
          <span className="font-medium text-[11px]">{isPaired ? "Paired" : "Unpaired"}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-6 z-10 space-y-6">
        {/* Cursive Headline */}
        <div className="text-center space-y-1">
          <h2 className="font-script text-4xl sm:text-5xl font-normal text-[#34D399] tracking-wide select-none drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]">
            Just you and me
          </h2>
          <div className="flex justify-center my-1">
            <svg
              className="w-5 h-5 text-sky-400 stroke-current fill-none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <p className="text-xs sm:text-sm text-slate-300/80 font-normal leading-relaxed max-w-xs mx-auto">
            Private calls. Real moments.<br />
            No recordings. No data. Just the two of us.
          </p>
        </div>

        {/* Real Device Pairing UI */}
        <PairingSection onPairingStatusChange={(paired) => setIsPaired(paired)} />

        {/* 2-Column Calling Action Buttons (Enabled ONLY when paired) */}
        {isPaired && (
          <div className="grid grid-cols-2 gap-4 w-full pt-2 animate-fade-in">
            <CallButton type="audio" onClick={onInitiateAudioCall} />
            <CallButton type="video" onClick={onInitiateVideoCall} />
          </div>
        )}

        {/* Security Encrypted Glass Pill Banner */}
        <div className="w-full bg-[#081829]/70 backdrop-blur-xl border border-teal-500/20 hover:border-teal-500/40 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between transition-all duration-300 shadow-lg shadow-black/40 cursor-pointer group">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <svg
                className="w-5 h-5 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div className="text-left">
              <h4 className="text-xs sm:text-sm font-semibold text-white tracking-wide">
                Encrypted WebRTC connection
              </h4>
              <p className="text-[11px] text-slate-400/90 font-normal">
                Direct DTLS-SRTP media streaming between paired peers.
              </p>
            </div>
          </div>
          <svg
            className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Bottom Section: Divider & Tagline */}
      <div className="w-full space-y-4 z-10 pt-2">
        {/* Heart Divider Line */}
        <div className="flex items-center justify-center w-full">
          <div className="h-[1px] bg-gradient-to-r from-transparent via-teal-500/40 to-transparent flex-1" />
          <span className="px-3 text-teal-400 text-xs">
            <svg
              className="w-4 h-4 text-teal-400 fill-none stroke-current"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </span>
          <div className="h-[1px] bg-gradient-to-r from-transparent via-teal-500/40 to-transparent flex-1" />
        </div>

        <p className="text-[10px] font-semibold text-slate-400/90 tracking-[0.25em] text-center uppercase">
          CLOSER EVERY DAY
        </p>

        {/* Footer Badges */}
        <div className="w-full flex items-center justify-between pt-2 text-[9px] sm:text-[10px] text-slate-400/80 font-medium tracking-wider uppercase">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span>A CLEANER KINDER INTERNET</span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>PRIVACY BY DESIGN</span>
          </div>
        </div>
      </div>
    </div>
  );
};
