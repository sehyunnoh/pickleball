import Link from "next/link";
import DifficultyBadge from "@/components/DifficultyBadge";
import { getTechniques } from "@/lib/content";

/**
 * Placeholder home. The real one — categories, featured techniques, an entry
 * point into the skill tree — is M5-1. This exists so the slice is reachable
 * without typing a URL, and so the type is set the way the rest of the site
 * sets it.
 */
export default function Home() {
  const techniques = getTechniques();

  return (
    <div className="mx-auto max-w-[78rem] px-6 py-20 md:py-28">
      <h1 className="font-display max-w-[16ch] text-[clamp(2.5rem,7vw,5rem)] leading-[0.95] font-medium">
        One shot at a time.
      </h1>
      <p className="mt-8 max-w-[52ch] text-lg leading-relaxed text-muted">
        What it is, when to use it, how to hit it — and hand-picked video clips
        timestamped to the moment that actually shows it.
      </p>

      <h2 className="label mt-20 border-b border-rule pb-3 text-muted">
        Techniques
      </h2>
      <ul>
        {techniques.map((t) => (
          <li key={t.slug} className="border-b border-border">
            <Link
              href={`/techniques/${t.slug}`}
              className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-5"
            >
              <span className="font-display text-2xl group-hover:text-accent">
                {t.name}
              </span>
              <DifficultyBadge difficulty={t.difficulty} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
