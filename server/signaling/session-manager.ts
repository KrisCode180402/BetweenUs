import { EphemeralSignalingSession, SignalingParticipant } from "./types";
import { SIGNALING_CONFIG } from "./config";

export class EphemeralSessionManager {
  private sessions = new Map<string, EphemeralSignalingSession>();

  public getSessionCount(): number {
    return this.sessions.size;
  }

  public getSession(sessionId: string): EphemeralSignalingSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Adds an authenticated participant to an ephemeral session.
   * Enforces strict maximum 2-participant limit.
   */
  public joinSession(
    sessionId: string,
    participant: SignalingParticipant
  ): { session: EphemeralSignalingSession; isFull: boolean } {
    let session = this.sessions.get(sessionId);

    if (!session) {
      session = {
        sessionId,
        participants: new Map<string, SignalingParticipant>(),
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
        expirationTimer: null,
      };
      this.sessions.set(sessionId, session);
    }

    // Enforce 2-participant limit
    if (
      session.participants.size >= SIGNALING_CONFIG.MAX_PARTICIPANTS_PER_SESSION &&
      !session.participants.has(participant.fingerprint)
    ) {
      throw new Error(`Session ${sessionId} has reached maximum limit of 2 participants.`);
    }

    session.participants.set(participant.fingerprint, participant);
    session.lastActivityAt = Date.now();
    this.refreshExpirationTimer(session);

    const isFull = session.participants.size === SIGNALING_CONFIG.MAX_PARTICIPANTS_PER_SESSION;
    return { session, isFull };
  }

  /**
   * Retrieves the designated peer participant in a 1-to-1 session.
   */
  public getPeerParticipant(sessionId: string, senderFingerprint: string): SignalingParticipant | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.lastActivityAt = Date.now();
    this.refreshExpirationTimer(session);

    for (const [fingerprint, participant] of session.participants.entries()) {
      if (fingerprint !== senderFingerprint) {
        return participant;
      }
    }
    return null;
  }

  /**
   * Removes a participant from a session.
   * Purges session from memory if all participants have departed.
   */
  public leaveSession(sessionId: string, fingerprint: string): { remainingPeer: SignalingParticipant | null } {
    const session = this.sessions.get(sessionId);
    if (!session) return { remainingPeer: null };

    session.participants.delete(fingerprint);

    if (session.participants.size === 0) {
      this.destroySession(sessionId);
      return { remainingPeer: null };
    }

    const remainingPeer = Array.from(session.participants.values())[0] || null;
    return { remainingPeer };
  }

  /**
   * Explicitly purges session state and clears timers.
   */
  public destroySession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      if (session.expirationTimer) {
        clearTimeout(session.expirationTimer);
      }
      session.participants.clear();
      this.sessions.delete(sessionId);
    }
  }

  private refreshExpirationTimer(session: EphemeralSignalingSession): void {
    if (session.expirationTimer) {
      clearTimeout(session.expirationTimer);
    }
    session.expirationTimer = setTimeout(() => {
      this.destroySession(session.sessionId);
    }, SIGNALING_CONFIG.IDLE_SESSION_TIMEOUT_MS);
  }

  /**
   * Purges all ephemeral sessions from memory (used for server shutdown & testing).
   */
  public clearAllSessions(): void {
    for (const sessionId of Array.from(this.sessions.keys())) {
      this.destroySession(sessionId);
    }
  }
}
