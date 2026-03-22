import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kepbueypzbgveqwazljk.supabase.co",
      },
    ],
    minimumCacheTTL: 86400,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [64, 96, 128, 256, 384],
  },
};

export default withSentryConfig(nextConfig, {
  org: "castingbrief",
  project: "castingbrief",
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
});
