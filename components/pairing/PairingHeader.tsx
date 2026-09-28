"use client";

import React from "react";

export const PairingHeader: React.FC = () => {
  return (
    <div className="w-full flex flex-col items-center text-center space-y-0.5 select-none z-10">
      {/* Twin Glowing Hearts Emblem (Matching 1 Pairing page.png top reference) */}
      <div className="relative w-20 h-14 sm:w-24 sm:h-16 flex items-center justify-center my-0.5">
        {/* Soft Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 via-teal-400/20 to-sky-500/30 rounded-full blur-xl animate-pulse pointer-events-none" />

        {/* Left Green Heart */}
        <svg
          className="absolute left-1 top-0 w-10 h-10 sm:w-12 sm:h-12 text-emerald-400 fill-current drop-shadow-[0_0_16px_rgba(16,185,129,0.85)] -rotate-12 transition-transform hover:scale-105"
          viewBox="0 0 24 24"
        >
          <defs>
            <linearGradient id="greenHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <path
            fill="url(#greenHeartGrad)"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>

        {/* Right Blue Heart */}
        <svg
          className="absolute right-1 bottom-0 w-10 h-10 sm:w-12 sm:h-12 text-sky-400 fill-current drop-shadow-[0_0_16px_rgba(56,189,248,0.85)] rotate-12 transition-transform hover:scale-105"
          viewBox="0 0 24 24"
        >
          <defs>
            <linearGradient id="blueHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <path
            fill="url(#blueHeartGrad)"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
      </div>

      {/* Main Title: Between Us ♡ */}
      <div className="flex items-center justify-center gap-1.5">
        <h1 className="font-script text-3.5xl sm:text-4.5xl font-normal text-white tracking-wide drop-shadow-[0_0_18px_rgba(255,255,255,0.7)] leading-tight">
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

      {/* Subtitle: Just the two of us ♡ */}
      <div className="flex items-center justify-center gap-1 text-teal-300/95 text-xs sm:text-sm font-medium tracking-wide">
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

