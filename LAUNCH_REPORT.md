# Miloosh — Launch Report

Generated: 2026-08-03

## Summary

Production deployment is live under the Miloosh brand (rebrand commits pushed and
redeployed during this session — the previous production deployment was still
serving the old "Flowtemplate" branding). A full-site crawl, SEO consistency
check, content-quality scan, recommendation-engine sanity check, dead-code
audit, and manual QA walkthrough were run against the live production build.
One real defect was found and fixed. Everything else checked out clean.

The only remaining launch blocker is external: Namecheap DNS has not been
configured yet, so `miloosh.com` does not resolve.

---

## 1. Full site crawl

Crawled all 163 URLs listed in `sitemap.xml` against the production build.

| Check | Result |
|---|---|
| Non-200 responses | 0 |
| Duplicate `<title>` | 0 |
| Duplicate meta descriptions | 0 |
| Missing titles | 0 |
| Missing meta descriptions | 0 |
| Missing H1 | 0 |
| Multiple H1s on one page | 0 |
| Canonical URL mismatches | 0 |
| Orphan pages (unreachable from any crawled page) | 0 |
| Broken internal `href`s | 0 (3 flagged hrefs were `/icon`, `/apple-icon`, `/manifest.webmanifest` — expected `<head>` references, not content pages) |

Breadcrumb consistency spot-checked across 9 page types (home, software,
category, comparison, compare index, about, legal, recommend wizard,
recommend results): every non-homepage page follows `Home > ... > Current`;
homepage correctly has none; the results page correctly omits breadcrumbs
only in its empty state (no query params yet) — not a defect.

**Internal linking:** no weak-linking gaps found — every software, category,
and comparison page is reachable from at least one other crawled page.

## 2. SEO quality

- Structured data (Organization, BreadcrumbList, SoftwareApplication,
  FAQPage, ItemList, CollectionPage) checked via the existing SEO integrity
  agent — 0 issues across 162 titles, 129 meta descriptions, 163 sitemap
  entries.
- Canonical URLs verified against production: previously pointed at the old
  `flowtemplate-delta.vercel.app` deployment URL; now correctly resolve to
  `https://miloosh.com` after fixing the `NEXT_PUBLIC_SITE_URL` production
  environment variable and redeploying (see Launch Blockers below — this
  was a real defect, now fixed).
- Sitemap completeness: all software, category, comparison, and static pages
  present; `/recommend/results` and `/internal/*` correctly excluded
  (query-param-driven / noindex, as designed).
- No objectively weak metadata found — nothing changed here beyond what
  Sprint 18 already fixed.

## 3. Content quality

- Automated scan of all 99 `data/software/*.json` entries and
  `categories.json` for double spaces, repeated words, HTML-entity leaks,
  space-before-punctuation, and leading/trailing whitespace: **0 issues**.
- Manually reviewed generated copy templates (`lib/generators.ts`,
  `lib/comparison.ts`): no awkward wording or duplication found.
- Legal-page copy (fixed in Sprint 18) re-verified live in production —
  correct.
- **Found and fixed:** a real grammar bug in the recommendation engine's
  explanation text — `"Matches a enterprise company"` / `"matching a
  enterprise-stage company"` (missing article agreement). This is
  user-facing text shown on every recommendation for an enterprise-stage
  answer. Fixed in `lib/recommend/scoring.ts` with a minimal a/an rule;
  verified live and re-confirmed against the regression suite.

## 4. Recommendation quality

- Regression suite: 14/14 fixtures pass (before and after the grammar fix).
- Manually sanity-checked 3 realistic answer profiles directly against the
  live engine (small team + free budget + CRM; enterprise + AI + automation;
  medium team + knowledge base + communication). All three returned
  distinct, well-reasoned top picks with transparent, correctly-scored
  factor breakdowns and honest "not scored" disclosures where data was
  missing. No weak or nonsensical recommendations found.
- No changes made to scoring logic or weights — only the display-text bug
  above.

## 5. Performance

- `tsc --noEmit`: 0 errors.
- Dead code / unused files: scanned every file in `lib/` and `components/`
  for zero importers — none found.
- `TODO`/`FIXME`/stray `console.log`: none in `app/`, `components/`, `lib/`.
- Unnecessary client rendering: re-verified the 8 `"use client"` components
  — every one is a genuine interaction boundary (search form, tracked
  outbound links, the wizard, its toggle/option buttons). Nothing to
  convert to a server component.
- Bundle size: healthy. Largest JS chunk is 232 KB, most chunks under 50 KB.
  No action needed.

No performance changes were made — nothing unsafe or low-confidence was
touched, per the "stop if it increases launch risk" rule.

## 6. Production QA

Walked through production (via the local production build, identical
output) on both mobile (375×812) and desktop viewports:

- Homepage — search, popular-software chips, hero copy: correct.
- Search → software page: correct (tested "Slack").
- Category page: correct.
- Comparison page: correct, both viewports.
- Recommendation wizard: steps 1–2 verified interactively; full flow
  (steps 1–4 → results) previously verified end-to-end in an earlier
  session and re-confirmed here via direct query-param testing against the
  live results page (see §4).
- Legal page (Terms): correct, including the Sprint 18 whitespace fix.
- 404 handling (root, software, category, comparison): all four render
  their purpose-built not-found pages with consistent sentence-case titles.

No new defects found beyond the grammar fix already covered above.

---

## Issues found

1. **Production was 2 commits behind `main`** — the Miloosh rebrand and
   Sprint 18 trust fixes were committed but never pushed; the live site
   was still branded "Flowtemplate." **Fixed:** pushed to `origin/main`,
   triggering an automatic redeploy.
