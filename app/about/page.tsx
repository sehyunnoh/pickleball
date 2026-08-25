import type { Metadata } from "next";
import Link from "next/link";
import { getTechniques, getTerms, getVenues } from "@/lib/content";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About",
  description:
    "What this site is, who writes it, where the court information comes from, and how the video clips are used.",
  alternates: { canonical: "/about" },
};

/**
 * About.
 *
 * Three things have to be said plainly here and are easy to fudge: the videos
 * belong to the people who made them, the court listings are a copy of the
 * town's and not the town's own, and nothing about a visitor is collected.
 * Each of those is a promise the rest of the site is built to keep, so this
 * page is where they get written down.
 */
export default function AboutPage() {
  const techniques = getTechniques();
  const terms = getTerms();
  const venues = getVenues();
  const published = techniques.filter((t) => t.status === "published");
  const clips = published.reduce((n, t) => n + t.videos.length, 0);
  const watched = published.reduce(
    (n, t) => n + t.videos.filter((v) => v.verified).length,
    0,
  );
  const lastChecked = venues
    .map((v) => v.checkedAt)
    .sort()
    .at(-1);

  return (
    <article className="mx-auto max-w-[64rem] px-6 py-12 md:py-16">
      <h1 className="font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-tight font-medium">
        About
      </h1>
      <p className="mt-6 max-w-[var(--measure)] text-lg leading-relaxed">
        {SITE_NAME} is a reference for people who play pickleball in Oakville,
        Ontario. One page per shot — what it is, when to use it, how to hit it,
        what usually goes wrong — and a list of every court in town.
      </p>

      <Section title="Why it exists">
        <p>
          There is no shortage of pickleball instruction on the internet. What
          there is very little of is a way to look up one specific shot and get
          a straight answer, without reading a blog post that turns out to be
          about paddles, or scrubbing through a nineteen-minute video hoping the
          bit about the drop is in there somewhere.
        </p>
        <p>
          So the aim for every clip here is that it is picked by hand and
          timestamped to the second that actually shows the thing. That is the
          whole idea, and where a clip claims a timestamp and does not start
          there, it is a bug.
        </p>
        <p>
          Getting there takes longer than writing the pages did. Rather than
          leave most techniques with no video at all while that happens, the
          rest carry a clip chosen by matching the video&rsquo;s title against
          the technique &mdash; nobody has watched those, they start at 0:00,
          and every one of them says so on the page. They are a placeholder for
          a hand-picked clip, not a substitute for one.
        </p>
      </Section>

      <Section title="How it is written">
        <p>
          Each technique is drafted, then reviewed by somebody who plays before
          it is published. Nothing publishes itself: a technique needs at least
          two clips, one of which has to be actual instruction, before the site
          will build with it marked as finished.
        </p>
        <p>
          Diagrams show position and the path of the ball — where you are, where
          it goes, and how high it peaks on the way. They deliberately do not
          show body mechanics. Nobody can learn a swing from a top-down diagram,
          and that is what the video is for.
        </p>
        <p className="text-muted">
          {published.length} of {techniques.length} techniques published,{" "}
          {clips} clips in total &mdash; {watched} watched and timestamped,{" "}
          {clips - watched} still unverified. {terms.length} terms in the
          glossary.
        </p>
      </Section>

      <Section title="The videos">
        <p>
          Every clip is embedded from YouTube and belongs to whoever made it.
          Nothing is downloaded, re-uploaded, re-hosted or edited, and no
          captions are copied. The embeds use{" "}
          <code className="text-sm">youtube-nocookie.com</code>, and they only
          load once you click play — so if you never press play, YouTube is
          never contacted.
        </p>
        <p>
          A clip marked <em>Unverified</em> was found by searching YouTube for
          the technique&rsquo;s name and taking a result whose title plainly
          matched. That is all the checking it has had. It might open on an
          introduction, or cover the shot only in passing. Clips without that
          mark were watched, and start where they say they start.
        </p>
        <p>
          If you made one of these videos and would rather it were not linked
          here, say so and it comes down.
        </p>
      </Section>

      <Section title="The court listings">
        <p>
          The court information comes from what the{" "}
          <a
            href="https://www.oakville.ca/parks-recreation-culture/programs-activities/pickleball/"
            className="text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
            target="_blank"
            rel="noreferrer"
          >
            Town of Oakville publishes
          </a>
          . This site is not run by the town and is not affiliated with it in
          any way.
        </p>
        <p>
          It is a copy, and copies go stale. Gyms get rebooked, outdoor nets
          come down for the winter, and drop-in schedules change without anyone
          telling us. Every venue on the{" "}
          <Link
            href="/courts"
            className="text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
          >
            courts page
          </Link>{" "}
          shows the date it was last checked
          {lastChecked && ` — currently ${lastChecked}`}. Check the town&rsquo;s
          own schedule before you drive over.
        </p>
      </Section>

      <Section title="What is collected about you">
        <p>
          Nothing. There are no accounts, no sign-in, no comments and no
          newsletter. The site is a set of static pages.
        </p>
        <p>
          The one thing that remembers anything is the &ldquo;learned&rdquo;
          mark on a technique, and that is stored in your own browser. It never
          leaves your device, it is not readable by us, and clearing your
          browser clears it.
        </p>
        <p>
          There is currently no analytics on this site. That is likely to change
          — and when it does, this page will say so before it happens, and
          visitors in places that require consent will be asked for it first.
        </p>
      </Section>

      <Section title="Corrections">
        <p>
          Coaching advice is opinionated and some of it here will be wrong, or
          right for one level and wrong for another. Court details go out of
          date. Both are worth telling us about.
        </p>
        {CONTACT_EMAIL ? (
          <p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        ) : (
          <p className="text-muted">
            A contact address will be published here shortly.
          </p>
        )}
      </Section>
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
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <section aria-labelledby={id} className="mt-14">
      <h2
        id={id}
        className="font-display border-b border-rule pb-2 text-2xl font-medium"
      >
        {title}
      </h2>
      <div className="mt-5 max-w-[var(--measure)] space-y-4 leading-relaxed">
        {children}
      </div>
    </section>
  );
}
