/**
 * Between Us — Client Push Notification Manager
 * Handles ServiceWorker registration, VAPID subscription, and Push API interactions.
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export class PushManager {
  private static instance: PushManager | null = null;
  private isSupported: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    }
  }

  public static getInstance(): PushManager {
    if (!PushManager.instance) {
      PushManager.instance = new PushManager();
    }
    return PushManager.instance;
  }

  public checkSupport(): boolean {
    return this.isSupported;
  }

  public getPermissionState(): PushPermissionStatus {
    if (!this.isSupported) return 'unsupported';
    return Notification.permission as PushPermissionStatus;
  }

  public async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported) return null;
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      return registration;
    } catch (err) {
      console.warn('[PushManager] ServiceWorker registration failed:', err);
      return null;
    }
  }

  public async enableNotifications(deviceId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isSupported) {
      return { success: false, error: 'Web Push is not supported on this browser' };
    }

    try {
      // 1. Register service worker
      const reg = await this.registerServiceWorker();
      if (!reg) {
        return { success: false, error: 'Failed to register Service Worker' };
      }

      // 2. Request permission explicitly
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { success: false, error: 'Notification permission denied by user' };
      }

      // 3. Retrieve VAPID Public Key from server
      const keyRes = await fetch('/api/push/public-key');
      if (!keyRes.ok) {
        return { success: false, error: 'Failed to fetch VAPID public key' };
      }
      const { publicKey } = await keyRes.json();
      if (!publicKey) {
        return { success: false, error: 'Invalid VAPID public key' };
      }

      // 4. Subscribe to PushManager
      const convertedKey = urlBase64ToUint8Array(publicKey);
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey.buffer as ArrayBuffer,
        });
      }

      // 5. Send subscription info to server
      const subJson = subscription.toJSON();
      const subRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          subscription: subJson,
          action: 'subscribe',
        }),
      });

      if (!subRes.ok) {
        return { success: false, error: 'Failed to register subscription on server' };
      }

      localStorage.setItem('between_us_push_enabled', 'true');
      return { success: true };
    } catch (err: unknown) {
      const error = err as Error;
      return { success: false, error: error.message || 'Push subscription error' };
    }
  }

  public async disableNotifications(deviceId: string): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          action: 'unsubscribe',
        }),
      });

      localStorage.removeItem('between_us_push_enabled');
      return true;
    } catch {
      return false;
    }
  }

  public isEnabledLocally(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('between_us_push_enabled') === 'true' && Notification.permission === 'granted';
  }

  public async sendTestNotification(): Promise<boolean> {
    if (!this.isSupported) return false;
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification('Between Us ❤️', {
        body: 'Push notifications are enabled and working perfectly!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: 'test-notification',
      });
      return true;
    } catch {
      return false;
    }
  }

  public async sendIncomingCallPush(
    targetDeviceId: string,
    callId: string,
    callType: 'audio' | 'video',
    callerName?: string
  ): Promise<boolean> {
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetDeviceId,
          callId,
          callType,
          callerName: callerName || 'Partner',
          expiresAt: Date.now() + 45000,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const pushManager = PushManager.getInstance();
