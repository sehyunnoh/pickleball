# Pickleball Technique Hub

An English reference site for pickleball technique. Each shot gets one page —
what it is, when to use it, how to hit it, what usually goes wrong — plus
hand-picked YouTube clips timestamped to the moment that actually shows it.

Planning documents: [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) (what) and
[`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md) (in what order).

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

No environment variables are needed to run the site — see `.env.example` for
what the optional ones do. `YOUTUBE_API_KEY` is used only by the build-time
curation scripts, never at runtime. Analytics needs no key either: GoatCounter
is a public, cookie-less endpoint hard-coded in `components/Analytics.tsx`,
and its script only loads in production, so local runs stay out of the
numbers.

## Content

Content lives as JSON in `content/` — one file per technique, one per glossary
term, filename matching the slug. There is no database and no CMS; git is both.

`lib/schema.ts` is the single source of truth for shape. It is strict: an
unrecognised key fails the build rather than silently dropping a section.
Techniques marked `"status": "draft"` are served by `next dev` but excluded
from production builds, so unfinished work is safe to commit.

## Scripts

```bash
npm run dev
npm run build          # validate, then next build
npm run typecheck
npm run lint
```

## Content tooling

```bash
# Start a technique from the roadmap. Writes a draft skeleton with every
# field present, court diagram included.
npm run new:technique -- --slug reset --category defense --difficulty intermediate

# Curate a clip. The timestamp comes out of the URL — ?t=95 and ?t=1m35s both work.
npm run add:video -- --technique reset --url "https://youtu.be/xxxx?t=95" --type slow-mo

# Check every content file: schema, cross-references, skill-tree cycles.
# Runs before every build.
npm run validate

# Regenerate docs/CURATION.md, the worksheet for picking clips. Anything
# already typed into a picks block is preserved.
npm run curation:sheet

# Are the curated clips still alive and still embeddable?
npm run check:links

# Refresh the unverified "more on YouTube" shelf. Needs YOUTUBE_API_KEY.
npm run fetch:videos -- --only reset --dry-run
```

Only `fetch:videos` requires `YOUTUBE_API_KEY`. `add:video` and `check:links`
fall back to YouTube's public oEmbed endpoint without one — that gives title
and channel, but it cannot tell you whether a video may be embedded, and both
scripts say so rather than assuming.

`content/roadmap.json` lists everything Phase 1 intends to cover. It is what
lets `validate` tell a typo from a technique nobody has written yet: the skill
tree is deliberately authored ahead of its content, so an unresolved slug is a
warning if it is planned and an error if it is not.
