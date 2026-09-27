"use client";

import React from "react";

export type SettingsTabType =
  | "device"
  | "pairing"
  | "privacy"
  | "permissions"
  | "notifications"
  | "security"
  | "reset"
  | null;

interface SettingsNavigationListProps {
  onSelectTab: (tab: SettingsTabType) => void;
}

export const SettingsNavigationList: React.FC<SettingsNavigationListProps> = ({
  onSelectTab,
}) => {
  return (
    <div className="w-full space-y-2.5 sm:space-y-3 select-none">
      {/* 1. Device (Blue Theme) */}
      <button
        type="button"
        onClick={() => onSelectTab("device")}
        aria-label="Manage your device identity"
        className="w-full p-3.5 sm:p-4 rounded-2.5xl bg-[#091325]/85 hover:bg-[#0B182E] border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-all duration-300 cursor-pointer group active:scale-[0.99] shadow-lg"
      >
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)] group-hover:scale-105 transition-transform flex-shrink-0">
            <svg
              className="w-5 h-5 sm:w-5.5 sm:h-5.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Device
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 font-normal">
              Manage your device identity
            </p>
          </div>
        </div>
        <svg
          className="w-4.5 h-4.5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0"
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
      </button>

      {/* 2. Pairing / Verification (Green Theme) */}
      <button
        type="button"
        onClick={() => onSelectTab("pairing")}
        aria-label="View pairing status and safety code"
        className="w-full p-3.5 sm:p-4 rounded-2.5xl bg-[#091325]/85 hover:bg-[#0B182E] border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-all duration-300 cursor-pointer group active:scale-[0.99] shadow-lg"
      >
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)] group-hover:scale-105 transition-transform flex-shrink-0">
            <svg
              className="w-5 h-5 sm:w-5.5 sm:h-5.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Pairing / Verification
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 font-normal">
              View pairing status and safety code
            </p>
          </div>
        </div>
        <svg
          className="w-4.5 h-4.5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0"
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
      </button>

      {/* 3. Privacy (Purple Theme) */}
      <button
        type="button"
        onClick={() => onSelectTab("privacy")}
        aria-label="Control your privacy and data"
        className="w-full p-3.5 sm:p-4 rounded-2.5xl bg-[#091325]/85 hover:bg-[#0B182E] border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-all duration-300 cursor-pointer group active:scale-[0.99] shadow-lg"
      >
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.25)] group-hover:scale-105 transition-transform flex-shrink-0">
            <svg
              className="w-5 h-5 sm:w-5.5 sm:h-5.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Privacy
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 font-normal">
              Control your privacy and data
            </p>
          </div>
        </div>
        <svg
          className="w-4.5 h-4.5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0"
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
      </button>

      {/* 4. Permissions (Cyan/Blue Theme) */}
      <button
        type="button"
        onClick={() => onSelectTab("permissions")}
        aria-label="Camera, microphone and notifications"
        className="w-full p-3.5 sm:p-4 rounded-2.5xl bg-[#091325]/85 hover:bg-[#0B182E] border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-all duration-300 cursor-pointer group active:scale-[0.99] shadow-lg"
      >
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] group-hover:scale-105 transition-transform flex-shrink-0">
            <svg
              className="w-5 h-5 sm:w-5.5 sm:h-5.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Permissions
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 font-normal">
              Camera, microphone and notifications
            </p>
          </div>
        </div>
        <svg
          className="w-4.5 h-4.5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0"
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
      </button>

      {/* 5. Notifications (Amber/Gold Theme) */}
      <button
        type="button"
        onClick={() => onSelectTab("notifications")}
        aria-label="Manage private notifications"
        className="w-full p-3.5 sm:p-4 rounded-2.5xl bg-[#091325]/85 hover:bg-[#0B182E] border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-all duration-300 cursor-pointer group active:scale-[0.99] shadow-lg"
      >
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)] group-hover:scale-105 transition-transform flex-shrink-0">
            <svg
              className="w-5 h-5 sm:w-5.5 sm:h-5.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Notifications
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 font-normal">
              Manage private notifications
            </p>
          </div>
        </div>
        <svg
          className="w-4.5 h-4.5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0"
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
      </button>

      {/* 6. Security (Green Theme) */}
      <button
        type="button"
        onClick={() => onSelectTab("security")}
        aria-label="Encryption, keys and session control"
        className="w-full p-3.5 sm:p-4 rounded-2.5xl bg-[#091325]/85 hover:bg-[#0B182E] border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-all duration-300 cursor-pointer group active:scale-[0.99] shadow-lg"
      >
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.25)] group-hover:scale-105 transition-transform flex-shrink-0">
            <svg
              className="w-5 h-5 sm:w-5.5 sm:h-5.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Security
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 font-normal">
              Encryption, keys and session control
            </p>
          </div>
        </div>
        <svg
          className="w-4.5 h-4.5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0"
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
      </button>

      {/* 7. Reset / Unpair (Red Destructive Theme) */}
      <button
        type="button"
        onClick={() => onSelectTab("reset")}
        aria-label="Remove pairing and clear local data"
        className="w-full p-3.5 sm:p-4 rounded-2.5xl bg-rose-950/35 hover:bg-rose-950/60 border border-rose-500/30 hover:border-rose-500/50 flex items-center justify-between transition-all duration-300 cursor-pointer group active:scale-[0.99] shadow-lg"
      >
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)] group-hover:scale-105 transition-transform flex-shrink-0">
            <svg
              className="w-5 h-5 sm:w-5.5 sm:h-5.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-xs sm:text-sm font-bold text-rose-300 tracking-wide">
              Reset / Unpair
            </h3>
            <p className="text-[11px] sm:text-xs text-rose-300/70 font-normal">
              Remove pairing and clear local data
            </p>
          </div>
        </div>
        <svg
          className="w-4.5 h-4.5 text-rose-400 group-hover:translate-x-1 transition-all flex-shrink-0"
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
      </button>
    </div>
  );
};
