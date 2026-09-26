import React from "react";

interface LoadingStateProps {
  label?: string;
  sublabel?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = "Establishing private connection...",
  sublabel = "Verifying cryptographic parameters",
}) => {
  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-gray-900/90 border border-gray-800 shadow-2xl backdrop-blur-xl text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-blue-950/60 border border-blue-800/40 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-white tracking-wide">{label}</h3>
        <p className="text-xs font-mono text-gray-400">{sublabel}</p>
      </div>
    </div>
  );
};
