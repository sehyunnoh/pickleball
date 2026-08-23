import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ComparisonTable from "@/components/ComparisonTable";
import CourtDiagram from "@/components/CourtDiagram";
import LiteYouTube from "@/components/LiteYouTube";
import ShotProfile from "@/components/ShotProfile";
import VideoGrid from "@/components/VideoGrid";
import {
  getHeroVideo,
  getTechnique,
  getTechniques,
  resolveTechniqueRefs,
  resolveTermRefs,
  type Ref,
} from "@/lib/content";
import {
  COURT_WIDTH,
  netCrossingFraction,
  zoneAt,
  type Point,
} from "@/lib/court";
import { formatSeconds } from "@/lib/format";
import type { Drill, ShotPath, Technique } from "@/lib/schema";

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

/** Roman numerals for the execution steps. Six is as far as the schema goes. */
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

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

  // Sections are numbered in the margin, so they have to be counted in source
  // order — and the optional ones must not leave a gap in the sequence.
  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  return (
    <article className="mx-auto max-w-[64rem] px-6 py-12 md:py-16">
      {technique.status === "draft" && (
        <p className="label mb-10 border-l-2 border-[var(--difficulty-intermediate)] py-1 pl-3 text-[var(--difficulty-intermediate)]">
          Draft — excluded from production builds
        </p>
      )}

      {/* One grid governs the whole page: the metadata rail hangs in the left
          column and everything else lines up in the right one, so the title,
          the prose and the diagrams share a single left edge. */}
      <div className="grid gap-x-14 lg:grid-cols-[9.5rem_minmax(0,1fr)]">
        {/* Title block. Everything a reader landing from search needs before
          they decide whether to stay. */}
        <header className="lg:col-start-2">
          <p className="label text-muted">
            {technique.category} · {technique.difficulty}
          </p>

          <h1 className="font-display mt-4 text-[clamp(2.75rem,7vw,4.5rem)] leading-[0.95] font-medium">
            {technique.name}
          </h1>

          {technique.aka.length > 0 && (
            <p className="mt-5 border-t border-rule pt-3 text-muted italic">
              {technique.aka.join(" · ")}
            </p>
          )}
        </header>

        {/* Hero clip, above the fold, no card around it. */}
        <div className="mt-10 lg:col-start-2">
          {hero ? (
            <figure>
              <LiteYouTube
                youtubeId={hero.youtubeId}
                title={hero.title}
                start={hero.start}
                end={hero.end}
                priority
              />
              <figcaption className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
                <span>{hero.title}</span>
                <span aria-hidden="true">·</span>
                <span>{hero.channel}</span>
                {hero.start > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tabular">
                      from {formatSeconds(hero.start)}
                    </span>
                  </>
                )}
              </figcaption>
            </figure>
          ) : (
            <p className="border-y border-border py-10 text-center text-sm text-muted">
              No clip curated for this technique yet.
            </p>
          )}
        </div>

        {/* The rail stays put while the prose scrolls past it. On a phone it
          folds into a strip above the sections. */}
        <aside className="mt-12 lg:sticky lg:top-10 lg:col-start-1 lg:row-start-3 lg:mt-16 lg:self-start">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-rule pt-4 sm:grid-cols-4 lg:grid-cols-1 lg:gap-y-6">
            <Meta label="Zone" values={technique.courtZone} />
            <Meta label="Situation" values={technique.situation} />
            {technique.handedness !== "n/a" && (
              <Meta label="Hand" values={[technique.handedness]} />
            )}
            <Meta label="Updated" values={[technique.updatedAt]} />
          </dl>
        </aside>

        <div className="mt-4 min-w-0 lg:col-start-2 lg:row-start-3 lg:mt-6">
          <Section n={num()} title="What it is">
            <p className="max-w-[var(--measure)] text-lg leading-relaxed">
              {technique.summary}
            </p>
          </Section>

          <Section n={num()} title="When to use it">
            <ul className="max-w-[var(--measure)]">
              {technique.whenToUse.map((item) => (
                <li
                  key={item}
                  className="flex gap-4 border-b border-border py-3 last:border-0"
                >
                  <span aria-hidden="true" className="text-muted">
                    —
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section n={num()} title="How to hit it">
            <ol className="max-w-[var(--measure)]">
              {technique.howTo.map((step, i) => (
                <li
                  key={step}
                  className="flex gap-5 border-b border-border py-4 last:border-0"
                >
                  <span
                    aria-hidden="true"
                    className="label w-6 shrink-0 pt-1.5 text-accent"
                  >
                    {ROMAN[i]}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section n={num()} title="What goes wrong">
            <ul className="max-w-[var(--measure)]">
              {technique.commonMistakes.map((item) => (
                <li
                  key={item}
                  className="flex gap-5 border-b border-border py-4 last:border-0"
                >
                  <span
                    aria-hidden="true"
                    className="w-6 shrink-0 text-lg text-[var(--difficulty-advanced)]"
                  >
                    ✕
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          {technique.court && (
            <Section n={num()} title="The shape of the shot">
              <div className="grid gap-10 xl:grid-cols-2">
                <Plate caption="Seen from above. You are on the left; the ball travels right.">
                  <CourtDiagram
                    diagram={technique.court}
                    title={`${technique.name}: court positions and ball path`}
                    description={courtDescription(technique)}
                  />
                </Plate>

                {technique.court.shot && (
                  <Plate
                    caption="Seen from the sideline. Watch where the ball peaks."
                    note={
                      technique.court.mistake && (
                        <span className="flex items-start gap-2">
                          <span
                            aria-hidden="true"
                            className="mt-2.5 inline-block h-0 w-6 shrink-0 border-t-2 border-dashed border-[var(--difficulty-advanced)]"
                          />
                          <span>{technique.court.mistake.label}</span>
                        </span>
                      )
                    }
                  >
                    <ShotProfile
                      shot={technique.court.shot}
                      mistake={technique.court.mistake}
                      title={`${technique.name}: height of the ball across the net`}
                      description={profileDescription(technique)}
                    />
                  </Plate>
                )}
              </div>
            </Section>
          )}

          {technique.drills.length > 0 && (
            <Section n={num()} title="Drills">
              <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
                {technique.drills.map((drill) => (
                  <li key={drill.name} className="border-t border-rule pt-4">
                    <h3 className="font-display text-lg">{drill.name}</h3>
                    <p className="label mt-1 text-muted">
                      {drill.reps} ·{" "}
                      {drill.players === 1
                        ? "solo"
                        : `${drill.players} players`}
                    </p>
                    {drill.court && (
                      <div className="mt-4">
                        <CourtDiagram
                          diagram={drill.court}
                          title={`${drill.name}: court setup`}
                          description={drillDescription(drill)}
                          compact
                        />
                      </div>
                    )}
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                      {drill.description}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {technique.comparison && (
            <Section n={num()} title={technique.comparison.title}>
              <ComparisonTable
                comparison={technique.comparison}
                selfLabel={technique.name}
                otherHref={
                  technique.comparison.otherSlug &&
                  getTechnique(technique.comparison.otherSlug)
                    ? `/techniques/${technique.comparison.otherSlug}`
                    : null
                }
              />
            </Section>
          )}

          <Section n={num()} title="Watch it">
            <VideoGrid videos={technique.videos} />
          </Section>

          <Section n={num()} title="Where this fits" last>
            <div className="grid gap-8 border-t border-rule pt-5 sm:grid-cols-3">
              <RefColumn title="Comes after" refs={prerequisites} />
              <div>
                <h3 className="label text-muted">This shot</h3>
                <p className="font-display mt-2 text-accent">
                  {technique.name}
                </p>
              </div>
              <RefColumn title="Leads to" refs={leadsTo} />
            </div>

            {relatedTerms.length > 0 && (
              <p className="mt-8 text-sm text-muted">
                <span className="label">Related terms</span>{" "}
                {relatedTerms.map((r, i) => (
                  <span key={r.slug}>
                    {i > 0 && ", "}
                    <RefLink refItem={r} />
                  </span>
                ))}
              </p>
            )}
          </Section>
        </div>
      </div>
    </article>
  );
}

/**
 * A numbered section, the number set in the margin on wide screens the way a
 * manual runs its figure numbers, and inline once there is no margin to use.
 */
function Section({
  n,
  title,
  children,
  last = false,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <section aria-labelledby={id} className={last ? "py-12" : "py-12"}>
      <h2 id={id} className="mb-6 flex items-baseline gap-4 lg:-ml-14 lg:gap-6">
        {/* Right-aligned so the figure sits close to its heading rather than
            drifting into the metadata rail on the other side of the gutter. */}
        <span
          aria-hidden="true"
          className="label tabular w-8 text-right text-muted"
        >
          {n}
        </span>
        <span className="font-display text-2xl font-medium md:text-[1.75rem]">
          {title}
        </span>
      </h2>
      {children}
    </section>
  );
}

/** One row of the metadata rail. */
function Meta({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <dt className="label text-muted">{label}</dt>
      <dd className="mt-1.5 text-sm leading-snug">
        {values.map((v) => (
          <span key={v} className="block">
            {v}
          </span>
        ))}
      </dd>
    </div>
  );
}

/** A diagram with its caption, presented as a plate in a book. */
function Plate({
  caption,
  note,
  children,
}: {
  caption: string;
  note?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <figure className="min-w-0">
      <div className="border-y border-border py-4">{children}</div>
      <figcaption className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
        <span className="block">{caption}</span>
        {note}
      </figcaption>
    </figure>
  );
}

function RefColumn({ title, refs }: { title: string; refs: Ref[] }) {
  return (
    <div>
      <h3 className="label text-muted">{title}</h3>
      {refs.length === 0 ? (
        <p className="mt-2 text-muted">—</p>
      ) : (
        <ul className="mt-2 space-y-1">
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
    <Link
      href={refItem.href}
      className="text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
    >
      {refItem.label}
    </Link>
  );
}

/* ------------------------------------------------------------------ *
 * Alternative text for the diagrams.
 *
 * Every diagram restates in words what it shows. The prose sections already
 * carry the coaching, so these stay factual and spatial — who is where, what
 * goes where — instead of repeating the teaching points.
 * ------------------------------------------------------------------ */

function courtDescription(technique: Technique): string {
  const c = technique.court;
  if (!c) return "";
  const parts: string[] = [];
  if (c.players.length) {
    parts.push(
      `Players: ${c.players
        .map((p) => `${p.role} in the ${describePoint(p.at)}`)
        .join(", ")}.`,
    );
  }
  if (c.shot) {
    parts.push(
      `The shot travels from the ${describePoint(c.shot.from)} to the ${describePoint(
        c.shot.to,
      )}.`,
    );
  }
  if (c.movement.length) {
    parts.push(
      `Afterwards ${c.movement
        .map((m) => `${m.role} moves to the ${describePoint(m.to)}`)
        .join(", ")}.`,
    );
  }
  return parts.join(" ");
}

function profileDescription(technique: Technique): string {
  const c = technique.court;
  if (!c?.shot) return "";
  const good = `The ball peaks ${peakSide(c.shot)} at about ${Math.round(
    c.shot.peakHeight,
  )} feet, then lands in ${zoneAt(c.shot.to[1])}.`;
  if (!c.mistake) return good;
  return `${good} The dashed line is the same shot peaking ${peakSide(
    c.mistake.path,
  )} and landing in ${zoneAt(c.mistake.path.to[1])}.`;
}

function drillDescription(drill: Drill): string {
  const c = drill.court;
  if (!c) return "";
  const players = c.players
    .map((p) => `${p.role} in the ${describePoint(p.at)}`)
    .join(", ");
  const targets = c.targets.length
    ? ` Target: ${c.targets
        .map((t) => `${t.label} in the ${describePoint(t.at)}`)
        .join(", ")}.`
    : "";
  return `${players}.${targets}`;
}

function describePoint(point: Point): string {
  const [lateral, depth] = point;
  const side =
    lateral < COURT_WIDTH / 3
      ? "left of"
      : lateral > (COURT_WIDTH * 2) / 3
        ? "right of"
        : "middle of";
  return `${side} ${zoneAt(depth)}`;
}

/** Whether a shot reaches its apex before or after it crosses the net. */
function peakSide(path: ShotPath): string {
  const crossing = netCrossingFraction(path.from, path.to);
  return path.peakAt < crossing ? "before the net" : "after the net";
}
