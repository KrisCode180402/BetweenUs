# Local State Privacy & Data Inventory

## Overview
This document specifies the exact inventory of local fields, their classification, necessity, retention, and deletion methods for **Between Us**.

---

## 1. Local State Inventory Matrix

| Field | Purpose | Sensitivity | Persistence Required? | Storage Location | Retention | Deletion Method |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `schema_version` | Database schema versioning | Low | Yes | IndexedDB (`app_state`) | Permanent (App Lifecycle) | `clearApplicationState()` |
| `ui_theme` | Presentation theme selection | Low | Yes | IndexedDB (`app_state`) | Until Reset | `clearApplicationState()` / `removeItem()` |
| `device_identity` | Device cryptographic identity (ECDSA P-256) | **HIGH (Private Key Local Only)** | Yes | Dedicated IndexedDB (`between-us-identity`) | Until Explicit Destruction | `destroyDeviceIdentity()` |
| `partner_trust` | Paired partner public identity trust record | High (Public Identity Only) | Yes | Dedicated IndexedDB (`between-us-identity`) | Until Unpaired | `removePairedPartnerDevice()` |
| `partner_verification` | Safety verification & identity pinning record | Medium (Verification Status & Pinned Fingerprint) | Yes | Dedicated IndexedDB (`between-us-identity`) | Until Reset / Unpaired | `removePartnerVerification()` / `resetVerification()` |
| `active_call` | Active call state | Ephemeral | **NO** | Volatile RAM Only | Call Duration Only | Tab Close / Reload |
| `media_streams` | Camera / Mic MediaStream | Ephemeral | **NO** | Volatile RAM Only | Call Duration Only | `MediaStreamTrack.stop()` |
| `sdp_handshake` | WebRTC SDP offer/answer | Ephemeral | **NO** | Volatile RAM Only | Session Handshake Only | Instant Disposal |
| `ice_candidates` | WebRTC ICE network candidates | Ephemeral | **NO** | Volatile RAM Only | Connection Setup Only | Instant Disposal |

---

## 2. Retention & Deletion Principles
- **No Residual Artifacts:** When a call completes or is disconnected, all memory structures referencing the call session are released to garbage collection immediately.
- **Explicit Reset:** Users can purge all application-local persistent state at any time via `clearApplicationState()`.
- **Zero Cloud Storage:** All local inventory fields exist client-side only; no data is synced, transmitted, or backed up to cloud servers.
