import React from "react";

interface EndCallScreenProps {
  onReturnHome: () => void;
}

export const EndCallScreen: React.FC<EndCallScreenProps> = ({ onReturnHome }) => {
  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-gray-900/90 border border-gray-800 shadow-2xl backdrop-blur-xl text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">CALL ENDED</h2>
        <p className="text-sm text-gray-400">
          Private session closed. All transient session state has been purged from memory.
        </p>
      </div>

      <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800 text-xs font-mono text-gray-500">
        Zero call logs stored • Zero call history retained
      </div>

      <button
        type="button"
        onClick={onReturnHome}
        className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg cursor-pointer"
      >
        RETURN HOME
      </button>
    </div>
  );
};
