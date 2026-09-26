import { PairingState } from "./types";

export class PairingStateError extends Error {
  constructor(message: string) {
    super(`PairingStateError: ${message}`);
    this.name = "PairingStateError";
  }
}

const LEGAL_TRANSITIONS: Record<PairingState, Set<PairingState>> = {
  [PairingState.IDLE]: new Set([
    PairingState.CREATING_INVITATION,
    PairingState.PEER_DETECTED,
    PairingState.CANCELLED,
    PairingState.FAILED,
  ]),
  [PairingState.CREATING_INVITATION]: new Set([
    PairingState.WAITING_FOR_PEER,
    PairingState.CANCELLED,
    PairingState.EXPIRED,
    PairingState.FAILED,
  ]),
  [PairingState.WAITING_FOR_PEER]: new Set([
    PairingState.PEER_DETECTED,
    PairingState.EXCHANGING_IDENTITIES,
    PairingState.CANCELLED,
    PairingState.EXPIRED,
    PairingState.FAILED,
  ]),
  [PairingState.PEER_DETECTED]: new Set([
    PairingState.EXCHANGING_IDENTITIES,
    PairingState.CANCELLED,
    PairingState.EXPIRED,
    PairingState.FAILED,
  ]),
  [PairingState.EXCHANGING_IDENTITIES]: new Set([
    PairingState.AUTHENTICATING,
    PairingState.CANCELLED,
    PairingState.EXPIRED,
    PairingState.FAILED,
  ]),
  [PairingState.AUTHENTICATING]: new Set([
    PairingState.AWAITING_USER_CONFIRMATION,
    PairingState.CANCELLED,
    PairingState.EXPIRED,
    PairingState.FAILED,
  ]),
  [PairingState.AWAITING_USER_CONFIRMATION]: new Set([
    PairingState.FINALIZING,
    PairingState.CANCELLED,
    PairingState.EXPIRED,
    PairingState.FAILED,
  ]),
  [PairingState.FINALIZING]: new Set([
    PairingState.PAIRED,
    PairingState.CANCELLED,
    PairingState.EXPIRED,
    PairingState.FAILED,
  ]),
  [PairingState.PAIRED]: new Set([
    PairingState.IDLE,
  ]),
  [PairingState.CANCELLED]: new Set([
    PairingState.IDLE,
  ]),
  [PairingState.EXPIRED]: new Set([
    PairingState.IDLE,
  ]),
  [PairingState.FAILED]: new Set([
    PairingState.IDLE,
  ]),
};

export class PairingStateMachine {
  private currentState: PairingState = PairingState.IDLE;
  private stateChangeListeners: Array<(state: PairingState) => void> = [];

  public getState(): PairingState {
    return this.currentState;
  }

  public onStateChange(listener: (state: PairingState) => void): void {
    this.stateChangeListeners.push(listener);
  }

  public transitionTo(nextState: PairingState): void {
    if (this.currentState === nextState) return;

    const allowedNext = LEGAL_TRANSITIONS[this.currentState];
    if (!allowedNext || !allowedNext.has(nextState)) {
      throw new PairingStateError(
        `Illegal state transition requested: Cannot jump from ${this.currentState} to ${nextState}.`
      );
    }

    this.currentState = nextState;
    for (const listener of this.stateChangeListeners) {
      try {
        listener(nextState);
      } catch {
        // Suppress listener errors
      }
    }
  }

  public reset(): void {
    this.currentState = PairingState.IDLE;
  }
}
