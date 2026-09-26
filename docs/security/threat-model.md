# Threat Model — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 01 — Security Foundation & Threat Model  
**Status**: Approved Architecture Specification  

---

## 1. Executive Summary & Philosophy

Between Us is a minimalist, privacy-first 1-to-1 WebRTC calling Progressive Web Application (PWA) designed exclusively for two trusted individuals. The system is explicitly scoped to real-time audio and video communication. It intentionally excludes user registration databases, message persistence, group routing, public user discovery, cloud storage, call recording, call history, advertising, and analytics platforms.

The design operates under a strict threat modeling posture: **Defense in Depth with Minimal Infrastructure Trust**. All network endpoints, signaling proxies, relay servers, build systems, and delivery networks are treated as semi-honest or potentially compromised entities.

---

## 2. Threat Actors & Risk Analysis

### Threat Actor A: Passive Network Attacker

* **Description**: An eavesdropper situated along the network path (e.g., rogue Wi-Fi access point, Internet Service Provider (ISP), compromised router, or nation-state intelligence network).
* **Capabilities**: Intercepts, records, and analyzes all network packets in transit.
* **Vector Analysis**:
  * **Traffic Interception**: Observing raw IP traffic between clients, Cloudflare, Vercel, signaling server, and TURN server.
  * **Metadata Extraction**: Analyzing packet headers, timing signatures, stream packet counts, dynamic bitrate spikes, source/destination IP pairs, and connection durations.
* **Mitigations**:
  * **Media Encryption**: WebRTC mandatory DTLS-SRTP ensures audio/video payload confidentiality and integrity.
  * **Signaling Confidentiality**: Transport Layer Security (TLS 1.3) protects all signaling and WebSocket transport.
  * **IP Obfuscation**: When peer-to-peer (P2P) direct connectivity exposes IP addresses to network observers, forced TURN relaying mode can be enabled to mask direct peer IP links.
* **Architectural Boundaries**: E2EE protects media content. Network-level metadata (packet intervals, volume, duration, IP topology) cannot be completely eliminated without anonymizing networks (e.g., Tor), which introduce latency incompatible with real-time WebRTC media.

---

### Threat Actor B: Active Network Attacker

* **Description**: A malicious network entity capable of actively injecting, altering, dropping, replaying, or rerouting network packets.
* **Capabilities**: Man-in-the-Middle (MITM) capabilities on signaling or media channels, packet manipulation, TCP connection reset, and DNS spoofing.
* **Vector Analysis**:
  * **Message Modification & Replay**: Modifying SDP offers/answers or replaying old signaling messages to force invalid session setups.
  * **Signaling Manipulation**: Altering public identity key exchanges during signaling.
  * **Downgrade Attacks**: Attempting to force insecure cipher suites or unencrypted WebRTC fallbacks.
* **Mitigations**:
  * **Cryptographic Identity Verification**: Ephemeral signaling messages are cryptographically signed using out-of-band verified identity keys (Ed25519 or ECDSA P-256).
  * **Replay Protection**: Cryptographic nonces, strict timestamps, and sequence numbers on all signaling payloads.
  * **DTLS Mutual Authentication**: WebRTC DTLS fingerprint validation prevents active media MITM attacks.
  * **HSTS & TLS Pinning**: Strict HTTPS enforcement via HSTS preloading prevents web transport downgrade attacks.

---

### Threat Actor C: Compromised Signaling Server

* **Description**: An attacker who has gained full root access to the Node.js signaling server, or a rogue infrastructure operator.
* **Capabilities**: Reads, modifies, drops, or injects all WebSocket signaling messages passing through the server.
* **Vector Analysis**:
  * **What it can observe**: Public identity keys, SDP offer/answer structural wrappers, ICE candidate IPs, connection timestamps, active WebSocket connection pairs.
  * **What it must NEVER receive**: Unencrypted media streams, private identity keys, ephemeral media encryption keys, audio/video data.
  * **Manipulation Vectors**: Substituting SDP fingerprints, dropping pairing requests, conducting MITM key substitution during initial peer pairing.
* **Mitigations**:
  * **Zero Trust Signaling Architecture**: The signaling server is treated strictly as an untrusted message relay.
  * **Peer-to-Peer Out-of-Band Verification**: Initial peer pairing requires Short Authentication String (SAS) / fingerprint verification directly between users.
  * **Payload Signing**: Signaling payloads are end-to-end authenticated between client devices.

---

### Threat Actor D: Compromised TURN Server

* **Description**: An attacker who controls the coturn relay server on the hardened VPS.
* **Capabilities**: Inspects, relays, delays, or drops all encrypted WebRTC media packets traversing the relay.
* **Vector Analysis**:
  * **What TURN can observe**: Client IP addresses, relay connection timestamps, total bytes transferred, SRTP packet sizes, packet intervals.
  * **What TURN CANNOT decrypt**: Live audio and video content. Media payloads are encrypted with SRTP keys negotiated directly between endpoints via DTLS-SRTP.
* **Mitigations**:
  * **Relay-Only Design**: TURN has no knowledge of DTLS handshakes or media decryption keys.
  * **Ephemeral Credentials**: Short-lived, time-limited TURN REST API credentials generated with HMAC signatures.
  * **Zero Log Policy**: Hardened coturn configuration with operational packet logging disabled.

---

### Threat Actor E: Compromised Frontend / Delivery Pipeline

