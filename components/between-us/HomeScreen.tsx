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
  const [partnerName, setPartnerName] = useState<string>(initialPartnerName || "Partner");
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
            "Partner";
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
      router.push("/call/audio");
    }
  };

  const handleVideoCallClick = () => {
    if (onInitiateVideoCall) {
      onInitiateVideoCall();
    } else {
      router.push("/call/video");
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
    <div className="relative w-full h-dvh min-h-dvh max-h-dvh bg-[#040814] text-white flex flex-col items-center justify-between p-3 sm:p-4 overflow-hidden font-outfit select-none">
      {/* Full-Screen Background Artwork */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <Image
          src="/images/background.png"
          alt="Starry sky sunset romantic background artwork"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_15%] w-full h-full"
        />
        {/* Ambient Overlay for Legibility & Deep Dark Blue Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#040814]/30 via-transparent to-[#040814]/90 pointer-events-none" />
      </div>

      {/* Main Responsive Mobile Container */}
      <div className="relative w-full max-w-md mx-auto h-full flex flex-col justify-between pt-0.5 pb-4 sm:pb-6 z-10 overflow-y-auto sm:overflow-hidden scrollbar-none">
        
        {/* Top Header Navigation */}
        <HomeHeader
          onOpenSettings={() => setIsSettingsOpen(true)}
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
        <div className="w-full flex-shrink-0 pt-1">
          <SecurityCard
            partnerName={partnerName}
            onClick={() => setIsSettingsOpen(true)}
          />
        </div>
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
