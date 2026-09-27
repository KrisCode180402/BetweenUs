"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HomeScreen } from "@/components/between-us/HomeScreen";
import { loadPairedPartner } from "@/lib/pairing/partner-store";

export default function BetweenUsApp() {
  const router = useRouter();
  const [isCheckingPairing, setIsCheckingPairing] = useState(true);

  useEffect(() => {
    async function checkPairingStatus() {
      try {
        const partner = await loadPairedPartner();
        if (!partner) {
          router.push("/pairing");
        } else {
          setIsCheckingPairing(false);
        }
      } catch {
        router.push("/pairing");
      }
    }
    checkPairingStatus();
  }, [router]);

  const handleStartAudioCall = () => {
    router.push("/call/audio");
  };

  const handleStartVideoCall = () => {
    router.push("/call/video");
  };

  if (isCheckingPairing) {
    return (
      <div className="w-full min-h-screen bg-[#040814] flex flex-col items-center justify-center p-6 text-center select-none font-outfit">
        <div className="w-10 h-10 rounded-full border-3 border-teal-400 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-mono text-slate-400 animate-pulse">Loading Between Us...</p>
      </div>
    );
  }

  return (
    <HomeScreen
      onInitiateAudioCall={handleStartAudioCall}
      onInitiateVideoCall={handleStartVideoCall}
    />
  );
}

