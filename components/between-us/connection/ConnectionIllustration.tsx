"use client";

import React from "react";

export const ConnectionIllustration: React.FC = () => {
  return (
    <div className="relative w-full flex flex-col items-center justify-center my-3 select-none">
      {/* Outer ambient glow effect */}
      <div className="absolute w-44 h-28 bg-rose-500/20 rounded-full blur-2xl -z-10 animate-pulse pointer-events-none" />

      {/* Main Illustration Container */}
      <div className="relative w-40 h-28 flex items-center justify-center">
        {/* Soft Twinkling Background Stars */}
        <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-amber-200 rounded-full animate-ping opacity-75" />
        <div className="absolute top-6 right-1 w-1 h-1 bg-sky-200 rounded-full animate-pulse opacity-80" />
        <div className="absolute bottom-2 left-4 w-1 h-1 bg-rose-200 rounded-full animate-pulse opacity-60" />

        {/* Sad Glowing Cloud Base */}
        <div className="relative w-32 h-20 rounded-full bg-gradient-to-br from-rose-500/35 via-rose-600/30 to-pink-900/40 border border-rose-400/60 shadow-[0_0_30px_rgba(244,63,94,0.45)] backdrop-blur-md flex flex-col items-center justify-center motion-reduce:animate-none animate-bounce-slow">
          {/* Top Cloud Bulge */}
          <div className="absolute -top-4 left-6 w-14 h-14 rounded-full bg-gradient-to-b from-rose-400/40 to-rose-600/30 border-t border-rose-300/50" />
          <div className="absolute -top-2 right-6 w-10 h-10 rounded-full bg-gradient-to-b from-rose-400/35 to-rose-600/30 border-t border-rose-300/50" />

          {/* Sad Face Features */}
          <div className="relative z-10 flex flex-col items-center pt-2">
            {/* Sad Eyes */}
            <div className="flex gap-4 mb-1">
              {/* Left closed sad eye arc */}
              <div className="w-3.5 h-2 border-t-2 border-rose-200 rounded-t-full rotate-6" />
              {/* Right closed sad eye arc */}
              <div className="w-3.5 h-2 border-t-2 border-rose-200 rounded-t-full -rotate-6" />
            </div>

            {/* Sad Mouth Curve */}
            <div className="w-4 h-2 border-t-2 border-rose-300 rounded-t-full mt-0.5" />
          </div>

          {/* Wi-Fi Signal Arcs attached to Cloud Right */}
          <div className="absolute -right-3 top-2 flex flex-col items-center transform rotate-45 text-sky-400 opacity-90 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0" />
            </svg>
          </div>
        </div>

        {/* Broken Glowing Pink Heart floating top-right */}
        <div className="absolute top-0 right-2 transform translate-x-2 -translate-y-2 z-20">
          <div className="relative flex items-center justify-center">
            {/* Heart Glow */}
            <div className="absolute inset-0 bg-rose-500/40 rounded-full blur-md" />
            <svg
              className="w-8 h-8 text-rose-400 fill-current drop-shadow-[0_0_12px_rgba(244,63,94,0.9)] motion-reduce:animate-none animate-pulse"
              viewBox="0 0 24 24"
            >
              {/* Left half of broken heart */}
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09L11 8l2-2-1 4 2-1-2 5h2L12 21.35z" />
              {/* Right half of broken heart offset slightly */}
              <path d="M12.5 5.09C13.59 3.81 15.26 3 17 3c3.08 0 5.5 2.42 5.5 5.5 0 3.78-3.4 6.86-8.55 11.54L13.5 18l1.5-3-2 1 1-4-2 2 1-3.91z" opacity={0.9} />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
