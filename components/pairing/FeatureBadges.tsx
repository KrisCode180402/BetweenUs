"use client";

import React from "react";

export const FeatureBadges: React.FC = () => {
  return (
    <div className="w-full grid grid-cols-3 gap-2 sm:gap-3 my-3 sm:my-4 z-10 select-none">
      {/* Voice Calls */}
      <div className="flex flex-col items-center text-center p-2.5 sm:p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 backdrop-blur-md hover:border-emerald-500/30 transition-all duration-300">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] mb-2">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
            <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z" />
          </svg>
        </div>
        <h3 className="text-[11px] sm:text-xs font-semibold text-white tracking-tight">Voice Calls</h3>
        <p className="text-[9px] sm:text-[10px] text-slate-400 font-normal">Talk anytime</p>
      </div>

      {/* Video Calls */}
      <div className="flex flex-col items-center text-center p-2.5 sm:p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 backdrop-blur-md hover:border-sky-500/30 transition-all duration-300">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.3)] mb-2">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
          </svg>
        </div>
        <h3 className="text-[11px] sm:text-xs font-semibold text-white tracking-tight">Video Calls</h3>
        <p className="text-[9px] sm:text-[10px] text-slate-400 font-normal">See each other</p>
      </div>

      {/* Private & Secure */}
      <div className="flex flex-col items-center text-center p-2.5 sm:p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 backdrop-blur-md hover:border-teal-500/30 transition-all duration-300">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.3)] mb-2">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-[11px] sm:text-xs font-semibold text-white tracking-tight">Private & Secure</h3>
        <p className="text-[9px] sm:text-[10px] text-slate-400 font-normal">Only for the two of us</p>
      </div>
    </div>
  );
};
