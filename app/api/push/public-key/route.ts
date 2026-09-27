import { NextResponse } from 'next/server';
import { getVapidKeys } from '@/lib/push/vapid';

export async function GET() {
  try {
    const keys = getVapidKeys();
    return NextResponse.json({ publicKey: keys.publicKey });
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve VAPID public key' }, { status: 500 });
  }
}
