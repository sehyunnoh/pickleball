import { z } from "zod";

/**
 * Content schemas — the single source of truth for everything in `content/`.
 *
 * Every object is strict: an unknown key fails validation, and because the
 * loader runs at build time that means the build fails. This is deliberate.
 * A typo like `commonMistake` would otherwise silently drop a whole section
 * from a published page.
 */

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a lowercase kebab-case slug");

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be a YYYY-MM-DD date");

export const CATEGORIES = [
  "serve",
  "return",
  "transition",
  "soft-game",
  "attack",
  "defense",
  "specialty",
  "movement",
  "strategy",
] as const;

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

export const COURT_ZONES = [
  "baseline",
  "transition",
  "kitchen",
  "sideline",
] as const;

export const SITUATIONS = [
  "serve",
  "return",
  "third-shot",
  "rally",
  "defense",
] as const;

export const HANDEDNESS = ["forehand", "backhand", "both", "n/a"] as const;

/** Ordered: this is also the tab order in the "Watch it" section. */
export const VIDEO_TYPES = [
  "instruction",
  "slow-mo",
  "gameplay",
  "drill",
] as const;

export const VIDEO_TYPE_LABELS: Record<VideoType, string> = {
  instruction: "Instruction",
  "slow-mo": "Slow-mo",
  gameplay: "In a real game",
  drill: "Drill",
};

export const DifficultySchema = z.enum(DIFFICULTIES);
export const VideoTypeSchema = z.enum(VIDEO_TYPES);

/**
 * A curated clip. `start`/`end` are the point of this whole site: we link to a
 * *segment* that demonstrates the technique, not to an eight-minute video.
 */
export const VideoSchema = z
  .strictObject({
    youtubeId: z
      .string()
      .regex(/^[A-Za-z0-9_-]{11}$/, "must be an 11-character YouTube video id"),
    title: z.string().min(1),
    channel: z.string().min(1),
    type: VideoTypeSchema,
    /** Seconds from the top of the video. 0 means "play from the start". */
    start: z.int().min(0).default(0),
    /** Optional — during early curation, setting `end` too is often not worth
     *  the time it costs. See DEVELOPMENT_PLAN.md §11. */
    end: z.int().min(1).optional(),
    note: z.string().min(1).optional(),
    curatedAt: isoDate,
  })
  .refine((v) => v.end === undefined || v.end > v.start, {
    error: "`end` must be greater than `start`",
    path: ["end"],
  });

export const DrillSchema = z.strictObject({
  name: z.string().min(1),
  description: z.string().min(1),
  /** Free text, not a number: "3 sets of 20", "5 minutes". */
  reps: z.string().min(1),
  players: z.int().min(1).max(4),
});

export const TechniqueSchema = z
  .strictObject({
    slug,
    name: z.string().min(1),
    aka: z.array(z.string().min(1)).default([]),

    category: z.enum(CATEGORIES),
    difficulty: DifficultySchema,
    courtZone: z.array(z.enum(COURT_ZONES)).min(1),
    situation: z.array(z.enum(SITUATIONS)).min(1),
    handedness: z.enum(HANDEDNESS),

    summary: z.string().min(1),
    whenToUse: z.array(z.string().min(1)).min(1),
    /** The approval gate asks for 4–6 action instructions; the schema allows a
     *  little slack so a draft is not blocked mid-edit. */
    howTo: z.array(z.string().min(1)).min(3).max(8),
    commonMistakes: z.array(z.string().min(1)).min(1),
    drills: z.array(DrillSchema).default([]),

    /** These two fields are the skill-tree edges. There is no separate graph
     *  file — the tree is derived from them. */
    prerequisites: z.array(slug).default([]),
    leadsTo: z.array(slug).default([]),
    relatedTerms: z.array(slug).default([]),

    videos: z.array(VideoSchema).default([]),

    status: z.enum(["draft", "published"]),
    updatedAt: isoDate,
  })
  .check((ctx) => {
    const t = ctx.value;

    // Publishing rules. Drafts are allowed to be incomplete — that is what
    // `draft` is for — but anything that ships must clear these.
    if (t.status === "published") {
      if (t.videos.length < 2) {
        ctx.issues.push({
          code: "custom",
          input: t.videos,
          path: ["videos"],
          message: "a published technique needs at least 2 curated videos",
        });
      }
      if (!t.videos.some((v) => v.type === "instruction")) {
        ctx.issues.push({
          code: "custom",
          input: t.videos,
          path: ["videos"],
          message:
            "at least one curated video must be of type `instruction`",
        });
      }
    }

    const ids = t.videos.map((v) => v.youtubeId);
    const duplicate = ids.find((id, i) => ids.indexOf(id) !== i);
    if (duplicate) {
      ctx.issues.push({
        code: "custom",
        input: t.videos,
        path: ["videos"],
        message: `duplicate youtubeId: ${duplicate}`,
      });
    }

    if (t.prerequisites.includes(t.slug) || t.leadsTo.includes(t.slug)) {
      ctx.issues.push({
        code: "custom",
        input: t.slug,
        path: ["prerequisites"],
        message: "a technique cannot be its own prerequisite or follow-up",
      });
    }
  });

export const TermSchema = z.strictObject({
  slug,
  term: z.string().min(1),
  aka: z.array(z.string().min(1)).default([]),
  definition: z.string().min(1),
  seeAlso: z.array(slug).default([]),
  relatedTechniques: z.array(slug).default([]),
});

/** Build-script output (`npm run fetch:videos`). Never read at runtime by the
 *  YouTube API — it is committed and read as a plain file. */
export const AutoVideoSchema = z.strictObject({
  youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  title: z.string(),
  channel: z.string(),
  publishedAt: z.string(),
  duration: z.string(),
});

export const AutoVideosFileSchema = z.record(
  slug,
  z.strictObject({
    fetchedAt: z.string(),
    query: z.string(),
    results: z.array(AutoVideoSchema),
  }),
);

export type Technique = z.infer<typeof TechniqueSchema>;
export type Term = z.infer<typeof TermSchema>;
export type Video = z.infer<typeof VideoSchema>;
export type Drill = z.infer<typeof DrillSchema>;
export type VideoType = (typeof VIDEO_TYPES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type Category = (typeof CATEGORIES)[number];
export type AutoVideo = z.infer<typeof AutoVideoSchema>;
