"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { SettingsModal } from "@/components/between-us/SettingsModal";
import { ConnectionIllustration } from "./ConnectionIllustration";
import { DiagnosticCard } from "./DiagnosticCard";
import { HelpModal } from "./HelpModal";
import {
  runAllDiagnostics,
  DiagnosticsSummary,
} from "@/lib/connection/diagnostics";

interface ConnectionErrorPageProps {
  initialTitle?: string | undefined;
  initialMessage?: string | undefined;
  onRetrySuccess?: (() => void) | undefined;
  onReturnHome?: (() => void) | undefined;
}

export const ConnectionErrorPage: React.FC<ConnectionErrorPageProps> = ({
  initialTitle = "Connection Failed",
  initialMessage = "We couldn’t establish a connection right now.\nPlease try again.",
  onRetrySuccess,
  onReturnHome,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const reasonParam = searchParams?.get("reason") || null;
  const typeParam = (searchParams?.get("type") as "audio" | "video") || "general";

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const [diagnostics, setDiagnostics] = useState<DiagnosticsSummary>({
    internet: {
      status: "disconnected",
      title: "No Internet Connection",
      message: "Check your Wi-Fi or mobile data.",
    },
    signaling: {
      status: "unavailable",
      title: "Signaling Server Unavailable",
      message: "Please try again in a few moments.",
    },
    turn: {
      status: "failed",
      title: "TURN Connection Failed",
      message: "Your network may be blocking calls.",
    },
    media: {
      status: "permission-denied",
      title: "Camera or Microphone Unavailable",
      message: "Check app permissions in settings.",
    },
    timestamp: Date.now(),
  });

  // Run initial diagnostic check on mount
  const executeDiagnostics = useCallback(
    async (showFeedback = false) => {
      setIsChecking(true);
      setFeedbackMessage(null);

      try {
        const summary = await runAllDiagnostics(reasonParam, typeParam);
        setDiagnostics(summary);

        if (showFeedback) {
          const allHealthy =
            summary.internet.status === "connected" &&
            summary.signaling.status === "connected" &&
            (summary.turn.status === "available" || summary.turn.status === "not-required") &&
            (summary.media.status === "available" || summary.media.status === "permission-required");

          if (allHealthy) {
            setFeedbackMessage("All network & device checks passed!");
          } else {
            setFeedbackMessage("Diagnostic check complete. Issues found below.");
          }
        }
      } catch {
        // Fallback
      } finally {
        setIsChecking(false);
      }
    },
    [reasonParam, typeParam]
  );

  useEffect(() => {
    executeDiagnostics(false);

    // Auto update internet status on window online/offline events
    const handleOnline = () => executeDiagnostics(false);
    const handleOffline = () => {
      setDiagnostics((prev) => ({
        ...prev,
        internet: {
          status: "disconnected",
          title: "No Internet Connection",
          message: "Check your Wi-Fi or mobile data.",
        },
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [executeDiagnostics]);

  // Primary Action: Try Again
  const handleTryAgain = async () => {
    if (isChecking) return;
    setIsChecking(true);
    setFeedbackMessage(null);

    const summary = await runAllDiagnostics(reasonParam, typeParam);
    setDiagnostics(summary);
    setIsChecking(false);

    const isRecovered =
      summary.internet.status === "connected" &&
      summary.signaling.status === "connected" &&
      (summary.turn.status === "available" || summary.turn.status === "not-required") &&
      summary.media.status === "available";

    if (isRecovered) {
      if (onRetrySuccess) {
        onRetrySuccess();
      } else if (typeParam === "audio" || typeParam === "video") {
        router.push(`/call/${typeParam}`);
      } else {
        router.push("/home");
      }
    } else {
      setFeedbackMessage("Connection still unreachable. Please review highlighted items below.");
    }
  };

  // Secondary Action: Check Connection
  const handleCheckConnection = () => {
    executeDiagnostics(true);
  };

  const handleReturnHomeAction = () => {
    if (onReturnHome) {
      onReturnHome();
    } else {
      router.push("/home");
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-[#040814] text-white flex flex-col items-center justify-between p-4 sm:p-6 overflow-x-hidden font-outfit select-none">
      {/* Background Artwork */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <Image
          src="/images/background.png"
          alt="Between Us Sunset Sky"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_30%] w-full h-full opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040814]/65 via-[#040814]/40 to-[#040814]/95" />
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-md mx-auto min-h-[95vh] flex flex-col justify-between pt-1 pb-4 z-10">
        
        {/* 1. TOP HEADER BAR */}
        <div className="w-full flex items-center justify-between pt-1">
          {/* Settings gear left */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Open Settings"
            className="w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-800/90 border border-slate-700/60 backdrop-blur-md flex items-center justify-center text-slate-200 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Title Centered */}
          <div className="text-center">
            <h1 className="font-script text-3.5xl font-normal text-white tracking-wide drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
              Between Us <span className="text-rose-400">💕</span>
            </h1>
            <p className="text-[11px] text-slate-200/90 font-medium tracking-wide">
              Just the two of us <span className="text-rose-400">♡</span>
            </p>
          </div>

          {/* Glowing Green/Teal Heart Badge Right */}
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/50 backdrop-blur-md flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.35)]">
            <svg className="w-5 h-5 fill-current animate-pulse" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        </div>

        {/* 2. CONNECTION ERROR ILLUSTRATION & HEADINGS */}
        <div className="w-full flex flex-col items-center justify-center text-center my-1.5">
          <ConnectionIllustration />

          <h2 className="text-2.5xl font-bold text-white tracking-wide mt-1">
            {initialTitle}
          </h2>
          <p className="text-xs text-slate-300/85 font-medium max-w-xs mt-1 leading-relaxed whitespace-pre-line">
            {initialMessage}
          </p>
        </div>

        {/* 3. AUTOMATIC CONNECTION DIAGNOSTICS (4 STATUS CARDS) */}
        <div className="w-full space-y-2 my-2">
          {/* A. Internet Connection */}
          <DiagnosticCard
            type="internet"
            status={diagnostics.internet.status}
            title={diagnostics.internet.title}
            message={diagnostics.internet.message}
            isChecking={isChecking}
          />

          {/* B. Signaling Server */}
          <DiagnosticCard
            type="signaling"
            status={diagnostics.signaling.status}
            title={diagnostics.signaling.title}
            message={diagnostics.signaling.message}
            isChecking={isChecking}
          />

          {/* C. TURN Connection */}
          <DiagnosticCard
            type="turn"
            status={diagnostics.turn.status}
            title={diagnostics.turn.title}
            message={diagnostics.turn.message}
            isChecking={isChecking}
          />

          {/* D. Camera or Microphone */}
          <DiagnosticCard
            type="media"
            status={diagnostics.media.status}
            title={diagnostics.media.title}
            message={diagnostics.media.message}
            isChecking={isChecking}
          />
        </div>

        {/* Feedback message if check connection pressed */}
        {feedbackMessage && (
          <p className="text-[11px] font-medium text-sky-400 text-center animate-fade-in px-2 my-0.5">
            {feedbackMessage}
          </p>
        )}

        {/* 4 & 5. PRIMARY & SECONDARY ACTION BUTTONS */}
        <div className="w-full space-y-2.5 pt-1">
          {/* Primary Action: Try Again */}
          <button
            type="button"
            onClick={handleTryAgain}
            disabled={isChecking}
            aria-label="Try Again"
            className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-500 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(16,185,129,0.45)] border border-emerald-400/40 cursor-pointer transition-all duration-300 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
          >
            <svg
              className={`w-4.5 h-4.5 ${isChecking ? "animate-spin" : "motion-reduce:animate-none animate-spin-slow"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isChecking ? "Checking..." : "Try Again"}</span>
          </button>

          {/* Secondary Action: Check Connection */}
          <button
            type="button"
            onClick={handleCheckConnection}
            disabled={isChecking}
            aria-label="Check Connection"
            className="w-full py-3.5 px-6 rounded-full bg-[#091325]/90 hover:bg-[#0B182E] text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 border border-slate-700/80 backdrop-blur-md cursor-pointer transition-all duration-300 active:scale-[0.98] disabled:opacity-70"
          >
            <svg className="w-4.5 h-4.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Check Connection</span>
          </button>
        </div>

        {/* 6. BOTTOM ACTIONS GRID (SETTINGS, HELP, RETURN HOME) */}
        <div className="w-full grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 mt-2 text-center text-xs">
          {/* Action A: Settings */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Go to Settings"
            className="flex flex-col items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer py-1 group"
          >
            <div className="w-9 h-9 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-center mb-1 group-hover:bg-slate-700/70 transition-colors">
              <svg className="w-4.5 h-4.5 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-[10.5px] font-medium text-slate-300">Go to Settings</span>
          </button>

          {/* Action B: Help */}
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            aria-label="Get Help"
            className="flex flex-col items-center justify-center text-slate-300 hover:text-sky-300 transition-colors cursor-pointer py-1 group"
          >
            <div className="w-9 h-9 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-center mb-1 group-hover:bg-slate-700/70 transition-colors">
              <span className="w-4.5 h-4.5 rounded-full border border-sky-400 text-sky-400 flex items-center justify-center text-[10px] font-bold">
                ?
              </span>
            </div>
            <span className="text-[10.5px] font-medium text-slate-300">Get Help</span>
          </button>

          {/* Action C: Return Home */}
          <button
            type="button"
            onClick={handleReturnHomeAction}
            aria-label="Return Home"
            className="flex flex-col items-center justify-center text-slate-300 hover:text-rose-300 transition-colors cursor-pointer py-1 group"
          >
            <div className="w-9 h-9 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-1 group-hover:bg-rose-500/30 transition-colors text-rose-400">
              <svg className="w-4.5 h-4.5 transform rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
            </div>
            <span className="text-[10.5px] font-medium text-slate-300">Return Home</span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};
