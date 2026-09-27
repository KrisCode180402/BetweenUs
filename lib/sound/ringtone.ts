/**
 * Between Us — Ringtone & Audio Sound Manager
 * Handles outgoing ringtone, incoming ringtone, and vibration feedback
 */

class RingtoneManager {
  private outgoingAudio: HTMLAudioElement | null = null;
  private incomingAudio: HTMLAudioElement | null = null;
  private isVibrating = false;

  public playOutgoingRingtone(): void {
    this.stopAll();
    if (typeof window === "undefined") return;

    try {
      this.outgoingAudio = new Audio("/sounds/outgoing-ringtone.mp3");
      this.outgoingAudio.loop = true;
      this.outgoingAudio.volume = 0.8;
      this.outgoingAudio.play().catch((err) => {
        console.warn("Outgoing ringtone play notice (autoplay policy):", err);
      });
    } catch (err) {
      console.warn("Failed to play outgoing ringtone:", err);
    }
  }

  public playIncomingRingtone(): void {
    this.stopAll();
    if (typeof window === "undefined") return;

    try {
      this.incomingAudio = new Audio("/sounds/incoming-ringtone.mp3");
      this.incomingAudio.loop = true;
      this.incomingAudio.volume = 0.9;
      this.incomingAudio.play().catch((err) => {
        console.warn("Incoming ringtone play notice (autoplay policy):", err);
      });

      // Haptic vibration feedback on mobile
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        this.isVibrating = true;
        navigator.vibrate([400, 200, 400, 200, 400, 200]);
      }
    } catch (err) {
      console.warn("Failed to play incoming ringtone:", err);
    }
  }

  public stopAll(): void {
    if (this.outgoingAudio) {
      try {
        this.outgoingAudio.pause();
        this.outgoingAudio.currentTime = 0;
      } catch {}
      this.outgoingAudio = null;
    }

    if (this.incomingAudio) {
      try {
        this.incomingAudio.pause();
        this.incomingAudio.currentTime = 0;
      } catch {}
      this.incomingAudio = null;
    }

    if (this.isVibrating && typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(0);
      } catch {}
      this.isVibrating = false;
    }
  }
}

export const ringtoneManager = new RingtoneManager();
