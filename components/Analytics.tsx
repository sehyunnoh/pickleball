import { Analytics as VercelAnalytics } from "@vercel/analytics/next";

/**
 * Vercel Web Analytics.
 *
 * It replaced GA4 on 2026-09-17, and the reason was the consent bar. GA4 sets
 * cookies and processes personal data, so for EEA and UK visitors the tag
 * cannot fire until someone presses Allow — and almost nobody presses Allow.
 * The numbers were not low, they were empty: the only thing GA4 measured was
 * how many people answered a question they had no reason to care about.
 *
 * This counts everybody instead, because there is nothing to consent to. No
 * cookie is set and no identifier is stored: a visitor is a hash of the
 * incoming request, thrown away after 24 hours, and what is kept is the
 * aggregate — path, referrer, country, browser, device type. That is the whole
 * list, and it is already more than the one question this site asks of it,
 * which is which shots to write about and verify clips for next.
 *
 * No env var gates it. The script is only served on Vercel deployments, so a
 * `npm run dev` or a preview cannot pollute the numbers whether it renders or
 * not — one fewer thing to get wrong than the `NEXT_PUBLIC_GA_ID` it replaces.
 *
 * Route changes are tracked without wiring of our own, so client-side
 * navigation between technique pages counts the way a fresh load does.
 */
export default function Analytics() {
  return <VercelAnalytics />;
}