* **Description**: An attacker who compromises the application delivery mechanism (Vercel deployment, Cloudflare edge, DNS, or source repository) to serve malicious JavaScript to the client browser.
* **Capabilities**: Full execution of malicious JavaScript within the browser origin context.
* **Vector Analysis**:
  * **Malicious JavaScript Injection**: Exfiltrating non-extractable CryptoKeys, hooking `getUserMedia()` to stream audio/video to an unauthorized endpoint, or disabling verification UI.
  * **Deployment Compromise**: Injecting backdoor scripts during Vercel builds or via Cloudflare Worker scripts.
* **Mitigations**:
  * **Progressive Web App (PWA) Offline Caching**: Service Worker caching allows the PWA to load verified code locally, reducing exposure to dynamic server delivery attacks.
  * **Subresource Integrity (SRI)**: Strict hash verification for standard static assets.
  * **Strict Content Security Policy (CSP)**: Disallowing inline scripts (`'unsafe-inline'`), restricting script source origins, and enforcing strict `connect-src` destinations.
* **Boundary Limitation**: If an attacker successfully replaces the served frontend JavaScript bundle *and* invalidates local PWA caches, browser-level script security boundaries are compromised. Browser applications inherently rely on initial code load trust.

---

### Threat Actor F: Supply-Chain Attacker

* **Description**: An attacker compromising open-source third-party dependencies (npm packages), build tools, CI/CD pipelines (GitHub Actions), or AI-assisted development code.
* **Capabilities**: Injecting obfuscated malicious code into client or server runtimes.
* **Vector Analysis**:
  * **npm Package Tampering**: Typosquatting or compromising a transitive dependency used in the build chain.
  * **CI/CD Exfiltration**: Theft of deployment secrets during GitHub Actions workflows.
* **Mitigations**:
  * **Minimal Dependency Policy**: Strict limit on external dependencies; heavy reliance on native web APIs (Web Crypto API, native WebRTC, native WebSockets).
  * **Package Lock & Security Auditing**: Mandatory `npm audit`, lockfile pinning, and automated dependency vulnerability scanners.
  * **Isolated Build Workflows**: Minimal secret exposure in CI/CD pipeline steps.

---

### Threat Actor G: Pairing Attacker

* **Description**: An unauthorized third party attempting to pair with a user device during out-of-band identity bootstrap.
* **Capabilities**: Intercepting pairing codes, brute-forcing short numeric codes, replaying pairing requests.
* **Vector Analysis**:
  * **Brute-Force Attack**: Attempting all possible numeric pairing code combinations within the active window.
  * **Identity Substitution**: Submitting an attacker's identity key during another user's pairing window.
* **Mitigations**:
  * **Short-Lived Ephemeral Pairing Codes**: Pairing codes expire rapidly (e.g., 3 minutes).
  * **Strict Rate Limiting**: Exponential backoff and lockout after 3 failed pairing attempts.
  * **Out-of-Band Fingerprint SAS Verification**: Visual or verbal verification of cryptographic SAS fingerprints prior to confirming identity trust.

---

### Threat Actor H: Web Application Attacker

* **Description**: Standard web application attacker targeting client-side flaws (XSS, CSRF, Clickjacking, WebSocket abuse, DOM injection).
* **Capabilities**: Executing unauthorized actions within the DOM context, hijacking WebSocket channels, probing browser storage.
* **Vector Analysis**:
  * **Cross-Site Scripting (XSS)**: Injecting scripts to read DOM or intercept media APIs.
  * **Clickjacking**: Framing the application inside an invisible iframe to trick users into triggering calls or granting camera permissions.
  * **WebSocket Frame Abuse**: Sending malformed signaling JSON to crash or overload client state machines.
* **Mitigations**:
  * **Strict Frame Protection**: `X-Frame-Options: DENY` and `frame-ancestors 'none'` CSP directive.
  * **Input Schema Validation**: Strict TypeScript type guards and JSON schema validation on all incoming WebSocket messages.
  * **Non-Extractable CryptoKey Objects**: Web Crypto API keys stored as `extractable: false`, preventing XSS exfiltration of raw private key bytes.

---

### Threat Actor I: Malware / Compromised Endpoint Device

* **Description**: Host OS malware, keyloggers, unauthorized browser extensions, or remote access Trojans (RATs) running on a participant's device.
* **Capabilities**: Capturing screen output, hooking microphone/camera OS drivers, reading memory, stealing browser profile databases.
* **Vector Analysis**: OS-level keylogging, background screen capture, side-channel audio monitoring.
* **Mitigations**:
  * **Endpoint Scope Boundary**: Application-level cryptography cannot protect against a compromised host OS or kernel-level malware.
  * **Warning & Documentation**: Explicit documentation of the boundary between E2EE and OS endpoint security.

---

### Threat Actor J: Physical Attacker

* **Description**: An attacker gaining physical access to an unlocked or stolen participant device.
* **Capabilities**: Opening browser tabs, inspecting IndexedDB storage, reading local caches.
* **Vector Analysis**: Physical access to stored identity keys or active call interface.
* **Mitigations**:
  * **Session Timeout & Re-Auth**: Local state requires OS biometric/passcode authentication (where browser APIs permit).
  * **Storage Isolation**: Sensitive persistent state limited to non-extractable identity keys in IndexedDB. Call content and session secrets are kept solely in ephemeral RAM.

---

### Threat Actor K: Malicious or Compromised Partner Device

