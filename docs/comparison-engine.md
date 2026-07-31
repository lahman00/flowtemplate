# Comparison engine (`/compare/[a]-vs-[b]`) — architecture, not a route

Both Sprint 3 and Sprint 4 explicitly asked for the reusable engine behind a
future `/compare/[softwareA]-vs-[softwareB]` route, and explicitly asked
that the route itself **not** be built yet. Nothing in this doc is wired
into any page.

## `lib/comparison.ts`

- `generateComparisonSlug(a, b)` — `"${a.slug}-vs-${b.slug}"`, for building
  links to the future route.
- `parseComparisonSlug(pairSlug)` — the inverse: given a URL segment like
  `"cal-com-vs-calendly"`, returns `{ slugA, slugB }` or `null`. Tries every
  `-vs-` occurrence in the string rather than just the first, because slugs
  themselves contain hyphens (`microsoft-teams`, `cal-com`) — a naive
  first-match split would misparse those.
- `generateComparisonTitle`, `generateComparisonMetaDescription` — page
  metadata generators.
- `generateComparisonRows` — a structured table (category, alternative
  count, platforms, pricing model if either side has one) for
  `components/ComparisonTable.tsx`.
- `generateKeyDifferences` — plain-language differences, but only ever a
  set difference on fields both entries actually have (`category`,
  `features`, `platforms`) — never an editorial "X is better because…"
  claim, since there's no sourced basis for that.
- `generateComparisonData(a, b)` — bundles all of the above.
- `getComparisonBySlug(pairSlug)` — the full engine entry point: parses the
  slug, looks up both software, returns `null` if either is unknown,
  otherwise returns complete `ComparisonData`. This is what a future
  `app/compare/[pair]/page.tsx` would call in its `generateMetadata` and
  page component.

## `components/ComparisonTable.tsx`

Renders a `ComparisonData` object as a side-by-side table. Not imported by
any page.

## When the route is actually built

`generateStaticParams` for `/compare/[pair]` should **not** enumerate every
possible pair (900+ for 30 entries) — Sprint 4 was explicit about this
("do NOT generate every page"). A sensible approach when that work starts:
pre-render only pairs that are already real alternative relationships in
the dataset (i.e., where `b` appears in `a.alternatives` or vice versa),
and let `dynamicParams` handle the rest on demand.
