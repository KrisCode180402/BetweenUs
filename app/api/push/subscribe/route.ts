import { NextResponse } from 'next/server';
import { registerPushSubscription, unregisterPushSubscription } from '@/lib/push/push-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deviceId, subscription, action } = body;

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
    }

    if (action === 'unsubscribe') {
      unregisterPushSubscription(deviceId);
      return NextResponse.json({ success: true, message: 'Unsubscribed cleanly' });
    }

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid PushSubscription payload' }, { status: 400 });
    }

    registerPushSubscription(deviceId, subscription);
    return NextResponse.json({ success: true, message: 'Push subscription registered successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to process subscription request' }, { status: 500 });
  }
}
