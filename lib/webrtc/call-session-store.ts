/**
 * Between Us — Global Call Session Store
 * Decouples WebRTC call sessions from page routes and React component unmount lifecycles.
 * Ensures active audio/video calls remain connected when navigating or accidentally swiping back.
 */

import { AudioCallManager } from "./call-manager";
import { CallState } from "./types";

type CallSessionChangeListener = (manager: AudioCallManager | null, state: CallState) => void;

class CallSessionStore {
  private activeManager: AudioCallManager | null = null;
  private listeners: Set<CallSessionChangeListener> = new Set();

  public getActiveSession(): AudioCallManager | null {
    return this.activeManager;
  }

  public setActiveSession(manager: AudioCallManager | null): void {
    if (this.activeManager === manager) return;

    this.activeManager = manager;
    this.notifyListeners();
  }

  public clearActiveSession(): void {
    if (this.activeManager) {
      this.activeManager = null;
      this.notifyListeners();
    }
  }

  public isCallActive(): boolean {
    if (!this.activeManager) return false;
    const state = this.activeManager.getState();
    return (
      state === CallState.OUTGOING_INITIATING ||
      state === CallState.OUTGOING_RINGING ||
      state === CallState.INCOMING_RINGING ||
      state === CallState.ACCEPTING ||
      state === CallState.NEGOTIATING ||
      state === CallState.CONNECTING ||
      state === CallState.CONNECTED ||
      state === CallState.RECONNECTING ||
      state === CallState.CALLING ||
      state === CallState.RINGING
    ) as boolean;
  }

  public subscribe(listener: CallSessionChangeListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    const state = this.activeManager ? this.activeManager.getState() : CallState.IDLE;
    listener(this.activeManager, state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public notifyListeners(): void {
    const state = this.activeManager ? this.activeManager.getState() : CallState.IDLE;
    this.listeners.forEach((listener) => {
      try {
        listener(this.activeManager, state);
      } catch (err) {
        console.warn("CallSessionStore listener error:", err);
      }
    });
  }
}

export const callSessionStore = new CallSessionStore();
