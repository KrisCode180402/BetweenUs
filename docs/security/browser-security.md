# Browser Security & Hardening Specification — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 05 — Browser Security  
**Status**: Authoritative Security Specification  

---

## 1. Executive Summary

This document establishes the browser hardening rules, Content Security Policy (CSP), HTTP security response headers, Permissions Policy, and cross-origin security controls for **Between Us**. 

Because browser-based applications operate in a shared runtime context exposed to cross-site scripting (XSS), framing attacks, MIME sniffing, and browser extension interference, the browser origin is treated as a major security boundary.

---

## 2. Security Header Policy Matrix

Every HTTP response served by Vercel Serverless Origins and Cloudflare Edge must specify explicit security headers:

| Security Header | Configured Value / Strategy | Threat Mitigated | Architectural Tradeoff |
| :--- | :--- | :--- | :--- |
| **`Content-Security-Policy`** | `default-src 'none'; script-src 'self' ...` | XSS, Script Injection, Malicious Data Exfiltration | Restricts external scripts & inline execution |
| **`Strict-Transport-Security`** | `max-age=63072000; includeSubDomains; preload` | Transport Downgrade, Man-in-the-Middle (MITM) | Requires permanent HTTPS availability |
| **`X-Frame-Options`** | `DENY` | Clickjacking, UI Redress Attacks | Prevents embedding application in iframes |
| **`X-Content-Type-Options`** | `nosniff` | MIME Sniffing, Drive-by Executable Execution | Enforces strict MIME header parsing |
| **`Referrer-Policy`** | `no-referrer` | Referrer URL Leakage, Metadata Tracking | Strips HTTP `Referer` headers on all requests |
| **`Permissions-Policy`** | `camera=(self), microphone=(self), ...` | Unauthorized Device Capture, API Abuse | Restricts device APIs to canonical origin |
| **`Cross-Origin-Opener-Policy`** | `same-origin` | Cross-Origin Process Inspection | Isolates top-level browsing context |
| **`Cross-Origin-Resource-Policy`** | `same-origin` | Cross-Origin Data Leakage (Spectre) | Disallows external origin asset fetching |

---

## 3. Strict Content Security Policy (CSP)

The Content Security Policy operates under a strict **DEFAULT DENY** posture. No wildcard (`*`) connections, unsafe inline scripts (`'unsafe-inline'`), or eval statements (`'unsafe-eval'`) are permitted in production:

```http
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self' wss://signaling.betweenus.app https://turn.betweenus.app; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'; upgrade-insecure-requests;
```

### Directives Breakdown:
* `default-src 'none'`: Blocks all resource loading by default.
* `script-src 'self'`: Restricts script execution strictly to local same-origin JS bundles.
* `style-src 'self' 'unsafe-inline'`: Allows local CSS files and Tailwind CSS style tags.
* `img-src 'self' data:`: Restricts images to local assets and inline SVG data URIs.
* `media-src 'self' blob:`: Allows playback of local media streams (`blob:` URIs).
* `connect-src 'self' wss://signaling.betweenus.app https://turn.betweenus.app`: Strictly restricts network fetches, WebSockets, and WebRTC candidate connections to authorized endpoints only.
* `frame-ancestors 'none'`: Forbids framing the application in `<iframe>` or `<object>` tags.
* `base-uri 'self'`: Prevents `<base>` tag injection attacks.
* `form-action 'none'`: Disallows HTML form submissions.
* `upgrade-insecure-requests`: Automatically upgrades HTTP requests to HTTPS.

---

## 4. CSP Reporting Privacy Analysis

```
+-----------------------------------------------------------------------------------+
| PRIVACY ANALYSIS: THIRD-PARTY CSP REPORTING IS DISABLED                           |
|                                                                                   |
| Traditional web apps transmit CSP violation reports (containing client IPs,        |
| User-Agents, and visited URLs) to third-party services (e.g. Sentry, Report-URI). |
|                                                                                   |
| Between Us explicitly DISABLES third-party CSP report endpoints because telemetry  |
| transmission violates Phase 03 privacy invariants.                                |
+-----------------------------------------------------------------------------------+
```

---

## 5. Frame Protection & Clickjacking Defense

* **`X-Frame-Options: DENY`**: Legacy browser instruction to block framing.
* **`Content-Security-Policy: frame-ancestors 'none'`**: Modern CSP instruction forbidding framing.
* **Result**: The application cannot be framed by any external website, completely mitigating clickjacking and UI redress attacks.

---

## 6. MIME Sniffing Protection