* **Description**: The paired partner endpoint is compromised, rogue, or secretly recording the communication.
* **Capabilities**: Capturing raw audio/video output via software screen recorders, external cameras, or modified browser clients.
* **Vector Analysis**: The authorized peer endpoint decrypts media legitimately, then re-records or exfiltrates it.
* **Mitigations**:
  * **Cryptographic Boundary Limit**: End-to-end encryption guarantees that *only the intended recipient* receives the media. It cannot prevent the recipient from misusing decoded media.
  * **Explicit Non-Claim**: The system explicitly acknowledges that technical protection against partner-side external recording is physically impossible.

---

## 3. Summary Risk Matrix

| Threat Actor | Target Asset | Likelihood | Impact | Primary Protection |
| :--- | :--- | :--- | :--- | :--- |
| **A. Passive Network** | Media / Metadata | High | Medium | DTLS-SRTP + TURN Relay |
| **B. Active Network** | Signaling / Identity | Medium | High | Web Crypto Signatures + SAS Verification |
| **C. Compromised Signaling** | Signaling Messages | Medium | High | Untrusted Signaling Protocol + E2EE |
| **D. Compromised TURN** | Media Packets | Low | Low | SRTP E2EE (TURN sees only encrypted frames) |
| **E. Compromised Frontend** | Application JS | Low | Critical | PWA Caching + SRI + Strict CSP |
| **F. Supply-Chain** | Dependencies | Medium | High | Minimal Dependencies + Lockfile Pinning |
| **G. Pairing Attacker** | Identity Trust | Medium | High | Ephemeral Codes + Rate Limits + SAS Verification |
| **H. Web App Attacker** | DOM / Session | Medium | Medium | Non-Extractable Keys + Strict CSP + Validation |
| **I. Device Malware** | Host RAM / Devices | Medium | Critical | Out of TCB Scope (Endpoint Security Boundary) |
| **J. Physical Access** | Stored Keys | Low | Medium | OS Biometrics + Ephemeral RAM State |
| **K. Compromised Partner** | Decrypted Media | Low | Critical | Cryptographic Boundary Limit (Explicit Non-Claim) |

---

## 10. Browser Local Storage & IndexedDB Threat Landscape

### Threat Vectors & Risk Analysis
1. **Malicious Browser Extensions**: Extensions with broad origin access or content script permissions can inspect DOM state and invoke `indexedDB` APIs within the origin context.
2. **Local Disk Forensics & Malware**: Local OS malware or physical forensic inspection of browser profile directories can read unencrypted IndexedDB database files (`between-us-local.indexeddb`).
3. **Cross-Site Scripting (XSS)**: If an XSS vulnerability were to occur despite CSP mitigation, an attacker could invoke IndexedDB read/write methods.
4. **Accidental Persistence Leakage**: Unsanitized object persistence storing temporary call SDPs, ICE candidates, or media buffers to disk.

### Mitigations & Architectural Boundaries
- **Strict Data Exclusion**: Audio, video, WebRTC SDP, ICE candidates, call history, chat, pairing secrets, private keys, and tokens are **never** stored in IndexedDB.
- **Strict Payload Size & Type Validation**: `validateStoragePayload()` rejects all non-primitive runtime objects (`MediaStream`, `Blob`, `CryptoKey`, `RTCPeerConnection`).
- **Low-Sensitivity Scope**: IndexedDB persistence is strictly limited to non-sensitive UI settings and schema metadata (`PERSISTENT_LOW_SENSITIVITY`).
- **No False Security Claims**: Browser storage relies on standard browser origin isolation. IndexedDB is not an encrypted hardware enclave or secure element.

---

## 11. Device Identity Cryptography & Key Theft Threat Analysis

### Threat Vectors & Risk Analysis
1. **Private Key Extraction Attempts**: Malicious scripts attempting to export raw private key bytes via `crypto.subtle.exportKey`.
2. **Accidental Network Transmission**: Application bugs transmitting private key objects or raw key buffers over HTTP/WebSocket calls.
3. **Cross-Protocol Signature Reuse**: Replaying identity signatures generated for one protocol context in another context.
4. **Silent Identity Substitution / Corrupted Key Auto-Regeneration**: Automatic regeneration of identity key pairs on storage read error, silently breaking established pairing trust.

### Mitigations & Architectural Boundaries
- **Non-Extractable Keys (`extractable = false`)**: Private identity keys are created with `extractable = false`. Browser JavaScript cannot export raw private key bytes.
- **Dedicated Storage Isolation**: Identity keys are stored in a dedicated IndexedDB database (`between-us-identity`) via WebIDL structured clone, separate from application settings (`between-us-local`).
- **Domain-Separated Signatures**: Digital signatures enforce `BETWEEN_US_IDENTITY_V1:` prefix to prevent signature reuse across protocol boundaries.
- **Strict No-Auto-Regeneration Policy**: Unreadable or corrupted identity storage triggers an explicit `ERROR` state rather than silently regenerating a new key pair.

---

## 12. Device Pairing Protocol & MITM Threat Analysis

### Threat Vectors & Risk Analysis
1. **Compromised Signaling Relay / Man-in-the-Middle (MITM)**: A compromised signaling server attempting to replace Device B's public identity with an attacker's public identity during pairing.
2. **Replay Attacks**: Replaying recorded pairing response or confirm payloads in subsequent pairing attempts.
3. **Reflection Attacks**: Reflecting an Initiator's signed payload back as a Responder's response.
4. **Role Confusion & Stale Invitations**: Injecting responder messages into initiator session state or reusing expired pairing invitations.

