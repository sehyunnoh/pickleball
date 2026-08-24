import fs from "node:fs";
import path from "node:path";

/**
 * Shared plumbing for the content CLIs.
 *
 * These scripts run under tsx, outside Next, so nothing here may assume the
 * framework: no `next/*` imports, no bundler aliases, and `.env.local` has to
 * be read by hand because only `next dev` loads it for us.
 */

export const ROOT = process.cwd();
export const TECHNIQUES_DIR = path.join(ROOT, "content", "techniques");
export const GLOSSARY_DIR = path.join(ROOT, "content", "glossary");
export const GENERATED_DIR = path.join(ROOT, "data", "generated");

/* ----------------------------------------------------------------- *
 * Output
 * ----------------------------------------------------------------- */

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code: string, s: string) => (useColor ? `[${code}m${s}[0m` : s);

export const style = {
  bold: (s: string) => paint("1", s),
  dim: (s: string) => paint("2", s),
  red: (s: string) => paint("31", s),
  green: (s: string) => paint("32", s),
  yellow: (s: string) => paint("33", s),
  cyan: (s: string) => paint("36", s),
};

export const log = {
  info: (msg: string) => console.log(msg),
  ok: (msg: string) => console.log(`${style.green("✓")} ${msg}`),
  warn: (msg: string) => console.log(`${style.yellow("!")} ${msg}`),
  fail: (msg: string) => console.error(`${style.red("✕")} ${msg}`),
};

/** Print the message and stop. Every CLI failure goes through here. */
export function die(msg: string, hint?: string): never {
  log.fail(msg);
  if (hint) console.error(`  ${style.dim(hint)}`);
  process.exit(1);
}

/* ----------------------------------------------------------------- *
 * Arguments
 * ----------------------------------------------------------------- */

export type Args = {
  flags: Record<string, string | true>;
  positional: string[];
};

/**
 * Parses `--key value`, `--key=value` and bare `--flag`.
 *
 * Note that npm needs `--` before script arguments:
 *   npm run add:video -- --technique atp --url "…"
 */
export function parseArgs(argv = process.argv.slice(2)): Args {
  const flags: Record<string, string | true> = {};
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const body = arg.slice(2);
    const eq = body.indexOf("=");
    if (eq !== -1) {
      flags[body.slice(0, eq)] = body.slice(eq + 1);
      continue;
    }
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith("--")) {
      flags[body] = next;
      i++;
    } else {
      flags[body] = true;
    }
  }
  return { flags, positional };
}

export function requireFlag(args: Args, name: string, usage: string): string {
  const value = args.flags[name];
  if (typeof value !== "string" || value.length === 0) {
    die(`missing --${name}`, usage);
  }
  return value;
}

/* ----------------------------------------------------------------- *
 * Files
 * ----------------------------------------------------------------- */

export function techniquePath(slug: string): string {
  return path.join(TECHNIQUES_DIR, `${slug}.json`);
}

