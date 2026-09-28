/**
 * Between Us — Ringtone & Audio Sound Manager
 * Handles outgoing ringtone, incoming ringtone, Web Audio fallback chime, and haptic vibration feedback.
 * Features automatic audio context pre-unlock on user interaction and Web Audio API synthesizer fallback.
 */

class RingtoneManager {
  private outgoingAudio: HTMLAudioElement | null = null;
  private incomingAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private synthInterval: ReturnType<typeof setInterval> | null = null;
  private vibrateInterval: ReturnType<typeof setInterval> | null = null;
  private isVibrating = false;
  private isUnlocked = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.attachUnlockListeners();
    }
  }

  /**
   * Pre-unlocks Web Audio Context and audio playback on first user touch/click interaction.
   */
  private attachUnlockListeners(): void {
    const unlock = () => {
      if (this.isUnlocked) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx && !this.audioContext) {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext && this.audioContext.state === "suspended") {
          this.audioContext.resume();
        }

        // Silent dummy audio play to unlock HTML5 Audio element autoplay restriction
        const dummyAudio = new Audio();
        dummyAudio.volume = 0.001;
        dummyAudio.play().then(() => {
          dummyAudio.pause();
        }).catch(() => {});

        this.isUnlocked = true;
      } catch (err) {
        console.warn("Audio Context unlock notice:", err);
      }

      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("click", unlock);
    };

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
    window.addEventListener("click", unlock, { once: true });
  }

  public playOutgoingRingtone(): void {
    this.stopAll();
    if (typeof window === "undefined") return;

    try {
      this.outgoingAudio = new Audio("/sounds/outgoing-ringtone.mp3");
      this.outgoingAudio.loop = true;
      this.outgoingAudio.volume = 0.8;

      const playPromise = this.outgoingAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          this.startSynthRingtone(440, 660);
        });
      }
    } catch {
      this.startSynthRingtone(440, 660);
    }
  }

  public playIncomingRingtone(): void {
    this.stopAll();
    if (typeof window === "undefined") return;

    // Start repeating haptic vibration on mobile devices
    this.startVibration();

    try {
      this.incomingAudio = new Audio("/sounds/incoming-ringtone.mp3");
      this.incomingAudio.loop = true;
      this.incomingAudio.volume = 0.9;

      const playPromise = this.incomingAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("HTML5 audio blocked by browser policy, using Web Audio synthesizer fallback:", err);
          this.startSynthRingtone(523.25, 659.25); // C5 & E5 harmonic ring chime
        });
      }
    } catch {
      this.startSynthRingtone(523.25, 659.25);
    }
  }

  /**
   * Synthesizes audio chime ringtone using Web Audio API when MP3 audio element is blocked.
   */
  private startSynthRingtone(freq1: number, freq2: number): void {
    this.stopSynthRingtone();
    if (typeof window === "undefined") return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume().catch(() => {});
      }

      const playPulse = () => {
        if (!this.audioContext || this.audioContext.state !== "running") return;
        try {
          const now = this.audioContext.currentTime;

          // Osc 1
          const osc1 = this.audioContext.createOscillator();
          const gain1 = this.audioContext.createGain();
          osc1.type = "sine";
          osc1.frequency.setValueAtTime(freq1, now);
          gain1.gain.setValueAtTime(0.3, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc1.connect(gain1);
          gain1.connect(this.audioContext.destination);
          osc1.start(now);
          osc1.stop(now + 0.4);

          // Osc 2 (harmonic overlay after 150ms)
          const osc2 = this.audioContext.createOscillator();
          const gain2 = this.audioContext.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(freq2, now + 0.15);
          gain2.gain.setValueAtTime(0.3, now + 0.15);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
          osc2.connect(gain2);
          gain2.connect(this.audioContext.destination);
          osc2.start(now + 0.15);
          osc2.stop(now + 0.65);
        } catch {}
      };

      playPulse();
      this.synthInterval = setInterval(playPulse, 1800);
    } catch {}
  }

  private startVibration(): void {
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    this.isVibrating = true;

    const vibratePattern = () => {
      try {
        if (this.isVibrating && navigator.vibrate) {
          navigator.vibrate([500, 300, 500, 300, 800]);
        }
      } catch {}
    };

    vibratePattern();
    this.vibrateInterval = setInterval(vibratePattern, 2500);
  }

  private stopSynthRingtone(): void {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  private stopVibration(): void {
    this.isVibrating = false;
    if (this.vibrateInterval) {
      clearInterval(this.vibrateInterval);
      this.vibrateInterval = null;
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(0);
      } catch {}
    }
  }

  public stopAll(): void {
    this.stopSynthRingtone();
    this.stopVibration();

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
  }
}

export const ringtoneManager = new RingtoneManager();
