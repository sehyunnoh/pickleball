import type { Metadata } from "next";
import { Fraunces, Newsreader } from "next/font/google";
import Link from "next/link";
import SearchDialog from "@/components/SearchDialog";
import { getTechniques, getTerms } from "@/lib/content";
import { buildSearchIndex } from "@/lib/search";
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

export const metadata: Metadata = {
  title: {
    default: "Pickleball Technique",
    template: "%s · Pickleball Technique",
  },
  description:
    "Learn one pickleball shot at a time: what it is, when to use it, how to hit it — with hand-picked video clips timestamped to the moment that shows it.",
};

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

        {/* A running head with a rule under it, the way a manual opens a page. */}
        <header className="border-b border-rule">
          <div className="mx-auto flex max-w-[78rem] items-baseline justify-between gap-6 px-6 py-5">
            <Link
              href="/"
              className="font-display text-lg font-medium hover:text-accent"
            >
              Pickleball Technique
            </Link>
            <nav aria-label="Main" className="flex items-baseline gap-5">
              <Link href="/techniques" className="label hover:text-accent">
                Index
              </Link>
              <Link href="/skill-tree" className="label hover:text-accent">
                Tree
              </Link>
              <Link href="/glossary" className="label hover:text-accent">
                Glossary
              </Link>
              <SearchDialog index={searchIndex} />
            </nav>
          </div>
        </header>

        <main id="main" className="flex-1">
          {children}
        </main>

        <footer className="mt-24 border-t border-border">
          <div className="mx-auto max-w-[78rem] px-6 py-10">
            <p className="max-w-[46ch] text-sm leading-relaxed text-muted">
              Videos are embedded from YouTube and remain the property of their
              creators. Nothing here is hosted or re-uploaded.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
