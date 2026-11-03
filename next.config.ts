import type { NextConfig } from "next";

// Image thumbnails are optimized from the public R2 bucket only.
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");

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
};

export default nextConfig;
