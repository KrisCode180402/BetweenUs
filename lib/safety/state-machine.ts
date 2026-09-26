import { VerificationState } from "./types";

export class VerificationStateError extends Error {
  constructor(message: string) {
    super(`VerificationStateError: ${message}`);
    this.name = "VerificationStateError";
  }
}

const LEGAL_VERIFICATION_TRANSITIONS: Record<VerificationState, Set<VerificationState>> = {
  [VerificationState.UNPAIRED]: new Set([
    VerificationState.PAIRED_UNVERIFIED,
    VerificationState.TRUST_REMOVED,
  ]),
  [VerificationState.PAIRED_UNVERIFIED]: new Set([
    VerificationState.VERIFICATION_PENDING,
    VerificationState.IDENTITY_CHANGED,
    VerificationState.UNPAIRED,
    VerificationState.TRUST_REMOVED,
  ]),
  [VerificationState.VERIFICATION_PENDING]: new Set([
    VerificationState.VERIFIED,
    VerificationState.VERIFICATION_FAILED,
    VerificationState.IDENTITY_CHANGED,
    VerificationState.PAIRED_UNVERIFIED,
    VerificationState.UNPAIRED,
    VerificationState.TRUST_REMOVED,
  ]),
  [VerificationState.VERIFIED]: new Set([
    VerificationState.IDENTITY_CHANGED,
    VerificationState.VERIFICATION_PENDING,
    VerificationState.UNPAIRED,
    VerificationState.TRUST_REMOVED,
  ]),
  [VerificationState.IDENTITY_CHANGED]: new Set([
    VerificationState.VERIFICATION_PENDING,
    VerificationState.UNPAIRED,
    VerificationState.TRUST_REMOVED,
  ]),
  [VerificationState.VERIFICATION_FAILED]: new Set([
    VerificationState.VERIFICATION_PENDING,
    VerificationState.UNPAIRED,
    VerificationState.TRUST_REMOVED,
  ]),
  [VerificationState.TRUST_REMOVED]: new Set([
    VerificationState.UNPAIRED,
    VerificationState.PAIRED_UNVERIFIED,
  ]),
};

export class VerificationStateMachine {
  private currentState: VerificationState = VerificationState.UNPAIRED;
  private listeners: Array<(state: VerificationState) => void> = [];

  public getState(): VerificationState {
    return this.currentState;
  }

  public onStateChange(listener: (state: VerificationState) => void): void {
    this.listeners.push(listener);
  }

  public transitionTo(nextState: VerificationState): void {
    if (this.currentState === nextState) return;

    const allowed = LEGAL_VERIFICATION_TRANSITIONS[this.currentState];
    if (!allowed || !allowed.has(nextState)) {
      throw new VerificationStateError(
        `Illegal verification transition requested: Cannot jump from ${this.currentState} to ${nextState}.`
      );
    }

    this.currentState = nextState;
    for (const listener of this.listeners) {
      try {
        listener(nextState);
      } catch {
        // Suppress listener errors
      }
    }
  }

  public reset(): void {
    this.currentState = VerificationState.UNPAIRED;
  }
}
