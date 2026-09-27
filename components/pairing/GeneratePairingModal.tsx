"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  createPairingSession,
  subscribeToPairingSession,
  acceptPairingRequest,
  rejectPairingRequest,
  IncomingPairingRequest,
  PairingSessionInfo,
} from "../../lib/pairing/supabase-pairing";

interface GeneratePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPairingComplete: () => void;
}

export const GeneratePairingModal: React.FC<GeneratePairingModalProps> = ({
  isOpen,
  onClose,
  onPairingComplete,
}) => {
  const [sessionInfo, setSessionInfo] = useState<PairingSessionInfo | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<IncomingPairingRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const session = await createPairingSession("My Device");
      setSessionInfo(session);

      // Subscribe to updates for this pairing session
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      unsubscribeRef.current = subscribeToPairingSession(session.sessionId, {
        onRequestReceived: (req) => {
          setIncomingRequest(req);
        },
        onAccepted: () => {
          setSessionInfo(null);
          setIncomingRequest(null);
          onPairingComplete();
        },
        onRejected: () => {
          setErrorMessage("Pairing request was declined.");
          setIncomingRequest(null);
        },
        onExpired: () => {
          setErrorMessage("Pairing code has expired. Please generate a new code.");
          setSessionInfo(null);
          setIncomingRequest(null);
        },
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to generate pairing code.");
    } finally {
      setIsLoading(false);
    }
  }, [onPairingComplete]);

  useEffect(() => {
    if (isOpen && !sessionInfo && !isLoading) {
      handleGenerate();
    }
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [isOpen, sessionInfo, isLoading, handleGenerate]);

  const handleCopyCode = () => {
    if (sessionInfo?.pairingCode) {
      navigator.clipboard.writeText(sessionInfo.pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAccept = async () => {
    if (!incomingRequest) return;
    setIsSubmitting(true);
    try {
      const res = await acceptPairingRequest(
        incomingRequest.sessionId,
        incomingRequest.targetDeviceId,
        incomingRequest.targetDeviceName
      );
      if (res.success) {
        onPairingComplete();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to accept pairing request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!incomingRequest) return;
    try {
      await rejectPairingRequest(incomingRequest.sessionId);
    } catch {}
    setIncomingRequest(null);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="generate-modal-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in select-none font-outfit"
    >
      <div className="w-full max-w-sm bg-[#070E1B] border border-emerald-500/50 rounded-3xl p-6 text-center space-y-5 shadow-[0_0_40px_rgba(16,185,129,0.25)] relative overflow-hidden">
        
        {/* Top Ambient Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

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

        {/* INCOMING PAIRING REQUEST STATE (High-visibility approval view) */}
        {incomingRequest ? (
          <div className="space-y-5 py-2 animate-fade-in">
            {/* Pulsing Heart Header Icon */}
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping opacity-75" />
              <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-400/60 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.5)]">
                <svg className="w-8 h-8 text-rose-400 fill-current animate-pulse drop-shadow-[0_0_12px_rgba(251,113,133,0.8)]" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-bold text-emerald-400 tracking-wider uppercase mb-2">
                Pairing Approval Requested
              </span>
              <h2 id="generate-modal-title" className="text-xl font-bold text-white tracking-wide">
                Connect with {incomingRequest.targetDeviceName}?
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Partner device entered your pairing code and is waiting for your approval to connect.
              </p>
            </div>

            {/* Security Verification Tag */}
            <div className="py-2 px-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 font-mono flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>ECDSA-P256 End-to-End Encrypted</span>
            </div>

            {/* Action Buttons: Accept & Decline */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleAccept}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-400/50 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? "Establishing Connection..." : "Accept & Pair Devices ♡"}
              </button>

              <button
                type="button"
                onClick={handleDecline}
                className="w-full py-3 px-4 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 text-xs font-semibold cursor-pointer transition-all"
              >
                Decline Request
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD GENERATE CODE STATE */
          <div className="space-y-4">
            {/* Header Icon */}
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>

            <h2 id="generate-modal-title" className="text-lg font-bold text-white tracking-wide">
              Pairing Code Generated
            </h2>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            {isLoading ? (
              <div className="py-6 space-y-3">
                <div className="w-8 h-8 mx-auto border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400">Generating secure pairing code...</p>
              </div>
            ) : sessionInfo ? (
              <div className="space-y-3">
                <div className="py-3 px-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30">
                  <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-emerald-400 select-all drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]">
                    {sessionInfo.pairingCode}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-emerald-400/90 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Waiting for partner to enter code...</span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Share this 12-character code with your partner device. An approval request will appear here automatically.
                </p>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    {copied ? "Copied to Clipboard!" : "Copy Code"}
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer"
                  >
                    Refresh Code
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
