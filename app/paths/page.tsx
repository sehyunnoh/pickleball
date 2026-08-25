import type { Metadata } from "next";
import Link from "next/link";
import { getPaths, getTechnique } from "@/lib/content";

export const metadata: Metadata = {
  title: "Paths",
  description:
    "Routes through the techniques, indexed by the thing that keeps happening to you rather than by the shot you are missing: getting stuck at the baseline, getting attacked, losing the serve.",
  alternates: { canonical: "/paths" },
};

/**
 * The paths index.
 *
 * The other two ways into this site both assume you already know what you are
 * looking for: the index wants a shot name, the skill tree wants a position in
 * a graph. Somebody who has just lost six games in a row has neither. What
 * they have is a complaint — "they keep smashing at me" — so that is what this
 * page is indexed by, and the shot names come afterwards.
 */
export default function PathsPage() {
  const paths = getPaths();

  return (
    <div className="mx-auto max-w-[64rem] px-6 py-12 md:py-16">
      <h1 className="font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-tight font-medium">
        Paths
      </h1>
      <p className="mt-4 max-w-[52ch] leading-relaxed text-muted">
        Start from what keeps happening to you, not from the name of the shot
        you are missing. Each path is a handful of techniques in the order they
        are worth learning, and why that order.
      </p>

      <ol className="mt-12">
        {paths.map((path, i) => (
          <li key={path.slug} className="border-t border-rule py-8">
            <div className="grid gap-x-10 gap-y-4 lg:grid-cols-[3rem_1fr]">
              <span
                className="label tabular hidden pt-2 text-muted lg:block"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div>
                <h2 className="font-display text-2xl font-medium">
                  <Link
                    href={`/paths/${path.slug}`}
                    className="hover:text-accent"
                  >
                    {path.title}
                  </Link>
                </h2>

                {/* The problem, not the summary. It is what tells a reader
                    within one sentence whether this is their path. */}
                <p className="mt-3 max-w-[var(--measure)] leading-relaxed">
                  {path.problem}
                </p>

                <p className="label mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
                  <span>{path.steps.length} techniques</span>
                  <span aria-hidden="true">·</span>
                  <span className="normal-case tracking-normal">
                    {path.steps
                      .map((s) => getTechnique(s.technique)?.name)
                      .filter(Boolean)
                      .join(" → ")}
                  </span>
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <aside className="mt-16 border-t border-rule pt-5">
        <h2 className="label text-muted">If none of these is your problem</h2>
        <p className="mt-3 max-w-[var(--measure)] leading-relaxed text-muted">
          The{" "}
          <Link href="/techniques" className="text-accent hover:underline">
            index
          </Link>{" "}
          lists every shot and filters by category and level, and the{" "}
          <Link href="/skill-tree" className="text-accent hover:underline">
            skill tree
          </Link>{" "}
          shows what depends on what. A path is only a route somebody drew
          through that same material.
        </p>
      </aside>
    </div>
  );
}
