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

No environment variables are needed to run the site. `YOUTUBE_API_KEY` in
`.env.local` is only used by the build-time curation scripts (M2), never at
runtime.

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
npm run build
npm run start
npm run lint
```

Content tooling (`validate`, `new:technique`, `add:video`, `fetch:videos`,
`check:links`) arrives in M2 — see the development plan.
