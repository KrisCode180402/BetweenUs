"use client";

import React from "react";

export const PairingHeader: React.FC = () => {
  return (
    <div className="w-full flex flex-col items-center text-center space-y-2 select-none z-10">
      {/* 3D Glowing Dual Hearts Logo */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-1">
        {/* Ambient Radial Soft Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/40 via-teal-400/30 to-sky-500/40 rounded-full blur-xl animate-pulse-glow" />

        {/* Overlapping Dual 3D Hearts SVG */}
        <div className="relative z-10 flex items-center justify-center">
          <svg
            className="w-12 h-12 sm:w-16 sm:h-16 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="emeraldHeart" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="skyHeart" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
            </defs>

            {/* Left Emerald Heart */}
            <path
              d="M26 14C20.477 14 16 18.477 16 24C16 33.5 28 41 32 43.5C29 38 24 33 24 24C24 18.5 28.5 14 34 14C36.8 14 39.3 15.1 41 17C38 15 34 14 30 14Z"
              fill="url(#emeraldHeart)"
              opacity="0.95"
            />
            <path
              d="M28 12C21.373 12 16 17.373 16 24C16 34.5 30 43.5 32 45C34 43.5 48 34.5 48 24C48 17.373 42.627 12 36 12C32.1 12 28.7 13.9 26.6 16.8C25.4 13.9 22.4 12 18.8 12C12.3 12 7 17.3 7 23.8C7 34 20 42.5 22 43.8"
              stroke="#34D399"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Main Emerald Heart */}
            <path
              d="M24 16C18.477 16 14 20.477 14 26C14 36.5 28 44.5 30 46C30 46 22 37 22 26C22 20.5 26.5 16 32 16C35 16 37.5 17.5 39 19.5C36.5 17.2 33.2 16 29.5 16H24Z"
              fill="url(#emeraldHeart)"
            />

            {/* Right Sky Blue Heart */}
            <path
              d="M40 20C34.477 20 30 24.477 30 30C30 40.5 44 48.5 46 50C48 48.5 62 40.5 62 30C62 24.477 57.523 20 52 20C48.1 20 44.7 21.9 42.6 24.8C41.4 21.9 38.4 20 34.8 20"
              fill="url(#skyHeart)"
            />
          </svg>
        </div>
      </div>

      {/* Script Title with Green Heart Outline */}
      <div className="flex items-center justify-center gap-1.5">
        <h1 className="font-script text-4xl sm:text-5xl font-normal text-white tracking-wide drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          Between Us
        </h1>
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 fill-none stroke-current animate-pulse"
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

      {/* Subtitle */}
      <div className="flex items-center justify-center gap-1 text-slate-300/90 text-xs sm:text-sm font-medium tracking-wide">
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
