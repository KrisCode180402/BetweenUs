# Security Assumptions & Non-Goals — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 01 — Security Foundation & Threat Model  
**Status**: Approved Architectural Specification  

---

## 1. System & Trust Model Assumptions

### 1.1 Trusted Computing Base (TCB)
The system assumes that the following components are trusted and uncompromised:
1. **User Endpoint Operating System**: The underlying host OS (iOS, Android, macOS, Windows, Linux) is assumed to execute applications correctly without active kernel-level malware or memory tampering.
2. **Browser Engine Runtime**: The user's browser runtime (Chromium, WebKit, Gecko) correctly implements W3C web standards, including isolation of origins, non-extractable Web Crypto API keys, and Service Worker scope constraints.
3. **Local Hardware Integrity**: Camera and microphone hardware drivers correctly respond to browser `MediaDevices.getUserMedia()` lifecycle calls and do not stream hardware data out-of-band.

### 1.2 Untrusted Infrastructure Assumptions
The security architecture explicitly assumes that the following entities are **UNTRUSTED** or **SEMI-HONEST** (passive eavesdropping or malicious proxying):
1. **Signaling Server**: The VPS hosting the Node.js WebSocket signaling server may be compromised, operated by an untrusted party, or passively monitored.
2. **TURN Relay Server**: The VPS hosting the coturn server may be inspected or compromised.
3. **Network Transit Infrastructure**: All intermediary ISPs, routers, public Wi-Fi access points, and Internet Exchange Points (IXPs) are untrusted.
4. **Edge & Cloud Hosting Providers**: Cloudflare DNS/WAF edge servers and Vercel hosting infrastructure are assumed to be potential targets for third-party subversion or administrative inspection.

---

## 2. Explicit Non-Goals

To maintain technical defensibility and avoid impossible security promises, **Between Us** explicitly defines the following non-goals for Phase 01 and all future phases:

### 2.1 No Protection Against Host OS Malware
The application cannot protect against malware, keyloggers, screen scraping Trojans, or rootkits running on the host OS of either participant device. Endpoint compromise invalidates all application-level cryptographic protections.

### 2.2 No Technical Prevention of External Screen / Audio Recording
The system cannot prevent a participant (or an attacker with physical access to a participant's screen) from:
* Using OS-level screen capture software.
* Recording the physical device screen with an external analog camera.
* Recording audio output with an external microphone.

### 2.3 No Network-Level IP Anonymization Network (Tor-like Routing)
While WebRTC E2EE protects media payload confidentiality, direct WebRTC connections reveal peer IP addresses to each other. When forced through TURN relay mode, client IPs are hidden from the peer, but packet timing, sizing, and bandwidth usage remain visible to relay networks. The system does not attempt to construct a multi-hop onion routing network.

### 2.4 No Persistent Group Calling or Routing Engine
The platform is strictly bounded to 1-to-1 interactions between two pre-paired devices. Multi-party conferencing, Selective Forwarding Units (SFUs), and conference room routing engines are explicitly out of scope.

### 2.5 No Account Recovery or Escrow
Because private identity keys are non-extractable and stored strictly within local browser storage without server backup, clearing browser data or losing a device requires complete re-pairing. There is no account recovery, password reset, or key escrow service.

---

## 3. Boundary Limitations & Defensible Terminology

| Absolute / Invalid Claim | Technically Defensible Terminology |
| :--- | :--- |
| "Unbreakable Encryption" | **End-to-End Protected Media (DTLS-SRTP)** |
| "100% Secure System" | **Data-Minimized Architecture with Defense in Depth** |
| "Completely Anonymous" | **Relaying Options to Reduce IP Disclosure** |
| "Military-Grade Protection" | **Standard Web Crypto API & Reviewed Cryptographic Primitives** |
| "Impossible to Record Calls" | **Zero Application-Level Call Retention Policy** |
