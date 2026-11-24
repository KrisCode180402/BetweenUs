"use client";

import React from "react";
import Image from "next/image";

interface PartnerStatusCardProps {
  myDeviceName: string;
  partnerName: string;
  myAvatarUrl?: string | undefined;
  partnerAvatarUrl?: string | undefined;
  isPaired: boolean;
  isVerified?: boolean | undefined;
  isOnline?: boolean | undefined;
  onPairClick?: (() => void) | undefined;
  onVerifyClick?: (() => void) | undefined;
}

export const PartnerStatusCard: React.FC<PartnerStatusCardProps> = ({
  myDeviceName,
  partnerName,
  myAvatarUrl,
  partnerAvatarUrl,
  isPaired,
  isVerified = true,
  isOnline = true,
  onPairClick,
  onVerifyClick,
}) => {
  return (
    <div className="w-full my-3 p-4 sm:p-5 rounded-[26px] bg-[#091325]/85 border border-slate-800/90 backdrop-blur-xl shadow-2xl select-none font-outfit">
      <div className="flex items-center justify-between px-1 py-1">
        {/* Left Profile: Local User */}
        <div className="flex flex-col items-center text-center flex-1">
          <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full border-2 border-cyan-400 p-0.5 shadow-[0_0_22px_rgba(34,211,238,0.45)]">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden relative">
              {myAvatarUrl ? (
                <Image
                  src={myAvatarUrl}
                  alt={myDeviceName}
                  fill
                  sizes="80px"
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-sky-950 to-slate-900 flex items-center justify-center text-sky-300 font-bold text-2xl">
                  {myDeviceName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <span className="text-sm font-bold text-white mt-2 tracking-wide">
            {myDeviceName}
          </span>
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online</span>
          </span>
        </div>

        {/* Center Section: Glowing Heart & Verification Badge */}
        <div className="flex flex-col items-center justify-center px-2 flex-shrink-0 text-center space-y-1.5">
          {/* Connector Dots + Glowing Pink Heart */}
          <div className="flex items-center justify-center gap-1.5 text-rose-400">
            <span className="w-1 h-1 rounded-full bg-rose-400/40" />
            <span className="w-1 h-1 rounded-full bg-rose-400/70" />
            <span className="text-xl sm:text-2xl animate-pulse drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]">
              💕
            </span>
            <span className="w-1 h-1 rounded-full bg-rose-400/70" />
            <span className="w-1 h-1 rounded-full bg-rose-400/40" />
          </div>

          {/* Verification Badge */}
          {isPaired ? (
            isVerified ? (
              <button
                type="button"
                onClick={onVerifyClick}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40 shadow-sm cursor-pointer hover:bg-emerald-900/80 transition-all"
              >
                <svg
                  className="w-3.5 h-3.5 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                </svg>
                <span>Paired & Verified</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onVerifyClick}
                className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/70 px-2.5 py-1 rounded-full border border-amber-500/40 shadow-sm cursor-pointer hover:bg-amber-900/80 transition-all"
              >
                <span>Verification Required</span>
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={onPairClick}
              className="flex items-center gap-1 text-[10px] font-bold text-sky-300 bg-sky-950/70 px-2.5 py-1 rounded-full border border-sky-500/40 shadow-sm cursor-pointer hover:bg-sky-900/80 transition-all"
            >
              <span>Pair Device</span>
            </button>
          )}

          <span className="text-[10px] text-slate-400 font-medium tracking-tight">
            End-to-End Encrypted
          </span>
        </div>

        {/* Right Profile: Partner User */}
        <div className="flex flex-col items-center text-center flex-1">
          <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full border-2 border-emerald-400 p-0.5 shadow-[0_0_22px_rgba(52,211,153,0.45)]">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden relative">
              {partnerAvatarUrl ? (
                <Image
                  src={partnerAvatarUrl}
                  alt={partnerName}
                  fill
                  sizes="80px"
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-emerald-950 to-slate-900 flex items-center justify-center text-emerald-300 font-bold text-2xl">
                  {partnerName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <span className="text-sm font-bold text-white mt-2 tracking-wide">
            {partnerName}
          </span>
          <span
            className={`text-xs font-medium flex items-center gap-1.5 mt-0.5 ${
              isPaired && isOnline ? "text-emerald-400" : "text-slate-400"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPaired && isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
              }`}
            />
            <span>{isPaired ? (isOnline ? "Online" : "Offline") : "Not Paired"}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
