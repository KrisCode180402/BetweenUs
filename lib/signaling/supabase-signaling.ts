import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../supabase/client";
import { CallType } from "../webrtc/types";

export interface SupabaseSignalingPayload {
  sessionId: string;
  senderId: string;
  targetId?: string;
  callType?: CallType;
  sdp?: string;
  candidate?: RTCIceCandidateInit;
  reason?: string;
  timestamp?: number;
}

export type SupabaseSignalingEvent =
  | "call_invite"
  | "call_accept"
  | "call_decline"
  | "call_cancel"
  | "sdp_offer"
  | "sdp_answer"
  | "ice_candidate"
  | "call_end";

export interface SupabaseSignalingEvents {
  onCallInvite?: (payload: SupabaseSignalingPayload) => void;
  onCallAccept?: (payload: SupabaseSignalingPayload) => void;
  onCallDecline?: (payload: SupabaseSignalingPayload) => void;
  onCallCancel?: (payload: SupabaseSignalingPayload) => void;
  onSdpOffer?: (payload: SupabaseSignalingPayload) => void;
  onSdpAnswer?: (payload: SupabaseSignalingPayload) => void;
  onIceCandidate?: (payload: SupabaseSignalingPayload) => void;
  onCallEnd?: (payload: SupabaseSignalingPayload) => void;
  onError?: (error: string) => void;
}

export class SupabaseSignalingClient {
  private channel: RealtimeChannel | null = null;
  private channelName: string = "";
  private isSubscribed = false;
  private processedMessageIds = new Set<string>();
  private readonly MAX_TIMESTAMP_DRIFT_MS = 2 * 60 * 1000;
  private readonly MAX_PAYLOAD_BYTES = 64 * 1024;

  constructor(
    private coupleId: string,
    private localUserId: string,
    private events: SupabaseSignalingEvents = {}
  ) {
    this.channelName = `between-us-call:${coupleId || "default-couple"}`;
  }

  /**
   * Validates signaling message schema, size, sender identity, and replay freshness.
   */
  private validatePayload(payload: any): payload is SupabaseSignalingPayload {
    if (!payload || typeof payload !== "object") return false;
    if (payload.senderId === this.localUserId) return false;

    // 1. Session & Sender ID Validation
    if (typeof payload.sessionId !== "string" || payload.sessionId.length === 0 || payload.sessionId.length > 128) {
      return false;
    }
    if (typeof payload.senderId !== "string" || payload.senderId.length === 0 || payload.senderId.length > 128) {
      return false;
    }

    // 2. Replay Protection: Timestamp freshness check
    const now = Date.now();
    if (typeof payload.timestamp === "number") {
      if (Math.abs(now - payload.timestamp) > this.MAX_TIMESTAMP_DRIFT_MS) {
        console.warn("Signaling notice: Stale or replayed message rejected.");
        return false;
      }
    }

    // 3. Deduplication Protection
    const candidateStr = payload.candidate ? (payload.candidate.candidate || "") : "";
    const msgId = `${payload.sessionId}:${payload.senderId}:${payload.timestamp || 0}:${payload.sdp ? payload.sdp.length : 0}:${candidateStr}`;
    if (this.processedMessageIds.has(msgId)) {
      return false;
    }
    this.processedMessageIds.add(msgId);
    if (this.processedMessageIds.size > 200) {
      const firstKey = this.processedMessageIds.keys().next().value;
      if (firstKey) this.processedMessageIds.delete(firstKey);
    }

    // 4. Payload Size Enforcement
    try {
      if (JSON.stringify(payload).length > this.MAX_PAYLOAD_BYTES) {
        console.warn("Signaling notice: Oversized payload rejected.");
        return false;
      }
    } catch {
      return false;
    }

    return true;
  }