### Mitigations & Architectural Boundaries
- **Challenge-Response Proof-of-Possession**: Ephemeral 256-bit challenges (`challengeA` and `challengeB`) signed by respective ECDSA P-256 private keys prove identity ownership.
- **Role & Domain Separation**: Signatures explicitly encode role binding (`BETWEEN_US_PAIRING_V1:RESP:` vs `BETWEEN_US_PAIRING_V1:CONF:`), rendering reflected payloads invalid.
- **Explicit Dual User Confirmation**: Pairing requires both users to review peer fingerprints and explicitly click `[CONFIRM]` before persistent trust is written.
- **Short-Lived & One-Time Use**: Sessions expire after 5 minutes and are strictly invalidated upon completion, failure, or cancellation.

---

## 13. Safety Verification & Out-of-Band Verification Analysis

### Threat Vectors & Risk Analysis
1. **Unverifiable In-Band Signatures**: An attacker controlling network transport might attempt to substitute public key fingerprints without triggering protocol syntax errors.
2. **Key Substitution & Device Replacement**: A partner's device identity changing without notice due to key loss, device transfer, or attacker key replacement.
3. **Visual Code Ambiguity**: Misinterpreting ambiguous characters or emojis during out-of-band visual comparison.
4. **UI Spoofing / Local Verification Bypass**: Setting a global boolean `isVerified = true` without binding verification state to a specific public identity fingerprint.

### Mitigations & Architectural Boundaries
- **Domain-Separated Canonical Hashing (`BETWEEN_US_SAFETY_FINGERPRINT_V1`)**: Safety representations are computed locally from `BETWEEN_US_SAFETY_FINGERPRINT_V1:ECDSA-P256:<spkiHex>` using SHA-256 via Web Crypto API.
- **Identity Pinning & Immediate Substitution Invalidation**: Verification is bound to the exact `pinnedPartnerFingerprint`. If a partner's public identity key changes, the system immediately invalidates trust and transitions state to `IDENTITY_CHANGED`.
- **Deterministic Multi-Format Mapping**: Digest bytes map deterministically to 6-word sequences, 5-emoji sequences, 16-character alphanumeric short codes, and full SHA-256 hex strings.
---

## 14. Ephemeral WebSocket Signaling & Relay Threat Analysis

### Threat Vectors & Risk Analysis
1. **Malicious Signaling Relay**: A compromised signaling server attempting to read audio/video media, intercept calls, or inject arbitrary messages into active sessions.
2. **Third-Participant Eavesdropping**: An unauthorized 3rd participant attempting to join a 1-to-1 signaling session.
3. **Session Flooding & Exhaustion**: Connection flooding, oversized payloads (>32KB), or rapid message bursts attempting to exhaust server RAM.
4. **Cross-Session Message Injection & Sender Spoofing**: Injecting signaling messages from Session A into Session B, or claiming a false sender fingerprint.

### Mitigations & Architectural Boundaries
- **Zero Media & Zero Persistence**: Signaling carries zero audio/video media and maintains zero database persistence. Ephemeral RAM state only.
- **Strict 2-Participant Limit & Session Isolation**: Maximum 2 participants per session. 3rd participant join attempts are strictly rejected (`MAXIMUM_PARTICIPANTS_EXCEEDED`).
- **Cryptographic Session Authentication**: Clients prove ownership of their public identity key via ECDSA P-256 signatures over `BETWEEN_US_SIGNALING_V1:AUTH:<sessionId>:<nonce>:<timestamp>:<fingerprint>`.
- **Strict Payload Limits & Rate Limiting**: 32KB max message size, 10 conn/min/IP rate limit, 30 msgs/min/socket rate limit, and failed attempt lockout.
- **Untrusted Server Client Validation**: Clients validate every incoming envelope schema independently before passing data to WebRTC setup.

---

## 15. WebRTC Real-Time Audio Transport & Media Stream Threat Analysis

### Threat Vectors & Risk Analysis
1. **Network Eavesdropping**: Passive network eavesdropping on Wi-Fi or ISP routing attempting to intercept voice conversations.
2. **Unauthorized Camera Acquisition / Video Leakage**: Bugs or malicious code requesting video permissions or initializing camera hardware during an audio call.
3. **Microphone Activation Without Action**: Activating microphone hardware automatically upon receiving an incoming signaling message without explicit user consent.
4. **Accidental Media Disk Persisting**: Writing temporary audio buffers, recordings, or WebRTC call logs to IndexedDB or local files.
5. **Compromised Endpoint Hardware**: Malware or compromised operating system recording audio directly at the hardware endpoint.

### Mitigations & Architectural Boundaries
- **Mandatory DTLS-SRTP P2P Transport**: All real-time voice media is encrypted end-to-end between peer browser endpoints using mandatory WebRTC DTLS 1.2/1.3 key exchange and SRTP (`AES-128-GCM` / `AES-256-GCM`).
- **Strict Audio-Only Constraints**: `getUserMedia` enforces `audio: true, video: false` strictly. Zero camera hardware initialization and zero video tracks.
- **On-Demand Explicit User Activation**: Microphone permission is requested **only** when the user explicitly initiates or accepts an audio call. Incoming signaling envelopes never activate local hardware.
- **Zero Media Server Contact**: The Node.js signaling server handles temporary negotiation envelopes only and never touches audio streams.
- **Zero Persistence & Immediate Track Termination**: Audio streams exist in RAM only. Call termination calls `track.stop()`, closes `RTCPeerConnection`, and purges candidate queues. Zero call history or media files are stored.
- **Explicit Endpoint Trust Disclaimer**: Between Us guarantees zero recording by the local application, but explicitly documents that a compromised endpoint operating system or physical hardware recorder cannot be prevented by browser application code alone.

