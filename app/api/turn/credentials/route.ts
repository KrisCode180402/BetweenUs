import { NextRequest, NextResponse } from "next/server";
import { generateTurnCredentials, TurnCredentialResponse } from "../../../../lib/turn/credentials";
import { defaultTurnRateLimiter } from "../../../../lib/turn/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const deviceFingerprint =
      body.deviceFingerprint ||
      req.headers.get("x-device-fingerprint") ||
      req.headers.get("x-forwarded-for") ||
      "anonymous";

    // 1. Enforce Rate Limiting
    if (!defaultTurnRateLimiter.isAllowed(deviceFingerprint)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before requesting new TURN credentials." },
        { status: 429 }
      );
    }

    // 2. Load Server-Only Environment Configuration
    const secret = process.env.TURN_SHARED_SECRET;
    const host = process.env.TURN_HOST || process.env.NEXT_PUBLIC_TURN_HOST || "turn.betweenus.app";
    const port = parseInt(process.env.TURN_PORT || "3478", 10);
    const tlsPort = process.env.TURN_TLS_PORT ? parseInt(process.env.TURN_TLS_PORT, 10) : 5349;
    const ttlSec = parseInt(process.env.TURN_CREDENTIAL_TTL_SEC || "600", 10);

    // If TURN_SHARED_SECRET is not configured in production, return STUN-only response safely
    if (!secret) {
      const defaultStunHost = process.env.NEXT_PUBLIC_STUN_SERVER_URL || "stun:stun.l.google.com:19302";
      const fallbackResponse: TurnCredentialResponse = {
        iceServers: [{ urls: [defaultStunHost] }],
        expiresAt: Date.now() + ttlSec * 1000,
        ttlSeconds: ttlSec,
      };
      return NextResponse.json(fallbackResponse, { status: 200 });
    }

    // 3. Generate Short-Lived REST Credentials
    const turnResponse = generateTurnCredentials({
      secret,
      host,
      port,
      tlsPort,
      ttlSec,
      userIdentity: deviceFingerprint,
    });

    return NextResponse.json(turnResponse, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Internal server error: ${err.message || "Failed to generate credentials"}` },
      { status: 500 }
    );
  }
}
