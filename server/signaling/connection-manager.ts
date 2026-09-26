import { WebSocket } from "ws";
import { SIGNALING_CONFIG } from "./config";

export interface ActiveConnection {
  socket: WebSocket;
  ip: string;
  sessionId: string | null;
  fingerprint: string | null;
  isAlive: boolean;
  connectedAt: number;
}

export class ConnectionManager {
  private connections = new Map<WebSocket, ActiveConnection>();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startHeartbeatTimer();
  }

  public registerConnection(socket: WebSocket, ip: string): ActiveConnection {
    const conn: ActiveConnection = {
      socket,
      ip,
      sessionId: null,
      fingerprint: null,
      isAlive: true,
      connectedAt: Date.now(),
    };

    this.connections.set(socket, conn);

    socket.on("pong", () => {
      const active = this.connections.get(socket);
      if (active) active.isAlive = true;
    });

    return conn;
  }

  public getConnection(socket: WebSocket): ActiveConnection | null {
    return this.connections.get(socket) || null;
  }

  public updateConnectionSession(socket: WebSocket, sessionId: string, fingerprint: string): void {
    const conn = this.connections.get(socket);
    if (conn) {
      conn.sessionId = sessionId;
      conn.fingerprint = fingerprint;
    }
  }

  public unregisterConnection(socket: WebSocket): ActiveConnection | null {
    const conn = this.connections.get(socket) || null;
    this.connections.delete(socket);
    return conn;
  }

  public getActiveCount(): number {
    return this.connections.size;
  }

  private startHeartbeatTimer(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const [socket, conn] of this.connections.entries()) {
        if (!conn.isAlive) {
          socket.terminate();
          this.connections.delete(socket);
          continue;
        }

        conn.isAlive = false;
        try {
          socket.ping();
        } catch {
          socket.terminate();
          this.connections.delete(socket);
        }
      }
    }, SIGNALING_CONFIG.HEARTBEAT_INTERVAL_MS);
  }

  public destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    for (const [socket] of this.connections.entries()) {
      try {
        socket.close();
      } catch {}
    }
    this.connections.clear();
  }
}
