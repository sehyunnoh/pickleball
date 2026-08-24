import fs from "node:fs";
import path from "node:path";
import { loadRoadmap } from "../lib/content";
import {
  CATEGORIES,
  COURT_ZONES,
  DIFFICULTIES,
  HANDEDNESS,
  SITUATIONS,
  TechniqueSchema,
} from "../lib/schema";
import {
  die,
  log,
  parseArgs,
  requireFlag,
  ROOT,
  style,
  techniquePath,
  today,
  writeJson,
} from "./_shared";

/**
 * `npm run new:technique -- --slug reset --category defense --difficulty intermediate`
 *
 * Writes a draft skeleton with every field present, including the court
 * diagram, so authoring is editing rather than remembering. The diagram fields
 * are the ones nobody would type from scratch — a plausible default setup
 * costs nothing here and saves the coordinate lookup twenty times over.
 *
 * `--name` is optional: if the slug is on the roadmap, the name comes from
 * there, which also keeps the two spellings in sync.
 */

const USAGE = `usage: npm run new:technique -- --slug <slug> [--name "Name"] --category <${CATEGORIES.join(
  "|",
)}> --difficulty <${DIFFICULTIES.join("|")}> [--zone baseline,transition] [--situation rally] [--hand both]`;

const args = parseArgs();
const slug = requireFlag(args, "slug", USAGE);

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  die(`"${slug}" is not a kebab-case slug`, USAGE);
}

const file = techniquePath(slug);
if (fs.existsSync(file)) {
  die(
    `${path.relative(ROOT, file)} already exists`,
    "delete it first if you meant to start over",
  );
}

const roadmap = loadRoadmap();
const planned = roadmap.techniques.find((t) => t.slug === slug);

if (!planned) {
  log.warn(
    `"${slug}" is not in content/roadmap.json — add it there too, or validate will treat references to it as typos`,
  );
}

const name =
  (typeof args.flags.name === "string" ? args.flags.name : undefined) ??
  planned?.name;
if (!name) {
  die(`no --name given and "${slug}" is not on the roadmap`, USAGE);
}

const list = (flag: string, fallback: string[]): string[] => {
  const raw = args.flags[flag];
  return typeof raw === "string"
    ? raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : fallback;
};

const one = <T extends readonly string[]>(
  flag: string,
  allowed: T,
  fallback: T[number],
): T[number] => {
  const raw = args.flags[flag];
  if (typeof raw !== "string") return fallback;
  if (!allowed.includes(raw)) {
    die(`--${flag} must be one of: ${allowed.join(", ")}`);
  }
  return raw;
};

const skeleton = {
  slug,
  name,
  aka: [],

  category: one("category", CATEGORIES, "transition"),
  difficulty: one("difficulty", DIFFICULTIES, "intermediate"),
  courtZone: list("zone", ["kitchen"]),
  situation: list("situation", ["rally"]),
  handedness: one("hand", HANDEDNESS, "both"),

  summary: `TODO: two or three sentences on what the ${name.toLowerCase()} is, in plain language.`,
  whenToUse: [
    "TODO: a situation you recognise from a real rally.",
    "TODO: another one.",
    "TODO: a third.",
  ],
  howTo: [
    "TODO: an action instruction, not a description.",
    "TODO: the next thing your body does.",
    "TODO: contact — where the ball meets the paddle.",
    "TODO: what happens after contact.",
  ],
  commonMistakes: [
    "TODO: a mistake you actually see on a court, not general advice.",
    "TODO: another.",
  ],
  drills: [
    {
      name: "TODO: drill name",
      description: "TODO: what the feeder does, what you do, how you score it.",
      reps: "3 sets of 20",
      players: 2,
      court: {
        players: [
          { role: "you", at: [10, 1] },
          { role: "feeder", at: [10, 30] },
        ],
      },
    },
  ],

  // Court coordinates are [lateral, depth] in feet: lateral 0–20 across,
  // depth 0 at your baseline to 44 at theirs. Net is 22, kitchen lines 15/29.
  court: {
    players: [
      { role: "you", at: [14, 1] },
      { role: "partner", at: [5, 1] },
      { role: "opponent", at: [5, 30] },
      { role: "opponent", at: [15, 30] },
    ],
    shot: { from: [14, 1], to: [8, 26], peakAt: 0.4, peakHeight: 8 },
  },

  prerequisites: [],
  leadsTo: [],
  relatedTerms: [],

  videos: [],

  status: "draft",
  updatedAt: today(),
};

// Parse before writing: a skeleton that cannot load is worse than no skeleton.
const result = TechniqueSchema.safeParse(skeleton);
if (!result.success) {
  die(
    "the generated skeleton does not satisfy the schema — this is a bug in new-technique.ts",
    result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; "),
  );
}

writeJson(file, skeleton);

log.ok(`created ${style.cyan(path.relative(ROOT, file))}`);
log.info("");
log.info(`  ${style.dim("preview")}  http://localhost:3000/techniques/${slug}`);
log.info(`  ${style.dim("zones")}    ${COURT_ZONES.join(", ")}`);
log.info(`  ${style.dim("moments")}  ${SITUATIONS.join(", ")}`);
log.info("");
log.info(
  style.dim(
    "Fill in the TODOs, curate clips with `npm run add:video`, then flip status to published.",
  ),
);
