import type { NextConfig } from "next";

// External origins the app actually connects to.
// Keep this list up to date when adding new integrations.
const CONNECT_SRC = [
  "'self'",
  "https://api.instantdb.com",
  "wss://api.instantdb.com",
  "https://api.github.com",
].join(" ");

const FRAME_SRC = [
  "'self'",
  "https://open.spotify.com",
  "https://www.youtube-nocookie.com",
  "https://platform.twitter.com",
  "https://www.google.com",       // Google Maps embed
  "https:",                        // PDF / arbitrary https iframes
].join(" ");

const IMG_SRC = [
  "'self'",
  "data:",
  "blob:",
  "https:",                        // OG images, favicons, user-pasted images
].join(" ");

const csp = [
  "default-src 'self'",
  // Next.js requires 'unsafe-inline' for its runtime script injection.
  // Migrate to nonce-based CSP for stricter control when ready.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `img-src ${IMG_SRC}`,
  "font-src 'self' data:",
  `connect-src ${CONNECT_SRC}`,
  `frame-src ${FRAME_SRC}`,
  // Prevent this app from being embedded in other origins (clickjacking).
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // Belt-and-suspenders anti-clickjacking (for browsers ignoring CSP frame-ancestors).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
