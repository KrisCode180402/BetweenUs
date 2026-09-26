import React from "react";

export type SecurityStateMode =
  | "UNKNOWN"
  | "VERIFYING"
  | "VERIFIED"
  | "WARNING"
  | "FAILED";

interface SecurityStatusProps {
  status?: SecurityStateMode;
  customLabel?: string;
  subLabel?: string;
}

export const SecurityStatus: React.FC<SecurityStatusProps> = ({
  status = "UNKNOWN",
  customLabel,
  subLabel = "Privacy by design • Zero server persistence",
}) => {
  let badgeColor = "bg-blue-950/80 text-blue-400 border-blue-800/60";
  let dotColor = "bg-blue-500 animate-pulse";
  let defaultLabel = "PRIVATE CONNECTION";

  if (status === "VERIFIED") {
    badgeColor = "bg-emerald-950/80 text-emerald-400 border-emerald-800/60";
    dotColor = "bg-emerald-400";
    defaultLabel = "IDENTITY VERIFIED";
  } else if (status === "WARNING") {
    badgeColor = "bg-amber-950/80 text-amber-400 border-amber-800/60";
    dotColor = "bg-amber-400 animate-ping";
    defaultLabel = "IDENTITY UNVERIFIED";
  } else if (status === "FAILED") {
    badgeColor = "bg-red-950/80 text-red-400 border-red-800/60";
    dotColor = "bg-red-500";
    defaultLabel = "CONNECTION REJECTED";
  } else if (status === "VERIFYING") {
    badgeColor = "bg-indigo-950/80 text-indigo-400 border-indigo-800/60";
    dotColor = "bg-indigo-400 animate-bounce";
    defaultLabel = "VERIFYING SECURITY";
  }

  const label = customLabel || defaultLabel;

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono tracking-wide shadow-sm backdrop-blur-md ${badgeColor}`}
        role="status"
        aria-live="polite"
      >
        <span
          className={`w-2 h-2 rounded-full ${dotColor}`}
          aria-hidden="true"
        />
        <span>🔒 {label}</span>
      </div>
      {subLabel && (
        <span className="text-[11px] text-gray-500 font-mono tracking-tight">
          {subLabel}
        </span>
      )}
    </div>
  );
};
