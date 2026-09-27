"use client";

import React, { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Check if app is running in standalone mode (already installed & opened as PWA)
    const isInStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    setIsStandalone(isInStandaloneMode);

    // 2. Check dismissal state
    const wasDismissed = localStorage.getItem("between_us_pwa_dismissed") === "true";
    setDismissed(wasDismissed);

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent;
    const isIosDevice = /iPhone|iPad|iPod/i.test(userAgent) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // 4. Capture beforeinstallprompt for Android Chrome / Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(!showIosGuide);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("between_us_pwa_dismissed", "true");
  };

  // Do not render if standalone, dismissed, or installation prompt unavailable (and not iOS)
  if (isStandalone || dismissed || (!deferredPrompt && !isIos)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto animate-fade-in font-outfit select-none">
      <div className="bg-[#091325]/95 border border-emerald-500/40 rounded-3xl p-4 text-white shadow-2xl backdrop-blur-xl relative overflow-hidden">
        
        {/* Close / Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss installation prompt"
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3.5 pr-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
            <svg className="w-6 h-6 text-rose-400 fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold text-white tracking-wide">
              Install Between Us App
            </h3>
            <p className="text-[11px] text-slate-300 truncate">
              Install for full-screen calling & fast access.
            </p>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 transition-all cursor-pointer whitespace-nowrap"
          >
            {isIos ? "How to Install" : "Install"}
          </button>
        </div>

        {/* iOS Step-by-Step Guide Dropdown */}
        {isIos && showIosGuide && (
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-300 space-y-1.5 animate-fade-in">
            <p className="font-semibold text-emerald-300">To install on iPhone or iPad:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>Tap the <strong className="text-white">Share</strong> button in Safari toolbar.</li>
              <li>Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
