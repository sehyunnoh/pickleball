import {
  die,
  fetchVideoDetails,
  GENERATED_DIR,
  log,
  parseArgs,
  style,
  techniquePath,
  today,
  writeJson,
  youtubeApiKey,
} from "./_shared";
import fs from "node:fs";
import path from "node:path";
import { TechniqueSchema, type Video } from "../lib/schema";
import { getTechniques } from "../lib/content";

/**
 * `npm run auto:curate [-- --publish] [--dry-run] [--only <slug>]`
 *
 * Fills empty `videos[]` from the titles `fetch:videos` collected, and marks
 * every clip it writes `verified: false`.
 *
 * This is a deliberate lowering of the bar, taken knowingly. Hand-picking a
 * timestamp for thirty techniques turned out to be the thing that stalls, and
 * a page with an unwatched clip on it beats a page with nothing — but only if
 * the page admits which it is. That is what `verified` buys, and why this
 * script cannot write a clip without setting it false.
 *
 * The one thing it will not do is guess. Searching "pickleball bert tutorial"
 * returns Erne videos, because there is barely a Bert video on YouTube; a
 * matcher that took the top hit would put the wrong shot on the page and look
 * confident doing it. So each candidate has to earn its place on the
 * technique's own vocabulary, and anything that cannot is reported rather than
 * written.
 */

const USAGE =
  "usage: npm run auto:curate [-- --publish] [--dry-run] [--only <slug>]";

const args = parseArgs();
const dryRun = args.flags["dry-run"] === true;
const publish = args.flags.publish === true;
const only = typeof args.flags.only === "string" ? args.flags.only : undefined;

if (args.flags.help) die(USAGE);

/** Two is the publishing floor, so two is what this aims for. */
const TARGET_CLIPS = 2;

/**
 * Words that appear in half of pickleball YouTube and therefore prove nothing
 * about whether a video is about *this* shot.
 */
