import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  RoadmapSchema,
  TechniqueSchema,
  TermSchema,
  VenueSchema,
  type Roadmap,
  type Technique,
  type Term,
  type Venue,
} from "./schema";

/**
 * Content loading and validation.
 *
 * Everything here runs at build time (Server Components / SSG only). Content
 * is read once and cached for the life of the process.
 *
 * Fail-fast: if any file in `content/` is invalid, this throws and the build
 * stops. A broken JSON file must never reach production as a half-rendered
 * page.
 */

const CONTENT_DIR = path.join(process.cwd(), "content");
const TECHNIQUES_DIR = path.join(CONTENT_DIR, "techniques");
const GLOSSARY_DIR = path.join(CONTENT_DIR, "glossary");
const VENUES_DIR = path.join(CONTENT_DIR, "venues");

/**
 * Drafts are excluded from production builds so unfinished techniques can be
 * committed safely, but they *are* served by `next dev` — otherwise you could
 * not look at a technique while writing it.
 */
const INCLUDE_DRAFTS = process.env.NODE_ENV !== "production";

function readJsonDir(dir: string): { file: string; data: unknown }[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((file) => {
      const full = path.join(dir, file);
      try {
        return { file, data: JSON.parse(fs.readFileSync(full, "utf8")) };
      } catch (cause) {
        throw new Error(
          `${path.relative(process.cwd(), full)} is not valid JSON: ${
            (cause as Error).message
          }`,
        );
      }
    });
}

function formatIssues(file: string, error: z.ZodError): string {
  return error.issues
    .map((i) => {
      const where = i.path.length ? i.path.join(".") : "(root)";
      return `  ${file} → ${where}: ${i.message}`;
    })
    .join("\n");
}

/**
 * Parses every file in a directory and reports *all* failures at once. Being
 * told about one bad file at a time turns a content batch into a slow loop.
 */
function parseAll<T>(
  dir: string,
  schema: z.ZodType<T>,
  label: string,
): Map<string, T> {
  const entries = readJsonDir(dir);
  const errors: string[] = [];
  const parsed = new Map<string, T>();

  for (const { file, data } of entries) {
    const result = schema.safeParse(data);
    if (!result.success) {
      errors.push(formatIssues(file, result.error));
      continue;
    }
    const item = result.data as T & { slug: string };
    if (parsed.has(item.slug)) {
      errors.push(`  ${file} → slug "${item.slug}" is already used`);
      continue;
    }
    // The filename is the slug. Keeping them in sync means a URL maps to a
    // file you can find without grepping.
    const expected = `${item.slug}.json`;
    if (file !== expected) {
      errors.push(`  ${file} → filename should match slug (${expected})`);
      continue;
    }
    parsed.set(item.slug, item);
  }

  if (errors.length) {
    throw new Error(
      `Invalid ${label} content — build stopped.\n${errors.join("\n")}\n`,
    );
  }
  return parsed;
}

/**
 * Cached for the build, never in dev.
 *
 * Content files are plain JSON read through `fs`, so nothing invalidates a
 * module-level cache when one changes — the dev server would keep serving the
 * version it read at boot. Writing content is the bulk of the work on this
 * project (DEVELOPMENT_PLAN.md §6), so an edit has to show up on refresh.
 * Re-reading a few dozen small files per request costs nothing.
 */
let techniqueCache: Map<string, Technique> | null = null;
let termCache: Map<string, Term> | null = null;

const CACHE = process.env.NODE_ENV === "production";

/**
 * Every technique on disk, drafts included, regardless of environment.
 *
 * The site should not use this — it exists for `npm run validate` and the
 * content CLIs, which have to check the files nobody is allowed to publish yet.
 */
export function loadAllTechniques(): Map<string, Technique> {
  return parseAll(TECHNIQUES_DIR, TechniqueSchema, "technique");
}

export function loadAllTerms(): Map<string, Term> {
  return parseAll(GLOSSARY_DIR, TermSchema, "glossary");
}

/**
 * Places to play, indoor first and then by size — the question is "where can I
 * play tonight", and a six-court gym answers it better than a single outdoor
 * court does.
 */
export function getVenues(): Venue[] {
  return [...parseAll(VENUES_DIR, VenueSchema, "venue").values()].sort(
    (a, b) =>
      Number(b.kind === "indoor") - Number(a.kind === "indoor") ||
      (b.courts ?? 0) - (a.courts ?? 0) ||
      a.name.localeCompare(b.name),
  );
}

/** What Phase 1 plans to cover. See RoadmapSchema for why this exists. */
export function loadRoadmap(): Roadmap {
  const file = path.join(CONTENT_DIR, "roadmap.json");
  const result = RoadmapSchema.safeParse(
    JSON.parse(fs.readFileSync(file, "utf8")),
  );
  if (!result.success) {
    throw new Error(
      `content/roadmap.json is invalid:\n${formatIssues("roadmap.json", result.error)}`,
    );
  }
  return result.data;
}

function allTechniquesIncludingDrafts(): Map<string, Technique> {
  if (!CACHE) return parseAll(TECHNIQUES_DIR, TechniqueSchema, "technique");
  techniqueCache ??= parseAll(TECHNIQUES_DIR, TechniqueSchema, "technique");
  return techniqueCache;
}

function allTerms(): Map<string, Term> {
  if (!CACHE) return parseAll(GLOSSARY_DIR, TermSchema, "glossary");
  termCache ??= parseAll(GLOSSARY_DIR, TermSchema, "glossary");
  return termCache;
}

/** Every technique visible in the current environment, alphabetical by name. */
export function getTechniques(): Technique[] {
  return [...allTechniquesIncludingDrafts().values()]
    .filter((t) => INCLUDE_DRAFTS || t.status === "published")
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getTechnique(slug: string): Technique | undefined {
  const t = allTechniquesIncludingDrafts().get(slug);
  if (!t) return undefined;
  if (!INCLUDE_DRAFTS && t.status !== "published") return undefined;
  return t;
}

export function getTerms(): Term[] {
  return [...allTerms().values()].sort((a, b) => a.term.localeCompare(b.term));
}

export function getTerm(slug: string): Term | undefined {
  return allTerms().get(slug);
}

/**
 * A cross-reference that may not resolve.
 *
 * Techniques legitimately point at neighbours that are still drafts (or not
 * written yet), so the page renders those as plain text instead of a dead
 * link. Referential integrity — "does this slug exist at all?" — is a separate
 * concern, checked by `npm run validate`.
 */
export type Ref = {
  slug: string;
  label: string;
  href: string | null;
};

function toTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function resolveTechniqueRefs(slugs: string[]): Ref[] {
  return slugs.map((slug) => {
    const t = getTechnique(slug);
    return {
      slug,
      label: t?.name ?? toTitle(slug),
      href: t ? `/techniques/${slug}` : null,
    };
  });
}

export function resolveTermRefs(slugs: string[]): Ref[] {
  return slugs.map((slug) => {
    const term = getTerm(slug);
    return {
      slug,
      label: term?.term ?? toTitle(slug),
      href: term ? `/glossary/${slug}` : null,
    };
  });
}

/**
 * The hero video: the first `instruction` clip if there is one, otherwise the
 * first clip at all. Visitors mostly land here from search, so the thing above
 * the fold has to be the clearest explanation available.
 */
export function getHeroVideo(technique: Technique) {
  return (
    technique.videos.find((v) => v.type === "instruction") ??
    technique.videos[0]
  );
}
