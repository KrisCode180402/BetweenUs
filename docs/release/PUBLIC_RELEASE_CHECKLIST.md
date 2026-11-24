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
- [x] **Untracked Local Folder**: Moved untracked `Between Us idea/` outside the repository directory (`x:\Personal Projects\Between Us idea`).

## 2. Dependency Vulnerabilities
- [x] Resolved all 11 `npm audit` advisories (`next` upgraded to `15.5.29`, `postcss` overridden to `^8.5.28`, `minimatch@3 > brace-expansion` overridden to `^1.1.22`); `npm audit --audit-level=high` now reports **0 vulnerabilities** and all checks (`type-check`, `lint`, 133 tests, `build`) pass.

## 3. Licensing & Asset Rights
- [x] Selected **MIT License** (`LICENSE` added to repository root and `README.md` updated).
- [ ] Confirm redistribution rights for `public/sounds/incoming-ringtone.mp3`, `public/sounds/outgoing-ringtone.mp3`, and `public/images/*.png`.

## 4. GitHub Repository Settings (Before or Immediately Upon Publishing)
- [ ] Enable **GitHub Private Vulnerability Reporting** (`Settings → Code security and analysis → Private vulnerability reporting`).
- [ ] Enable **Secret Scanning** and **Push Protection** (`Settings → Code security and analysis`).
- [ ] Enable **Dependabot alerts** and **Dependabot security updates**.
- [ ] Configure **Branch Protection** on `main` (require pull requests, require CI status checks, disallow force pushes).
- [ ] Update the GitHub repository **About** description to accurately describe the project (e.g., *"Private 1-to-1 WebRTC audio & video calling PWA built with Next.js, TypeScript, and Supabase Realtime"*) and confirm whether the live Vercel preview link should remain public.
- [ ] Merge `release/public-release-prep` into `main` after final review, then switch visibility to **Public** only when all critical items above are checked off.
