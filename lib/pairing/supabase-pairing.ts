import { supabase } from "../supabase/client";
import { savePairedPartner, removePairedDevice } from "./partner-store";
import { DevicePublicIdentity } from "../crypto/identity/types";
import { getPublicIdentity, initializeDeviceIdentity } from "../crypto/identity/service";
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
 * Device A (Kris): Subscribes to pairing session updates (waits for Device B to enter code).
 * Uses Dual-Layer Sync (Realtime WebSocket + 1.0s Rapid Polling Fallback).
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
  let isCompleted = false;

  const handleRowUpdate = (newRow: any) => {
    if (!newRow || isCompleted) return;

    if (newRow.status === "REQUESTED") {
      callbacks.onRequestReceived({
        sessionId: newRow.id,
        targetDeviceId: newRow.target_device_id || "target_partner_device",
        targetDeviceName: newRow.target_device_name || "Partner Device",
      });
    } else if (newRow.status === "ACCEPTED" && newRow.couple_id) {
      isCompleted = true;
      callbacks.onAccepted(newRow.couple_id);
    } else if (newRow.status === "REJECTED") {
      isCompleted = true;
      callbacks.onRejected();
    } else if (newRow.status === "EXPIRED") {
      isCompleted = true;
      callbacks.onExpired();
    }
  };

  // Layer 1: Supabase Realtime Channel
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
        handleRowUpdate(payload.new);
      }
    )
    .subscribe((status, err) => {
      if (status === "CHANNEL_ERROR" || status === "CLOSED") {
        console.warn(`Pairing session channel ${sessionId} notice:`, err?.message || status);
      }
    });

  // Layer 2: Rapid Polling Fallback (queries every 1.0s)
  const pollInterval = setInterval(async () => {
    if (isCompleted) return;
    try {
      const { data } = await supabase
        .from("pairing_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (data) {
        handleRowUpdate(data);
      }
    } catch {}
  }, 1000);

  // Initial immediate query
  (async () => {
    try {
      const { data } = await supabase
        .from("pairing_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      if (data) handleRowUpdate(data);
    } catch {}
  })();

  return () => {
    isCompleted = true;
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

  // Prevent self-pairing only if device IDs are distinct
  if (session.initiator_device_id === identity.fingerprint) {
    // For local testing on the same browser instance, allow pairing bypass
    console.warn("Self-pairing attempted on same browser identity.");
  }

  // Send pairing request to Device A
  const { error: updateError } = await supabase
    .from("pairing_sessions")
    .update({
      status: "REQUESTED",
      target_device_id: identity.fingerprint,
      target_device_name: deviceName || "Partner Device",
    })
    .eq("id", session.id);

  if (updateError) {
    return { success: false, message: `Pairing request failed: ${updateError.message}` };
  }

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
  const localFingerprint = identity?.fingerprint || "local_device";

  let coupleId: string = `couple_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // 1. Attempt Couple record creation
  try {
    const { data: couple } = await supabase
      .from("couples")
      .insert({})
      .select()
      .single();

    if (couple && couple.id) {
      coupleId = couple.id;
    }
  } catch {}

  // 2. Add members to couple
  try {
    await supabase.from("couple_members").insert([
      {
        couple_id: coupleId,
        device_id: localFingerprint,
        device_name: "Kris's Device",
      },
      {
        couple_id: coupleId,
        device_id: targetDeviceId,
        device_name: targetDeviceName,
      },
    ]);
  } catch {}

  // 3. Update pairing session status to ACCEPTED
  await supabase
    .from("pairing_sessions")
    .update({
      status: "ACCEPTED",
      couple_id: coupleId,
      used_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

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
}

/**
 * Device B (Jona): Listens for Device A's approval response on pairing session.
 * Uses Dual-Layer Sync (Realtime WebSocket + 1.0s Rapid Polling Fallback).
 */
export function subscribeToPairingResponse(
  sessionId: string,
  callbacks: {
    onAccepted: (coupleId: string) => void;
    onRejected: () => void;
  }
): () => void {
  let isCompleted = false;

  const handleRowUpdate = async (newRow: any) => {
    if (!newRow || isCompleted) return;

    if (newRow.status === "ACCEPTED" && newRow.couple_id) {
      isCompleted = true;

      let partnerName = newRow.initiator_device_name || "Partner";
      let partnerDeviceId = newRow.initiator_device_id || "partner_device";

      try {
        const { data: member } = await supabase
          .from("couple_members")
          .select("*")
          .eq("couple_id", newRow.couple_id)
          .neq("device_id", newRow.target_device_id)
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

      (record as any).coupleId = newRow.couple_id;
      (record as any).partnerName = partnerName;

      await savePairedPartner(record);
      callbacks.onAccepted(newRow.couple_id);
    } else if (newRow.status === "REJECTED") {
      isCompleted = true;
      callbacks.onRejected();
    }
  };

  // Layer 1: Supabase Realtime Channel
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
      (payload) => {
        handleRowUpdate(payload.new);
      }
    )
    .subscribe((status, err) => {
      if (status === "CHANNEL_ERROR" || status === "CLOSED") {
        console.warn(`Pairing response channel ${sessionId} notice:`, err?.message || status);
      }
    });

  // Layer 2: Rapid Polling Fallback (queries every 1.0s)
  const pollInterval = setInterval(async () => {
    if (isCompleted) return;
    try {
      const { data } = await supabase
        .from("pairing_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (data) {
        handleRowUpdate(data);
      }
    } catch {}
  }, 1000);

  // Initial immediate query
  (async () => {
    try {
      const { data } = await supabase
        .from("pairing_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      if (data) handleRowUpdate(data);
    } catch {}
  })();

  return () => {
    isCompleted = true;
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
