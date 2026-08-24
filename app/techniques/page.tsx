import type { Metadata } from "next";
import { Suspense } from "react";
import TechniqueBrowser from "@/components/TechniqueBrowser";
import { getTechniques } from "@/lib/content";

export const metadata: Metadata = {
  title: "Index",
  description:
    "Every pickleball technique covered here, filterable by category, level, court zone and the moment in the rally it belongs to.",
};

export default function TechniquesPage() {
  const techniques = getTechniques();

  return (
    <div className="mx-auto max-w-[64rem] px-6 py-12 md:py-16">
      <h1 className="font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-tight font-medium">
        Index
      </h1>
      <p className="mt-4 max-w-[52ch] leading-relaxed text-muted">
        Every shot covered here. Filter it down, or press{" "}
        <kbd className="label border border-border px-1.5 py-0.5">⌘K</kbd> to
        search.
      </p>

      <div className="mt-10">
        {/* The browser reads searchParams on the client. Without this boundary
            the whole route would opt out of static rendering. */}
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <TechniqueBrowser techniques={techniques} />
        </Suspense>
      </div>
    </div>
  );
}
