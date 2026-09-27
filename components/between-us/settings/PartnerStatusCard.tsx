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
    <div className="w-full my-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#0B172A]/90 via-[#091325]/90 to-[#0A1222]/90 border border-teal-500/30 backdrop-blur-xl shadow-2xl select-none">
      <div className="flex items-center justify-between px-1 py-1">
        {/* Local User (My Device) */}
        <div className="flex flex-col items-center text-center flex-1">
          <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-sky-400 p-[2px] shadow-[0_0_20px_rgba(56,189,248,0.35)]">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden relative">
              {myAvatarUrl ? (
                <Image
                  src={myAvatarUrl}
                  alt={myDeviceName}
                  fill
                  sizes="72px"
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-sky-950 to-slate-900 flex items-center justify-center text-sky-300 font-bold text-xl sm:text-2xl">
                  {myDeviceName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {/* Online Green Indicator */}
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#091325] shadow-md animate-pulse" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white mt-2 tracking-wide">
            {myDeviceName}
          </span>
          <span className="text-[10px] sm:text-xs text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Online</span>
          </span>
        </div>

        {/* Center Glowing Heart & Encryption Status */}
        <div className="flex flex-col items-center justify-center px-2 flex-shrink-0 text-center">
          <div className="relative mb-1">
            <svg
              className="w-7 h-7 sm:w-8 sm:h-8 text-rose-400 fill-current animate-pulse drop-shadow-[0_0_12px_rgba(251,113,133,0.7)]"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>

          {isPaired ? (
            isVerified ? (
              <div
                onClick={onVerifyClick}
                className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-400 bg-emerald-950/70 px-2.5 py-1 rounded-full border border-emerald-500/40 shadow-sm cursor-pointer hover:bg-emerald-900/80 transition-all"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span>Paired & Verified</span>
              </div>
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

          <span className="text-[10px] text-slate-300/80 font-mono mt-1 tracking-tight">
            End-to-End Encrypted
          </span>
        </div>

        {/* Partner Device */}
        <div className="flex flex-col items-center text-center flex-1">
          <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-emerald-400 p-[2px] shadow-[0_0_20px_rgba(52,211,153,0.35)]">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden relative">
              {partnerAvatarUrl ? (
                <Image
                  src={partnerAvatarUrl}
                  alt={partnerName}
                  fill
                  sizes="72px"
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-emerald-950 to-slate-900 flex items-center justify-center text-emerald-300 font-bold text-xl sm:text-2xl">
                  {partnerName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {/* Online Green Indicator */}
            {isPaired && (
              <span
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#091325] shadow-md ${
                  isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                }`}
              />
            )}
          </div>
          <span className="text-xs sm:text-sm font-bold text-white mt-2 tracking-wide">
            {partnerName}
          </span>
          <span
            className={`text-[10px] sm:text-xs font-medium flex items-center gap-1 mt-0.5 ${
              isPaired
                ? isOnline
                  ? "text-emerald-400"
                  : "text-slate-400"
                : "text-slate-500"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPaired && isOnline ? "bg-emerald-400" : "bg-slate-500"
              }`}
            />
            <span>{isPaired ? (isOnline ? "Online" : "Offline") : "Not Paired"}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
