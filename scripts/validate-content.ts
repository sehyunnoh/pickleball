import { loadAllTechniques, loadAllTerms, loadRoadmap } from "../lib/content";
import type { Technique } from "../lib/schema";
import { log, style } from "./_shared";

/**
 * `npm run validate`
 *
 * Runs before every build. Two layers:
 *
 *   1. Shape — the Zod schemas, enforced by the loader. A file that fails here
 *      stops everything, because the loader throws.
 *   2. Integrity — the checks that need to see all the files at once: do the
 *      slugs in `prerequisites` resolve, is the skill tree acyclic, and so on.
 *      Zod cannot do these, since each file is parsed on its own.
 *
 * Errors fail the build. Warnings are things worth knowing that should not
 * block a commit — an unpublished neighbour is normal while M3 is in progress.
 */

const errors: string[] = [];
const warnings: string[] = [];

const err = (where: string, msg: string) => errors.push(`${where} → ${msg}`);
const warn = (where: string, msg: string) => warnings.push(`${where} → ${msg}`);

// Layer 1: the loaders throw with a formatted report if any file is malformed.
const techniques = loadAllTechniques();
const terms = loadAllTerms();
const roadmap = loadRoadmap();

const plannedTechniques = new Set(roadmap.techniques.map((t) => t.slug));
const plannedTerms = new Set(roadmap.terms);

/**
 * A slug that does not resolve is either a typo or content nobody has written
 * yet, and the difference matters: the skill tree is deliberately authored
 * ahead of the techniques that fill it in, so forward references are the
 * normal state for the whole of M3. `content/roadmap.json` is what separates
 * the two — planned but missing is a warning, unplanned and missing is an
 * error.
 */
function checkRef(
  where: string,
  field: string,
  slug: string,
  exists: boolean,
  planned: boolean,
) {
  if (exists) return;
  if (planned) {
    warn(
      where,
      `${field} references "${slug}", which is planned but not written yet`,
    );
  } else {
    err(
      where,
      `${field} references "${slug}", which does not exist and is not in roadmap.json`,
    );
  }
}

// Layer 2 --------------------------------------------------------------------

for (const t of techniques.values()) {
  const where = `${t.slug}.json`;

  for (const [field, slugs] of [
    ["prerequisites", t.prerequisites],
    ["leadsTo", t.leadsTo],
  ] as const) {
    for (const slug of slugs) {
      checkRef(
        where,
        field,
        slug,
        techniques.has(slug),
        plannedTechniques.has(slug),
      );
    }
  }

  for (const slug of t.relatedTerms) {
    checkRef(
      where,
      "relatedTerms",
      slug,
      terms.has(slug),
      plannedTerms.has(slug),
    );
  }

  if (t.comparison?.otherSlug) {
    checkRef(
      where,
      "comparison.otherSlug",
      t.comparison.otherSlug,
      techniques.has(t.comparison.otherSlug),
      plannedTechniques.has(t.comparison.otherSlug),
    );
  }

  // Edges are authored from both ends, so they can disagree. Not fatal — the
  // other half is often still unwritten — but it is almost always an oversight.
  // Both directions have to be checked: an edge declared only as a prerequisite
  // is just as one-sided as one declared only as a follow-up.
  for (const slug of t.leadsTo) {
    const other = techniques.get(slug);
    if (other && !other.prerequisites.includes(t.slug)) {
      warn(
        where,
        `leadsTo "${slug}", but ${slug}.json does not list "${t.slug}" as a prerequisite`,
      );
    }
  }
  for (const slug of t.prerequisites) {
    const other = techniques.get(slug);
    if (other && !other.leadsTo.includes(t.slug)) {
      warn(
        where,
        `requires "${slug}", but ${slug}.json does not list "${t.slug}" in leadsTo`,
      );
    }
  }

  if (t.status === "published") {
    for (const slug of t.prerequisites) {
      if (techniques.get(slug)?.status === "draft") {
        warn(
          where,
          `is published but its prerequisite "${slug}" is still a draft, so it renders unlinked`,
        );
      }
    }
  }

  for (const v of t.videos) {
    if (v.end !== undefined && v.end - v.start < 5) {
      warn(where, `clip ${v.youtubeId} is only ${v.end - v.start}s long`);
    }
  }
}

for (const term of terms.values()) {
  const where = `glossary/${term.slug}.json`;
  for (const slug of term.seeAlso) {
    checkRef(where, "seeAlso", slug, terms.has(slug), plannedTerms.has(slug));
  }
  for (const slug of term.relatedTechniques) {
    checkRef(
      where,
      "relatedTechniques",
      slug,
      techniques.has(slug),
      plannedTechniques.has(slug),
    );
  }
}

for (const cycle of findCycles(techniques)) {
  err("skill tree", `prerequisite cycle: ${cycle.join(" → ")}`);
}

// Report ---------------------------------------------------------------------

const published = [...techniques.values()].filter(
  (t) => t.status === "published",
);
const clips = published.reduce((n, t) => n + t.videos.length, 0);

const p0 = roadmap.techniques.filter((t) => t.priority === "P0");
const p0Published = p0.filter(
  (t) => techniques.get(t.slug)?.status === "published",
);

log.info(
  style.dim(
    `${techniques.size} techniques (${published.length} published) · ` +
      `${terms.size} terms · ${clips} curated clips`,
  ),
);
log.info(
  style.dim(
    `P0 progress: ${p0Published.length}/${p0.length} published ` +
      `(release gate is all ${p0.length})`,
  ),
);

if (warnings.length) {
  console.log();
  for (const w of warnings) log.warn(w);
}

if (errors.length) {
  console.log();
  for (const e of errors) log.fail(e);
  console.log();
  log.fail(
    `${errors.length} integrity ${errors.length === 1 ? "error" : "errors"}`,
  );
  process.exit(1);
}

log.ok("content is valid");

/**
 * Depth-first search over the prerequisite edges, returning every cycle it
 * finds. A cycle means "you must learn A before B before A", which would also
 * make the skill tree impossible to lay out.
 */
function findCycles(all: Map<string, Technique>): string[][] {
  const cycles: string[][] = [];
  const state = new Map<string, "visiting" | "done">();
  const stack: string[] = [];

  function visit(slug: string) {
    if (state.get(slug) === "done") return;
    if (state.get(slug) === "visiting") {
      cycles.push([...stack.slice(stack.indexOf(slug)), slug]);
      return;
    }
    state.set(slug, "visiting");
    stack.push(slug);
    for (const next of all.get(slug)?.prerequisites ?? []) {
      if (all.has(next)) visit(next);
    }
    stack.pop();
    state.set(slug, "done");
  }

  for (const slug of all.keys()) visit(slug);
  return cycles;
}
