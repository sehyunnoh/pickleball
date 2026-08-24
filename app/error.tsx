"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Route-level error boundary.
 *
 * The site is entirely prerendered, so a client error here is a bug in our own
 * code rather than a failed request — which is why the reset button is offered
 * quietly and the way out is a link. `digest` is the id Next assigns to the
 * server-side error, and it is the only thing that makes a report actionable.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-[64rem] px-6 py-20 md:py-28">
      <p className="label text-[var(--difficulty-advanced)]">Error</p>

      <h1 className="font-display mt-4 max-w-[18ch] text-[clamp(2.25rem,5vw,3.5rem)] leading-[0.98] font-medium">
        Something broke on this page.
      </h1>

      <p className="mt-6 max-w-[52ch] leading-relaxed text-muted">
        Not your fault — this one is on us. The rest of the site is fine.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
        <button
          type="button"
          onClick={reset}
          className="label cursor-pointer border-b-2 border-accent pb-1 text-accent"
        >
          Try again
        </button>
        <Link
          href="/techniques"
          className="label border-b-2 border-transparent pb-1 text-muted hover:border-border hover:text-text"
        >
          Back to the index
        </Link>
      </div>

      {error.digest && (
        <p className="label mt-12 border-t border-border pt-4 text-muted">
          Reference {error.digest}
        </p>
      )}
    </div>
  );
}
