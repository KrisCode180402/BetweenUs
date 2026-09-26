# Final Privacy Boundary & Honest Disclosure — Between Us

## 1. What Between Us Controls (Application Security Guarantees)
- **Zero Application-Side Data Retention**: Between Us does not record calls, store media files, keep call history, log text messages, or run analytics tracking scripts.
- **In-Transit Encryption**: All audio/video streams are encrypted end-to-end between peers using standard WebRTC DTLS-SRTP.
- **Non-Extractable Device Keys**: Cryptographic key pairs are stored in the browser's Web Crypto API key store with `extractable: false`, preventing raw key exfiltration via standard JavaScript context.
- **Ephemeral Signaling**: Signaling messages (SDP/ICE) are routed exclusively through in-memory WebSocket structures and discarded immediately upon call completion or disconnect.
- **Authenticated Relay Access**: Coturn TURN relay requires timed server-generated HMAC credentials, preventing unauthorized third-party relay abuse.
- **Deterministic Teardown**: Ending a call forcibly closes all hardware camera/microphone streams (`MediaStreamTrack.stop()`) and resets the peer connection (`RTCPeerConnection.close()`).

## 2. What Between Us DOES NOT Control (System & External Limitations)
- **Endpoint Compromise & Device Malware**: If an attacker has administrative control, root access, keylogger software, or malware on a user's operating system or device, application-level web security cannot prevent data interception at the OS level.
- **Malicious Browser Extensions**: Browser extensions with broad DOM or webRequest permissions operate outside the web application sandboxing model and can inspect rendered DOM elements or network activity.
- **Physical Screen Capture & Photography**: A web application cannot prevent a person from photographing a screen with a physical camera or smartphone, or using OS-level screen capture tools.
- **Network Metadata Observation**: While media content is encrypted, external network observers (ISPs, network taps, DNS resolvers) can observe IP packet headers, IP addresses of peers or TURN relays, and timing metadata associated with real-time traffic.
- **Hosting & Infrastructure Logs**: Infrastructure providers (Cloudflare, Vercel, VPS providers) maintain operational and security logs (such as IP connection requests and access timestamps) for network health and DDoS defense outside application control.
