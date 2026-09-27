"use client";

import React from "react";

export const PairingHeader: React.FC = () => {
  return (
    <div className="w-full flex flex-col items-center text-center space-y-2 select-none z-10">
      {/* 3D Glowing Dual Hearts (Emerald Green + Sky Blue) */}
      <div className="relative w-20 h-16 sm:w-24 sm:h-20 flex items-center justify-center my-1">
        {/* Soft Radial Ambient Aura Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 via-teal-400/20 to-sky-500/30 rounded-full blur-xl animate-pulse-glow" />

        {/* Dual 3D Hearts SVG */}
        <svg
          className="relative z-10 w-16 h-14 sm:w-20 sm:h-16 drop-shadow-[0_0_16px_rgba(52,211,153,0.5)]"
          viewBox="0 0 100 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="emeraldHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="skyHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Left Emerald Heart */}
          <g filter="url(#glowGreen)">
            <path
              d="M38 15 C26 5, 12 18, 22 36 C30 50, 42 62, 44 64 C44 64, 40 50, 36 36 C34 26, 42 18, 44 18 C41 16, 39 15, 38 15 Z"
              fill="url(#emeraldHeartGrad)"
            />
            <path
              d="M32 12 C18 12, 10 24, 10 36 C10 52, 34 68, 42 74 C42 74, 14 56, 14 36 C14 26, 20 16, 30 14 C31 13, 31.5 12.5, 32 12 Z"
              fill="#6EE7B7"
              opacity="0.6"
            />
            <path
              d="M30 14 C18 14, 10 24, 10 36 C10 52, 38 70, 42 72 C46 70, 74 52, 74 36 C74 24, 66 14, 54 14 C46 14, 43 19, 42 22 C41 19, 38 14, 30 14 Z"
              fill="url(#emeraldHeartGrad)"
            />
          </g>

          {/* Right Sky Blue Heart (Overlapping right side) */}
          <g filter="url(#glowBlue)">
            <path
              d="M58 24 C48 24, 42 32, 42 42 C42 55, 64 70, 67 72 C70 70, 92 55, 92 42 C92 32, 86 24, 76 24 C70 24, 68 28, 67 30 C66 28, 64 24, 58 24 Z"
              fill="url(#skyHeartGrad)"
            />
            <path
              d="M58 24 C50 24, 44 30, 44 40 C44 50, 62 64, 67 68 C68 66, 68 64, 68 62 C64 58, 48 46, 48 38 C48 30, 52 26, 58 24 Z"
              fill="#7DD3FC"
              opacity="0.5"
            />
          </g>
        </svg>
      </div>

      {/* Script Title with Green Heart Outline */}
      <div className="flex items-center justify-center gap-2">
        <h1 className="font-script text-4xl sm:text-5xl font-normal text-white tracking-wide drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
          Between Us
        </h1>
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 fill-none stroke-current animate-pulse"
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
      <div className="flex items-center justify-center gap-1.5 text-slate-200/90 text-xs sm:text-sm font-medium tracking-wide">
        <span>Just the two of us</span>
        <svg
          className="w-3.5 h-3.5 text-emerald-400 fill-none stroke-current"
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
