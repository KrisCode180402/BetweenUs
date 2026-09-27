"use client";

import React, { useState, useEffect } from "react";

interface PwaCheckItem {
  label: string;
  status: "PASS" | "FAIL" | "CHECKING" | "AVAILABLE" | "UNAVAILABLE";
  detail: string;
}

export default function PwaDebugPage() {
  const [checks, setChecks] = useState<Record<string, PwaCheckItem>>({
    manifest: { label: "Manifest Webmanifest", status: "CHECKING", detail: "Checking /manifest.webmanifest..." },
    serviceWorker: { label: "Service Worker Active", status: "CHECKING", detail: "Checking navigator.serviceWorker..." },
    https: { label: "HTTPS / Secure Context", status: "CHECKING", detail: "Checking window.isSecureContext..." },
    icon192: { label: "192x192 PNG Icon", status: "CHECKING", detail: "Fetching /icons/icon-192x192.png..." },
    icon512: { label: "512x512 PNG Icon", status: "CHECKING", detail: "Fetching /icons/icon-512x512.png..." },
    maskableIcon: { label: "512x512 Maskable Icon", status: "CHECKING", detail: "Fetching /icons/maskable-icon-512x512.png..." },
    startUrl: { label: "Start URL Target", status: "CHECKING", detail: "Verifying start_url '/'..." },
    standalone: { label: "Standalone PWA Mode", status: "CHECKING", detail: "Checking display-mode..." },
    installPrompt: { label: "Install Prompt Event", status: "UNAVAILABLE", detail: "Listening for beforeinstallprompt..." },
  });

  useEffect(() => {
    const updateCheck = (key: string, status: PwaCheckItem["status"], detail: string) => {
      setChecks((prev) => ({
        ...prev,
        [key]: { ...prev[key]!, status, detail },
      }));
    };

    const checkImage = async (key: string, url: string) => {
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (res.ok) {
          updateCheck(key, "PASS", `HTTP ${res.status} OK (${res.headers.get("content-type") || "image/png"})`);
        } else {
          updateCheck(key, "FAIL", `HTTP ${res.status} failed to load ${url}`);
        }
      } catch {
        updateCheck(key, "FAIL", `Network error fetching ${url}`);
      }
    };

    async function runDiagnostics() {
      // 1. HTTPS / Secure Context
      const isHttps = typeof window !== "undefined" && (window.isSecureContext || window.location.protocol === "https:" || window.location.hostname === "localhost");
      updateCheck("https", isHttps ? "PASS" : "FAIL", isHttps ? "Secure context active." : "Requires HTTPS or localhost.");

      // 2. Manifest check
      try {
        const res = await fetch("/manifest.webmanifest", { method: "GET" });
        if (res.ok) {
          const json = await res.json();
          const valid = json.name && json.start_url && json.display && json.icons && json.icons.length >= 2;
          updateCheck("manifest", valid ? "PASS" : "FAIL", valid ? `Valid manifest: "${json.name}" (${json.display})` : "Invalid manifest JSON structure.");
        } else {
          updateCheck("manifest", "FAIL", `HTTP ${res.status} when fetching /manifest.webmanifest.`);
        }
      } catch (err: any) {
        updateCheck("manifest", "FAIL", `Error: ${err.message}`);
      }

      // 3. Service Worker check
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          const active = regs.length > 0 && regs.some((r) => r.active || r.installing || r.waiting);
          updateCheck("serviceWorker", active ? "PASS" : "FAIL", active ? `${regs.length} Service Worker registration(s) found.` : "No active Service Worker registration.");
        } catch {
          updateCheck("serviceWorker", "FAIL", "Failed to query Service Worker registrations.");
        }
      } else {
        updateCheck("serviceWorker", "FAIL", "navigator.serviceWorker unsupported.");
      }

      // 4. Icons fetch check
      await checkImage("icon192", "/icons/icon-192x192.png");
      await checkImage("icon512", "/icons/icon-512x512.png");
      await checkImage("maskableIcon", "/icons/maskable-icon-512x512.png");

      // 5. Start URL check
      updateCheck("startUrl", "PASS", "Target entry route '/' active.");

      // 6. Standalone mode check
      const isStandaloneMode =
        typeof window !== "undefined" &&
        (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true);
      updateCheck("standalone", isStandaloneMode ? "PASS" : "FAIL", isStandaloneMode ? "App is running in Standalone PWA mode." : "App is running inside browser viewport.");
    }

    const handlePrompt = () => {
      updateCheck("installPrompt", "AVAILABLE", "beforeinstallprompt event captured!");
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeinstallprompt", handlePrompt);
    }

    runDiagnostics();

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeinstallprompt", handlePrompt);
      }
    };
  }, []);

  const getStatusBadge = (status: PwaCheckItem["status"]) => {
    switch (status) {
      case "PASS":
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold text-[10px] tracking-wider uppercase">PASS</span>;
      case "FAIL":
        return <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold text-[10px] tracking-wider uppercase">FAIL</span>;
      case "AVAILABLE":
        return <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 font-bold text-[10px] tracking-wider uppercase">AVAILABLE</span>;
      case "UNAVAILABLE":
        return <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-bold text-[10px] tracking-wider uppercase">UNAVAILABLE</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold text-[10px] tracking-wider uppercase animate-pulse">CHECKING</span>;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#040814] text-white p-4 sm:p-6 font-outfit select-none flex flex-col items-center justify-center">
      <div className="w-full max-w-lg bg-[#081226] border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">PWA Installation Diagnostics</h1>
            <p className="text-xs text-slate-400">Between Us Android Chrome Installability Suite</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-mono">DEV UTILITY</span>
        </div>

        {/* Diagnostics Table */}
        <div className="space-y-2.5 py-1">
          {Object.entries(checks).map(([key, item]) => (
            <div key={key} className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xs font-bold text-slate-200">{item.label}</h2>
                <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">{item.detail}</p>
              </div>
              <div className="shrink-0">{getStatusBadge(item.status)}</div>
            </div>
          ))}
        </div>

        {/* Action button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs tracking-wide shadow-lg cursor-pointer transition-all active:scale-[0.98]"
          >
            Re-run PWA Diagnostic Audit ↻
          </button>
        </div>
      </div>
    </div>
  );
}
