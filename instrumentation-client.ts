// Client-side Sentry init. Next.js 15.2+ loads this module in the browser.
// Side-effect import runs Sentry.init() at module load, before any error
// boundary renders, so `Sentry.captureException` (e.g. from global-error.tsx)
// is wired and ready to send.
import "./sentry.client.config";
import * as Sentry from "@sentry/nextjs";

// Instrument client-side route transitions (navigation breadcrumbs / spans).
// Required by @sentry/nextjs to avoid the "ACTION REQUIRED" boot warning.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
