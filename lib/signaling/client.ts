import {
  ClientSignalingState,
  SignalingClientOptions,
} from "./types";
import { validateIncomingClientEnvelope } from "./validator";
import {
  SignalingEnvelope,
  SignalingMessageType,
  SessionJoinPayload,
  SdpPayload,
  IceCandidatePayload,
} from "../../server/signaling/types";
import { SIGNALING_CONFIG } from "../../server/signaling/config";
import { signDataWithIdentity } from "../crypto/identity";
import { signIdentityData } from "../crypto/identity/signing";
import { bufferToHex } from "../crypto/identity/key-gen";
import { buildSignalingAuthPayload } from "../../server/signaling/auth";

function getRandomHex(bytesLength: number): string {
  const bytes = new Uint8Array(bytesLength);
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    throw new Error("Cryptographically secure random values API unavailable.");
  }
  return bufferToHex(bytes.buffer as ArrayBuffer);
}

export class SignalingClient {
  private socket: WebSocket | null = null;
  private state: ClientSignalingState = ClientSignalingState.DISCONNECTED;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private isIntentionallyClosed = false;

  constructor(private options: SignalingClientOptions) {}

  public getState(): ClientSignalingState {
    return this.state;
  }

  private setState(nextState: ClientSignalingState): void {
    if (this.state === nextState) return;
    this.state = nextState;
    if (this.options.events?.onStateChange) {
      try {
        this.options.events.onStateChange(nextState);
      } catch {}
    }
  }

  public async connect(): Promise<void> {
    this.isIntentionallyClosed = false;
    this.setState(ClientSignalingState.CONNECTING);

    const WebSocketImpl =
      typeof globalThis !== "undefined" && globalThis.WebSocket
        ? globalThis.WebSocket
        : typeof window !== "undefined" && window.WebSocket
        ? window.WebSocket
        : (await import("ws")).WebSocket;

    return new Promise((resolve, reject) => {
      let socket: any;
      try {
        socket = new (WebSocketImpl as any)(this.options.serverUrl);
        this.socket = socket;
      } catch (err) {
        this.setState(ClientSignalingState.ERROR);
        return reject(err);
      }

      socket.onopen = async () => {
        this.reconnectAttempts = 0;
        try {
          await this.authenticateAndJoin();
          resolve();
        } catch (err) {
          this.setState(ClientSignalingState.ERROR);
          reject(err);
        }
      };

      socket.onmessage = (event: MessageEvent | { data: any }) => {
        this.handleIncomingMessage(String(event.data));
      };

      socket.onclose = () => {
        this.handleClose();
      };

      socket.onerror = () => {
        if (this.options.events?.onError) {
          this.options.events.onError("WebSocket connection error.");
        }
      };
    });
  }

  private async authenticateAndJoin(): Promise<void> {
    this.setState(ClientSignalingState.AUTHENTICATING);

    const nonce = getRandomHex(32);
    const timestamp = Date.now();
    const fingerprint = this.options.localIdentity.fingerprint;

    const canonicalAuthBytes = buildSignalingAuthPayload(
      this.options.sessionId,
      nonce,
      timestamp,
      fingerprint
    );

    let signatureBuffer: ArrayBuffer;
    if (this.options.signer) {
      signatureBuffer = await this.options.signer(canonicalAuthBytes);
    } else if (this.options.privateKey) {
      signatureBuffer = await signIdentityData(this.options.privateKey, canonicalAuthBytes);
    } else {
      signatureBuffer = await signDataWithIdentity(canonicalAuthBytes);
    }
    const signatureHex = bufferToHex(signatureBuffer);

    const joinPayload: SessionJoinPayload = {
      publicIdentity: this.options.localIdentity,
      nonce,
      timestamp,
      signature: signatureHex,
    };

    const envelope: SignalingEnvelope<SessionJoinPayload> = {
      version: SIGNALING_CONFIG.PROTOCOL_VERSION,
      type: SignalingMessageType.SESSION_JOIN,
      sessionId: this.options.sessionId,
      sender: fingerprint,
      payload: joinPayload,
    };

    this.sendRaw(JSON.stringify(envelope));
  }

