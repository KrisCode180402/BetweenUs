import { CallState, CallEvent } from "./types";

export class CallStateError extends Error {
  constructor(message: string) {
    super(`CallStateError: ${message}`);
    this.name = "CallStateError";
  }
}

/**
 * Authoritative Call State Machine Transition Matrix.
 * Maps every valid CallState to its set of permitted destination states.
 */
const ALLOWED_CALL_TRANSITIONS: Record<CallState, CallState[]> = {
  [CallState.IDLE]: [
    CallState.OUTGOING_INITIATING,
    CallState.OUTGOING_RINGING,
    CallState.INCOMING_RINGING,
    CallState.CALLING,
    CallState.RINGING,
    CallState.FAILED,
    CallState.ENDING,
    CallState.ENDED,
    CallState.CANCELLED,
  ],
  [CallState.OUTGOING_INITIATING]: [
    CallState.OUTGOING_RINGING,
    CallState.CALLING,
    CallState.CANCELLED,
    CallState.FAILED,
    CallState.TIMED_OUT,
    CallState.ENDING,
  ],
  [CallState.OUTGOING_RINGING]: [
    CallState.ACCEPTING,
    CallState.NEGOTIATING,
    CallState.CONNECTING,
    CallState.CONNECTED,
    CallState.REJECTED,
    CallState.CANCELLED,
    CallState.FAILED,
    CallState.TIMED_OUT,
    CallState.ENDING,
  ],
  [CallState.INCOMING_RINGING]: [
    CallState.ACCEPTING,
    CallState.NEGOTIATING,
    CallState.CONNECTING,
    CallState.CONNECTED,
    CallState.REJECTED,
    CallState.CANCELLED,
    CallState.FAILED,
    CallState.TIMED_OUT,
    CallState.ENDING,
  ],
  [CallState.CALLING]: [
    CallState.ACCEPTING,
    CallState.NEGOTIATING,
    CallState.CONNECTING,
    CallState.CONNECTED,
    CallState.REJECTED,
    CallState.CANCELLED,
    CallState.FAILED,
    CallState.TIMED_OUT,
    CallState.ENDING,
  ],
  [CallState.RINGING]: [
    CallState.ACCEPTING,
    CallState.NEGOTIATING,
    CallState.CONNECTING,
    CallState.CONNECTED,
    CallState.REJECTED,
    CallState.CANCELLED,
    CallState.FAILED,
    CallState.TIMED_OUT,
    CallState.ENDING,
  ],
  [CallState.ACCEPTING]: [
    CallState.NEGOTIATING,
    CallState.CONNECTING,
    CallState.CONNECTED,
    CallState.REJECTED,
    CallState.CANCELLED,
    CallState.FAILED,
    CallState.TIMED_OUT,
    CallState.ENDING,
  ],
  [CallState.NEGOTIATING]: [
    CallState.CONNECTING,
    CallState.CONNECTED,
    CallState.RECONNECTING,
    CallState.FAILED,
    CallState.TIMED_OUT,
    CallState.ENDING,
  ],
  [CallState.CONNECTING]: [
    CallState.CONNECTED,
    CallState.RECONNECTING,
    CallState.FAILED,
    CallState.TIMED_OUT,
    CallState.ENDING,
  ],
  [CallState.CONNECTED]: [
    CallState.RECONNECTING,
    CallState.ENDING,
    CallState.FAILED,
  ],
  [CallState.RECONNECTING]: [
    CallState.CONNECTED,
    CallState.FAILED,
    CallState.TIMED_OUT,
    CallState.ENDING,
  ],
  [CallState.ENDING]: [
    CallState.ENDED,
  ],
  [CallState.ENDED]: [
    CallState.IDLE,
    CallState.ENDED,
  ],
  [CallState.FAILED]: [
    CallState.IDLE,
    CallState.ENDED,
  ],
  [CallState.TIMED_OUT]: [
    CallState.IDLE,
    CallState.ENDED,
  ],
  [CallState.REJECTED]: [
    CallState.IDLE,
    CallState.ENDED,
  ],
  [CallState.CANCELLED]: [
    CallState.IDLE,
    CallState.ENDED,
  ],
};

/**
 * Event-Driven Transition Reducer.
 * Maps (currentState, event) -> nextState.
 */
