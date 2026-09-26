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
 * A plain <script> tag, not `next/script`: `next/script`'s `afterInteractive`
 * strategy inserts the tag itself via a client-side effect after hydration,
 * and on this static export that effect never actually appended anything to
 * the DOM (props reached the RSC payload, no tag ever reached the page —
 * confirmed by hand). A site with nothing server-rendered to protect doesn't
 * need that indirection anyway; GoatCounter's own install snippet is exactly
 * this tag, parsed and run by the browser like any other script.
 *
 * Guarded to production only, the same way the Vercel and GA4 scripts before
 * it were kept out of local runs — `npm run dev` and a local `next build`
 * should not add noise to a counter that is supposed to answer "which shots
 * are people actually reading."
 */
export default function Analytics() {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <script
      data-goatcounter="https://pickleball.goatcounter.com/count"
      async
      src="https://gc.zgo.at/count.js"
    />
  );
}
