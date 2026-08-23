import Link from "next/link";
import DifficultyBadge from "@/components/DifficultyBadge";
import { getTechniques } from "@/lib/content";

/**
 * Placeholder home. The real one — hero, category entry points, featured
 * techniques — is M5-1. For now it exists so the vertical slice is reachable
 * without typing a URL.
 */
export default function Home() {
  const techniques = getTechniques();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="max-w-[var(--measure)] text-4xl font-semibold tracking-tight">
        One pickleball shot at a time.
      </h1>
      <p className="mt-4 max-w-[var(--measure)] leading-relaxed text-muted">
        What it is, when to use it, how to hit it — and hand-picked video clips
        timestamped to the moment that actually shows it.
      </p>

      <ul className="mt-10 space-y-3">
        {techniques.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/techniques/${t.slug}`}
              className="flex flex-wrap items-center gap-3 text-lg text-accent hover:underline"
            >
              {t.name}
              <DifficultyBadge difficulty={t.difficulty} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
