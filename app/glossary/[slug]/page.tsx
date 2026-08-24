import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTerm,
  getTerms,
  resolveTechniqueRefs,
  resolveTermRefs,
  type Ref,
} from "@/lib/content";
import { JsonLd, termJsonLd } from "@/lib/seo";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getTerms().map((t) => ({ slug: t.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const term = getTerm(slug);
  if (!term) return {};
  return {
    title: term.term,
    description: term.definition,
    alternates: { canonical: `/glossary/${term.slug}` },
  };
}

/**
 * A single term.
 *
 * Deliberately short and pointed outward: somebody who lands here from a
 * search for "what is the kitchen in pickleball" wants the sentence, and then
 * wants the shots that depend on knowing it.
 */
export default async function TermPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const term = getTerm(slug);
  if (!term) notFound();

  const related = resolveTechniqueRefs(term.relatedTechniques);
  const seeAlso = resolveTermRefs(term.seeAlso);

  return (
    <article className="mx-auto max-w-[64rem] px-6 py-12 md:py-16">
      <JsonLd data={termJsonLd(term)} />

      <p className="label text-muted">
        <Link href="/glossary" className="hover:text-accent">
          Glossary
        </Link>
      </p>

      <h1 className="font-display mt-4 text-[clamp(2.25rem,6vw,3.5rem)] leading-tight font-medium">
        {term.term}
      </h1>

      {term.aka.length > 0 && (
        <p className="mt-3 border-t border-rule pt-3 text-muted italic">
          {term.aka.join(" · ")}
        </p>
      )}

      <p className="mt-8 max-w-[var(--measure)] text-lg leading-relaxed">
        {term.definition}
      </p>

      {related.length > 0 && (
        <section className="mt-12" aria-labelledby="related">
          <h2
            id="related"
            className="label border-b border-rule pb-2 text-muted"
          >
            Where it matters
          </h2>
          <ul className="mt-4 space-y-3">
            {related.map((r) => (
              <li key={r.slug} className="font-display text-xl">
                <RefLink refItem={r} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {seeAlso.length > 0 && (
        <p className="mt-10 text-sm text-muted">
          <span className="label">See also</span>{" "}
          {seeAlso.map((r, i) => (
            <span key={r.slug}>
              {i > 0 && ", "}
              <RefLink refItem={r} />
            </span>
          ))}
        </p>
      )}
    </article>
  );
}

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
