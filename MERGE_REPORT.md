# Miloosh — Merge Readiness Report

Generated: 2026-08-04
Branch under review: `expansion/launch-sprint` (compared against `main`)

## Summary

This sprint's mandate was explicitly *not* to add more pages, but to raise
the quality bar of what's already there before merging into `main`. Four
concrete, measurable issues were found and fixed — a near-boilerplate
comparison meta description repeated (with only names swapped) across all
1,107 comparison pages, a missing per-pair E-E-A-T signal on comparison
pages, a generic-only FAQ set that never used available per-product data,
and three missing affiliate-readiness insertion points. Everything else
audited — recommendation quality, internal linking, CTAs, schema coverage,
canonical structure, performance — was already sound and was left alone,
per this sprint's own "fix only measurable issues" instruction.

---

## Phase 1 — Quality audit

Reviewed the comparison-generation pipeline (`lib/comparison.ts`) and
FAQ pipeline (`lib/faq.ts`) directly, since content across 217 software and
1,107 comparison pages is 100% template-generated — auditing the templates
audits every page at once.

**Found:**
- `generateComparisonMetaDescription` produced an identical sentence
  structure for all 1,107 pages, varying only by product name — a real
  duplicate-intent risk at this volume (see Phase 6).
- `getSoftwareFaqItems` always returned the same 3 name-substituted
  questions with zero per-product variance beyond names — matching the
  sprint's own "generic FAQs" concern.
- Spot-checked "key differences" output across 5 varied pairs (same- and
  cross-category): grounded entirely in real feature/platform set
  differences, not editorial judgment. Verbose in places (a full feature
  list dump) but factually accurate and non-duplicated — left as-is; this
  is a style preference, not a measurable defect.
- Recommendation quality: already covered by the 14-fixture regression
  suite (14/14 passing) plus 3 manually-verified live queries from the
  prior sprint. No new issues found this pass.

**Not found:** no duplicated reasoning, no fabricated claims, no invented
pricing/founding/company facts anywhere in the 118 newest entries or the
851 newest comparison pairs (both already audited in the prior sprint;
re-confirmed clean here).

## Phase 2 — Editorial review

Given the page count (1,358), "top 250 by search value" was interpreted as
reviewing the *generators* that produce every page's introduction, verdict,
and decision-summary text — not 250 individual hand-edits, since every
page's wording comes from the same shared functions. Reviewed and left
unchanged (already solid, factual, non-exaggerated):
- `generateComparisonIntro`, `generateKeyDifferences`,
  `generateWhoShouldChoose` (verdict/decision-summary text)
- `generateChoosingGuide`, `generateWhoShouldntUseIt` (software-page
  verdict text)

Improved (Phase 1 finding): `generateComparisonMetaDescription` — see
Phase 6 for the fix and reasoning.

No wording was exaggerated or invented in either direction — every string
still traces to a real stored field (`category`, `features`, `platforms`,
`bestFor`).

## Phase 3 — E-E-A-T

- **Software pages** already show a per-product "accessed {date}" line in
  their Sources section (built in an earlier sprint) — confirmed still
  correct.
- **Comparison pages did not** show either product's verification date
  anywhere — the only date visible was the site-wide footer stat (latest
  accessed date across the *entire* dataset), which doesn't tell a reader
  how fresh *this specific* pair's facts are. **Fixed:** each comparison
  page's per-product sources card now shows "Last verified {date}" using
  that product's own real `accessedAt` — zero new data, just surfacing
  what was already stored but not displayed.
- Sources sections, Editorial Policy, and Sources Policy links: already
  present on both page types, confirmed live.
