import type { Metadata } from "next";
import Link from "next/link";
import { getTerms, resolveTechniqueRefs } from "@/lib/content";

export const metadata: Metadata = {
  title: "Glossary",
  description:
    "Plain-English definitions of the pickleball terms that turn up in coaching videos and on court.",
};

/**
 * A–Z glossary.
 *
 * Definitions are shown in full rather than behind a link. They are one or two
 * sentences each — making somebody navigate for that would be worse than
 * useless, and it means Ctrl+F finds any term on one page. The per-term pages
 * exist for deep links from technique pages, not as the primary way to read
 * this.
 */
export default function GlossaryPage() {
  const terms = getTerms();

  const groups = new Map<string, typeof terms>();
  for (const term of terms) {
    const letter = term.term[0].toUpperCase();
    (groups.get(letter) ?? groups.set(letter, []).get(letter)!).push(term);
  }
  const letters = [...groups.keys()].sort();

  return (
    <div className="mx-auto max-w-[64rem] px-6 py-12 md:py-16">
      <h1 className="font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-tight font-medium">
        Glossary
      </h1>
      <p className="mt-4 max-w-[52ch] leading-relaxed text-muted">
        The words coaches use without explaining them.
      </p>

      {terms.length === 0 ? (
        <p className="mt-10 border-y border-border py-10 text-center text-muted">
          No terms yet.
        </p>
      ) : (
        <>
          <nav
            aria-label="Jump to letter"
            className="mt-8 flex flex-wrap gap-4"
          >
            {letters.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="label text-muted hover:text-accent"
              >
                {letter}
              </a>
            ))}
          </nav>

          <div className="mt-12 space-y-14">
            {letters.map((letter) => (
              <section key={letter} aria-labelledby={`letter-${letter}`}>
                <h2
                  id={`letter-${letter}`}
                  className="font-display border-b border-rule pb-2 text-2xl scroll-mt-8"
                >
                  {letter}
                </h2>
                <dl>
                  {groups.get(letter)!.map((term) => {
                    const related = resolveTechniqueRefs(
                      term.relatedTechniques,
                    );
                    return (
                      <div
                        key={term.slug}
                        id={term.slug}
                        className="border-b border-border py-5 scroll-mt-8"
                      >
                        <dt className="flex flex-wrap items-baseline gap-x-3">
                          <Link
                            href={`/glossary/${term.slug}`}
                            className="font-display text-xl hover:text-accent"
                          >
                            {term.term}
                          </Link>
                          {term.aka.length > 0 && (
                            <span className="text-sm text-muted italic">
                              {term.aka.join(", ")}
                            </span>
                          )}
                        </dt>
                        <dd className="mt-2 max-w-[var(--measure)] leading-relaxed">
                          {term.definition}
                          {related.length > 0 && (
                            <span className="label mt-3 block text-muted">
                              See{" "}
                              {related.map((r, i) => (
                                <span key={r.slug}>
                                  {i > 0 && ", "}
                                  {r.href ? (
                                    <Link
                                      href={r.href}
                                      className="text-accent hover:underline"
                                    >
                                      {r.label}
                                    </Link>
                                  ) : (
                                    r.label
                                  )}
                                </span>
                              ))}
                            </span>
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
