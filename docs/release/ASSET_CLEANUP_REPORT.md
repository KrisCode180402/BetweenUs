# Asset Cleanup Report — Between Us

This report documents every image, icon, and audio asset reviewed and removed during public GitHub release preparation, along with verification that all required runtime and PWA assets were preserved.

## Summary

- **Tracked asset files removed:** 13 files (~17.34 MB reclaimed from repository working tree)
- **Required runtime assets preserved:** 16 static asset files in `public/` (2 illustrations, 2 ringtones, 12 PWA/favicon icons)
- **Runtime regressions:** None (0 broken imports, 0 missing manifest/SW assets, 133/133 tests passing)

---

## Removed Assets (Tracked in Git)

| Original Filename | Original Location | Size | Referenced? | Reason for Removal | Runtime Dependency Check |
| :--- | :--- | ---: | :--- | :--- | :--- |
| `1 Pairing page.png` | `Images/UI UX/1 Pairing page.png` | 1.29 MB | No | Design-reference mockup used during UI development | Confirmed 0 imports/refs across `app/`, `components/`, `lib/`, `public/`, `tests/` |
| `2 Home page.png` | `Images/UI UX/2 Home page.png` | 1.24 MB | No | Design-reference mockup used during UI development | Confirmed 0 imports/refs across codebase |
| `3 Audio page.png` | `Images/UI UX/3 Audio page.png` | 1.09 MB | No | Design-reference mockup used during UI development | Confirmed 0 imports/refs across codebase |
| `4 Video page.png` | `Images/UI UX/4 Video page.png` | 1.38 MB | No | Design-reference mockup used during UI development | Confirmed 0 imports/refs across codebase |
| `5 Settings page.png` | `Images/UI UX/5 Settings page.png` | 1.13 MB | Comment only (`SettingsScreen.tsx`) | Design-reference mockup used during UI development | Confirmed 0 runtime imports; removed stale comment |
| `6 Error Page.png` | `Images/UI UX/6 Error Page.png` | 1.05 MB | No | Design-reference mockup used during UI development | Confirmed 0 imports/refs across codebase |
| `Background.png` | `Images/UI UX/Background.png` | 1.98 MB | Comment only (`HomeScreen.tsx`) | Exact byte-for-byte duplicate of `public/images/background.png` | Active runtime asset preserved at `public/images/background.png` |
| `Backround with person1.png` | `Images/UI UX/Backround with person1.png` | 1.71 MB | No | Exact byte-for-byte duplicate of `public/images/background-person.png` | Active runtime asset preserved at `public/images/background-person.png` |
| `app icon.png` | `Images/app icon.png` | 1.31 MB | No | Unreferenced raw source artwork (generated PWA icons exist in `public/icons/`) | Confirmed 0 imports/refs across codebase |
| `tab icon.png` | `Images/tab icon.png` | 988 KB | No | Unreferenced raw source artwork (generated favicons exist in `public/`) | Confirmed 0 imports/refs across codebase |
| `Incomming ringtone.mp3` | `Sound/Incomming ringtone.mp3` | 2.65 MB | No | Exact byte-for-byte duplicate of `public/sounds/incoming-ringtone.mp3` | Active runtime audio preserved at `public/sounds/incoming-ringtone.mp3` |
| `Outgoing ringtone.mp3` | `Sound/Outgoing ringtone.mp3` | 1.52 MB | No | Exact byte-for-byte duplicate of `public/sounds/outgoing-ringtone.mp3` | Active runtime audio preserved at `public/sounds/outgoing-ringtone.mp3` |
| `tab-icon-192x192.png` | `public/icons/tab-icon-192x192.png` | 51 KB | No | Unreferenced icon not listed in `app/layout.tsx`, manifests, `sw.js`, or tests | Confirmed 0 imports/refs across entire repository |

---

## Preserved Application Assets (`public/`)

| Asset Path | Runtime / PWA Usage | Privacy & Content Check |
| :--- | :--- | :--- |
| `public/images/background.png` | Home, CallScreen, Settings, ConnectionErrorPage | Stylized starry-sky landscape illustration; no personal photos or PII |
| `public/images/background-person.png` | Pairing page (`app/pairing/page.tsx`) | Stylized digital illustration (back-view silhouettes); no real photographs or PII |
| `public/sounds/incoming-ringtone.mp3` | `lib/sound/ringtone.ts`, `SettingsScreen.tsx` | Active incoming call ringtone (verify third-party audio redistribution license before publishing) |
| `public/sounds/outgoing-ringtone.mp3` | `lib/sound/ringtone.ts`, `SettingsScreen.tsx` | Active outgoing call ringtone (verify third-party audio redistribution license before publishing) |
| `public/icons/icon-192x192.png`, `icon-512x512.png` | Manifests, `public/sw.js`, Push notifications, `tests/pwa/pwa.test.ts` | Required PWA app icons |
| `public/icons/maskable-icon-192x192.png`, `maskable-icon-512x512.png` | Manifests, `public/sw.js`, `tests/pwa/pwa.test.ts` | Required PWA maskable icons |
| `public/icons/apple-touch-icon.png`, `public/apple-touch-icon.png` | `app/layout.tsx`, `public/sw.js`, iOS root fallback | Required Apple touch icon |
| `public/icons/tab-icon-16x16.png`, `tab-icon-32x32.png`, `tab-icon-48x48.png` | `app/layout.tsx` | Required browser tab icons |
| `public/favicon.ico`, `public/favicon.png` | `app/layout.tsx` | Required browser favicons |

---

## Broken Asset References Fixed in Code

- `components/between-us/settings/PartnerStatusCard.tsx` previously defaulted `myAvatarUrl` and `partnerAvatarUrl` to non-existent `/images/user_avatar_kris.png` and `/images/partner_avatar_jona.png`. Both defaults were removed so the component falls back cleanly to its built-in monogram avatar without 404 requests or personal names.

---

## Untracked Local Assets (Not Committed)

- `Between Us idea/Between Us.png` (untracked) and `scratch/top_*.png` (gitignored) were left untouched on the local workstation and are excluded from Git tracking.
