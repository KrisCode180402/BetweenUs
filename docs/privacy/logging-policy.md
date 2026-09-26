# Production Logging Policy

## Overview
This policy governs application-level logging for the **Between Us** privacy-first 1-to-1 WebRTC calling application. It establishes mandatory rules for engineers and automated systems regarding what data may be logged, how logs must be sanitized, and how production environments must enforce logging controls.

---

## 1. Core Principles

1. **Zero-Retention for Call Content & Cryptographic Material**: Application logs MUST NEVER contain call media, SDP offers/answers, ICE candidates, private keys, pairing secrets, or authentication tokens.
2. **Sanitize at Source**: Redaction and sanitization MUST occur in memory BEFORE log output is written to `console`, `stdout`, or external log handlers.
3. **Minimize Production Verbosity**: In production (`NODE_ENV === 'production'`), non-essential `debug` and `info` logs MUST be automatically suppressed.
4. **Honest Boundary Acknowledgment**: Distinguish between application-controlled logging (which we strictly sanitize) and infrastructure transport logs (managed by hosts like Vercel, Cloudflare, Coturn host OS).

---

## 2. Prohibited Log Data (Level 5 Classification)

The following data categories are strictly **PROHIBITED** from application-controlled logging under any circumstances:

- Audio / Video Media Streams & Buffers
- WebRTC SDP Offers, Answers, & Session Descriptions
- WebRTC ICE Candidates (IP addresses, transport ports, candidate strings)
- Private Keys (Ed25519, ECDSA, RSA, AES secret keys)
- Pairing Secrets & Pre-Shared Keys
- TURN / STUN Credentials (HMAC passwords, shared secret keys)
- Authentication Tokens & Session Keys
- Safety Verification Secret Hashes & Raw Fingerprints
- User Identity Passphrases or Cookies

---

## 3. Allowed Log Data (Level 1-2 Classification)

Only non-sensitive operational metadata is permitted in application logs:

- System component lifecycle events (`"App initialized"`, `"Signaling server started"`)
- Coarse call state transitions (`"CALL_INITIATED"`, `"CALL_CONNECTED"`, `"CALL_ENDED"`)
- Sanitized error codes and error types (`"RTC_PEER_CONNECTION_FAILED"`)
- Redacted exception stack traces (stack strings scrubbed of file system secrets or tokens)

---

## 4. Enforcement Mechanism

- **Client Application**: All logging calls MUST route through `AppLogger` (`lib/privacy/logger.ts`). Direct calls to `console.log`, `console.warn`, or `console.error` in production code are forbidden by linting rules.
- **Signaling Server**: All logging calls MUST route through `SignalingLogger` (`server/signaling/logger.ts`).
- **Automated Testing**: Test suites in `tests/privacy/logging-privacy.test.ts` continuously verify that secret injection triggers redaction placeholders (`"[REDACTED_FOR_PRIVACY]"`, `"[REDACTED_SDP_OR_CANDIDATE]"`, `"[REDACTED_PRIVATE_KEY]"`).
