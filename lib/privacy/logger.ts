/**
 * Between Us — Centralized Privacy-Safe Application Logger
 * Phase 18: Logging Privacy — Eliminate Sensitive Logging
 */

export const FORBIDDEN_LOG_KEYS = new Set([
  "sdp",
  "candidate",
  "payload",
  "signature",
  "token",
  "key",
  "privatekey",
  "secret",
  "credential",
  "username",
  "password",
  "authorization",
  "cookie",
  "pairingcode",
  "sasfingerprint",
  "turnsecret",
  "privkey",
]);

export interface SafeLogMeta {
  event?: string;
  component?: string;
  errorCode?: string;
  status?: string;
  [key: string]: any;
}

export function sanitizeMeta(meta: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  const forbiddenArray = Array.from(FORBIDDEN_LOG_KEYS);

  for (const [k, v] of Object.entries(meta)) {
    const lowerKey = k.toLowerCase();

    if (typeof v === "string") {
      // Check string content first for specific private key or SDP formatting
      if (v.includes("BEGIN PRIVATE KEY") || v.includes("BEGIN EC PRIVATE KEY")) {
        sanitized[k] = "[REDACTED_PRIVATE_KEY]";
      } else if (v.includes("v=0\r\no=") || v.includes("candidate:")) {
        sanitized[k] = "[REDACTED_SDP_OR_CANDIDATE]";
      } else if (forbiddenArray.some((forbidden) => lowerKey.includes(forbidden))) {
        sanitized[k] = "[REDACTED_FOR_PRIVACY]";
      } else {
        sanitized[k] = v;
      }
    } else if (forbiddenArray.some((forbidden) => lowerKey.includes(forbidden))) {
      sanitized[k] = "[REDACTED_FOR_PRIVACY]";
    } else if (typeof v === "object" && v !== null) {
      if (Array.isArray(v)) {
        sanitized[k] = v.map((item) =>
          typeof item === "object" && item !== null ? sanitizeMeta(item) : item
        );
      } else {
        sanitized[k] = sanitizeMeta(v);
      }
    } else {
      sanitized[k] = v;
    }
  }

  return sanitized;
}

export function sanitizeError(err: any): Record<string, any> {
  if (!err) return { message: "Unknown error" };

  if (typeof err === "string") {
    // Sanitize string if it contains sensitive URL query params or secrets
    const cleanMsg = err
      .replace(/secret=[^&]+/gi, "secret=[REDACTED]")
      .replace(/token=[^&]+/gi, "token=[REDACTED]");
    return { message: cleanMsg };
  }

  const name = err.name || "Error";
  let message = err.message || "An unexpected error occurred";

  // Sanitize message strings
  message = message
    .replace(/secret=[^&]+/gi, "secret=[REDACTED]")
    .replace(/token=[^&]+/gi, "token=[REDACTED]");

  const isProduction =
    typeof process !== "undefined" &&
    process.env &&
    (process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_APP_ENV === "production");

  const sanitized: Record<string, any> = {
    name,
    message,
    code: err.code || "APP_ERROR",
    // Omit stack trace in production to prevent internal path exposure
    ...(isProduction ? {} : { stack: err.stack }),
  };

  for (const [k, v] of Object.entries(err)) {
    if (k === "name" || k === "message" || k === "code" || k === "stack") continue;
    const sanitizedObj = sanitizeMeta({ [k]: v });
    sanitized[k] = sanitizedObj[k];
  }

  return sanitized;
}

export const AppLogger = {
  info(message: string, meta?: SafeLogMeta): void {
    const isProduction =
      typeof process !== "undefined" &&
      process.env &&
      (process.env.NODE_ENV === "production" ||
        process.env.NEXT_PUBLIC_APP_ENV === "production");

    // Suppress non-essential info logs in production
    if (isProduction) return;

    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(sanitizeMeta(meta))}` : "";
    // eslint-disable-next-line no-console
    console.log(`[BETWEEN_US INFO ${timestamp}] ${message}${metaStr}`);
  },

  warn(message: string, meta?: SafeLogMeta): void {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(sanitizeMeta(meta))}` : "";
    console.warn(`[BETWEEN_US WARN ${timestamp}] ${message}${metaStr}`);
  },

  error(message: string, err?: any, meta?: SafeLogMeta): void {
    const timestamp = new Date().toISOString();
    const errObj = err ? sanitizeError(err) : undefined;
    const combinedMeta = {
      ...(meta ? sanitizeMeta(meta) : {}),
      ...(errObj ? { errorDetails: errObj } : {}),
    };
    const metaStr = Object.keys(combinedMeta).length > 0 ? ` ${JSON.stringify(combinedMeta)}` : "";
    console.error(`[BETWEEN_US ERROR ${timestamp}] ${message}${metaStr}`);
  },

  debug(message: string, meta?: SafeLogMeta): void {
    const isProduction =
      typeof process !== "undefined" &&
      process.env &&
      (process.env.NODE_ENV === "production" ||
        process.env.NEXT_PUBLIC_APP_ENV === "production");

    // Debug logs are strictly disabled in production
    if (isProduction) return;

    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(sanitizeMeta(meta))}` : "";
    // eslint-disable-next-line no-console
    console.debug(`[BETWEEN_US DEBUG ${timestamp}] ${message}${metaStr}`);
  },
};
