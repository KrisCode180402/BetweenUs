import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { SIGNALING_CONFIG } from "./config";
import {
  SignalingEnvelope,
  SignalingMessageType,
  SignalingParticipant,
} from "./types";
import {
  parseAndValidateEnvelope,
  validateSessionJoinPayload,
  validateSdpPayload,
  validateIceCandidatePayload,
  SignalingValidationError,
} from "./validation";
import { verifySignalingAuthentication } from "./auth";
import { EphemeralSessionManager } from "./session-manager";
import { ConnectionManager } from "./connection-manager";
import { SignalingRateLimiter } from "./rate-limiter";
import { SignalingLogger } from "./logger";

export class SignalingServer {
  private wss: WebSocketServer | null = null;
  private httpServer: http.Server | null = null;
  private sessionManager = new EphemeralSessionManager();
  private connectionManager = new ConnectionManager();
  private rateLimiter = new SignalingRateLimiter();
  private isDevelopment = process.env.NODE_ENV !== "production";

  public async start(port = SIGNALING_CONFIG.DEFAULT_PORT, customHttpServer?: http.Server): Promise<number> {
    if (customHttpServer) {
      this.httpServer = customHttpServer;
    } else {
      this.httpServer = http.createServer((_req, res) => {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Between Us Ephemeral Signaling Server Active\n");
      });
    }

    this.wss = new WebSocketServer({
      server: this.httpServer,
      maxPayload: SIGNALING_CONFIG.MAX_PAYLOAD_BYTES,
      verifyClient: (info, callback) => {
        const origin = info.origin || info.req.headers.origin;
        const ip = info.req.socket.remoteAddress || "127.0.0.1";

        // Check Rate Limiter
        if (!this.rateLimiter.allowConnection(ip)) {
          SignalingLogger.warn("Connection rejected due to IP rate limiting", { ip });
          return callback(false, 429, "Rate Limit Exceeded");
        }

        // Validate Origin (Skip strict origin check in dev if origin is undefined/localhost)
        if (!this.isDevelopment && origin) {
          if (!SIGNALING_CONFIG.ALLOWED_ORIGINS.includes(origin)) {
            SignalingLogger.warn("Connection rejected due to unauthorized origin", { origin });
            return callback(false, 403, "Forbidden Origin");
          }
        }
        callback(true);
      },
    });

    this.wss.on("connection", (socket: WebSocket, req: http.IncomingMessage) => {
      const ip = req.socket.remoteAddress || "127.0.0.1";
      this.connectionManager.registerConnection(socket, ip);

      socket.on("message", async (rawMessage: Buffer | string) => {
        await this.handleSocketMessage(socket, ip, rawMessage.toString("utf8"));
      });

      socket.on("close", () => {
        this.handleSocketClose(socket);
      });

      socket.on("error", (err) => {
        SignalingLogger.error("WebSocket socket error", { errorName: err.name });
        this.handleSocketClose(socket);
      });
    });

    return new Promise((resolve, reject) => {
      if (customHttpServer && customHttpServer.listening) {
        const addr = customHttpServer.address();
        const actualPort = typeof addr === "object" && addr ? addr.port : port;
        SignalingLogger.info("Signaling server attached to existing HTTP server", { port: actualPort });
        resolve(actualPort);
      } else {
        this.httpServer!.listen(port, () => {
          const addr = this.httpServer!.address();
          const actualPort = typeof addr === "object" && addr ? addr.port : port;
          SignalingLogger.info("Signaling server started successfully", { port: actualPort });
          resolve(actualPort);
        });
        this.httpServer!.on("error", (err) => reject(err));
      }
    });
  }

