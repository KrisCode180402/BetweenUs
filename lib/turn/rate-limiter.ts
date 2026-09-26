export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

export class TurnCredentialRateLimiter {
  private requests = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(options: RateLimiterOptions = { windowMs: 300000, maxRequests: 10 }) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  /**
   * Evaluates rate limit for a client key (device fingerprint or IP address).
   * Returns true if allowed, false if rate limit exceeded.
   */
  public isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const timestamps = this.requests.get(key) || [];
    // Retain only requests within current window
    const validTimestamps = timestamps.filter((t) => t > windowStart);

    if (validTimestamps.length >= this.maxRequests) {
      this.requests.set(key, validTimestamps);
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }

  /**
   * Resets recorded rate limit history for testing or administrative reset.
   */
  public reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

export const defaultTurnRateLimiter = new TurnCredentialRateLimiter();