---

## 16. WebRTC Real-Time Video Transport & Camera Stream Threat Analysis

### Threat Vectors & Risk Analysis
1. **Unauthorized Camera Activation**: Attempting to access camera hardware during audio-only calls, app startup, or pairing.
2. **Video Stream Eavesdropping**: Intercepting real-time video frames over local network Wi-Fi or ISP transit.
3. **Canvas / Frame Scraping**: Attempting to capture video frames using `canvas.captureStream()` or `MediaRecorder` for stealth storage.
4. **Server Media Relaying / Ingestion**: Routing camera streams through signaling servers or cloud ingestion endpoints.
5. **Persistent Video Thumbnail / Snapshot Leakage**: Persisting local or remote video frame thumbnails in IndexedDB, localStorage, or CacheStorage.

### Mitigations & Architectural Boundaries
- **Strict Intent Separation & Audio Regression Protection**: Audio calls strictly set `video: false`. Camera permission (`video: { facingMode: "user" }`) is requested **only** on explicit user action initiating or accepting a video call.
- **Single RTCPeerConnection DTLS-SRTP Multiplexing**: Both audio and video media tracks are multiplexed over a single `RTCPeerConnection` encrypted via DTLS 1.2/1.3 and SRTP (`AES-GCM`).
- **Zero Server Video Media Access**: The Node.js WebSocket signaling server routes negotiation envelopes (SDP/ICE) only and has zero access to camera video streams.
- **Zero Media & Zero Canvas Storage**: No `MediaRecorder`, `canvas.captureStream()`, video blobs, thumbnails, or call logs are persisted to disk or browser storage.
- **Immediate Video Track Termination**: When a call ends or camera is toggled off, video tracks are stopped (`track.stop()`) and stream pointers are detached from DOM video elements.

---

## 17. TURN Relay Infrastructure, Credential Security & Metadata Threat Analysis

### Threat Vectors & Risk Analysis
1. **TURN Shared Secret Leakage**: Accidental exposure of `TURN_SHARED_SECRET` in client JavaScript bundles, Git commits, or `NEXT_PUBLIC_*` environment variables, allowing attackers to generate unlimited TURN credentials on behalf of the server.
2. **TURN Credential Theft & Bandwidth Abuse**: Attackers harvesting short-lived TURN credentials to proxy arbitrary non-Between Us traffic through the Coturn relay VPS.
3. **Malicious TURN Relay Operator**: A malicious host or network operator inspecting relay traffic or attempting to intercept WebRTC audio/video streams.
4. **Relay Denial of Service (DoS)**: Flooding the TURN credential generation endpoint `/api/turn/credentials` or Coturn UDP listening ports to exhaust server bandwidth and CPU.
5. **Network Metadata Observation**: Traffic analysis on the Coturn VPS observing connecting IP addresses, session timestamps, and bandwidth volume.

### Mitigations & Architectural Boundaries
- **Server-Only Shared Secret Invariant**: `TURN_SHARED_SECRET` exists strictly on the Next.js server and Coturn VPS environment. It is NEVER prefixed with `NEXT_PUBLIC_` or exposed in client bundles.
- **Short-Lived REST Credentials (HMAC-SHA1)**: Credentials are generated dynamically with a 10-minute (600s) TTL (`username` formatted with expiration timestamp; `password` generated via HMAC-SHA1). Permanent credentials are prohibited.
- **End-to-End Media Encryption Continuity**: Media relayed through Coturn remains fully encrypted end-to-end via WebRTC `DTLS-SRTP` (AES-GCM). The TURN relay server cannot inspect audio or video contents.
- **Rate Limiting & Endpoint Authorization**: `/api/turn/credentials` enforces sliding-window rate limiting (max 10 requests per 5 minutes per device/IP) and checks caller authorization.
- **Bounded Port Ranges & Minimal VPS Hardening**: Coturn relay ports are bounded strictly (`49152-49200`), SSH is key-only with root disabled, and unneeded network daemons are purged.
- **Accurate Metadata Model**: The threat model explicitly acknowledges that while TURN media contents are end-to-end encrypted, Coturn inherently processes network routing metadata (connecting IP addresses, timing, byte volume).

---

## 18. Call State Machine, Race Condition & Session Desynchronization Threat Analysis

### Threat Vectors & Risk Analysis
1. **Stale Signaling Envelope Replay / Injection**: Delayed SDP or ICE candidate envelopes from previous or expired call sessions arriving after a new call has started, causing connection desynchronization.
2. **Simultaneous Call Setup Deadlock**: Both paired devices initiating calls simultaneously, causing race conditions, duplicate PeerConnections, or media stream deadlocks.
3. **Unbounded Ringing / Infinite Wait Resource Exhaustion**: Leaving a call in ringing or initiating state indefinitely without answer, consuming browser RAM and socket resources.
4. **Double Hangup & Rapid Button Click Race Conditions**: Rapid double-clicking on accept/decline/hangup buttons or simultaneous hangup by both peers causing unhandled exceptions or state leakage.
5. **State Machine Bypassing**: Attempting to trigger illegal state jumps (e.g. `IDLE` → `CONNECTED` or `REJECTED` → `CONNECTED`) to force media stream setup without authentication.

