# Network Architecture — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 02 — Final System & Trust Architecture  
**Status**: Approved Specification  

---

## 1. Network Topology & Categorization

The network architecture of **Between Us** segments network zones into four explicit categories:

1. **Trusted Endpoints**: User Device A and User Device B browser runtimes executing local Web Crypto operations and MediaStream processing.
2. **Public Internet**: Untrusted transit networks, ISPs, cellular carriers, public Wi-Fi access points, and routing infrastructure.
3. **Untrusted Infrastructure**: Cloudflare Edge WAF, Vercel Serverless Origin, and Node.js WebSocket Signaling VPS.
4. **Relay Infrastructure**: Dedicated coturn TURN VPS acting solely as an IP packet relay for SRTP traffic.

```
+---------------------------------------------------------------------------------------------------+
|                                          PUBLIC INTERNET                                          |
|                                                                                                   |
|  +-----------------------+      HTTPS (TLS 1.3)      +-------------------+    HTTPS (TLS 1.3)    |
|  | User Device A (PWA)   | ─────────────────────────>| Cloudflare WAF    | ──────────────────┐  |
|  | (Trusted Endpoint)    | <─────────────────────────| Edge DNS & Proxy  | <─────────────────┤  |
|  +-----------------------+                           +-------------------+                   │  |
|      │               │                                                                       ▼  |
|      │               │ WSS (TLS 1.3)                                                 +---------------+
|      │               └──────────────────────────────────────────────┐                | Vercel        |
|      │                                                              │                | Frontend Host |
|      │ Direct WebRTC UDP (DTLS-SRTP)                                │                +---------------+
|      ▼                                                              ▼                   (Untrusted)
|  +-----------------------+                           +-------------------------------+          |
|  | User Device B (PWA)   | <─────────────────────────| Signaling VPS (Node.js)       |          |
|  | (Trusted Endpoint)    |      WSS (TLS 1.3)        | wss://signaling.betweenus.app |          |
|  +-----------------------+                           +-------------------------------+          |
|      ▲                                                          (Untrusted)                     |
|      │                                                                                          |
|      │ Relayed SRTP UDP                                                                         |
|      │                                                                                          |
|      │               +-----------------------------------------------+                          |
|      └──────────────>| TURN VPS (coturn Relay)                       |                          |
|                      | turn.betweenus.app:3478 / UDP                 |                          |
|                      +-----------------------------------------------+                          |
|                                     (Relay Infrastructure)                                      |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Port & Protocol Specifications

| Node / Edge | Destination Host | Port | Transport Protocol | Application Protocol | Purpose | Encrypted? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Client Browser** | Cloudflare Edge | `443` | TCP | HTTPS (TLS 1.3) | PWA static app shell download | Yes (TLS 1.3) |
| **Cloudflare Edge** | Vercel Serverless | `443` | TCP | HTTPS (TLS 1.3) | Origin proxy fetch | Yes (TLS 1.3) |
| **Client Browser** | Signaling VPS | `443` | TCP | WSS (TLS 1.3) | JSON signaling envelope routing | Yes (TLS 1.3) |
| **Client Browser** | Coturn STUN | `3478` | UDP / TCP | STUN | Public reflexive IP discovery | No (IP header only) |
| **Client Browser** | Coturn TURN Relay | `3478` / `5349` | UDP / TCP / TLS | TURN / SRTP | Relayed WebRTC media transport | Yes (DTLS-SRTP) |
| **Client Browser A** | Client Browser B | Dynamic UDP | UDP | WebRTC (DTLS-SRTP) | Direct P2P audio/video media stream | Yes (DTLS-SRTP E2EE) |

---

## 3. Network Isolation & Firewall Boundaries

### 3.1 Signaling VPS Firewall Rules (`iptables` / `nftables`)
* **INBOUND**:
  * `TCP 22`: Restricted to SSH administration from authorized admin IP with key-only auth.
  * `TCP 443`: Open to public internet for WSS WebSocket signaling traffic.
  * Drop all other inbound TCP/UDP ports.
* **OUTBOUND**:
  * Restricted to system package updates (`TCP 80/443`). Direct connections to TURN or external databases are blocked.

### 3.2 TURN VPS Firewall Rules (`iptables` / `nftables`)
* **INBOUND**:
  * `TCP 22`: Restricted SSH access.
  * `UDP 3478`: STUN/TURN binding listening port.
  * `TCP/UDP 5349`: TURNS encrypted relay port.
  * `UDP 49152-65535`: Dynamic TURN media relay allocation port range.
* **OUTBOUND**:
  * Open UDP port range (`49152-65535`) to forward SRTP media packets between peer clients. All TCP egress blocked except package updates.
