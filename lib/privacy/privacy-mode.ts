import { cleanupCallSession, CallCleanupTarget, CleanupStatus } from "../webrtc/cleanup";
import { AppLogger } from "./logger";

export type PrivacyModeState =
  | "NORMAL"
  | "PRIVACY_MODE_ACTIVE"
  | "EMERGENCY_EXITING"
  | "SAFE_HOME";

type PrivacyModeListener = (state: PrivacyModeState) => void;

class PrivacyModeManager {
  private state: PrivacyModeState = "NORMAL";
  private listeners: Set<PrivacyModeListener> = new Set();

  /**
   * Returns current Privacy Mode state.
   */
  public getState(): PrivacyModeState {
    return this.state;
  }

  /**
   * Returns whether Privacy Mode is currently active.
   */
  public isActive(): boolean {
    return this.state === "PRIVACY_MODE_ACTIVE";
  }

  /**
   * Subscribes to Privacy Mode state transitions.
   */
  public subscribe(listener: PrivacyModeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(nextState: PrivacyModeState): void {
    if (this.state === nextState) return;
    this.state = nextState;
    AppLogger.info("Privacy Mode state changed", { privacyState: nextState });
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (err) {
        // Suppress listener errors
      }
    });
  }

  /**
   * Enables Privacy Mode overlay/protection without ending the call.
   */
  public enablePrivacyMode(): void {
    if (this.state === "NORMAL") {
      this.setState("PRIVACY_MODE_ACTIVE");
    }
  }

  /**
   * Disables Privacy Mode overlay, returning to normal call display.
   */
  public disablePrivacyMode(): void {
    if (this.state === "PRIVACY_MODE_ACTIVE") {
      this.setState("NORMAL");
    }
  }

  /**
   * Authoritative, Idempotent Emergency Exit Routine.
   * 
   * Integrates directly with Phase 21 zero-retention call session teardown.
   * Halts all hardware tracks, invalidates session reference, closes peer connection,
   * resets call state machine, clears temporary memory, and transitions state to SAFE_HOME.
   */
  public activateEmergencyExit(target?: CallCleanupTarget): CleanupStatus {
    AppLogger.info("Activating Emergency Exit sequence");
    this.setState("EMERGENCY_EXITING");

    let cleanupStatus = CleanupStatus.CLEAN;
    if (target) {
      cleanupStatus = cleanupCallSession(target);
    } else {
      cleanupStatus = cleanupCallSession({});
    }

    if (typeof window !== "undefined" && "caches" in window) {
      try {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      } catch {}
    }

    this.setState("SAFE_HOME");
    return cleanupStatus;
  }

  /**
   * Resets Privacy Mode state machine to NORMAL.
   */
  public reset(): void {
    this.setState("NORMAL");
  }
}

export const privacyModeManager = new PrivacyModeManager();