### Mitigations & Architectural Boundaries
- **Authoritative Centralized State Machine**: All call state changes flow through `CallStateMachine.transitionTo()`, which enforces a strict transition matrix. Illegal transitions throw `CallStateError` without mutating active state.
- **Ephemeral Session ID Tagging & Stale Message Filtering**: Every call session generates a unique `sessionId`. All signaling envelopes are tagged; messages for mismatched or expired sessions are dropped immediately.
- **Deterministic Simultaneous Call Resolution**: Tie-breaker rule compares device key fingerprints lexicographically (`localFingerprint < partnerFingerprint`). The lower fingerprint wins the caller role; the higher fingerprint cancels its outgoing attempt and accepts the winner's call.
- **Session-Scoped Bounded Timers**: Initiation (10s), Ringing (30s), Negotiation (15s), and Reconnection (15s) timers enforce strict timeouts (`TIMED_OUT`) to prevent infinite waiting.
- **Idempotent Cleanup & Guaranteed Track Teardown**: Reaching any terminal state (`ENDED`, `FAILED`, `TIMED_OUT`, `REJECTED`, `CANCELLED`) automatically executes `cleanupAndEnd()`, stopping all hardware tracks (`track.stop()`), closing `RTCPeerConnection`, and clearing transient memory.

---

## 19. Metadata Minimization, Observability & Infrastructure Metadata Threat Analysis

### Threat Vectors & Risk Analysis
1. **Third-Party Telemetry & Analytics Leaks**: Third-party tracking scripts or crash-reporting SDKs capturing user interaction timestamps, IP addresses, or browser environment data.
2. **Cross-Session Metadata Correlation**: Persistent call session GUIDs or static database records linking multiple call attempts over time to build a user activity profile.
3. **Browser Fingerprinting Exploitation**: Malicious scripts invoking WebGL, Canvas, AudioContext, or font enumeration APIs to uniquely identify a user device across web sessions.
4. **Error Message Metadata Exposure**: Diagnostic error dialogs or network error responses leaking client IP addresses, internal hostnames, SDP payloads, or TURN credentials.
5. **Infrastructure Metadata Interception**: External network intermediaries (ISPs, Cloudflare, Vercel, Coturn VPS) observing network transport packet metadata (IP headers, TLS handshakes, byte volume).

### Mitigations & Architectural Boundaries
- **Zero Third-Party Scripts & Zero Telemetry**: Complete prohibition of Google Analytics, Plausible, Sentry, Mixpanel, tracking pixels, `getStats()` network reporting, and `navigator.sendBeacon()` requests.
- **Uncorrelated Ephemeral Call Sessions**: Every call attempt uses a unique, single-use `sessionId` (`BETWEEN_US_CALL_SESSION_<uuid>`). Successive calls between paired devices generate independent IDs; zero call history is stored.
- **Strict Fingerprinting Prohibition**: Application codebase strictly prohibits Canvas 2D, WebGL, AudioContext, screen resolution, or hardware concurrency fingerprinting probes.
- **Sanitized Privacy-Safe Error Messages**: Error dialogs present concise, non-sensitive descriptions without stack traces, IP addresses, SDP payloads, or TURN credentials.
- **Honest Infrastructure Metadata Disclosures**: Documentation explicitly distinguishes between Application-Controlled Metadata (minimized to volatile RAM and wiped on hangup) and Infrastructure / Network Metadata (unavoidable TCP/UDP transport packet headers).

---

## 20. Logging Privacy, Accidental Secret Leakage & Log Injection Threat Analysis

### Threat Vectors & Risk Analysis
1. **Accidental Console / Log Leakage**: Unsanitized `console.log`, `console.warn`, or `console.error` calls outputting private keys, pairing secrets, WebRTC SDP session descriptions, ICE candidate IP tuples, or short-lived TURN credentials.
2. **Log Injection Attacks**: Malicious signaling envelope fields containing newline characters (`\n`, `\r`) or terminal control sequences attempting to forge log entries or bypass log parsers.
3. **Production Verbosity Over-Logging**: Verbose debug logs enabled in production environments causing log aggregators or browser devtools to retain sensitive context traces over time.
4. **Unhandled Exception Stack Trace Leaks**: System errors dumping raw object properties or exception stack traces containing authorization headers or cryptographic material to console output.
5. **Infrastructure Log Exposure**: Operating system or serverless environment logs retaining unredacted request payloads or URL parameters containing sensitive parameters.

### Mitigations & Architectural Boundaries
- **Centralized Redaction & Sanitization Pipeline (`AppLogger` & `SignalingLogger`)**: All client and server application logging passes through unified redaction logic (`lib/privacy/logger.ts`). Keys matching `sdp`, `candidate`, `credential`, `username`, `password`, `secret`, `privateKey`, `token`, `authorization`, `cookie`, `pairingCode` are automatically replaced with `"[REDACTED_FOR_PRIVACY]"`.
- **Regex Detection for Secret Strings**: Raw strings containing WebRTC SDP headers (`v=0`, `o=`, `a=rtpmap`) or private key PEM signatures are automatically replaced with `"[REDACTED_SDP_OR_CANDIDATE]"` and `"[REDACTED_PRIVATE_KEY]"`.
- **Automatic Environment Verbosity Controls**: Debug and non-essential operational logs are automatically suppressed when `NEXT_PUBLIC_APP_ENV === 'production'` or `NODE_ENV === 'production'`.
- **Sanitized Exception Handling (`sanitizeError`)**: Exceptions are scrubbed of raw key properties, authorization parameters, and file system secret traces before being emitted to log handlers.
- **Log Injection Sanitization**: Newlines and control characters are stripped from message strings prior to output.

