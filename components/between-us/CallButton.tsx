import React from "react";

interface CallButtonProps {
  type: "audio" | "video";
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}

export const CallButton: React.FC<CallButtonProps> = ({
  type,
  onClick,
  disabled = false,
  loading = false,
  label,
}) => {
  const isAudio = type === "audio";
  const buttonLabel = label || (isAudio ? "AUDIO CALL" : "VIDEO CALL");
  const subTitle = isAudio ? "Just your voice" : "See each other";

  const cardBorder = isAudio
    ? "border-[#10B981]/40 hover:border-[#10B981]/80 hover:shadow-[0_0_35px_rgba(16,185,129,0.3)] bg-gradient-to-b from-[#0A2624]/60 via-[#071F1E]/70 to-[#051515]/90"
    : "border-[#3B82F6]/40 hover:border-[#3B82F6]/80 hover:shadow-[0_0_35px_rgba(59,130,246,0.3)] bg-gradient-to-b from-[#0D2147]/60 via-[#0A1A38]/70 to-[#061026]/90";

  const outerCircleGlow = isAudio
    ? "border-[#10B981]/30 bg-[#064E3B]/20 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
    : "border-[#3B82F6]/30 bg-[#1E3A8A]/20 shadow-[0_0_20px_rgba(59,130,246,0.25)]";

  const innerCircle3D = isAudio
    ? "bg-gradient-to-tr from-[#059669] via-[#10B981] to-[#34D399] glow-emerald"
    : "bg-gradient-to-tr from-[#1D4ED8] via-[#3B82F6] to-[#60A5FA] glow-blue";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={buttonLabel}
      className={`w-full h-full min-h-[220px] rounded-3xl p-6 flex flex-col items-center justify-between transition-all duration-300 border backdrop-blur-2xl cursor-pointer group active:scale-[0.98] select-none relative overflow-hidden ${cardBorder} ${
        disabled ? "opacity-50 cursor-not-allowed active:scale-100" : ""
      }`}
    >
      {/* Background Subtle Sparkle/Wave Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-40 pointer-events-none" />

      {/* Center 3D Glowing Circle Button */}
      <div className="w-full flex-1 flex items-center justify-center my-2">
        <div
          className={`w-28 h-28 rounded-full border p-2 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${outerCircleGlow}`}
        >
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${innerCircle3D}`}
          >
            {loading ? (
              <div className="w-7 h-7 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isAudio ? (
              <svg
                className="w-8 h-8 text-white transform -scale-x-100"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27c1.21.49 2.53.76 3.88.76a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.35.27 2.67.76 3.88a1 1 0 01-.27 1.11l-2.2 2.2z" />
              </svg>
            ) : (
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Button Labels */}
      <div className="text-center space-y-1 z-10">
        <h3 className="text-sm sm:text-base font-bold tracking-wider text-white uppercase font-outfit">
          {buttonLabel}
        </h3>
        <p className="text-xs text-slate-300/80 font-medium">
          {subTitle}
        </p>
      </div>
    </button>
  );
};
