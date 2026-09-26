# WebRTC Security & Cryptographic Transport V1 Specification

## Overview

This specification details the WebRTC security layer, transport encryption, and signaling trust boundary for **Between Us**.

---

## 1. WebRTC Encryption Architecture

WebRTC media streams are encrypted end-to-end between peer browser endpoints using mandatory standard security protocols:

- **Key Exchange**: DTLS 1.2 / 1.3 (Datagram Transport Layer Security) handshake over UDP.
- **Media Encryption**: SRTP (Secure Real-time Transport Protocol) utilizing `AES-128-GCM` or `AES-256-GCM` cipher suites.
- **Header Extensions**: Encrypted SRTP header extensions to prevent metadata leakage.

---

## 2. Signaling Trust Boundary & Defense

1. **Untrusted SDP Input**: Received SDP offers and answers are treated as untrusted input. Structural validation ensures proper envelope formatting before application.
2. **Untrusted ICE Candidates**: Incoming ICE candidates are validated and queued safely. Malformed candidates are rejected without crashing the client application.
3. **Identity Binding**: Before call setup, the client verifies that the signaling participant fingerprint matches the authenticated paired partner key (Phase 10). Calls from unverified or substituted participants are rejected.

---

## 3. Mandatory Security Properties & Disclaimers

- Standard WebRTC transport encryption ensures that network eavesdroppers (ISPs, Wi-Fi operators, signaling relay servers) cannot intercept or decrypt real-time audio media.
- **Important Distinction**: Application-level device pairing and WebRTC transport encryption provide secure P2P transport, but do not constitute a audited Signal-protocol messaging session.
