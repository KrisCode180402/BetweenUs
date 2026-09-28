"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { callSessionStore } from "@/lib/webrtc/call-session-store";
import { AudioCallManager } from "@/lib/webrtc/call-manager";
import { CallState } from "@/lib/webrtc/types";

export const ActiveCallBanner: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeSession, setActiveSession] = useState<AudioCallManager | null>(null);
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = callSessionStore.subscribe((session, state) => {
      setActiveSession(session);
      setCallState(state);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (callState !== CallState.CONNECTED) {
      setDuration(0);
      return;
    }

    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callState]);

  // Don't render banner if user is currently on the call screen or no call is active
  const isOnCallPage = pathname.startsWith("/call/");
  const isCallActive =
    activeSession !== null &&
    (callState === CallState.CONNECTED ||
      callState === CallState.CONNECTING ||
      callState === CallState.RECONNECTING ||
      callState === CallState.OUTGOING_RINGING ||
      callState === CallState.INCOMING_RINGING);

  if (isOnCallPage || !isCallActive || !activeSession) {
    return null;
  }

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder.toString().padStart(2, "0")}`;
  };

  const handleReturnToCall = () => {
    const callType = activeSession.getCallType();
    const route = callType === "video" ? "/call/video" : "/call/audio";
    router.push(route);
  };

  const handleEndCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeSession) {
      activeSession.endCall();
    }
  };

  return (
    <div
      onClick={handleReturnToCall}
      className="fixed top-3 left-4 right-4 z-[9999] cursor-pointer bg-neutral-900/90 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-3 shadow-2xl transition-all duration-300 hover:border-emerald-400 active:scale-[0.99] flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30"></span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Active {activeSession.getCallType() === "video" ? "Video" : "Audio"} Call</span>
            {callState === CallState.CONNECTED && (
              <span className="text-xs text-emerald-400 font-mono font-medium">
                {formatDuration(duration)}
              </span>
            )}
          </div>
          <span className="text-xs text-neutral-400">
            {callState === CallState.RECONNECTING
              ? "Reconnecting network..."
              : callState === CallState.CONNECTING
              ? "Connecting..."
              : "Tap to return to call"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleEndCall}
          className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold shadow-md transition-colors"
        >
          End
        </button>
      </div>
    </div>
  );
};
