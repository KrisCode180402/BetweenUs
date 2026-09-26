import React from "react";
import { CallState } from "../../lib/webrtc/types";

export type ConnectionCallState =
  | CallState
  | "Connecting"
  | "Ringing"
  | "Connected"
  | "Reconnecting"
  | "Ending"
  | "Ended"
  | "Failed";

interface ConnectionStatusProps {
  state: ConnectionCallState;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ state }) => {
  let colorClass = "text-blue-400";
  let pulseClass = "animate-pulse";
  let displayLabel = String(state);

  switch (state) {
    case CallState.CONNECTED:
    case "Connected":
      colorClass = "text-emerald-400";
      pulseClass = "";
      displayLabel = "CONNECTED";
      break;

    case CallState.RECONNECTING:
    case "Reconnecting":
      colorClass = "text-amber-400";
      pulseClass = "animate-pulse";
      displayLabel = "RECONNECTING";
      break;

    case CallState.FAILED:
    case "Failed":
      colorClass = "text-red-400";
      pulseClass = "";
      displayLabel = "FAILED";
      break;

    case CallState.TIMED_OUT:
      colorClass = "text-amber-400";
      pulseClass = "";
      displayLabel = "TIMED OUT";
      break;

    case CallState.REJECTED:
      colorClass = "text-red-400";
      pulseClass = "";
      displayLabel = "DECLINED";
      break;

    case CallState.CANCELLED:
      colorClass = "text-gray-400";
      pulseClass = "";
      displayLabel = "CANCELLED";
      break;

    case CallState.OUTGOING_INITIATING:
      displayLabel = "CALLING...";
      break;

    case CallState.OUTGOING_RINGING:
    case CallState.INCOMING_RINGING:
    case CallState.RINGING:
    case "Ringing":
      displayLabel = "RINGING...";
      break;

    case CallState.ACCEPTING:
    case CallState.NEGOTIATING:
    case CallState.CONNECTING:
    case "Connecting":
      displayLabel = "CONNECTING...";
      break;

    case CallState.ENDING:
    case "Ending":
      displayLabel = "ENDING...";
      break;

    case CallState.ENDED:
    case "Ended":
      displayLabel = "ENDED";
      pulseClass = "";
      break;
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-950/70 border border-gray-800 text-xs font-mono">
      <span className={`w-2 h-2 rounded-full ${colorClass} ${pulseClass} bg-current`} />
      <span className={colorClass}>{displayLabel}</span>
    </div>
  );
};
