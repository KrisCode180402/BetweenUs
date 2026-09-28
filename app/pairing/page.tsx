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
    <div className="relative w-full h-dvh min-h-dvh max-h-dvh bg-[#040814] text-white flex flex-col items-center justify-between p-3 sm:p-5 overflow-hidden font-outfit select-none">
      
      {/* Full-Screen Romantic Background Artwork (Starry Sky + Sunset Couple Lake) */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <Image
          src="/images/background-person.png"
          alt="Starry night sky and couple sunset background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_12%] w-full h-full"
        />
        {/* Soft Ambient Overlay for Optimal Legibility while Keeping Sunset & Couple Crisp */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#040814]/25 via-transparent to-[#040814]/90" />
      </div>

      {/* Main Mobile App Container (Constrained to fit viewport cleanly) */}
      <div className="relative w-full max-w-md mx-auto h-full flex flex-col justify-between pt-1 pb-3 z-10">
        
        {/* Top Header Row with Language Selector on Right */}
        <div className="w-full flex items-center justify-end pt-0.5 px-1">
          <LanguageSelector />
        </div>

        {/* Branding & Feature Group — Positioned over the lower heart glow as in 1 Pairing page.png */}
        <div className="w-full flex flex-col items-center mt-7 sm:mt-10">
          <PairingHeader />
          <FeatureBadges />
        </div>

        {/* Flexible Middle Open Area — Displays Romantic Couple Sunset Artwork */}
        <div className="w-full flex-1 min-h-[60px] pointer-events-none" />

        {/* Primary Action Controls (Positioned at bottom over dark shoreline) */}
        <div className="w-full space-y-2 pt-1">
          
          {/* Button 1: Generate Pairing Code (Emerald/Green Emphasis) */}
          <button
            type="button"
            onClick={() => setActiveModal("generate")}
            aria-label="Generate Pairing Code"
            className="w-full py-3 px-4 sm:py-3.5 sm:px-5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-500 text-white font-semibold text-sm sm:text-base tracking-wide flex items-center justify-between shadow-[0_0_22px_rgba(16,185,129,0.45)] hover:shadow-[0_0_32px_rgba(16,185,129,0.6)] border border-emerald-400/50 cursor-pointer transition-all duration-300 active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span className="drop-shadow-sm font-bold text-sm sm:text-base">Generate Pairing Code</span>
            </div>
            <svg className="w-4.5 h-4.5 text-white/90 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Button 2: Enter Pairing Code (Dark Blue Emphasis) */}
          <button
            type="button"
            onClick={() => setActiveModal("enter")}
            aria-label="Enter Pairing Code"
            className="w-full py-3 px-4 sm:py-3.5 sm:px-5 rounded-full bg-[#0B1A3A]/85 hover:bg-[#0F234D] text-white font-semibold text-sm sm:text-base tracking-wide flex items-center justify-between border border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_28px_rgba(6,182,212,0.45)] backdrop-blur-md cursor-pointer transition-all duration-300 active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <span className="drop-shadow-sm font-bold text-white text-sm sm:text-base">Enter Pairing Code</span>
            </div>
            <svg className="w-4.5 h-4.5 text-cyan-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Separator Divider */}
          <div className="flex items-center justify-center gap-3 py-0.5">
            <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent flex-1" />
            <span className="text-[11px] font-medium text-slate-400">or</span>
            <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent flex-1" />
          </div>

          {/* Help Button */}
          <button
            type="button"
            onClick={() => setActiveModal("help")}
            aria-label="How pairing works"
            className="w-full py-1 flex items-center justify-center gap-2 text-xs text-slate-300 hover:text-teal-300 transition-colors cursor-pointer group"
          >
            <div className="w-4 h-4 rounded-full border border-slate-500 group-hover:border-teal-400 flex items-center justify-center text-[10px] font-bold text-slate-300 group-hover:text-teal-300 transition-colors">
              ?
            </div>
            <span className="font-medium underline-offset-4 group-hover:underline">
              How pairing works?
            </span>
          </button>
        </div>

        {/* Already Paired Quick Link (If device was previously paired) */}
        {alreadyPaired && (
          <div className="mt-1 text-center">
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
