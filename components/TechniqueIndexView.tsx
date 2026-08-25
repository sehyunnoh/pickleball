"use client";

import Link from "next/link";
import DifficultyBadge from "./DifficultyBadge";
import {
  CATEGORIES,
  COURT_ZONES,
  DIFFICULTIES,
  SITUATIONS,
  type Technique,
} from "@/lib/schema";

/**
 * The technique index, as markup only.
 *
 * Split out from `TechniqueBrowser` so the same tree can be rendered twice:
 * once on the server, into the prerendered HTML, and again on the client once
 * the filters are live. It calls no hooks of its own, so the page can render it
 * directly without any of the filter machinery.
 *
 * That split exists to fix a real defect rather than for tidiness. The browser
 * reads the filters from `useSearchParams`, which opts its whole subtree out of
 * static rendering — so the prerendered page used to contain a "Loading…" line
 * and nothing else. Two things followed: the index shipped **zero crawlable
 * links** to any technique page, which is the one thing this page exists to do
 * (REQUIREMENTS.md §15 bets the site on long-tail search reaching those pages),
 * and swapping one line of text for twenty-nine cards moved every pixel below
 * it, for a CLS of 0.256 against a 0.1 budget.
 *
 * Rendered without `onFilter` the controls are inert — that is the server pass,
 * and it lasts until hydration. Both passes must produce the same box sizes or
 * the shift comes straight back, so the two states differ only in `aria-pressed`
 * and colour.
 *
 * It carries "use client" while still being rendered from a server component:
 * that combination is what puts real markup in the HTML *and* lets the buttons
 * take an onClick later. Every prop the server passes therefore has to survive
 * serialisation, which is why `learned` is not one of them — a Set does not
 * cross that boundary, and the server has no progress to report anyway.
 */

type Facet = {
  key: string;
  label: string;
  options: readonly string[];
};

/**
 * One value per facet. A technique can carry several court zones, so choosing
 * "kitchen" means "played in the kitchen among other places" rather than
 * "played only there".
 */
export const FACETS: Facet[] = [
  { key: "category", label: "Category", options: CATEGORIES },
  { key: "difficulty", label: "Level", options: DIFFICULTIES },
  { key: "zone", label: "Court zone", options: COURT_ZONES },
  { key: "situation", label: "Moment", options: SITUATIONS },
];

const NOTHING_LEARNED: ReadonlySet<string> = new Set();

export default function TechniqueIndexView({
  techniques,
  visible = techniques,
  active = {},
  showLearned = null,
  learned = NOTHING_LEARNED,
  onFilter,
  onClear,
}: {
  /** Everything, for the "n of m" count. */
  techniques: Technique[];
  /** What survives the current filters. Defaults to all of them. */
  visible?: Technique[];
  active?: Record<string, string | null>;
  showLearned?: string | null;
  learned?: ReadonlySet<string>;
  /** Absent on the server pass, which is why the controls are inert there. */
  onFilter?: (key: string, value: string | null) => void;
  onClear?: () => void;
}) {
  const anyFilter = FACETS.some((f) => active[f.key]) || showLearned !== null;

  return (
    <div>
      <div className="border-t border-rule">
        {FACETS.map((facet) => (
          <fieldset
            key={facet.key}
            className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-border py-3"
          >
            <legend className="label float-left w-28 pt-0.5 text-muted">
              {facet.label}
            </legend>
            {facet.options.map((option) => {
              const on = active[facet.key] === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onFilter?.(facet.key, on ? null : option)}
                  className={`cursor-pointer border-b-2 pb-0.5 text-sm transition-colors ${
                    on
                      ? "border-accent text-accent"
                      : "border-transparent text-muted hover:text-text"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </fieldset>
        ))}

        {/* Only offered once there is something stored to filter by, which is
            never on the server — localStorage has no server snapshot. */}
        {learned.size > 0 && (
          <fieldset className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-border py-3">
            <legend className="label float-left w-28 pt-0.5 text-muted">
              Progress
            </legend>
            {(
              [
                ["yes", "learned"],
                ["no", "still to learn"],
              ] as const
            ).map(([value, label]) => {
              const on = showLearned === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onFilter?.("learned", on ? null : value)}
                  className={`cursor-pointer border-b-2 pb-0.5 text-sm transition-colors ${
                    on
                      ? "border-accent text-accent"
                      : "border-transparent text-muted hover:text-text"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </fieldset>
        )}
      </div>

      <p className="label mt-5 flex flex-wrap items-center gap-4 text-muted">
        <span>
          {visible.length} of {techniques.length}
        </span>
        {anyFilter && (
          <button
            type="button"
            onClick={() => onClear?.()}
            className="label cursor-pointer text-accent hover:underline"
          >
            clear filters
          </button>
        )}
      </p>

      {visible.length === 0 ? (
        <p className="mt-10 border-y border-border py-10 text-center text-muted">
          Nothing matches those filters yet.
        </p>
      ) : (
        <ul className="mt-6 grid gap-x-12 sm:grid-cols-2">
          {visible.map((t) => (
            <li key={t.slug} className="border-t border-border py-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <Link
                  href={`/techniques/${t.slug}`}
                  className="font-display text-xl hover:text-accent"
                >
                  {t.name}
                </Link>
                <DifficultyBadge difficulty={t.difficulty} />
              </div>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                {t.summary}
              </p>
              <p className="label mt-3 flex flex-wrap items-center gap-x-3 text-muted">
                <span>{t.category}</span>
                {learned.has(t.slug) && (
                  <span className="text-accent">✓ learned</span>
                )}
                {t.status === "draft" && (
                  <span className="text-[var(--difficulty-intermediate)]">
                    draft
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
