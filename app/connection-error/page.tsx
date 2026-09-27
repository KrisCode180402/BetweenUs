"use client";

import React, { Suspense } from "react";
import { ConnectionErrorPage } from "@/components/between-us/connection/ConnectionErrorPage";

function ConnectionErrorContent() {
  return <ConnectionErrorPage />;
}

export default function ConnectionErrorRoute() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-[#040814] flex flex-col items-center justify-center p-6 text-center select-none font-outfit">
          <div className="w-10 h-10 rounded-full border-3 border-teal-400 border-t-transparent animate-spin mb-3" />
          <p className="text-xs font-mono text-slate-400 animate-pulse">
            Loading diagnostics...
          </p>
        </div>
      }
    >
      <ConnectionErrorContent />
    </Suspense>
  );
}
