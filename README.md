# Miloosh

A software-comparison directory built with Next.js App Router. For any
tool, see verified alternatives grouped by category — sourced facts only,
nothing fabricated.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optionally copy `.env.example` to `.env` to configure a canonical site URL,
an analytics provider, or affiliate tracking — every variable is optional
and the site works identically with none of them set.

## Scripts

```bash
npm run dev            # start the dev server
npm run build           # production build (also runs TypeScript checks)
npm run lint             # ESLint
npm run validate:data    # validate every data/software/*.json and data/categories entry
npm run maintenance       # run all 6 maintenance agents + write a combined report
```

Run `validate:data` after editing any data file — it checks the same rules
the build enforces (schema, duplicate slugs, broken references, invalid
categories, orphan category pages) without doing a full production build.

`npm run maintenance` runs read-only checks (link health, data freshness,
SEO integrity, recommendation-engine regressions, comparison/affiliate
opportunities) and writes reports to `var/maintenance/` — it never edits
data or publishes anything automatically. Individual agents can also run
alone (`npm run maintenance:links`, `:freshness`, `:seo`,
`:recommendations`, `:comparisons`, `:affiliate`). See
[`docs/maintenance-system.md`](docs/maintenance-system.md).

## Project structure

```
app/                    Routes (App Router)
  software/[slug]/       One page per software entry
  category/[slug]/        One page per category
  compare/                 /compare index + /compare/[a-vs-b] curated pairs
  recommend/                Recommendation wizard + /recommend/results
  internal/                  Private admin dashboards (noindex, not linked)
  api/                        outbound-click / recommendation-click endpoints
  about|contact|privacy|terms/
  affiliate-disclosure|disclaimer|editorial-policy|sources-policy|
  corrections-policy|ai-usage|accessibility|cookies|trademark-notice/
data/
  software/*.json         One file per software entry (source of truth)
  categories/              Category definitions + loader
  comparisons.ts            Curated list of published comparison pairs
  revenue/                    Affiliate-program research (data/revenue/affiliate-programs.ts)
lib/
  site.ts                    Centralized brand constants (name, email, URL, theme color, version)
  generators.ts             Page copy generators (title, H1, FAQ, etc.)
  related.ts                 Related/same-category/popular utilities
  comparison.ts                /compare engine, routed at /compare/[a]-vs-[b]
  affiliate.ts                  Affiliate-link engine (preferredUrl, tracking params, disclosure)
  monetization.ts                Sponsored/featured/recommended utilities (no live data)
  analytics.ts                    Analytics abstraction (GA/Plausible/PostHog/none, off by default)
  freshness.ts                     Real computed data-freshness stats
  structured-data.ts                JSON-LD builders
  legal.ts                           Shared list of legal/trust pages (drives footer + sitemap)
  recommend/                          Deterministic recommendation engine (scoring, keywords, events)
  revenue/                             Affiliate manager, activation, revenue scoring, outbound events
  maintenance/                          Link/freshness/SEO/regression/opportunity agents (Sprint 12)
components/               Reusable UI components (incl. LegalPageLayout, recommend/ wizard pieces)
config/                    Local-only credential templates (see config/*.example.json)
types/maintenance.ts       Shared types for the maintenance system
scripts/
  validate-data.ts           Standalone data validator (npm run validate:data)
  maintenance/                 One script per maintenance agent + the master run-all.ts
.github/workflows/maintenance.yml   Weekly scheduled maintenance run (see docs/maintenance-system.md)
docs/                      Architecture documentation
.env.example               Every supported environment variable, all optional
```

## Data and sourcing policy

Every software entry lives in its own JSON file and is validated with Zod
at build time. Nothing in this dataset is invented: every entry cites at
least one official source with the date it was accessed, and fields with no
verified source (pricing, founding date, parent company, pros/cons) are
left unpopulated rather than guessed. See
[`docs/content-engine.md`](docs/content-engine.md) for the full policy and
schema.

## Comparisons

`/compare` lists a curated set of 20 head-to-head comparisons (not every
possible pair — see `data/comparisons.ts`); each `/compare/[a]-vs-[b]` page
is built entirely from fields already in the dataset, with an honest
disclosure in place of an invented "cons" list. See
[`docs/comparison-engine.md`](docs/comparison-engine.md).

## Recommendations

`/recommend` is a mobile-first wizard that matches your team, budget, and
needs against the verified dataset and returns 3 recommendations — fully
deterministic (no LLM, no external API), with every point of every score
explained. See [`docs/recommendation-engine.md`](docs/recommendation-engine.md).

## Maintenance system

Six deterministic agents (link health, data freshness, SEO integrity,
recommendation-engine regressions, comparison opportunities, affiliate
opportunities) check the live site and dataset and write local reports —
never publishing a factual change, committing, or pushing automatically.
Runs weekly via GitHub Actions and on demand via `npm run maintenance`; a
private dashboard at `/internal/maintenance` (noindex, not linked) shows
the latest report. See [`docs/maintenance-system.md`](docs/maintenance-system.md)
and [`docs/maintenance-notifications.md`](docs/maintenance-notifications.md).

## Legal and trust

11 legal/trust pages (Privacy, Terms, Disclaimer, Affiliate Disclosure,
Editorial Policy, Sources Policy, Corrections Policy, AI Usage Disclosure,
Accessibility Statement, Cookie Policy, Trademark Notice) — each written to
match how the site actually operates today, not aspirational claims. No
analytics/advertising/auth cookies are set, so there's no cookie banner.
See [`docs/legal-and-trust.md`](docs/legal-and-trust.md).

## Brand, analytics, and affiliate links

Every brand string (name, tagline, email, theme color) is centralized in
`lib/site.ts` — renaming the site means changing one file. Favicon, app
icon, Apple touch icon, Open Graph image, Twitter image, and the web
manifest are all generated at build time from that same brand mark, not
static placeholder files. Analytics and affiliate tracking are both real,
functioning code paths that are off by default and only activate through
environment variables — see [`docs/brand-and-analytics.md`](docs/brand-and-analytics.md)
and [`docs/monetization.md`](docs/monetization.md).

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
