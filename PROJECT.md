# Project

Status: In development — autonomous maintenance system live (Sprint 12)

Sprint: 12

Version: 0.12.0

## What this is

Miloosh is a software-comparison directory: for a given tool, it shows
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
- **Sprint 7** — Launch the Comparison Pages: routed `/compare/[a]-vs-[b]`
  for a curated set of exactly 20 pairs (`data/comparisons.ts`), each
  built entirely from fields already in the dataset — side-by-side
  summary, best-for, feature comparison, pros/cons (with an honest
  disclosure standing in for an invented cons list), key differences,
  who-should-choose-which, official-source links, related software, and
  related comparisons. Closed a real data gap first: Jira, Linear, Miro,
  and Lucidchart didn't exist yet but were named in the required pair
  list, so they were researched and added from official sources the same
  way Sprint 4 grew the dataset — not fabricated to fit the list.
  `dynamicParams = false` plus an in-component published-pair check means
  a valid-but-uncurated pair (two real software slugs) 404s instead of
  rendering on demand. Added a `/compare` index page, comparison URLs in
  the sitemap, `BreadcrumbList` + ratings-free `ItemList` JSON-LD, related-
  comparison links from software/category pages and the homepage, a
  Compare link in the navbar and footer, and comparison-pair checks
  (broken references, self-comparisons, duplicate pairs) in
  `npm run validate:data`.
- **Sprint 8** — Revenue Intelligence: researched affiliate/referral
  programs for all 34 products against official vendor and
  partner-network pages (`data/revenue/affiliate-programs.ts` — 15
  confirmed, 13 confirmed-none, 6 unresolved, nothing guessed). A revenue
  score (0-100) per product from real inputs only — confirmed affiliate
  availability, stored pricing model, comparison involvement, a
  documented per-category value weight — split into Tier A/B/C
  (`lib/revenue/scoring.ts`, `tiers.ts`). Architecture-only: an Affiliate
  Manager, an Outbound Event abstraction, and a Click Tracker, all off by
  default and unwired from any page. Seven ranked future revenue
  opportunities and `docs/revenue.md`.
- **Sprint 9** — Activate First Revenue: an application checklist for the
  6 Tier A products (`docs/affiliate-applications.md`) with every
  approval-status/ID/URL field left blank — no approval claimed. Extended
  the Affiliate Manager so a real approved link activates via env var or a
  gitignored `config/affiliate-credentials.json`, gated in code on a
  confirmed program, requiring no code change. Wired outbound-click
  tracking end to end into a local, first-party JSON log
  (`var/outbound-clicks.json`) via a new API route, still off by default;
  added `/internal/outbound-clicks`. Zero affiliate links activated, zero
  real credentials anywhere in the repo.
- **Sprint 10** — AI Software Advisor: `/recommend`, a mobile-first wizard
  matching team/budget/needs against the verified dataset with a fully
  deterministic scoring engine (`lib/recommend/`) — no LLM, no external
  API, every point traceable to a real stored field or a real text search.
  Industry is collected but never scored (no dataset support), disclosed
  explicitly rather than faked. The scorer sits behind a documented,
  swappable `ScoringStrategy` interface for a future AI-based version.
  Recommendation analytics (generated/shown/clicked) share Sprint 9's
  tracking switch; `/internal/recommendations` added.
- **Sprint 11** — Launch Readiness Audit: a full read-only audit (code
  structure, SEO, performance/accessibility, content) via parallel review
  passes, then every verified fix applied — removed unused Prisma/Supabase
  dependencies and 7 dead code exports never called from any page; fixed 3
  live content bugs (a copy-pasted 404 heading, a category name getting
  incorrectly lowercased, a vendor name's internal capital breaking when
  spliced into a sentence); capped meta descriptions that exceeded the SEO
  length limit on 32 of 34 pages; added missing focus-visible states and
  two missing input labels. Several docs (`content-engine.md`,
  `monetization.md`, `legal-and-trust.md`) had drifted out of sync with
  the shipped code and were corrected.
- **Sprint 12** — Autonomous Maintenance System: six deterministic,
  read-only agents — link health (checks every official/source/vendor/
  affiliate URL for 404s, timeouts, bad redirects), data freshness
  (0-100 documentation-completeness score per product, explicitly never a
  correctness claim), SEO integrity (imports the real `sitemap.ts`/
  `robots.ts` rather than reimplementing them, checks for duplicate
  titles/descriptions, broken references, orphan-page risk), recommendation
  regression (14 structural fixtures against the real engine — asserts
  behavior, not exact wording), comparison opportunity (suggests
  well-supported unpublished pairs, never publishes one), and affiliate
  opportunity (confirmed-but-inactive/unresolved/high-tier-no-program/
  stale-research, cross-referencing Sprint 8's data, never exposing an
  actual activated URL). `npm run maintenance` runs all six and writes
  `var/maintenance/latest-summary.{json,md}`; a critical *finding* never
  fails the command, only a real agent execution failure or an SEO/
  regression codebase bug does. A private dashboard at
  `/internal/maintenance`, a weekly GitHub Actions workflow
  (`.github/workflows/maintenance.yml`, uploads reports as artifacts, can
  open a tracking issue via the default token, never edits data or
  commits or merges), and a disabled-by-default, provider-neutral
  notification abstraction (email/Slack/Telegram webhooks, no real
  credentials). Nothing in this system publishes a factual change or
  pushes to `main` automatically — every finding is a report for a human.

See `docs/` for full architecture documentation:

- `docs/content-engine.md` — data model, schema, generators, sourcing policy
- `docs/categories.md` — category system
- `docs/comparison-engine.md` — the `/compare` architecture and curated-pairs policy
- `docs/recommendation-engine.md` — the deterministic `/recommend` scoring engine
- `docs/monetization.md` — the affiliate/sponsorship/vendor-links architecture
- `docs/revenue.md` — affiliate research, revenue scoring, and commercial tiers
- `docs/affiliate-applications.md` — the Tier A affiliate-program application checklist
- `docs/legal-and-trust.md` — the 11 legal pages and what was verified
  before each claim was written
- `docs/brand-and-analytics.md` — brand centralization, generated visual
  identity, and the analytics abstraction
- `docs/maintenance-system.md` — the 6 maintenance agents, severity rules,
  report formats, GitHub Actions behavior, and the human approval workflow
- `docs/maintenance-notifications.md` — the provider-neutral notification
  abstraction (disabled by default)

## Rules that have held across every sprint

- No database — the dataset is JSON files, validated at build time.
- No authentication.
- No cookies for analytics, advertising, or auth — verified by inspecting
  the codebase, not assumed; no cookie banner because none is needed.
- No fabricated facts: no invented pricing, ratings, reviews, founding
  dates, affiliate relationships, or compliance certifications. Every
  software entry cites at least one official source with an access date;
  fields with no verified source stay unpopulated rather than guessed.
- No automatic publishing: nothing in the maintenance system (Sprint 12)
  edits `data/`, commits, pushes, or merges on its own — every finding is
  a local report for a human to review and act on by hand.