export function readTechniqueFile(slug: string): unknown {
  const file = techniquePath(slug);
  if (!fs.existsSync(file)) {
    die(
      `no technique named "${slug}"`,
      `expected ${path.relative(ROOT, file)}`,
    );
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/**
 * Writes JSON the way the hand-authored files are written, so a CLI edit does
 * not show up in review as a whole-file reformat.
 */
export function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ----------------------------------------------------------------- *
 * Environment
 * ----------------------------------------------------------------- */

/**
 * Minimal `.env.local` reader. Only `KEY=value` lines, optionally quoted.
 * Anything the shell already set wins, so CI can pass the key as a secret.
 */
export function loadEnvLocal(): void {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.trim().replace(/^["'](.*)["']$/, "$1");
  }
}

export function youtubeApiKey(): string | undefined {
  loadEnvLocal();
  return process.env.YOUTUBE_API_KEY || undefined;
}

/* ----------------------------------------------------------------- *
 * YouTube
 * ----------------------------------------------------------------- */

export type VideoMeta = {
  youtubeId: string;
  title: string;
  channel: string;
  /** Seconds. Undefined when the metadata came from oEmbed. */
  durationSeconds?: number;
  /** Undefined means "not checked" — oEmbed does not report it. */
  embeddable?: boolean;
  viewCount?: number;
  publishedAt?: string;
  /** ISO 8601, as the API returns it. Stored verbatim in videos-auto.json. */
  duration?: string;
};

/** Accepts watch URLs, youtu.be, /embed/, /shorts/ and a bare id. */
export function parseYouTubeUrl(input: string): {
  youtubeId: string;
  start: number;
} {
  const bare = /^[A-Za-z0-9_-]{11}$/;
  if (bare.test(input)) return { youtubeId: input, start: 0 };

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    die(`could not read "${input}" as a YouTube URL`);
  }

  let youtubeId: string | null = null;
  if (url.hostname === "youtu.be") {
    youtubeId = url.pathname.slice(1).split("/")[0];
  } else if (/(^|\.)youtube(-nocookie)?\.com$/.test(url.hostname)) {
    youtubeId =
      url.searchParams.get("v") ??
      /\/(?:embed|shorts|v)\/([A-Za-z0-9_-]{11})/.exec(url.pathname)?.[1] ??
      null;
  }

  if (!youtubeId || !bare.test(youtubeId)) {
    die(`could not find a video id in "${input}"`);
  }

  return { youtubeId, start: parseTimeParam(url) };
}

/** `?t=95`, `?t=1m35s`, `#t=95`, `?start=95` — all seen in the wild. */
function parseTimeParam(url: URL): number {
  const raw =
    url.searchParams.get("t") ??
    url.searchParams.get("start") ??
    /[#&]t=([^&]+)/.exec(url.hash)?.[1] ??
    null;
  if (!raw) return 0;

  if (/^\d+s?$/.test(raw)) return parseInt(raw, 10);

  const hms = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(raw);
  if (hms && hms.slice(1).some(Boolean)) {
    const [, h, m, s] = hms;
    return (
      parseInt(h ?? "0", 10) * 3600 +
      parseInt(m ?? "0", 10) * 60 +
      parseInt(s ?? "0", 10)
    );
  }
  return 0;
}

export function parseIsoDuration(iso: string): number {
  const m = /^P(?:\d+D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return 0;
  const [, h, min, s] = m;
  return (
    parseInt(h ?? "0", 10) * 3600 +
    parseInt(min ?? "0", 10) * 60 +
    parseInt(s ?? "0", 10)
  );
}

/**
 * Public oEmbed endpoint. No API key, no quota — but it only reports title and
 * channel, and it cannot tell us whether a video may be embedded.
 *
 * Returns null when the video is private, deleted or otherwise unavailable,
 * which is exactly what `check:links` needs to know.
 */
export async function fetchOEmbed(
  youtubeId: string,
): Promise<VideoMeta | null> {
  const target = `https://www.youtube.com/watch?v=${youtubeId}`;
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    target,
  )}&format=json`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = (await res.json()) as { title: string; author_name: string };
  return {
    youtubeId,
    title: data.title,
    channel: data.author_name,
  };
}

type ApiVideoItem = {
  id: string;
  snippet: { title: string; channelTitle: string; publishedAt: string };
  contentDetails: { duration: string };
  status: { embeddable: boolean };
  statistics?: { viewCount?: string };
};

/**
 * `videos.list` — 1 quota unit per call regardless of how many ids, so always
 * batch. Ids that come back missing were deleted or made private.
 */
export async function fetchVideoDetails(
  ids: string[],
  apiKey: string,
): Promise<Map<string, VideoMeta>> {
  const found = new Map<string, VideoMeta>();

  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet,contentDetails,status,statistics");
    url.searchParams.set("id", batch.join(","));
    url.searchParams.set("key", apiKey);

    const res = await fetch(url);
    if (!res.ok) {
      die(
        `YouTube API returned ${res.status}`,
        await res.text().then((t) => t.slice(0, 300)),
      );
    }
    const data = (await res.json()) as { items: ApiVideoItem[] };

    for (const item of data.items) {
      found.set(item.id, {
        youtubeId: item.id,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        duration: item.contentDetails.duration,
        durationSeconds: parseIsoDuration(item.contentDetails.duration),
        embeddable: item.status.embeddable,
        viewCount: Number(item.statistics?.viewCount ?? 0),
      });
    }
  }
  return found;
}

/** `search.list` — 100 quota units per call. Use sparingly. */
export async function searchVideos(
  query: string,
  apiKey: string,
  maxResults = 10,
): Promise<string[]> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url);
  if (!res.ok) {
    die(
      `YouTube search returned ${res.status}`,
      await res.text().then((t) => t.slice(0, 300)),
    );
  }
  const data = (await res.json()) as { items: { id: { videoId: string } }[] };
  return data.items.map((i) => i.id.videoId);
}

export function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