function reduceState(state: CallState, event: CallEvent): CallState {
  switch (event) {
    case CallEvent.START_CALL:
      if (state === CallState.IDLE) return CallState.OUTGOING_INITIATING;
      break;

    case CallEvent.OFFER_SENT:
      if (state === CallState.OUTGOING_INITIATING) return CallState.OUTGOING_RINGING;
      break;

    case CallEvent.INCOMING_OFFER:
      if (state === CallState.IDLE) return CallState.INCOMING_RINGING;
      break;

    case CallEvent.ACCEPT:
      if (
        state === CallState.INCOMING_RINGING ||
        state === CallState.RINGING ||
        state === CallState.OUTGOING_RINGING ||
        state === CallState.CALLING
      )
        return CallState.ACCEPTING;
      break;

    case CallEvent.SDP_EXCHANGE:
      if (
        state === CallState.ACCEPTING ||
        state === CallState.OUTGOING_RINGING ||
        state === CallState.CALLING
      )
        return CallState.NEGOTIATING;
      break;

    case CallEvent.ICE_CONNECTED:
      if (
        state === CallState.NEGOTIATING ||
        state === CallState.CONNECTING ||
        state === CallState.RECONNECTING ||
        state === CallState.ACCEPTING ||
        state === CallState.OUTGOING_RINGING ||
        state === CallState.CALLING
      )
        return CallState.CONNECTED;
      break;

    case CallEvent.NETWORK_INTERRUPTED:
      if (state === CallState.CONNECTED || state === CallState.CONNECTING)
        return CallState.RECONNECTING;
      break;

    case CallEvent.RECONNECTED:
      if (state === CallState.RECONNECTING) return CallState.CONNECTED;
      break;

    case CallEvent.DECLINE:
      if (
        state === CallState.INCOMING_RINGING ||
        state === CallState.RINGING ||
        state === CallState.OUTGOING_RINGING ||
        state === CallState.CALLING
      )
        return CallState.REJECTED;
      break;

    case CallEvent.CANCEL:
      if (
        state === CallState.OUTGOING_INITIATING ||
        state === CallState.OUTGOING_RINGING ||
        state === CallState.CALLING
      )
        return CallState.CANCELLED;
      break;

    case CallEvent.HANGUP:
      if (
        state === CallState.CONNECTED ||
        state === CallState.CONNECTING ||
        state === CallState.RECONNECTING ||
        state === CallState.NEGOTIATING ||
        state === CallState.ACCEPTING ||
        state === CallState.OUTGOING_RINGING ||
        state === CallState.INCOMING_RINGING ||
        state === CallState.CALLING ||
        state === CallState.RINGING
      )
        return CallState.ENDING;
      break;

    case CallEvent.TIMEOUT:
      if (
        state === CallState.OUTGOING_INITIATING ||
        state === CallState.OUTGOING_RINGING ||
        state === CallState.INCOMING_RINGING ||
        state === CallState.NEGOTIATING ||
        state === CallState.CONNECTING ||
        state === CallState.RECONNECTING ||
        state === CallState.CALLING ||
        state === CallState.RINGING
      )
        return CallState.TIMED_OUT;
      break;

    case CallEvent.ERROR:
      if (state !== CallState.IDLE && state !== CallState.ENDED) return CallState.FAILED;
      break;

    case CallEvent.RESET:
      return CallState.IDLE;
  }

  throw new CallStateError(
    `Invalid event '${event}' for current call state '${state}'.`
  );
}

export class CallStateMachine {
  private currentState: CallState = CallState.IDLE;
  private sessionId: string | null = null;

  constructor(initialState: CallState = CallState.IDLE) {
    this.currentState = initialState;
  }

  public getState(): CallState {
    return this.currentState;
  }

  public getSessionId(): string | null {
    return this.sessionId;
  }

  public setSessionId(id: string | null): void {
    this.sessionId = id;
  }

  /**
   * Checks if transition to nextState is permitted from currentState.
   */
  public canTransitionTo(nextState: CallState): boolean {
    if (this.currentState === nextState) return true;
    const allowed = ALLOWED_CALL_TRANSITIONS[this.currentState];
    return Array.isArray(allowed) && allowed.includes(nextState);
  }

  /**
   * Directly transitions state to nextState after validating transition matrix.
   */
  public transitionTo(nextState: CallState): void {
    if (this.currentState === nextState) return;

    if (!this.canTransitionTo(nextState)) {
      throw new CallStateError(
        `Illegal call state transition from ${this.currentState} to ${nextState}.`
      );
    }

    this.currentState = nextState;
  }

  /**
   * Dispatches a CallEvent and advances state using event reducer.
   */
  public dispatch(event: CallEvent): CallState {
    const nextState = reduceState(this.currentState, event);
    this.transitionTo(nextState);
    return this.currentState;
  }

  /**
   * Resets state machine to IDLE and clears active session ID.
   */
  public reset(): void {
    this.currentState = CallState.IDLE;
    this.sessionId = null;
  }
}