  private handleIncomingMessage(raw: string): void {
    let envelope: SignalingEnvelope;
    try {
      envelope = validateIncomingClientEnvelope(raw);
    } catch (err) {
      if (this.options.events?.onError) {
        this.options.events.onError("Malformed or unverified signaling envelope received.");
      }
      return;
    }

    switch (envelope.type) {
      case SignalingMessageType.SESSION_JOIN:
        if (envelope.payload?.status === "JOINED") {
          this.setState(ClientSignalingState.JOINED);
        }
        break;
      case SignalingMessageType.SESSION_READY:
        this.setState(ClientSignalingState.READY);
        if (this.options.events?.onSessionReady) {
          this.options.events.onSessionReady(envelope.sessionId);
        }
        break;
      case SignalingMessageType.SDP_OFFER:
        if (this.options.events?.onSdpOffer) {
          this.options.events.onSdpOffer(envelope.payload as SdpPayload, envelope.sender);
        }
        break;
      case SignalingMessageType.SDP_ANSWER:
        if (this.options.events?.onSdpAnswer) {
          this.options.events.onSdpAnswer(envelope.payload as SdpPayload, envelope.sender);
        }
        break;
      case SignalingMessageType.ICE_CANDIDATE:
        if (this.options.events?.onIceCandidate) {
          this.options.events.onIceCandidate(envelope.payload as IceCandidatePayload, envelope.sender);
        }
        break;
      case SignalingMessageType.PEER_LEFT:
        if (this.options.events?.onPeerLeft) {
          this.options.events.onPeerLeft(envelope.payload?.reason || "Peer left signaling session.");
        }
        break;
      case SignalingMessageType.ERROR:
        if (this.options.events?.onError) {
          this.options.events.onError(envelope.payload?.message || "Signaling error.");
        }
        break;
      case SignalingMessageType.PING:
        this.sendRaw(
          JSON.stringify({
            version: SIGNALING_CONFIG.PROTOCOL_VERSION,
            type: SignalingMessageType.PONG,
            sessionId: this.options.sessionId,
            sender: this.options.localIdentity.fingerprint,
            payload: {},
          })
        );
        break;
    }
  }

  public async sendSdpOffer(sdp: string): Promise<void> {
    this.assertReady();
    const payload: SdpPayload = { type: "offer", sdp };
    const envelope: SignalingEnvelope<SdpPayload> = {
      version: SIGNALING_CONFIG.PROTOCOL_VERSION,
      type: SignalingMessageType.SDP_OFFER,
      sessionId: this.options.sessionId,
      sender: this.options.localIdentity.fingerprint,
      payload,
    };
    this.sendRaw(JSON.stringify(envelope));
  }

  public async sendSdpAnswer(sdp: string): Promise<void> {
    this.assertReady();
    const payload: SdpPayload = { type: "answer", sdp };
    const envelope: SignalingEnvelope<SdpPayload> = {
      version: SIGNALING_CONFIG.PROTOCOL_VERSION,
      type: SignalingMessageType.SDP_ANSWER,
      sessionId: this.options.sessionId,
      sender: this.options.localIdentity.fingerprint,
      payload,
    };
    this.sendRaw(JSON.stringify(envelope));
  }

  public async sendIceCandidate(candidate: string, sdpMid: string | null = null, sdpMLineIndex: number | null = null): Promise<void> {
    this.assertReady();
    const payload: IceCandidatePayload = { candidate, sdpMid, sdpMLineIndex };
    const envelope: SignalingEnvelope<IceCandidatePayload> = {
      version: SIGNALING_CONFIG.PROTOCOL_VERSION,
      type: SignalingMessageType.ICE_CANDIDATE,
      sessionId: this.options.sessionId,
      sender: this.options.localIdentity.fingerprint,
      payload,
    };
    this.sendRaw(JSON.stringify(envelope));
  }

  public endSession(): void {
    if (this.socket && this.socket.readyState === 1) {
      const envelope: SignalingEnvelope = {
        version: SIGNALING_CONFIG.PROTOCOL_VERSION,
        type: SignalingMessageType.SESSION_END,
        sessionId: this.options.sessionId,
        sender: this.options.localIdentity.fingerprint,
        payload: {},
      };
      this.sendRaw(JSON.stringify(envelope));
    }
    this.disconnect();
  }

  public disconnect(): void {
    this.isIntentionallyClosed = true;
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
    this.setState(ClientSignalingState.DISCONNECTED);
  }

  private handleClose(): void {
    if (this.isIntentionallyClosed) {
      this.setState(ClientSignalingState.DISCONNECTED);
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const backoffMs = Math.pow(2, this.reconnectAttempts) * 500; // Exponential backoff
      setTimeout(() => {
        if (!this.isIntentionallyClosed) {
          this.connect().catch(() => {});
        }
      }, backoffMs);
    } else {
      this.setState(ClientSignalingState.ERROR);
      if (this.options.events?.onError) {
        this.options.events.onError("Maximum signaling reconnect attempts exceeded.");
      }
    }
  }

  private assertReady(): void {
    if (!this.socket || this.socket.readyState !== 1) {
      throw new Error("Signaling client is not connected to server.");
    }
  }

  private sendRaw(raw: string): void {
    if (this.socket && this.socket.readyState === 1) {
      this.socket.send(raw);
    }
  }
}
