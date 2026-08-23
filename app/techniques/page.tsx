import type { Metadata } from "next";
import Link from "next/link";
import DifficultyBadge from "@/components/DifficultyBadge";
import { getTechniques } from "@/lib/content";

export const metadata: Metadata = {
  title: "Index",
  description: "Every pickleball technique covered on this site.",
};

/**
 * Placeholder index. The card grid, the filter bar and the URL-synced query
 * state are M4-1/M4-2; this exists so the header link is not a dead end while
 * the vertical slice is the only thing built.
 */
export default function TechniquesPage() {
  const techniques = getTechniques();

  return (
    <div className="mx-auto max-w-[78rem] px-6 py-12 md:py-16">
      <h1 className="font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-tight font-medium">
        Index
      </h1>

      {techniques.length === 0 ? (
        <p className="mt-8 text-muted">Nothing published yet.</p>
      ) : (
        <ul className="mt-12 border-t border-rule">
          {techniques.map((t) => (
            <li key={t.slug} className="border-b border-border py-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <Link
                  href={`/techniques/${t.slug}`}
                  className="font-display text-2xl hover:text-accent"
                >
                  {t.name}
                </Link>
                <DifficultyBadge difficulty={t.difficulty} />
              </div>
              <p className="mt-2 max-w-[var(--measure)] leading-relaxed text-muted">
                {t.summary}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
