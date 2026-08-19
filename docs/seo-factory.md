# Miloosh SEO Factory v1

## Purpose

SEO Factory turns real Google Search Console demand into a ranked, explainable action queue. It optimizes for qualified software-buying traffic and legitimate monetization, not page count.

The production flow is:

`Vercel cron → authenticated SEO Factory route → GSC query+page rows + current Money Map → inventory/entity/intent graph → cannibalization + scoring + action policy → private Blob run → /internal/seo-factory`

## Existing systems reused

- `GoogleSearchConsoleClient.queryAllSearchAnalytics()` for paginated real GSC data.
- `buildMoneyMap()` for page-level search, click, commercial-intent, and monetization signals.
- `computeInboundCounts()` for the deterministic internal-link graph.
- `data/software`, `data/categories`, and `PUBLISHED_COMPARISONS` as canonical inventory.
- `data/affiliate/active-partners.ts` and the researched affiliate-program ledger for bounded monetization weighting.
- Existing `/internal/*` Basic Auth through `proxy.ts`.
- Private Vercel Blob, with a local-file fallback only for development/tests.

## Safety model

Production autonomy is **Level 0 — Analyze**.

- Every opportunity has `publicationEligible: false`.
- New-page ideas are `BLOCKED`, not published.
- The publication-threshold policy always includes the Level 0 blocker, even when every other evidence requirement is met.
- Missing GSC credentials, unavailable Money Map GSC data, or failed durable storage aborts the run. The previous successful run remains intact.
- A daily immutable claim prevents overlapping cron runs. A failed run releases its claim for a safe retry; inability to release fails toward less automation.
- No public page, title, metadata, redirect, internal link, affiliate state, sitemap entry, or social queue entry is modified by v1.

## Scoring

Each component exposes its value, weight, source, confidence, and whether it is real, derived, heuristic, or unavailable. Unavailable components are excluded from the weighted score instead of becoming fabricated zeroes.

Signals include real GSC demand and CTR, derived ranking/internal-link/Money Map/affiliate state, heuristic commercial intent and CTR expectation, and real GSC query-to-page cannibalization. Scores are integer priorities, not forecasts.

## Actions

The queue supports `CREATE`, `IMPROVE`, `MERGE`, `REDIRECT`, `INTERNAL_LINK`, `META_TEST`, `REFRESH`, `MONETIZE`, `WAIT`, and `IGNORE`. v1 emits recommendations only. It prefers an existing canonical URL whenever one already receives impressions.

## Durable state

- Latest run: `seo-factory/latest-run.json`
- Immutable history: `seo-factory/runs/{run-id}.json`
- Daily concurrency claim: `seo-factory/claims/{YYYY-MM-DD}.json`
- Experiment ledger: `seo-factory/experiments.json`

The experiment ledger rejects a second intervention on a page while an experiment is measuring or inside its measurement cooldown.

## Schedule and observability

`/api/cron/seo-factory` runs independently of social publishing at `22:00 UTC` daily and authenticates with Vercel's existing `CRON_SECRET` behavior. Logs include only run IDs and aggregate counts. The operator dashboard is `/internal/seo-factory`.

The LinkedIn and Facebook cron path, schedule, candidates, adapters, credentials, and queue are not part of this factory.
