"use client";

import React from "react";

interface HomeHeaderProps {
  onOpenSettings: () => void;
  onHeartClick?: (() => void) | undefined;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  onOpenSettings,
}) => {
  return (
    <header className="w-full flex items-center justify-between pt-1 pb-2 px-1 select-none">
      {/* Settings Button (Top Left) */}
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="Open settings"
        className="w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-800/80 border border-white/15 backdrop-blur-md flex items-center justify-center text-slate-200 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Center Brand Title */}
      <div className="text-center flex flex-col items-center">
        <h1 className="font-script text-3.5xl sm:text-4.5xl font-normal text-white tracking-wide drop-shadow-[0_0_18px_rgba(255,255,255,0.7)] flex items-center justify-center gap-1.5">
          Between Us <span className="text-emerald-400 text-xl font-normal">♡</span>
        </h1>
        <p className="text-[11px] text-teal-300/90 font-medium tracking-wide flex items-center gap-1 mt-0.5">
          Just the two of us <span className="text-emerald-400">♡</span>
        </p>
      </div>

      {/* Balance Spacer (Top Right) */}
      <div className="w-10 h-10 pointer-events-none" />
    </header>
  );
};
