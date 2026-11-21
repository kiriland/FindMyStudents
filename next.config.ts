import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    agentUpgrade: "security",
    serverActions: {
      // CloudFront forwards the Lambda origin's host, not the public one, so
      // without this every Server Action from the site fails the CSRF check.
      // Keep in step with `app_origins` in infrastructure/profiles/variables.tf.
      allowedOrigins: ["findmystudents.com", "www.findmystudents.com"],
    },
  },
  turbopack: {
    rules: {
      // Only the global entry imports Tailwind. Passing CSS Modules through
      // this rule's `as` mapping turns them into ordinary, unscoped CSS.
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
