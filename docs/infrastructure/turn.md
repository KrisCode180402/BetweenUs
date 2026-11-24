# Between Us — Coturn TURN Relay Infrastructure & Deployment Specification

> **Phase 15 Security Architecture Specification**  
> **Version:** 1.0.0  
> **Protocol Standard:** WebRTC TURN Relay (RFC 5766 / RFC 5389 / RFC 6156)

---

## 1. Overview & Purpose

**Between Us** employs native WebRTC encrypted media streams for 1-to-1 audio and video calls (`BETWEEN_US_AUDIO_V1` and `BETWEEN_US_VIDEO_V1`). In optimal network conditions, devices establish direct peer-to-peer (P2P) connections via host or STUN ICE candidates.

However, strict corporate firewalls, symmetric NATs, mobile carrier CGNATs, or restrictive Wi-Fi networks block direct P2P transport. **Coturn** acts as an encrypted media relay fallback to ensure 100% call establishment reliability.

### Security Invariants
1. **Relay Transport Only**: Coturn functions **exclusively** as a network packet relay. It does NOT possess signaling capabilities, databases, call history, recording services, or media storage.
2. **End-to-End Media Encryption**: Audio and video media multiplexed over Coturn remain encrypted end-to-end via WebRTC `DTLS-SRTP` (AES-GCM). Coturn cannot inspect or decrypt call media.
3. **No Frontend Secrets**: The Coturn static shared secret (`TURN_SHARED_SECRET`) exists **ONLY** on the VPS and Next.js server. The browser client receives temporary, short-lived REST credentials generated via HMAC-SHA1 (`/api/turn/credentials`).

---

## 2. Target Deployment Architecture

```
                               BETWEEN US

                    ┌─────────────────────────┐
                    │         VERCEL          │
                    │      Next.js + PWA      │
                    └────────────┬────────────┘
                                 │
                                 │ HTTPS
                                 │
                                 ▼
                       Temporary TURN
                       credential service


                       SIGNALING PATH

      YOU ─────── WSS ───────► SIGNALING ─────── WSS ───────► HER


                       MEDIA PATH

      Preferred (P2P Direct):

      YOU ───────────── WebRTC (DTLS-SRTP) ─────────────► HER


      Fallback (Coturn Relay):

      YOU ───────────► COTURN (Relay) ───────────► HER
```

---

## 3. VPS Operating System & System Hardening

Coturn MUST be deployed on a dedicated Linux VPS isolated from Vercel and application API infrastructure.

- **Target OS**: Ubuntu 24.04 LTS / Debian 12 Stable (Kernel `6.8+`).
- **Coturn Version**: `4.6.2+` (installed via official `apt` repository).

### Hardening Checklist
- [x] Dedicated FQDN (e.g. `turn.betweenus.app`).
- [x] Password SSH authentication disabled (`PasswordAuthentication no` in `/etc/ssh/sshd_config`).
- [x] Root SSH login disabled (`PermitRootLogin no`).
- [x] SSH key-based authentication only.
- [x] Minimal package set (no web servers, database engines, or extraneous network daemons).
- [x] Automatic security updates enabled (`unattended-upgrades`).

---

## 4. Required Network Ports & Firewall Rules

### Port Matrix

| Protocol | Port / Range | Direction | Purpose | Access |
| :--- | :--- | :--- | :--- | :--- |
| **TCP** | `22` | Inbound | Admin SSH | Restricted to Admin IPs |
| **UDP** | `3478` | Inbound | TURN / STUN Primary (UDP) | Public |
| **TCP** | `3478` | Inbound | TURN / STUN Fallback (TCP) | Public |
| **TCP** | `5349` | Inbound | TURNS Secure Relay (TLS) | Public |
| **UDP** | `49152-49200` | Inbound | Bounded Relay Media Port Range | Public |

### Firewall Setup (`UFW` commands)
```bash
# Default deny inbound, allow outbound
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (restrict to admin IP if possible)
sudo ufw allow proto tcp from <ADMIN_IP> to any port 22

# Allow Coturn STUN/TURN listening ports
sudo ufw allow 3478/udp
sudo ufw allow 3478/tcp
sudo ufw allow 5349/tcp

# Allow bounded relay media port range
sudo ufw allow 49152:49200/udp

# Enable firewall
sudo ufw enable
```

---

## 5. Production `coturn.conf` Template

Location: `/etc/turnserver.conf`

```ini
# ==============================================================================
# BETWEEN US — HARDENED COTURN PRODUCTION CONFIGURATION
# ==============================================================================

# Listening Interfaces & Hostname
listening-port=3478
tls-listening-port=5349
realm=turn.betweenus.app
server-name=turn.betweenus.app

# REST Shared Secret Authentication (RFC 5389 / Coturn HMAC-SHA1)
use-auth-secret
static-auth-secret=REPLACE_WITH_HIGH_ENTROPY_SERVER_SIDE_SHARED_SECRET

# TLS Certificate & Private Key (Let's Encrypt)
cert=/etc/letsencrypt/live/turn.betweenus.app/fullchain.pem
pkey=/etc/letsencrypt/live/turn.betweenus.app/privkey.pem

# Bounded Relay Port Range (Optimized for 1-to-1 WebRTC calling)
min-port=49152
max-port=49200

# Transport Hardening
no-cli
no-telnet
fingerprint
lt-cred-mech

# Disable legacy or unneeded features
no-multicast-peers
no-stdout-log
log-file=/var/log/turnserver/turnserver.log
simple-log

# Denial of Service & Abuse Mitigation
total-quota=100
user-quota=10
stale-nonce=600
```

---

## 6. Short-Lived REST Credential Architecture

Coturn uses the REST API short-lived credential mechanism:
1. When a client initiates or accepts a call, `AudioCallManager` calls `fetchTurnCredentials()` targeting `/api/turn/credentials`.
2. Next.js server validates authorization and rate limiting (max 10 requests per 5 minutes per device).
3. Next.js server derives a temporary credential:
   - `username = "${expiresAt}:${userIdentity}"`
   - `credential = HMAC-SHA1(TURN_SHARED_SECRET, username).base64()`
4. Client passes short-lived credentials into `RTCPeerConnection` `iceServers`.
5. Coturn independently verifies the HMAC signature using its local `static-auth-secret`.

---

## 7. Logging Minimization & Privacy Metadata Limits

### Operational Logging Safeguards
- Production logging is set to `simple-log` without verbose packet debugging.
- Coturn logs NEVER contain call audio, video, WebRTC keys, or signaling messages.

### Network Privacy Disclosures
While TURN media relay traffic is fully `DTLS-SRTP` encrypted, the relay server inherently observes network transport metadata required for routing packets:
- Connecting client IP addresses
- Session start and duration timestamps
- Bandwidth byte counts
- Relay port allocation pairs

These limitations are explicitly reflected in [data-classification.md](../privacy/data-classification.md).
