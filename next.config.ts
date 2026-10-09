import type { NextConfig } from "next";
import { RESUME_PATH } from "./src/lib/resume";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // AVIF first (smaller), WebP fallback: parent spec §2.
  images: { formats: ["image/avif", "image/webp"] },
  // The resume names clients (owner-approved); keep it out of search results.
  async headers() {
    return [
      {
        source: RESUME_PATH,
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
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
};

export default nextConfig;
