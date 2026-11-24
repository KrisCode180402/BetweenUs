# Public Release Inventory — Between Us

This inventory classifies all files inspected across the Between Us repository prior to public GitHub release preparation, along with the verified action taken for each category.

## Classification Summary

| Category | Description | Action Taken |
| :--- | :--- | :--- |
| **A. Essential Application Code** | `app/`, `components/`, `lib/`, `server/signaling/` | Preserved; removed 4 confirmed unreferenced files (`Brand.tsx`, `permission-manager.ts`, `lib/safety/index.ts`, `lib/signaling/index.ts`); removed hardcoded Supabase fallback credentials and hardcoded personal names/404 avatars; fixed 2 ESLint hook dependency warnings. |
| **B. Application Assets** | `public/images/*`, `public/sounds/*`, `public/icons/*`, `public/favicon.*`, `public/apple-touch-icon.png` | Preserved all active runtime assets; removed 1 unreferenced icon (`public/icons/tab-icon-192x192.png`). |
| **C. Required Configuration** | `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `.eslintrc.json`, `postcss.config.mjs`, `.nvmrc`, `.gitignore`, `.env.example`, `.editorconfig`, `public/manifest.*`, `public/sw.js`, `.github/*` | Preserved and hardened; moved `@types/web-push` to `devDependencies`; added `.editorconfig`, expanded `.env.example`, hardened `.gitignore`, SHA-pinned CI workflow actions, and added GitHub issue templates. |
| **D. Tests** | `tests/**/*.test.ts` (20 test files, 133 tests) | Preserved intact (all 133 tests passing). |
| **E. Documentation** | `README.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `docs/architecture/`, `docs/security/`, `docs/privacy/`, `docs/design/`, `docs/development/`, `docs/infrastructure/`, `docs/protocol/`, `docs/testing/`, `docs/release/` | Rewrote `README.md` to accurately reflect the current codebase; added `docs/architecture/README.md`, `docs/security/SECURITY_OVERVIEW.md`, and `docs/release/*`; fixed hardcoded local `file:///x:/...` paths in 6 existing docs. |
| **F. Development / Reference Materials** | `Images/` (10 PNGs), `Sound/` (2 MP3s), `BETWEEN US.txt` (124 KB raw AI phase prompt transcript), untracked `Between Us idea/` | Removed tracked `Images/` and `Sound/` (~17.3 MB of unreferenced UI mockups and duplicate raw assets); archived `BETWEEN US.txt` locally in gitignored `scratch/preserved-internal-reports/` and removed from Git tracking; left untracked `Between Us idea/` untouched locally with instructions to relocate outside the repository folder before publishing. |
| **G. Unused Assets** | `public/icons/tab-icon-192x192.png`, `Images/*`, `Sound/*` | Removed from Git tracking (details in [`ASSET_CLEANUP_REPORT.md`](./ASSET_CLEANUP_REPORT.md)). |
| **H. Generated Artifacts** | `tsconfig.tsbuildinfo`, `.next/` | Removed tracked `tsconfig.tsbuildinfo` and added `*.tsbuildinfo` and `.vercel` to `.gitignore`. |
| **I. Temporary Files** | `scratch/` (already gitignored) | Kept gitignored locally; never tracked. |
| **J. Potentially Sensitive / Internal Files** | `.env.local` (ignored), hardcoded fallback URL/anon key in `lib/supabase/client.ts`, personal names in UI defaults, internal audit reports (`docs/security/final-audit/*`, `docs/security/github-security*.md`, `docs/security/crypto-review-results.md`, `docs/security/privacy-mode-test-report.md`, `docs/privacy/forensic-results.md`) | Verified `.env.local` is never tracked; removed hardcoded Supabase fallback URL/anon key from `lib/supabase/client.ts`; removed personal names from UI components; archived internal audit reports locally in gitignored `scratch/preserved-internal-reports/` and replaced public summary with `docs/security/SECURITY_OVERVIEW.md`. Flagged historical Git commits for owner review/rotation. |

---

## Detailed File Inventory by Area

