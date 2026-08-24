import type { Metadata } from "next";
import { getVenues } from "@/lib/content";
import {
  VENUE_ACCESS_LABELS,
  type Venue,
  type VenueAccess,
} from "@/lib/schema";

export const metadata: Metadata = {
  title: "Where to play in Oakville",
  description:
    "Indoor and outdoor pickleball courts in Oakville, Ontario: which community centres have courts, how many, and which parks have dedicated outdoor courts.",
  alternates: { canonical: "/courts" },
};

/**
 * Where to play.
 *
 * Court listings age badly — gyms get rebooked, outdoor nets come down for
 * the winter, a new facility opens and the town page catches up a month
 * later. So every venue shows when it was last checked and links to the
 * source, and the page says plainly that it is a copy rather than the
 * authority. Sending somebody across town to a locked gym is worse than
 * telling them nothing.
 */
export default function CourtsPage() {
  const venues = getVenues();
  const indoor = venues.filter((v) => v.kind === "indoor");
  const outdoor = venues.filter((v) => v.kind === "outdoor");

  const totalIndoor = indoor.reduce((n, v) => n + (v.courts ?? 0), 0);
  const totalOutdoor = outdoor.reduce((n, v) => n + (v.courts ?? 0), 0);

  const lastChecked = venues
    .map((v) => v.checkedAt)
    .sort()
    .at(-1);
  const source = venues[0]?.sourceUrl;

  return (
    <div className="mx-auto max-w-[64rem] px-6 py-12 md:py-16">
      <h1 className="font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-tight font-medium">
        Where to play in Oakville
      </h1>
      <p className="mt-4 max-w-[54ch] text-lg leading-relaxed">
        {totalIndoor} indoor courts across {indoor.length} community centres,
        and {totalOutdoor} dedicated outdoor courts in {outdoor.length} parks.
      </p>

      {venues.length === 0 ? (
        <p className="mt-10 border-y border-border py-10 text-center text-muted">
          No courts listed yet.
        </p>
      ) : (
        <>
          <Section
            title="Indoor"
            blurb="Community centre gyms. Most run drop-in sessions and registered programs — check the schedule before you go, because the same gym is basketball on Tuesdays."
            venues={indoor}
          />
          <Section
            title="Outdoor"
            blurb="Parks with dedicated pickleball courts: permanent lines and posts, not lines painted over a tennis court. First come, first served. The town also has yellow pickleball lines on shared courts in a further 26 parks."
            venues={outdoor}
          />
        </>
      )}

      <aside className="mt-16 border-t border-rule pt-5">
        <h2 className="label text-muted">Before you drive over</h2>
        <p className="mt-3 max-w-[var(--measure)] leading-relaxed text-muted">
          This is a copy of what the Town of Oakville publishes, not the
          authority on it. Drop-in times, closures and seasonal changes are not
          reflected here. Check the town&rsquo;s own page — and its schedule —
          before making the trip.
        </p>
        {source && (
          <p className="mt-4">
            <a
              href={source}
              className="label text-accent hover:underline"
              rel="noreferrer"
              target="_blank"
            >
              Town of Oakville — Pickleball ↗
            </a>
          </p>
        )}
        {lastChecked && (
          <p className="label mt-3 text-muted">Last checked {lastChecked}</p>
        )}
      </aside>
    </div>
  );
}

function Section({
  title,
  blurb,
  venues,
}: {
  title: string;
  blurb: string;
  venues: Venue[];
}) {
  if (venues.length === 0) return null;
  const id = title.toLowerCase();

  return (
    <section className="mt-14" aria-labelledby={id}>
      <h2 id={id} className="font-display border-b border-rule pb-2 text-2xl">
        {title}
      </h2>
      <p className="mt-4 max-w-[var(--measure)] leading-relaxed text-muted">
        {blurb}
      </p>

      <ul className="mt-6">
        {venues.map((v) => (
          <li
            key={v.slug}
            className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-border py-5"
          >
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-xl">{v.name}</h3>
              <p className="label mt-1.5 flex flex-wrap items-center gap-x-3 text-muted">
                {v.access.map((a: VenueAccess) => (
                  <span key={a}>{VENUE_ACCESS_LABELS[a]}</span>
                ))}
                {v.lights && <span>Lit for evening play</span>}
              </p>
              {v.address && (
                <p className="mt-1 text-sm text-muted">{v.address}</p>
              )}
              {v.notes && (
                <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted">
                  {v.notes}
                </p>
              )}
            </div>
            <p className="label tabular shrink-0 text-muted">
              {v.courts ? `${v.courts} court${v.courts > 1 ? "s" : ""}` : "—"}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
