"use client";

import React, { useState } from "react";
import { unpairCurrentDevice } from "@/lib/pairing/supabase-pairing";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName?: string;
  myDeviceName?: string;
  onUnpairComplete?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  partnerName = "Jona",
  myDeviceName = "Kris",
  onUnpairComplete,
}) => {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isUnpairing, setIsUnpairing] = useState(false);
  const [safetyCode] = useState<string>("8F4A - 29C1 - 77B9 - D03E");
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleUnpair = async () => {
    if (window.confirm("Are you sure you want to unpair this device? You will need a new pairing code to reconnect.")) {
      setIsUnpairing(true);
      try {
        await unpairCurrentDevice();
        onUnpairComplete?.();
        onClose();
      } catch (err) {
        console.error("Unpair failed:", err);
      } finally {
        setIsUnpairing(false);
      }
    }
  };

  const handleCopySafetyCode = () => {
    navigator.clipboard.writeText(safetyCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in">
      <div className="relative w-full max-w-md bg-[#070D19] border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto font-outfit">
        
        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to home"
            className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-500 transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <h2 className="font-script text-2xl font-normal text-white tracking-wide">
              Between Us <span className="text-emerald-400">♡</span>
            </h2>
            <p className="text-[11px] font-medium text-slate-400">Settings</p>
          </div>

          <div className="w-9 h-9 opacity-0 pointer-events-none" />
        </div>

        {/* Device Pairing Identity Card */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-[#0B172A] to-[#0A1322] border border-teal-500/30 shadow-lg">
          <div className="flex items-center justify-around py-2">
            {/* Kris (My Device) */}
            <div className="flex flex-col items-center text-center">
              <div className="relative w-14 h-14 rounded-full border-2 border-sky-400/80 p-0.5 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                <div className="w-full h-full rounded-full bg-sky-950 flex items-center justify-center text-sky-300 font-bold text-lg">
                  {myDeviceName.charAt(0)}
                </div>
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0B172A]" />
              </div>
              <span className="text-xs font-bold text-white mt-1.5">{myDeviceName}</span>
              <span className="text-[10px] text-emerald-400 font-medium">Online</span>
            </div>

            {/* Glowing Heart Divider */}
            <div className="flex flex-col items-center justify-center px-2">
              <svg className="w-6 h-6 text-rose-400 fill-current animate-pulse drop-shadow-[0_0_10px_rgba(251,113,133,0.6)]" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Paired & Verified</span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono mt-0.5">End-to-End Encrypted</span>
            </div>

            {/* Jona (Partner Device) */}
            <div className="flex flex-col items-center text-center">
              <div className="relative w-14 h-14 rounded-full border-2 border-emerald-400/80 p-0.5 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                <div className="w-full h-full rounded-full bg-emerald-950 flex items-center justify-center text-emerald-300 font-bold text-lg">
                  {partnerName.charAt(0)}
                </div>
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0B172A]" />
              </div>
              <span className="text-xs font-bold text-white mt-1.5">{partnerName}</span>
              <span className="text-[10px] text-emerald-400 font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* Settings Navigation List */}
        <div className="space-y-2.5">
          
          {/* Item 1: Device */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === "device" ? null : "device")}
            className="w-full p-3.5 rounded-2xl bg-[#091325]/80 hover:bg-[#0B182E] border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-xs font-bold text-white">Device</h3>
                <p className="text-[11px] text-slate-400">Manage your device identity</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {activeTab === "device" && (
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>Device Fingerprint: <span className="font-mono text-emerald-400">ECDSA-P256-SAFE</span></p>
              <p>Device Name: <span className="text-white font-medium">{myDeviceName}</span></p>
            </div>
          )}

          {/* Item 2: Pairing / Verification */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === "pairing" ? null : "pairing")}
            className="w-full p-3.5 rounded-2xl bg-[#091325]/80 hover:bg-[#0B182E] border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-xs font-bold text-white">Pairing / Verification</h3>
                <p className="text-[11px] text-slate-400">View pairing status and safety code</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {activeTab === "pairing" && (
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-teal-500/30 text-xs text-slate-300 space-y-2 text-center">
              <p className="font-semibold text-white">Safety Verification Code</p>
              <div className="font-mono text-base text-emerald-400 bg-black/40 py-2 rounded-lg border border-emerald-500/30 tracking-wider">
                {safetyCode}
              </div>
              <button
                type="button"
                onClick={handleCopySafetyCode}
                className="mt-1 px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded-lg text-[11px] font-semibold"
              >
                {copiedCode ? "Copied!" : "Copy Verification Code"}
              </button>
            </div>
          )}

          {/* Item 3: Privacy */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === "privacy" ? null : "privacy")}
            className="w-full p-3.5 rounded-2xl bg-[#091325]/80 hover:bg-[#0B182E] border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-xs font-bold text-white">Privacy</h3>
                <p className="text-[11px] text-slate-400">Control your privacy and data</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {activeTab === "privacy" && (
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-purple-500/30 text-xs text-slate-300 space-y-1">
              <p className="text-purple-300 font-semibold">Zero Retention Policy</p>
              <p className="text-slate-400 text-[11px]">No chat logs, no call history, no cloud recordings. All sessions are strictly ephemeral WebRTC streams.</p>
            </div>
          )}

          {/* Item 4: Permissions */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === "permissions" ? null : "permissions")}
            className="w-full p-3.5 rounded-2xl bg-[#091325]/80 hover:bg-[#0B182E] border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-xs font-bold text-white">Permissions</h3>
                <p className="text-[11px] text-slate-400">Camera, microphone and notifications</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Item 5: Notifications */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === "notifications" ? null : "notifications")}
            className="w-full p-3.5 rounded-2xl bg-[#091325]/80 hover:bg-[#0B182E] border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-xs font-bold text-white">Notifications</h3>
                <p className="text-[11px] text-slate-400">Manage private notifications</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Item 6: Security */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === "security" ? null : "security")}
            className="w-full p-3.5 rounded-2xl bg-[#091325]/80 hover:bg-[#0B182E] border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-xs font-bold text-white">Security</h3>
                <p className="text-[11px] text-slate-400">Encryption, keys and session control</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Item 7: Reset / Unpair */}
          <button
            type="button"
            onClick={handleUnpair}
            disabled={isUnpairing}
            className="w-full p-3.5 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 hover:border-rose-500/50 flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-xs font-bold text-rose-300">Reset / Unpair</h3>
                <p className="text-[11px] text-rose-300/70">Remove pairing and clear local data</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
};
