import type { NextConfig } from "next";

// Image thumbnails are optimized from the public R2 bucket only.
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");

// No CSP yet: Monaco's worker, next/image and inline styles need it tuned first.
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: R2_PUBLIC_URL ? [new URL(`${R2_PUBLIC_URL}/**`)] : [],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  devIndicators: false,
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
