"use client";

import React from "react";

export const PairingHeader: React.FC = () => {
  return (
    <div className="w-full flex flex-col items-center text-center space-y-1 select-none z-10 pt-16 sm:pt-20">
      {/* Main Title: Between Us ♡ */}
      <div className="flex items-center justify-center gap-2">
        <h1 className="font-script text-5xl sm:text-6xl text-white tracking-wide drop-shadow-[0_0_28px_rgba(255,255,255,0.95)] leading-none">
          Between Us
        </h1>
        <span className="text-emerald-400 text-2xl sm:text-3xl font-normal drop-shadow-[0_0_14px_rgba(52,211,153,0.9)] -mt-2">
          ♡
        </span>
      </div>

      {/* Subtitle: Just the two of us ♡ */}
      <div className="flex items-center justify-center gap-1.5 text-teal-300/95 text-xs sm:text-sm font-medium tracking-wide pt-0.5">
        <span>Just the two of us</span>
        <span className="text-emerald-400 text-xs sm:text-sm font-normal">
          ♡
        </span>
      </div>
    </div>
  );
};

