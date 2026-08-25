import path from "node:path";
import { TechniqueSchema, VIDEO_TYPES, type Video } from "../lib/schema";
import {
  die,
  fetchOEmbed,
  fetchVideoDetails,
  formatSeconds,
  log,
  parseArgs,
  parseYouTubeUrl,
  readTechniqueFile,
  requireFlag,
  ROOT,
  style,
  techniquePath,
  today,
  writeJson,
  youtubeApiKey,
  type VideoMeta,
} from "./_shared";

/**
 * `npm run add:video -- --technique atp --url "https://youtu.be/xxxx?t=95" --type slow-mo`
 *
 * The whole point of this script is that curating a clip costs one pasted URL.
 * DEVELOPMENT_PLAN.md §5 is blunt about why: hand-writing JSON is what stops
 * curation three days in, and curation is the product.
 *
 * Metadata comes from the Data API when a key is configured — that is the only
 * source that reports `embeddable`, and registering a clip that refuses to
 * embed is the specific accident this guards against. Without a key it falls
 * back to the public oEmbed endpoint, which gives title and channel but cannot
 * answer the embeddable question; the script says so rather than pretending.
 */

const USAGE =
  "usage: npm run add:video -- --technique <slug> --url <youtube url> --type <" +
  VIDEO_TYPES.join("|") +
  '> [--end 128] [--note "..."] [--unverified]';

const args = parseArgs();
const slug = requireFlag(args, "technique", USAGE);
const url = requireFlag(args, "url", USAGE);
const type = requireFlag(args, "type", USAGE);

if (!(VIDEO_TYPES as readonly string[]).includes(type)) {
  die(`--type must be one of: ${VIDEO_TYPES.join(", ")}`);
}

/**
 * `--unverified` records that nobody has watched this clip — it was chosen off
 * the title. The page says so next to it. Omitting the flag is a claim that
 * you played it and the technique is on screen at `start`.
 */
const unverified = args.flags.unverified === true;

const { youtubeId, start: parsedStart } = parseYouTubeUrl(url);
const start = numberFlag("start") ?? parsedStart;
const end = numberFlag("end");

if (end !== undefined && end <= start) {
  die(`--end (${end}) must be greater than the start (${start})`);
}

const raw = readTechniqueFile(slug) as { videos?: Video[] };
const existing = raw.videos ?? [];

if (existing.some((v) => v.youtubeId === youtubeId)) {
  die(
    `${slug} already has ${youtubeId}`,
    "edit the JSON directly if you meant to change its timestamps",
  );
}

async function main() {
  const meta = await resolveMeta(youtubeId);

  if (meta.embeddable === false) {
    die(
      `${youtubeId} cannot be embedded — the uploader disabled it`,
      "pick a different clip; this one would render as an error box on the page",
    );
  }

  if (meta.durationSeconds !== undefined && start >= meta.durationSeconds) {
    die(
      `start ${formatSeconds(start)} is past the end of the video (${formatSeconds(
        meta.durationSeconds,
      )})`,
    );
  }

  const video = {
    youtubeId,
    title: meta.title,
    channel: meta.channel,
    type,
    start,
    ...(end !== undefined ? { end } : {}),
    ...(typeof args.flags.note === "string" ? { note: args.flags.note } : {}),
    ...(unverified ? { verified: false } : {}),
    curatedAt: today(),
  };

  const updated = { ...raw, videos: [...existing, video] };

  // Validate the whole file, not just the new entry: appending a second clip can
  // be what makes a draft publishable, and a broken write here fails the build.
  const result = TechniqueSchema.safeParse(updated);
  if (!result.success) {
    die(
      `adding this clip would make ${slug}.json invalid`,
      result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    );
  }

  writeJson(techniquePath(slug), updated);

  log.ok(`added to ${style.cyan(path.relative(ROOT, techniquePath(slug)))}`);
  log.info("");
  log.info(`  ${style.bold(meta.title)}`);
  log.info(`  ${style.dim(meta.channel)}`);
  log.info(
    `  ${style.dim("clip")}     ${formatSeconds(start)}${
      end !== undefined ? `–${formatSeconds(end)}` : " onwards"
    }`,
  );
  log.info(`  ${style.dim("type")}     ${type}`);
  if (unverified) {
    log.info(`  ${style.dim("checked")}  no — labelled unverified on the page`);
  }
  log.info(
    `  ${style.dim("clips")}    ${updated.videos.length} on this technique`,
  );
  log.info("");
  log.info(
    `  ${style.dim("preview")}  http://localhost:3000/techniques/${slug}`,
  );

  if (meta.embeddable === undefined) {
    log.info("");
    log.warn(
      "embeddability was not verified — no YOUTUBE_API_KEY, so this came from oEmbed",
    );
    log.info(style.dim("  play it once on the preview page before publishing"));
  }
}

// The package is CommonJS, so tsx cannot give us top-level await.
main().catch((error: unknown) => {
  log.fail(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

/* ----------------------------------------------------------------- */

function numberFlag(name: string): number | undefined {
  const raw = args.flags[name];
  if (typeof raw !== "string") return undefined;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) die(`--${name} must be a whole number`);
  return n;
}

async function resolveMeta(id: string): Promise<VideoMeta> {
  // Explicit overrides win, so a clip can still be added when both lookups are
  // unavailable — an offline train is not a reason to lose a find.
  const title = args.flags.title;
  const channel = args.flags.channel;
  if (typeof title === "string" && typeof channel === "string") {
    return { youtubeId: id, title, channel };
  }

  const key = youtubeApiKey();
  if (key) {
    const details = await fetchVideoDetails([id], key);
    const found = details.get(id);
    if (!found) {
      die(
        `the API does not know ${id}`,
        "the video is private, deleted, or the id is wrong",
      );
    }
    return found;
  }

  const oembed = await fetchOEmbed(id);
  if (!oembed) {
    die(
      `could not read ${id} — it looks private or deleted`,
      "pass --title and --channel to add it anyway",
    );
  }
  return oembed;
}
