"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { loadPairedPartner } from "@/lib/pairing/partner-store";
import { SettingsModal } from "./SettingsModal";

interface HomeScreenProps {
  partnerName?: string;
  onInitiateAudioCall: () => void;
  onInitiateVideoCall: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  partnerName: initialPartnerName = "Jona",
  onInitiateAudioCall,
  onInitiateVideoCall,
}) => {
  const router = useRouter();
  const [, setIsPaired] = useState<boolean>(false);
  const [partnerName, setPartnerName] = useState<string>(initialPartnerName);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    async function checkPairing() {
      try {
        const partner = await loadPairedPartner();
        if (partner) {
          setIsPaired(true);
          const name = (partner as any).partnerName || partner.partnerPublicIdentity?.fingerprint?.substring(0, 6) || "Jona";
          setPartnerName(name);
        } else {
          setIsPaired(false);
          // If not paired, redirect to /pairing
          router.push("/pairing");
        }
      } catch (err) {
        console.warn("Pairing check error:", err);
      } finally {
        setIsInitializing(false);
      }
    }
    checkPairing();
  }, [router]);

  const handleUnpairComplete = useCallback(() => {
    setIsPaired(false);
    router.push("/pairing");
  }, [router]);

  if (isInitializing) {
    return (
      <div className="w-full min-h-screen bg-[#040814] flex flex-col items-center justify-center p-6 text-center select-none font-outfit">
        <div className="w-10 h-10 rounded-full border-3 border-teal-400 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-mono text-slate-400">Loading Between Us...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-[#040814] text-white flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden font-outfit select-none">
      
      {/* Full-Screen Romantic Background Artwork */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <Image
          src="/images/background-person.png"
          alt="Starry sky sunset couple background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_18%] w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040814]/40 via-transparent to-[#040814]/90" />
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-md mx-auto min-h-[95vh] flex flex-col justify-between pt-2 pb-4 z-10">
        
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between pt-1">
          {/* Settings Button (Top Left) */}
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

          {/* Center Brand Title */}
          <div className="text-center">
            <h1 className="font-script text-3.5xl font-normal text-white tracking-wide drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
              Between Us <span className="text-rose-400">💕</span>
            </h1>
            <p className="text-[11px] text-slate-200/90 font-medium">
              Just the two of us <span className="text-rose-400">♡</span>
            </p>
          </div>

          {/* Top Right Heart Badge */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Heart status"
            className="w-10 h-10 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 backdrop-blur-md flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
          >
            <svg className="w-5 h-5 fill-current animate-pulse" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>

        {/* Center Partner Profile Avatar Card */}
        <div className="w-full flex flex-col items-center justify-center my-4">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-emerald-400 via-teal-400 to-sky-400 shadow-[0_0_30px_rgba(52,211,153,0.5)]">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden border-2 border-slate-900">
              <div className="w-full h-full bg-gradient-to-tr from-teal-900 to-slate-900 flex items-center justify-center text-white font-bold text-3xl sm:text-4xl select-none">
                {partnerName.charAt(0)}
              </div>
            </div>
            {/* Online Green Indicator Dot */}
            <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-400 border-3 border-[#040814] shadow-lg animate-pulse" />
          </div>

          <h2 className="font-script text-3xl sm:text-4xl text-white font-normal mt-3 tracking-wide drop-shadow-md">
            {partnerName} <span className="text-rose-400">♡</span>
          </h2>

          <div className="mt-1.5 px-3.5 py-1 rounded-full bg-slate-900/80 border border-emerald-500/40 backdrop-blur-md flex items-center gap-2 text-xs font-semibold text-emerald-300 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online • Ready to call</span>
          </div>
        </div>

        {/* 2 Call Action Cards (Audio & Video) */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4.5 w-full my-2">
          
          {/* Audio Call Card (Green) */}
          <button
            type="button"
            onClick={onInitiateAudioCall}
            aria-label="Initiate Audio Call"
            className="flex flex-col items-center justify-between p-5 rounded-3xl bg-gradient-to-b from-emerald-500 via-teal-600 to-emerald-700 hover:from-emerald-400 hover:via-teal-500 hover:to-emerald-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.45)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] border border-emerald-400/50 cursor-pointer transition-all duration-300 active:scale-[0.97] group min-h-[160px]"
          >
            <div className="w-13 h-13 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform mt-1">
              <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z" />
              </svg>
            </div>
            <div className="text-center mb-1">
              <h3 className="text-base font-bold text-white tracking-wide">Audio Call</h3>
              <p className="text-xs text-emerald-100/90 font-medium mt-0.5">Talk anytime</p>
            </div>
          </button>

          {/* Video Call Card (Blue) */}
          <button
            type="button"
            onClick={onInitiateVideoCall}
            aria-label="Initiate Video Call"
            className="flex flex-col items-center justify-between p-5 rounded-3xl bg-gradient-to-b from-sky-500 via-blue-600 to-indigo-700 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-600 text-white shadow-[0_0_30px_rgba(56,189,248,0.45)] hover:shadow-[0_0_40px_rgba(56,189,248,0.6)] border border-sky-400/50 cursor-pointer transition-all duration-300 active:scale-[0.97] group min-h-[160px]"
          >
            <div className="w-13 h-13 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform mt-1">
              <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
              </svg>
            </div>
            <div className="text-center mb-1">
              <h3 className="text-base font-bold text-white tracking-wide">Video Call</h3>
              <p className="text-xs text-sky-100/90 font-medium mt-0.5">See each other</p>
            </div>
          </button>
        </div>

        {/* Bottom End-to-End Encrypted Card Banner */}
        <div
          onClick={() => setIsSettingsOpen(true)}
          className="w-full mt-2 bg-[#091325]/85 hover:bg-[#0B182E] border border-teal-500/30 hover:border-teal-500/50 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md transition-all duration-300 shadow-xl cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-400/50 flex items-center justify-center text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.35)] group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-white tracking-wide">End-to-End Encrypted</h4>
              <p className="text-[11px] text-slate-300/80 font-normal">
                Only you and {partnerName} can see and hear.
              </p>
            </div>
          </div>
          <svg className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>

      </div>

      {/* Settings Modal Component */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        partnerName={partnerName}
        onUnpairComplete={handleUnpairComplete}
      />
    </div>
  );
};
