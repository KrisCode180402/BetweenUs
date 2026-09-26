import {
  SignalingEnvelope,
  SignalingMessageType,
  SessionJoinPayload,
  SdpPayload,
  IceCandidatePayload,
} from "./types";
import { SIGNALING_CONFIG } from "./config";

export class SignalingValidationError extends Error {
  constructor(message: string) {
    super(`SignalingValidationError: ${message}`);
    this.name = "SignalingValidationError";
  }
}

/**
 * Ensures payload does not exceed maximum byte limit.
 */
export function validateMessageSize(raw: string | Uint8Array): void {
  const byteLength = typeof raw === "string" ? Buffer.byteLength(raw, "utf8") : raw.length;
  if (byteLength > SIGNALING_CONFIG.MAX_PAYLOAD_BYTES) {
    throw new SignalingValidationError(
      `Message size ${byteLength} bytes exceeds maximum limit of ${SIGNALING_CONFIG.MAX_PAYLOAD_BYTES} bytes.`
    );
  }
}

/**
 * Protects against prototype pollution keys.
 */
function checkPrototypePollutionKeys(obj: any): void {
  if (typeof obj !== "object" || obj === null) return;
  const forbidden = ["__proto__", "constructor", "prototype"];
  for (const key of Object.keys(obj)) {
    if (forbidden.includes(key)) {
      throw new SignalingValidationError(`Forbidden object property '${key}' detected.`);
    }
    if (typeof obj[key] === "object" && obj[key] !== null) {
      checkPrototypePollutionKeys(obj[key]);
    }
  }
}

/**
 * Validates raw string JSON into a structured SignalingEnvelope.
 */
export function parseAndValidateEnvelope(raw: string): SignalingEnvelope {
  validateMessageSize(raw);

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new SignalingValidationError("Malformed JSON payload format.");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new SignalingValidationError("Signaling payload must be a JSON object.");
  }

  checkPrototypePollutionKeys(parsed);

  if (parsed.version !== SIGNALING_CONFIG.PROTOCOL_VERSION) {
    throw new SignalingValidationError(
      `Unsupported protocol version ${parsed.version}. Expected ${SIGNALING_CONFIG.PROTOCOL_VERSION}.`
    );
  }

  if (!parsed.type || !Object.values(SignalingMessageType).includes(parsed.type)) {
    throw new SignalingValidationError(`Invalid or unsupported signaling message type: ${parsed.type}`);
  }

  if (!parsed.sessionId || typeof parsed.sessionId !== "string" || parsed.sessionId.length < 8) {
    throw new SignalingValidationError("Invalid or missing sessionId.");
  }

  if (!parsed.sender || typeof parsed.sender !== "string" || parsed.sender.length < 16) {
    throw new SignalingValidationError("Invalid or missing sender fingerprint.");
  }

  if (!parsed.payload || typeof parsed.payload !== "object") {
    throw new SignalingValidationError("Signaling envelope missing payload object.");
  }

  return parsed as SignalingEnvelope;
}

/**
 * Validates SESSION_JOIN payload structure.
 */
export function validateSessionJoinPayload(payload: any): SessionJoinPayload {
  if (!payload || typeof payload !== "object") {
    throw new SignalingValidationError("Invalid SESSION_JOIN payload.");
  }

  const { publicIdentity, nonce, timestamp, signature } = payload;

  if (
    !publicIdentity ||
    publicIdentity.algorithm !== "ECDSA-P256" ||
    typeof publicIdentity.spkiHex !== "string" ||
    typeof publicIdentity.fingerprint !== "string"
  ) {
    throw new SignalingValidationError("Invalid publicIdentity in SESSION_JOIN payload.");
  }

  if (!nonce || typeof nonce !== "string" || nonce.length < 16) {
    throw new SignalingValidationError("Invalid nonce in SESSION_JOIN payload.");
  }

  if (!timestamp || typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
    throw new SignalingValidationError("Invalid timestamp in SESSION_JOIN payload.");
  }

  if (!signature || typeof signature !== "string" || signature.length < 32) {
    throw new SignalingValidationError("Invalid signature in SESSION_JOIN payload.");
  }

  return { publicIdentity, nonce, timestamp, signature };
}

/**
 * Validates SDP offer/answer payload structure.
 */
export function validateSdpPayload(payload: any): SdpPayload {
  if (!payload || typeof payload !== "object") {
    throw new SignalingValidationError("Invalid SDP payload.");
  }

  const { type, sdp } = payload;
  if (type !== "offer" && type !== "answer") {
    throw new SignalingValidationError(`Invalid SDP type: ${type}`);
  }

  if (!sdp || typeof sdp !== "string" || sdp.trim().length === 0) {
    throw new SignalingValidationError("Invalid or empty SDP content.");
  }

  return { type, sdp };
}

/**
 * Validates ICE candidate payload structure.
 */
export function validateIceCandidatePayload(payload: any): IceCandidatePayload {
  if (!payload || typeof payload !== "object") {
    throw new SignalingValidationError("Invalid ICE candidate payload.");
  }

  const { candidate, sdpMid, sdpMLineIndex } = payload;

  if (!candidate || typeof candidate !== "string" || candidate.trim().length === 0) {
    throw new SignalingValidationError("Invalid or empty ICE candidate string.");
  }

  if (sdpMid !== null && typeof sdpMid !== "string") {
    throw new SignalingValidationError("Invalid sdpMid in ICE candidate payload.");
  }

  if (sdpMLineIndex !== null && typeof sdpMLineIndex !== "number") {
    throw new SignalingValidationError("Invalid sdpMLineIndex in ICE candidate payload.");
  }

  return { candidate, sdpMid: sdpMid ?? null, sdpMLineIndex: sdpMLineIndex ?? null };
}
