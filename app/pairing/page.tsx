"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LanguageSelector } from "@/components/pairing/LanguageSelector";
import { PairingHeader } from "@/components/pairing/PairingHeader";
import { FeatureBadges } from "@/components/pairing/FeatureBadges";
import { GeneratePairingModal } from "@/components/pairing/GeneratePairingModal";
import { EnterPairingModal } from "@/components/pairing/EnterPairingModal";
import { PairingHelpModal } from "@/components/pairing/PairingHelpModal";
import { loadPairedPartner } from "@/lib/pairing/partner-store";

export default function PairingPage() {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<"generate" | "enter" | "help" | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [alreadyPaired, setAlreadyPaired] = useState(false);

  useEffect(() => {
    async function checkExistingPairing() {
      try {
        const partner = await loadPairedPartner();
        if (partner) {
          setAlreadyPaired(true);
        }
      } catch {}
      setIsInitializing(false);
    }
    checkExistingPairing();
  }, []);

  const handlePairingComplete = () => {
    setActiveModal(null);
    router.push("/");
  };

  if (isInitializing) {
    return (
      <div className="w-full min-h-screen bg-[#040814] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-12 h-12 rounded-full border-3 border-teal-400 border-t-transparent animate-spin mb-4" />
        <p className="text-xs font-mono text-slate-400 animate-pulse">Initializing Between Us...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-[#040814] text-white flex flex-col items-center justify-between p-4 sm:p-6 overflow-x-hidden font-outfit select-none">
      {/* Ambient Background Radial Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/15 via-sky-900/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-500/15 via-blue-950/20 to-transparent pointer-events-none" />

      {/* Main Mobile App Container */}
      <div className="relative w-full max-w-md mx-auto min-h-[92vh] flex flex-col justify-between pt-2 pb-6 z-10">
        
        {/* Top Control Area */}
        <div className="w-full flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ENCRYPTED P2P</span>
          </div>
          <LanguageSelector />
        </div>

        {/* Branding & Subtitle */}
        <div className="w-full my-3">
          <PairingHeader />
        </div>

        {/* 3 Feature Pills: Voice Calls, Video Calls, Private & Secure */}
        <FeatureBadges />

        {/* Center Romantic Artwork Card */}
        <div className="relative w-full h-44 sm:h-52 rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl my-2 group">
          <Image
            src="/images/background-person.png"
            alt="Romantic couple sitting together watching sunset over lake"
            fill
            sizes="(max-width: 640px) 100vw, 448px"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
            priority
          />
          {/* Subtle Top & Bottom Gradient Blends */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#040814] via-transparent to-[#040814]/40" />
        </div>

        {/* Primary Action Controls */}
        <div className="w-full space-y-3 pt-2">
          
          {/* Button 1: Generate Pairing Code (Emerald/Green Emphasis) */}
          <button
            type="button"
            onClick={() => setActiveModal("generate")}
            aria-label="Generate Pairing Code"
            className="w-full py-4 px-5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-500 text-white font-semibold text-sm sm:text-base tracking-wide flex items-center justify-between shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] border border-emerald-400/40 cursor-pointer transition-all duration-300 active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span className="drop-shadow-sm font-bold">Generate Pairing Code</span>
            </div>
            <svg className="w-5 h-5 text-white/90 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Button 2: Enter Pairing Code (Blue Emphasis) */}
          <button
            type="button"
            onClick={() => setActiveModal("enter")}
            aria-label="Enter Pairing Code"
            className="w-full py-4 px-5 rounded-full bg-gradient-to-r from-sky-950/90 via-slate-900/90 to-blue-950/90 hover:from-sky-900 hover:via-slate-800 hover:to-blue-900 text-white font-semibold text-sm sm:text-base tracking-wide flex items-center justify-between border border-sky-500/40 hover:border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.2)] hover:shadow-[0_0_25px_rgba(56,189,248,0.35)] cursor-pointer transition-all duration-300 active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <span className="drop-shadow-sm font-bold text-sky-100">Enter Pairing Code</span>
            </div>
            <svg className="w-5 h-5 text-sky-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Separator Divider */}
          <div className="flex items-center justify-center gap-3 py-1">
            <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent flex-1" />
            <span className="text-[11px] font-medium text-slate-400">or</span>
            <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent flex-1" />
          </div>

          {/* Help Button */}
          <button
            type="button"
            onClick={() => setActiveModal("help")}
            aria-label="How pairing works"
            className="w-full py-2 flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-teal-300 transition-colors cursor-pointer group"
          >
            <div className="w-4 h-4 rounded-full border border-slate-600 group-hover:border-teal-400 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:text-teal-300 transition-colors">
              ?
            </div>
            <span className="font-medium underline-offset-4 group-hover:underline">
              How pairing works?
            </span>
          </button>
        </div>

        {/* Already Paired Quick Link (If device was previously paired) */}
        {alreadyPaired && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 cursor-pointer"
            >
              Already paired — Return to Home ❤️
            </button>
          </div>
        )}
      </div>

      {/* Interactive Modals */}
      <GeneratePairingModal
        isOpen={activeModal === "generate"}
        onClose={() => setActiveModal(null)}
        onPairingComplete={handlePairingComplete}
      />

      <EnterPairingModal
        isOpen={activeModal === "enter"}
        onClose={() => setActiveModal(null)}
        onPairingComplete={handlePairingComplete}
      />

      <PairingHelpModal
        isOpen={activeModal === "help"}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}
