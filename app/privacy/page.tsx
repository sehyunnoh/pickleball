import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What this site stores, what it does not, and why there is no cookie banner to dismiss.",
  alternates: { canonical: "/privacy" },
};

/**
 * Privacy.
 *
 * Short on purpose. Every claim on this page is one a reader could check by
 * opening devtools, so none of it is written to be technically survivable —
 * if a sentence here stops matching what the site does, the sentence is the
 * bug. There is no consent control any more because there is nothing left to
 * consent to.
 */
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-[64rem] px-6 py-12 md:py-16">
      <h1 className="font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-tight font-medium">
        Privacy
      </h1>
      <p className="mt-6 max-w-[var(--measure)] text-lg leading-relaxed">
        {SITE_NAME} is a set of static pages. There are no accounts, no sign-in,
        no comments, no newsletter and no form to fill in, so there is very
        little to say here — but what there is, is said plainly.
      </p>

      <Section title="What stays in your browser">
        <p>
          One thing, in your own browser&rsquo;s local storage, which is not
          sent anywhere and is not readable by us:
        </p>
        <ul className="space-y-2 border-t border-border pt-4">
          <Item label="Learned marks">
            Which techniques you have ticked off. Clearing your browser clears
            them, and they do not follow you to another device.
          </Item>
        </ul>
      </Section>

      <Section title="Analytics">
        <p>
          None. Nothing about your visit is recorded anywhere — no cookie, no
          identifier, no server log line kept beyond what GitHub Pages needs to
          serve the request. There is no banner asking you to accept anything
          because there is nothing to accept.
        </p>
        <p>
          Until 2026 this site used Google Analytics behind a consent bar.
          Almost nobody answered the bar, so almost nothing was counted &mdash;
          a question in everyone&rsquo;s way for data that never arrived. The
          bar and the cookies are both gone, and nothing replaced them.
        </p>
      </Section>

      <Section title="The video clips">
        <p>
          Every clip is embedded from{" "}
          <code className="text-sm">youtube-nocookie.com</code> and loads only
          when you press play. Before that, all you have downloaded is a
          thumbnail. Press play and you are talking to YouTube on their terms
          like anywhere else on the web; do not press play and they never hear
          from you.
        </p>
      </Section>

      <Section title="Hosting">
        <p>
          The site is served by GitHub Pages, which keeps request logs the way
          every web host does — IP address, page, timestamp — for operations
          and abuse handling. That happens below this site and cannot be
          consented away by a banner; it is the same thing that happens when
          you load any web page.
        </p>
        <p>
          Nothing is sold, shared with advertisers or joined up with anything
          else. There are no ads on the site today. If that ever changes, this
          page changes first &mdash; and ads would bring a consent question
          back with them, because ad cookies are the kind you do have to be
          asked about.
        </p>
      </Section>

      <Section title="Asking about any of this">
        {CONTACT_EMAIL ? (
          <p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
            >
              {CONTACT_EMAIL}
            </a>
            . There is no account to delete and no record of you to hand over,
            but if you want either question answered in writing, ask.
          </p>
        ) : (
          <p className="text-muted">
            A contact address will be published here shortly. In the meantime,
            see{" "}
            <Link
              href="/about"
              className="text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
            >
              About
            </Link>
            .
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

function Item({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="border-b border-border pb-4">
      <span className="label block text-muted">{label}</span>
      <span className="mt-1 block">{children}</span>
    </li>
  );
}
