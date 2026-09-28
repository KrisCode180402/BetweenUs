/**
 * Between Us — Screen Wake Lock Manager
 * Prevents screen auto-lock / sleep during active audio & video calls using the Screen Wake Lock API.
 * Gracefully handles re-acquisition on visibilitychange and unsupported browsers.
 */

export class WakeLockManager {
  private wakeLock: any = null;
  private isActiveCall = false;

  private handleVisibilityChange = async () => {
    if (this.isActiveCall && document.visibilityState === "visible" && !this.wakeLock) {
      await this.acquire();
    }
  };

  /**
   * Attempts to acquire Screen Wake Lock during active call session.
   */
  public async acquire(): Promise<boolean> {
    this.isActiveCall = true;

    if (typeof window === "undefined" || !("wakeLock" in navigator)) {
      return false;
    }

    try {
      if (this.wakeLock) {
        return true;
      }

      this.wakeLock = await (navigator as any).wakeLock.request("screen");

      if (this.wakeLock) {
        this.wakeLock.addEventListener("release", () => {
          this.wakeLock = null;
        });
      }

      // Attach visibility change listener to re-acquire if lost when switching tabs/apps
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
      document.addEventListener("visibilitychange", this.handleVisibilityChange);

      return true;
    } catch (err) {
      console.warn("Screen Wake Lock acquisition notice:", err);
      return false;
    }
  }

  /**
   * Releases active Screen Wake Lock upon call session termination.
   */
  public async release(): Promise<void> {
    this.isActiveCall = false;
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);

    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
      } catch {}
      this.wakeLock = null;
    }
  }
}

export const wakeLockManager = new WakeLockManager();
