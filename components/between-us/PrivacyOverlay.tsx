import React from "react";

interface PrivacyOverlayProps {
  isVisible: boolean;
  onExitPrivacyMode?: (() => void) | undefined;
  onEmergencyExit?: (() => void) | undefined;
}

export const PrivacyOverlay: React.FC<PrivacyOverlayProps> = ({
  isVisible,
  onExitPrivacyMode,
  onEmergencyExit,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950/98 backdrop-blur-2xl p-6 text-center select-none animate-fadeIn">
      {/* Brand & Privacy Shield Icon */}
      <div className="w-20 h-20 mb-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-950/50">
        <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-white mb-2 font-mono">
        BETWEEN US
      </h1>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-medium mb-8">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        🔒 PRIVACY MODE ACTIVE
      </div>

      <p className="max-w-xs text-sm text-gray-400 leading-relaxed mb-8">
        Application screen and media controls are visually obscured for your protection.
      </p>

      {/* Action Controls */}
      <div className="w-full max-w-xs space-y-3">
        {onExitPrivacyMode && (
          <button
            type="button"
            onClick={onExitPrivacyMode}
            className="w-full py-3.5 px-4 rounded-2xl bg-gray-800/90 hover:bg-gray-700 border border-gray-700 text-gray-200 font-medium text-sm transition-all active:scale-98 cursor-pointer"
          >
            Resume Private View
          </button>
        )}

        {onEmergencyExit && (
          <button
            type="button"
            onClick={onEmergencyExit}
            aria-label="Activate Emergency Exit"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-sm shadow-lg shadow-red-950/60 border border-red-400/30 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            ⚡ PRIVACY EXIT
          </button>
        )}
      </div>

      <div className="mt-8 text-[11px] text-gray-500 font-mono">
        Between Us does not intentionally record or store your call.
      </div>
    </div>
  );
};
