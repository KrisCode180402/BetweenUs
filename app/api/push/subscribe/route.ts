import { NextResponse } from "next/server";
import { registerPushSubscription, unregisterPushSubscription } from "@/lib/push/push-store";
import {
  extractClientKey,
  isValidPushKeys,
  isValidWebPushEndpoint,
  pushSubscribeLimiter,
  verifyPushRequestProof,
} from "@/lib/push/push-security";

export async function POST(request: Request) {
  const clientKey = extractClientKey(request);
  if (!pushSubscribeLimiter.allow(clientKey)) {
    return NextResponse.json({ error: "Too many subscription requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { deviceId, subscription, action, proof } = body ?? {};

    if (typeof deviceId !== "string" || deviceId.trim().length < 3 || deviceId.length > 128) {
      return NextResponse.json({ error: "Invalid or missing deviceId" }, { status: 400 });
    }

    const normalizedAction = action === "unsubscribe" ? "unsubscribe" : "subscribe";
    const proofCheck = await verifyPushRequestProof(
      normalizedAction,
      deviceId,
      proof,
      /^[0-9a-f]{64}$/i.test(deviceId)
    );
    if (!proofCheck.valid) {
      return NextResponse.json({ error: proofCheck.reason || "Unauthorized" }, { status: 401 });
    }

    if (normalizedAction === "unsubscribe") {
      unregisterPushSubscription(deviceId);
      return NextResponse.json({ success: true, message: "Unsubscribed cleanly" });
    }

    if (
      !subscription ||
      typeof subscription !== "object" ||
      !isValidWebPushEndpoint(subscription.endpoint) ||
      !isValidPushKeys(subscription.keys)
    ) {
      return NextResponse.json({ error: "Invalid or unsafe PushSubscription payload" }, { status: 400 });
    }

    registerPushSubscription(deviceId, {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
    return NextResponse.json({ success: true, message: "Push subscription registered successfully" });
  } catch {
    return NextResponse.json({ error: "Failed to process subscription request" }, { status: 500 });
  }
}
