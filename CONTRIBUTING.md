# Contributing to Between Us

Thank you for your interest in contributing to **Between Us**. This project prioritizes privacy, minimal dependencies, strict TypeScript safety, and honest security engineering.

---

## Ways to Contribute

- **Bug reports**: Reproduce and document issues using the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.yml).
- **Feature proposals**: Propose focused improvements that fit the 1-to-1 private calling mission using the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.yml).
- **Documentation & tests**: Improve architecture docs, browser compatibility notes, and automated test coverage.
- **Security improvements**: For vulnerabilities, **never** open a public issue or PR — follow [`SECURITY.md`](SECURITY.md).

---

## Development Guidelines

### Prerequisites
- Node.js `>=20.0.0` (Node 20 LTS or Node 24 LTS recommended)
- npm with lockfile installation (`npm ci`)
- A personal Supabase project for testing pairing and Realtime signaling locally

### Local Workflow
1. Fork the repository and create a topic branch from `main`:
   ```bash
   git checkout -b fix/short-description
   ```
2. Install dependencies deterministically:
   ```bash
   npm ci
   ```
3. Copy `.env.example` to `.env.local` and configure your own development Supabase project (never commit `.env.local` or real credentials).
4. Make focused, minimal changes that respect the project's privacy and architecture boundaries.

### Engineering Standards
- **TypeScript Strict Mode**: Keep `npm run type-check` passing with zero errors.
- **No Forbidden Dependencies**: Do not add analytics, telemetry, ad SDKs, call recording libraries, or unnecessary runtime dependencies.
- **UI Permission Boundaries**: Keep direct media-device access encapsulated in `lib/` modules rather than UI presentation components (enforced by `tests/ui/components.test.ts`).
- **Safe Logging**: Never log SDP payloads, ICE candidates, private keys, pairing codes, or tokens. Use `AppLogger` in `lib/privacy/logger.ts`.
- **Honest Security Copy**: Avoid unverifiable marketing claims (e.g., "100% secure", "military grade", "unhackable").

### Required Validation Before Opening a Pull Request

Run all checks locally and ensure they pass:

```bash
npm run type-check
npm run lint
npm test
npm run build
```

---

## Pull Request Process

1. Keep pull requests small and scoped to a single concern.
2. Clearly explain **what** changed, **why** it is needed, and **how** you tested it (including desktop/mobile browser details for WebRTC or PWA changes).
3. Update documentation whenever behavior, routes, environment variables, or architecture change.
4. Security-sensitive paths (`/lib/crypto/`, `/lib/webrtc/`, `/lib/signaling/`, `/lib/pairing/`, `/lib/safety/`, `/next.config.*`, `/.github/`) require review from the repository owner (`@KrisCode180402`) as defined in [`.github/CODEOWNERS`](.github/CODEOWNERS).

---

## Code of Conduct

All contributors and participants are expected to follow the [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
