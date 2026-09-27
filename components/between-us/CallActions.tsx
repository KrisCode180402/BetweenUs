"use client";

import React from "react";

interface CallActionsProps {
  onInitiateAudioCall: () => void;
  onInitiateVideoCall: () => void;
  disabled?: boolean | undefined;
}

export const CallActions: React.FC<CallActionsProps> = ({
  onInitiateAudioCall,
  onInitiateVideoCall,
  disabled = false,
}) => {
  return (
    <section className="grid grid-cols-2 gap-3.5 sm:gap-4.5 w-full my-2 sm:my-3 select-none">
      {/* LEFT: Audio Call Card (Green Gradient) */}
      <button
        type="button"
        onClick={onInitiateAudioCall}
        disabled={disabled}
        aria-label="Start audio call"
        className={`flex flex-col items-center justify-between p-5 rounded-3xl text-white border transition-all duration-300 active:scale-[0.97] group min-h-[160px] sm:min-h-[175px] ${
          disabled
            ? "opacity-60 cursor-not-allowed bg-gradient-to-b from-emerald-800/40 via-teal-900/40 to-slate-900/60 border-emerald-800/30"
            : "bg-gradient-to-b from-emerald-500 via-teal-600 to-emerald-700 hover:from-emerald-400 hover:via-teal-500 hover:to-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.45)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] border-emerald-400/50 cursor-pointer"
        }`}
      >
        {/* Circle Telephone Icon */}
        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform mt-1">
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z" />
          </svg>
        </div>

        {/* Text Details */}
        <div className="text-center mb-1">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
            Audio Call
          </h3>
          <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
            Talk anytime
          </p>
        </div>
      </button>

      {/* RIGHT: Video Call Card (Blue Gradient) */}
      <button
        type="button"
        onClick={onInitiateVideoCall}
        disabled={disabled}
        aria-label="Start video call"
        className={`flex flex-col items-center justify-between p-5 rounded-3xl text-white border transition-all duration-300 active:scale-[0.97] group min-h-[160px] sm:min-h-[175px] ${
          disabled
            ? "opacity-60 cursor-not-allowed bg-gradient-to-b from-sky-900/40 via-blue-950/40 to-slate-900/60 border-sky-800/30"
            : "bg-gradient-to-b from-sky-500 via-blue-600 to-indigo-700 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-600 shadow-[0_0_30px_rgba(56,189,248,0.45)] hover:shadow-[0_0_40px_rgba(56,189,248,0.6)] border-sky-400/50 cursor-pointer"
        }`}
      >
        {/* Circle Video Camera Icon */}
        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform mt-1">
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
          </svg>
        </div>

        {/* Text Details */}
        <div className="text-center mb-1">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
            Video Call
          </h3>
          <p className="text-xs text-sky-100/90 font-medium mt-0.5">
            See each other
          </p>
        </div>
      </button>
    </section>
  );
};
