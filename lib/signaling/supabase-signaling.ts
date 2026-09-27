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

  constructor(
    private coupleId: string,
    private localUserId: string,
    private events: SupabaseSignalingEvents = {}
  ) {
    this.channelName = `private:call:${coupleId || "between-us-default-couple"}`;
  }

  /**
   * Initializes and subscribes to the ephemeral Supabase Realtime channel for this couple.
   */
  public async subscribe(): Promise<void> {
    if (this.channel && this.isSubscribed) return;

    this.channel = supabase.channel(this.channelName, {
      config: {
        broadcast: { self: false },
      },
    });

    // Listen for broadcast events
    this.channel
      .on("broadcast", { event: "call_invite" }, ({ payload }) => {
        if (payload?.senderId !== this.localUserId) {
          this.events.onCallInvite?.(payload);
        }
      })
      .on("broadcast", { event: "call_accept" }, ({ payload }) => {
        if (payload?.senderId !== this.localUserId) {
          this.events.onCallAccept?.(payload);
        }
      })
      .on("broadcast", { event: "call_decline" }, ({ payload }) => {
        if (payload?.senderId !== this.localUserId) {
          this.events.onCallDecline?.(payload);
        }
      })
      .on("broadcast", { event: "call_cancel" }, ({ payload }) => {
        if (payload?.senderId !== this.localUserId) {
          this.events.onCallCancel?.(payload);
        }
      })
      .on("broadcast", { event: "sdp_offer" }, ({ payload }) => {
        if (payload?.senderId !== this.localUserId) {
          this.events.onSdpOffer?.(payload);
        }
      })
      .on("broadcast", { event: "sdp_answer" }, ({ payload }) => {
        if (payload?.senderId !== this.localUserId) {
          this.events.onSdpAnswer?.(payload);
        }
      })
      .on("broadcast", { event: "ice_candidate" }, ({ payload }) => {
        if (payload?.senderId !== this.localUserId) {
          this.events.onIceCandidate?.(payload);
        }
      })
      .on("broadcast", { event: "call_end" }, ({ payload }) => {
        if (payload?.senderId !== this.localUserId) {
          this.events.onCallEnd?.(payload);
        }
      });

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.isSubscribed = true;
        resolve();
      }, 3500);

      this.channel?.subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(timer);
          this.isSubscribed = true;
          resolve();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          clearTimeout(timer);
          const errMsg = err?.message || `Realtime signaling channel status: ${status}`;
          this.isSubscribed = true; // Fallback optimistic subscription
          console.warn("Realtime signaling connection notice:", errMsg);
          resolve();
        }
      });
    });
  }

  /**
   * Broadcasts a signaling message over the active Supabase channel.
   */
  public async send(event: SupabaseSignalingEvent, payload: Partial<SupabaseSignalingPayload>): Promise<void> {
    if (!this.channel || !this.isSubscribed) {
      await this.subscribe();
    }

    const fullPayload: SupabaseSignalingPayload = {
      sessionId: payload.sessionId || "",
      senderId: this.localUserId,
      timestamp: Date.now(),
      ...payload,
    };

    const res = await this.channel?.send({
      type: "broadcast",
      event,
      payload: fullPayload,
    });

    if (res !== "ok") {
      throw new Error(`Failed to send signaling message '${event}' via Supabase Realtime.`);
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
  }

  public async sendCallCancel(sessionId: string): Promise<void> {
    await this.send("call_cancel", { sessionId });
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
