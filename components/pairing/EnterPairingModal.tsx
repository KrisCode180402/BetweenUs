"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  submitPairingCode,
  subscribeToPairingResponse,
} from "../../lib/pairing/supabase-pairing";

interface EnterPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPairingComplete: () => void;
}

export const EnterPairingModal: React.FC<EnterPairingModalProps> = ({
  isOpen,
  onClose,
  onPairingComplete,
}) => {
  const [inputCode, setInputCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [initiatorName, setInitiatorName] = useState<string>("partner device");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  const formatCodeInput = (value: string): string => {
    const raw = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const truncated = raw.slice(0, 12);
    const parts: string[] = [];
    for (let i = 0; i < truncated.length; i += 4) {
      parts.push(truncated.slice(i, i + 4));
    }
    return parts.join("-");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputCode(formatCodeInput(e.target.value));
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputCode(formatCodeInput(text));
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setErrorMessage(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const result = await submitPairingCode(inputCode.trim(), "Partner Device");
      if (!result.success) {
        setErrorMessage(result.message || "That pairing code isn't valid or has expired.");
        setIsSubmitting(false);
        return;
      }

      setInitiatorName(result.initiatorName || "partner device");
      setStatusMessage(`Pairing request sent. Waiting for partner to approve...`);

      if (result.sessionId) {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }

        unsubscribeRef.current = subscribeToPairingResponse(result.sessionId, {
          onAccepted: () => {
            setStatusMessage(null);
            onPairingComplete();
          },
          onRejected: () => {
            setErrorMessage("Pairing request was declined by partner device.");
            setStatusMessage(null);
          },
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit pairing code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="enter-modal-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in select-none font-outfit"
    >
      <div className="w-full max-w-sm bg-[#070E1B] border border-sky-500/50 rounded-3xl p-6 text-center space-y-5 shadow-[0_0_40px_rgba(56,189,248,0.25)] relative overflow-hidden">
        
        {/* Top Ambient Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer z-10"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* REQUEST SENT WAITING STATE */}
        {statusMessage ? (
          <div className="space-y-5 py-2 animate-fade-in">
            {/* Glowing Spinner Icon */}
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full bg-sky-500/30 animate-ping opacity-75" />
              <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border-2 border-sky-400/60 flex items-center justify-center text-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.5)]">
                <div className="w-8 h-8 rounded-full border-3 border-sky-400 border-t-transparent animate-spin" />
              </div>
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-sky-950/80 border border-sky-500/40 text-[10px] font-bold text-sky-300 tracking-wider uppercase mb-2">
                Request Sent
              </span>
              <h2 id="enter-modal-title" className="text-xl font-bold text-white tracking-wide">
                Waiting for {initiatorName}
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Pairing request delivered to your partner. Please ask them to press <strong className="text-emerald-400 font-semibold">Accept</strong> on their screen.
              </p>
            </div>

            <div className="py-2.5 px-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Realtime P2P Handshake Listening...</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setStatusMessage(null);
                setInputCode("");
              }}
              className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-all"
            >
              Cancel & Enter New Code
            </button>
          </div>
        ) : (
          /* ENTER CODE FORM STATE */
          <div className="space-y-4">
            {/* Header Icon */}
            <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.3)]">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>

            <h2 id="enter-modal-title" className="text-lg font-bold text-white tracking-wide">
              Enter Pairing Code
            </h2>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="space-y-2">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={handleChange}
                    placeholder="AB7K-92PX-M4QW"
                    maxLength={14}
                    aria-label="12-character pairing code"
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-sky-400 rounded-2xl px-4 py-3.5 text-base font-mono text-center tracking-widest text-sky-300 placeholder:text-slate-600 outline-none uppercase transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="absolute right-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-medium text-slate-300 transition-colors"
                  >
                    Paste
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Enter the 12-character code displayed on your partner&apos;s device.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || inputCode.length < 14}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-sky-950/50 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? "Connecting..." : "Connect Devices"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