---

## 21. Forensic Storage, Residual Remnants & Memory Lifetime Threat Analysis

### Threat Vectors & Risk Analysis
1. **Stale Browser Storage Remnants**: Persistent data lingering in `localStorage`, `sessionStorage`, or `IndexedDB` after call termination allowing forensic recovery of SDP, ICE, or call history.
2. **Service Worker / PWA Cache Pollution**: Service worker interception caching sensitive WebRTC negotiation responses (`/api/turn/credentials`) or WebSocket frames in CacheStorage.
3. **Unreleased WebRTC / MediaStream Memory References**: Active `RTCPeerConnection` instances or `MediaStreamTrack` objects remaining unclosed in JavaScript heap memory after call end.
4. **Temporary Filesystem Artifacts**: Server-side or client-side temporary file dumps (`.wav`, `.webm`, `.tmp`) retaining media audio/video content.
5. **Build Bundle Secret Exposure**: Hardcoded TURN secrets, test private keys, or synthetic test markers embedded into production JavaScript static chunks.

### Mitigations & Architectural Boundaries
- **Strict Persistent Storage Exclusion**: Audio, video, SDP offers/answers, ICE candidates, call history, TURN credentials, and session keys are strictly excluded from persistent browser storage.
- **Automated Service Worker Exclusion Rules**: Service worker network handlers strictly exclude WebSocket (`ws://`, `wss://`) and dynamic API routes (`/api/turn/credentials`) from CacheStorage.
- **Deterministic Teardown Lifecycle (`cleanupAndEnd`)**: Call termination forces `track.stop()`, `pc.close()`, event handler removal, and memory reference zeroing across all execution paths.
- **Zero Temporary File Generation**: The application architecture generates 0 media files, 0 audio recordings, 0 temporary call dumps, and 0 disk logs.
- **Honest System Boundaries**: The threat model explicitly documents that while application code purges all object references, hardware RAM garbage collection, OS virtual memory swap files, and SSD wear-leveling controllers operate below browser application execution boundaries.

---

## 22. Cryptographic Implementation, Misuse & Key Compromise Threat Analysis

### Threat Vectors & Risk Analysis
1. **Insecure Random Number Generation**: Use of predictable non-cryptographic RNGs (`Math.random()`) for nonces, pairing codes, or challenge generation allowing attackers to predict pairing tokens.
2. **Private Key Exfiltration**: Extraction of raw private identity keys via Web Crypto `exportKey` calls or accidental exfiltration via XSS script execution.
3. **Signature Replay & Cross-Protocol Confusion**: Replaying signed identity payloads or pairing responses in another protocol phase to bypass authentication.
4. **Signaling Server Key Substitution (MITM)**: A compromised signaling relay replacing peer public identity keys during WebRTC offer/answer exchange.
5. **Secret Exposure in Client JavaScript**: Hardcoding `TURN_SHARED_SECRET` or private server credentials in client-side Next.js environment variables (`NEXT_PUBLIC_*`).

### Mitigations & Architectural Boundaries
- **Mandatory Web Crypto CSPRNG**: 100% of security randomness uses `crypto.getRandomValues()`. Zero security uses of `Math.random()` in application codebase.
- **Non-Extractable Device Private Keys (`extractable: false`)**: Identity private keys are generated with `extractable = false`. Browser execution environment prohibits exporting raw PKCS#8 or JWK key bytes.
- **Explicit Domain Separation Prefixes**: All digital signatures enforce unique domain prefixes (`BETWEEN_US_IDENTITY_V1:`, `BETWEEN_US_PAIRING_V1:RESP:`, `BETWEEN_US_PAIRING_V1:CONF:`, `BETWEEN_US_SAFETY_FINGERPRINT_V1:`), rendering cross-protocol replayed payloads invalid.
- **Out-of-Band SAS Safety Verification**: Ephemeral signaling key substitution attempts are detected and blocked when users visually verify matching SAS fingerprints.
- **Strict Server Secret Isolation**: `TURN_SHARED_SECRET` exists exclusively in server-side process environment and is never exposed to browser bundles.

---

## 23. Zero-Retention, Session Desynchronization & Stale Callback Threat Analysis

### Threat Vectors & Risk Analysis
1. **Ghost Session Resurrecting via Delayed ICE Candidates**: Delayed ICE candidates or SDP messages arriving over signaling after local call termination re-initializing peer connections or reviving state.
2. **Orphaned Hardware Microphone / Camera Capture**: Unreleased media stream tracks keeping camera or microphone hardware indicators active after UI call end.
3. **Timer Leak Race Conditions**: Active timeout timers (`RINGING_TIMEOUT_MS`, `CONNECTION_TIMEOUT_MS`) firing after session destruction and triggering invalid state transitions or unhandled exceptions.
4. **Multiple Call Isolation Leak**: Data or state from a previous call session bleeding into a subsequent call session due to non-zeroed manager state.

