"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { loadPairedPartner } from "@/lib/pairing/partner-store";
import { SettingsModal } from "./SettingsModal";
import { HomeHeader } from "./HomeHeader";
import { PartnerConnection, ConnectionStatusType } from "./PartnerConnection";
import { CallActions } from "./CallActions";
import { SecurityCard } from "./SecurityCard";

interface HomeScreenProps {
  partnerName?: string | undefined;
  partnerAvatarUrl?: string | undefined;
  connectionStatus?: ConnectionStatusType | undefined;
  onInitiateAudioCall?: (() => void) | undefined;
  onInitiateVideoCall?: (() => void) | undefined;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  partnerName: initialPartnerName,
  partnerAvatarUrl,
  connectionStatus: initialConnectionStatus = "connected",
  onInitiateAudioCall,
  onInitiateVideoCall,
}) => {
  const router = useRouter();
  const [isPaired, setIsPaired] = useState<boolean>(false);
  const [partnerName, setPartnerName] = useState<string>(initialPartnerName || "Jona");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusType>(initialConnectionStatus);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    async function checkPairing() {
      try {
        const partner = await loadPairedPartner();
        if (partner) {
          setIsPaired(true);
          const name =
            (partner as any).partnerName ||
            partner.partnerPublicIdentity?.fingerprint?.substring(0, 6) ||
            initialPartnerName ||
            "Jona";
          setPartnerName(name);
          setConnectionStatus("connected");
        } else {
          setIsPaired(false);
          // If not paired, securely redirect to /pairing route
          router.push("/pairing");
        }
      } catch (err) {
        console.warn("Pairing check error:", err);
      } finally {
        setIsInitializing(false);
      }
    }
    checkPairing();
  }, [router, initialPartnerName]);

  const handleUnpairComplete = useCallback(() => {
    setIsPaired(false);
    router.push("/pairing");
  }, [router]);

  const handleAudioCallClick = () => {
    if (onInitiateAudioCall) {
      onInitiateAudioCall();
    } else {
      router.push("/audio");
    }
  };

  const handleVideoCallClick = () => {
    if (onInitiateVideoCall) {
      onInitiateVideoCall();
    } else {
      router.push("/video");
    }
  };

  if (isInitializing) {
    return (
      <div className="w-full min-h-screen bg-[#040814] flex flex-col items-center justify-center p-6 text-center select-none font-outfit">
        <div className="w-10 h-10 rounded-full border-3 border-teal-400 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-mono text-slate-400 animate-pulse">Loading Between Us...</p>
      </div>
    );
  }

  if (!isPaired) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="relative w-full min-h-screen bg-[#040814] text-white flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden font-outfit select-none min-h-dvh">
      {/* Full-Screen Romantic Background Artwork (Background(1).png) */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <Image
          src="/images/background.png"
          alt="Starry sky sunset romantic background artwork"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_20%] w-full h-full"
        />
        {/* Ambient Overlay for Legibility & Deep Dark Blue Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#040814]/40 via-transparent to-[#040814]/90 pointer-events-none" />
      </div>

      {/* Main Responsive Mobile PWA Container */}
      <div className="relative w-full max-w-md mx-auto min-h-[92vh] sm:min-h-[95vh] flex flex-col justify-between pt-1 pb-4 z-10 safe-area-inset">
        
        {/* Top Header Navigation */}
        <HomeHeader
          onOpenSettings={() => setIsSettingsOpen(true)}
          onHeartClick={() => setIsSettingsOpen(true)}
        />

        {/* Center Partner Connection & Avatar Section */}
        <PartnerConnection
          partnerName={partnerName}
          avatarUrl={partnerAvatarUrl}
          status={connectionStatus}
        />

        {/* Primary Call Action Cards (Audio & Video) */}
        <CallActions
          onInitiateAudioCall={handleAudioCallClick}
          onInitiateVideoCall={handleVideoCallClick}
          disabled={connectionStatus === "offline"}
        />

        {/* Bottom Security Card */}
        <SecurityCard
          partnerName={partnerName}
          onClick={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Settings & Privacy Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        partnerName={partnerName}
        onUnpairComplete={handleUnpairComplete}
      />
    </div>
  );
};
