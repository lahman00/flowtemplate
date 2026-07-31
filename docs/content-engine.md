# Content Engine

How software data is stored, validated, and turned into pages — built to scale
from 11 entries to thousands without changing how any existing page looks or
routes.

## Directory structure

```
data/software/
  schema.ts          Zod schema for the on-disk JSON shape (snake_case)
  types.ts            Domain types used by the app (camelCase)
  mapper.ts            Converts a validated raw entry into the domain type
  index.ts              Loader: reads every *.json file, validates, sorts, caches
  notion.json
  slack.json
  ...one file per software entry
```

Each software entry lives in its own JSON file, named after its slug
(`notion.json` → slug `"notion"`). To add a new entry, add a new JSON file —
no code changes are required. `getAllSoftware()` and `getSoftware(slug)`
(exported from `@/data/software`, unchanged since Sprint 1/2) automatically
pick it up.

## Why snake_case JSON but camelCase TypeScript

The JSON files use `snake_case` (`best_for`, `has_free_tier`) because they're
a content/data format, not code — this is the same convention most headless
CMS exports use. `data/software/mapper.ts` converts every raw entry into the
app's existing `camelCase` domain type (`bestFor`, `hasFreeTier`) the moment
it's loaded, so every component, generator, and utility elsewhere in the app
is unaffected and keeps using the same field names as before.

## Schema (`data/software/schema.ts`)

Required on every entry: `name`, `slug`, `category`, `description`,
`alternatives` (at least one, each with `name`, `slug`, `description`,
`best_for`, `strengths`).

Optional, schema-supported but **not currently populated** on any entry:
`website`, `logo`, `founded`, `company`, `pricing`, `platforms`, `best_for`
(top-level), `pros`, `cons`, `features`, `faq`, `tags`. See "No invented
data" below for why.

`order` (optional number) controls display order across the homepage browse
grid, the "Popular" pills, and the sitemap. Entries without an explicit
`order` sort alphabetically by slug after every explicitly-ordered entry.
The current 11 entries are numbered 1–11 to reproduce the exact order the
hardcoded object literal used to produce, so migrating to this system changed
zero visible output.

## Build-time validation (`data/software/index.ts`)

Every JSON file is parsed and validated with Zod when the dataset is first
loaded (during `generateStaticParams`, so this runs for the whole dataset up
front, not lazily per page). Three things fail the build:

1. **Malformed JSON** — a parse error in any file.
2. **Schema violations** — a missing required field, wrong type, or a slug
   that isn't lowercase/hyphenated.
3. **Filename/slug mismatch** — `notion.json`'s `slug` must be `"notion"`.
4. **Dangling alternative references** — every `alternatives[].slug` must
   match a real file in `data/software/`. This is the exact class of bug
   Sprint 2 found and fixed by hand (six "View X" buttons pointing at pages
   that didn't exist); it can no longer happen silently.

Verified directly: temporarily corrupting `notion.json` during this sprint's
build made `npm run build` fail with a clear, itemized error message, then
passed again once restored.

## Generators (`lib/generators.ts`)

Every piece of per-software copy on `/software/[slug]` is produced by one
named function instead of being written inline in the page or duplicated
between the page and `generateMetadata`:

| Generator | Used for |
|---|---|
| `generateTitle` | `<title>` |
| `generateH1` | The page's H1 |
| `generateMetaDescription` | `<meta name="description">` / Open Graph |
| `generateIntro` | The paragraph under the H1 |
| `generateComparisonIntro` | The "Top alternatives" section intro |
| `generateFaq` | FAQ items (prefers `software.faq` if an entry ever supplies one, otherwise falls back to `lib/faq.ts`'s existing generated questions) |

`generateH1` and `generateIntro` intentionally reproduce the exact strings
the page rendered before this refactor — zero visible change. The meta
description gained one extra sentence (invisible, not page UI) and the
comparison-section intro became per-software instead of one generic sentence
reused on all 11 pages — the one deliberate, minimal copy change made in this
sprint, in direct service of "no duplicated strings, everything generated
from the data."

## Related-software utilities (`lib/related.ts`)

- `getRelatedSoftware` — powers the existing "Compare other tools" section
  (relocated from inline page logic, output unchanged).
- `getSameCategorySoftware` — built and functional, not currently wired into
  any page (would be a new UI section, out of scope for this sprint).
- `getSamePricingSoftware`, `getSameCompanySizeSoftware` — built, but return
  `[]` today because no entry has `pricing.model` populated and there's no
  company-size field in the schema at all. They're not stubs pretending to
  work; they're correctly returning "no match" because there's genuinely no
  data yet.
- `getPopularAlternatives` — "popular" is defined as *most often listed as
  another tool's alternative in this dataset*, a real number computed from
  our own data, not a fabricated rating or review count.

## `/compare/a-vs-b` — prepared, not routed

Per this sprint's explicit instruction, no `/compare` route exists yet.
`lib/comparison.ts` (title/meta-description/row generators) and
`components/ComparisonTable.tsx` (the rendering block) are built and
type-checked but not imported by any page. When a `/compare/[pair]` route is
added later, it can import these directly instead of inventing the same
logic again.

## No invented data

Per this sprint's explicit rule, nothing was fabricated. The schema was
expanded to *support* `website`, `logo`, `founded`, `company`, `pricing`,
`platforms`, top-level `best_for`, `pros`, `cons`, `features`, and `tags` —
but every one of the 11 JSON files leaves those fields absent, because no
verified source for that information exists in this project. Filling them in
with real, sourced data is future work, not something this sprint did on its
behalf.

## Adding a new software entry

1. Create `data/software/<slug>.json` with at minimum `name`, `slug`,
   `category`, `description`, and `alternatives` (each alternative needs
   `name`, `slug`, `description`, `best_for`, `strengths`).
2. Every `alternatives[].slug` must correspond to another real file in this
   directory (build-fails otherwise).
3. Optionally set `order` to control where it appears relative to existing
   entries; omit it to have it sort alphabetically after the ordered ones.
4. Run `npm run build`. If the file is invalid, the build fails with a
   specific, itemized reason.

No other code changes are needed — `generateStaticParams`, the sitemap, the
homepage browse grid, and the FAQ/breadcrumb/SoftwareApplication JSON-LD all
pick up new entries automatically.
