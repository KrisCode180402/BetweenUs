# Server Architecture — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 02 — Final System & Trust Architecture  
**Status**: Approved Specification  

---

## 1. Backend Server Topology & Resource Isolation

The backend architecture consists of two hardened, independent Virtual Private Servers (VPS) with zero shared databases or persistent file stores.

```
+-----------------------------------------------------------------------------------+
| HARDENED SIGNALING VPS (Node.js WebSocket Daemon)                                 |
| - Operating System: Ubuntu Server 24.04 LTS (Minimal Installation)                |
| - Runtime: Node.js (Current LTS) + TypeScript (`ws` native WebSocket library)     |
| - Process Manager: Systemd Service (`signaling.service`) under unprivileged user  |
| - Listening Ingress: TCP Port 443 (TLS 1.3 / WSS)                                 |
| - State Model: Volatile In-Memory Node.js Data Structures                         |
| - Database / Disk Usage: ZERO Persistent Database / Read-Only App Mount           |
+-----------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------+
| HARDENED TURN VPS (coturn Relay Daemon)                                           |
| - Operating System: Ubuntu Server 24.04 LTS (Minimal Installation)                |
| - Runtime Daemon: coturn Open-Source TURN Server                                  |
| - Process Manager: Systemd Service (`coturn.service`) under user `turnserver`     |
| - Listening Ingress: UDP/TCP 3478, UDP/TCP/TLS 5349, UDP 49152-65535 (Relay)       |
| - Auth Model: Ephemeral REST API Credentials (HMAC-SHA-1)                         |
| - Media Access: Zero Decryption Keys; Pure Packet Forwarding                      |
+-----------------------------------------------------------------------------------+
```

---

## 2. Server Process Hardening & Systemd Isolation

### 2.1 Signaling Daemon Systemd Service Configuration (`/etc/systemd/system/signaling.service`)

```ini
[Unit]
Description=Between Us Ephemeral Signaling Daemon
After=network.target

[Service]
Type=simple
User=signaling
Group=signaling
WorkingDirectory=/opt/betweenus-signaling
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=5

# Hardening Constraints
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
NoNewPrivileges=true
ProtectKernelTunables=true
ProtectControlGroups=true
RestrictNamespaces=true
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
```

### 2.2 Coturn Daemon Hardening Configuration (`/etc/turnserver.conf`)

```ini
# Listening Ports & Interfaces
listening-port=3478
tls-listening-port=5349
realm=turn.betweenus.app

# Ephemeral REST API Credentials (HMAC-SHA-1)
use-auth-secret
static-auth-secret=ENV_TURN_SHARED_SECRET
user-quota=12
total-quota=1200

# Security & Privacy Hardening
no-stdout-log
no-loopback-peers
no-multicast-peers
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=192.168.0.0-192.168.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
no-cli
no-telnet
fingerprint
```

---

## 3. Server Logging & Operational Auditing

1. **Application Logging Minimization**: Signaling daemon stdout prints only high-level operational lifecycle metrics (e.g. `[INFO] Server started on port 443`, `[WARN] Rate limit triggered on socket ID 412`).
2. **Prohibited Log Output**: Incoming JSON message payloads, public keys, SDP texts, ICE candidates, and client IP addresses must NEVER be written to server stdout or syslog.
3. **Log Rotation**: Host system `journald` and `logrotate` configured to retain rolling operational logs for a maximum of 24 hours before automatic purge.
