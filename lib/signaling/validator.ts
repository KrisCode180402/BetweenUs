import {
  SignalingEnvelope,
  SignalingMessageType,
} from "../../server/signaling/types";
import { SIGNALING_CONFIG } from "../../server/signaling/config";

export class ClientSignalingValidationError extends Error {
  constructor(message: string) {
    super(`ClientSignalingValidationError: ${message}`);
    this.name = "ClientSignalingValidationError";
  }
}

/**
 * Validates incoming WebSocket string into a verified SignalingEnvelope on client side.
 */
export function validateIncomingClientEnvelope(raw: string): SignalingEnvelope {
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ClientSignalingValidationError("Invalid JSON received from signaling server.");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new ClientSignalingValidationError("Incoming message must be a JSON object.");
  }

  if (parsed.version !== SIGNALING_CONFIG.PROTOCOL_VERSION) {
    throw new ClientSignalingValidationError(
      `Unsupported protocol version ${parsed.version}.`
    );
  }

  if (!parsed.type || !Object.values(SignalingMessageType).includes(parsed.type)) {
    throw new ClientSignalingValidationError(`Unsupported signaling type: ${parsed.type}`);
  }

  if (!parsed.payload || typeof parsed.payload !== "object") {
    throw new ClientSignalingValidationError("Missing payload object in signaling envelope.");
  }

  return parsed as SignalingEnvelope;
}
