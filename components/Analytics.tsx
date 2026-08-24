"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { GA_ID, useConsent } from "@/lib/consent";

/**
 * Google Analytics 4, or nothing at all.
 *
 * Two gates, both of which have to open:
 *
 * 1. `NEXT_PUBLIC_GA_ID` is set. It is set only on the production deployment,
 *    so dev servers and previews cannot pollute the numbers.
 * 2. The reader has said yes. GA4 sets cookies and processes personal data,
 *    and for EEA and UK visitors that requires consent *before* the tag fires
 *    (REQUIREMENTS.md §16). Consent Mode with denied defaults would still put
 *    gtag.js on the page; not rendering it at all is simpler to reason about
 *    and matches how the video embeds already behave — if you never click,
 *    the third party is never contacted.
 *
 * `@next/third-parties` loads the script after hydration rather than blocking
 * first paint, and GA4 counts a pageview on every history change, so
 * client-side navigation between technique pages needs no wiring of our own.
 */
export default function Analytics() {
  const { consent } = useConsent();
  if (!GA_ID || consent !== "granted") return null;
  return <GoogleAnalytics gaId={GA_ID} />;
}
