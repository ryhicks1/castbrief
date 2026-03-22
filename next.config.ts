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
  },
};

export default withSentryConfig(nextConfig, {
  org: "castingbrief",
  project: "castingbrief",
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
});
