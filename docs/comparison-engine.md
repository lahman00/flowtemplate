# Comparison engine (`/compare/[a]-vs-[b]`)

Live as of Sprint 7. The engine itself (`lib/comparison.ts`) was built in
Sprint 3/4 ahead of routing; Sprint 7 wired it into an actual route and
added the curated-pairs policy that decides which pairs get a page.

## Curated pairs, not every combination

`data/comparisons.ts` is the single source of truth for which pairs are
published — currently 20. It drives:

- `generateStaticParams` in `app/compare/[comparison]/page.tsx`
- `app/sitemap.ts`
- the `/compare` index page
- related-comparison links on software and category pages

`app/compare/[comparison]/page.tsx` sets `export const dynamicParams =
false`, so any pair not in `PUBLISHED_COMPARISONS` 404s outright, even if
both halves are real, valid software slugs — Next.js won't render it on
demand. The page component also independently re-checks
`isPublishedComparison()` before rendering, as defense in depth.

Key exports from `data/comparisons.ts`:

- `PUBLISHED_COMPARISONS: ReadonlyArray<readonly [string, string]>` — the
  curated list.
- `getComparisonSlug(a, b)` — `"${a}-vs-${b}"`.
- `getPublishedComparisonSlugs()` — full slug list, for `generateStaticParams`.
- `isPublishedComparison(a, b)` — guard used in the route and in
  `resolvePublishedComparison`.
- `getComparisonsInvolving(slug)` — every published pair touching a given
  software slug, used for related-comparison links.

`npm run validate:data` checks every pair: both slugs must reference real
software, the two slugs must differ, and no pair may be duplicated (in
either order) — see `scripts/validate-data.ts`.

## `lib/comparison.ts`

- `generateComparisonSlug(a, b)` / `parseComparisonSlug(pairSlug)` — slug
  building and parsing. `parseComparisonSlug` tries every `-vs-` occurrence
  rather than just the first, since slugs themselves contain hyphens
  (`microsoft-teams`, `cal-com`).
- `generateComparisonTitle`, `generateComparisonMetaDescription`,
  `generateComparisonIntro` — factual, grounded page copy.
- `generateComparisonRows` — the side-by-side table data (category,
  alternative count, platforms, pricing model if present).
- `generateProsList(software)` — reuses the product's own sourced
  `features` array. There is no fabricated "pros" copy.
- `CONS_DISCLOSURE` — no software entry stores unverified weaknesses (no
  vendor documents its own product's cons), so instead of inventing a cons
  list, every comparison page shows this fixed, honest disclosure in its
  place.
- `generateWhoShouldChoose(software)` — grounded in the vendor's own stated
  `bestFor` positioning, never independent editorial judgment.
- `generateKeyDifferences` — a set difference on fields both entries
  actually have (`category`, `features`, `platforms`) — never an
  editorial "X is better because…" claim.
- `generateComparisonData(a, b)` — bundles all of the above into
  `ComparisonData`.
- `getComparisonBySlug(pairSlug)` — full engine entry point: parses the
  slug, looks up both software entries, returns `null` if either is
  unknown, otherwise returns complete `ComparisonData`.

## `components/ComparisonTable.tsx`

Renders a `ComparisonData` object as the side-by-side summary table on
`app/compare/[comparison]/page.tsx`.

## The route

`app/compare/[comparison]/page.tsx` renders, per published pair: visible
breadcrumbs, a factual intro, the side-by-side summary table, best-for
cards, a full feature comparison, pros/cons (with `CONS_DISCLOSURE` in
place of invented cons), key differences, "choose A/B if…" cards, a
disclosure banner linking to `/disclaimer` and `/sources-policy`, per-product
source links, related software, and related comparisons. It emits
`BreadcrumbList` and a ratings-free comparison `ItemList` JSON-LD
(`getComparisonJsonLd` in `lib/structured-data.ts` — deliberately no
`aggregateRating`, `review`, or `offers`). Unpublished-but-valid pairs and
unknown pairs both hit `app/compare/[comparison]/not-found.tsx`.

`/compare` (`app/compare/page.tsx`) is the index: every published pair as a
card linking to its comparison page.
