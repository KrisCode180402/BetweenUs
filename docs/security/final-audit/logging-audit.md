# Logging Privacy & Error Sanitization Audit — Between Us

## 1. Audit Scope & Verification Method
Scanned entire codebase (`lib/`, `app/`, `server/`, `components/`) for all `console.log`, `console.debug`, `console.info`, `console.warn`, and `console.error` invocations.

## 2. Sensitive Data Exclusion Verification

| Category | Log Exclusion Status | Audit Findings | Status |
| :--- | :--- | :--- | :--- |
| **Audio/Video Media** | Excluded | 0 media streams, tracks, or frame buffers logged | `VERIFIED` |
| **WebRTC SDP Offers/Answers** | Excluded | Zero SDP payload strings printed in production logs | `VERIFIED` |
| **ICE Candidate Data** | Excluded | IP addresses and candidate details suppressed | `VERIFIED` |
| **Private Keys & Identity Secrets**| Excluded | Non-extractable private keys never serialized | `VERIFIED` |
| **Pairing Codes & NONCEs** | Excluded | Plaintext pairing codes excluded from log parameters | `VERIFIED` |
| **TURN Shared Secrets / Tokens** | Excluded | Credentials omitted from server and client logs | `VERIFIED` |

## 3. Error Sanitization Policy
- **Standardized Error Logger**: `lib/logging/logger.ts` formats sanitized state messages (`[BETWEEN_US INFO]`, `[BETWEEN_US ERROR]`) containing non-sensitive enum metadata only.
- **Client Error Messages**: Custom user-facing error UI displays generic messages without internal stack traces, filesystem paths, or token secrets.
