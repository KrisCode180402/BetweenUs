"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public override componentDidMount() {
    if (typeof window !== "undefined") {
      window.addEventListener("unhandledrejection", (event) => {
        const msg = String(event.reason?.message || event.reason || "");
        if (
          msg.includes("Connection closed") ||
          msg.includes("WebSocket") ||
          msg.includes("CHANNEL_ERROR") ||
          msg.includes("realtime")
        ) {
          event.preventDefault(); // Suppress background Realtime WebSocket close error from unmounting React!
        }
      });

      window.addEventListener("error", (event) => {
        const msg = String(event.message || "");
        if (
          msg.includes("Connection closed") ||
          msg.includes("WebSocket") ||
          msg.includes("CHANNEL_ERROR")
        ) {
          event.preventDefault(); // Suppress background Realtime WebSocket close error from unmounting React!
        }
      });
    }
  }

  public static getDerivedStateFromError(error: Error): State {
    // If the error is a transient WebSocket connection close, do not show error fallback UI
    const msg = String(error?.message || "");
    if (
      msg.includes("Connection closed") ||
      msg.includes("WebSocket") ||
      msg.includes("CHANNEL_ERROR")
    ) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Error Boundary caught error:", error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-screen bg-[#060B14] flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="w-full max-w-md bg-[#0A1220] border border-rose-500/30 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-bold tracking-wide">Application Notice</h3>
            <p className="text-xs text-slate-300">
              {this.state.error?.message || "An unexpected error occurred. Please refresh to continue."}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
