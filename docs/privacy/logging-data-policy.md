# Logging Data Policy & Scrubbing Rules — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 03 — Privacy & Data Classification  
**Status**: Authoritative Privacy Specification  

---

## 1. System Logging Classification Matrix

Logging across all operational environments (Client Console, Signaling VPS, coturn VPS, Vercel, Cloudflare) is strictly minimized to prevent accidental exposure of sensitive connection state or metadata.

```
+-----------------------------------------------------------------------------------+
| LOGGING CLASSIFICATION: MINIMAL OPERATIONAL METRICS ONLY                          |
|                                                                                   |
| ALLOWED: High-level operational events (e.g. "WebSocket connected", "Rate limit") |
| PROHIBITED: Private keys, SDP offers/answers, ICE candidates, pairing codes,     |
|             message payloads, client IP addresses, audio/video streams.          |
+-----------------------------------------------------------------------------------+
```

| Logging Environment | Logging Allowed? | Permitted Log Content | Strictly Prohibited Log Content | Retention Period |
| :--- | :---: | :--- | :--- | :--- |
| **Client Browser Console** | Debug Only | High-level UI state transitions (e.g. `[UI] State: CALL_CONNECTING`) | Raw key material, SDP text, candidate IPs, pairing codes, SAS strings | Ephemeral (Console session) |
| **Signaling Server Stdout**| **MINIMAL** | Anonymized events (e.g. `[INFO] Connection established`, `[WARN] Rate limit`) | JSON message payloads, public keys, SDP offers/answers, client IP addresses | Max 24 hours (Rolling logrotate) |
| **Coturn TURN VPS Logs** | **MINIMAL** | Daemon start/stop alerts, aggregated throughput totals | Packet contents, client IP addresses, STUN binding attributes | Max 24 hours (Rolling logrotate) |
| **Vercel Serverless Logs**| **MINIMAL** | Deployment build status, static HTTP GET response status codes | Dynamic request payloads, client IP addresses | Vendor default (Max 7 days) |
| **Cloudflare Edge Logs** | **MINIMAL** | Edge WAF threat scoring, total bandwidth metrics | Full URL query parameters, custom headers | Vendor default (Max 7 days) |

---

## 2. Mandatory Log Scrubbing Protocol

All server-side logging functions within the signaling daemon must pass output through an automated sanitizer filter prior to stdout output:

```typescript
// Architectural Protocol: Server Log Sanitizer
function sanitizeLogOutput(rawMessage: string): string {
  return rawMessage
    .replace(/\"sdp\":\s*\"[^\"]+\"/g, '"sdp": "[REDACTED_SDP]"')
    .replace(/\"pairingCode\":\s*\"[^\"]+\"/g, '"pairingCode": "[REDACTED_CODE]"')
    .replace(/\"publicKeySpki\":\s*\"[^\"]+\"/g, '"publicKeySpki": "[REDACTED_KEY]"')
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[REDACTED_IP]');
}
```
