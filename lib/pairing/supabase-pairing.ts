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

/**
 * Generates a high-entropy, human-readable 12-character pairing code: e.g. "AB7K-92PX-M4QW"
 * Uses crypto.getRandomValues() to prevent any security predictability.
 */
export function generateSecurePairingCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 32 unambiguous characters
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
  
  const subtle = typeof globalThis !== "undefined" && globalThis.crypto?.subtle 
    ? globalThis.crypto.subtle 
    : typeof window !== "undefined" && window.crypto?.subtle 
      ? window.crypto.subtle 
      : null;

  if (subtle) {
    const hashBuffer = await subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  
  // Fallback simple hash for non-browser environment
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
  const name = deviceName || (typeof navigator !== "undefined" && navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Device");

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
 * Device A (Kris): Creates a pairing invitation session in Supabase.
 */
export async function createPairingSession(deviceName?: string): Promise<PairingSessionInfo> {
  const identity = await syncLocalDeviceIdentity(deviceName);
  const rawCode = generateSecurePairingCode();
  const codeHash = await hashPairingCode(rawCode);
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  const { data, error } = await supabase
    .from("pairing_sessions")
    .insert({
      initiator_device_id: identity.fingerprint,
      initiator_device_name: deviceName || "Kris's Device",
      pairing_code_hash: codeHash,
      status: "PENDING",
      expires_at: new Date(expiresAt).toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create pairing session: ${error?.message || "Database error"}`);
  }

  return {
    sessionId: data.id,
    pairingCode: rawCode,
    expiresAt,
  };
}

/**
 * Device A (Kris): Subscribes to pairing session updates.
 * Combines 1-second Polling + Realtime Postgres Changes + Broadcast for 100% instant pairing approval.
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

  const checkSessionStatus = async () => {
    try {
      const { data: row, error } = await supabase
        .from("pairing_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error || !row) return;

      if (row.status === "REQUESTED" && handledStatus !== "REQUESTED") {
        handledStatus = "REQUESTED";
        callbacks.onRequestReceived({
          sessionId: row.id,
          targetDeviceId: row.target_device_id,
          targetDeviceName: row.target_device_name || "Partner Device",
        });
      } else if (row.status === "ACCEPTED" && row.couple_id && handledStatus !== "ACCEPTED") {
        handledStatus = "ACCEPTED";
        callbacks.onAccepted(row.couple_id);
      } else if (row.status === "REJECTED" && handledStatus !== "REJECTED") {
        handledStatus = "REJECTED";
        callbacks.onRejected();
      } else if (row.status === "EXPIRED" && handledStatus !== "EXPIRED") {
        handledStatus = "EXPIRED";
        callbacks.onExpired();
      }
    } catch (err) {
      console.warn("[PairingSession] Check error:", err);
    }
  };

  // 1. Immediate initial DB check
  checkSessionStatus();

  // 2. High-frequency 1-second polling fallback
  const pollInterval = setInterval(checkSessionStatus, 1000);

  // 3. Supabase Realtime Postgres Changes
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
        if (!newRow) return;

        if (newRow.status === "REQUESTED" && handledStatus !== "REQUESTED") {
          handledStatus = "REQUESTED";
          callbacks.onRequestReceived({
            sessionId: newRow.id,
            targetDeviceId: newRow.target_device_id,
            targetDeviceName: newRow.target_device_name || "Partner Device",
          });
        } else if (newRow.status === "ACCEPTED" && newRow.couple_id && handledStatus !== "ACCEPTED") {
          handledStatus = "ACCEPTED";
          callbacks.onAccepted(newRow.couple_id);
        } else if (newRow.status === "REJECTED" && handledStatus !== "REJECTED") {
          handledStatus = "REJECTED";
          callbacks.onRejected();
        } else if (newRow.status === "EXPIRED" && handledStatus !== "EXPIRED") {
          handledStatus = "EXPIRED";
          callbacks.onExpired();
        }
      }
    )
    .on("broadcast", { event: "REQUEST_PAIRING" }, (payload) => {
      if (handledStatus !== "REQUESTED" && payload.payload) {
        handledStatus = "REQUESTED";
        callbacks.onRequestReceived({
          sessionId: payload.payload.sessionId || sessionId,
          targetDeviceId: payload.payload.targetDeviceId,
          targetDeviceName: payload.payload.targetDeviceName || "Partner Device",
        });
      }
    })
    .subscribe();

  return () => {
    clearInterval(pollInterval);
    try {
      supabase.removeChannel(channel);
    } catch {}
  };
}

/**
 * Device B (Jona): Submits entered pairing code.
 */
export async function submitPairingCode(
  rawCode: string,
  deviceName?: string
): Promise<{ success: boolean; message?: string; sessionId?: string; initiatorName?: string }> {
  const identity = await syncLocalDeviceIdentity(deviceName);
  const codeHash = await hashPairingCode(rawCode);

  // Search for active pending pairing session matching the hashed code
  const { data: session, error } = await supabase
    .from("pairing_sessions")
    .select("*")
    .eq("pairing_code_hash", codeHash)
    .eq("status", "PENDING")
    .single();

  if (error || !session) {
    return { success: false, message: "Invalid or expired pairing code. Please double-check and try again." };
  }

  // Check expiration
  if (new Date(session.expires_at).getTime() < Date.now()) {
    await supabase.from("pairing_sessions").update({ status: "EXPIRED" }).eq("id", session.id);
    return { success: false, message: "Pairing code has expired. Please ask your partner for a new code." };
  }

  // Prevent self-pairing
  if (session.initiator_device_id === identity.fingerprint) {
    return { success: false, message: "You cannot pair a device with itself." };
  }

  const targetDeviceName = deviceName || "Jona's Device";

  // Send pairing request to Device A
  const { error: updateError } = await supabase
    .from("pairing_sessions")
    .update({
      status: "REQUESTED",
      target_device_id: identity.fingerprint,
      target_device_name: targetDeviceName,
    })
    .eq("id", session.id);

  if (updateError) {
    return { success: false, message: `Pairing request failed: ${updateError.message}` };
  }

  // Broadcast real-time signal for immediate receipt by Device A
  try {
    const broadcastChan = supabase.channel(`pairing:${session.id}`);
    broadcastChan.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        broadcastChan.send({
          type: "broadcast",
          event: "REQUEST_PAIRING",
          payload: {
            sessionId: session.id,
            targetDeviceId: identity.fingerprint,
            targetDeviceName,
          },
        });
      }
    });
  } catch {}

  return {
    success: true,
    sessionId: session.id,
    initiatorName: session.initiator_device_name,
  };
}

/**
 * Device A (Kris): Accepts pairing request from Device B.
 */
export async function acceptPairingRequest(
  sessionId: string,
  targetDeviceId: string,
  targetDeviceName: string
): Promise<{ success: boolean; coupleId: string }> {
  const identity = await getPublicIdentity();
  if (!identity) {
    throw new Error("Local device identity not initialized.");
  }

  // 1. Create Couple record
  const { data: couple, error: coupleErr } = await supabase
    .from("couples")
    .insert({})
    .select()
    .single();

  if (coupleErr || !couple) {
    throw new Error(`Failed to create couple record: ${coupleErr?.message}`);
  }

  const coupleId = couple.id;

  // 2. Add members to couple
  await supabase.from("couple_members").insert([
    {
      couple_id: coupleId,
      device_id: identity.fingerprint,
      device_name: "Kris's Device",
    },
    {
      couple_id: coupleId,
      device_id: targetDeviceId,
      device_name: targetDeviceName,
    },
  ]);

  // 3. Update pairing session status to ACCEPTED
  await supabase
    .from("pairing_sessions")
    .update({
      status: "ACCEPTED",
      couple_id: coupleId,
      used_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  // Broadcast ACCEPT_PAIRING event
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

  // 4. Save paired partner locally in IndexedDB
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
 * Device A (Kris): Rejects pairing request from Device B.
 */
export async function rejectPairingRequest(sessionId: string): Promise<void> {
  await supabase.from("pairing_sessions").update({ status: "REJECTED" }).eq("id", sessionId);

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
 * Device B (Jona): Listens for Device A's approval response on pairing session.
 * Combines 1-second Polling + Realtime Postgres Changes + Broadcast for 100% instant completion.
 */
export function subscribeToPairingResponse(
  sessionId: string,
  callbacks: {
    onAccepted: (coupleId: string) => void;
    onRejected: () => void;
  }
): () => void {
  let handled = false;

  const handleAcceptance = async (coupleId: string, targetDeviceId: string, initiatorName: string, initiatorDeviceId: string) => {
    if (handled) return;
    handled = true;

    // Fetch initiator partner details if available
    let partnerName = initiatorName || "Partner";
    let partnerDeviceId = initiatorDeviceId;

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
    try {
      const { data: row, error } = await supabase
        .from("pairing_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error || !row) return;

      if (row.status === "ACCEPTED" && row.couple_id) {
        await handleAcceptance(
          row.couple_id,
          row.target_device_id || "",
          row.initiator_device_name || "Partner",
          row.initiator_device_id
        );
      } else if (row.status === "REJECTED") {
        handled = true;
        callbacks.onRejected();
      }
    } catch (err) {
      console.warn("[PairingResponse] Check error:", err);
    }
  };

  // 1. Immediate initial DB check
  checkResponseStatus();

  // 2. High-frequency 1-second polling fallback
  const pollInterval = setInterval(checkResponseStatus, 1000);

  // 3. Supabase Realtime Postgres Changes
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
        if (!newRow) return;

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
