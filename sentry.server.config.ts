import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://8acfc711690bbea2f0db0c6048ec1b45@o4511085056098304.ingest.us.sentry.io/4511085097844736",
  tracesSampleRate: 0.1,
  debug: false,
});
