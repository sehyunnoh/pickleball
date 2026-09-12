# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

**Built and deployed.** 33 techniques, 72 glossary terms, 3 learning paths, 76
clips, deployed to Vercel from `main`. Phase 1 is complete apart from a custom
domain; the work left is human — 55 of the 76 clips are title-matched rather
than watched, and carry an `Unverified` label saying so.

Four documents, all in Korean; **all site-facing content is English only.**

| | |
|---|---|
| `docs/ARCHITECTURE.md` | **how it deploys and runs** — start here |
| `docs/REQUIREMENTS.md` | what to build, and the content schemas |
| `docs/DEVELOPMENT_PLAN.md` | in what order, with completion gates |
| `docs/CURATION.md` | generated worksheet for picking clips |

## What this site is

An English reference site for pickleball techniques. The differentiator over
existing blog-style sites is three things, and design decisions should protect them:

1. **Structured per-technique data** — one JSON file per shot, fixed section order.
2. **Timestamped video clips** — `start`/`end` seconds, not bare video links. This
   is the core asset of the product.
3. **Skill tree** — `prerequisites` / `leadsTo` edges between techniques.

Primary audience is the "Improver" (DUPR 3.0–4.0) who knows the rules but can't
land a specific shot.

## Planned commands

Defined in `docs/DEVELOPMENT_PLAN.md` §5. npm (no pnpm on this machine); scripts
run through `tsx`.

```
npm run dev             next dev
npm run build           npm run validate && next build   # validation gates the build
npm run validate        tsx scripts/validate-content.ts
npm run new:technique   tsx scripts/new-technique.ts
npm run add:video       tsx scripts/add-video.ts
npm run fetch:videos    tsx scripts/fetch-videos.ts
npm run check:links     tsx scripts/check-links.ts
```

Example: `npm run add:video -- --technique atp --url "https://youtu.be/xxxx?t=95" --type slow-mo`

## Architecture

**No database.** Content lives as JSON in the repo; git is the CMS. Postgres is
deferred to Phase 7 (user accounts). Everything is SSG.

```
content/techniques/*.json   one file per technique  (schema: REQUIREMENTS.md §7.1)
content/glossary/*.json     one file per term       (§7.2)
content/paths/*.json        curated routes through techniques — authored, not derived
data/generated/            videos-auto.json — build-script output, IS committed
lib/schema.ts              Zod schemas — single source of truth
lib/content.ts             load + validate + derive the skill-tree graph
scripts/                   the CLI tools above
```

**Diagrams are data, not drawings.** `lib/court.ts` holds court geometry in
feet; technique and drill JSON carry `[lateral, depth]` coordinates (0–20 across,
0 at your baseline to 44 at theirs), and `components/CourtDiagram.tsx` /
`ShotProfile.tsx` render inline SVG from them. No charting library. The division
of labour is deliberate: **diagrams show position and trajectory, video shows
body mechanics.** Do not try to draw form — paddle angle, knee bend — that is
what the curated clips are for. See `docs/REQUIREMENTS.md` §7.1.1.

**Single source of truth for the graph.** There is no separate graph file. The
skill tree is derived from `prerequisites` / `leadsTo` on the technique files.
Same for search: the Fuse.js index is built from content at build time.

**Validation is fail-fast at build time.** Unknown fields in a content JSON must
break the build. `validate` also checks referential integrity (every
`prerequisites` / `leadsTo` / `relatedTerms` slug resolves), that the skill tree
is acyclic, that `published` techniques have ≥2 videos, and `start < end`.

**`status: "draft"` is excluded from the build**, so half-written techniques can
be committed safely.

## Invariants

- **YouTube API is never called at runtime.** All API work happens in build-time
  scripts, output committed to `data/generated/`. Keeps the key off the client and
  quota bounded. Key lives in `.env.local` (gitignored) as `YOUTUBE_API_KEY`.
