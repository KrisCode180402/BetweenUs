"use client";

import React from "react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-outfit select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#081226] border border-slate-700/80 p-5 shadow-2xl text-white overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center text-xs font-bold">
              ?
            </div>
            <h2 className="text-base font-bold text-white tracking-wide">Connection Troubleshooting</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Help"
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Troubleshooting Steps */}
        <div className="py-4 space-y-3.5 max-h-[60vh] overflow-y-auto pr-1 text-xs">
          {/* Step 1 */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex gap-3">
            <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              1
            </span>
            <div>
              <h3 className="font-bold text-slate-100 text-xs">Check Network Connection</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Ensure Wi-Fi or Cellular Data is enabled. If on corporate Wi-Fi or VPN, try switching to mobile data as firewalls may block UDP WebRTC calls.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex gap-3">
            <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              2
            </span>
            <div>
              <h3 className="font-bold text-slate-100 text-xs">Allow Camera & Mic Permissions</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Check browser or OS site permissions. Tap the lock icon in your browser address bar to ensure microphone & camera access are allowed for Between Us.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex gap-3">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              3
            </span>
            <div>
              <h3 className="font-bold text-slate-100 text-xs">Verify Partner Device Status</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                If the call timed out, your partner’s app may be closed or offline. Verify your paired partner is active before retrying.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex gap-3">
            <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              4
            </span>
            <div>
              <h3 className="font-bold text-slate-100 text-xs">Tap &quot;Try Again&quot;</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Once network and permissions are active, tap <strong className="text-emerald-400">&quot;Try Again&quot;</strong> to automatically reconnect your call.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs tracking-wide transition-colors cursor-pointer shadow-lg"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
