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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="w-full max-w-sm bg-[#091220] border border-emerald-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl relative select-none">
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

        {/* Header Icon */}
        <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

        {/* Incoming Pairing Request Overlay */}
        {incomingRequest ? (
          <div className="space-y-4 p-4 rounded-2xl bg-teal-950/40 border border-teal-500/40 animate-pulse">
            <h3 className="text-sm font-semibold text-teal-300">
              Incoming Request from {incomingRequest.targetDeviceName}
            </h3>
            <p className="text-xs text-slate-300">
              Would you like to connect with this device?
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleDecline}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleAccept}
                disabled={isSubmitting}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                {isSubmitting ? "Connecting..." : "Accept"}
              </button>
            </div>
          </div>
        ) : isLoading ? (
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

            <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
              Share this code with your partner. Waiting for partner to enter code...
            </p>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
              >
                {copied ? "Copied to Clipboard!" : "Copy Code"}
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium transition-all cursor-pointer"
              >
                Refresh Code
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