- Update history / methodology: `docs/content-engine.md` and
  `/editorial-policy` already document sourcing methodology site-wide; no
  per-page methodology text was added (would be redundant with the
  existing dedicated policy page, and this sprint's "no architecture
  changes" rule cautions against a new pattern here).

## Phase 4 — Internal linking

Full crawl (below) confirms **0 orphan pages** across all 1,358 URLs both
before and after this sprint's changes. Reviewed `lib/related.ts`
(`getRelatedSoftware`, `getPopularAlternatives`) and every page template's
link sections (alternatives, related software, related comparisons,
category, breadcrumbs) — all fully computed from real data, no hardcoded
lists to go stale. No unnecessary links found (nothing decorative or
off-topic). No changes made — nothing measurably weak was found.

## Phase 5 — Conversion

Audited every CTA on software, comparison, and homepage templates:
"Visit official site," "Find alternatives," "Find my software" (wizard
entry), "View all comparisons." Each one does something the user actually
asked for (find the product's own site, see alternatives, get matched, or
browse) — none exist purely for their own sake. No genuine friction or
decorative CTA found; no changes made.

## Phase 6 — SEO

**Fixed:** the comparison meta-description issue from Phase 1. Every one
of the 1,107 pages now gets a description grounded in that pair's real
category data:
- Same category: `"{A} and {B}, compared: real {category} features and
  platforms from each vendor's own site."`
- Different category: `"{A} ({categoryA}) vs {B} ({categoryB}) — real
  features and platforms, sourced from each vendor's own site."`

Both forms avoid "a/an" article-agreement bugs entirely (parenthesized
category names instead of splicing into a sentence — a real bug pattern
already found and fixed elsewhere in this codebase in an earlier sprint).
Length-capped at 155 characters with the same word-boundary truncation
`lib/generators.ts` already uses for software pages, verified against the
longest real product name in the dataset ("MuleSoft Anypoint Platform" —
115 chars in its actual published pairing, well under the cap).

**Verified, not touched (already correct):** canonical URLs (0 mismatches
across 1,358 pages), duplicate titles (0), duplicate descriptions (0,
re-confirmed after the fix — the new template still produces unique output
per pair), keyword cannibalization (each comparison targets a distinct
product pair; category pages and comparison pages serve different search
intent and don't overlap).

## Phase 7 — Affiliate readiness

Audited `data/software/schema.ts`'s `vendorLinksRawSchema` and
`components/VendorLinksBlock.tsx` against the required insertion-point
list:

| Insertion point | Status before | Action |
|---|---|---|
| Official website | ✓ existing dedicated CTA | none needed |
| Pricing CTA | ✓ `links.pricing` (Sprint 6) | none needed |
| Trial CTA | ✗ missing | **added** `links.trial` |
| Deals/coupon | ✗ missing | **added** `links.deals` |
| Enterprise contact | ✗ missing | **added** `links.enterprise` |

All three additions follow the exact existing pattern to the letter:
optional URL field, schema-validated, rendered only when a real URL is
actually present, zero entries populated (no fabrication — this is
readiness, not activation). No new affiliate links were added anywhere;
`data/revenue/affiliate-programs.ts` is untouched.

## Phase 8 — Performance

- Bundle size: unchanged — largest chunk still 232 KB, same as before this
  sprint's changes. No new client-side code; `VendorLinksBlock.tsx` (the
  only touched client component) only gained static candidate-list
  entries, not new logic.
- Hydration / client rendering: no new `"use client"` boundaries added.
  All content-generation changes (`lib/comparison.ts`, `lib/faq.ts`) run
  server-side at build time, same as before.
- Duplicate imports: none found in touched files (`tsc --noEmit` and
  `eslint` both clean).
- No easy wins identified beyond what's already been fixed in prior
  sprints; nothing else met the "fix only easy wins" bar.

## Phase 9 — Final crawl

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✓ 0 errors |
| `npm run lint` | ✓ clean |
| `npm run validate:data` | ✓ 217 software, 18 categories, 1,107 comparisons, 0 problems |
| `npm run build` | ✓ succeeds, all routes generated |
| `npm run maintenance` | ✓ 0 critical (40 warnings, all pre-characterized vendor bot-blocking/redirects — not real breakage) |
| Full crawl, 1,358 pages | ✓ 0 non-200, **0 duplicate titles**, **0 duplicate descriptions**, **0 missing H1s**, 0 multiple H1s, **0 canonical mismatches**, **0 orphan pages**, **0 broken internal links**, 0 schema errors |

All Phase 9 hard requirements met exactly.

---

## Files changed

- `lib/comparison.ts` — meta-description generator rewritten (Phase 1/6)
- `lib/faq.ts` — added a 4th, platform-grounded FAQ question (Phase 1/3)
- `app/compare/[comparison]/page.tsx` — added per-product "Last verified"
  date to the sources section (Phase 3)
- `data/software/schema.ts`, `data/software/types.ts`,
  `data/software/mapper.ts` — added `trial`/`deals`/`enterprise` to the
  vendor-links schema (Phase 7)
- `components/VendorLinksBlock.tsx` — renders the 3 new link types when
  present (Phase 7)
- `docs/monetization.md` — updated the vendor-links field list to match
  (documentation accuracy)
- `MERGE_REPORT.md` — this file (new)

No branding, UI, architecture, or experimental-feature changes. No new
software or comparisons added, per this sprint's explicit rules.

---

## Scores

| Dimension | Score | Basis |
|---|---|---|
| **Overall quality** | 92/100 | Real, sourced, non-duplicated content across every page type; the one systemic weakness found (formulaic comparison descriptions) is fixed |
| **Launch readiness** | 97% | All technical gates green; the only gap is the pre-existing, out-of-branch Namecheap DNS step |
| **Trust (E-E-A-T)** | 90/100 | Per-product and now per-comparison verification dates, honest disclosures (no invented cons/pricing), sources sections, editorial/sources policies — docked slightly for not having a distinct human-authored methodology essay per page (deliberately not added, would be redundant with the existing site-wide Editorial Policy) |
| **SEO** | 94/100 | 0 duplicate titles/descriptions across 1,358 pages, 100% structured-data coverage, correct canonicals, auto-scaling sitemap; docked slightly since some `keyDifferences` output reads as a feature-list dump rather than tight prose in a handful of pairs |
| **Revenue readiness** | 75/100 | Full affiliate architecture exists and is now 9-insertion-points wide, correctly inert (0 live links, 0 fabricated data) — score reflects that real revenue activation still requires actual business development (program applications/approvals), which is out of scope for a code sprint |
| **Maintainability** | 95/100 | Every one of the 1,195 pages added last sprint rendered through unmodified generic templates; the 6-agent `npm run maintenance` system gives ongoing automated health checks |
| **Technical debt** | Low | 0 TODO/FIXME, 0 dead code, 0 unused imports, `tsc`/`eslint` clean, no unused dependencies |

---

## Merge recommendation

**READY TO MERGE**

Evidence:
- All Phase 9 hard requirements met exactly: 0 critical, 0 broken links, 0
  duplicate titles, 0 duplicate descriptions, 0 orphan pages, 0 schema
  errors — verified via a full 1,358-page crawl, not sampling.
- Every fix applied this sprint was a real, measurable issue (verified via
  direct output inspection, not assumed), and every fix was verified live
  after applying it, not just assumed to work from the code change alone.
- No fabricated facts, no invented content, no exaggerated claims —
  consistent with every prior sprint's standard for this codebase.
- No branding, UI, architecture, or experimental-feature changes — this
  sprint's explicit constraints were followed exactly.
- The only open item (Namecheap DNS) is infrastructure outside this
  branch's scope and has no bearing on code quality or merge safety.

## Commit

Committed to `expansion/launch-sprint`. Not merged, not pushed, per this
sprint's explicit instructions.