  private async handleSocketMessage(socket: WebSocket, ip: string, raw: string): Promise<void> {
    if (!this.rateLimiter.allowMessage(socket)) {
      this.sendEnvelope(socket, {
        version: SIGNALING_CONFIG.PROTOCOL_VERSION,
        type: SignalingMessageType.ERROR,
        sessionId: "",
        sender: "server",
        payload: { message: "Message rate limit exceeded." },
      });
      return;
    }

    let envelope: SignalingEnvelope;
    try {
      envelope = parseAndValidateEnvelope(raw);
    } catch (err) {
      this.rateLimiter.recordFailedAttempt(ip);
      const msg = err instanceof Error ? err.message : "Invalid signaling envelope";
      this.sendEnvelope(socket, {
        version: SIGNALING_CONFIG.PROTOCOL_VERSION,
        type: SignalingMessageType.ERROR,
        sessionId: "",
        sender: "server",
        payload: { message: msg },
      });
      return;
    }

    try {
      switch (envelope.type) {
        case SignalingMessageType.SESSION_JOIN:
          await this.handleSessionJoin(socket, ip, envelope);
          break;
        case SignalingMessageType.SDP_OFFER:
        case SignalingMessageType.SDP_ANSWER:
          this.handleSdpRelay(socket, envelope);
          break;
        case SignalingMessageType.ICE_CANDIDATE:
          this.handleIceCandidateRelay(socket, envelope);
          break;
        case SignalingMessageType.SESSION_END:
          this.handleSessionEnd(socket, envelope);
          break;
        case SignalingMessageType.PING:
          this.sendEnvelope(socket, {
            version: SIGNALING_CONFIG.PROTOCOL_VERSION,
            type: SignalingMessageType.PONG,
            sessionId: envelope.sessionId,
            sender: "server",
            payload: {},
          });
          break;
        default:
          throw new SignalingValidationError(`Unsupported message type: ${envelope.type}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Signaling processing error";
      this.sendEnvelope(socket, {
        version: SIGNALING_CONFIG.PROTOCOL_VERSION,
        type: SignalingMessageType.ERROR,
        sessionId: envelope.sessionId,
        sender: "server",
        payload: { message: msg },
      });
    }
  }

  private async handleSessionJoin(
    socket: WebSocket,
    ip: string,
    envelope: SignalingEnvelope
  ): Promise<void> {
    const joinPayload = validateSessionJoinPayload(envelope.payload);

    // Verify digital signature
    const isValid = await verifySignalingAuthentication(envelope.sessionId, envelope.sender, joinPayload);
    if (!isValid) {
      this.rateLimiter.recordFailedAttempt(ip);
      throw new SignalingValidationError("Authentication failed: Digital signature or timestamp invalid.");
    }

    const participant: SignalingParticipant = {
      fingerprint: envelope.sender,
      publicIdentity: joinPayload.publicIdentity,
      socket,
      joinedAt: Date.now(),
    };

    const { session, isFull } = this.sessionManager.joinSession(envelope.sessionId, participant);
    this.connectionManager.updateConnectionSession(socket, envelope.sessionId, envelope.sender);

    // Send SESSION_JOIN ack
    this.sendEnvelope(socket, {
      version: SIGNALING_CONFIG.PROTOCOL_VERSION,
      type: SignalingMessageType.SESSION_JOIN,
      sessionId: envelope.sessionId,
      sender: "server",
      payload: { status: "JOINED", participantCount: session.participants.size },
    });

    // If session now has 2/2 participants, notify both peers with SESSION_READY!
    if (isFull) {
      for (const p of session.participants.values()) {
        this.sendEnvelope(p.socket, {
          version: SIGNALING_CONFIG.PROTOCOL_VERSION,
          type: SignalingMessageType.SESSION_READY,
          sessionId: envelope.sessionId,
          sender: "server",
          payload: { participantCount: 2 },
        });
      }
    }
  }

  private handleSdpRelay(socket: WebSocket, envelope: SignalingEnvelope): void {
    validateSdpPayload(envelope.payload);

    // Verify socket identity matches envelope sender
    const conn = this.connectionManager.getConnection(socket);
    if (!conn || conn.fingerprint !== envelope.sender || conn.sessionId !== envelope.sessionId) {
      throw new SignalingValidationError("Sender authorization failed: Sender does not match authenticated socket.");
    }

    const peer = this.sessionManager.getPeerParticipant(envelope.sessionId, envelope.sender);
    if (!peer) {
      throw new SignalingValidationError("Peer participant not found in active session.");
    }

    // Route SDP offer/answer envelope directly to peer socket
    this.sendEnvelope(peer.socket, envelope);
  }

  private handleIceCandidateRelay(socket: WebSocket, envelope: SignalingEnvelope): void {
    validateIceCandidatePayload(envelope.payload);

    const conn = this.connectionManager.getConnection(socket);
    if (!conn || conn.fingerprint !== envelope.sender || conn.sessionId !== envelope.sessionId) {
      throw new SignalingValidationError("Sender authorization failed: Sender does not match authenticated socket.");
    }

    const peer = this.sessionManager.getPeerParticipant(envelope.sessionId, envelope.sender);
    if (!peer) {
      throw new SignalingValidationError("Peer participant not found in active session.");
    }

    // Route ICE candidate envelope directly to peer socket
    this.sendEnvelope(peer.socket, envelope);
  }

  private handleSessionEnd(_socket: WebSocket, envelope: SignalingEnvelope): void {
    const peer = this.sessionManager.getPeerParticipant(envelope.sessionId, envelope.sender);
    if (peer) {
      this.sendEnvelope(peer.socket, {
        version: SIGNALING_CONFIG.PROTOCOL_VERSION,
        type: SignalingMessageType.PEER_LEFT,
        sessionId: envelope.sessionId,
        sender: "server",
        payload: { reason: "Peer closed session" },
      });
    }
    this.sessionManager.destroySession(envelope.sessionId);
  }

  private handleSocketClose(socket: WebSocket): void {
    const conn = this.connectionManager.unregisterConnection(socket);
    this.rateLimiter.removeSocketTracker(socket);

    if (conn && conn.sessionId && conn.fingerprint) {
      const { remainingPeer } = this.sessionManager.leaveSession(conn.sessionId, conn.fingerprint);
      if (remainingPeer) {
        this.sendEnvelope(remainingPeer.socket, {
          version: SIGNALING_CONFIG.PROTOCOL_VERSION,
          type: SignalingMessageType.PEER_LEFT,
          sessionId: conn.sessionId,
          sender: "server",
          payload: { reason: "Peer disconnected" },
        });
      }
    }
  }

  private sendEnvelope(socket: WebSocket, envelope: SignalingEnvelope): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(envelope));
    }
  }

  public getSessionManager(): EphemeralSessionManager {
    return this.sessionManager;
  }

  public async stop(): Promise<void> {
    this.sessionManager.clearAllSessions();
    this.rateLimiter.clearAll();
    this.connectionManager.destroy();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    if (this.httpServer && this.httpServer.listening) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => resolve());
      });
      this.httpServer = null;
    }
  }
}
