import crypto from "crypto";

export interface TurnServerConfig {
  urls: string[];
  username?: string;
  credential?: string;
}

export interface TurnCredentialResponse {
  iceServers: TurnServerConfig[];
  expiresAt: number;
  ttlSeconds: number;
}

export interface TurnCredentialOptions {
  secret: string;
  host: string;
  port?: number;
  tlsPort?: number;
  ttlSec?: number;
  userIdentity: string;
}

/**
 * Server-Side Short-Lived TURN REST Credential Generator (RFC 5389 / Coturn HMAC-SHA1).
 * The shared secret MUST NEVER be exposed to the browser/client.
 */
export function generateTurnCredentials(
  options: TurnCredentialOptions
): TurnCredentialResponse {
  const {
    secret,
    host,
    port = 3478,
    tlsPort = 5349,
    ttlSec = 600, // 10 minutes default TTL
    userIdentity,
  } = options;

  if (!secret) {
    throw new Error("TURN_SHARED_SECRET is required to generate TURN credentials.");
  }
  if (!host) {
    throw new Error("TURN_HOST is required to generate TURN credentials.");
  }
  if (!userIdentity) {
    throw new Error("userIdentity is required for authorization tracking.");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = nowSeconds + ttlSec;
  // Coturn REST authentication format: "expiration_timestamp:userIdentity"
  const username = `${expiresAt}:${userIdentity}`;

  // HMAC-SHA1 hash using the server-only shared secret
  const hmac = crypto.createHmac("sha1", secret);
  hmac.update(username);
  const credential = hmac.digest("base64");

  const iceServers: TurnServerConfig[] = [
    {
      urls: [`stun:${host}:${port}`],
    },
    {
      urls: [
        `turn:${host}:${port}?transport=udp`,
        `turn:${host}:${port}?transport=tcp`,
      ],
      username,
      credential,
    },
  ];

  if (tlsPort) {
    iceServers.push({
      urls: [`turns:${host}:${tlsPort}?transport=tcp`],
      username,
      credential,
    });
  }

  return {
    iceServers,
    expiresAt: expiresAt * 1000,
    ttlSeconds: ttlSec,
  };
}

/**
 * Client-side helper function to fetch short-lived TURN credentials from Next.js endpoint.
 * Falls back safely to default STUN configuration if TURN endpoint fails or is disabled.
 */
export async function fetchTurnCredentials(
  apiEndpoint = "/api/turn/credentials",
  deviceFingerprint?: string
): Promise<TurnServerConfig[]> {
  const defaultStunHost = process.env.NEXT_PUBLIC_STUN_SERVER_URL || "stun:stun.l.google.com:19302";
  const defaultIceServers: TurnServerConfig[] = [{ urls: [defaultStunHost] }];

  if (typeof window === "undefined") {
    return defaultIceServers;
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (deviceFingerprint) {
      headers["X-Device-Fingerprint"] = deviceFingerprint;
    }

    const res = await fetch(apiEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        deviceFingerprint: deviceFingerprint || "anonymous",
      }),
    });

    if (!res.ok) {
      return defaultIceServers;
    }

    const data: TurnCredentialResponse = await res.json();
    if (data && Array.isArray(data.iceServers) && data.iceServers.length > 0) {
      return data.iceServers;
    }

    return defaultIceServers;
  } catch (err) {
    // Safe fallback to STUN-only on network/API failure
    return defaultIceServers;
  }
}
