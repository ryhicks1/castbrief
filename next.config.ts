import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  org: "castingbrief",
  project: "castingbrief",
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
});
