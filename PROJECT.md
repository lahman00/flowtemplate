# Project

Status: In development — business expansion (Sprint 4 complete)

Sprint: 4

Version: 0.4.0

## What this is

Flowtemplate is a software-comparison directory: for a given tool, it shows
verified, sourced alternatives grouped by category, with generated
metadata, structured data, and internal linking designed to scale past a
handful of hand-written pages.

## Scope by sprint

- **Sprint 1** — premium landing page and software comparison UI on top of
  a hardcoded 5-entry dataset.
- **Sprint 2** — SEO infrastructure: sitemap, robots, JSON-LD (Organization/
  Breadcrumb/SoftwareApplication/FAQ), About/Privacy/Terms/Contact pages.
  Found and fixed a real dead-link bug (6 "alternative" tools had no page of
  their own), closing the link graph to 11 entries.
- **Sprint 3** — Content Engine: moved the dataset to one validated JSON file
  per software entry (`data/software/*.json`), Zod schema, reusable content
  generators, related-software utilities, and `/compare` architecture
  (built, not routed).
- **Sprint 4** — Business Expansion: grew the dataset to 30 software entries
  across 8 categories, all with sourced facts (see docs/content-engine.md
  for what "sourced" means and what was deliberately left unpopulated), a
  `/category/[slug]` route, an expanded comparison engine, monetization-ready
  architecture (no live monetization), and `npm run validate:data`.

See `docs/` for full architecture documentation:

- `docs/content-engine.md` — data model, schema, generators, sourcing policy
- `docs/categories.md` — category system
- `docs/comparison-engine.md` — the unrouted `/compare` architecture
- `docs/monetization.md` — the unrouted monetization architecture

## Rules that have held across every sprint

- No database — the dataset is JSON files, validated at build time.
- No authentication.
- No fabricated facts: no invented pricing, ratings, reviews, founding
  dates, or affiliate relationships. Every software entry cites at least
  one official source; fields with no verified source stay unpopulated
  rather than guessed.
