import type { Metadata } from "next";
import Link from "next/link";
import DifficultyBadge from "@/components/DifficultyBadge";
import { getTechniques } from "@/lib/content";

export const metadata: Metadata = {
  title: "Techniques",
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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Techniques</h1>

      {techniques.length === 0 ? (
        <p className="mt-6 text-muted">Nothing published yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {techniques.map((t) => (
            <li key={t.slug} className="py-4">
              <Link
                href={`/techniques/${t.slug}`}
                className="flex flex-wrap items-center gap-3 font-medium text-accent hover:underline"
              >
                {t.name}
                <DifficultyBadge difficulty={t.difficulty} />
              </Link>
              <p className="mt-1 max-w-[var(--measure)] text-sm leading-relaxed text-muted">
                {t.summary}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
