"use client";

import React from "react";
import { DiagnosticStatus } from "@/lib/connection/diagnostics";

interface DiagnosticCardProps {
  type: "internet" | "signaling" | "turn" | "media";
  status: DiagnosticStatus;
  title: string;
  message: string;
  isChecking?: boolean;
}

export const DiagnosticCard: React.FC<DiagnosticCardProps> = ({
  type,
  status,
  title,
  message,
  isChecking = false,
}) => {
  // Determine badge color styles based on type and status
  const getBadgeStyle = () => {
    if (isChecking || status === "checking" || status === "connecting") {
      return {
        container: "bg-sky-500/15 border-sky-400/40 text-sky-300 animate-pulse",
        iconColor: "text-sky-300",
        pill: "bg-sky-500/20 text-sky-300 border-sky-400/30",
        pillText: "Checking...",
      };
    }

    if (status === "connected" || status === "available") {
      return {
        container: "bg-emerald-500/15 border-emerald-500/35 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
        iconColor: "text-emerald-400",
        pill: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
        pillText: "Healthy",
      };
    }

    switch (type) {
      case "internet":
        return {
          container: "bg-rose-500/15 border-rose-500/35 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)]",
          iconColor: "text-rose-400",
          pill: "bg-rose-500/20 text-rose-300 border-rose-400/30",
          pillText: "Offline",
        };
      case "signaling":
        return {
          container: "bg-sky-500/15 border-sky-500/35 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.2)]",
          iconColor: "text-sky-400",
          pill: "bg-sky-500/20 text-sky-300 border-sky-400/30",
          pillText: status === "timeout" ? "Timeout" : "Unavailable",
        };
      case "turn":
        return {
          container: "bg-amber-500/15 border-amber-500/35 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]",
          iconColor: "text-amber-400",
          pill: "bg-amber-500/20 text-amber-300 border-amber-400/30",
          pillText: "Failed",
        };
      case "media":
        return {
          container: "bg-purple-500/15 border-purple-500/35 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.2)]",
          iconColor: "text-purple-400",
          pill: "bg-purple-500/20 text-purple-300 border-purple-400/30",
          pillText: status === "permission-denied" ? "Denied" : "Unavailable",
        };
    }
  };

  const style = getBadgeStyle();

  // Render proper icon per type
  const renderIcon = () => {
    switch (type) {
      case "internet":
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        );
      case "signaling":
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
          </svg>
        );
      case "turn":
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case "media":
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="w-full p-3 sm:p-3.5 rounded-2xl bg-[#091325]/85 border border-slate-800/80 backdrop-blur-md flex items-center justify-between gap-3 transition-all duration-300 hover:border-slate-700/80 shadow-md">
      <div className="flex items-center gap-3 min-w-0">
        {/* Icon Badge */}
        <div className={`w-9.5 h-9.5 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${style.container}`}>
          {renderIcon()}
        </div>

        {/* Text Details */}
        <div className="text-left min-w-0">
          <h3 className="text-xs sm:text-[13px] font-bold text-white tracking-wide truncate">
            {title}
          </h3>
          <p className="text-[10px] sm:text-[11px] text-slate-400/90 font-medium leading-tight truncate mt-0.5">
            {message}
          </p>
        </div>
      </div>

      {/* Right Status Indicator Pill */}
      <div className={`px-2 py-0.5 rounded-full border text-[9px] font-semibold tracking-wider uppercase shrink-0 ${style.pill}`}>
        {style.pillText}
      </div>
    </div>
  );
};
