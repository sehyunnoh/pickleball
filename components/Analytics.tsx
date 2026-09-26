import Script from "next/script";

/**
 * GoatCounter.
 *
 * Replaced Vercel Web Analytics on 2026-09-27, after the move to GitHub Pages
 * left this site with no analytics at all for two days. GoatCounter is a
 * small, open-source page-view counter: no cookie, no persistent identifier —
 * a visit is identified by a same-day hash of IP + user agent that is never
 * stored, only compared against. What is kept is the aggregate: path,
 * referrer, browser, OS, and a country derived from the IP, which is itself
 * discarded immediately after that lookup.
 *
 * Guarded to production only, the same way the Vercel and GA4 scripts before
 * it were kept out of local runs — `npm run dev` and a local `next build`
 * should not add noise to a counter that is supposed to answer "which shots
 * are people actually reading."
 */
export default function Analytics() {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <Script
      data-goatcounter="https://pickleball.goatcounter.com/count"
      src="https://gc.zgo.at/count.js"
      strategy="afterInteractive"
    />
  );
}
