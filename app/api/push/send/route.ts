import { NextResponse } from "next/server";
import { sendIncomingCallPushNotification, IncomingCallPushPayload } from "@/lib/push/push-store";
import {
  extractClientKey,
  pushSendLimiter,
  verifyPushRequestProof,
} from "@/lib/push/push-security";

export async function POST(request: Request) {
  const clientKey = extractClientKey(request);
  if (!pushSendLimiter.allow(clientKey)) {
    return NextResponse.json({ error: "Too many push notifications requested" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { targetDeviceId, callId, callType, callerName, expiresAt, proof } = body ?? {};

    if (
      typeof targetDeviceId !== "string" ||
      targetDeviceId.length < 3 ||
      targetDeviceId.length > 128 ||
      typeof callId !== "string" ||
      callId.length < 3 ||
      callId.length > 128 ||
      (callType !== "audio" && callType !== "video")
    ) {
      return NextResponse.json(
        { error: "Invalid parameters (targetDeviceId, callId, callType)" },
        { status: 400 }
      );
    }

    const proofCheck = await verifyPushRequestProof("send", targetDeviceId, proof, false);
    if (!proofCheck.valid) {
      return NextResponse.json({ error: proofCheck.reason || "Unauthorized" }, { status: 401 });
    }

    const safeCallerName =
      typeof callerName === "string" && callerName.trim().length > 0
        ? callerName.trim().slice(0, 64)
        : "Partner";

    const safeExpiresAt =
      typeof expiresAt === "number" && expiresAt > Date.now() && expiresAt <= Date.now() + 120_000
        ? expiresAt
        : Date.now() + 45_000;

    const payload: IncomingCallPushPayload = {
      type: "incoming-call",
      callId,
      callType,
      callerName: safeCallerName,
      expiresAt: safeExpiresAt,
    };

    const result = await sendIncomingCallPushNotification(targetDeviceId, payload);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 200 });
    }

    return NextResponse.json({ success: true, message: "Incoming call push dispatched successfully" });
  } catch {
    return NextResponse.json({ error: "Failed to dispatch call push notification" }, { status: 500 });
  }
}
