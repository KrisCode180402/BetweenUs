import React, { useState, useEffect } from "react";
import {
  VerificationState,
  SafetyRepresentation,
  SafetyVerificationState,
} from "../../lib/safety/types";
import {
  getSafetyVerificationState,
  initializeSafetySession,
  confirmVerificationMatch,
  rejectVerificationMismatch,
  resetVerification,
} from "../../lib/safety/service";

interface SafetyVerificationProps {
  onClose?: () => void;
  onVerified?: () => void;
}

export const SafetyVerification: React.FC<SafetyVerificationProps> = ({
  onClose,
  onVerified,
}) => {
  const [session, setSession] = useState<SafetyVerificationState>(getSafetyVerificationState());
  const [showFullHex, setShowFullHex] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    initializeSafetySession().then((updated) => {
      setSession(updated);
    });
  }, []);

  const handleConfirmMatch = async () => {
    const updated = await confirmVerificationMatch();
    setSession(updated);
    if (onVerified) onVerified();
  };

  const handleRejectMismatch = async () => {
    const updated = await rejectVerificationMismatch();
    setSession(updated);
  };

  const handleReset = async () => {
    const updated = await resetVerification();
    setSession(updated);
  };

  const handleCopyCode = (textToCopy: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedText(label);
        setTimeout(() => setCopiedText(null), 2000);
      });
    }
  };

  const representation: SafetyRepresentation | null = session.representation;
  const currentState: VerificationState = session.state;

  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-3xl bg-gray-900/95 border border-blue-900/40 shadow-2xl backdrop-blur-xl text-center space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              currentState === VerificationState.VERIFIED
                ? "bg-emerald-500"
                : currentState === VerificationState.IDENTITY_CHANGED || currentState === VerificationState.VERIFICATION_FAILED
                ? "bg-amber-500 animate-ping"
                : "bg-blue-500 animate-pulse"
            }`}
          />
          <h3 className="text-xs font-mono font-bold tracking-wider text-gray-200 uppercase">
            🔐 Safety Verification
          </h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close safety verification"
            className="text-gray-500 hover:text-gray-300 text-sm font-mono cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* State: IDENTITY CHANGED WARNING */}
      {currentState === VerificationState.IDENTITY_CHANGED && (
        <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-600/60 text-left space-y-2 text-amber-200">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase">
            <span>⚠️ Partner Identity Changed</span>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            The cryptographic identity of this device is different from the identity you previously verified.
            Compare the new safety code with your partner before trusting this connection.
          </p>
        </div>
      )}

      {/* State: VERIFICATION FAILED WARNING */}
      {currentState === VerificationState.VERIFICATION_FAILED && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-600/60 text-left space-y-2 text-rose-200">
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase">
            <span>❌ Verification Failed</span>
          </div>
          <p className="text-xs text-rose-200/90 leading-relaxed">
            Identity verification failed. Do not continue trusting this device until the identity mismatch is resolved.
          </p>
        </div>
      )}

      {/* Guidance */}
      <p className="text-xs text-gray-400 leading-relaxed">
        Compare this code with your partner through an independent channel (in person or trusted out-of-band call).
        Do not rely on the same potentially unverified channel.
      </p>

      {/* Visual Emoji Sequence */}
      {representation && (
        <div className="p-4 rounded-2xl bg-gray-950/90 border border-blue-900/50 space-y-3 shadow-inner">
          <div className="text-3xl tracking-widest flex justify-center gap-2 select-all">
            {representation.emojis.map((emoji, idx) => (
              <span key={idx} role="img" aria-label={`Safety emoji ${idx + 1}`}>
                {emoji}
              </span>
            ))}
          </div>

          {/* Formatted Short Code */}
          <div className="tracking-widest font-mono text-xl font-black text-blue-400 select-all">
            {representation.shortCode}
          </div>

          {/* 6-Word Sequence */}
          <div className="flex flex-wrap justify-center gap-1.5 pt-1">
            {representation.words.map((word, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-gray-900 text-gray-300 font-mono text-[11px] border border-gray-800"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Full Fingerprint Toggle */}
      {representation && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowFullHex(!showFullHex)}
            className="text-[11px] font-mono text-blue-400 hover:text-blue-300 underline cursor-pointer"
          >
            {showFullHex ? "Hide Full Fingerprint" : "Show Full Fingerprint (SHA-256)"}
          </button>

          {showFullHex && (
            <div className="p-3 rounded-xl bg-gray-950 border border-gray-800 text-[10px] font-mono text-gray-400 break-all select-all text-left space-y-2">
              <div>{representation.fullFingerprintHex}</div>
              <button
                type="button"
                onClick={() => handleCopyCode(representation.fullFingerprintHex, "Full Fingerprint")}
                className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-mono cursor-pointer"
              >
                {copiedText === "Full Fingerprint" ? "Copied!" : "Copy Full Fingerprint"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Copy Code Shortcut */}
      {representation && (
        <button
          type="button"
          onClick={() => handleCopyCode(representation.shortCode, "Code")}
          className="text-[11px] font-mono text-gray-400 hover:text-gray-200 cursor-pointer block mx-auto"
        >
          {copiedText === "Code" ? "✓ Short Code Copied" : "📋 Copy Short Code"}
        </button>
      )}

      {/* Verification Status & Action Buttons */}
      {currentState === VerificationState.VERIFIED ? (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-bold shadow-md">
            <span>✓ VERIFIED PARTNER IDENTITY</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-mono text-gray-500 hover:text-gray-400 underline cursor-pointer"
          >
            Reset Verification Status
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleConfirmMatch}
            className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            MATCH ✓
          </button>

          <button
            type="button"
            onClick={handleRejectMismatch}
            className="py-3 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-mono text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            {"DOESN'T MATCH"}
          </button>
        </div>
      )}
    </div>
  );
};
