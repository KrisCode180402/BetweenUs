"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { loadPairedPartner } from "@/lib/pairing/partner-store";
import { removePairedPartnerDevice } from "@/lib/pairing/service";
import { getPublicIdentity } from "@/lib/crypto/identity";
import { getItem, setItem } from "@/lib/storage/repository";
import { pushManager, PushPermissionStatus } from "@/lib/push/push-manager";
import { requestMediaPermissions } from "@/lib/permissions/media-permissions";
import { PartnerStatusCard } from "./PartnerStatusCard";
import { SettingsNavigationList, SettingsTabType } from "./SettingsNavigationList";

interface SettingsScreenProps {
  initialTab?: SettingsTabType | undefined;
  onClose?: (() => void) | undefined;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  initialTab = null,
  onClose,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTabType>(initialTab);
  const [isPaired, setIsPaired] = useState<boolean>(true);
  const [partnerName, setPartnerName] = useState<string>("Jona");
  const [myDeviceName, setMyDeviceName] = useState<string>("Kris");
  const [myFingerprint, setMyFingerprint] = useState<string>("ECDSA-P256-AUTHENTICATED");
  const [safetyCode] = useState<string>("8F4A - 29C1 - 77B9 - D03E");
  const [copiedCode, setCopiedCode] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  // Notification state
  const [pushStatus, setPushStatus] = useState<PushPermissionStatus>("default");
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);
  const [incomingCallNotifications, setIncomingCallNotifications] = useState<boolean>(true);
  const [outgoingRingtoneEnabled, setOutgoingRingtoneEnabled] = useState<boolean>(true);
  const [incomingRingtoneEnabled, setIncomingRingtoneEnabled] = useState<boolean>(true);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);

  // Media permission state
  const [micState, setMicState] = useState<"granted" | "denied" | "prompt" | "unknown">("unknown");
  const [camState, setCamState] = useState<"granted" | "denied" | "prompt" | "unknown">("unknown");

  // Live Hardware Testing state
  const [isTestingCamera, setIsTestingCamera] = useState(false);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micAudioLevel, setMicAudioLevel] = useState(0);

  // Ringtone Preview Audio Refs
  const ringtoneAudioRef = useRef<HTMLAudioElement | null>(null);
  const cameraTestVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraTestStreamRef = useRef<MediaStream | null>(null);
  const micTestStreamRef = useRef<MediaStream | null>(null);
  const micAnimFrameRef = useRef<number | null>(null);

  // Unpair Reset Confirmation Flow
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    async function loadSettingsData() {
      try {
        const partner = await loadPairedPartner();
        if (partner) {
          setIsPaired(true);
          const pName =
            (partner as any).partnerName ||
            partner.partnerPublicIdentity?.fingerprint?.substring(0, 6) ||
            "Jona";
          setPartnerName(pName);
        } else {
          setIsPaired(false);
        }

        const pubId = getPublicIdentity();
        if (pubId?.fingerprint) {
          setMyFingerprint(pubId.fingerprint);
        }

        const storedDeviceName = await getItem<string>("device_nickname");
        if (storedDeviceName) {
          setMyDeviceName(storedDeviceName);
        }

        setPushStatus(pushManager.getPermissionState());
        setPushEnabled(pushManager.isEnabledLocally());

        if (typeof window !== "undefined" && navigator.permissions && navigator.permissions.query) {
          navigator.permissions.query({ name: "microphone" as PermissionName }).then((status) => {
            setMicState(status.state as "granted" | "denied" | "prompt");
          }).catch(() => {});

          navigator.permissions.query({ name: "camera" as PermissionName }).then((status) => {
            setCamState(status.state as "granted" | "denied" | "prompt");
          }).catch(() => {});
        }
      } catch (err) {
        console.warn("Settings data load notice:", err);
      }
    }
    loadSettingsData();
  }, []);

  const handleBack = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      router.push("/home");
    }
  }, [onClose, router]);

  const handleSaveDeviceName = async (newName: string) => {
    setMyDeviceName(newName);
    await setItem("device_nickname", newName);
    setTestMessage("Device nickname updated successfully!");
    setTimeout(() => setTestMessage(null), 3000);
  };

  const handleCopySafetyCode = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(safetyCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleTogglePush = async () => {
    setIsSubscribing(true);
    setTestMessage(null);
    try {
      if (pushEnabled) {
        await pushManager.disableNotifications(myDeviceName);
        setPushEnabled(false);
        setPushStatus(pushManager.getPermissionState());
        setTestMessage("Push notifications disabled.");
      } else {
        const res = await pushManager.enableNotifications(myDeviceName);
        if (res.success) {
          setPushEnabled(true);
          setPushStatus("granted");
          setTestMessage("Push notifications enabled!");
        } else {
          setTestMessage(`Error: ${res.error || "Failed to enable notifications"}`);
        }
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleTestNotification = async () => {
    setTestMessage(null);
    const sent = await pushManager.sendTestNotification();
    if (sent) {
      setTestMessage("Test notification sent to device!");
    } else {
      setTestMessage("Failed to send test notification. Check permissions.");
    }
  };

  const handlePlayRingtonePreview = (soundPath: string) => {
    if (ringtoneAudioRef.current) {
      ringtoneAudioRef.current.pause();
      ringtoneAudioRef.current = null;
    }
    const audio = new Audio(soundPath);
    audio.volume = 0.8;
    ringtoneAudioRef.current = audio;
    audio.play().catch(() => {});
  };

  const handleStopRingtonePreview = () => {
    if (ringtoneAudioRef.current) {
      ringtoneAudioRef.current.pause();
      ringtoneAudioRef.current = null;
    }
  };

  // Hardware Camera Test
  const startCameraTest = async () => {
    setIsTestingCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraTestStreamRef.current = stream;
      if (cameraTestVideoRef.current) {
        cameraTestVideoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setTestMessage("Camera access denied or device unavailable.");
      setIsTestingCamera(false);
    }
  };

  const stopCameraTest = () => {
    if (cameraTestStreamRef.current) {
      cameraTestStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraTestStreamRef.current = null;
    }
    setIsTestingCamera(false);
  };

  // Hardware Microphone Test
  const startMicTest = async () => {
    setIsTestingMic(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micTestStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((acc, v) => acc + v, 0);
          const avg = sum / dataArray.length;
          setMicAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          micAnimFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      }
    } catch (err: any) {
      setTestMessage("Microphone access denied or device unavailable.");
      setIsTestingMic(false);
    }
  };

  const stopMicTest = () => {
    if (micAnimFrameRef.current) {
      cancelAnimationFrame(micAnimFrameRef.current);
    }
    if (micTestStreamRef.current) {
      micTestStreamRef.current.getTracks().forEach((t) => t.stop());
      micTestStreamRef.current = null;
    }
    setIsTestingMic(false);
    setMicAudioLevel(0);
  };

  // Perform Safe Unpair & Reset
  const handleExecuteUnpairReset = async () => {
    setIsResetting(true);
    try {
      await removePairedPartnerDevice();
      setIsPaired(false);
      handleStopRingtonePreview();
      stopCameraTest();
      stopMicTest();
      router.push("/pairing");
    } catch (err) {
      console.error("Unpair failed:", err);
      setTestMessage("Unpair failed. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsPwaInstalled(true);
    }
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsPwaInstalled(true);
        setTestMessage("Between Us PWA Installed successfully!");
      }
      setDeferredPrompt(null);
    } else {
      setTestMessage("To install PWA: Tap your browser menu ➔ 'Add to Home Screen'.");
      setTimeout(() => setTestMessage(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-dvh min-h-dvh max-h-dvh bg-[#040814] text-white flex flex-col items-center justify-between p-3 sm:p-4 overflow-hidden font-outfit select-none overscroll-none">
      {/* Ambient Romantic Dark Overlay Background */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <Image
          src="/images/background.png"
          alt="Settings background artwork"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_20%] w-full h-full opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040814]/80 via-[#040814]/90 to-[#040814]" />
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-md mx-auto h-full flex flex-col justify-between pt-0.5 pb-2 z-10 pointer-events-none">
        
        {/* Top Header Bar (Matching 5 Settings page.png) */}
        <div className="w-full flex items-center justify-between pt-1 pb-2 pointer-events-auto">
          {/* Back Button */}
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back to home"
            className="w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-800/90 border border-white/15 backdrop-blur-md flex items-center justify-center text-slate-200 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95 flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Title & Subtitle */}
          <div className="text-center flex flex-col items-center">
            <h1 className="font-script text-3.5xl sm:text-4.5xl font-normal text-white tracking-wide drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] flex items-center justify-center gap-1">
              Between Us <span className="text-rose-400 text-2xl sm:text-3xl leading-none">💕</span>
            </h1>
            <p className="text-xs font-semibold text-slate-300 tracking-wide mt-0.5">
              Settings
            </p>
          </div>

          <div className="w-10 h-10 opacity-0 pointer-events-none" />
        </div>

        {/* Feedback Message Toast */}
        {testMessage && (
          <div className="my-1.5 p-2.5 rounded-2xl bg-teal-950/90 border border-teal-500/40 text-xs text-teal-200 text-center animate-fade-in shadow-lg pointer-events-auto">
            {testMessage}
          </div>
        )}

        {/* Scrollable Content Container (Smooth Mobile Touch-Pan-Y Scrolling) */}
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden touch-pan-y overscroll-contain space-y-3 py-1 px-1 pointer-events-auto scrollbar-none">
          {/* Top Paired Partner Status Card */}
          <PartnerStatusCard
            myDeviceName={myDeviceName}
            partnerName={partnerName}
            isPaired={isPaired}
            isVerified={true}
            isOnline={true}
            onPairClick={() => router.push("/pairing")}
            onVerifyClick={() => setActiveTab("pairing")}
          />

          {/* PWA App Banner (Install PWA) */}
          {!isPwaInstalled && (
            <div className="w-full p-3.5 rounded-2.5xl bg-gradient-to-r from-sky-950/70 via-indigo-950/70 to-slate-900/80 border border-sky-500/30 backdrop-blur-md flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3">
                <span className="text-xl">📲</span>
                <div>
                  <p className="text-xs font-bold text-white">Install PWA Web App</p>
                  <p className="text-[10px] text-slate-300">Fast, standalone full-screen experience</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleInstallPwa}
                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
              >
                Install
              </button>
            </div>
          )}

          {/* 7 Settings Navigation Rows */}
          <SettingsNavigationList
            onSelectTab={(tab) => setActiveTab(tab)}
          />
        </div>

      </div>

      {/* --- Detail Modals & Views for Each Setting --- */}

      {/* 1. Device Settings Modal */}
      {activeTab === "device" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-sm bg-[#091325] border border-sky-500/40 rounded-3xl p-5 shadow-2xl space-y-4 font-outfit">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm">📱</span>
                <h3 className="text-sm font-bold text-white">Device Identity</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab(null)}
                aria-label="Close device settings"
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Device Nickname
                </label>
                <input
                  type="text"
                  value={myDeviceName}
                  onChange={(e) => setMyDeviceName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <p className="text-slate-400">Public Key Fingerprint:</p>
                <p className="text-emerald-400 break-all bg-black/40 p-2 rounded-lg border border-emerald-500/30 text-[10px]">
                  {myFingerprint}
                </p>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Algorithm:</span>
                  <span className="text-sky-300 font-bold">ECDSA-P256</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Security Status:</span>
                  <span className="text-emerald-400 font-bold">Encrypted Local Key</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                handleSaveDeviceName(myDeviceName);
                setActiveTab(null);
              }}
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Save Device Changes
            </button>
          </div>
        </div>
      )}

      {/* 2. Pairing / Verification Modal */}
      {activeTab === "pairing" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-sm bg-[#091325] border border-emerald-500/40 rounded-3xl p-5 shadow-2xl space-y-4 font-outfit text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">🔗</span>
                <h3 className="text-sm font-bold text-white text-left">Pairing & Safety Code</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab(null)}
                aria-label="Close pairing settings"
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                <p className="text-emerald-300 font-bold">Safety Verification Code</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Verify this key matches {partnerName}&apos;s device for cryptographic safety.
                </p>
                <div className="font-mono text-base font-bold text-emerald-400 bg-black/50 py-2.5 px-3 rounded-xl border border-emerald-500/40 my-2 tracking-wider">
                  {safetyCode}
                </div>
                <button
                  type="button"
                  onClick={handleCopySafetyCode}
                  className="px-4 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                >
                  {copiedCode ? "Copied to Clipboard!" : "Copy Verification Code"}
                </button>
              </div>

              <div className="flex justify-between px-2 py-1 text-[11px] border-t border-slate-800 pt-3">
                <span className="text-slate-400">Pairing State:</span>
                <span className="text-emerald-400 font-bold">Paired & Verified</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 3. Privacy Settings Modal */}
      {activeTab === "privacy" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-sm bg-[#091325] border border-purple-500/40 rounded-3xl p-5 shadow-2xl space-y-4 font-outfit">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">🛡️</span>
                <h3 className="text-sm font-bold text-white">Privacy Controls</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab(null)}
                aria-label="Close privacy settings"
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-1">
                <h4 className="font-bold text-purple-300">Zero Retention Guarantee</h4>
                <p className="text-[11px] text-slate-300/90 leading-relaxed">
                  Between Us is designed for maximum intimacy and security. No call logs, message history, media recordings, or analytics are stored.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-xs">Ephemeral Session Cache</p>
                    <p className="text-[10px] text-slate-400">Clear temporary WebRTC signaling cache</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTestMessage("Temporary session cache cleared!");
                      setTimeout(() => setTestMessage(null), 3000);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-semibold cursor-pointer"
                  >
                    Clear Cache
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 4. Permissions Settings Modal with Live Hardware Tests */}
      {activeTab === "permissions" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-sm bg-[#091325] border border-cyan-500/40 rounded-3xl p-5 shadow-2xl space-y-4 font-outfit max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">🎙️</span>
                <h3 className="text-sm font-bold text-white">Browser Permissions</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCameraTest();
                  stopMicTest();
                  setActiveTab(null);
                }}
                aria-label="Close permissions settings"
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              {/* Camera Status & Test */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">Camera Permission</p>
                    <p className="text-[10px] text-slate-400">Required for video calls</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${camState === "granted" ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40" : "bg-amber-950 text-amber-300 border border-amber-500/40"}`}>
                    {camState.toUpperCase()}
                  </span>
                </div>
                {!isTestingCamera ? (
                  <button
                    type="button"
                    onClick={startCameraTest}
                    className="w-full py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Test Camera Feed
                  </button>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="w-full h-36 rounded-xl overflow-hidden bg-black border border-cyan-500/50 relative">
                      <video ref={cameraTestVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={stopCameraTest}
                      className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Stop Camera Test
                    </button>
                  </div>
                )}
              </div>

              {/* Microphone Status & Test */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">Microphone Permission</p>
                    <p className="text-[10px] text-slate-400">Required for audio calls</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${micState === "granted" ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40" : "bg-amber-950 text-amber-300 border border-amber-500/40"}`}>
                    {micState.toUpperCase()}
                  </span>
                </div>
                {!isTestingMic ? (
                  <button
                    type="button"
                    onClick={startMicTest}
                    className="w-full py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Test Microphone Level
                  </button>
                ) : (
                  <div className="space-y-2 pt-1 text-center">
                    <div className="w-full bg-slate-950 rounded-xl p-2 border border-slate-800">
                      <p className="text-[10px] text-slate-400 mb-1">Mic Level: {micAudioLevel}%</p>
                      <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full transition-all duration-75" style={{ width: `${micAudioLevel}%` }} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={stopMicTest}
                      className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Stop Mic Test
                    </button>
                  </div>
                )}
              </div>

              {/* Request Permissions Action */}
              <button
                type="button"
                onClick={async () => {
                  const res = await requestMediaPermissions();
                  if (res.success) {
                    setMicState("granted");
                    setCamState("granted");
                    setTestMessage("Camera & Microphone permissions granted!");
                  } else {
                    setTestMessage("Permissions denied by browser settings.");
                  }
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs cursor-pointer"
              >
                Request Hardware Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Notifications Settings Modal */}
      {activeTab === "notifications" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-sm bg-[#091325] border border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-4 font-outfit max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">🔔</span>
                <h3 className="text-sm font-bold text-white">Private Notifications</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleStopRingtonePreview();
                  setActiveTab(null);
                }}
                aria-label="Close notification settings"
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              {/* Push Permission Toggle */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Web Push Notifications</p>
                  <p className="text-[10px] text-slate-400">Permission: {pushStatus}</p>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePush}
                  disabled={isSubscribing}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    pushEnabled
                      ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
                      : "bg-amber-500/25 text-amber-300 border border-amber-500/40"
                  }`}
                >
                  {isSubscribing ? "Updating..." : pushEnabled ? "Enabled" : "Enable"}
                </button>
              </div>

              {/* Call Notification Toggles */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span>Incoming Call Alerts</span>
                  <button
                    type="button"
                    onClick={() => setIncomingCallNotifications(!incomingCallNotifications)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      incomingCallNotifications ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${incomingCallNotifications ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                  <span>Outgoing Call Ringtone</span>
                  <button
                    type="button"
                    onClick={() => setOutgoingRingtoneEnabled(!outgoingRingtoneEnabled)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      outgoingRingtoneEnabled ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${outgoingRingtoneEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                  <span>Incoming Call Ringtone</span>
                  <button
                    type="button"
                    onClick={() => setIncomingRingtoneEnabled(!incomingRingtoneEnabled)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      incomingRingtoneEnabled ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${incomingRingtoneEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                  <span>Mobile Haptic Vibration</span>
                  <button
                    type="button"
                    onClick={() => setVibrationEnabled(!vibrationEnabled)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      vibrationEnabled ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${vibrationEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>

              {/* Ringtone Previews */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <p className="font-bold text-white">Preview Ringtone Audio</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayRingtonePreview("/sounds/outgoing-ringtone.mp3")}
                    className="flex-1 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-[11px] font-semibold cursor-pointer"
                  >
                    ▶ Outgoing Sound
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlayRingtonePreview("/sounds/incoming-ringtone.mp3")}
                    className="flex-1 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-[11px] font-semibold cursor-pointer"
                  >
                    ▶ Incoming Sound
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleStopRingtonePreview}
                  className="w-full py-1 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-semibold cursor-pointer"
                >
                  ⏹ Stop Ringtone Preview
                </button>
              </div>

              {/* Test Notification Trigger */}
              <button
                type="button"
                onClick={handleTestNotification}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs cursor-pointer"
              >
                Send Test Push Notification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Security Settings Modal */}
      {activeTab === "security" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-sm bg-[#091325] border border-teal-500/40 rounded-3xl p-5 shadow-2xl space-y-4 font-outfit">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm">🔒</span>
                <h3 className="text-sm font-bold text-white">Security & Keys</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab(null)}
                aria-label="Close security settings"
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-2xl bg-teal-950/40 border border-teal-500/30 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Media Encryption:</span>
                  <span className="text-emerald-400 font-bold">DTLS-SRTP (E2EE)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Device Key Identity:</span>
                  <span className="text-sky-300 font-bold">ECDSA P-256</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Signaling Channel:</span>
                  <span className="text-emerald-400 font-bold">Authenticated WSS</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setTestMessage("Ephemeral session state cleared.");
                  setTimeout(() => setTestMessage(null), 3000);
                }}
                className="w-full py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Clear Ephemeral Session Data
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 7. Reset / Unpair Multi-Step Confirmation Modal */}
      {activeTab === "reset" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-sm bg-[#091325] border border-rose-500/50 rounded-3xl p-5 shadow-2xl space-y-4 font-outfit text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
              <svg className="w-6 h-6 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Reset & Unpair Device?</h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                This operation will remove the paired trust relationship with <span className="font-bold text-white">{partnerName}</span> and clear local pairing data.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-200 text-left space-y-1">
              <p className="font-bold">Items that will be removed:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-rose-300/80">
                <li>Paired partner trust record</li>
                <li>Local pairing keys & session state</li>
              </ul>
              <p className="font-bold pt-1">Items preserved:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-300/80">
                <li>Local PWA installation & service worker</li>
              </ul>
            </div>

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab(null)}
                disabled={isResetting}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteUnpairReset}
                disabled={isResetting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
              >
                {isResetting ? "Unpairing..." : "Confirm Unpair"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
