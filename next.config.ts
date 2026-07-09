import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino", "pino-pretty"],
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sentryUrl: process.env.GLITCHTIP_URL,
  silent: !process.env.CI,
  // Disable source map uploads when no auth token is configured (local dev / CI
  // without secrets). GlitchTip is self-hosted; Sentry uploads are optional.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