const STOPWORDS = new Set([
  "pickleball",
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "how",
  "your",
  "you",
  "in",
  "of",
  "for",
  "on",
  "at",
  "with",
  "shot",
  "shots",
  "tutorial",
  "tips",
  "guide",
  "best",
  "better",
  "improve",
  "master",
  "learn",
  "play",
  "game",
  "court",
  "ball",
  "hit",
  "hitting",
  "beginner",
  "beginners",
  "pro",
  "pros",
  "like",
  "this",
  "that",
  "what",
  "why",
  "when",
  "where",
  "is",
  "are",
  "it",
  "do",
  "does",
  "not",
  "no",
  "every",
  "must",
  "know",
  "need",
  "video",
  "vs",
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

type Technique = ReturnType<typeof getTechniques>[number];

/**
 * The names this technique goes by, each as its own bag of distinctive words.
 *
 * Kept as separate bags rather than one merged set on purpose. Merging makes a
 * technique harder to match the more names it has — "Poach" would be scored
 * against every word of every alias at once and fail on a video that is
 * plainly about poaching. Each name is a separate way of being right.
 */
function nameBags(t: Technique): string[][] {
  return [t.name, ...(t.aka ?? []), t.slug.replace(/-/g, " ")]
    .map(words)
    .filter((bag) => bag.length > 0);
}

/** The best any single name manages: matched words over that name's length. */
function score(title: string, bags: string[][]): number {
  const titleWords = new Set(words(title));
  let best = 0;
  for (const bag of bags) {
    const hits = bag.filter((w) => titleWords.has(w)).length;
    best = Math.max(best, hits / bag.length);
  }
  return best;
}

/**
 * Half of one of the technique's names has to show up in the title.
 *
 * "Transition Zone Footwork" clears it on a video called "DOMINATE the
 * Transition Zone" (2 of 3) and "Bert" fails on everything currently findable
 * (0 of 1), which is the right answer in both cases — the second one is the
 * whole reason this floor exists.
 */
const FLOOR = 0.5;

type AutoResult = {
  youtubeId: string;
  title: string;
  channel: string;
  publishedAt?: string;
  duration?: string;
};

function loadAuto(): Record<string, { query: string; results: AutoResult[] }> {
  const file = path.join(GENERATED_DIR, "videos-auto.json");
  if (!fs.existsSync(file)) {
    die(
      "data/generated/videos-auto.json does not exist",
      "run `npm run fetch:videos` first",
    );
  }
  // The file is keyed by slug at the top level — there is no wrapper object.
  return JSON.parse(fs.readFileSync(file, "utf8")) as Record<
    string,
    { query: string; results: AutoResult[] }
  >;
}

async function main() {
  const apiKey = youtubeApiKey();
  if (!apiKey) {
    die(
      "YOUTUBE_API_KEY is not set",
      "embeddability cannot be checked without it, and writing a clip that " +
        "refuses to embed is the one mistake this must not make",
    );
  }

  const auto = loadAuto();
  // Drafts are in scope here: `getTechniques` only filters them out under
  // NODE_ENV=production, and this never runs there.
  const techniques = getTechniques().filter(
    (t) => (!only || t.slug === only) && t.videos.length < TARGET_CLIPS,
  );

  if (techniques.length === 0) {
    log.ok("nothing to fill — every technique already has its clips");
    return;
  }

  const filled: string[] = [];
  const published: string[] = [];
  const unmatched: { slug: string; query: string; best: string }[] = [];

  for (const t of techniques) {
    const entry = auto[t.slug];
    const candidates = entry?.results ?? [];
    if (candidates.length === 0) {
      unmatched.push({ slug: t.slug, query: "—", best: "no candidates" });
      continue;
    }

    const bags = nameBags(t);
    const ranked = candidates
      .map((c) => ({ ...c, relevance: score(c.title, bags) }))
      .filter((c) => c.relevance >= FLOOR)
      .filter((c) => !t.videos.some((v) => v.youtubeId === c.youtubeId))
      .sort((a, b) => b.relevance - a.relevance);

    if (ranked.length === 0) {
      // Report the closest miss, so the reason for the rejection is legible.
      const best = candidates
        .map((c) => ({ c, s: score(c.title, bags) }))
        .sort((a, b) => b.s - a.s)
        .map(({ c, s: sc }) => `${c.title} (${sc.toFixed(2)})`)
        .at(0);
      unmatched.push({
        slug: t.slug,
        query: entry?.query ?? "—",
        best: best ?? "—",
      });
      continue;
    }

    const want = TARGET_CLIPS - t.videos.length;
    const meta = await fetchVideoDetails(
      ranked.slice(0, want + 3).map((c) => c.youtubeId),
      apiKey,
    );

    const picked: Video[] = [];
    for (const c of ranked) {
      if (picked.length >= want) break;
      const m = meta.get(c.youtubeId);
      // Unknown embeddability is treated as a no. This script never gets a
      // human look at what it writes, so it does not get the benefit of doubt.
      if (!m || m.embeddable !== true) continue;
      picked.push({
        youtubeId: c.youtubeId,
        title: m.title,
        channel: m.channel,
        type: "instruction",
        start: 0,
        verified: false,
        curatedAt: today(),
      });
    }

    if (picked.length === 0) {
      unmatched.push({
        slug: t.slug,
        query: entry?.query ?? "—",
        best: "matched, but nothing embeddable",
      });
      continue;
    }

    const raw: unknown = JSON.parse(
      fs.readFileSync(techniquePath(t.slug), "utf8"),
    );
    const file = raw as Record<string, unknown> & { videos?: Video[] };
    const videos = [...(file.videos ?? []), ...picked];

    const willPublish =
      publish &&
      file.status === "draft" &&
      videos.length >= TARGET_CLIPS &&
      videos.some((v) => v.type === "instruction");

    const updated = {
      ...file,
      videos,
      ...(willPublish ? { status: "published", updatedAt: today() } : {}),
    };

    const result = TechniqueSchema.safeParse(updated);
    if (!result.success) {
      log.warn(
        `${t.slug}: skipped — ${result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ")}`,
      );
      continue;
    }

    if (!dryRun) writeJson(techniquePath(t.slug), updated);

    filled.push(
      `${t.slug} +${picked.length} (${picked
        .map((p) => p.youtubeId)
        .join(", ")})`,
    );
    if (willPublish) published.push(t.slug);
  }

  log.info("");
  for (const line of filled) log.ok(line);

  if (unmatched.length > 0) {
    log.info("");
    log.warn(
      `${unmatched.length} technique(s) got nothing — no candidate title ` +
        `looked like the shot:`,
    );
    for (const u of unmatched) {
      log.info(`  ${style.bold(u.slug)}  ${style.dim(u.best)}`);
    }
    log.info(
      style.dim(
        "  these need a real search term or a hand-picked clip — a wrong " +
          "video is worse than none",
      ),
    );
  }

  log.info("");
  log.ok(
    `${filled.length} technique(s) filled, ${published.length} published` +
      (dryRun ? " (dry run — nothing written)" : ""),
  );
}

main().catch((err: unknown) => {
  die(err instanceof Error ? err.message : String(err));
});