### Mitigations & Architectural Boundaries
- **Idempotent Centralized Teardown Routine (`cleanupCallSession`)**: Unified teardown guarantees track stopping, socket closing, timer cancellation, and state machine reset in a single execution.
- **Session Reference Invalidation**: Invalidation of `sessionRef.currentSessionId` ensures all late signaling messages or delayed candidates targeting old sessions are rejected.
- **Strict Hardware Track Disabling**: `track.enabled = false` and `track.stop()` are executed on both local and remote streams during session teardown.
- **Idempotent Multi-Teardown Safety**: Repeated cleanup calls maintain `CleanupStatus.CLEAN` without throwing unhandled exceptions.

---

## 24. Accidental Screen Exposure, App Switching, Device Lock & Privacy Mode Threat Analysis

### Threat Vectors & Risk Analysis
1. **Visual Exposure During App Switching**: Switching tabs or backgrounding the PWA displaying active camera streams or sensitive UI previews in browser app-switcher thumbnails.
2. **Accidental Exposure in Public Settings**: Visual screen exposure when someone looks over the user's shoulder during an active call.
3. **Notification Metadata Leaks**: Push notifications or OS alerts displaying partner identities, relationship status, or call content.
4. **OS Screen Capture / Screenshot Realities**: Physical or OS-level screen capture tools operating outside browser sandbox boundaries.

### Mitigations & Architectural Boundaries
- **Automatic Privacy Overlay (`PrivacyOverlay`)**: Reacting to `visibilitychange` (`document.visibilityState === "hidden"`) or user toggle immediately renders a full-screen privacy shield.
- **Single-Step Emergency Exit (`⚡ PRIVACY EXIT`)**: Fast execution path halts all media tracks, tears down WebRTC connections via Phase 21 cleanup, invalidates session ID, and returns to `SAFE_HOME`.
- **Generic Notification & Metadata Copy**: All notification strings and document titles strictly use generic branding (`BETWEEN US`) without exposing partner details or call content.
- **Honest System Boundaries**: The threat model explicitly documents that while application code minimizes UI content and provides application-level Privacy Mode, OS-level screen recording software and external cameras operate outside web application control.

---

## 25. Infrastructure Hardening, Cloudflare/Vercel/VPS Compromise & Secret Isolation Threat Analysis

### Threat Vectors & Risk Analysis
1. **Infrastructure Server Secret Exposure**: Server credentials (`TURN_SHARED_SECRET`, SSH private keys) accidentally exposed in public GitHub commits or client JavaScript bundles (`NEXT_PUBLIC_*`).
2. **Volumetric Denial of Service (DDoS)**: Volumetric flooding of signaling WebSocket endpoints or WebRTC relay ports overwhelming VPS bandwidth.
3. **Malicious Signaling Origin / MITM Injection**: Unvalidated cross-origin WebSockets injecting malformed or replayed SDP payloads into active call sessions.
4. **Coturn Relay Misuse**: Unauthorized third parties abusing Coturn relay infrastructure for arbitrary high-volume network tunneling.

### Mitigations & Architectural Boundaries
- **Strict Server Secret Isolation**: `TURN_SHARED_SECRET` exists strictly in server-side process environment; client static JavaScript builds (`.next/static/`) are audited and verified 100% clean of server secrets.
- **Cloudflare Edge Protection & WAF**: Volumetric HTTP/HTTPS attack mitigation provided by Cloudflare WAF; WSS handshake endpoints protected by rate limiting (max 10 msgs/sec).
- **Time-Limited HMAC TURN Authentication**: Coturn relay access enforced via 10-minute short-lived HMAC REST credentials (`turn.betweenus.app`). Permanent shared secrets are never placed in client code.
- **Host Firewall & Port Range Restriction**: Signaling and Coturn VPS host firewalls default-deny all ports except administrative SSH, TLS WSS (443), and restricted TURN relay ranges (49152-65535).

---

## 26. Software Supply Chain, Dependency Compromise, GitHub Actions & Build Artifact Threat Analysis

### Threat Vectors & Risk Analysis
1. **Malicious Dependency / Typosquatting**: Malicious code injected into runtime or build dependencies attempting to exfiltrate private identity keys or media streams.
2. **Compromised Third-Party GitHub Action**: A compromised GitHub Action executing arbitrary code inside CI runner environments.
3. **Over-Privileged CI Workflow**: GitHub Actions workflows running with write access (`contents: write`) permitting unauthorized repository mutations.
4. **Secret Exposure in Client Build Bundles**: Server credentials (`TURN_SHARED_SECRET`, private keys) accidentally rendered into static Next.js client bundles (`.next/static/`).

### Mitigations & Architectural Boundaries
- **Deterministic Dependency Installation (`npm ci`)**: Lockfile `package-lock.json` is committed and enforced in CI to prevent floating transitive updates.
- **Least-Privilege Workflow Isolation**: All GitHub Actions workflows strictly specify `permissions: contents: read`.
- **Pinned Action Versions**: Third-party GitHub Actions are pinned to explicit version tags (`actions/checkout@v4.2.2`, `actions/setup-node@v4.1.0`).
- **Post-Build Bundle Secret Inspection**: CI pipeline executes static bundle secret scans to verify zero server secrets appear in production JavaScript output.
- **CODEOWNERS Protection**: Security-critical paths (`lib/crypto/`, `lib/signaling/`, `lib/webrtc/`, `lib/privacy/`, `lib/safety/`, `server/`, `.github/`, `docs/security/`) require mandatory code owner review.
