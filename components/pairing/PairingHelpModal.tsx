"use client";

import React from "react";

interface PairingHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PairingHelpModal: React.FC<PairingHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="w-full max-w-sm bg-[#091220] border border-slate-700/80 rounded-3xl p-6 text-left space-y-5 shadow-2xl relative select-none">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pr-6">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 id="help-modal-title" className="text-base font-bold text-white tracking-wide">
              How Pairing Works
            </h2>
            <p className="text-[11px] text-slate-400">
              Simple 1-to-1 connection setup
            </p>
          </div>
        </div>

        {/* 5 Step Explanation List */}
        <div className="space-y-3 text-xs text-slate-300">
          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              1
            </span>
            <p className="leading-relaxed">
              <strong className="text-emerald-300 font-semibold">Device A</strong> generates a short-lived 12-character pairing code.
            </p>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              2
            </span>
            <p className="leading-relaxed">
              <strong className="text-sky-300 font-semibold">Device B</strong> enters the code to send a secure pairing request.
            </p>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              3
            </span>
            <p className="leading-relaxed">
              <strong className="text-teal-300 font-semibold">Device A</strong> reviews and confirms the request to approve the pairing.
            </p>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              4
            </span>
            <p className="leading-relaxed">
              Both devices store matching cryptographic public fingerprints locally in IndexedDB.
            </p>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              5
            </span>
            <p className="leading-relaxed text-slate-400">
              The single-use pairing code automatically expires after 10 minutes.
            </p>
          </div>
        </div>

        {/* Understood Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
