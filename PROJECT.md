# Project

Status: In development — brand, analytics, and affiliate architecture complete (Sprint 6)

Sprint: 6

Version: 0.6.0

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
- **Sprint 5** — Legal, Compliance & Trust: 9 new legal/trust pages
  (Affiliate Disclosure, Disclaimer, Editorial Policy, Sources Policy,
  Corrections Policy, AI Usage Disclosure, Accessibility Statement, Cookie
  Policy, Trademark Notice), each accurate to how the site actually
  operates today — no claimed certifications, no invented company details.
  Added a real `accessed_at` field to every software entry so the Sources
  Policy's "access dates are stored" claim is true rather than aspirational,
  and a visible Sources section on every software page. Footer reorganized
  into columns to hold 11 legal links without clutter.
- **Sprint 6** — Brand, Domain & Revenue: every remaining hardcoded brand
  string centralized into `lib/site.ts` (`SITE_NAME`/`SITE_TAGLINE`/
  `SITE_DESCRIPTION`/`SITE_EMAIL`/`SITE_URL`/`SITE_THEME_COLOR`/
  `SITE_VERSION`, the last sourced straight from `package.json`); real
  generated favicon/app icon/Apple touch icon/OG image/Twitter image/web
  manifest (all built from the same brand mark, not placeholders); an
  analytics abstraction (Google Analytics/Plausible/PostHog/none, off by
  default, env-var-only); a proper affiliate-link engine
  (`lib/affiliate.ts`: `preferredUrl`, tracking params, disclosure flag)
  replacing the earlier ad hoc CTA helper; reusable vendor-link blocks
  (pricing/docs/support/integrations/status/community — none populated,
  no invented URLs); and real, computed data-freshness stats (tool count,
  category count, most recent source-verification date) surfacing in the
  Footer, About, Editorial Policy, and Sources Policy pages instead of
  hand-typed numbers.

See `docs/` for full architecture documentation:

- `docs/content-engine.md` — data model, schema, generators, sourcing policy
- `docs/categories.md` — category system
- `docs/comparison-engine.md` — the unrouted `/compare` architecture
- `docs/monetization.md` — the affiliate/sponsorship/vendor-links architecture
- `docs/legal-and-trust.md` — the 9 legal pages and what was verified
  before each claim was written
- `docs/brand-and-analytics.md` — brand centralization, generated visual
  identity, and the analytics abstraction

## Rules that have held across every sprint

- No database — the dataset is JSON files, validated at build time.
- No authentication.
- No cookies for analytics, advertising, or auth — verified by inspecting
  the codebase, not assumed; no cookie banner because none is needed.
- No fabricated facts: no invented pricing, ratings, reviews, founding
  dates, affiliate relationships, or compliance certifications. Every
  software entry cites at least one official source with an access date;
  fields with no verified source stay unpopulated rather than guessed.
