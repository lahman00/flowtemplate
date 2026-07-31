# Content Engine

How software data is stored, validated, and turned into pages — built to
scale from a handful of entries to thousands without changing how any
existing page looks or routes.

Updated in Sprint 4: the dataset grew from 11 to 30 entries, sourcing
became mandatory, and the model gained `category` (cross-referenced against
`data/categories`), `sources[]`, `website`, `platforms`, `features`, and
monetization fields. See "Sourcing policy" below for exactly what changed
and why some Phase 1 fields are still deliberately empty.

## Directory structure

```
data/software/
  schema.ts          Zod schema for the on-disk JSON shape (snake_case)
  types.ts            Domain types used by the app (camelCase)
  mapper.ts            Converts a validated raw entry into the domain type
  index.ts              Loader: reads every *.json file, validates, sorts, caches
  notion.json
  slack.json
  ...one file per software entry (30 as of Sprint 4)

data/categories/
  schema.ts           Zod schema for categories.json
  index.ts              Loader + getAllCategories/getCategory/getCategoryName
  categories.json         The 8 canonical categories
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

Required on every entry: `name`, `slug`, `category` (must match a slug in
`data/categories`), `description`, `website`, `best_for`, `features`
(at least one), `sources` (at least one URL), `alternatives` (at least one,
each with `name`, `slug`, `description`, `best_for`, `strengths`).

Optional, schema-supported: `logo`, `founded`, `company`, `pricing`,
`platforms`, `pros`, `cons`, `faq`, `tags`, `order`, plus the Phase 5
monetization fields `affiliate_url`, `sponsored`, `featured` (see
`docs/monetization.md`).

`order` controls display order across the homepage browse grid, the
"Popular" pills, and the sitemap. Entries without an explicit `order` sort
alphabetically by slug after every explicitly-ordered entry. Entries 1–11
reproduce the exact order the original hardcoded object literal used to
produce; 12–30 are the Sprint 4 additions, grouped by category.

## Sourcing policy — what's populated and why some fields aren't

Sprint 4's rules were explicit: never invent facts, never fabricate
pricing or ratings, always use official sources. Research for all 30
entries was done by fetching each vendor's actual official site (via
WebFetch/WebSearch), never from memory alone.

**Populated, from official sources, for every entry:**
`website`, `description` (paraphrased, not copied — copyright), `platforms`
(only when the official site stated them; omitted, not guessed, otherwise),
`features` (short phrases matching the vendor's own stated capabilities),
`best_for` (the vendor's own positioning language), `sources` (the exact
URLs fetched).

**Deliberately left unpopulated on every entry, and why:**

- **`pricing`** — not in Phase 1's field list, and pricing changes too
  often for a fetched-today number to stay honest tomorrow.
- **`cons`** — this is the one deliberate deviation from Phase 1's literal
  field list. A vendor's own official site will never honestly publish its
  product's weaknesses, so there is no official source `cons` could be
  drawn from without it being independent editorial judgment — exactly the
  kind of AI-generated claim the sprint's rules prohibit. `pros` was left
  unpopulated for the same reason: without a paired, equally-sourced `cons`,
  a `pros`-only list would be one-sided marketing framing.
- **`founded`, `company`, `logo`** — no verified source consulted for these
  specifically; left blank rather than guessed from general knowledge.

One caveat on sourcing quality: Salesforce's main domain blocked automated
fetching (HTTP 403), so that entry is sourced via search-result snippets
that quote the same official `salesforce.com` pages rather than a direct
fetch — cited URLs are still the real official pages, but recorded here for
transparency.

## Build-time validation (`data/software/index.ts`)

Every JSON file is parsed and validated with Zod when the dataset is first
loaded (during `generateStaticParams`, so this runs for the whole dataset up
front, not lazily per page). This fails the build:

1. **Malformed JSON** — a parse error in any file.
2. **Schema violations** — a missing required field, wrong type, or a slug
   that isn't lowercase/hyphenated.
3. **Filename/slug mismatch** — `notion.json`'s `slug` must be `"notion"`.
4. **Dangling alternative references** — every `alternatives[].slug` must
   match a real file in `data/software/`. This is the exact class of bug
   Sprint 2 found and fixed by hand; it can no longer happen silently.
5. **Unknown category** — every `category` must match a real slug in
   `data/categories`.

Verified directly, twice: once in Sprint 3 (corrupted `notion.json`) and
again in Sprint 4 (stripped `sources` and broke an alternative reference in
`slack.json`) — both times `npm run build` and `npm run validate:data`
failed with a specific, itemized error, then passed again once restored.

Run `npm run validate:data` to run this same validation (plus a few extra
checks — see below) without a full production build.

## `npm run validate:data` (`scripts/validate-data.ts`)

Reuses the loader's validation (above), then adds checks the loader
doesn't already make structurally impossible:

- Duplicate slugs (software and categories) — defense in depth.
- Missing `sources`/`features` — redundant with the schema, reported by name.
- Orphan categories — a category with zero software would be a real,
  discoverable dead end at `/category/[slug]`.

## Generators (`lib/generators.ts`)

Every piece of per-software copy is produced by one named function instead
of being written inline in a page or duplicated between the page and
`generateMetadata`:

| Generator | Used for |
|---|---|
| `generateTitle` | `<title>` |
| `generateH1` | The page's H1 |
| `generateMetaDescription` | `<meta name="description">` / Open Graph |
| `generateIntro` | The paragraph under the H1 |
| `generateOverview` | The "About {name}" card body (description + best_for) |
| `generateWhoShouldUseIt` | Built, not currently wired into the page |
| `generateWhoShouldntUseIt` | Points to the real alternatives already on the page — never asserts an unverified weakness |
| `generateComparisonIntro` | The "Top alternatives" section intro |
| `generateMigrationTips` | Generic, honest migration guidance |
| `generateChoosingGuide` | The "How to choose" card, now data-driven off `platforms` |
| `generateFaq` | FAQ items (prefers `software.faq` if an entry ever supplies one, otherwise falls back to `lib/faq.ts`) |

## Related-software utilities (`lib/related.ts`)

- `getRelatedSoftware` — powers the "Compare other tools" section.
- `getSameCategorySoftware` — built and functional, not wired into the
  software page (would duplicate the category page).
- `getSoftwareByCategory` — powers `/category/[slug]`.
- `getSamePricingSoftware`, `getSameCompanySizeSoftware` — built, return
  `[]` today: no entry has `pricing.model` set, and there's no
  company-size field in the schema at all. Not stubs pretending to work —
  correctly reporting "no match" because there's genuinely no data yet.
- `getPopularAlternatives` — "popular" is defined as *most often listed as
  another tool's alternative in this dataset*, a real number computed from
  our own data, not a fabricated rating or review count.

## `/compare/[a]-vs-[b]` — prepared, not routed

Per Sprint 4's explicit instruction ("do NOT generate every page, only
build the reusable engine"), still no `/compare` route exists. See
`docs/comparison-engine.md`.

## Adding a new software entry

1. Create `data/software/<slug>.json`. Required fields: `name`, `slug`,
   `category` (a real category slug), `description`, `website`, `best_for`,
   `features` (min 1), `sources` (min 1 URL), `alternatives` (min 1, each
   needs `name`, `slug`, `description`, `best_for`, `strengths`).
2. Every `alternatives[].slug` must correspond to another real file in this
   directory.
3. Optionally set `order`; omit it to sort alphabetically after the ordered
   entries.
4. Run `npm run validate:data` (fast) or `npm run build` (full). Either
   fails with a specific, itemized reason if the file is invalid.

No other code changes are needed — `generateStaticParams`, the sitemap, the
homepage browse/category grids, and the FAQ/breadcrumb/SoftwareApplication
JSON-LD all pick up new entries automatically.
