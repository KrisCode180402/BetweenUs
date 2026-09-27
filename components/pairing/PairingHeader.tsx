"use client";

import React from "react";

export const PairingHeader: React.FC = () => {
  return (
    <div className="w-full flex flex-col items-center text-center space-y-0.5 select-none z-10 pt-1">
      {/* Title */}
      <div className="flex items-center justify-center gap-1.5">
        <h1 className="font-script text-3.5xl sm:text-4xl font-normal text-white tracking-wide drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
          Between Us
        </h1>
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 fill-none stroke-current animate-pulse drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]"
          viewBox="0 0 24 24"
          strokeWidth={2.2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </div>

      {/* Subtitle */}
      <div className="flex items-center justify-center gap-1 text-slate-200/90 text-xs font-medium tracking-wide">
        <span>Just the two of us</span>
        <svg
          className="w-3 h-3 text-emerald-400 fill-none stroke-current"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </div>
    </div>
  );
};
