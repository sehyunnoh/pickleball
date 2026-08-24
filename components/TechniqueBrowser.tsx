"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import DifficultyBadge from "./DifficultyBadge";
import { useProgress } from "@/lib/progress";
import {
  CATEGORIES,
  COURT_ZONES,
  DIFFICULTIES,
  SITUATIONS,
  type Technique,
} from "@/lib/schema";

/**
 * The technique index: filters plus the card grid.
 *
 * Filtering happens in the browser over the full list, which is prerendered
 * into the page. Phase 1 tops out around thirty techniques, so this is cheaper
 * and faster than a round trip — and it keeps the route static, since reading
 * searchParams on the server would force it to render per request.
 *
 * Filter state lives in the URL so a filtered view can be sent to somebody.
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
const FACETS: Facet[] = [
  { key: "category", label: "Category", options: CATEGORIES },
  { key: "difficulty", label: "Level", options: DIFFICULTIES },
  { key: "zone", label: "Court zone", options: COURT_ZONES },
  { key: "situation", label: "Moment", options: SITUATIONS },
];

export default function TechniqueBrowser({
  techniques,
}: {
  techniques: Technique[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { learned } = useProgress();

  const active = useMemo(() => {
    const out: Record<string, string | null> = {};
    for (const facet of FACETS) out[facet.key] = params.get(facet.key);
    return out;
  }, [params]);

  const showLearned = params.get("learned");

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null) next.delete(key);
      else next.set(key, value);
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [params, pathname, router],
  );

  const visible = techniques.filter((t) => {
    if (active.category && t.category !== active.category) return false;
    if (active.difficulty && t.difficulty !== active.difficulty) return false;
    if (active.zone && !t.courtZone.includes(active.zone as never))
      return false;
    if (active.situation && !t.situation.includes(active.situation as never)) {
      return false;
    }
    if (showLearned === "no" && learned.has(t.slug)) return false;
    if (showLearned === "yes" && !learned.has(t.slug)) return false;
    return true;
  });

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
                  onClick={() => setParam(facet.key, on ? null : option)}
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

        {/* Only offered once there is something stored to filter by. */}
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
                  onClick={() => setParam("learned", on ? null : value)}
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
            onClick={() => router.replace(pathname, { scroll: false })}
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
