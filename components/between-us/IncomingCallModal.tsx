import React from "react";

interface IncomingCallModalProps {
  callerName?: string;
  callType: "audio" | "video";
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  callerName = "Your Partner",
  callType,
  onAccept,
  onDecline,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-6 flex flex-col items-center text-center space-y-6 shadow-2xl">
        {/* Pulsing Call Avatar */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center animate-pulse">
            <span className="text-4xl">
              {callType === "video" ? "📹" : "🎙️"}
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
            ❤️
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white tracking-wide">
            {callerName}
          </h3>
          <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
            Incoming {callType} Call...
          </p>
          <p className="text-[11px] text-slate-400 pt-1">
            Private 1-to-1 encrypted call request
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 w-full pt-2">
          {/* Decline Button */}
          <button
            type="button"
            onClick={onDecline}
            aria-label="Decline incoming call"
            className="w-full py-3.5 px-4 rounded-2xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Decline
          </button>

          {/* Accept Button */}
          <button
            type="button"
            onClick={onAccept}
            aria-label="Accept incoming call"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};
