# UI/UX Specification & Design Architecture — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 06 — Minimal UI/UX  
**Status**: Authoritative Design Specification  

---

## 1. Design Philosophy & Visual Identity

The user interface of **Between Us** communicates a single core idea: **TWO PEOPLE. ONE PRIVATE CONNECTION.**

The visual identity is designed to feel:
* **Private & Intimate**: Dark-first privacy aesthetic, generous negative space, soft depth, restrained gradients.
* **Calm & Distraction-Free**: Zero social feeds, zero notifications, zero ads, zero feature clutter.
* **Trustworthy & Honest**: Clear, non-deceptive security status messaging. Rejects false claims such as "Military Grade" or "100% Unhackable".
* **Fast & Mobile-First**: Single-column one-handed mobile focus with large touch targets (min 48px height).

---

## 2. Presentation Screen & State Inventory

The application defines 10 explicit presentation UI states:

```
[ HOME ] ──► [ CALL_CONNECTING ] ──► [ CALL_RINGING ] ──► [ CALL_CONNECTED ]
   ▲                                                             │
   │                                                             ▼
[ CALL_ENDED ] ◄── [ CALL_ENDING ] ◄──────────────────── [ CALL_RECONNECTING ]
   ▲
   ├─────────────────────────► [ CALL_ERROR ]
   └─────────────────────────► [ PERMISSION_ERROR ]
```

1. **`HOME`**: Default landing screen featuring brand header, security badge, partner identity card, and primary Audio/Video call buttons.
2. **`CALL_CONNECTING`**: Un-cluttered loading indicator ("Establishing private connection...").
3. **`CALL_RINGING`**: Presentation ringing state.
4. **`CALL_CONNECTED`**: Active media presentation shell (audio surface or video player shell).
5. **`CALL_RECONNECTING`**: Temporary reconnecting indicator.
6. **`CALL_ENDING`**: Transition teardown screen ("Closing private session...").
7. **`CALL_ENDED`**: Clean call-ended state ("Private session closed. Zero call history retained.").
8. **`CALL_ERROR`**: Privacy-conscious error display ("Unable to establish private connection").
9. **`PERMISSION_ERROR`**: Permission notice explaining why hardware access is required.
10. **`SECURITY_VERIFICATION`**: Visual placeholder component for HKDF-SHA256 Short Authentication String (SAS) fingerprint comparison (e.g. `A4B8 - 91F2`).

---

## 3. Component Architecture & Responsibilities

All presentation UI components reside under [`components/between-us/`](../../components/between-us/):

| Component File | Role / Responsibility |
| :--- | :--- |
| **[`HomeScreen.tsx`](../../components/between-us/HomeScreen.tsx)** | Assembles home layout with partner identity card and call actions. |
| **[`CallScreen.tsx`](../../components/between-us/CallScreen.tsx)** | Shell component for active call display and video/audio surfaces. |
| **[`ConnectionStatus.tsx`](../../components/between-us/ConnectionStatus.tsx)** | Status type definitions and badge for active call presentation states. |
| **[`SafetyVerification.tsx`](../../components/between-us/SafetyVerification.tsx)** | HKDF-SHA256 SAS fingerprint verification modal component. |
| **[`ErrorState.tsx`](../../components/between-us/ErrorState.tsx)** | Privacy-conscious error UI without internal stack traces or secrets. |

---

## 4. Accessibility & Mobile Standards (WCAG 2.1 AA)

* **Keyboard Navigation**: All interactive elements (`CallButton`, `CallControls`, state toggles) have visible focus indicators (`focus:ring-4 focus:ring-blue-500/50`) and full keyboard navigation.
* **Screen Reader Labels**: Every button includes an explicit `aria-label` or visible accessible text label.
* **Color & Contrast**: High-contrast text ratios (white/blue-400 text on dark gray/black backgrounds). Security statuses use distinct text labels in addition to color dots (`no color-only status`).
* **Reduced Motion**: Respects `prefers-reduced-motion` settings. Loading spinners and pulses use subtle CSS animations.

---

## 5. Honest Security Copy Policy

| Forbidden / Misleading Claim | Approved Privacy-Conscious Wording |
| :--- | :--- |
| ❌ "Military Grade Encryption ✓" | **✓ "Private Connection"** |
| ❌ "100% Unhackable & Anonymous" | **✓ "Data-Minimized Architecture"** |
| ❌ "Impossible to Record Calls" | **✓ "Zero Application Call Retention"** |
| ❌ "Verified Secure" (Before Code Check) | **✓ "Security Status: UNKNOWN / DEMO"** |

---

## 6. Strictly Prohibited UI Features

```
❌ PROHIBITED UI FEATURES
----------------------------------------------------------------------
1. NO Call History / Recents Lists / Call Logs
2. NO User Profiles / Public Avatars / Biographies
3. NO Social Features (Feeds, Likes, Comments, Followers)
4. NO Chat / Text Messaging Windows
5. NO Media Upload / Attachment Pickers
6. NO Third-Party Analytics / Tracking Scripts
```
