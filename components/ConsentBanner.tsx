"use client";

import Link from "next/link";
import { GA_ID, useConsent } from "@/lib/consent";

/**
 * The consent bar.
 *
 * A banner is at odds with a site whose whole proposition is a quiet read, so
 * this one is held to what the law actually requires and nothing more
 * (REQUIREMENTS.md §16):
 *
 * - **The default is no.** It appears *because* nothing has fired yet, not to
 *   confirm something already running.
 * - **Both answers are one press, and they look alike.** A greyed-out decline
 *   next to a filled accept is the dark pattern the rules exist to stop.
 * - **It asks once.** Either answer is remembered; neither brings it back.
 * - **It does not sit on top of the page.** `sticky` keeps it at the foot of
 *   the viewport while there is page left to scroll, then lets it settle into
 *   its own space at the end of the document rather than covering the footer
 *   for good.
 *
 * With no measurement ID configured there is no tag and therefore no question,
 * so nothing renders — which is every preview and every local build.
 */
export default function ConsentBanner() {
  const { consent, decide } = useConsent();

  if (!GA_ID || consent !== "unset") return null;

  return (
    <div
      role="region"
      aria-label="Analytics consent"
      className="sticky bottom-0 z-40 border-t border-rule bg-bg"
    >
      <div className="mx-auto flex max-w-[78rem] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-4">
        <p className="max-w-[52ch] text-sm leading-relaxed">
          Can we count visits? It is Google Analytics, it sets a cookie, and it
          tells us which shots people actually look up. Nothing has loaded yet —
          say no and nothing will.{" "}
          <Link
            href="/privacy"
            className="text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
          >
            What it collects
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => decide("denied")}
            className="label cursor-pointer border border-control px-4 py-2 hover:border-accent hover:text-accent"
          >
            No thanks
          </button>
          <button
            type="button"
            onClick={() => decide("granted")}
            className="label cursor-pointer border border-control px-4 py-2 hover:border-accent hover:text-accent"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
