"use client";

import React from "react";
import Image from "next/image";

export type ConnectionStatusType = "connected" | "connecting" | "offline";

interface PartnerConnectionProps {
  partnerName: string;
  avatarUrl?: string | undefined;
  status?: ConnectionStatusType | undefined;
  customStatusText?: string | undefined;
}

export const PartnerConnection: React.FC<PartnerConnectionProps> = ({
  partnerName,
  avatarUrl,
  status = "connected",
  customStatusText,
}) => {
  const isOnline = status === "connected";
  const isConnecting = status === "connecting";

  // Status text fallback
  const displayStatusText =
    customStatusText ||
    (isOnline
      ? "Online · Ready to call"
      : isConnecting
      ? "Connecting…"
      : "Offline");

  // Dot color styles
  const dotColorClass = isOnline
    ? "bg-emerald-400 border-emerald-300 shadow-[0_0_10px_#10b981]"
    : isConnecting
    ? "bg-amber-400 border-amber-300 shadow-[0_0_10px_#f59e0b]"
    : "bg-slate-500 border-slate-400";

  return (
    <section className="w-full flex flex-col items-center justify-center my-2 sm:my-3 select-none flex-shrink-0">
      {/* Avatar Container with Golden/Emerald Halo Ring */}
      <div className="relative">
        {/* Outer glowing border halo ring */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-[3px] bg-gradient-to-tr from-amber-400/90 via-emerald-400 to-sky-400 shadow-[0_0_30px_rgba(245,158,11,0.35)]">
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden border-2 border-slate-900/90 relative">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={partnerName}
                fill
                sizes="128px"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-teal-900 via-slate-900 to-indigo-950 flex items-center justify-center text-white font-bold text-3xl sm:text-4xl select-none shadow-inner">
                {partnerName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Online / Connection Status Dot Badge */}
          <span
            className={`absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full border-3 border-[#040814] ${dotColorClass} ${
              isOnline || isConnecting ? "animate-pulse" : ""
            }`}
          />
        </div>

        {/* Small floating pink heart accent */}
        <div className="absolute -top-1 -right-2 text-rose-400 text-base animate-bounce duration-1000">
          💕
        </div>
      </div>

      {/* Partner Name Display */}
      <h2 className="font-script text-3xl sm:text-4xl text-white font-normal mt-2 tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] flex items-center gap-1.5">
        <span>{partnerName}</span>
        <span className="text-rose-400 text-xl sm:text-2xl">♡</span>
      </h2>

      {/* Connection Status Pill */}
      <div
        className={`mt-1.5 px-3.5 py-0.5 rounded-full bg-slate-900/75 border backdrop-blur-md flex items-center gap-2 text-xs font-semibold shadow-md transition-colors ${
          isOnline
            ? "border-emerald-500/40 text-emerald-300"
            : isConnecting
            ? "border-amber-500/40 text-amber-300"
            : "border-slate-700/50 text-slate-400"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isOnline
              ? "bg-emerald-400 animate-pulse"
              : isConnecting
              ? "bg-amber-400 animate-ping"
              : "bg-slate-500"
          }`}
        />
        <span>{displayStatusText}</span>
      </div>
    </section>
  );
};
