import { WebSocket } from "ws";
import { SIGNALING_CONFIG } from "./config";

interface RateTracker {
  count: number;
  resetAt: number;
}

interface LockoutTracker {
  failedAttempts: number;
  lockedUntil: number;
}

export class SignalingRateLimiter {
  private ipConnectionTrackers = new Map<string, RateTracker>();
  private socketMessageTrackers = new Map<WebSocket, RateTracker>();
  private ipLockoutTrackers = new Map<string, LockoutTracker>();

  /**
   * Checks if IP source is allowed to open a new WebSocket connection.
   */
  public allowConnection(ip: string): boolean {
    const now = Date.now();

    // Check temporary lockout
    const lockout = this.ipLockoutTrackers.get(ip);
    if (lockout && now < lockout.lockedUntil) {
      return false;
    }

    let tracker = this.ipConnectionTrackers.get(ip);
    if (!tracker || now > tracker.resetAt) {
      tracker = { count: 1, resetAt: now + 60 * 1000 };
      this.ipConnectionTrackers.set(ip, tracker);
      return true;
    }

    tracker.count++;
    return tracker.count <= SIGNALING_CONFIG.RATE_LIMITS.MAX_CONNECTIONS_PER_MIN_PER_IP;
  }

  /**
   * Checks if socket is allowed to send another message (max 30 msgs/min).
   */
  public allowMessage(socket: WebSocket): boolean {
    const now = Date.now();
    let tracker = this.socketMessageTrackers.get(socket);

    if (!tracker || now > tracker.resetAt) {
      tracker = { count: 1, resetAt: now + 60 * 1000 };
      this.socketMessageTrackers.set(socket, tracker);
      return true;
    }

    tracker.count++;
    return tracker.count <= SIGNALING_CONFIG.RATE_LIMITS.MAX_MESSAGES_PER_MIN_PER_SOCKET;
  }

  /**
   * Records a failed authentication or security validation attempt.
   * Locks out IP source if max failed attempts (5) is reached.
   */
  public recordFailedAttempt(ip: string): void {
    const now = Date.now();
    let lockout = this.ipLockoutTrackers.get(ip);

    if (!lockout) {
      lockout = { failedAttempts: 1, lockedUntil: 0 };
    } else {
      lockout.failedAttempts++;
    }

    if (lockout.failedAttempts >= SIGNALING_CONFIG.RATE_LIMITS.MAX_FAILED_ATTEMPTS_PER_IP) {
      lockout.lockedUntil = now + SIGNALING_CONFIG.RATE_LIMITS.LOCKOUT_DURATION_MS;
    }

    this.ipLockoutTrackers.set(ip, lockout);
  }

  public removeSocketTracker(socket: WebSocket): void {
    this.socketMessageTrackers.delete(socket);
  }

  public clearAll(): void {
    this.ipConnectionTrackers.clear();
    this.socketMessageTrackers.clear();
    this.ipLockoutTrackers.clear();
  }
}