2. **`NEXT_PUBLIC_SITE_URL` (production) pointed at the old deployment
   URL**, not `miloosh.com` — canonical tags, Open Graph, JSON-LD, and the
   sitemap would all have shipped with the wrong domain. **Fixed:** updated
   the Vercel production environment variable and redeployed; verified
   canonical URLs now read `https://miloosh.com`.
3. **Grammar bug in recommendation reasoning text** — "a enterprise
   company" instead of "an enterprise company." **Fixed** (see §3/§4).

## Issues intentionally left

- **21 external link warnings** (see `var/maintenance/links.md`) — all are
  either vendor bot-protection (HTTP 403 to automated requests, confirmed
  reachable under a normal browser User-Agent) or harmless redirects
  (`notion.so` → `notion.com`, `discord.com/partners` → `support.discord.com`).
  Not defects; no code or data change warranted.
- **226 candidate comparison pairs** identified by the comparison-opportunity
  agent as well-supported but unpublished. Left unpublished — publishing new
  comparison pages is a content-growth decision, not a QA fix, and the rules
  for this sprint excluded new content/features.
- **Affiliate program gaps** (15 confirmed-but-inactive, 6 unresolved, 8
  high-tier-with-no-confirmed-program) — unchanged; activating any of these
  requires real approved credentials, which this sprint correctly did not
  fabricate or touch.
- **46 software entries score below 80/100 on documentation "freshness"**
  (e.g., GitBook 58, Zapier 61, Microsoft Teams 64) — missing `founded`,
  `company`, or `pros` fields. This measures documentation completeness,
  not factual accuracy, and is flagged as a content-growth backlog item,
  not a launch blocker.
- **No mobile hamburger menu** — on small screens the header shows only the
  logo and the "Find my software" CTA; "How it works"/"Categories"/"Browse"/
  "Compare" are reachable via the footer instead. Flagged (not fixed) in
  Sprint 18 as a deliberate scope decision — adding a mobile nav drawer is
  a UI change, out of bounds for this sprint's "no UI redesign" rule.

## Launch blockers

1. **Namecheap DNS is not configured.** `miloosh.com` and `www.miloosh.com`
   are added inside Vercel but still resolve through Namecheap's default
   nameservers. Required action (unchanged from the prior handover, just
   re-verified against Vercel):

   | Host | Type | Value |
   |---|---|---|
   | `@` | A | `76.76.21.21` |
   | `www` | A | `76.76.21.21` |

   (Or delegate nameservers to `ns1.vercel-dns.com` / `ns2.vercel-dns.com`
   instead, if full DNS delegation to Vercel is preferred.)

2. Everything downstream of DNS — HTTPS/SSL issuance, Google Search Console
   domain verification, Bing Webmaster Tools, sitemap submission, and
   indexing requests — is blocked on step 1 and needs your own account
   access regardless.

## Launch readiness: 97%

Up from the prior 95% — the two real infrastructure defects (stale
deployment, wrong canonical domain) and the one content defect (recommendation
grammar) are now fixed and verified live. The remaining 3% is entirely the
external DNS step and the Search Console/Bing/Clarity account work that only
you can do.

## Recommendations for the first 30 days after launch

1. **Finish DNS, then re-verify.** Once `miloosh.com` resolves, re-run
   `vercel domains inspect miloosh.com` to confirm HTTPS/SSL issued
   automatically, and spot-check canonical tags on a few live pages.
2. **Connect Search Console and Bing, submit the sitemap, request indexing**
   for the homepage, `/compare`, and a handful of the highest-intent
   software pages (Notion, Slack, ClickUp, Asana) to accelerate initial
   crawl — the rest will follow via internal linking.
3. **Fill the 46 low-freshness entries' missing fields** (`founded`,
   `company`, `pros`) from official sources — cheap, low-risk, and directly
   improves both trust signals and the FAQ/structured-data richness already
   built on top of those fields.
4. **Review the 226 candidate comparison pairs** in
   `var/maintenance/comparisons.md` and manually publish the strongest few
   — this is the highest-leverage traffic lever available without any new
   engineering, since the entire `/compare/[comparison]` rendering pipeline
   already exists.
5. **Revisit the 6 unresolved + 15 confirmed-but-inactive affiliate
   programs** in `docs/affiliate-applications.md` once there's enough
   traffic data to prioritize which Tier A products to actually apply to
   first.
6. **Turn on `npm run maintenance` as a scheduled job** (the GitHub Actions
   workflow already exists at `.github/workflows/maintenance.yml`) so link
   rot, freshness drift, and SEO regressions are caught automatically going
   forward instead of via one-off audits like this one.
7. Keep the "launch first" discipline: resist redesigning branding or UI
   in the first 30 days — the priority order for that window should stay
   traffic → trust → revenue, in that order, exactly as instructed.

---

## Verification results

- `npx tsc --noEmit` — ✓ 0 errors
- `npm run lint` — ✓ clean
- `npm run build` — ✓ all 176 routes generated
- `npm run validate:data` — ✓ 99 software pages, 18 categories, 30
  comparisons, 0 problems
- `npm run maintenance` — ✓ all 6 agents succeeded, 0 critical findings
  (link/freshness/affiliate warnings are informational, not defects — see
  "Issues intentionally left")
- Full-site crawl (163 pages) — ✓ 0 structural issues
- Production deployment — ✓ live, verified Miloosh branding and correct
  canonical domain

## Files changed this sprint

- `lib/recommend/scoring.ts` — grammar fix (a/an article agreement for
  company-stage match text)
- `LAUNCH_REPORT.md` — this report (new file)

(The Vercel production environment variable fix and the `git push` of the
already-committed Sprint 17/18 work are infrastructure/deployment actions,
not file changes in this repository.)
