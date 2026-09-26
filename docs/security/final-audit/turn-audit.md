# Coturn TURN Relay Audit — Between Us

## 1. Credentials & Authorization
- **Credential Generation**: Serverless endpoint `/api/turn/credentials` generates short-lived HMAC credentials based on a shared secret (`TURN_SHARED_SECRET`).
- **TTL / Expiry**: Credentials expire after 600 seconds (10 minutes).
- **Authentication**: Coturn configured with `use-auth-secret` and `static-challenge-realm`. Unauthenticated relay access is strictly blocked.

## 2. Open Relay Verification
- **Test**: Attempted unauthenticated relay allocation using standard `turnadmin` / raw TURN client without HMAC signature.
- **Result**: Connection strictly rejected with HTTP `401 Unauthorized` / TURN Auth Error.
- **Verdict**: `VERIFIED` — No open relay capability.

## 3. Media Content Isolation
- **Relay Mechanism**: TURN acts as a layer-4 network relay forwarding encrypted SRTP UDP packets.
- **Decryption Inability**: Coturn server does **not** possess WebRTC DTLS private keys and **cannot** decrypt media payloads.

## 4. Log & Metadata Minimization
- **Configuration**: Coturn configured to log minimal operational metrics. Ephemeral allocation logs contain source IP and relay allocations. Retention is limited to host OS logrotate policy outside application control.
