import { loadAllTechniques } from "../lib/content";
import {
  fetchOEmbed,
  fetchVideoDetails,
  log,
  parseArgs,
  style,
  youtubeApiKey,
} from "./_shared";

/**
 * `npm run check:links`
 *
 * Every curated clip is a link to somebody else's video, and those disappear:
 * deleted, made private, or embedding switched off. A dead clip on a published
 * technique is the worst failure this site has, because the timestamp was the
 * reason to visit.
 *
 * Runs weekly in CI (M6-5). Exits non-zero if anything is dead, which is what
 * opens the issue.
 *
 * With a key it uses videos.list: one call per 50 clips, and it also reports
 * embeddability. Without one it falls back to the public oEmbed endpoint,
 * which answers "does this still exist" but not "may we embed it" — that gap
 * is stated in the summary rather than glossed over.
 */

const args = parseArgs();
const verbose = args.flags.verbose === true;

const techniques = [...loadAllTechniques().values()].sort((a, b) =>
  a.slug.localeCompare(b.slug),
);

type Entry = {
  slug: string;
  youtubeId: string;
  title: string;
  published: boolean;
};

const entries: Entry[] = techniques.flatMap((t) =>
  t.videos.map((v) => ({
    slug: t.slug,
    youtubeId: v.youtubeId,
    title: v.title,
    published: t.status === "published",
  })),
);

if (entries.length === 0) {
  log.info("no curated clips to check");
  process.exit(0);
}

const apiKey = youtubeApiKey();
const dead: Entry[] = [];
const unembeddable: Entry[] = [];
let checkedEmbeddable = false;

async function main() {
  if (apiKey) {
    checkedEmbeddable = true;
    const ids = [...new Set(entries.map((e) => e.youtubeId))];
    const details = await fetchVideoDetails(ids, apiKey);

    for (const entry of entries) {
      const meta = details.get(entry.youtubeId);
      if (!meta) {
        dead.push(entry);
      } else if (meta.embeddable === false) {
        unembeddable.push(entry);
      } else if (verbose) {
        log.info(style.dim(`ok  ${entry.slug} ${entry.youtubeId}`));
      }
    }
  } else {
    log.warn("no YOUTUBE_API_KEY — falling back to oEmbed");
    for (const entry of entries) {
      const meta = await fetchOEmbed(entry.youtubeId);
      if (!meta) {
        dead.push(entry);
      } else if (verbose) {
        log.info(style.dim(`ok  ${entry.slug} ${entry.youtubeId}`));
      }
    }
  }

  // Report ---------------------------------------------------------------------

  log.info(
    style.dim(
      `checked ${entries.length} clips across ${techniques.length} techniques`,
    ),
  );

  for (const entry of unembeddable) {
    log.warn(
      `${entry.slug} → ${entry.youtubeId} can no longer be embedded (${entry.title})`,
    );
  }

  if (dead.length) {
    console.log();
    for (const entry of dead) {
      const flag = entry.published
        ? style.red("PUBLISHED")
        : style.dim("draft");
      log.fail(
        `${entry.slug} → ${entry.youtubeId} is gone [${flag}] (${entry.title})`,
      );
    }
    console.log();
    log.fail(`${dead.length} dead ${dead.length === 1 ? "clip" : "clips"}`);
    log.info(
      style.dim(
        "replace them with `npm run add:video`, then delete the dead entry from the JSON",
      ),
    );
    process.exit(1);
  }

  if (unembeddable.length) {
    console.log();
    log.fail(
      `${unembeddable.length} clip(s) are alive but no longer embeddable — they render as an error box`,
    );
    process.exit(1);
  }

  if (!checkedEmbeddable) {
    log.warn("embeddability was not checked (needs YOUTUBE_API_KEY)");
  }

  log.ok("every curated clip is still alive");
}

// The package is CommonJS, so tsx cannot give us top-level await.
main().catch((error: unknown) => {
  log.fail(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
