import type { Metadata } from "next";
import { Fraunces, Newsreader } from "next/font/google";
import Link from "next/link";
import Analytics from "@/components/Analytics";
import ConsentBanner from "@/components/ConsentBanner";
import SearchDialog from "@/components/SearchDialog";
import { getTechniques, getTerms } from "@/lib/content";
import { buildSearchIndex } from "@/lib/search";
import { SITE_NAME, siteUrl } from "@/lib/seo";
import "./globals.css";

/**
 * Two families, both variable, both self-hosted at build time by next/font —
 * no request leaves the origin and there is no DNS lookup or TLS handshake to
 * pay for.
 *
 * Fraunces is drawn rather than drafted; at display sizes that irregularity is
 * most of what separates this from a framework default. Newsreader is built
 * for reading long passages on a screen, which is all this site asks of it.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-newsreader",
});

const DESCRIPTION =
  "Pickleball technique for players in Oakville, Ontario. One shot at a time — what it is, when to use it, how to hit it, with video clips timestamped to the moment that shows it. Plus every indoor and outdoor court in town.";

export const metadata: Metadata = {
  // Everything relative in a page's metadata resolves against this, so the
  // canonicals and share cards are absolute wherever the site is deployed.
  metadataBase: new URL(siteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  // Proves the site to Google Search Console. Public by design — it is a
  // <meta> tag on every page, and it grants nothing on its own.
  //
  // The tag is the method here because the usual shortcuts are closed: the
  // DNS option needs records on vercel.app, which Vercel owns, and the Google
  // Analytics option needs gtag.js on the page at crawl time, which this site
  // deliberately withholds until a visitor consents. Search Console's crawler
  // does not press Allow.
  //
  // Tied to the pickleball-livid.vercel.app property. A custom domain later
  // needs its own property; this tag carries over and verifies that one too.
  verification: { google: "dLBy72eyWw7-c-JzBmybHnh7mWpXTHSzTkqzTdtfmS0" },
};

/**
 * The sections, in one place. The header renders this twice — once inline for
 * `sm` and up, once in the row below for phones — and a list that lived in two
 * literals would eventually disagree with itself.
 */
const NAV = [
  { href: "/techniques", label: "Index" },
  { href: "/paths", label: "Paths" },
  { href: "/courts", label: "Courts" },
  { href: "/skill-tree", label: "Tree" },
  { href: "/glossary", label: "Glossary" },
] as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Built once at build time and shipped with every page — the whole corpus is
  // a hundred short records, and search that only works after a round trip is
  // search people stop using.
  const searchIndex = buildSearchIndex(getTechniques(), getTerms());

  return (
    <html
      lang="en"
      className={`h-full ${fraunces.variable} ${newsreader.variable}`}
    >
      <body className="flex min-h-full flex-col bg-bg text-text">
        <a
          href="#main"
          className="label sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-accent-soft focus:px-3 focus:py-2 focus:text-accent"
        >
          Skip to content
        </a>

        {/* A running head with a rule under it, the way a manual opens a page.

            Two rows on a phone, and only the first of them sticks. Sticking the
            whole thing cost 97px of every screen — the six nav items will not
            fit on one line at that width — on a site whose main scenario is a
            phone at the side of a court. So the masthead and the search stay,
            because they are the two things you reach for mid-rally, and the
            list of sections scrolls away like any other content. From `sm` up
            it is one row again and all of it sticks, because there the whole
            thing costs 69px and nothing has to give.

            The nav is rendered twice rather than moved, since a sticky element
            cannot escape its own parent's box — the row that scrolls away has
            to be a sibling of the row that does not. NAV is the single list
            both read from, so adding a section cannot update one and miss the
            other.

            Opaque `bg-bg` rather than a blur or a shadow: the page underneath
            would otherwise show through the rule, and a drop shadow is the one
            thing that would make this read as a web app rather than a printed
            head. Below the consent bar's z-40 by design — they sit at opposite
            ends and the bar is the more important of the two. The search modal
            is a native <dialog>, which the browser puts in the top layer, so it
            clears this without needing a z-index at all. */}
        <header className="sticky top-0 z-30 border-b border-rule bg-bg">
          <div className="mx-auto flex max-w-[78rem] items-baseline justify-between gap-6 px-6 py-3.5 sm:py-5">
            <Link
              href="/"
              className="font-display text-lg font-medium whitespace-nowrap hover:text-accent"
            >
              {SITE_NAME}
            </Link>
            <div className="flex items-baseline gap-5">
              <nav
                aria-label="Main"
                className="hidden items-baseline gap-5 sm:flex"
              >
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="label hover:text-accent"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <SearchDialog index={searchIndex} />
            </div>
          </div>
        </header>

        {/* The sections, on a phone only. Deliberately outside the header so it
            scrolls away with the page rather than pinning another 45px to the
            top of every screen. */}
        <nav aria-label="Sections" className="border-b border-border sm:hidden">
          <div className="mx-auto flex max-w-[78rem] flex-wrap gap-x-5 gap-y-2 px-6 py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="label hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <main id="main" className="flex-1">
          {children}
        </main>

        <footer className="mt-24 border-t border-border">
          <div className="mx-auto flex max-w-[78rem] flex-wrap justify-between gap-x-12 gap-y-6 px-6 py-10">
            <p className="max-w-[46ch] text-sm leading-relaxed text-muted">
              Videos are embedded from YouTube and remain the property of their
              creators. Nothing here is hosted or re-uploaded. Court listings
              come from the Town of Oakville; this site is not affiliated with
              the town.
            </p>
            <nav
              aria-label="Secondary"
              className="flex flex-wrap gap-x-5 gap-y-2"
            >
              <Link href="/about" className="label hover:text-accent">
                About
              </Link>
              <Link href="/privacy" className="label hover:text-accent">
                Privacy
              </Link>
              <Link href="/courts" className="label hover:text-accent">
                Courts
              </Link>
              <Link href="/glossary" className="label hover:text-accent">
                Glossary
              </Link>
            </nav>
          </div>
        </footer>

        <ConsentBanner />
        <Analytics />
      </body>
    </html>
  );
}
