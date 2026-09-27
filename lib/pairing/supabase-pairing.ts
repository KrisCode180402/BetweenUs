import { supabase } from "../supabase/client";
import { savePairedPartner, removePairedDevice } from "./partner-store";
import { DevicePublicIdentity } from "../crypto/identity/types";
import { initializeDeviceIdentity, getPublicIdentity } from "../crypto/identity/service";
import { PairedPartnerRecord } from "./types";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface PairingSessionInfo {
  sessionId: string;
  pairingCode: string;
  expiresAt: number;
}

export interface IncomingPairingRequest {
  sessionId: string;
  targetDeviceId: string;
  targetDeviceName: string;
}

const LOCAL_STORAGE_KEY_PREFIX = "between_us_pairing_sess_";
const BROADCAST_CHANNEL_NAME = "between_us_pairing_sync_channel";

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    try {
      return new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Generates a high-entropy, human-readable 12-character pairing code: e.g. "AB7K-92PX-M4QW"
 */
export function generateSecurePairingCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = new Uint8Array(12);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 12; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let code = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) {
      code += "-";
    }
    const val = bytes[i] ?? 0;
    code += chars[val % chars.length];
  }
  return code;
}

/**
 * SHA-256 hash helper for secure pairing code storing.
 */
export async function hashPairingCode(code: string): Promise<string> {
  const cleanCode = code.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(`between-us-pairing-salt:${cleanCode}`);

  const subtle =
    typeof globalThis !== "undefined" && globalThis.crypto?.subtle
      ? globalThis.crypto.subtle
      : typeof window !== "undefined" && window.crypto?.subtle
      ? window.crypto.subtle
      : null;

  if (subtle) {
    const hashBuffer = await subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const charCode = data[i] ?? 0;
    hash = (hash << 5) - hash + charCode;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Registers local device identity in Supabase `device_identities` table.
 */
export async function syncLocalDeviceIdentity(deviceName?: string): Promise<DevicePublicIdentity> {
  const publicIdentity = await initializeDeviceIdentity();
  const name =
    deviceName ||
    (typeof navigator !== "undefined" && navigator.userAgent.includes("Mobile")
      ? "Mobile Device"
      : "Desktop Device");

  try {
    await supabase.from("device_identities").upsert({
      id: publicIdentity.fingerprint,
      name,
      fingerprint: publicIdentity.fingerprint,
      spki_hex: publicIdentity.spkiHex,
      last_seen_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Failed to sync device identity to Supabase:", err);
  }

  return publicIdentity;
}

/**
 * Device A: Creates a pairing invitation session in Supabase & local channels.
 */
export async function createPairingSession(deviceName?: string): Promise<PairingSessionInfo> {
  const identity = await syncLocalDeviceIdentity(deviceName);
  const rawCode = generateSecurePairingCode();
  const codeHash = await hashPairingCode(rawCode);
  const expiresAt = Date.now() + 10 * 60 * 1000;

  let sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  try {
    const { data } = await supabase
      .from("pairing_sessions")
      .insert({
        initiator_device_id: identity.fingerprint,
        initiator_device_name: deviceName || "My Device",
        pairing_code_hash: codeHash,
        status: "PENDING",
        expires_at: new Date(expiresAt).toISOString(),
      })
      .select()
      .single();

    if (data && data.id) {
      sessionId = data.id;
    }
  } catch (err) {
    console.warn("[Pairing] Supabase insert fallback:", err);
  }

  // Save to local storage for instant multi-tab sync
  const localData = {
    sessionId,
    rawCode,
    codeHash,
    initiatorDeviceId: identity.fingerprint,
    initiatorDeviceName: deviceName || "My Device",
    status: "PENDING",
    expiresAt,
  };

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${sessionId}`, JSON.stringify(localData));
      localStorage.setItem(`between_us_pairing_code_${codeHash}`, JSON.stringify(localData));
    }
  } catch {}

  // Broadcast via BroadcastChannel
  const bc = getBroadcastChannel();
  if (bc) {
    bc.postMessage({ type: "SESSION_CREATED", payload: localData });
    bc.close();
  }

  return {
    sessionId,
    pairingCode: rawCode,
    expiresAt,
  };
}

/**
 * Device A: Subscribes to pairing session updates via 4 redundant layers:
 * 1. Supabase Polling + 2. Realtime Postgres + 3. LocalStorage Event + 4. BroadcastChannel
 */
export function subscribeToPairingSession(
  sessionId: string,
  callbacks: {
    onRequestReceived: (req: IncomingPairingRequest) => void;
    onAccepted: (coupleId: string) => void;
    onRejected: () => void;
    onExpired: () => void;
  }
): () => void {
  let handledStatus: string | null = null;

  const processStatus = (status: string, targetDeviceId?: string, targetDeviceName?: string, coupleId?: string) => {
    if (status === "REQUESTED" && handledStatus !== "REQUESTED") {
      handledStatus = "REQUESTED";
      callbacks.onRequestReceived({
        sessionId,
        targetDeviceId: targetDeviceId || "target_partner_device",
        targetDeviceName: targetDeviceName || "Partner Device",
      });
    } else if (status === "ACCEPTED" && coupleId && handledStatus !== "ACCEPTED") {
      handledStatus = "ACCEPTED";
      callbacks.onAccepted(coupleId);
    } else if (status === "REJECTED" && handledStatus !== "REJECTED") {
      handledStatus = "REJECTED";
      callbacks.onRejected();
    } else if (status === "EXPIRED" && handledStatus !== "EXPIRED") {
      handledStatus = "EXPIRED";
      callbacks.onExpired();
    }
  };

  const checkLocalAndRemote = async () => {
    // 1. Check local storage
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${sessionId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.status) {
            processStatus(parsed.status, parsed.targetDeviceId, parsed.targetDeviceName, parsed.coupleId);
          }
        }
      }
    } catch {}

    // 2. Check Supabase DB
    try {
      const { data: row, error } = await supabase
        .from("pairing_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (row && !error) {
        processStatus(row.status, row.target_device_id, row.target_device_name, row.couple_id);
      }
    } catch {}
  };

  // Immediate initial check
  checkLocalAndRemote();

  // High-frequency 800ms interval polling
  const pollInterval = setInterval(checkLocalAndRemote, 800);

  // BroadcastChannel listener
  const bc = getBroadcastChannel();
  if (bc) {
    bc.onmessage = (event) => {
      const data = event.data;
      if (data && data.payload && data.payload.sessionId === sessionId) {
        processStatus(
          data.payload.status,
          data.payload.targetDeviceId,
          data.payload.targetDeviceName,
          data.payload.coupleId
        );
      }
    };
  }

  // Window Storage Event listener
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === `${LOCAL_STORAGE_KEY_PREFIX}${sessionId}` && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        processStatus(parsed.status, parsed.targetDeviceId, parsed.targetDeviceName, parsed.coupleId);
      } catch {}
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageEvent);
  }

  // Supabase Realtime channel
  const channel: RealtimeChannel = supabase
    .channel(`pairing:${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "pairing_sessions",
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        const newRow = payload.new;
        if (newRow) {
          processStatus(newRow.status, newRow.target_device_id, newRow.target_device_name, newRow.couple_id);
        }
      }
    )
    .on("broadcast", { event: "REQUEST_PAIRING" }, (payload) => {
      if (payload.payload) {
        processStatus("REQUESTED", payload.payload.targetDeviceId, payload.payload.targetDeviceName);
      }
    })
    .subscribe();

  return () => {
    clearInterval(pollInterval);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageEvent);
    }
    if (bc) {
      bc.close();
    }
    try {
      supabase.removeChannel(channel);
    } catch {}
  };
}

/**
 * Device B: Submits entered pairing code.
 */
export async function submitPairingCode(
  rawCode: string,
  deviceName?: string
): Promise<{ success: boolean; message?: string; sessionId?: string; initiatorName?: string }> {
  const identity = await syncLocalDeviceIdentity(deviceName);
  const codeHash = await hashPairingCode(rawCode);
  const cleanCode = rawCode.replace(/[^A-Z0-9]/gi, "").toUpperCase();

  let foundSession: any = null;

  // 1. Try finding matching session in Supabase
  try {
    const { data: session } = await supabase
      .from("pairing_sessions")
      .select("*")
      .eq("pairing_code_hash", codeHash)
      .eq("status", "PENDING")
      .single();

    if (session) {
      foundSession = session;
    }
  } catch {}

  // 2. Fallback: check local storage if Supabase is offline or multi-tab local
  if (!foundSession && typeof localStorage !== "undefined") {
    try {
      const rawLocal = localStorage.getItem(`between_us_pairing_code_${codeHash}`);
      if (rawLocal) {
        foundSession = JSON.parse(rawLocal);
      } else {
        // Scan keys for raw matching code
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(LOCAL_STORAGE_KEY_PREFIX)) {
            const val = localStorage.getItem(key);
            if (val) {
              const parsed = JSON.parse(val);
              if (
                parsed.rawCode &&
                parsed.rawCode.replace(/[^A-Z0-9]/gi, "").toUpperCase() === cleanCode &&
                parsed.status === "PENDING"
              ) {
                foundSession = parsed;
                break;
              }
            }
          }
        }
      }
    } catch {}
  }

  if (!foundSession) {
    return {
      success: false,
      message: "Invalid or expired pairing code. Please double-check the code and try again.",
    };
  }

  const targetDeviceName = deviceName || "Partner Device";
  const sessionId = foundSession.id || foundSession.sessionId;

  // Update session status to REQUESTED in Supabase
  try {
    await supabase
      .from("pairing_sessions")
      .update({
        status: "REQUESTED",
        target_device_id: identity.fingerprint,
        target_device_name: targetDeviceName,
      })
      .eq("id", sessionId);
  } catch {}

  // Update local storage for multi-tab / local network sync
  const updatedLocal = {
    ...foundSession,
    sessionId,
    status: "REQUESTED",
    targetDeviceId: identity.fingerprint,
    targetDeviceName,
  };

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${sessionId}`, JSON.stringify(updatedLocal));
      localStorage.setItem(`between_us_pairing_code_${codeHash}`, JSON.stringify(updatedLocal));
    }
  } catch {}

  // Broadcast event via BroadcastChannel
  const bc = getBroadcastChannel();
  if (bc) {
    bc.postMessage({ type: "REQUEST_PAIRING", payload: updatedLocal });
    bc.close();
  }

  // Broadcast real-time signal via Supabase
  try {
    const broadcastChan = supabase.channel(`pairing:${sessionId}`);
    broadcastChan.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        broadcastChan.send({
          type: "broadcast",
          event: "REQUEST_PAIRING",
          payload: {
            sessionId,
            targetDeviceId: identity.fingerprint,
            targetDeviceName,
          },
        });
      }
    });
  } catch {}

  return {
    success: true,
    sessionId,
    initiatorName: foundSession.initiator_device_name || foundSession.initiatorDeviceName || "Initiator Device",
  };
}

/**
 * Device A: Accepts pairing request from Device B.
 */
export async function acceptPairingRequest(
  sessionId: string,
  targetDeviceId: string,
  targetDeviceName: string
): Promise<{ success: boolean; coupleId: string }> {
  const identity = await getPublicIdentity();
  const localDeviceId = identity?.fingerprint || "local_initiator_device";
  let coupleId = `couple_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Try Supabase couple creation
  try {
    const { data: couple } = await supabase.from("couples").insert({}).select().single();
    if (couple && couple.id) {
      coupleId = couple.id;

      await supabase.from("couple_members").insert([
        {
          couple_id: coupleId,
          device_id: localDeviceId,
          device_name: "My Device",
        },
        {
          couple_id: coupleId,
          device_id: targetDeviceId,
          device_name: targetDeviceName,
        },
      ]);

      await supabase
        .from("pairing_sessions")
        .update({
          status: "ACCEPTED",
          couple_id: coupleId,
          used_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
    }
  } catch (err) {
    console.warn("[Pairing] Supabase couple creation fallback:", err);
  }

  // Update local storage
  try {
    if (typeof localStorage !== "undefined") {
      const existing = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${sessionId}`);
      const parsed = existing ? JSON.parse(existing) : {};
      const updated = {
        ...parsed,
        sessionId,
        status: "ACCEPTED",
        coupleId,
        targetDeviceId,
        targetDeviceName,
      };
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${sessionId}`, JSON.stringify(updated));
    }
  } catch {}

  // Broadcast ACCEPT_PAIRING event via BroadcastChannel
  const bc = getBroadcastChannel();
  if (bc) {
    bc.postMessage({
      type: "ACCEPT_PAIRING",
      payload: { sessionId, coupleId, status: "ACCEPTED", targetDeviceId, targetDeviceName },
    });
    bc.close();
  }

  // Broadcast via Supabase
  try {
    const broadcastChan = supabase.channel(`pairing_resp:${sessionId}`);
    broadcastChan.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        broadcastChan.send({
          type: "broadcast",
          event: "ACCEPT_PAIRING",
          payload: { coupleId },
        });
      }
    });
  } catch {}

  // Save paired partner locally in IndexedDB / Store
  const record: PairedPartnerRecord = {
    id: "partner_trust",
    partnerPublicIdentity: {
      algorithm: "ECDSA-P256",
      spkiHex: "",
      fingerprint: targetDeviceId,
      createdAt: Date.now(),
    },
    pairedAt: Date.now(),
    version: 1,
  };

  (record as any).coupleId = coupleId;
  (record as any).partnerName = targetDeviceName;

  await savePairedPartner(record);

  return { success: true, coupleId };
}

