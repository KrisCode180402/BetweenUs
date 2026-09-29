"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { IncomingCallModal } from "./IncomingCallModal";
import { AudioCallManager, setPendingIncomingCall } from "@/lib/webrtc/call-manager";
import { IncomingCallInvitation } from "@/lib/webrtc/types";
import { loadPairedPartner } from "@/lib/pairing/partner-store";
import { initializeDeviceIdentity } from "@/lib/crypto/identity";
import { ringtoneManager } from "@/lib/sound/ringtone";

export const GlobalIncomingCallHandler: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [incomingCall, setIncomingCall] = useState<IncomingCallInvitation | null>(null);
  const [partnerName, setPartnerName] = useState<string>("Your Partner");
  const callManagerRef = useRef<AudioCallManager | null>(null);

  const isCallPage = pathname.startsWith("/call/") || pathname === "/audio" || pathname === "/video";

  const triggerBrowserNotification = useCallback((invitation: IncomingCallInvitation, callerName: string) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      try {
        const title = invitation.callType === "video" ? "Incoming Video Call 📹" : "Incoming Audio Call 📞";
        const notif = new Notification(title, {
          body: `${callerName} is calling you on Between Us...`,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-192x192.png",
          tag: "incoming-call-notification",
          requireInteraction: true,
        });

        notif.onclick = () => {
          try {
            window.focus();
          } catch {}
          notif.close();
        };
      } catch (err) {
        console.warn("Browser notification creation notice:", err);
      }
    }
  }, []);

  const setupListener = useCallback(async () => {
    if (isCallPage) {
      if (callManagerRef.current) {
        callManagerRef.current.stopListener();
        callManagerRef.current = null;
      }
      return;
    }

    try {
      await initializeDeviceIdentity();
      const partner = await loadPairedPartner();
      if (!partner) return;

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
        setPendingIncomingCall({
          sessionId: invitation.sessionId,
          callType: invitation.callType,
          offerSdp: invitation.offerSdp || "",
          partnerIdentity: invitation.callerIdentity,
          timestamp: invitation.timestamp || Date.now(),
        });
        setIncomingCall(invitation);

        // Explicitly trigger audio ringtone & Web Notification
        ringtoneManager.playIncomingRingtone();
        triggerBrowserNotification(invitation, name);
      });
    } catch (err) {
      console.warn("Global incoming call listener notice:", err);
    }
  }, [isCallPage, triggerBrowserNotification]);

  useEffect(() => {
    let isSubscribed = true;

    setupListener();

    // Auto-reconnect signaling listener when device wakes up or network recovers
    const handleVisibilityOrOnline = () => {
      if (document.visibilityState === "visible" && !isCallPage && isSubscribed) {
        setupListener();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityOrOnline);
    window.addEventListener("online", handleVisibilityOrOnline);

    return () => {
      isSubscribed = false;
      window.removeEventListener("visibilitychange", handleVisibilityOrOnline);
      window.removeEventListener("online", handleVisibilityOrOnline);
      if (callManagerRef.current) {
        callManagerRef.current.stopListener();
        callManagerRef.current = null;
      }
    };
  }, [isCallPage, setupListener]);

  const handleAccept = () => {
    if (!incomingCall) return;
    ringtoneManager.stopAll();
    const callType = incomingCall.callType || "audio";
    const sessionId = incomingCall.sessionId;
    setIncomingCall(null);

    if (callManagerRef.current) {
      callManagerRef.current.stopListener();
      callManagerRef.current = null;
    }

    const targetRoute =
      callType === "video"
        ? `/call/video?sessionId=${sessionId}&autoAnswer=true`
        : `/call/audio?sessionId=${sessionId}&autoAnswer=true`;

    router.push(targetRoute);
  };

  const handleDecline = async () => {
    ringtoneManager.stopAll();
    if (callManagerRef.current) {
      await callManagerRef.current.declineCall();
      callManagerRef.current = null;
    }
    setIncomingCall(null);
  };

  if (!incomingCall || isCallPage) return null;

  return (
    <IncomingCallModal
      callerName={partnerName}
      callType={incomingCall.callType}
      onAccept={handleAccept}
      onDecline={handleDecline}
    />
  );
};