### 1. Application Routes (`app/`) — Category A (Preserved)
- `app/layout.tsx`, `app/globals.css`, `app/error.tsx`, `app/manifest.ts`
- Entry & Home: `app/page.tsx`, `app/home/page.tsx`
- Pairing: `app/pairing/page.tsx`
- Calling: `app/call/audio/page.tsx`, `app/call/video/page.tsx`, `app/audio/page.tsx`, `app/video/page.tsx`
- Diagnostics & Error: `app/connection-error/page.tsx`, `app/error/page.tsx`
- Settings: `app/settings/page.tsx`, `app/settings/{device,notifications,pairing,permissions,privacy,reset,security}/page.tsx`
- Dev Utility: `app/pwa-debug/page.tsx` (preserved for PWA diagnostics; documented as a development utility in `README.md`)
- API Routes: `app/api/health/route.ts`, `app/api/push/{public-key,subscribe,send}/route.ts`, `app/api/turn/credentials/route.ts`

### 2. UI Components (`components/`) — Category A
- **Preserved (32 files):** `components/between-us/*` (ActiveCallBanner, AudioVisualizer, CallActions, CallOptionsModal, CallScreen, ConnectionStatus, ErrorBoundary, ErrorState, GlobalIncomingCallHandler, HomeHeader, HomeScreen, IncomingCallModal, InstallPrompt, PartnerConnection, PrivacyOverlay, SWRegister, SafetyVerification, SecurityCard, SettingsModal), `components/between-us/connection/*` (4 files), `components/between-us/settings/*` (3 files), `components/pairing/*` (6 files).
- **Removed (1 file):** `components/between-us/Brand.tsx` — zero imports or JSX references anywhere in `app/`, `components/`, `lib/`, or `tests/`.
- **Sanitized (4 files):** `PartnerStatusCard.tsx`, `SettingsScreen.tsx`, `HomeScreen.tsx`, `CallScreen.tsx` — removed personal names (`Kris`/`Jona`), broken 404 avatar paths, and reference-screenshot comments.

### 3. Core Libraries & Signaling Server (`lib/`, `server/`) — Category A
- **Preserved Active Modules:** `lib/crypto/*`, `lib/pairing/*`, `lib/safety/*`, `lib/signaling/{supabase-signaling,client,types,validator}.ts`, `lib/webrtc/*`, `lib/supabase/client.ts`, `lib/turn/*`, `lib/push/*`, `lib/permissions/media-permissions.ts`, `lib/sound/ringtone.ts`, `lib/storage/*`, `lib/privacy/*`, `lib/connection/diagnostics.ts`, `server/signaling/*` (retained because tested by `tests/signaling/`, `tests/infrastructure/`, `tests/privacy/`, and documented as an optional/legacy self-hosted WebSocket signaling implementation).
- **Removed (3 confirmed unreferenced files):**
  - `lib/permissions/permission-manager.ts` (0 imports; duplicate of `lib/permissions/media-permissions.ts`)
  - `lib/safety/index.ts` (0 imports; unused barrel)
  - `lib/signaling/index.ts` (0 imports; unused barrel)
- **Sanitized (1 file):** `lib/supabase/client.ts` — removed hardcoded production Supabase URL and anon key fallbacks.

### 4. Internal Reports Preserved Locally & Untracked (Category F & J)
Copied to gitignored `scratch/preserved-internal-reports/` and removed from Git tracking:
- `BETWEEN US.txt` (internal Phase 01–05 prompt transcript)
- `docs/security/final-audit/` (19 internal Phase 25 audit files with outdated pre-Supabase architecture claims and internal audit scores)
- `docs/security/github-security.md` (explicitly marked `Visibility: Private` and tailored to private repo governance)
- `docs/security/github-security-checklist.md` (internal release checklist with outdated metrics)
- `docs/security/crypto-review-results.md` (internal Phase 20 review artifact)
- `docs/security/privacy-mode-test-report.md` (internal Phase 22 test artifact)
- `docs/privacy/forensic-results.md` (internal Phase 19 test artifact)

All 10 security documentation files verified by `tests/infrastructure/infrastructure-hardening.test.ts` and `tests/infrastructure/supply-chain.test.ts` were preserved intact.

### 5. Untracked Local Materials (Not Modified, Not Committed)
- `Between Us idea/` (~17.67 MB: `Between Us Implementation.pdf`, `Between Us Implementation.docx`, `Between Us.docx`, `Between Us.png`) — personal planning documents; move outside the repository directory before publishing.
- `.env.local` — local environment configuration (gitignored).
- `scratch/` — local scratch images and preserved internal reports archive (gitignored).
