# Ephemeral WebSocket Signaling Security Specification

## Executive Summary
This document specifies the privacy-first ephemeral WebSocket signaling subsystem for **Between Us**.

The signaling server acts strictly as a temporary coordination relay helping two paired devices exchange WebRTC negotiation payloads (SDP offers, SDP answers, and ICE network candidates).

---

## 1. Architectural Boundaries & Non-Goals

- **No Media Transmitted**: Audio, video, MediaStream tracks, files, blobs, or call recordings are **strictly forbidden** on signaling WebSockets.
- **No Persistence / No Database**: The signaling server contains **zero databases** (no SQL, NoSQL, Redis, S3, or disk logs). Ephemeral RAM state only.
- **No Call History**: No logs of call start times, call end times, durations, or participant lists.
- **Maximum 2 Participants**: Strictly 1-to-1 session isolation. Attempting to add a 3rd participant is immediately rejected.
- **Untrusted Server Model**: Client endpoints treat the signaling server as untrusted and validate every routed signaling envelope independently before processing.

---

## 2. Authentication & Authorization Protocol

- **Challenge Signature**: On connection, client sends `SESSION_JOIN` with nonce, UTC timestamp, public identity, and ECDSA P-256 digital signature over `BETWEEN_US_SIGNALING_V1:AUTH:<sessionId>:<nonce>:<timestamp>:<fingerprint>`.
- **Timestamp Freshness**: Max 60 seconds clock skew permitted.
- **Replay Protection**: Server tracks used nonces in memory and rejects replayed nonces.
- **Session Isolation**: Messages in Session A cannot reach Session B. Sender identity in socket connection must match envelope `sender` fingerprint.

---

## 3. Rate Limiting & Resource Protection

- **Payload Size Limit**: Maximum **32 KB** per WebSocket message.
- **Connection Rate Limit**: Maximum 10 connections per minute per IP.
- **Message Rate Limit**: Maximum 30 messages per minute per active socket.
- **Lockout**: 5 failed authentication/validation attempts trigger automatic 15-minute IP lockout.
- **Origin Validation**: Strict enforcement of `Origin` header matching configured application origins.
