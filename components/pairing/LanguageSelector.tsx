"use client";

import React, { useState, useRef, useEffect } from "react";

export const LanguageSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<{ code: string; label: string }>({
    code: "en",
    label: "English",
  });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "fr", label: "Français" },
    { code: "de", label: "Deutsch" },
  ];

  return (
    <div ref={menuRef} className="relative z-30">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
        aria-expanded={isOpen}
        className="px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 backdrop-blur-md flex items-center gap-1.5 text-xs text-slate-300 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400"
      >
        <svg
          className="w-3.5 h-3.5 text-teal-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m-9 9a9 9 0 019-9"
          />
        </svg>
        <span className="font-medium text-[11px]">{selectedLang.code.toUpperCase()}</span>
        <svg
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-[#0A1220] border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl animate-fade-in text-xs">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setSelectedLang(lang);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center justify-between ${
                selectedLang.code === lang.code
                  ? "bg-teal-500/20 text-teal-300 font-semibold"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <span>{lang.label}</span>
              {selectedLang.code === lang.code && (
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
