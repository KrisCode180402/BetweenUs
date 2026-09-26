import React from "react";

interface BrandProps {
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}

export const Brand: React.FC<BrandProps> = ({
  subtitle = "TWO PEOPLE. ONE PRIVATE CONNECTION.",
}) => {
  return (
    <header className="flex items-center gap-3 select-none">
      {/* Custom Teal/Emerald Heart Connection Logo Icon */}
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-teal-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.3)]">
        <svg
          className="w-6 h-6 text-teal-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 14l3-3 3 3"
          />
        </svg>
      </div>

      <div className="flex flex-col text-left">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-outfit">
          Between Us
        </h1>
        {subtitle && (
          <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400/90 tracking-[0.18em] uppercase mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
};
