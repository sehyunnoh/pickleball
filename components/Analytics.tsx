import { GoogleAnalytics } from "@next/third-parties/google";

/**
 * Google Analytics 4, or nothing at all.
 *
 * Rendering is gated on `NEXT_PUBLIC_GA_ID` so that dev servers, previews and
 * anyone's local build stay clean — you should not be able to pollute the
 * production numbers by running `npm run dev`. Set the variable only on the
 * production deployment.
 *
 * `@next/third-parties` loads gtag.js after hydration rather than blocking
 * first paint, and GA4 records a pageview whenever the history state changes,
 * so client-side navigation between technique pages is counted without any
 * wiring of our own.
 *
 * NOTE ON CONSENT: GA4 sets cookies and processes personal data. This site is
 * written for a global English-speaking audience, which means EEA and UK
 * visitors, which means consent is legally required *before* the tag fires.
 * Nothing here implements that yet — see docs/REQUIREMENTS.md §16. Until it
 * does, leaving the variable unset is the safe default, and it is unset.
 */
export default function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id) return null;
  return <GoogleAnalytics gaId={id} />;
}
