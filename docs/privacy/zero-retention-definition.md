# Definitive "Zero Retention" Specification — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 03 — Privacy & Data Classification  
**Status**: Authoritative Privacy Specification  

---

## 1. Technical Scope of "Zero Retention"

In **Between Us**, the phrase "Zero Retention" is defined strictly and technically as:

```
+-----------------------------------------------------------------------------------+
| DEFINITION: ZERO APPLICATION-LEVEL CONTENT & SESSION RETENTION                    |
|                                                                                   |
| The software application contains ZERO code paths, storage buffers, databases,    |
| or log archives designed to retain live call audio, live call video, call         |
| history logs, call duration records, user relationship indexes, or media          |
| decryption secrets beyond active connection playback.                              |
+-----------------------------------------------------------------------------------+
```

---

## 2. Multi-Layer Retention Boundary Analysis

To eliminate dishonest or vague security claims, **Between Us** explicitly partitions retention capabilities across 8 technical layers:

```
+-----------------------------------------------------------------------------------+
| LAYER 1: APPLICATION-CONTROLLED STORAGE                                           |
| Status: ZERO RETENTION. Volatile RAM media objects purged immediately on hangup.  |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
| LAYER 2: SERVER TEMPORARY STATE                                                   |
| Status: EPHEMERAL RAM ONLY. Discarded immediately post-delivery or disconnect.    |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
| LAYER 3: APPLICATION SERVER LOGS                                                  |
| Status: MINIMIZED & SCRUBBED. Operational lifecycle events only (24h logrotate).  |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
| LAYER 4: NETWORK INFRASTRUCTURE METADATA                                          |
| Status: OUTSIDE APP CONTROL. Cloudflare/Vercel/ISP TCP IP headers & TLS SNI logs. |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
| LAYER 5: HOST OPERATING SYSTEM MEMORY & HARDWARE BUFFERS                          |
| Status: ENDPOINT BOUNDARY. OS hardware PCM audio/video render frame buffers.       |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
| LAYER 6: ISP / NETWORK PROVIDER CARRIER RECORDS                                   |
| Status: OUTSIDE APP CONTROL. Telecommunication carrier netflow packet logs.       |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
| LAYER 7: RECIPIENT SCREENSHOTS & ANALOG RECORDINGS                                |
| Status: PHYSICAL BOUNDARY. Partner software screen capture or external camera.    |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
| LAYER 8: COMPROMISED ENDPOINT FORENSICS                                           |
| Status: ENDPOINT BOUNDARY. Host malware or RAM forensic dumps on paired device.   |
+-----------------------------------------------------------------------------------+
```

---

## 3. Explicit Non-Claims & Boundaries

* **We DO NOT claim**: "No network metadata exists anywhere on the internet." Network routers and ISPs naturally record IP packet timing and volume.
* **We DO NOT claim**: "Calls are physically impossible to record by a recipient." A paired partner can always record their display with an external camera.
* **We DO claim**: The **Between Us** application software and server infrastructure will never intentionally capture, store, log, or exfiltrate call media or call history.
