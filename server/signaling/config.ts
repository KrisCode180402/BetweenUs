export const SIGNALING_CONFIG = {
  PROTOCOL_VERSION: 1 as const,
  DEFAULT_PORT: parseInt(process.env.SIGNALING_PORT || "8080", 10),
  MAX_PAYLOAD_BYTES: 32 * 1024, // 32 KB maximum payload size
  MAX_PARTICIPANTS_PER_SESSION: 2, // Strict 1-to-1 pair requirement
  IDLE_SESSION_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes idle timeout
  AUTH_TIMESTAMP_MAX_SKEW_MS: 60 * 1000, // 60 seconds maximum clock skew
  HEARTBEAT_INTERVAL_MS: 30 * 1000, // 30 seconds ping interval
  RATE_LIMITS: {
    MAX_CONNECTIONS_PER_MIN_PER_IP: 10,
    MAX_MESSAGES_PER_MIN_PER_SOCKET: 30,
    MAX_FAILED_ATTEMPTS_PER_IP: 5,
    LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes lockout
  },
  ALLOWED_ORIGINS: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://between-us.local",
  ],
};
