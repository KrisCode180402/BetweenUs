import crypto from "crypto";
import {
  fetchTurnCredentials,
  TurnCredentialResponse,
  TurnServerConfig,
} from "./client";

export { fetchTurnCredentials };
export type { TurnCredentialResponse, TurnServerConfig };

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
    ttlSec = 600,
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
  const username = `${expiresAt}:${userIdentity}`;

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
