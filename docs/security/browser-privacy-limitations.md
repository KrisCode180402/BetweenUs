# Browser Privacy Boundaries & Limitations — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 22 — Browser Limitation Analysis  
**Status**: Authoritative Reference Document  

---

## Technical Realities of Web Application Privacy

Web applications operate within browser sandboxes provided by the host platform (Chromium, WebKit, Gecko) and operating system (Android, iOS, Windows, macOS, Linux).

While Between Us enforces zero retention, ephemeral WebRTC communication, and application-level Privacy Mode, certain platform boundaries exist outside application execution control:

---

## Boundary Matrix

| Threat Vector / Limitation | System Boundary | Application Mitigation | Technical Reality & Boundary |
| :--- | :--- | :--- | :--- |
| **OS-Level Screenshots** | Operating System / Display Server | Sensitive UI minimization (`PrivacyOverlay`) | OS screenshot APIs capture frame buffers below JS sandbox. |
| **Screen Recording Software** | OS Graphics Stack / GPU Capture | Privacy Overlay on backgrounding | Native OS screen capture tools operate independently of browser JS. |
| **External Camera Capture** | Physical Environment | User discretion | Physical cameras pointing at displays cannot be controlled by software. |
| **Malicious Browser Extensions** | Browser Extension API | Content Security Policy (CSP) | Privileged extensions with `tabCapture` permissions bypass web sandboxes. |
| **Compromised Operating System** | Host OS Kernel / Malware | E2EE transport | OS-level keyloggers or memory dump tools read hardware frame buffers. |
| **Browser Media Cache & RAM** | V8 Engine / Garbage Collection | Purge JavaScript object references | RAM zeroing is scheduled asynchronously by engine GC controllers. |

---

## Approved Defensive Copy

When communicating security guarantees in documentation or UI copy:

- **DO SAY**: "Between Us does not intentionally record or store your call content."
- **DO SAY**: "Privacy Mode provides application-level privacy controls."
- **DO SAY**: "Your browser and operating system control certain system-level features."
- **DO NOT SAY**: "Nobody can screenshot this."
- **DO NOT SAY**: "100% un-recordable."
- **DO NOT SAY**: "Military-grade protection against every attacker."