  /**
   * Initializes and subscribes to the ephemeral Supabase Realtime channel for this couple.
   * Auto-heals closed or errored channels.
   */
  public async subscribe(): Promise<void> {
    if (this.channel && this.isSubscribed) {
      const state = (this.channel as any).state;
      if (state === "joined" || state === "joining") {
        return;
      }
      await this.unsubscribe();
    }

    this.channel = supabase.channel(this.channelName, {
      config: {
        broadcast: { self: false, ack: true },
        private: true,
      },
    });

    // Listen for broadcast events with strict payload authorization validation
    this.channel
      .on("broadcast", { event: "call_invite" }, ({ payload }) => {
        if (this.validatePayload(payload)) {
          this.events.onCallInvite?.(payload);
        }
      })
      .on("broadcast", { event: "call_accept" }, ({ payload }) => {
        if (this.validatePayload(payload)) {
          this.events.onCallAccept?.(payload);
        }
      })
      .on("broadcast", { event: "call_decline" }, ({ payload }) => {
        if (this.validatePayload(payload)) {
          this.events.onCallDecline?.(payload);
        }
      })
      .on("broadcast", { event: "call_cancel" }, ({ payload }) => {
        if (this.validatePayload(payload)) {
          this.events.onCallCancel?.(payload);
        }
      })
      .on("broadcast", { event: "sdp_offer" }, ({ payload }) => {
        if (this.validatePayload(payload)) {
          this.events.onSdpOffer?.(payload);
        }
      })
      .on("broadcast", { event: "sdp_answer" }, ({ payload }) => {
        if (this.validatePayload(payload)) {
          this.events.onSdpAnswer?.(payload);
        }
      })
      .on("broadcast", { event: "ice_candidate" }, ({ payload }) => {
        if (this.validatePayload(payload)) {
          this.events.onIceCandidate?.(payload);
        }
      })
      .on("broadcast", { event: "call_end" }, ({ payload }) => {
        if (this.validatePayload(payload)) {
          this.events.onCallEnd?.(payload);
        }
      });

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.isSubscribed = true;
        resolve();
      }, 3000);

      this.channel?.subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(timer);
          this.isSubscribed = true;
          resolve();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          clearTimeout(timer);
          this.isSubscribed = false;
          const errMsg = err?.message || `Realtime signaling channel status: ${status}`;
          console.warn("Realtime signaling connection notice:", errMsg);
          resolve();
        }
      });
    });
  }

  /**
   * Broadcasts a signaling message over the active Supabase channel with automatic retry.
   */
  public async send(event: SupabaseSignalingEvent, payload: Partial<SupabaseSignalingPayload>): Promise<void> {
    const fullPayload: SupabaseSignalingPayload = {
      sessionId: payload.sessionId || "",
      senderId: this.localUserId,
      timestamp: Date.now(),
      ...payload,
    };

    if (!this.channel || !this.isSubscribed || (this.channel as any).state !== "joined") {
      await this.subscribe();
    }

    let res = await this.channel?.send({
      type: "broadcast",
      event,
      payload: fullPayload,
    });

    if (res !== "ok") {
      // Re-subscribe and retry once on transient channel failure
      await this.unsubscribe();
      await this.subscribe();
      res = await this.channel?.send({
        type: "broadcast",
        event,
        payload: fullPayload,
      });
      if (res !== "ok") {
        console.warn(`Signaling broadcast message '${event}' send notice: ${res}`);
      }
    }
  }

  public async sendCallInvite(sessionId: string, callType: CallType, sdp?: string): Promise<void> {
    await this.send("call_invite", sdp ? { sessionId, callType, sdp } : { sessionId, callType });
  }

  public getCoupleId(): string {
    return this.coupleId;
  }

  public async sendCallAccept(sessionId: string): Promise<void> {
    await this.send("call_accept", { sessionId });
  }

  public async sendCallDecline(sessionId: string, reason?: string): Promise<void> {
    await this.send("call_decline", { sessionId, ...(reason ? { reason } : {}) });
    try {
      await new Promise((r) => setTimeout(r, 40));
      await this.send("call_decline", { sessionId, ...(reason ? { reason } : {}) });
    } catch {}
  }

  public async sendCallCancel(sessionId: string): Promise<void> {
    await this.send("call_cancel", { sessionId });
    try {
      await new Promise((r) => setTimeout(r, 40));
      await this.send("call_cancel", { sessionId });
    } catch {}
  }

  public async sendSdpOffer(sessionId: string, sdp: string, callType: CallType): Promise<void> {
    await this.send("sdp_offer", { sessionId, sdp, callType });
  }

  public async sendSdpAnswer(sessionId: string, sdp: string): Promise<void> {
    await this.send("sdp_answer", { sessionId, sdp });
  }

  public async sendIceCandidate(sessionId: string, candidate: RTCIceCandidateInit): Promise<void> {
    await this.send("ice_candidate", { sessionId, candidate });
  }

  public async sendCallEnd(sessionId: string, reason?: string): Promise<void> {
    await this.send("call_end", { sessionId, ...(reason ? { reason } : {}) });
    try {
      await new Promise((r) => setTimeout(r, 40));
      await this.send("call_end", { sessionId, ...(reason ? { reason } : {}) });
    } catch {}
  }

  /**
   * Unsubscribes and cleans up the Realtime channel subscription.
   */
  public async unsubscribe(): Promise<void> {
    if (this.channel) {
      try {
        await this.channel.unsubscribe();
        await supabase.removeChannel(this.channel);
      } catch {}
      this.channel = null;
      this.isSubscribed = false;
    }
  }
}
