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

/**
 * Client-side helper function to fetch short-lived TURN credentials from Next.js endpoint.
 * Isolated from server-only Node `crypto` imports to keep browser bundles lightweight.
 */
export async function fetchTurnCredentials(
  apiEndpoint = "/api/turn/credentials",
  deviceFingerprint?: string
): Promise<TurnServerConfig[]> {
  const defaultStunHost =
    process.env.NEXT_PUBLIC_STUN_SERVER_URL || "stun:stun.l.google.com:19302";
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
  } catch {
    return defaultIceServers;
  }
}
