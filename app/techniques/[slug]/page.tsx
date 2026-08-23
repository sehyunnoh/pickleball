import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DifficultyBadge from "@/components/DifficultyBadge";
import LiteYouTube from "@/components/LiteYouTube";
import VideoGrid from "@/components/VideoGrid";
import {
  getHeroVideo,
  getTechnique,
  getTechniques,
  resolveTechniqueRefs,
  resolveTermRefs,
  type Ref,
} from "@/lib/content";
import { formatSeconds } from "@/lib/format";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getTechniques().map((t) => ({ slug: t.slug }));
}

/** Nothing is fetched at request time, so anything unknown is a 404. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const technique = getTechnique(slug);
  if (!technique) return {};
  return {
    title: technique.name,
    description: technique.summary,
  };
}

export default async function TechniquePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const technique = getTechnique(slug);
  if (!technique) notFound();

  const hero = getHeroVideo(technique);
  const prerequisites = resolveTechniqueRefs(technique.prerequisites);
  const leadsTo = resolveTechniqueRefs(technique.leadsTo);
  const relatedTerms = resolveTermRefs(technique.relatedTerms);

  const tags = [
    ...new Set([
      technique.category,
      ...technique.courtZone,
      ...technique.situation,
      ...(technique.handedness === "n/a" ? [] : [technique.handedness]),
    ]),
  ];

  return (
    <article className="mx-auto max-w-5xl px-4 py-8">
      {technique.status === "draft" && (
        <p className="mb-6 rounded-lg border border-[var(--difficulty-intermediate)] bg-[var(--difficulty-intermediate-soft)] px-4 py-2 text-sm text-[var(--difficulty-intermediate)]">
          Draft — not included in production builds.
        </p>
      )}

      {/* 1. Identity: name, difficulty, aliases, tags. Most visitors arrive
             here straight from search, so this has to answer "what is this"
             before any scrolling. */}
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {technique.name}
          </h1>
          <DifficultyBadge difficulty={technique.difficulty} />
        </div>

        {technique.aka.length > 0 && (
          <p className="mt-1 text-sm text-muted">
            aka: {technique.aka.join(", ")}
          </p>
        )}

        {/* Tags become filter links in M4-2, once /techniques can filter.
            Deduped because a value can legitimately appear in two facets —
            "transition" is both a category and a court zone. */}
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Tags">
          {tags.map((tag) => (
            <Tag key={tag}>#{tag}</Tag>
          ))}
        </ul>
      </header>

      {/* 2. Hero clip — visible without scrolling. */}
      {hero ? (
        <div className="mb-8">
          <LiteYouTube
            youtubeId={hero.youtubeId}
            title={hero.title}
            start={hero.start}
            end={hero.end}
            priority
          />
          <p className="mt-2 text-sm text-muted">
            {hero.title} · {hero.channel}
            {hero.start > 0 && ` · starts at ${formatSeconds(hero.start)}`}
          </p>
        </div>
      ) : (
        <p className="mb-8 rounded-lg border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          No clip curated for this technique yet.
        </p>
      )}

      <div className="max-w-[var(--measure)] space-y-10">
        <Section title="What it is">
          <p className="leading-relaxed">{technique.summary}</p>
        </Section>

        <Section title="When to use it">
          <ul className="list-disc space-y-2 pl-5 leading-relaxed marker:text-accent">
            {technique.whenToUse.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>

        <Section title="How to hit it">
          <ol className="space-y-3">
            {technique.howTo.map((step, i) => (
              <li key={step} className="flex gap-3 leading-relaxed">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-medium text-accent"
                >
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Common mistakes">
          <ul className="space-y-2 leading-relaxed">
            {technique.commonMistakes.map((item) => (
              <li key={item} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="text-[var(--difficulty-advanced)]"
                >
                  ✕
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        {technique.drills.length > 0 && (
          <Section title="Drills">
            <ul className="grid gap-4 sm:grid-cols-2">
              {technique.drills.map((drill) => (
                <li
                  key={drill.name}
                  className="rounded-lg border border-border bg-surface p-4"
                >
                  <h3 className="font-medium">{drill.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {drill.description}
                  </p>
                  <p className="mt-3 text-xs text-muted">
                    {drill.reps} ·{" "}
                    {drill.players === 1 ? "solo" : `${drill.players} players`}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      {/* 6. Watch it — the full curated set. Auto-fetched suggestions get their
             own clearly-labelled block here in M2-4. */}
      <section className="mt-12" aria-labelledby="watch-it">
        <h2 id="watch-it" className="mb-4 text-xl font-semibold tracking-tight">
          Watch it
        </h2>
        <VideoGrid videos={technique.videos} />
      </section>

      {/* 7. Where this sits in the skill tree. */}
      <section className="mt-12" aria-labelledby="skill-tree">
        <h2 id="skill-tree" className="mb-4 text-xl font-semibold tracking-tight">
          Where this fits
        </h2>
        <div className="grid gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-3">
          <RefColumn title="Prerequisites" refs={prerequisites} />
          <div>
            <h3 className="text-xs font-medium tracking-wide text-muted uppercase">
              This shot
            </h3>
            <p className="mt-2 font-medium text-accent">{technique.name}</p>
          </div>
          <RefColumn title="Leads to" refs={leadsTo} />
        </div>

        {relatedTerms.length > 0 && (
          <p className="mt-4 text-sm text-muted">
            Related terms:{" "}
            {relatedTerms.map((r, i) => (
              <span key={r.slug}>
                {i > 0 && ", "}
                <RefLink refItem={r} />
              </span>
            ))}
          </p>
        )}
      </section>

      <p className="mt-12 text-xs text-muted">
        Last updated {technique.updatedAt}
      </p>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const id = title.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-3 text-xl font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-muted">
      {children}
    </li>
  );
}

function RefColumn({ title, refs }: { title: string; refs: Ref[] }) {
  return (
    <div>
      <h3 className="text-xs font-medium tracking-wide text-muted uppercase">
        {title}
      </h3>
      {refs.length === 0 ? (
        <p className="mt-2 text-sm text-muted">—</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {refs.map((r) => (
            <li key={r.slug}>
              <RefLink refItem={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * A cross-reference to a technique or term that may not be published yet.
 * Unwritten neighbours render as plain text rather than as a link into a 404 —
 * the skill tree is authored ahead of the content that fills it in.
 */
function RefLink({ refItem }: { refItem: Ref }) {
  if (!refItem.href) {
    return (
      <span className="text-muted" title="Not published yet">
        {refItem.label}
      </span>
    );
  }
  return (
    <Link href={refItem.href} className="text-accent hover:underline">
      {refItem.label}
    </Link>
  );
}
