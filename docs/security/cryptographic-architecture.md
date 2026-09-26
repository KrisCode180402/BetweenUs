# Cryptographic Architecture & Trust Model

## Overview
This document defines the cryptographic architecture, key lifecycle models, data flow sequences, and multi-party trust boundaries for the **Between Us** privacy-first 1-to-1 WebRTC audio/video calling application.

---

## 1. Cryptographic Architecture Diagram

```text
               DEVICE A                                             DEVICE B
  ┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
  │ ECDSA P-256 Keypair (IndexedDB) │                 │ ECDSA P-256 Keypair (IndexedDB) │
  │ extractable: false              │                 │ extractable: false              │
  └────────────────┬────────────────┘                 └────────────────┬────────────────┘
                   │                                                   │
                   ▼                                                   ▼
  ┌─────────────────────────────────┐  Out-of-band    ┌─────────────────────────────────┐
  │     1. SECURE PAIRING (SAS)     │ ◄─────────────► │     1. SECURE PAIRING (SAS)     │
  │ Fingerprint Verification & Pin  │  Visual Check   │ Fingerprint Verification & Pin  │
  └────────────────┬────────────────┘                 └────────────────┬────────────────┘
                   │                                                   │
                   ▼                                                   ▼
  ┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
  │   2. SIGNALING (Signed Auth)    │ ◄─────────────► │   2. SIGNALING (Signed Auth)    │
  │ Ephemeral SDP & ICE Negotiation │   WebSocket     │ Ephemeral SDP & ICE Negotiation │
  └────────────────┬────────────────┘   Signaling     └────────────────┬────────────────┘
                   │                      Server                       │
                   │               (Zero Media Access)                 │
                   │                                                   │
                   ▼                                                   ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │              3. WebRTC DTLS 1.2/1.3 + SRTP (AES-GCM)                │
  │        Direct P2P Encrypted Audio / Video (COTURN Relay Fallback)   │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Cryptographic Key Lifecycle Model

```text
┌──────────┐     ┌───────────┐     ┌──────────┐     ┌────────────────┐     ┌──────────┐     ┌─────────┐
│ GENERATE │ ──► │ STORE/USE │ ──► │  VERIFY  │ ──► │ ROTATE/REPLACE │ ──► │  REVOKE  │ ──► │ CLEANUP │
└──────────┘     └───────────┘     └──────────┘     └────────────────┘     └──────────┘     └─────────┘
```

1. **GENERATE**: ECDSA P-256 keypair generated locally using Web Crypto API (`crypto.subtle.generateKey`) with `extractable = false`.
2. **STORE/USE**: Private key stored via WebIDL structured clone in `between-us-identity` IndexedDB store. Public key SPKI Base64 encoded for pairing exchange.
3. **VERIFY**: Out-of-band Short Authentication String (SAS) fingerprint derived via `HKDF-SHA256` and visually verified by users.
4. **ROTATE/REPLACE**: On device replacement or explicit `destroyDeviceIdentity()`, identity key is purged and re-generated.
5. **REVOKE**: Partner un-pairing (`removePartner()`) purges pinned partner public identity key and safety records.
6. **CLEANUP**: Call session teardown closes `RTCPeerConnection`, stops media tracks, wipes ephemeral nonces, and resets state machine to `IDLE`.

---

## 3. Multi-Party Trust Boundary Matrix

| System Entity / Actor | Can See Media Streams? | Can See Private Keys? | Can See Signaling Metadata? | Can Inject / Modify Signaling? | Can Decrypt Calls? | Notes / Mitigations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **User A Device** | **YES** (Local mic/cam) | **YES** (Own key only) | **YES** | Local control | **YES** (Endpoint) | End-to-end endpoint |
| **User B Device** | **YES** (Decrypted stream) | **YES** (Own key only) | **YES** | Local control | **YES** (Endpoint) | End-to-end endpoint |
| **Node.js Signaling Server** | **NO** | **NO** | **YES** (Session IDs, IP sockets) | **NO** (Blocked by signatures) | **NO** | Relays signed SDP/ICE; zero media access |
| **COTURN Relay Server** | **NO** (SRTP ciphertext) | **NO** | **YES** (IP addresses, byte counts) | **NO** (Blocked by SRTP auth) | **NO** | Relays SRTP packets; cannot decrypt media |
| **Vercel / Cloudflare CDN** | **NO** | **NO** | **YES** (TLS transport headers) | **NO** (Blocked by SRI & CSP) | **NO** | Static asset host & TLS edge transport |
| **ISP / Passive Observer** | **NO** (SRTP ciphertext) | **NO** | **YES** (IP headers, packet sizes) | **NO** (Blocked by DTLS integrity) | **NO** | Network transport layer observer |
| **Malicious Signaling Server** | **NO** | **NO** | **YES** | Attempted MITM key swap | **NO** (Detected by SAS verification) | SAS out-of-band check defeats identity substitution |
