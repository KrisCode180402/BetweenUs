/**
 * Between Us — Centralized Permission Manager
 * Manages browser permissions required for PWA Audio/Video calls, Notifications, and Screen Wake Lock.
 * Exposes clear states: 'unsupported' | 'unknown' | 'prompt' | 'granted' | 'denied'
 */

export type PermissionStatusState = 'unsupported' | 'unknown' | 'prompt' | 'granted' | 'denied';

export interface ApplicationPermissionsState {
  microphone: PermissionStatusState;
  camera: PermissionStatusState;
  notifications: PermissionStatusState;
  wakeLock: PermissionStatusState;
}

export class PermissionManager {
  private static instance: PermissionManager | null = null;

  public static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  /**
   * Queries the current status of all relevant browser permissions contextually.
   */
  public async queryAllPermissions(): Promise<ApplicationPermissionsState> {
    const microphone = await this.queryPermission('microphone' as any);
    const camera = await this.queryPermission('camera' as any);
    const notifications = this.getNotificationPermissionState();
    const wakeLock = typeof window !== 'undefined' && 'wakeLock' in navigator ? 'prompt' : 'unsupported';

    return {
      microphone,
      camera,
      notifications,
      wakeLock,
    };
  }

  /**
   * Safely queries specific browser permission status using navigator.permissions API if available.
   */
  public async queryPermission(name: PermissionName): Promise<PermissionStatusState> {
    if (typeof window === 'undefined' || !navigator || !navigator.permissions) {
      return 'unknown';
    }

    try {
      const status = await navigator.permissions.query({ name });
      return status.state as PermissionStatusState;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Gets current state of Web Notifications API permission.
   */
  public getNotificationPermissionState(): PermissionStatusState {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as PermissionStatusState;
  }

  /**
   * Requests Microphone permission.
   */
  public async requestMicrophonePermission(): Promise<{ granted: boolean; state: PermissionStatusState; error?: string }> {
    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { granted: false, state: 'unsupported', error: 'Microphone API unavailable' };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return { granted: true, state: 'granted' };
    } catch (err: any) {
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      return {
        granted: false,
        state: isDenied ? 'denied' : 'prompt',
        error: err.message || 'Microphone access denied',
      };
    }
  }

  /**
   * Requests Camera + Microphone permissions for video calls.
   */
  public async requestCameraPermission(): Promise<{ granted: boolean; state: PermissionStatusState; error?: string }> {
    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { granted: false, state: 'unsupported', error: 'Camera API unavailable' };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach((track) => track.stop());
      return { granted: true, state: 'granted' };
    } catch (err: any) {
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      return {
        granted: false,
        state: isDenied ? 'denied' : 'prompt',
        error: err.message || 'Camera access denied',
      };
    }
  }

  /**
   * Contextually requests Notification permission on user interaction point.
   */
  public async requestNotificationPermission(): Promise<PermissionStatusState> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission as PermissionStatusState;
    } catch {
      return Notification.permission as PermissionStatusState;
    }
  }
}

export const permissionManager = PermissionManager.getInstance();
