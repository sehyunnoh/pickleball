import Link from "next/link";
import DifficultyBadge from "@/components/DifficultyBadge";
import { getTechniques, getTerms, getVenues } from "@/lib/content";
import { CATEGORIES, type Category } from "@/lib/schema";

/**
 * The home page.
 *
 * Two audiences land here: somebody who has never seen the site and wants to
 * know what it is, and somebody who has been before and wants back into what
 * they were learning. It answers the first in one sentence and then gets out
 * of the way, because almost every visit after the first arrives at a
 * technique page from search rather than here.
 *
 * Everything is derived, so it fills out on its own as M3 lands content and
 * degrades honestly while there is little of it.
 */

const CATEGORY_BLURB: Record<Category, string> = {
  serve: "Starting the point.",
  return: "The shot that decides whether you get to the net.",
  transition: "Getting from the baseline to the kitchen line.",
  "soft-game": "The patient exchanges that decide most rallies.",
  attack: "Ending the point when the ball comes up.",
  defense: "Staying in the point when it does not.",
  specialty: "The shots that make people stop and look.",
  movement: "Where to stand and how to get there.",
  strategy: "What the two of you do together.",
};

export default function Home() {
  const techniques = getTechniques();
  const terms = getTerms();
  const venues = getVenues();
  const courtCount = venues.reduce((n, v) => n + (v.courts ?? 0), 0);

  // The roots of the skill tree: nothing has to come first.
  const startHere = techniques.filter((t) => t.prerequisites.length === 0);

  const recent = [...techniques]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4);

  const counts = new Map<string, number>();
  for (const t of techniques) {
    counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
  }
  const populated = CATEGORIES.filter((c) => counts.has(c));

  return (
    <div className="mx-auto max-w-[64rem] px-6">
      <section className="border-b border-rule py-20 md:py-28">
        <h1 className="font-display max-w-[14ch] text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.92] font-medium">
          One shot at a time.
        </h1>
        <p className="mt-8 max-w-[54ch] text-lg leading-relaxed">
          What it is, when to use it, how to hit it, and what usually goes wrong
          — with video clips picked by hand and timestamped to the second that
          actually shows it.
        </p>
        <p className="mt-4 max-w-[54ch] leading-relaxed text-muted">
          Written for players in Oakville, Ontario who know the rules and want
          one specific shot to stop failing — and who need somewhere to go and
          hit it.
        </p>

        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          <Link
            href="/techniques"
            className="label border-b-2 border-accent pb-1 text-accent"
          >
            Browse every shot
          </Link>
          <Link
            href="/courts"
            className="label border-b-2 border-transparent pb-1 text-muted hover:border-border hover:text-text"
          >
            Where to play in Oakville
          </Link>
          <Link
            href="/skill-tree"
            className="label border-b-2 border-transparent pb-1 text-muted hover:border-border hover:text-text"
          >
            The order to learn them
          </Link>
        </div>
      </section>

      {startHere.length > 0 && (
        <section className="py-16" aria-labelledby="start-here">
          <h2
            id="start-here"
            className="label border-b border-rule pb-3 text-muted"
          >
            Start here
          </h2>
          <p className="mt-4 max-w-[52ch] leading-relaxed text-muted">
            Nothing has to come before these.
          </p>
          <ul className="mt-6 grid gap-x-12 sm:grid-cols-2">
            {startHere.map((t) => (
              <li key={t.slug} className="border-b border-border py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <Link
                    href={`/techniques/${t.slug}`}
                    className="font-display text-2xl hover:text-accent"
                  >
                    {t.name}
                  </Link>
                  <DifficultyBadge difficulty={t.difficulty} />
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                  {t.summary}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {populated.length > 0 && (
        <section className="py-16" aria-labelledby="by-category">
          <h2
            id="by-category"
            className="label border-b border-rule pb-3 text-muted"
          >
            By part of the game
          </h2>
          <ul className="mt-6 grid gap-x-12 sm:grid-cols-2">
            {populated.map((category) => (
              <li key={category} className="border-b border-border py-4">
                <Link
                  href={`/techniques?category=${category}`}
                  className="group flex items-baseline justify-between gap-4"
                >
                  <span>
                    <span className="font-display text-xl group-hover:text-accent">
                      {category}
                    </span>
                    <span className="mt-1 block text-sm text-muted">
                      {CATEGORY_BLURB[category]}
                    </span>
                  </span>
                  <span className="label tabular shrink-0 text-muted">
                    {counts.get(category)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="py-16" aria-labelledby="recent">
        <h2 id="recent" className="label border-b border-rule pb-3 text-muted">
          Recently updated
        </h2>
        <ul className="mt-6">
          {recent.map((t) => (
            <li
              key={t.slug}
              className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border py-4"
            >
              <Link
                href={`/techniques/${t.slug}`}
                className="font-display text-lg hover:text-accent"
              >
                {t.name}
              </Link>
              <span className="label tabular text-muted">{t.updatedAt}</span>
            </li>
          ))}
        </ul>
      </section>

      {venues.length > 0 && (
        <section className="border-t border-rule py-16" aria-labelledby="play">
          <h2 id="play" className="font-display text-2xl">
            Somewhere to hit it
          </h2>
          <p className="mt-3 max-w-[52ch] leading-relaxed text-muted">
            {courtCount} pickleball courts around Oakville — which community
            centres have indoor gyms, and which parks have dedicated outdoor
            courts rather than lines painted over tennis.
          </p>
          <Link
            href="/courts"
            className="label mt-5 inline-block border-b-2 border-accent pb-1 text-accent"
          >
            Where to play
          </Link>
        </section>
      )}

      {terms.length > 0 && (
        <section
          className="border-t border-rule py-16"
          aria-labelledby="jargon"
        >
          <h2 id="jargon" className="font-display text-2xl">
            Lost in the jargon?
          </h2>
          <p className="mt-3 max-w-[52ch] leading-relaxed text-muted">
            {terms.length} terms coaches use without explaining them — the
            kitchen, the transition zone, what a banger is.
          </p>
          <Link
            href="/glossary"
            className="label mt-5 inline-block border-b-2 border-accent pb-1 text-accent"
          >
            Read the glossary
          </Link>
        </section>
      )}
    </div>
  );
}
