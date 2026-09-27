"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { IncomingCallModal } from "./IncomingCallModal";
import { AudioCallManager, setPendingIncomingCall } from "@/lib/webrtc/call-manager";
import { IncomingCallInvitation } from "@/lib/webrtc/types";
import { loadPairedPartner } from "@/lib/pairing/partner-store";
import { initializeDeviceIdentity } from "@/lib/crypto/identity";

export const GlobalIncomingCallHandler: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [incomingCall, setIncomingCall] = useState<IncomingCallInvitation | null>(null);
  const [partnerName, setPartnerName] = useState<string>("Your Partner");
  const callManagerRef = useRef<AudioCallManager | null>(null);

  useEffect(() => {
    // Don't run global listener if user is already inside an active call page
    if (pathname.includes("/call/") || pathname === "/audio" || pathname === "/video") {
      if (callManagerRef.current) {
        callManagerRef.current.stopListener();
        callManagerRef.current = null;
      }
      return;
    }

    let isMounted = true;

    async function initIncomingListener() {
      try {
        await initializeDeviceIdentity();
        const partner = await loadPairedPartner();
        if (!partner || !isMounted) return;

        const name =
          (partner as any).partnerName ||
          partner.partnerPublicIdentity?.fingerprint?.substring(0, 6) ||
          "Your Partner";
        setPartnerName(name);

        if (!callManagerRef.current) {
          callManagerRef.current = new AudioCallManager(
            {
              serverUrl:
                process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL ||
                "wss://signaling.betweenus.app",
              sessionId: `global_listen_${Date.now()}`,
              partnerIdentity: partner.partnerPublicIdentity,
            },
            {
              onCallStateChange: () => {},
            }
          );
        }

        await callManagerRef.current.listenForIncomingCall((invitation) => {
          if (isMounted) {
            setPendingIncomingCall({
              sessionId: invitation.sessionId,
              callType: invitation.callType,
              offerSdp: invitation.offerSdp || "",
              partnerIdentity: invitation.callerIdentity,
              timestamp: invitation.timestamp || Date.now(),
            });
            setIncomingCall(invitation);
          }
        });
      } catch (err) {
        console.warn("Global incoming call listener notice:", err);
      }
    }

    initIncomingListener();

    return () => {
      isMounted = false;
      if (callManagerRef.current) {
        callManagerRef.current.stopListener();
        callManagerRef.current = null;
      }
    };
  }, [pathname]);

  const handleAccept = () => {
    if (!incomingCall) return;
    const callType = incomingCall.callType || "audio";
    const sessionId = incomingCall.sessionId;
    setIncomingCall(null);

    // Stop background listener before navigating to call screen
    if (callManagerRef.current) {
      callManagerRef.current.stopListener();
      callManagerRef.current = null;
    }

    // Route to appropriate call screen with auto-answer session parameters
    const targetRoute =
      callType === "video"
        ? `/call/video?sessionId=${sessionId}&autoAnswer=true`
        : `/call/audio?sessionId=${sessionId}&autoAnswer=true`;

    router.push(targetRoute);
  };

  const handleDecline = () => {
    if (callManagerRef.current) {
      callManagerRef.current.declineCall();
      callManagerRef.current = null;
    }
    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  return (
    <IncomingCallModal
      callerName={partnerName}
      callType={incomingCall.callType}
      onAccept={handleAccept}
      onDecline={handleDecline}
    />
  );
};

