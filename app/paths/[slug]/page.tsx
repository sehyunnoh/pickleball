import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DifficultyBadge from "@/components/DifficultyBadge";
import { getPath, getPaths, getTechnique } from "@/lib/content";

export function generateStaticParams() {
  return getPaths().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const path = getPath(slug);
  if (!path) return {};
  return {
    title: path.title,
    // The problem rather than the outcome: it is the sentence somebody might
    // actually type into a search box.
    description: path.problem,
    alternates: { canonical: `/paths/${slug}` },
  };
}

/**
 * One path.
 *
 * Laid out as a numbered route rather than a grid of cards, because the order
 * is the entire content — the same six techniques in a different sequence
 * would be worse advice. Each step leads with why it is here and where it is,
 * and the link to the technique itself comes last, so the page reads as an
 * argument rather than as a menu.
 */
export default async function PathPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const path = getPath(slug);
  if (!path) notFound();

  return (
    <article className="mx-auto max-w-[64rem] px-6 py-12 md:py-16">
      <p className="label text-muted">
        <Link href="/paths" className="hover:text-accent">
          Paths
        </Link>
      </p>

      <h1 className="font-display mt-3 text-[clamp(2.25rem,5vw,3.25rem)] leading-tight font-medium">
        {path.title}
      </h1>

      <p className="mt-6 max-w-[var(--measure)] text-lg leading-relaxed">
        {path.problem}
      </p>

      <section aria-labelledby="outcome" className="mt-8">
        <h2 id="outcome" className="label text-muted">
          Where this gets you
        </h2>
        <p className="mt-2 max-w-[var(--measure)] leading-relaxed">
          {path.outcome}
        </p>
      </section>

      <ol className="mt-14">
        {path.steps.map((step, i) => {
          const technique = getTechnique(step.technique);
          // validate-content refuses a path that points at a missing or draft
          // technique, so this is belt-and-braces rather than an expected state.
          if (!technique) return null;

          return (
            <li key={step.technique} className="border-t border-rule py-8">
              <div className="grid gap-x-10 gap-y-3 lg:grid-cols-[3rem_1fr]">
                <span
                  className="label tabular pt-1.5 text-muted"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div>
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h2 className="font-display text-2xl font-medium">
                      <Link
                        href={`/techniques/${technique.slug}`}
                        className="hover:text-accent"
                      >
                        {technique.name}
                      </Link>
                    </h2>
                    <DifficultyBadge difficulty={technique.difficulty} />
                  </div>

                  {/* Why before what. The technique page can explain itself;
                      what it cannot explain is why it is step four. */}
                  <p className="mt-3 max-w-[var(--measure)] leading-relaxed">
                    {step.why}
                  </p>

                  <p className="mt-3 max-w-[var(--measure)] text-sm leading-relaxed text-muted">
                    {technique.summary}
                  </p>

                  <p className="mt-4">
                    <Link
                      href={`/techniques/${technique.slug}`}
                      className="label text-accent hover:underline"
                    >
                      Read {technique.name} →
                    </Link>
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <aside className="mt-8 border-t border-rule pt-5">
        <p className="max-w-[var(--measure)] leading-relaxed text-muted">
          Work down it rather than across it. Each step assumes the one above,
          and the order is doing as much of the work here as the techniques
          themselves.
        </p>
        <p className="label mt-4">
          <Link href="/paths" className="text-accent hover:underline">
            The other paths
          </Link>
        </p>
      </aside>
    </article>
  );
}
