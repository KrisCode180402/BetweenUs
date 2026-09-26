# ADR-008: Absolute Exclusion of Analytics, Telemetry, and Tracking SDKs

* **Status**: Approved
* **Date**: 2026-09-13
* **Context**: Modern web applications frequently embed third-party analytics (Google Analytics, Mixpanel, Sentry) that transmit telemetry, IP metadata, and user behavior to external servers.
* **Decision**: We explicitly prohibit including any third-party or custom analytics, event tracking, crash reporting, or telemetry SDKs anywhere within the frontend client or backend server runtimes.
* **Consequences**:
  * Positive: Zero user tracking, zero data exfiltration to third parties, improved client load performance, strict adherence to privacy goals.
  * Negative: Operational debugging relies on localized error states and voluntary user feedback rather than automated crash reports.
