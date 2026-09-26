export const PAIRING_PROTOCOL_VERSION = "BETWEEN_US_PAIRING_V1";

/**
 * Builds deterministic canonical string payload signed by Responder to authenticate Initiator's challenge.
 */
export function buildResponderPayload(
  sessionId: string,
  challengeA: string,
  initiatorFingerprint: string,
  responderFingerprint: string
): Uint8Array {
  const canonicalStr = `${PAIRING_PROTOCOL_VERSION}:RESP:${sessionId}:${challengeA}:${initiatorFingerprint}:${responderFingerprint}`;
  return new TextEncoder().encode(canonicalStr);
}

/**
 * Builds deterministic canonical string payload signed by Initiator to authenticate Responder's challenge.
 */
export function buildInitiatorPayload(
  sessionId: string,
  challengeB: string,
  initiatorFingerprint: string,
  responderFingerprint: string
): Uint8Array {
  const canonicalStr = `${PAIRING_PROTOCOL_VERSION}:CONF:${sessionId}:${challengeB}:${initiatorFingerprint}:${responderFingerprint}`;
  return new TextEncoder().encode(canonicalStr);
}
