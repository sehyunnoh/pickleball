import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Pickleball Technique Hub",
    template: "%s · Pickleball Technique Hub",
  },
  description:
    "Learn one pickleball shot at a time: what it is, when to use it, how to hit it — with hand-picked video clips timestamped to the moment that shows it.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col bg-bg text-text">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-accent-soft focus:px-3 focus:py-2 focus:text-accent"
        >
          Skip to content
        </a>

        <header className="border-b border-border">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="font-semibold tracking-tight hover:text-accent">
              Pickleball<span className="text-accent">·</span>Technique Hub
            </Link>
            <nav aria-label="Main" className="flex gap-4 text-sm text-muted">
              <Link href="/techniques" className="hover:text-accent">
                Techniques
              </Link>
              {/* Glossary lands in M4-6, once there is content behind it. */}
            </nav>
          </div>
        </header>

        <main id="main" className="flex-1">
          {children}
        </main>

        <footer className="mt-16 border-t border-border">
          <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted">
            <p>
              Videos are embedded from YouTube and remain the property of their
              creators. Nothing here is hosted or re-uploaded.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
