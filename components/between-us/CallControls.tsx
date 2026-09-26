import React from "react";

interface CallControlsProps {
  isMuted?: boolean | undefined;
  isVideoOff?: boolean | undefined;
  isScreenSharing?: boolean | undefined;
  isPrivacyModeActive?: boolean | undefined;
  onToggleMute?: (() => void) | undefined;
  onToggleVideo?: (() => void) | undefined;
  onToggleScreenShare?: (() => void) | undefined;
  onSwitchCamera?: (() => void) | undefined;
  onTogglePrivacyMode?: (() => void) | undefined;
  onEmergencyExit?: (() => void) | undefined;
  onEndCall: () => void;
}

export const CallControls: React.FC<CallControlsProps> = ({
  isMuted = false,
  isVideoOff = false,
  isScreenSharing = false,
  isPrivacyModeActive = false,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onSwitchCamera,
  onTogglePrivacyMode,
  onEmergencyExit,
  onEndCall,
}) => {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col space-y-3">
      {/* Primary Call Controls Bar */}
      <div className="w-full flex items-center justify-around p-3.5 sm:p-4 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
        {/* Microphone Toggle */}
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
            isMuted
              ? "bg-red-500/20 border border-red-500/40 text-red-400"
              : "bg-slate-800/80 border border-slate-700/80 text-slate-200 hover:bg-slate-700"
          }`}
        >
          {isMuted ? (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        {/* Camera Toggle */}
        <button
          type="button"
          onClick={onToggleVideo}
          aria-label={isVideoOff ? "Turn camera on" : "Turn camera off"}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
            isVideoOff
              ? "bg-red-500/20 border border-red-500/40 text-red-400"
              : "bg-slate-800/80 border border-slate-700/80 text-slate-200 hover:bg-slate-700"
          }`}
        >
          {isVideoOff ? (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
            </svg>
          ) : (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>

        {/* Screen Share Toggle */}
        {onToggleScreenShare && (
          <button
            type="button"
            onClick={onToggleScreenShare}
            aria-label={isScreenSharing ? "Stop screen sharing" : "Share screen"}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isScreenSharing
                ? "bg-sky-500/20 border border-sky-500/40 text-sky-400"
                : "bg-slate-800/80 border border-slate-700/80 text-slate-200 hover:bg-slate-700"
            }`}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
        )}

        {/* Camera Switch Toggle */}
        {onSwitchCamera && !isVideoOff && (
          <button
            type="button"
            onClick={onSwitchCamera}
            aria-label="Switch camera"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-200 hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}

        {/* Privacy Toggle */}
        <button
          type="button"
          onClick={onTogglePrivacyMode}
          aria-label={isPrivacyModeActive ? "Disable Privacy Mode" : "Enable Privacy Mode"}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
            isPrivacyModeActive
              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
              : "bg-slate-800/80 border border-slate-700/80 text-slate-200 hover:bg-slate-700"
          }`}
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </button>

        {/* End Call Button */}
        <button
          type="button"
          onClick={onEndCall}
          aria-label="End Call"
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-900/50 border border-red-400/40 cursor-pointer active:scale-95 transition-all"
        >
          <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.684A1 1 0 008.279 3H5z" />
          </svg>
        </button>
      </div>

      {/* Emergency Quick-Exit Control Bar */}
      {onEmergencyExit && (
        <button
          type="button"
          onClick={onEmergencyExit}
          aria-label="Activate Emergency Privacy Exit"
          className="w-full py-2.5 px-4 rounded-2xl bg-red-950/80 hover:bg-red-900/90 border border-red-500/40 text-red-300 font-semibold text-xs tracking-wide uppercase flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-md"
        >
          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          ⚡ PRIVACY EXIT
        </button>
      )}
    </div>
  );
};
