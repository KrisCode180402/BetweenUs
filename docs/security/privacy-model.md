# Privacy Model — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 03 — Privacy & Data Classification  
**Status**: Approved Specification (Cross-Referenced to [`docs/privacy/`](../privacy/))  

---

## 1. Core Privacy Principles

The privacy model of **Between Us** is built upon eight fundamental architectural principles:

1. **Data Minimization**: Collect, transmit, and process only data technically required for 1-to-1 WebRTC calling.
2. **Purpose Limitation**: Every data item has a documented technical purpose in [`docs/privacy/data-inventory.md`](../privacy/data-inventory.md).
3. **Ephemeral Sessions**: Transient call parameters exist only during active connection setup and are purged upon call termination.
4. **Zero Application-Level Content Storage**: Audio and video streams are never written to disk, local storage, cloud services, or server databases.
5. **Absolute Prohibition of Analytics & Telemetry**: Zero third-party or first-party analytics, crash reporting SDKs, or behavioral trackers.
6. **No Advertising Infrastructure**: Zero ad networks, tracking pixels, or monetization scripts.
7. **Minimal Third-Party Dependencies**: Strict minimal dependency policy relying primarily on native W3C Web APIs.
8. **Minimal Infrastructure Trust**: Servers coordinate connectivity but are structurally isolated from accessing or decrypting call content.

---

## 2. Zero-Retention Layered Analysis

For the authoritative multi-layer zero retention specification, see [`docs/privacy/zero-retention-definition.md`](../privacy/zero-retention-definition.md).

```
+-------------------------------------------------------------------+
| LAYER 1: APPLICATION-CONTROLLED RETENTION                         |
| (Strictly Zero Storage: Ephemeral RAM state destroyed on hangup)  |
+-------------------------------------------------------------------+
                                  │
                                  ▼
+-------------------------------------------------------------------+
| LAYER 2: NETWORK / INFRASTRUCTURE METADATA                        |
| (Transient network logs, IP headers, packet volume at edge/VPS)   |
+-------------------------------------------------------------------+
                                  │
                                  ▼
+-------------------------------------------------------------------+
| LAYER 3: DEVICE / OPERATING SYSTEM BEHAVIOR                       |
| (Host OS hardware buffers, browser process RAM, permissions state)  |
+-------------------------------------------------------------------+
```

---

## 3. Authoritative Privacy Documentation Suite

Detailed privacy policies and specifications are maintained in dedicated documents under [`docs/privacy/`](../privacy/):
- **Data Inventory**: [`docs/privacy/data-inventory.md`](../privacy/data-inventory.md)
- **Data Classification**: [`docs/privacy/data-classification.md`](../privacy/data-classification.md)
- **Data Lifecycle**: [`docs/privacy/data-lifecycle.md`](../privacy/data-lifecycle.md)
- **Retention Policy**: [`docs/privacy/retention-policy.md`](../privacy/retention-policy.md)
- **Deletion Policy**: [`docs/privacy/deletion-policy.md`](../privacy/deletion-policy.md)
- **Storage Policy**: [`docs/privacy/storage-policy.md`](../privacy/storage-policy.md)
- **Cache Policy**: [`docs/privacy/cache-policy.md`](../privacy/cache-policy.md)
- **Logging Policy**: [`docs/privacy/logging-data-policy.md`](../privacy/logging-data-policy.md)
- **Backup Policy**: [`docs/privacy/backup-policy.md`](../privacy/backup-policy.md)
- **Third-Party Data Flows**: [`docs/privacy/third-party-data-flows.md`](../privacy/third-party-data-flows.md)
- **Zero Retention Definition**: [`docs/privacy/zero-retention-definition.md`](../privacy/zero-retention-definition.md)
- **Privacy Invariants**: [`docs/privacy/privacy-invariants.md`](../privacy/privacy-invariants.md)
- **Privacy Risk Register**: [`docs/privacy/privacy-risk-register.md`](../privacy/privacy-risk-register.md)
- **Future Phase Mapping**: [`docs/privacy/future-phase-privacy-requirements.md`](../privacy/future-phase-privacy-requirements.md)
