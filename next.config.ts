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

// 'unsafe-eval' is only needed by the dev server (React Refresh / eval source maps);
// production builds run without it. 'unsafe-inline' stays for Next.js's runtime
// script injection — migrate to nonce-based CSP for stricter control when ready.
const isDev = process.env.NODE_ENV !== "production";
const SCRIPT_SRC = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

const csp = [
  "default-src 'self'",
  SCRIPT_SRC,
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
  experimental: {
    // Transform named imports into direct submodule imports at build time so only
    // the components actually used are bundled. `lucide-react` is already optimized
    // by default in Next 16; `framer-motion` is the one we add explicitly.
    optimizePackageImports: ["framer-motion"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // Force HTTPS for a year, including subdomains. Safe on Vercel/most hosts
          // which serve the app exclusively over TLS.
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
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
