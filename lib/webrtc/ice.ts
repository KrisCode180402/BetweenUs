/**
 * STUN / TURN Configuration Module for Between Us WebRTC connections.
 * Provides central STUN/TURN server resolution without hardcoding values throughout components.
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
    {
      urls: [
        customStunUrl || "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
      ],
    },
  ];

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
