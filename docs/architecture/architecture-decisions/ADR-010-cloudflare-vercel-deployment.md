# ADR-010: Cloudflare + Vercel Deployment Architecture

* **Status**: Approved
* **Date**: 2026-09-13
* **Context**: The frontend PWA requires high-availability global static delivery with strict edge security filtering (DDoS mitigation, WAF, HSTS preloading).
* **Decision**: We adopt Vercel serverless edge runtime for hosting Next.js static PWA bundles, fronted by Cloudflare DNS/WAF edge proxying for security filtering and strict HSTS enforcement.
* **Consequences**:
  * Positive: Global CDN latency optimization, automated SSL/TLS 1.3 edge termination, robust DDoS mitigation, seamless GitHub Actions integration.
  * Negative: Requires configuring Cloudflare CNAME flattening and proxy rules for Vercel edge deployment targets.