/**
 * Device A: Rejects pairing request from Device B.
 */
export async function rejectPairingRequest(sessionId: string): Promise<void> {
  try {
    await supabase.from("pairing_sessions").update({ status: "REJECTED" }).eq("id", sessionId);
  } catch {}

  try {
    if (typeof localStorage !== "undefined") {
      const existing = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${sessionId}`);
      if (existing) {
        const parsed = JSON.parse(existing);
        localStorage.setItem(
          `${LOCAL_STORAGE_KEY_PREFIX}${sessionId}`,
          JSON.stringify({ ...parsed, status: "REJECTED" })
        );
      }
    }
  } catch {}

  const bc = getBroadcastChannel();
  if (bc) {
    bc.postMessage({ type: "REJECT_PAIRING", payload: { sessionId, status: "REJECTED" } });
    bc.close();
  }

  try {
    const broadcastChan = supabase.channel(`pairing_resp:${sessionId}`);
    broadcastChan.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        broadcastChan.send({
          type: "broadcast",
          event: "REJECT_PAIRING",
          payload: {},
        });
      }
    });
  } catch {}
}

/**
 * Device B: Listens for Device A's approval response on pairing session.
 */
export function subscribeToPairingResponse(
  sessionId: string,
  callbacks: {
    onAccepted: (coupleId: string) => void;
    onRejected: () => void;
  }
): () => void {
  let handled = false;

  const handleAcceptance = async (
    coupleId: string,
    targetDeviceId: string,
    initiatorName: string,
    initiatorDeviceId: string
  ) => {
    if (handled) return;
    handled = true;

    let partnerName = initiatorName || "Partner Device";
    let partnerDeviceId = initiatorDeviceId || "initiator_partner_device";

    try {
      const { data: member } = await supabase
        .from("couple_members")
        .select("*")
        .eq("couple_id", coupleId)
        .neq("device_id", targetDeviceId)
        .single();

      if (member) {
        partnerName = member.device_name || partnerName;
        partnerDeviceId = member.device_id || partnerDeviceId;
      }
    } catch {}

    const record: PairedPartnerRecord = {
      id: "partner_trust",
      partnerPublicIdentity: {
        algorithm: "ECDSA-P256",
        spkiHex: "",
        fingerprint: partnerDeviceId,
        createdAt: Date.now(),
      },
      pairedAt: Date.now(),
      version: 1,
    };

    (record as any).coupleId = coupleId;
    (record as any).partnerName = partnerName;

    await savePairedPartner(record);
    callbacks.onAccepted(coupleId);
  };

  const checkResponseStatus = async () => {
    if (handled) return;

    // Check localStorage
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${sessionId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.status === "ACCEPTED" && parsed.coupleId) {
            await handleAcceptance(
              parsed.coupleId,
              parsed.targetDeviceId || "",
              parsed.initiatorDeviceName || "Partner",
              parsed.initiatorDeviceId || ""
            );
            return;
          } else if (parsed.status === "REJECTED") {
            handled = true;
            callbacks.onRejected();
            return;
          }
        }
      }
    } catch {}

    // Check Supabase DB
    try {
      const { data: row } = await supabase
        .from("pairing_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (row && row.status === "ACCEPTED" && row.couple_id) {
        await handleAcceptance(
          row.couple_id,
          row.target_device_id || "",
          row.initiator_device_name || "Partner",
          row.initiator_device_id
        );
      } else if (row && row.status === "REJECTED") {
        handled = true;
        callbacks.onRejected();
      }
    } catch {}
  };

  // Immediate check & 800ms polling fallback
  checkResponseStatus();
  const pollInterval = setInterval(checkResponseStatus, 800);

  // BroadcastChannel listener
  const bc = getBroadcastChannel();
  if (bc) {
    bc.onmessage = (event) => {
      const data = event.data;
      if (data && data.payload && data.payload.sessionId === sessionId) {
        if (data.payload.status === "ACCEPTED" || data.type === "ACCEPT_PAIRING") {
          handleAcceptance(
            data.payload.coupleId || "couple_local",
            data.payload.targetDeviceId || "",
            data.payload.initiatorDeviceName || "Partner",
            data.payload.initiatorDeviceId || ""
          );
        } else if (data.payload.status === "REJECTED" || data.type === "REJECT_PAIRING") {
          if (!handled) {
            handled = true;
            callbacks.onRejected();
          }
        }
      }
    };
  }

  // Storage Event listener
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === `${LOCAL_STORAGE_KEY_PREFIX}${sessionId}` && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed.status === "ACCEPTED" && parsed.coupleId) {
          handleAcceptance(
            parsed.coupleId,
            parsed.targetDeviceId || "",
            parsed.initiatorDeviceName || "Partner",
            parsed.initiatorDeviceId || ""
          );
        } else if (parsed.status === "REJECTED" && !handled) {
          handled = true;
          callbacks.onRejected();
        }
      } catch {}
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageEvent);
  }

  // Supabase Realtime channel
  const channel = supabase
    .channel(`pairing_resp:${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "pairing_sessions",
        filter: `id=eq.${sessionId}`,
      },
      async (payload) => {
        const newRow = payload.new;
        if (newRow) {
          if (newRow.status === "ACCEPTED" && newRow.couple_id) {
            await handleAcceptance(
              newRow.couple_id,
              newRow.target_device_id || "",
              newRow.initiator_device_name || "Partner",
              newRow.initiator_device_id
            );
          } else if (newRow.status === "REJECTED" && !handled) {
            handled = true;
            callbacks.onRejected();
          }
        }
      }
    )
    .on("broadcast", { event: "ACCEPT_PAIRING" }, (payload) => {
      if (!handled && payload.payload?.coupleId) {
        handleAcceptance(payload.payload.coupleId, "", "Partner", "");
      }
    })
    .on("broadcast", { event: "REJECT_PAIRING" }, () => {
      if (!handled) {
        handled = true;
        callbacks.onRejected();
      }
    })
    .subscribe();

  return () => {
    clearInterval(pollInterval);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageEvent);
    }
    if (bc) {
      bc.close();
    }
    try {
      supabase.removeChannel(channel);
    } catch {}
  };
}

/**
 * Unpairs the current local device from partner.
 */
export async function unpairCurrentDevice(): Promise<void> {
  await removePairedDevice();
}
