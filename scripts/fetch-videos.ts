import fs from "node:fs";
import path from "node:path";
import { loadAllTechniques } from "../lib/content";
import { AutoVideosFileSchema, type AutoVideo } from "../lib/schema";
import {
  die,
  fetchVideoDetails,
  GENERATED_DIR,
  log,
  parseArgs,
  ROOT,
  searchVideos,
  style,
  writeJson,
  youtubeApiKey,
} from "./_shared";

/**
 * `npm run fetch:videos [-- --only <slug>] [--dry-run]`
 *
 * Fills the gaps where curation has not caught up, and only there. Curated
 * clips are the product; these are a labelled "we have not checked these"
 * shelf underneath them.
 *
 * Runs at build time and writes `data/generated/videos-auto.json`, which is
 * committed. The site never calls YouTube at request time — that keeps the key
 * off the client and the quota bounded, and it makes builds reproducible.
 *
 * Quota: search.list is 100 units per technique, videos.list 1 per batch of
 * 50. Thirty techniques is about 3,000 of the daily 10,000, so a weekly cron
 * has room to spare.
 */

const MIN_DURATION_SECONDS = 60; // below this it is a Short, and Shorts teach nothing
const MIN_VIEWS = 1_000;
const RESULTS_PER_TECHNIQUE = 10;
const KEEP_PER_TECHNIQUE = 6;

/** Channels that reliably produce clickbait or re-uploads. Grows with use. */
const BLOCKED_CHANNELS: string[] = [];

const args = parseArgs();
const dryRun = args.flags["dry-run"] === true;
const only = typeof args.flags.only === "string" ? args.flags.only : undefined;

const maybeKey = youtubeApiKey();
if (!maybeKey) {
  die(
    "YOUTUBE_API_KEY is not set",
    "put it in .env.local (M0-3). Everything else in the toolchain works without it.",
  );
}
// Narrowed here rather than inside main(): a guard at module scope does not
// flow into a nested function body, since TypeScript cannot know when it runs.
const apiKey: string = maybeKey;

const techniques = [...loadAllTechniques().values()]
  .filter((t) => !only || t.slug === only)
  .sort((a, b) => a.slug.localeCompare(b.slug));

if (techniques.length === 0) {
  die(only ? `no technique named "${only}"` : "no techniques to fetch for");
}

const outFile = path.join(GENERATED_DIR, "videos-auto.json");
const fetchedAt = new Date().toISOString();
const output: Record<
  string,
  { fetchedAt: string; query: string; results: AutoVideo[] }
> = {};

let quotaUnits = 0;

async function main() {
  for (const technique of techniques) {
    // The alias is often what people actually type into YouTube — "ATP" finds
    // far more than "around the post" does.
    const term = technique.aka[0] ?? technique.name;
    const query = `pickleball ${term} tutorial`;

    const ids = await searchVideos(query, apiKey, RESULTS_PER_TECHNIQUE);
    quotaUnits += 100;

    const details = await fetchVideoDetails(ids, apiKey);
    quotaUnits += 1;

    const curated = new Set(technique.videos.map((v) => v.youtubeId));
    const rejected: string[] = [];

    const results: AutoVideo[] = [];
    for (const id of ids) {
      const meta = details.get(id);
      if (!meta) continue;

      // Already curated by hand, so it belongs above this shelf, not on it.
      if (curated.has(id)) continue;

      if (meta.embeddable === false) {
        rejected.push(`${id} not embeddable`);
        continue;
      }
      if ((meta.durationSeconds ?? 0) < MIN_DURATION_SECONDS) {
        rejected.push(`${id} is ${meta.durationSeconds}s (Short)`);
        continue;
      }
      if ((meta.viewCount ?? 0) < MIN_VIEWS) {
        rejected.push(`${id} has ${meta.viewCount} views`);
        continue;
      }
      if (BLOCKED_CHANNELS.includes(meta.channel)) {
        rejected.push(`${id} from blocked channel ${meta.channel}`);
        continue;
      }

      results.push({
        youtubeId: id,
        title: meta.title,
        channel: meta.channel,
        publishedAt: meta.publishedAt ?? "",
        duration: meta.duration ?? "",
      });
    }

    output[technique.slug] = {
      fetchedAt,
      query,
      results: results.slice(0, KEEP_PER_TECHNIQUE),
    };

    log.info(
      `${style.cyan(technique.slug.padEnd(28))} ${String(
        output[technique.slug].results.length,
      ).padStart(2)} kept ${style.dim(`of ${ids.length}`)}`,
    );
    for (const r of rejected) log.info(`  ${style.dim(`skipped ${r}`)}`);
  }

  const parsed = AutoVideosFileSchema.safeParse(output);
  if (!parsed.success) {
    die(
      "the fetched results do not satisfy AutoVideosFileSchema — this is a bug",
      parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    );
  }

  log.info("");
  log.info(
    style.dim(`used about ${quotaUnits} quota units of the daily 10,000`),
  );

  if (dryRun) {
    log.warn(`--dry-run: not writing ${path.relative(ROOT, outFile)}`);
  } else {
    // Merged, not replaced: `--only` must not wipe every other technique.
    const merged = { ...readExisting(), ...output };
    writeJson(outFile, merged);
    log.ok(`wrote ${style.cyan(path.relative(ROOT, outFile))}`);
  }
}

// The package is CommonJS, so tsx cannot give us top-level await.
main().catch((error: unknown) => {
  log.fail(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

function readExisting(): Record<string, unknown> {
  if (!fs.existsSync(outFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(outFile, "utf8"));
  } catch {
    // A corrupt generated file is not worth failing over — it is derived data
    // and this run is about to rewrite it.
    return {};
  }
}
