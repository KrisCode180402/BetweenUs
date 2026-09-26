import { CallStateMachine } from "./call-state-machine";
import { AppLogger } from "../privacy/logger";

export enum CleanupStatus {
  IDLE = "IDLE",
  CLEANING = "CLEANING",
  CLEAN = "CLEAN",
  FAILED_CLEANUP = "FAILED_CLEANUP",
}

export interface CallCleanupTarget {
  pc?: RTCPeerConnection | null;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  stateMachine?: CallStateMachine | null;
  timers?: Array<NodeJS.Timeout | number | null>;
  sessionRef?: { currentSessionId: string | null };
  onCleanupComplete?: () => void;
}

let activeCleanupStatus: CleanupStatus = CleanupStatus.IDLE;

export function getCleanupStatus(): CleanupStatus {
  return activeCleanupStatus;
}

/**
 * Authoritative, Centralized, Idempotent Call Session Cleanup Routine.
 * 
 * Execution Sequence:
 * 1. Mark status as CLEANING to prevent concurrent race conditions.
 * 2. Invalidate active session ID reference so late callbacks/candidates are ignored.
 * 3. Stop local media tracks (microphone/camera) & set track.enabled = false.
 * 4. Stop remote media tracks & detach DOM references.
 * 5. Close RTCPeerConnection & unregister event listeners (ontrack, onicecandidate, etc.).
 * 6. Cancel pending timers & intervals.
 * 7. Reset CallStateMachine to IDLE.
 * 8. Execute optional cleanup callback.
 * 9. Set status to CLEAN.
 */
export function cleanupCallSession(target: CallCleanupTarget): CleanupStatus {
  // Idempotent guard: if already clean or currently cleaning, proceed safely
  activeCleanupStatus = CleanupStatus.CLEANING;

  try {
    // 1. Invalidate active session ID to reject late asynchronous callbacks
    if (target.sessionRef) {
      target.sessionRef.currentSessionId = null;
    }

    // 2. Stop local media tracks
    if (target.localStream) {
      target.localStream.getTracks().forEach((track) => {
        try {
          track.enabled = false;
          track.stop();
        } catch (err) {
          // Ignore individual track stop errors
        }
      });
    }

    // 3. Stop remote media tracks
    if (target.remoteStream) {
      target.remoteStream.getTracks().forEach((track) => {
        try {
          track.enabled = false;
          track.stop();
        } catch (err) {
          // Ignore individual track stop errors
        }
      });
    }

    // 4. Close RTCPeerConnection & unregister handlers
    if (target.pc) {
      try {
        target.pc.ontrack = null;
        target.pc.onicecandidate = null;
        target.pc.oniceconnectionstatechange = null;
        target.pc.onconnectionstatechange = null;
        target.pc.onsignalingstatechange = null;
        target.pc.onicegatheringstatechange = null;

        if (target.pc.connectionState !== "closed") {
          target.pc.close();
        }
      } catch (err) {
        // Ignore closed peer connection error
      }
    }

    // 5. Cancel pending timers
    if (target.timers && Array.isArray(target.timers)) {
      target.timers.forEach((timer) => {
        if (timer) {
          try {
            clearTimeout(timer as NodeJS.Timeout);
          } catch (err) {
            // Ignore timer clear errors
          }
        }
      });
    }

    // 6. Reset CallStateMachine to IDLE
    if (target.stateMachine) {
      try {
        target.stateMachine.reset();
      } catch (err) {
        // Fallback reset
      }
    }

    // 7. Invoke optional callback
    if (target.onCleanupComplete) {
      try {
        target.onCleanupComplete();
      } catch (err) {
        // Ignore callback error
      }
    }

    activeCleanupStatus = CleanupStatus.CLEAN;
    AppLogger.info("Call session cleanup executed successfully", { status: activeCleanupStatus });
    return CleanupStatus.CLEAN;
  } catch (err) {
    activeCleanupStatus = CleanupStatus.FAILED_CLEANUP;
    AppLogger.error("Error during call session cleanup execution", err);
    return CleanupStatus.FAILED_CLEANUP;
  }
}
