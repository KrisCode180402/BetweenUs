import { sanitizeMeta, sanitizeError } from "../../lib/privacy/logger";

/**
 * Sanitized Security Logger for Signaling Server.
 * STRICT PROHIBITION: Never log SDP text, ICE candidates, private keys, auth tokens, or payload content.
 */
export const SignalingLogger = {
  info(message: string, meta?: Record<string, any>): void {
    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction) return; // Suppress verbose info logs in production

    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(sanitizeMeta(meta))}` : "";
    // eslint-disable-next-line no-console
    console.log(`[SIGNALING INFO ${timestamp}] ${message}${metaStr}`);
  },

  warn(message: string, meta?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(sanitizeMeta(meta))}` : "";
    console.warn(`[SIGNALING WARN ${timestamp}] ${message}${metaStr}`);
  },

  error(message: string, err?: any, meta?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const errObj = err ? sanitizeError(err) : undefined;
    const combinedMeta = {
      ...(meta ? sanitizeMeta(meta) : {}),
      ...(errObj ? { errorDetails: errObj } : {}),
    };
    const metaStr = Object.keys(combinedMeta).length > 0 ? ` ${JSON.stringify(combinedMeta)}` : "";
    console.error(`[SIGNALING ERROR ${timestamp}] ${message}${metaStr}`);
  },
};
