/**
 * STUN / TURN Configuration Module for Between Us WebRTC connections.
 * Provides global STUN & TURN server resolution for worldwide cross-border P2P connections.
 */

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export function getDefaultIceServers(): IceServerConfig[] {
  const customStunUrl =
    process.env.NEXT_PUBLIC_STUN_URL || process.env.NEXT_PUBLIC_STUN_SERVER_URL;
  const customTurnUrl =
    process.env.NEXT_PUBLIC_TURN_URL || process.env.NEXT_PUBLIC_TURN_SERVER_URL;

  const iceServers: IceServerConfig[] = [
    // Global STUN Servers for WAN NAT Traversal
    {
      urls: [
        customStunUrl || "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
        "stun:global.stun.twilio.com:3478",
        "stun:stun.cloudflare.com:3478",
        "stun:openrelay.metered.ca:80",
      ],
    },
  ];

  // Custom TURN Configuration from Environment
  if (customTurnUrl) {
    const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
    const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

    iceServers.push({
      urls: customTurnUrl,
      ...(turnUsername && turnCredential
        ? { username: turnUsername, credential: turnCredential }
        : {}),
    });
  }

  // Fallback Public Global TURN Relay (OpenRelay for worldwide CGNAT & Symmetric NAT fallback)
  iceServers.push({
    urls: [
      "turn:openrelay.metered.ca:80?transport=udp",
      "turn:openrelay.metered.ca:80?transport=tcp",
      "turn:openrelay.metered.ca:443?transport=tcp",
      "turns:openrelay.metered.ca:443?transport=tcp",
    ],
    username: "openrelay",
    credential: "openrelay",
  });

  return iceServers;
}

export function buildRtcConfiguration(customIceServers?: IceServerConfig[]): RTCConfiguration {
  return {
    iceServers: customIceServers || getDefaultIceServers(),
    iceTransportPolicy: "all",
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
  };
}
