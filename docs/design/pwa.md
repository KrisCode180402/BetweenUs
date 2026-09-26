# Progressive Web App (PWA) Design & User Experience

## 1. Design Overview
The **Between Us** PWA converts the web application into a dedicated, privacy-focused standalone application on mobile and desktop devices. The experience reflects the core philosophy: **"Two People. One Private Connection."**

---

## 2. Web App Manifest & Branding
- **App Name:** Between Us
- **Short Name:** Between Us
- **Tagline:** Two People. One Private Connection.
- **Theme Color:** `#090d16` (Deep Midnight Dark)
- **Background Color:** `#090d16`
- **Display Mode:** `standalone` (Hides browser navigation bars for an immersive, native app feel).
- **Start URL:** `/`

---

## 3. Visual Assets & Icons
- **Primary Icon (192x192):** `/icons/icon-192x192.png` — Two glowing connected nodes (Cyan `#06b6d4` & Emerald `#10b981`).
- **High-Res Icon (512x512):** `/icons/icon-512x512.png`.
- **Maskable Icon (512x512):** `/icons/maskable-icon-512x512.png` — Safe-zone aligned icon for adaptive Android icon shapes (circle, squircle, teardrop).

---

## 4. Offline Shell & Connectivity Experience
- **Offline State:** When offline, the application shell loads safely from static cache.
- **Messaging:** Displays a clear, calm status indicator: *"You're offline. Reconnect to make a private call."*
- **No Delayed Actions:** Calls and real-time connections require an active network; no delayed or queued communication is recorded offline.

---

## 5. Update Experience
- **Unobtrusive Updates:** When an updated Service Worker version is fetched in the background, a subtle Toast banner appears (`SWRegister.tsx`) offering an *"Update Now"* action.
- **Call Safety (Future Phase Requirement):** Service Worker update execution will defer until any active call session completes.

---

## 6. Responsive & Mobile-First UX
- Fully responsive across mobile viewports, tablets, and desktop windows.
- Touch targets exceed 44x44px minimum accessibility standards.
- Dark mode theme `#090d16` minimizes battery consumption on OLED screens.

---

## 7. Privacy & Permission Integrity
- Installing the PWA requests **no permissions** (no camera, microphone, or push notification prompts upon installation).
- Zero remote analytics, tracking scripts, or external font/CDN calls.
