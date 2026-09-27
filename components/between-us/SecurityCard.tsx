"use client";

import React from "react";

interface SecurityCardProps {
  partnerName: string;
  onClick: () => void;
}

export const SecurityCard: React.FC<SecurityCardProps> = ({
  partnerName,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label="Open privacy and security information"
      className="w-full mt-2 bg-[#091325]/85 hover:bg-[#0B182E] border border-teal-500/30 hover:border-teal-500/50 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between backdrop-blur-md transition-all duration-300 shadow-xl cursor-pointer group select-none active:scale-[0.99]"
    >
      <div className="flex items-center gap-3 sm:gap-3.5">
        {/* Lock Icon Circle Badge */}
        <div className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full bg-teal-500/20 border border-teal-400/50 flex items-center justify-center text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.35)] group-hover:scale-105 transition-transform flex-shrink-0">
          <svg
            className="w-5 h-5 fill-none stroke-current"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Text Content */}
        <div className="text-left">
          <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
            End-to-End Encrypted
          </h4>
          <p className="text-[11px] sm:text-xs text-slate-300/80 font-normal">
            Only you and {partnerName} can see and hear.
          </p>
        </div>
      </div>

      {/* Right Chevron Arrow */}
      <svg
        className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5l7 7-7 7"
        />
      </svg>
    </div>
  );
};
