import type { IFuseOptions } from "fuse.js";
import type { Technique, Term } from "./schema";

/**
 * The search index, built at build time and shipped with the page.
 *
 * Phase 1 content is a hundred short records at most, so the whole index is a
 * few tens of kilobytes and there is nothing to gain from a search server. It
 * is deliberately narrow: names, aliases and one line of context. Indexing the
 * full prose would drown a search for "erne" in every page that mentions one.
 */

export type SearchRecord = {
  kind: "technique" | "term";
  slug: string;
  title: string;
  aka: string[];
  /** One line under the result — the summary, or the definition for a term. */
  context: string;
  href: string;
  /** Only on techniques; shown as a badge in the result list. */
  difficulty?: string;
};

export function buildSearchIndex(
  techniques: Technique[],
  terms: Term[],
): SearchRecord[] {
  return [
    ...techniques.map((t) => ({
      kind: "technique" as const,
      slug: t.slug,
      title: t.name,
      aka: t.aka,
      context: t.summary,
      href: `/techniques/${t.slug}`,
      difficulty: t.difficulty,
    })),
    ...terms.map((t) => ({
      kind: "term" as const,
      slug: t.slug,
      title: t.term,
      aka: t.aka,
      context: t.definition,
      href: `/glossary/${t.slug}`,
    })),
  ];
}

/**
 * Weighted so a name match always beats an alias match, and both beat a hit
 * somewhere in the summary. `threshold` is tight: people search for a shot they
 * half-remember the name of, and a loose match turns that into a list of
 * everything.
 */
export const FUSE_OPTIONS: IFuseOptions<SearchRecord> = {
  keys: [
    { name: "title", weight: 3 },
    { name: "aka", weight: 2 },
    { name: "context", weight: 0.5 },
  ],
  // Tight on purpose. At 0.34 a search for "dink" also matched "landing" —
  // one substitution in four characters is a quarter of the word, and fuzzy
  // matching that loose turns a two-word query into a list of everything.
  threshold: 0.25,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 2,
};
