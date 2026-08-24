import type { Metadata } from "next";
import Link from "next/link";
import ConsentControl from "@/components/ConsentControl";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What this site stores, what it does not, the one third-party script it can load, and how to switch that off.",
  alternates: { canonical: "/privacy" },
};

/**
 * Privacy.
 *
 * Short on purpose. Every claim on this page is one a reader could check by
 * opening devtools, so none of it is written to be technically survivable —
 * if a sentence here stops matching what the site does, the sentence is the
 * bug. The consent control is on this page rather than buried in a preference
 * screen because withdrawal has to cost what granting cost.
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
          Two things, both in your own browser&rsquo;s local storage, neither of
          which is sent anywhere or readable by us:
        </p>
        <ul className="space-y-2 border-t border-border pt-4">
          <Item label="Learned marks">
            Which techniques you have ticked off. Clearing your browser clears
            them, and they do not follow you to another device.
          </Item>
          <Item label="Your analytics answer">
            Whether you said yes or no below, so you are not asked twice.
          </Item>
        </ul>
      </Section>

      <Section title="Analytics">
        <p>
          If it is switched on for this deployment, the site can load Google
          Analytics 4 — and only after you say so. Until then no script is
          fetched and no cookie is set. It records the usual: which pages get
          opened, roughly where in the world from, which browser, and how people
          arrived. It is used for one thing, which is knowing which shots to
          write about next.
        </p>
        <p>
          What Google does with that data afterwards is between you and Google,
          and their{" "}
          <a
            href="https://policies.google.com/privacy"
            className="text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
            target="_blank"
            rel="noreferrer"
          >
            privacy policy
          </a>{" "}
          covers it. That is precisely why the default is no.
        </p>
        <ConsentControl />
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
          The site is served by Vercel, which keeps request logs the way every
          web host does — IP address, page, timestamp — for operations and abuse
          handling. That happens below this site and cannot be consented away by
          a banner; it is the same thing that happens when you load any web
          page.
        </p>
        <p>
          Nothing is sold, shared with advertisers or joined up with anything
          else. There are no ads on the site today. If that ever changes, this
          page changes first, and the consent question changes with it.
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
