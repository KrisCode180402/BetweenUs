"use client";

import React from "react";

export const FeatureBadges: React.FC = () => {
  return (
    <div className="w-full grid grid-cols-3 divide-x divide-slate-700/30 my-2 sm:my-3 z-10 select-none">
      {/* Voice Calls Badge */}
      <div className="flex flex-col items-center text-center px-1 py-1">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.35)] mb-1.5">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z" />
          </svg>
        </div>
        <h3 className="text-xs font-bold text-white tracking-tight leading-tight">Voice Calls</h3>
        <p className="text-[10px] text-slate-300/80 font-medium mt-0.5">Talk anytime</p>
      </div>

      {/* Video Calls Badge */}
      <div className="flex flex-col items-center text-center px-1 py-1">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-sky-500/20 border border-sky-400/50 flex items-center justify-center text-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.35)] mb-1.5">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
          </svg>
        </div>
        <h3 className="text-xs font-bold text-white tracking-tight leading-tight">Video Calls</h3>
        <p className="text-[10px] text-slate-300/80 font-medium mt-0.5">See each other</p>
      </div>

      {/* Private & Secure Badge */}
      <div className="flex flex-col items-center text-center px-1 py-1">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-teal-500/20 border border-teal-400/50 flex items-center justify-center text-teal-400 shadow-[0_0_18px_rgba(20,184,166,0.35)] mb-1.5">
          <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xs font-bold text-white tracking-tight leading-tight">Private & Secure</h3>
        <p className="text-[10px] text-slate-300/80 font-medium mt-0.5 leading-tight">Only for the two of us</p>
      </div>
    </div>
  );
};
