# Public Release Checklist — Between Us

Complete every required manual check below before switching `KrisCode180402/BetweenUs` from **Private** to **Public** on GitHub.

## 1. Security & Credential Exposure Gate
- [ ] **Supabase Project Audit & Key Rotation**: Commit `2a30c1e` (and URL refs in `1afc2a1`, `19c6b13`, `256cea8`) previously contained a hardcoded Supabase project URL and `anon` JWT key in `lib/supabase/client.ts`.
  - [ ] Verify strict Row Level Security (RLS) policies on `device_identities`, `pairing_sessions`, `couples`, and `couple_members`, **or** migrate your personal production deployment to a separate Supabase project.
  - [ ] Rotate the exposed Supabase project keys if appropriate.
- [ ] **Git History Decision**: Decide whether to:
  - Keep current commit history (after rotating/isolating the Supabase project and verifying no private data remains), **or**
  - Rewrite Git history (e.g., with `git-filter-repo`) to scrub historical `lib/supabase/client.ts` values, `Images/`, `Sound/`, `BETWEEN US.txt`, and personal commit author email (`KrishanKumar940097@gmail.com`) before pushing to a public repo.
- [ ] **GitHub Branch Cleanup**: Review the 10 remote branches visible on GitHub (`KrisCode180402/BetweenUs`) and delete obsolete development branches before going public.
- [ ] **Untracked Local Folder**: Move the untracked local `Between Us idea/` folder outside the repository working directory so it is never accidentally committed.

## 2. Dependency Vulnerabilities
- [ ] Review `npm audit --audit-level=high` output (currently reports `next`, `postcss`, `sharp`, `source-map-js`, and `brace-expansion` advisories — see [`BETWEEN_US_PUBLIC_RELEASE_READINESS_REPORT.md`](./BETWEEN_US_PUBLIC_RELEASE_READINESS_REPORT.md)).
- [ ] Plan a targeted `next` / transitive dependency security update PR and re-verify `npm run build` and `npm test` so the CI `npm audit --audit-level=high` gate passes on GitHub Actions.

## 3. Licensing & Asset Rights
- [ ] Review [`LICENSE_OPTIONS.md`](./LICENSE_OPTIONS.md), select a license (or confirm All Rights Reserved), add `LICENSE` if applicable, and update `README.md`.
- [ ] Verify redistribution rights for `public/sounds/incoming-ringtone.mp3`, `public/sounds/outgoing-ringtone.mp3`, and `public/images/*.png`.

## 4. GitHub Repository Settings (Before or Immediately Upon Publishing)
- [ ] Enable **GitHub Private Vulnerability Reporting** (`Settings → Code security and analysis → Private vulnerability reporting`).
- [ ] Enable **Secret Scanning** and **Push Protection** (`Settings → Code security and analysis`).
- [ ] Enable **Dependabot alerts** and **Dependabot security updates**.
- [ ] Configure **Branch Protection** on `main` (require pull requests, require CI status checks, disallow force pushes).
- [ ] Update the GitHub repository **About** description to accurately describe the project (e.g., *"Private 1-to-1 WebRTC audio & video calling PWA built with Next.js, TypeScript, and Supabase Realtime"*) and confirm whether the live Vercel preview link should remain public.
- [ ] Merge `release/public-release-prep` into `main` after final review, then switch visibility to **Public** only when all critical items above are checked off.