- **Videos are embedded, never hosted.** No downloading, re-uploading, or
  redistributing captions. Embed via `youtube-nocookie.com`.
- **Embeds use a facade** (`lite-youtube-embed`): thumbnail first, iframe only on
  click. A technique page carries up to 5 videos — raw iframes destroy LCP.
- **Curated vs. auto-fetched videos must be visually distinct.** Auto results
  carry a label saying they are unverified. This is enforced in the content
  itself, not just in the candidate lists: `Video.verified` is false for any
  clip chosen by `auto:curate` or `add:video --unverified`, and
  `components/UnverifiedBadge.tsx` puts that on the page. **Any copy claiming
  every clip is hand-picked is a bug** — the About page, the home hero and the
  site description all had to be corrected once already.
- `add:video` must reject videos with `embeddable: false` and duplicate
  `youtubeId`s rather than writing them.
- **Schema freezes when M3 (bulk content authoring) starts.** Schema gaps are
  expected to surface during M1's single-technique slice — that is what M1 is for,
  and fixing them then is cheap. After 20 techniques exist, it isn't.

## Content page contract

The technique detail page section order is fixed (`REQUIREMENTS.md` §6) because
most users land there from search: name + difficulty badge + tags → hero video →
What it is → When to use it → How to hit it → Common mistakes → Drills → Watch it
→ skill-tree minimap + related terms.

Authoring quality gates before flipping a technique to `published` are in
`DEVELOPMENT_PLAN.md` §6 — notably: `howTo` is 4–6 steps written as *action
instructions*, not descriptions; `commonMistakes` are specific, not general
advice; ≥1 video of type `instruction`.

**The timestamp gate was relaxed on 2026-08-24** (`DEVELOPMENT_PLAN.md` §6.1).
Hand-picking a timestamp for thirty techniques was the thing that stalled, so a
technique may now publish on title-matched clips as long as they are marked
`verified: false` and labelled on the page. Verifying one is now an upgrade
applied to a live page rather than a precondition for having one.

Division of labor: Claude drafts text, the user reviews and approves. Videos are
auto-filled by title match; the user replaces them with watched, timestamped
picks through `docs/CURATION.md`, highest-traffic techniques first.

## Design constraints

**The reference is a printed coaching manual, not a web app.** Hold that line —
the default Tailwind card (`rounded-lg border bg-surface p-4`) is what the design
was deliberately moved away from, and reaching for it again undoes the work.

- **Structure comes from rules, whitespace and type**, not from boxes. Hairline
  `border-border` between list items; heavier `border-rule` for structural
  divisions. Rounded corners and pill badges are out.
- **Type**: Fraunces (display) and Newsreader (body), variable, self-hosted via
  next/font. Monospace is the system stack and is only ever used for the small
  uppercase labels — see the `.label` utility in `globals.css`.
- **Palette**: warm paper (`#fbfaf7`) and ink (`#1a1714`), not white and black.
  Green (`#2c6b47`) is kept scarce so it still signals something.
- **Layout is asymmetric**: sticky metadata rail in a left column, prose in the
  right, section numbers hanging in the gutter between them.
- 66ch measure, mobile-first (phone-on-the-court is the main scenario), dark mode
  required. Difficulty is never signalled by colour alone — always pair with a
  text label.

Targets: Lighthouse mobile Performance ≥ 90, Accessibility ≥ 95, WCAG 2.1 AA.

Filter state lives in the URL query (`?category=soft-game&difficulty=beginner`) so
lists are shareable. Progress tracking is localStorage only (wrap every access in
try/catch) and the UI must say it's device-local.

## Explicitly out of scope for Phase 1

Tournament/match info (Phase 2), accounts and login, comments or any UGC, payments,
i18n. Don't add them; text fields are kept separable so i18n can be bolted on later.

## Repo conventions

- GitHub **private** repo. `main` is production, auto-deployed by Vercel.
- Work on `feat/…` or `content/…` branches → PR → check the Vercel preview
  (play the videos on content PRs) → merge.
