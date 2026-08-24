import type { Technique, Term } from "./schema";

/**
 * Structured data.
 *
 * The bet this whole site makes is long-tail search — "how do I stop popping
 * up my third shot drop", not "third shot drop" (REQUIREMENTS.md §15). Marking
 * a technique page up as a HowTo with real steps is what gives that a chance,
 * and VideoObject is what lets a curated clip surface as a video result rather
 * than as a line of text.
 *
 * Everything here is generated from content that already exists on the page.
 * Structured data that claims something the page does not show is a manual
 * action waiting to happen.
 */

/**
 * The canonical origin. Vercel exposes the production domain at build time, so
 * previews describe themselves correctly and production does too, without
 * anyone hard-coding a domain before it is chosen (REQUIREMENTS.md §16).
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const SITE_NAME = "Pickleball Technique";

function absolute(path: string): string {
  return `${siteUrl()}${path}`;
}

/** Google wants an ISO 8601 duration for a clip; we store plain seconds. */
function isoDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `PT${m > 0 ? `${m}M` : ""}${s}S`;
}

export function techniqueJsonLd(technique: Technique): object {
  const url = absolute(`/techniques/${technique.slug}`);

  const howTo = {
    "@type": "HowTo",
    "@id": `${url}#howto`,
    name: `How to hit a ${technique.name} in pickleball`,
    description: technique.summary,
    url,
    step: technique.howTo.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text,
    })),
    ...(technique.drills.length > 0
      ? {
          tool: technique.drills.map((d) => ({
            "@type": "HowToTool",
            name: d.name,
          })),
        }
      : {}),
  };

  // One VideoObject per curated clip. `startOffset` is the point of this site,
  // so it is the part that must be right: it tells Google the clip begins part
  // of the way into somebody else's video.
  const videos = technique.videos.map((v) => ({
    "@type": "VideoObject",
    name: v.title,
    description: v.note ?? `${technique.name}: ${v.type} clip.`,
    thumbnailUrl: `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`,
    uploadDate: v.curatedAt,
    embedUrl: `https://www.youtube-nocookie.com/embed/${v.youtubeId}`,
    publisher: { "@type": "Organization", name: v.channel },
    ...(v.end !== undefined
      ? {
          hasPart: {
            "@type": "Clip",
            name: v.title,
            startOffset: v.start,
            endOffset: v.end,
            url: `https://www.youtube.com/watch?v=${v.youtubeId}&t=${v.start}`,
          },
          duration: isoDuration(v.end - v.start),
        }
      : {}),
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [howTo, ...videos],
  };
}

export function termJsonLd(term: Term): object {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: term.term,
    description: term.definition,
    url: absolute(`/glossary/${term.slug}`),
    ...(term.aka.length > 0 ? { alternateName: term.aka } : {}),
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${SITE_NAME} glossary`,
      url: absolute("/glossary"),
    },
  };
}

/** Renders a JSON-LD block. Server components only. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // The payload is our own content, not user input, and JSON.stringify
      // escapes what matters. `<` is escaped anyway so the block cannot be
      // broken out of by a technique name containing markup.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
