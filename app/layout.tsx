import type { Metadata, Viewport } from "next";
import { Outfit, Dancing_Script } from "next/font/google";
import "./globals.css";
import { SWRegister } from "@/components/between-us/SWRegister";
import { ErrorBoundary } from "@/components/between-us/ErrorBoundary";
import { InstallPrompt } from "@/components/between-us/InstallPrompt";
import { GlobalIncomingCallHandler } from "@/components/between-us/GlobalIncomingCallHandler";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-script",
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Between Us — Two People. One Private Connection.",
  description: "Private communication for just the two of us.",
  applicationName: "Between Us",
  manifest: "/manifest.webmanifest",
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
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
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
    <html lang="en" suppressHydrationWarning className={`dark ${outfit.variable} ${dancingScript.variable} h-full overflow-hidden overscroll-none`}>
      <body suppressHydrationWarning className="antialiased bg-[#060B14] text-gray-100 font-outfit selection:bg-teal-500 selection:text-white h-dvh min-h-dvh max-h-dvh w-full overflow-hidden overscroll-none fixed inset-0 safe-area-inset">
        <ErrorBoundary>
          <main className="h-full w-full flex flex-col items-center justify-center overflow-hidden">
            {children}
          </main>
          <GlobalIncomingCallHandler />
          <InstallPrompt />
          <SWRegister />
        </ErrorBoundary>
      </body>
    </html>
  );
}