* **`X-Content-Type-Options: nosniff`**: Forces browsers to strictly adhere to the `Content-Type` header declared by the server, preventing browsers from executing user-uploaded files or corrupted assets as JavaScript or HTML.

---

## 7. Referrer Policy

* **`Referrer-Policy: no-referrer`**: Prevents the browser from sending any `Referer` header when navigating or requesting resources. Outgoing HTTP requests leak zero path or query parameters.

---

## 8. Restrictive Permissions Policy

```http
Permissions-Policy: camera=(self), microphone=(self), geolocation=(), display-capture=(), payment=(), usb=(), bluetooth=(), serial=(), accelerometer=(), gyroscope=(), magnetometer=(), ambient-light-sensor=(), midi=(), clipboard-read=()
```

* `camera=(self)` & `microphone=(self)`: Limits camera and microphone capabilities strictly to top-level same-origin frames.
* `geolocation=()`, `display-capture=()`, `payment=()`: Disables all non-essential browser capabilities.

---

## 9. Camera & Microphone Privacy Prerequisites (Phase 13/14 Gate)

Before audio (Phase 13) or video (Phase 14) calling can be implemented, the following security prerequisites must be met:
1. `getUserMedia()` must NEVER be invoked upon initial page load or application startup.
2. Media permissions must be requested ONLY when the user explicitly clicks "Voice Call" or "Video Call".
3. Local camera and microphone hardware tracks MUST be explicitly stopped (`MediaStreamTrack.stop()`) upon call termination, turning off physical LED hardware indicators.
4. Permission rejection must fail closed gracefully without crashing or exposing raw stack traces.

---

## 10. HTTPS & HSTS Strategy

* **Production Requirement**: HTTPS (TLS 1.3) is mandatory across all deployment endpoints (`betweenus.app`, `signaling.betweenus.app`, `turn.betweenus.app`).
* **HSTS Configuration**:
  ```http
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  ```
* **Development Distinction**: Local development operates on `http://localhost:3000`. HSTS headers are omitted in development mode to prevent local browser caching issues.

---

## 11. Secure Cookie Policy (Zero Cookies Required)

* **Current Architecture**: **Between Us** uses ZERO cookies (`Set-Cookie` header is disabled).
* **Future Cookie Rule**: If session cookies are ever introduced in future phases, they must strictly specify: `Set-Cookie: name=value; Secure; HttpOnly; SameSite=Strict; Path=/`.

---

## 12. Storage Security Rules

* **IndexedDB Isolation**: Limited strictly to non-extractable identity keys (`extractable: false`) and paired partner public keys.
* **LocalStorage Prohibition**: Private keys, SDP parameters, tokens, and candidate arrays MUST NOT be stored in `localStorage` or `sessionStorage`.

---

## 13. Service Worker Security Scope

* **App Shell Scope**: PWA Service Worker caching (Phase 07) is restricted to static bundle assets (`index.html`, `main.css`, `app.js`).
* **Dynamic Network Bypass**: All dynamic API calls, WebSocket handshakes, and WebRTC media streams must bypass Service Worker caching.

---

## 14. Third-Party Resource Prohibition

* **No External CDNs**: All scripts, styles, and static assets must be served from the application's own origin.
* **No External Fonts / Tracking**: External Google Fonts, analytics scripts, or tracking pixels are strictly forbidden.

---

## 15. Origin & Cross-Origin Policies

* **`Cross-Origin-Opener-Policy: same-origin`**: Isolates the top-level browsing context from cross-origin popup windows.
* **`Cross-Origin-Resource-Policy: same-origin`**: Prevents external origins from reading static resources.

---

## 16. Development vs. Production Differences

| Security Control | Local Development (`localhost`) | Production (`betweenus.app`) |
| :--- | :--- | :--- |
| **Transport** | HTTP / WS | Mandatory HTTPS / WSS (TLS 1.3) |
| **HSTS Header** | Omitted | `max-age=63072000; includeSubDomains; preload` |
| **CSP `script-src`** | `script-src 'self' 'unsafe-eval'` (Next.js HMR) | `script-src 'self'` (Strict execution) |
| **WAF Edge** | None | Cloudflare WAF + DDoS Mitigation |

---

## 17. Future WebRTC & Signaling Network Implications

* **WebSocket Signaling**: CSP `connect-src` must authorize `wss://signaling.betweenus.app`.
* **coturn Relay**: CSP `connect-src` must authorize `https://turn.betweenus.app` and `wss://turn.betweenus.app`.
* **STUN IP Discovery**: WebRTC native ICE engine operates below HTTP layer via browser UDP sockets; local candidate gathering respects mDNS privacy rules.
