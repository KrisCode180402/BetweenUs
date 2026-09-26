"use client";

import { useEffect, useState } from "react";

export function SWRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (
      process.env.NODE_ENV === "development" ||
      (typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1"))
    ) {
      // In development on localhost, unregister service worker and clear stale caches to allow clean HMR
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ("caches" in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        // Listen for new service worker installation
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setUpdateAvailable(true);
              setWaitingWorker(newWorker);
            }
          });
        });
      } catch {
        // Silent failure in development / unsupported environments
      }
    };

    registerSW();
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-cyan-500/30 bg-slate-900/95 p-4 text-xs shadow-xl backdrop-blur-md"
    >
      <span className="text-slate-300">
        A security & app update is available.
      </span>
      <button
        onClick={handleUpdate}
        className="rounded bg-cyan-500 px-3 py-1.5 font-medium text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
      >
        Update Now
      </button>
    </div>
  );
}
