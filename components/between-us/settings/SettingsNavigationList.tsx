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
    <div className="w-full space-y-3 select-none font-outfit">
      {/* 1. Device (Blue Theme) */}
      <button
        type="button"
        onClick={() => onSelectTab("device")}
        aria-label="Manage your device identity"
        className="w-full p-4 rounded-[22px] bg-[#091325]/90 hover:bg-[#0B182E] border border-slate-800/80 hover:border-slate-700 flex items-center justify-between transition-all duration-300 cursor-pointer group active:scale-[0.99] shadow-lg"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.3)] group-hover:scale-105 transition-transform flex-shrink-0">
            <svg
              className="w-6 h-6"
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
            <h3 className="text-sm font-bold text-white tracking-wide">
              Device
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Manage your device identity
            </p>
          </div>
        </div>
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
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>

      {/* 2. Pairing / Verification (Emerald Theme) */}
      <button
        type="button"
        onClick={() => onSelectTab("pairing")}
        aria-label="View pairing status and safety code"
        className="w-full p-4 rounded-[22px] bg-[#091325]/90 hover:bg-[#0B182E] border border-slate-800/80 hover:border-slate-700 flex items-center justify-between transition-all duration-300 cursor-pointer group active:scale-[0.99] shadow-lg"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] group-hover:scale-105 transition-transform flex-shrink-0">
            <svg
              className="w-6 h-6"
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
            <h3 className="text-sm font-bold text-white tracking-wide">
              Pairing / Verification
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              View pairing status and safety code
            </p>
          </div>
        </div>
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
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>

      {/* 3. Privacy (Purple Theme) */}
      <button
        type="button"
        onClick={() => onSelectTab("privacy")}
        aria-label="Control your privacy and data"
        className="w-full p-4 rounded-[22px] bg-[#091325]/90 hover:bg-[#0B182E] border border-slate-800/80 hover:border-slate-700 flex items-center justify-between transition-all duration-300 cursor-pointer group active:scale-[0.99] shadow-lg"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] group-hover:scale-105 transition-transform flex-shrink-0">
            <svg
              className="w-6 h-6"
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
            <h3 className="text-sm font-bold text-white tracking-wide">
              Privacy
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Control your privacy and data
            </p>
          </div>
        </div>
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
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>

      {/* 4. Permissions (Cyan Theme) */}
      <button
        type="button"
        onClick={() => onSelectTab("permissions")}
        aria-label="Camera, microphone and notifications"
        className="w-full p-4 rounded-[22px] bg-[#091325]/90 hover:bg-[#0B182E] border border-slate-800/80 hover:border-slate-700 flex items-center justify-between transition-all duration-300 cursor-pointer group active:scale-[0.99] shadow-lg"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] group-hover:scale-105 transition-transform flex-shrink-0">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-white tracking-wide">
              Permissions
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Camera, microphone and notifications
            </p>
          </div>
        </div>
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
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>

      {/* 5. Notifications (Amber Theme) */}
      <button
        type="button"
        onClick={() => onSelectTab("notifications")}
        aria-label="Manage private notifications"
        className="w-full p-4 rounded-[22px] bg-[#091325]/90 hover:bg-[#0B182E] border border-slate-800/80 hover:border-slate-700 flex items-center justify-between transition-all duration-300 cursor-pointer group active:scale-[0.99] shadow-lg"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] group-hover:scale-105 transition-transform flex-shrink-0">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-white tracking-wide">
              Notifications
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Manage private notifications
            </p>
          </div>
        </div>
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
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>

      {/* 6. Security (Teal Theme) */}
      <button
        type="button"
        onClick={() => onSelectTab("security")}
        aria-label="Encryption, keys and session control"
        className="w-full p-4 rounded-[22px] bg-[#091325]/90 hover:bg-[#0B182E] border border-slate-800/80 hover:border-slate-700 flex items-center justify-between transition-all duration-300 cursor-pointer group active:scale-[0.99] shadow-lg"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.3)] group-hover:scale-105 transition-transform flex-shrink-0">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-white tracking-wide">
              Security
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Encryption, keys and session control
            </p>
          </div>
        </div>
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
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>

      {/* 7. Reset / Unpair (Rose Theme) */}
      <button
        type="button"
        onClick={() => onSelectTab("reset")}
        aria-label="Remove pairing and clear local data"
        className="w-full p-4 rounded-[22px] bg-[#091325]/90 hover:bg-[#0B182E] border border-rose-500/30 hover:border-rose-500/50 flex items-center justify-between transition-all duration-300 cursor-pointer group active:scale-[0.99] shadow-lg"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)] group-hover:scale-105 transition-transform flex-shrink-0">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.61 9m4.268-6.5a1.736 1.736 0 011.026.54c.48.572.71 1.344.664 2.115l-.234 3.345H8.694L8.46 5.155A2.32 2.32 0 019.124 3.04a1.736 1.736 0 011.026-.54h4.593zM4.5 7.5h15"
              />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-rose-300 tracking-wide">
              Reset / Unpair
            </h3>
            <p className="text-xs text-rose-300/70 font-normal">
              Remove pairing and clear local data
            </p>
          </div>
        </div>
        <svg
          className="w-5 h-5 text-rose-400 group-hover:translate-x-1 transition-all flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>
    </div>
  );
};
