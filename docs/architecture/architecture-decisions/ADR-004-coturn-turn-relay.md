# ADR-004: Coturn Daemon for Dedicated TURN Relay

* **Status**: Approved
* **Date**: 2026-09-13
* **Context**: Peer-to-peer WebRTC connections fail when both endpoints are behind restrictive firewalls or symmetric NATs. A relay server is required.
* **Decision**: We deploy the open-source `coturn` TURN daemon on a dedicated hardened Linux VPS, authenticated via short-lived HMAC-SHA-1 REST API tokens (15m TTL).
* **Consequences**:
  * Positive: Standard compliance (RFC 5766/8489), high throughput, coturn possesses zero media decryption keys (relays encrypted SRTP UDP packets only).
  * Negative: Requires dedicated VPS bandwidth and strict iptables firewall management.
