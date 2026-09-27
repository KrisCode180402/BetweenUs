import webpush from 'web-push';
import { configureWebPush } from './vapid';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface IncomingCallPushPayload {
  type: 'incoming-call';
  callId: string;
  callType: 'audio' | 'video';
  callerName?: string;
  expiresAt: number;
}

// In-memory store mapping deviceId -> PushSubscriptionData
// Note: Ephemeral in Node runtime, zero persistence of call logs or identity
const pushSubscriptions = new Map<string, PushSubscriptionData>();

export function registerPushSubscription(deviceId: string, subscription: PushSubscriptionData) {
  if (!deviceId || !subscription || !subscription.endpoint) return false;
  pushSubscriptions.set(deviceId, subscription);
  return true;
}

export function unregisterPushSubscription(deviceId: string) {
  return pushSubscriptions.delete(deviceId);
}

export function getPushSubscription(deviceId: string): PushSubscriptionData | undefined {
  return pushSubscriptions.get(deviceId);
}

export async function sendIncomingCallPushNotification(
  targetDeviceId: string,
  payload: IncomingCallPushPayload
): Promise<{ success: boolean; error?: string }> {
  const subscription = pushSubscriptions.get(targetDeviceId);
  if (!subscription) {
    return { success: false, error: 'No push subscription registered for target device' };
  }

  try {
    configureWebPush();
    const notificationPayload = JSON.stringify(payload);
    await webpush.sendNotification(subscription, notificationPayload, {
      TTL: 60, // 60 seconds time-to-live for call push
      urgency: 'high',
    });
    return { success: true };
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    if (error.statusCode === 404 || error.statusCode === 410) {
      // Subscription expired or invalid; remove stale entry cleanly
      pushSubscriptions.delete(targetDeviceId);
      return { success: false, error: 'Subscription expired and removed' };
    }
    return { success: false, error: error.message || 'Push dispatch failed' };
  }
}
