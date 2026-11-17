import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // All data is fetched client-side through src/services, so every route is
  // rendered as a regular client-driven page.
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
