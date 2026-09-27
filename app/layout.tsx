import type { Metadata, Viewport } from "next";
import { Outfit, Caveat } from "next/font/google";
import "./globals.css";
import { SWRegister } from "@/components/between-us/SWRegister";
import { ErrorBoundary } from "@/components/between-us/ErrorBoundary";
import { InstallPrompt } from "@/components/between-us/InstallPrompt";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-script",
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Between Us — Two People. One Private Connection.",
  description:
    "Security-focused, privacy-preserving 1-to-1 WebRTC audio and video calling PWA.",
  applicationName: "Between Us",
  manifest: "/manifest.json",
  authors: [{ name: "Between Us Team" }],
  referrer: "no-referrer",
  robots: "noindex, nofollow",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Between Us",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#060B14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`dark ${outfit.variable} ${caveat.variable}`}>
      <body suppressHydrationWarning className="antialiased bg-[#060B14] text-gray-100 font-outfit selection:bg-teal-500 selection:text-white min-h-screen safe-area-inset">
        <ErrorBoundary>
          <main className="min-h-screen flex flex-col items-center justify-center">
            {children}
          </main>
          <InstallPrompt />
          <SWRegister />
        </ErrorBoundary>
      </body>
    </html>
  );
}
