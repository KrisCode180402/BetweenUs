import { NextResponse } from 'next/server';
import { sendIncomingCallPushNotification, IncomingCallPushPayload } from '@/lib/push/push-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetDeviceId, callId, callType, callerName, expiresAt } = body;

    if (!targetDeviceId || !callId || !callType) {
      return NextResponse.json({ error: 'Missing required parameters (targetDeviceId, callId, callType)' }, { status: 400 });
    }

    const payload: IncomingCallPushPayload = {
      type: 'incoming-call',
      callId,
      callType: callType === 'video' ? 'video' : 'audio',
      callerName: callerName || 'Partner',
      expiresAt: expiresAt || Date.now() + 45000,
    };

    const result = await sendIncomingCallPushNotification(targetDeviceId, payload);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Incoming call push dispatched successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to dispatch call push notification' }, { status: 500 });
  }
}
