import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Strict Content Security Policy
const cspHeader = `
  default-src 'none';
  script-src 'self' ${isProd ? "" : "'unsafe-inline' 'unsafe-eval'"};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  media-src 'self' blob:;
  connect-src 'self' wss://signaling.betweenus.app https://turn.betweenus.app ${isProd ? "" : "ws: wss: http: https:"};
  font-src 'self' data:;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'none';
  ${isProd ? "upgrade-insecure-requests;" : ""}
`.replace(/\s{2,}/g, " ").trim();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(self), microphone=(self), geolocation=(), display-capture=(), payment=(), usb=(), bluetooth=(), serial=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
