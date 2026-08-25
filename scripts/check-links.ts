import { getVenues, loadAllTechniques } from "../lib/content";
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
 *
 * It also checks the venue source links. Every court listing carries a "read
 * from here" link and a date, and /about promises the listing is a copy of the
 * town's own — a promise that quietly breaks when a municipal site is
 * reorganised and the citation 404s. Nothing was watching that.
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

  const venueProblems = await checkVenues();

  if (venueProblems) process.exit(1);

  log.ok("every curated clip is still alive, and every source link resolves");
}

/**
 * How old a court listing may get before it stops being a claim anybody should
 * trust. Gyms get rebooked and outdoor nets come down for the winter, so this
 * is deliberately shorter than it would be for the technique pages.
 */
const STALE_AFTER_DAYS = 120;

/** Returns true if anything is wrong, so the caller can fail the run. */
async function checkVenues(): Promise<boolean> {
  const venues = getVenues();
  if (venues.length === 0) return false;

  // One request per distinct URL, not per venue: sixteen listings currently
  // cite the same town page, and hammering it sixteen times weekly is rude.
  const urls = [...new Set(venues.map((v) => v.sourceUrl))];
  const brokenUrls = new Map<string, string>();

  for (const url of urls) {
    try {
      // HEAD first — some municipal sites answer it, and it is the cheapest
      // question. Fall back to GET, because plenty of them do not.
      let res = await fetch(url, { method: "HEAD", redirect: "follow" });
      if (!res.ok) res = await fetch(url, { redirect: "follow" });
      if (!res.ok) brokenUrls.set(url, `HTTP ${res.status}`);
    } catch (error) {
      brokenUrls.set(
        url,
        error instanceof Error ? error.message : "unreachable",
      );
    }
  }

  const today = new Date(new Date().toISOString().slice(0, 10));
  const stale = venues.filter((v) => {
    const days =
      (today.getTime() - new Date(v.checkedAt).getTime()) / 86_400_000;
    return days > STALE_AFTER_DAYS;
  });

  log.info(
    style.dim(
      `checked ${urls.length} source link(s) behind ${venues.length} venues`,
    ),
  );

  for (const v of stale) {
    log.warn(
      `${v.slug} → last checked ${v.checkedAt}, over ${STALE_AFTER_DAYS} days ago`,
    );
  }

  if (brokenUrls.size > 0) {
    console.log();
    for (const [url, why] of brokenUrls) {
      const affected = venues.filter((v) => v.sourceUrl === url).length;
      log.fail(`${url} → ${why} (cited by ${affected} venue(s))`);
    }
    console.log();
    log.fail(
      "a court listing cites a page that no longer resolves — /about says the listing is a copy of the town's, and that link is the proof",
    );
    return true;
  }

  if (stale.length > 0) {
    console.log();
    log.fail(
      `${stale.length} venue(s) have not been re-checked in ${STALE_AFTER_DAYS} days — open the source, confirm the details, and bump checkedAt`,
    );
    return true;
  }

  return false;
}

// The package is CommonJS, so tsx cannot give us top-level await.
main().catch((error: unknown) => {
  log.fail(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
