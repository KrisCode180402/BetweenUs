import React from "react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onReturnHome?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "CONNECTION FAILED",
  message = "Unable to establish a private connection. Please check your network and try again.",
  onRetry,
  onReturnHome,
}) => {
  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-gray-900/90 border border-red-900/40 shadow-2xl backdrop-blur-xl text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
        <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
          {message}
        </p>
      </div>

      <div className="space-y-3 pt-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg cursor-pointer"
          >
            TRY AGAIN
          </button>
        )}
        {onReturnHome && (
          <button
            type="button"
            onClick={onReturnHome}
            className="w-full py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-sm transition-all border border-gray-700 cursor-pointer"
          >
            RETURN HOME
          </button>
        )}
      </div>
    </div>
  );
};
