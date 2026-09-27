"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  createPairingSession,
  submitPairingCode,
  acceptPairingRequest,
  rejectPairingRequest,
  subscribeToPairingSession,
  subscribeToPairingResponse,
  unpairCurrentDevice,
  syncLocalDeviceIdentity,
  IncomingPairingRequest,
} from "@/lib/pairing/supabase-pairing";
import { loadPairedPartner } from "@/lib/pairing/partner-store";
import { PairedPartnerRecord } from "@/lib/pairing/types";

interface PairingSectionProps {
  onPairingStatusChange?: (isPaired: boolean) => void;
}

export const PairingSection: React.FC<PairingSectionProps> = ({
  onPairingStatusChange,
}) => {
  const [partnerRecord, setPartnerRecord] = useState<PairedPartnerRecord | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [deviceName, setDeviceName] = useState<string>("My Device");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState<string>("");
  const [incomingRequest, setIncomingRequest] = useState<IncomingPairingRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const onPairingStatusChangeRef = useRef(onPairingStatusChange);
  const sessionUnsubRef = useRef<(() => void) | null>(null);
  const responseUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onPairingStatusChangeRef.current = onPairingStatusChange;
  }, [onPairingStatusChange]);

  // Load existing device identity & paired partner on mount
  useEffect(() => {
    async function init() {
      try {
        const publicIdentity = await syncLocalDeviceIdentity();
        if (publicIdentity) {
          setDeviceName(`Device (${publicIdentity.fingerprint.substring(0, 6)})`);
        }
        const partner = await loadPairedPartner();
        if (partner) {
          setPartnerRecord(partner);
          onPairingStatusChangeRef.current?.(true);
        } else {
          onPairingStatusChangeRef.current?.(false);
        }
      } catch (err: any) {
        console.warn("Pairing init error:", err);
      } finally {
        setIsInitializing(false);
      }
    }
    init();

    return () => {
      if (sessionUnsubRef.current) sessionUnsubRef.current();
      if (responseUnsubRef.current) responseUnsubRef.current();
    };
  }, []);

  // Clean subscriptions when state resets
  const clearSubscriptions = () => {
    if (sessionUnsubRef.current) {
      sessionUnsubRef.current();
      sessionUnsubRef.current = null;
    }
    if (responseUnsubRef.current) {
      responseUnsubRef.current();
      responseUnsubRef.current = null;
    }
  };

  // Handle generating a new pairing code (Device A)
  const handleGenerateCode = async (): Promise<void> => {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSubmitting(true);
    clearSubscriptions();

    try {
      const session = await createPairingSession(deviceName);
      setGeneratedCode(session.pairingCode);

      // Subscribe to Realtime pairing requests on Device A
      sessionUnsubRef.current = subscribeToPairingSession(session.sessionId, {
        onRequestReceived: (req) => {
          setIncomingRequest(req);
        },
        onAccepted: async () => {
          const updatedPartner = await loadPairedPartner();
          setPartnerRecord(updatedPartner);
          setGeneratedCode(null);
          setIncomingRequest(null);
          onPairingStatusChangeRef.current?.(true);
        },
        onRejected: () => {
          setErrorMessage("Pairing request was declined by the recipient.");
          setGeneratedCode(null);
          setIncomingRequest(null);
        },
        onExpired: () => {
          setErrorMessage("Pairing code has expired. Please generate a new code.");
          setGeneratedCode(null);
          setIncomingRequest(null);
        },
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to generate pairing code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle submitting entered pairing code (Device B)
  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setErrorMessage(null);
    setStatusMessage(null);
    setIsSubmitting(true);
    clearSubscriptions();

    try {
      const result = await submitPairingCode(inputCode.trim(), deviceName);
      if (!result.success) {
        setErrorMessage(result.message || "Invalid pairing code.");
        setIsSubmitting(false);
        return;
      }

      setStatusMessage(`Pairing request sent to ${result.initiatorName || "partner device"}. Waiting for approval...`);

      // Subscribe to approval updates on Device B
      if (result.sessionId) {
        responseUnsubRef.current = subscribeToPairingResponse(result.sessionId, {
          onAccepted: async () => {
            const partner = await loadPairedPartner();
            setPartnerRecord(partner);
            setStatusMessage(null);
            onPairingStatusChangeRef.current?.(true);
          },
          onRejected: () => {
            setErrorMessage("Pairing request was declined by the recipient device.");
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

  // Accept incoming request (Device A)
  const handleAcceptRequest = async () => {
    if (!incomingRequest) return;
    setIsSubmitting(true);
    try {
      const res = await acceptPairingRequest(
        incomingRequest.sessionId,
        incomingRequest.targetDeviceId,
        incomingRequest.targetDeviceName
      );
      if (res.success) {
        const partner = await loadPairedPartner();
        setPartnerRecord(partner);
        setIncomingRequest(null);
        setGeneratedCode(null);
        clearSubscriptions();
        onPairingStatusChangeRef.current?.(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to accept pairing request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Decline incoming request (Device A)
  const handleDeclineRequest = async () => {
    if (!incomingRequest) return;
    try {
      await rejectPairingRequest(incomingRequest.sessionId);
    } catch {}
    setIncomingRequest(null);
    setGeneratedCode(null);
    clearSubscriptions();
  };

  // Copy code helper
  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle Unpair
  const handleUnpair = async () => {
    if (window.confirm("Are you sure you want to unpair this device? You will need to enter a new code to connect again.")) {
      await unpairCurrentDevice();
      setPartnerRecord(null);
      clearSubscriptions();
      onPairingStatusChangeRef.current?.(false);
    }
  };

  const partnerName = (partnerRecord as any)?.partnerName || "Your Partner";

  // Loading skeleton
  if (isInitializing) {
    return (
      <div className="w-full bg-[#081325]/60 border border-slate-800/80 rounded-2xl p-5 text-center shadow-xl backdrop-blur-xl animate-pulse">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-500/40" />
          <div className="h-3 w-28 bg-slate-800 rounded-md" />
        </div>
        <div className="h-4 w-40 bg-slate-800/60 rounded-md mx-auto my-3" />
        <div className="h-2.5 w-56 bg-slate-800/40 rounded-md mx-auto" />
      </div>
    );
  }

  // If already paired
  if (partnerRecord) {
    return (
      <div className="w-full bg-[#081325]/90 border border-teal-500/30 rounded-2xl p-4 sm:p-5 text-center space-y-3 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              PAIRED & TRUSTED
            </span>
          </div>
          <button
            type="button"
            onClick={handleUnpair}
            className="text-[11px] font-medium text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            Unpair Device
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 py-1">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-200">
            {deviceName}
          </div>
          <span className="text-teal-400 text-base font-bold">↔</span>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs font-semibold text-emerald-300">
            {partnerName}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 font-normal">
          Private signaling channel ready. 1-to-1 WebRTC calling enabled.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Incoming Pairing Request Approval Modal (Device A) */}
      {incomingRequest && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg flex items-center justify-center p-4 animate-fade-in font-outfit select-none">
          <div className="w-full max-w-sm bg-[#081224] border border-teal-400/60 rounded-3xl p-6 text-center space-y-5 shadow-[0_0_40px_rgba(20,184,166,0.3)] relative overflow-hidden">
            {/* Ambient Pulse Glow */}
            <div className="absolute -top-10 -left-10 w-28 h-28 bg-teal-500/20 rounded-full blur-2xl animate-pulse pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl animate-pulse pointer-events-none" />

            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-teal-500/30 to-emerald-600/30 border border-teal-400/50 flex items-center justify-center text-teal-300 shadow-[0_0_20px_rgba(45,212,191,0.4)] animate-bounce-slow">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.318C10.4 2.8 8.1 2.3 6.3 3.8A4.5 4.5 0 004.3 10.2L12 18l7.7-7.8a4.5 4.5 0 00-2-6.4c-1.8-1.5-4.1-1-5.7.5z" />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">
                Pairing Request Received
              </h3>
              <p className="text-xs text-slate-300/90 mt-1.5 leading-relaxed">
                <strong className="text-emerald-400 font-semibold text-sm">{incomingRequest.targetDeviceName}</strong> entered your code and wants to pair devices.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleDeclineRequest}
                className="w-full py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-300 text-xs font-semibold transition-all cursor-pointer active:scale-95"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleAcceptRequest}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400/40 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "Connecting..." : "Accept"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Code Active Card */}
      {generatedCode && !incomingRequest && (
        <div className="w-full bg-[#08182B] border border-teal-500/40 rounded-2xl p-4 sm:p-5 text-center space-y-3 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              Pairing Code Active
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Expires in 10 mins</span>
          </div>

          <div className="py-2">
            <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-emerald-400 select-all drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]">
              {generatedCode}
            </span>
          </div>

          <p className="text-[11px] text-slate-300/90 leading-normal max-w-xs mx-auto">
            Share this code with your partner device. Waiting for partner to submit code...
          </p>

          <div className="flex justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-4 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-xs font-semibold transition-all cursor-pointer active:scale-95"
            >
              {copied ? "Copied!" : "Copy Code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setGeneratedCode(null);
                clearSubscriptions();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium transition-all cursor-pointer active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Primary Pairing Action Form */}
      {!generatedCode && !incomingRequest && (
        <div className="w-full bg-[#060D19]/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 backdrop-blur-xl shadow-lg">
          <div className="text-center space-y-1">
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Device Pairing Required
            </h3>
            <p className="text-[11px] text-slate-400">
              Connect two devices securely before making private calls.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center animate-fade-in">
              {errorMessage}
            </div>
          )}

          {statusMessage && (
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs text-center animate-fade-in">
              {statusMessage}
            </div>
          )}

          {/* Option A: Generate Pairing Code */}
          <button
            type="button"
            onClick={handleGenerateCode}
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-teal-900/30 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            {isSubmitting ? "Generating Code..." : "Generate Pairing Code"}
          </button>

          <div className="flex items-center justify-center gap-2">
            <div className="h-[1px] bg-slate-800 flex-1" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              OR ENTER CODE
            </span>
            <div className="h-[1px] bg-slate-800 flex-1" />
          </div>

          {/* Option B: Enter Pairing Code */}
          <form onSubmit={handleSubmitCode} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="AB7K-92PX-M4QW"
                maxLength={14}
                className="flex-1 bg-slate-900/90 border border-slate-700/80 focus:border-teal-400 rounded-xl px-3.5 py-2.5 text-xs font-mono text-center tracking-widest text-emerald-300 placeholder:text-slate-600 outline-none uppercase transition-all"
              />
              <button
                type="submit"
                disabled={isSubmitting || !inputCode.trim()}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                Connect
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
