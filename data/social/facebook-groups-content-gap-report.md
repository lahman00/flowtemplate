# Miloosh — Facebook Research → Content → Traffic → Affiliate Revenue

## Executive Report (Phase 13)

Date: 2026-08-18. Baseline: `data/social/facebook-groups.json` (75 groups, 32
feed-sampled), commits `85c431d`/`d731de2` (Round 3 feed sampling), and this
turn's content build, commit `eef5d9d`. **No new Facebook discovery or
browsing was performed this turn** — everything below is synthesis of
already-verified evidence plus a direct audit of the live Miloosh repository,
per the explicit instruction that the research threshold was already met.

Two content prohibitions were honored throughout: **UNKNOWN stays UNKNOWN**
(no fabricated buyer intent, no invented pricing, no fabricated affiliate
status), and **user value first, commercial intent second, monetization
third** — no product is recommended because its affiliate program pays.

---

### 1. Final CORE Facebook portfolio (12 groups)

Full evidence-backed writeups in section "14. Group-by-group CORE playbooks."
Names only here:

1. SaaS Marketing Group
2. SaaS Founders Club
3. Claude AI Builds That Actually Make You Money
4. AI | AI Prompts & Automation for Business
5. Helping Property Managers with AppFolio, Buildium, Propertyware, and more
6. IT & MSP Business Owners Group
7. IT Business Owners Group
8. GoHighLevel Users Funnels Automation & Hiring Support
9. Highlevel (GHL) official community
10. Zoho CRM Tips & Tricks
11. CPA & Accountant Business Owners (USA)
12. Xero Users Support Community

This is a **revision of the prior portfolio**, not a copy of it. Two changes
driven specifically by Round 3 feed evidence and this turn's content build:
- **IT Business Owners Group promoted from SECONDARY to CORE** — the Round 3
  sample surfaced a real, named-tool buyer/operator discussion (Huntress vs.
  Microsoft-native tooling for tenant onboarding), the single strongest
  buyer-intent evidence found in this entire audit.
- **GoHighLevel Users Funnels Automation & Hiring Support and Highlevel (GHL)
  official community promoted to CORE** now that Miloosh has real GoHighLevel
  coverage to point to (see section 9) — previously they were high-scoring
  but orphaned (no Miloosh page existed for the product being discussed).
- **CPA & Accountant Business Owners (USA) and Xero Users Support Community
  promoted to CORE** for the same reason — QuickBooks Online and Xero pages
  now exist.
- **CRM systems removed from CORE** (was a "replacement candidate" in Round
  2) — Round 3 feed evidence showed its top visible post was a vendor ad
  ("Fovty Solutions" IT/CRM package), not user discussion. Downgraded to
  RESEARCH ONLY.

### 2. Secondary portfolio

Groups with real audience fit but weaker verified buyer intent, weaker
posting opportunity, or not yet feed-sampled to CORE confidence:

- AI & Automation for US-based Business Owners *(member, OBSERVE_ONLY —
  Eyal/Miloosh are not US-based; stays a member, posting never unlocked)*
- Startup group SaaS: Online Software & Services
- SaaS Growth & Scale — Founders & Agency Owners
- Independent QuickBooks Online Help & Support *(large, real, content-matched
  since this turn's QuickBooks page — not yet feed-sampled; promote to CORE
  after one real post sample)*
- Small Business AI and Automations
- Small Business Owners Who Need Bookkeepers *(large, content-matched, not
  yet feed-sampled)*

### 3. Research-only / listening portfolio

Good evidence, wrong venue for participation — see section 13 for the full
TOP 10 with reasons. Headline entries: **CRM systems**, **SAAS Product
Marketing / SaaS Sales & Marketing** (confirmed identical cross-posted vendor
ad — a shared/duplicate-audience network, not two independent communities),
**Software Marketplace - Cloud Based Software Buy Sell**, **Software
Requirements & Startups**, **IT & MSP Business Owners Group** (dual-listed —
CORE for monitoring value, but personal participation is compromised; see
Phase 10), **Businesses looking for Accountant, CPA, Bookkeeping, Tax Prep**
(demand-side for accounting *services*, not accounting *software* — still
useful to watch for spillover software mentions).

### 4. Rejected groups

Unchanged from Rounds 1–3 (10 groups, real evidence per group): BizAI Hub
(157.5K members, 0 posts/month — dormant), Small Business Owners (56K,
engagement-farming scheme), SaaS Founders (449 members), SaaS Founders
Community (51 members), Small Business & Entrepreneur Software Deals Group
(197 members, coupon-dump framing), Software Buyers (173 members), AI
Marketing Automation For Agencies and Business Owners (463 members, no
activity), AI Tools for Business (184 members), IT Business Owners (74
members, redundant with #7 above), Productivity Content (42-member ambiguous
match). **New this round: Productivity and Workflow Growth** — Round 3 feed
sample confirmed its top visible post is generic motivational filler
unrelated to software or productivity tooling despite the group's name.

### 5. Groups not worth personal-account exposure

See Phase 10 (section 15) for the full classification. Headline: **IT & MSP
Business Owners Group and IT Business Owners Group are CORE-for-monitoring
but NOT_WORTH_PERSONAL_MEMBERSHIP** — Eyal is not an MSP/IT business owner,
and joining would require misrepresenting that fact on entry questions. Their
CORE status reflects genuine content value Miloosh can act on editorially
(building the field-service/IT-tooling content these buyers need), not a
recommendation that Eyal personally join and post.

### 6. Top observed buyer-intent themes

See the full Phase 2 table in section 8. Highest-confidence, real observed
signals: property-management tool-usage disclosure (AppFolio/Buildium named
directly), GoHighLevel switching/comparison chatter, Zoho CRM product-usage
support questions, and a real IT/MSP named-tool comparison (Huntress vs.
Microsoft).

### 7. Product ecosystems with strongest evidence

1. **GoHighLevel** — 7 communities, 350K+ combined members, real comparison
   chatter. Now addressed (section 9).
2. **Accounting (QuickBooks/Xero)** — 230K+ combined accounting-adjacent
   audience across multiple communities. Now addressed (section 9).
3. **Zoho CRM** — smaller but the cleanest, lowest-spam real support
   discussion sampled in the whole audit. Already well covered by Miloosh
   (existing zoho-crm.json + 5 published comparisons).

### 8. Vertical ecosystems with strongest evidence

1. **Home services (HVAC/construction)** — 100K+ combined, real peer
   engagement, but **zero matching Miloosh content** (no field-service
   category exists) — the single largest unaddressed vertical gap.
2. **Property management** — small (7.5K) but the single strongest
   buyer-intent quote evidence in the whole audit; vendor-owned group, so
   audience is real but treat neutrality with care.
3. **Accounting/bookkeeping (CPA-side)** — real, evidenced, now
   content-matched.
4. **Legal, dental/healthcare** — real but thin evidence (1-3 real posts
   each), no matching Miloosh content, not yet worth a content investment.

### 9. Miloosh coverage gaps (audit results)

Full Phase 3 audit in section 9 below. Headline finding: **GoHighLevel,
QuickBooks, Xero, AppFolio, Buildium, ServiceTitan, Housecall Pro, Jobber,
Clio, MyCase, Dentrix, FreshBooks, and Wave did not exist anywhere in
Miloosh's 222-entry software database before this turn** — a complete,
verifiable gap, not an inference. **GoHighLevel, QuickBooks Online, and Xero
are now covered** (3 new software profiles, 1 new category, 2 new comparison
pages — see section 16). Property management, field-service, legal, and
dental/healthcare software remain uncovered — correctly, given weaker or
unsampled evidence for those verticals (see section 19).

### 10. TOP 20 money-page opportunities

Full table with rationale in section 11.

### 11. TOP 10 multi-community content assets

Full table in section 12.

### 12. Affiliate alignment

Full table in section 13. Headline: none of the three newly-added products
(GoHighLevel, QuickBooks Online, Xero) has been affiliate-researched yet —
correctly left as `UNKNOWN` rather than guessed. Of the *existing* demand
themes, Airtable, Monday.com, Shopify, and Wix already have ACTIVE, live
affiliate links, and Pipedrive has a real application `pending_review`.

### 13. TOP 10 listening communities

Full table in section 14.

### 14. Group-by-group CORE playbooks

Full playbooks in section 15.

### 15. Content → community matrix

Full matrix in section 16.

### 16. TOP 5 pages selected for immediate creation

1. **GoHighLevel software profile** (`/software/gohighlevel`)
2. **GoHighLevel vs HubSpot** (`/compare/gohighlevel-vs-hubspot`)
3. **QuickBooks Online software profile** (`/software/quickbooks-online`)
4. **Xero software profile** (`/software/xero`)
5. **QuickBooks Online vs Xero** (`/compare/quickbooks-online-vs-xero`)

Rationale: these are the two strongest, most-repeated, most-verified real
demand signals across all three research rounds (GoHighLevel: single largest
product-specific community cluster in the whole audit, 350K+ members;
accounting: 230K+ combined audience, direct real evidence from CPA and Xero
communities) — and both were completely absent from Miloosh (not weak
coverage, zero coverage), making them the highest-leverage, lowest-regret
places to spend content effort first.

### 17. Pages actually created

All 5 selected pages were built this turn, using real official-source data
(no fabricated pricing, no fabricated statistics):

- `data/categories/categories.json` — added `accounting` category
- `data/software/gohighlevel.json` — real pricing from gohighlevel.com/pricing
  (Starter $97/mo, Unlimited $297/mo, Agency Pro $497/mo, Enterprise custom;
  14-day free trial), features, alternatives (HubSpot, Zoho CRM, Pipedrive —
  all already in the catalog)
- `data/software/quickbooks-online.json` — real pricing sourced from
  quickbooks.intuit.com (Simple Start $38, Essentials $85, Plus $140,
  Advanced $340/month) — **sourcing note**: quickbooks.intuit.com blocked
  direct WebFetch (repeated 60s timeouts) both this session and is a known
  pattern; pricing was corroborated via a domain-restricted web search
  against quickbooks.intuit.com only, not a direct page fetch. Flagged
  honestly here rather than silently treated as equally strong as a direct
  fetch.
- `data/software/xero.json` — real pricing directly corroborated from
  xero.com search results (Early $25, Growing $55, Established $90/month,
  effective until the announced Oct 2026 increase) — the direct WebFetch to
  xero.com returned HTTP 503 on every attempt; pricing came from a
  domain-restricted search of xero.com only, same honesty caveat as above.
- `data/comparisons.ts` — added `["gohighlevel", "hubspot"]` and
  `["quickbooks-online", "xero"]` to `PUBLISHED_COMPARISONS`

Not deployed — per instruction, stopped before deployment. See "Do these
next" for the deploy step.

### 18. QA results

- `npm run validate:data` → **✓ 221 software pages, 19 categories, 1110
  comparisons, 0 problems**
- `npx tsc --noEmit -p .` → clean, no errors
- `npm run build` → succeeded; all 6 new routes
  (`/software/gohighlevel`, `/software/quickbooks-online`, `/software/xero`,
  `/compare/gohighlevel-vs-hubspot`, `/compare/quickbooks-online-vs-xero`,
  `/category/accounting`) generated as static HTML with correct
  `<title>`, canonical `<link>`, no `noindex`, and affiliate-disclosure
  markup present
- Sitemap: all 6 new URLs confirmed present in `sitemap.xml`
- Internal linking: confirmed automatic — `/category/accounting` links to
  both new software pages; `/category/crm` links to the new GoHighLevel page
  — no manual linking work was needed, the existing category-page generator
  handles it via the `category` field
- `npx vitest run` → **390/390 tests passing across 44 test files**, no
  regressions
- No unrelated files were modified

### 19. Remaining uncertainties

- **QuickBooks/Xero pricing sourcing**: corroborated via domain-restricted
  search rather than a direct official-page fetch (both official pricing
  pages actively blocked automated fetching this session). Recommend a
  manual spot-check against the live pricing pages before the next content
  refresh cycle, and treat `last_verified: 2026-08-18` accordingly.
- **GoHighLevel/QuickBooks/Xero affiliate programs**: not researched this
  turn — correctly left absent from `data/revenue/affiliate-programs.ts`
  rather than guessed. This is real, actionable follow-up work (see "Do
  these next").
- **Home-services (HVAC/construction) content gap**: the largest verified
  vertical audience (100K+) has no matching Miloosh content and was
  deliberately *not* built this turn — building a field-service-management
  category (ServiceTitan, Housecall Pro, Jobber) would require the same
  real-sourcing process used here, scoped as a distinct follow-up, not
  rushed into this batch.
- **8 Facebook groups remain FEED_SAMPLE_BLOCKED** (private, no visible
  posts without joining) — unchanged from the Round 3 report; Digital
  Dentist and Xero Users Support Community show the strongest real activity
  stats among them and are the best future-join candidates specifically to
  unlock verification.
- **43 of 75 Facebook groups remain unsampled** at the feed level — the
  Round 3 report's priority list for a future sampling pass stands.

### 20. Recommended next 30 days

**Days 1–10 — Consolidate the content just built.**
Spot-check QuickBooks/Xero pricing directly on the official pages once
they're reachable (not blocked). Research real affiliate programs for
GoHighLevel, QuickBooks Online, and Xero the same way every other program in
`data/revenue/affiliate-programs.ts` was researched — official source only,
`programExists: unknown` until confirmed either way.

**Days 11–20 — Close the highest-leverage remaining Facebook evidence gaps.**
Feed-sample Independent QuickBooks Online Help & Support and Small Business
Owners Who Need Bookkeepers (both large, both now content-matched, both
still unsampled) to decide their promotion to CORE. Feed-sample HVAC
Business Owners & Contractors more deeply (currently only 1 post seen) to
decide whether the field-service content investment is justified.

**Days 21–30 — Begin natural community presence, CORE groups only.**
Following the already-existing 30-day plan in
`facebook-groups-launch-plan.md` (link-free, value-first participation,
week-1 observe-only), extend it to reference the new GoHighLevel/QuickBooks/
Xero pages *only* where a real, on-topic question in a CORE group calls for
that specific answer — never as a cold link-drop. Re-verify link/self-promo
rules for the GoHighLevel and Zoho CRM CORE groups specifically, since
neither has had its posted rules directly checked yet (About page unread in
this pass).

---

## DO THESE NEXT

1. **Spot-check QuickBooks and Xero pricing directly** against
   quickbooks.intuit.com/pricing and xero.com/us/pricing-plans once
   reachable — this turn's data is real but corroborated via search, not a
   direct fetch, and should be upgraded to a firsthand check.
2. **Research real affiliate programs for GoHighLevel, QuickBooks Online,
   and Xero** using the exact same official-source-only process already
   proven in `data/revenue/affiliate-programs.ts` — this is the single
   biggest lever connecting this turn's new content to actual revenue.
3. **Feed-sample Independent QuickBooks Online Help & Support and Small
   Business Owners Who Need Bookkeepers** — both are large, real, and now
   content-matched; one real post sample each decides their CORE promotion.
4. **Verify GoHighLevel and Zoho CRM CORE-group link/self-promotion rules**
   directly (About tab) before any future participation — neither has had
   its posted rules read yet, unlike most other CORE groups.
5. **Scope a dedicated field-service-management content pass** (ServiceTitan,
   Housecall Pro, Jobber) as its own follow-up — the 100K+ HVAC/construction
   audience is real and unaddressed, but deserves the same sourcing rigor as
   this turn's GoHighLevel/QuickBooks/Xero work, not a rushed addition.

---

## Phase 2 — Demand signal extraction (full detail)

**Method note**: every row below traces to a specific real post described in
`data/social/facebook-groups.json` (`notes` field, timestamped) or the
content-intelligence docs — never invented. Where a row's evidence is thin
(1 post, or no direct quote), that is stated in the Evidence Strength column
rather than glossed over.

| Demand Theme | What Users Need | Products Mentioned | Comparisons Implied | Vertical/Audience | Evidence Strength | Frequency | Commercial Intent | Affiliate Potential | Miloosh Relevance |
|---|---|---|---|---|---|---|---|---|---|
| **CRM selection/switching (GoHighLevel)** | An agency-usable, white-labelable CRM+funnel+automation platform | GoHighLevel, custom-built alternatives | GHL vs. custom-build; implicitly GHL vs. HubSpot/Pipedrive | Marketing agencies, SaaS-minded solo operators | OBSERVED (Round 1: "a member directly comparing their GHL-based CRM against a competitor's custom-built alternative") | High — 7 communities, 350K+ members | HIGH | Confirmed real program exists via PartnerStack-style networks for many GHL-adjacent tools; GHL's own program **not yet researched** (UNKNOWN) | Now covered (software profile + comparison) |
| **CRM product-usage support (Zoho)** | Help doing a specific task inside an already-chosen CRM | Zoho CRM | None (usage support, not switching) | Small-business CRM users | OBSERVED (Round 3: real "how do I group contacts to send collective emails" question + real step-by-step reply) | Low-medium (1 real post, but genuinely representative of the group's stated purpose) | LOW-MEDIUM (usage help, not a buying decision) | Zoho's affiliate program is ACTIVE/researched (15-20% commission, direct) | Already well covered — 5 published comparisons involving zoho-crm |
| **CRM/IT tooling comparison (named tools)** | Real operational comparison between a point solution and platform-native tooling | Huntress (ITDR), Microsoft-native tools | Huntress vs. Microsoft-native | IT/MSP operators | OBSERVED (Round 3: genuine tenant-onboarding-friction discussion naming both) | Low (1 post, but the single strongest named-product evidence in the whole audit) | HIGH | UNKNOWN — Huntress not in Miloosh catalog | Not currently coverable — Huntress/security-tooling category not in scope; noted as a real, quotable content angle but not actioned this turn |
| **Accounting software (QuickBooks/Xero)** | Real practitioners (CPAs/accountants) and small businesses needing bookkeeping software | QuickBooks, Xero (implied by community names/rules) | Implied QuickBooks vs. Xero (large, separate communities on each side) | Accountants, bookkeepers, small-business owners | PARTIALLY OBSERVED — community names and explicit anti-self-promo rules (Xero Users Support Community) are real evidence of audience; direct switching quotes were not captured this session | High — 230K+ combined accounting-adjacent audience across multiple communities | HIGH | Both **now** need affiliate research (UNKNOWN, not yet done) | Now covered (both software profiles + comparison) |
| **Property management software** | Real, named tool-usage disclosure and comparison | AppFolio, Buildium, Propertyware | Implied AppFolio vs. Buildium; also AI-integration interest ("looking more into Claude integrations") | Property managers | OBSERVED (Round 1, direct quotes: "We used Buildium for our PMS", "currently use Appfolio... looking more into Claude integrations", "our PM handles 1150 units w/ Buildium") | Low-medium (small 7.5K community, but the single strongest quote evidence in the whole audit) | VERY HIGH (named tools, real usage disclosure, real switching-adjacent interest) | UNKNOWN — AppFolio/Buildium not researched | **INFERRED OPPORTUNITY, not built this turn** — genuinely strong evidence but scoped out to keep this batch's sourcing rigor intact |
| **Field-service/home-services software** | Scheduling, dispatch, invoicing tools for trade businesses | Not directly named in sampled posts — category-level inference from HVAC/construction community existence and framing | None observed directly | HVAC contractors, general contractors | INFERRED OPPORTUNITY — the *audience* (100K+) is observed and real; the specific *product names* (ServiceTitan, Housecall Pro, Jobber) are not — this is Round 2's stated hypothesis, not a captured quote | High audience, low direct-quote evidence | HIGH (inferred from vertical fit, not confirmed by a direct product mention) | UNKNOWN | **Real gap, correctly not built this turn** — would need direct product-name evidence or fresh sourcing to justify with the same rigor as GHL/QuickBooks/Xero |
| **AI/automation tooling (general)** | Practical automation workflows for small businesses | Various (Claude, ChatGPT, Zapier/Make-adjacent, ungrounded vendor tools) | None consistently observed — mostly vendor self-promotion, not organic comparison | Small-business owners, agencies | MIXED — several sampled posts (AI AUTOMATION & AGENTIC AI, AI for Small Business Owners) were vendor lead-gen/self-promo, not organic buyer questions | High volume of groups, but confirmed LOW organic-discussion quality in several | LOW-MEDIUM (heavily diluted by vendor self-promotion) | Zapier/Make/n8n all have real, researched affiliate programs | Already well covered (automation category exists with Zapier, Make, n8n, Pipedream, IFTTT, Power Automate, Workato) |
| **Legal practice management** | Practice-operations tooling | Not named in the single sampled post (admin growth post only) | None observed | Law firm owners/managers | INFERRED OPPORTUNITY — thin (1 real post, non-buyer-intent) | Low | UNKNOWN — no direct evidence | UNKNOWN | Correctly not built — evidence too thin |
| **Dental/healthcare practice management** | Practice-operations tooling | Not named in sampled evidence | None observed | Dental practice owners | INFERRED OPPORTUNITY — thin, multiple groups blocked/unsampled | Low | UNKNOWN | UNKNOWN | Correctly not built — evidence too thin |
| **Project management tooling (ClickUp/Notion/Airtable/Monday)** | General productivity tooling | Airtable, Monday.com (by group name/framing) | None directly observed in this session's samples | Entrepreneurs, small teams | THIN — real groups exist and were partially sampled (Airtable highlight post), but no direct comparison quote captured | Medium | MEDIUM | Airtable and Monday.com both have ACTIVE, live affiliate links already | Already extremely well covered (56+ comparisons involving these products) |

---

## Phase 3 — Miloosh coverage audit (full detail)

Live repository audit, 2026-08-18. Before this turn: **222 software entries,
18 categories, 1108 published comparisons.** After this turn: **225 software
entries** (three new files; validate:data reports 221 *published* pages
because 4 existing entries are intentionally excluded from page generation —
unrelated to this turn's work), **19 categories, 1110 comparisons.**

| Observed Facebook Demand | Miloosh Coverage Before | Miloosh Coverage After | Classification |
|---|---|---|---|
| GoHighLevel (CRM/funnels/automation) | None — zero software entries for GoHighLevel, "highlevel", or "ghl" anywhere in the catalog | Full software profile + GoHighLevel vs HubSpot comparison | **WAS MISSING → now GOOD** |
| QuickBooks (accounting) | None — zero entries for "quickbooks" | Full software profile + no category previously existed | **WAS MISSING → now GOOD** |
| Xero (accounting) | None — zero entries for "xero" | Full software profile + QuickBooks vs Xero comparison | **WAS MISSING → now GOOD** |
| Zoho CRM (product-usage support) | Existing entry + 5 published comparisons (vs HubSpot, Pipedrive, Copper, Freshsales, Nutshell, Keap, Close) | Unchanged | **EXCELLENT** (already) |
| HubSpot/Pipedrive/Salesforce CRM ecosystem | Extensive — HubSpot alone has comparisons against 9 other CRMs | Unchanged | **EXCELLENT** (already) |
| Airtable/Monday.com/ClickUp/Notion project-management ecosystem | Extensive — dozens of published comparisons, 3 with ACTIVE affiliate links (Airtable, Monday) | Unchanged | **EXCELLENT** (already) |
| Shopify/Wix ecommerce | Extensive — 6+ comparisons each, both with ACTIVE affiliate links | Unchanged | **EXCELLENT** (already) |
| Property management (AppFolio/Buildium/Propertyware) | None | None (deliberately not built this turn — see Uncertainties) | **STILL MISSING** — real, evidenced, correctly deferred pending fresh sourcing rigor |
| Field-service/home-services (ServiceTitan/Housecall Pro/Jobber) | None | None | **STILL MISSING** — audience confirmed, product-level evidence not yet captured |
| Legal practice management (Clio/MyCase) | None | None | **STILL MISSING** — evidence too thin to prioritize yet |
| Dental/healthcare practice management (Dentrix/Curve Dental/Weave) | None | None | **STILL MISSING** — evidence too thin to prioritize yet |

---

## Phase 4/5 — Content gap database & TOP 20 money-page opportunities

Scoring per the requested rubric (Facebook Demand /25, Commercial Intent
/20, Affiliate Potential /15, SEO Potential /15, Miloosh Authority Fit /10,
Content Gap Severity /10, Evergreen Value /5 — Total /100). **Search volume
is marked UNKNOWN throughout — no tool available this turn to pull real
numbers, and none was fabricated.**

| # | Proposed URL | Title | Type | Product/Category | Facebook Ecosystem | Evidence | Audience | Search Intent | Commercial Intent | Affiliate Program | Miloosh Internal Links | Score /100 | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `/software/gohighlevel` | HighLevel (GoHighLevel) profile | Product profile | CRM/automation | GHL cluster (7 communities, 350K+) | OBSERVED (real switching chatter) | Agencies, SaaS operators | Informational→transactional | HIGH | UNKNOWN (not researched) | `/category/crm`, new comparison | 21+18+8+13+9+9+4 = **82** | **BUILT** |
| 2 | `/compare/gohighlevel-vs-hubspot` | GoHighLevel vs HubSpot | Comparison | CRM | Same as above | OBSERVED (implied by real "GHL vs custom-build" comparison chatter) | Agencies choosing a CRM platform | Transactional (buying decision) | VERY HIGH | HubSpot ACTIVE program researched; GHL UNKNOWN | `/software/gohighlevel`, `/software/hubspot` | 22+19+7+13+9+9+4 = **83** | **BUILT** |
| 3 | `/software/quickbooks-online` | QuickBooks Online profile | Product profile | Accounting | Accounting cluster (230K+) | PARTIALLY OBSERVED | Small businesses, CPAs | Informational→transactional | HIGH | UNKNOWN (not researched) | `/category/accounting`, new comparison | 18+17+7+13+9+9+4 = **77** | **BUILT** |
| 4 | `/software/xero` | Xero profile | Product profile | Accounting | Same | PARTIALLY OBSERVED | Small businesses, accountants | Informational→transactional | HIGH | UNKNOWN | Same | 18+17+7+13+9+9+4 = **77** | **BUILT** |
| 5 | `/compare/quickbooks-online-vs-xero` | QuickBooks Online vs Xero | Comparison | Accounting | Same | PARTIALLY OBSERVED (real communities on both sides) | Small businesses/CPAs choosing accounting software | Transactional | VERY HIGH | Both UNKNOWN | Both new profiles | 19+18+7+13+9+9+4 = **79** | **BUILT** |
| 6 | `/software/appfolio` | AppFolio profile | Product profile | Property management (new category needed) | Helping Property Managers group | OBSERVED (direct quotes) | Property managers | Informational→transactional | HIGH | UNKNOWN | Would need new category | 20+16+6+11+5+10+4 = **72** | NOT BUILT — deferred |
| 7 | `/software/buildium` | Buildium profile | Product profile | Property management | Same | OBSERVED (direct quote: "We used Buildium for our PMS") | Property managers | Informational→transactional | HIGH | UNKNOWN | Same | 20+16+6+11+5+10+4 = **72** | NOT BUILT — deferred |
| 8 | `/compare/appfolio-vs-buildium` | AppFolio vs Buildium | Comparison | Property management | Same | OBSERVED (both named directly, real audience) | Property managers | Transactional | VERY HIGH | Both UNKNOWN | Both above | 21+18+6+11+5+10+4 = **75** | NOT BUILT — deferred (needs #6/#7 first) |
| 9 | `/category/property-management` | Property management software category | Category | Property management | Same | OBSERVED | Property managers | Informational | MEDIUM | N/A | Multiple | 18+14+5+10+8+9+3 = **67** | NOT BUILT — deferred |
| 10 | `/software/servicetitan` | ServiceTitan profile | Product profile | Field service (new category needed) | HVAC/construction clusters (100K+) | INFERRED (audience real, product name not directly quoted) | HVAC/contractors | Informational→transactional | HIGH | UNKNOWN | Would need new category | 14+15+6+11+4+10+4 = **64** | NOT BUILT — needs fresh product-level sourcing |
| 11 | `/software/housecall-pro` | Housecall Pro profile | Product profile | Field service | Same | INFERRED | HVAC/contractors | Informational→transactional | HIGH | UNKNOWN | Same | 14+15+6+11+4+10+4 = **64** | NOT BUILT — same |
| 12 | `/software/jobber` | Jobber profile | Product profile | Field service | Same | INFERRED | Field-service businesses | Informational→transactional | HIGH | UNKNOWN | Same | 14+15+6+11+4+10+4 = **64** | NOT BUILT — same |
| 13 | `/compare/servicetitan-vs-jobber` | ServiceTitan vs Jobber | Comparison | Field service | Same | INFERRED | Field-service businesses | Transactional | HIGH | Both UNKNOWN | #10/#12 | 14+16+6+11+4+10+4 = **65** | NOT BUILT |
| 14 | `/software/clio` | Clio profile | Product profile | Legal practice management (new category) | Law Firm Owners and Managers | THIN (1 non-buyer-intent post) | Law firm owners | Informational | MEDIUM | UNKNOWN | New category | 8+11+5+10+3+9+4 = **50** | NOT BUILT — evidence too thin to prioritize |
| 15 | `/software/dentrix` | Dentrix profile | Product profile | Dental practice management (new category) | Digital Dentist, Dental Practice Owners USA | THIN (blocked/unsampled) | Dental practice owners | Informational | LOW-MEDIUM | UNKNOWN | New category | 6+10+5+10+3+9+4 = **47** | NOT BUILT — evidence too thin |
| 16 | `/compare/zoho-crm-vs-gohighlevel` | Zoho CRM vs GoHighLevel | Comparison | CRM | Zoho CRM Tips & Tricks + GHL clusters | OBSERVED (both sides real communities) | Small-business CRM buyers weighing simple vs. all-in-one | Transactional | HIGH | Zoho ACTIVE; GHL UNKNOWN | `/software/zoho-crm`, `/software/gohighlevel` | 16+16+8+12+9+8+4 = **73** | NOT BUILT — good next candidate, not in this batch's TOP 5 |
| 17 | `/compare/pipedrive-vs-gohighlevel` | Pipedrive vs GoHighLevel | Comparison | CRM | GHL clusters | OBSERVED (implied) | Sales teams weighing simple pipeline vs. all-in-one | Transactional | HIGH | Pipedrive PENDING_REVIEW; GHL UNKNOWN | `/software/pipedrive`, `/software/gohighlevel` | 15+16+8+12+9+8+4 = **72** | NOT BUILT — good next candidate |
| 18 | `/software/freshbooks` | FreshBooks profile | Product profile | Accounting | Accounting cluster (mentioned as a QuickBooks alternative in content-intelligence notes) | INFERRED (named in Round 1 notes as a QuickBooks-alternative category member, not a direct community quote) | Freelancers, small businesses | Informational→transactional | MEDIUM | UNKNOWN | `/category/accounting` | 12+13+6+11+7+7+4 = **60** | NOT BUILT — reasonable next accounting addition |
| 19 | `/compare/quickbooks-online-vs-freshbooks` | QuickBooks Online vs FreshBooks | Comparison | Accounting | Same | INFERRED | Freelancers/small businesses | Transactional | MEDIUM-HIGH | Both UNKNOWN | #3, #18 | 12+14+6+11+7+7+4 = **61** | NOT BUILT — needs #18 first |
| 20 | `/category/field-service-management` | Field-service management category | Category | Field service | HVAC/construction | INFERRED (audience real) | HVAC/contractors/trades | Informational | MEDIUM | N/A | Multiple | 14+13+5+10+7+8+3 = **60** | NOT BUILT — needs #10-13 first |

---

## Phase 6 — Affiliate alignment (full detail)

Cross-referenced against `data/revenue/affiliate-programs.ts` and
`var/agents/affiliate-pipeline.json` — **real repository data, never
guessed.**

| Content Opportunity | Product | Affiliate Status | Detail |
|---|---|---|---|
| Already-published comparisons (1108 pre-existing) | Airtable | **ACTIVE** | Live link in `data/software/airtable.json` (`affiliate.partnerlinks.io/...`) |
| Already-published comparisons | Monday.com | **ACTIVE** | Live link (`try.monday.com/...`) |
| Already-published comparisons | Shopify | **ACTIVE** | Live link (`shopify.pxf.io/...`) |
| Already-published comparisons | Wix | **ACTIVE** | Live link (`wix.pxf.io/...`) |
| Already-published comparisons | Pipedrive | **PENDING** | Application submitted 2026-08-14 via PartnerStack, `pending_review` per `var/agents/affiliate-pipeline.json` — do not reapply |
| Already-published comparisons | HubSpot | Program confirmed to **exist** (Impact network, 30% recurring), but **not yet applied** | Ready-to-apply, not in the pipeline file yet |
| Already-published comparisons | Zoho CRM | Program confirmed to **exist** (direct, 15-20% tiered) | Ready-to-apply, not in the pipeline file yet |
| Already-published comparisons | ActiveCampaign, ClickUp, n8n, Make | Programs confirmed to **exist** | All ready-to-apply, none yet submitted |
| **This turn's new content** | GoHighLevel | **UNKNOWN** — not researched this turn | Real follow-up work (see "Do these next" #2) |
| **This turn's new content** | QuickBooks Online | **UNKNOWN** — not researched this turn | Same |
| **This turn's new content** | Xero | **UNKNOWN** — not researched this turn | Same |
| Deferred opportunities (property management) | AppFolio, Buildium | **UNKNOWN** — not researched | Would need research before any content build |
| Deferred opportunities (field service) | ServiceTitan, Housecall Pro, Jobber | **UNKNOWN** — not researched | Same |
| Editorial-only, no monetization expected | Salesforce | **NO program exists** (confirmed — Salesforce runs partner/reseller programs, not a consumer affiliate program) | Salesforce content (already published, 5 comparisons) remains purely editorial — correctly so, this is not a reason to remove it |
| Editorial-only | Zapier | **UNKNOWN** (no public cash-affiliate program found on official pages, only partner/dev tiers) | Zapier content (already published) stays editorial-only |
| Editorial-only, selective partnership only | Klaviyo | Program exists but is a **selective business-partnership process**, not self-serve | Not pursuable as a standard affiliate; content remains editorial |

**Governing principle applied throughout**: none of the newly-built content
(GoHighLevel, QuickBooks, Xero) was shaped around an affiliate program,
because none has been researched yet — the pages exist purely because the
Facebook evidence justified them editorially. This is the intended order of
operations per the operating rules (user value → commercial intent →
monetization).

---

## Phase 7/14 — Group-by-group CORE playbooks

For each CORE group: audience, why it matters, verified buyer-intent themes,
products discussed, common pains, spam level, link risk, self-promotion
rules (verified or UNKNOWN), what Miloosh can contribute, what Miloosh must
not do, and 5 example contribution scenarios (descriptions only — **no
Facebook action is authorized by this document**).

### 1. SaaS Marketing Group
- **Audience**: SaaS founders, marketers, growth practitioners (28.7K members, public, member since Phase 1 of this project)
- **Why we care**: Score 78 (2nd highest in the dataset), real technical build-in-public content confirmed in Round 3 (a genuine "shipped a new SaaS feature, caught a bug, built an AI Readiness Scanner" post)
- **Buyer-intent themes**: Pricing-page experimentation, competitor comparison tables, SaaS growth tactics
- **Products discussed**: Varies by post; the sampled post referenced Claude Code and a self-built tool, not a third-party SaaS product directly
- **Common pains**: Technical debt in shipping fast, pricing-page decisions
- **Seller/spam level**: LOW (Round 3 sample was genuine technical content, not an ad)
- **Link risk**: UNKNOWN rules — not yet directly verified this session; posting permission itself is still gated behind an unanswered "role in the SaaS industry" question
- **Self-promotion rules**: UNKNOWN (not yet directly read)
- **What Miloosh can contribute**: Neutral pricing-page/comparison-table data drawn from Miloosh's own published comparisons; a factual answer to "has anyone measured X" style questions
- **What Miloosh must not do**: Post before self-promotion rules are actually verified; answer every thread; drop a link uninvited
- **5 example contribution scenarios**:
  1. If someone asks whether showing a competitor comparison table on a pricing page is common, Miloosh could describe the general pattern observed across its own published comparison pages (no numbers invented).
  2. If someone asks about GoHighLevel vs. HubSpot trade-offs, Miloosh could offer a neutral factual summary now that both are covered.
  3. If someone asks about grandfathering pricing on a plan change, Miloosh could share general patterns without claiming firsthand SaaS-operator experience Miloosh doesn't have.
  4. If someone asks for an accounting-software recommendation for their SaaS's own books, Miloosh could point to the new QuickBooks vs. Xero comparison.
  5. If someone shares a build-in-public update relevant to a tool Miloosh covers, a genuine congratulatory/clarifying comment (no link) is appropriate; a link is not, absent a direct on-topic question.

### 2. SaaS Founders Club
- **Audience**: SaaS founders (27.0K, public, member)
- **Why we care**: Score 74, real founder engagement confirmed (a founder explicitly disclaiming "not a sales pitch" while asking for genuine product feedback)
- **Buyer-intent themes**: Founder-to-founder tool recommendations, feedback requests
- **Products discussed**: Varies; sampled post was about the poster's own product (Kavoos.ai), not a third-party tool comparison
- **Common pains**: Getting genuine feedback without looking like a pitch
- **Seller/spam level**: LOW-MEDIUM (soft self-promo pattern observed, but framed founder-to-founder)
- **Link risk**: UNKNOWN — posting permission gated behind an unanswered LinkedIn-profile question
- **Self-promotion rules**: UNKNOWN
- **What Miloosh can contribute**: Factual, comparison-backed answers when a founder asks "what are people actually using for X"
- **What Miloosh must not do**: Treat this as a place to promote Miloosh's own product before rules are verified
- **5 example contribution scenarios**:
  1. A founder asking how to evaluate CRM options for their own company → point to the relevant comparison, described not linked, unless rules confirm links are fine.
  2. A founder asking about accounting software for a new SaaS entity → mention the QuickBooks vs. Xero trade-offs factually.
  3. A founder sharing a launch and asking for feedback → genuine, specific feedback, no Miloosh mention unless directly relevant and invited.
  4. A founder asking about GoHighLevel for their own agency arm → factual trade-off summary.
  5. A founder asking about pricing-page best practices → general, non-numeric pattern description.

### 3. Claude AI Builds That Actually Make You Money
- **Audience**: People building with Claude/AI tools commercially (34.2K, public, member, joined)
- **Why we care**: Score 66, the most deeply verified group in the entire audit — 8 real posts sampled before joining, confirmed rule "one promo post per week max," confirmed "no drive-by promos / context before links," confirmed genuine two-way admin engagement, 0 of 8 sampled posts were self-promotional
- **Buyer-intent themes**: Practical AI-tool usage in production, not raw prompts
- **Products discussed**: Claude (coordinator-agents, webhooks features), general AI-building tools
- **Common pains**: Reliable AI-agent handoffs, tool coordination
- **Seller/spam level**: LOW — the best-verified low-spam group in the dataset
- **Link risk**: MEDIUM — no post in the 8-post sample contained an external link, so whether links survive moderation is a genuine open unknown, not assumed
- **Self-promotion rules**: **VERIFIED** — "one promo post per week max," "no drive-by promos / context before links," "help before you pitch"
- **What Miloosh can contribute**: Genuinely useful comparison/pricing context when AI-tool cost questions come up; never as the first move
- **What Miloosh must not do**: Test whether links survive moderation opportunistically; post more than the verified weekly cap
- **5 example contribution scenarios**:
  1. If someone asks what a comparable AI-tool subscription costs relative to alternatives, Miloosh could share the relevant comparison's pricing table content as text, testing link tolerance only if the group's own norms clearly allow it.
  2. If someone asks about automation-tool costs (Zapier/Make/n8n), Miloosh could answer with real data from its own coverage.
  3. If a member shares a build and asks for tool recommendations to extend it, a specific, on-topic factual answer.
  4. If someone complains about a tool's pricing change, Miloosh could note whether Miloosh's own pricing data reflects that change (keeps data fresh, doesn't require a link).
  5. Never post a "check out my site" style message — the confirmed rule set explicitly discourages that pattern.

### 4. AI | AI Prompts & Automation for Business
- **Audience**: Business owners using AI/automation (128.2K, public, member — clean join, no gating questions)
- **Why we care**: Score 65, largest CORE-group audience, clean unrestricted join
- **Buyer-intent themes**: Practical automation adoption, not yet directly product-name-quoted in this session's samples
- **Products discussed**: UNKNOWN — not directly sampled with a real quote this session
- **Common pains**: UNKNOWN — not directly sampled
- **Seller/spam level**: UNKNOWN — not yet feed-sampled at all
- **Link risk**: UNKNOWN
- **Self-promotion rules**: UNKNOWN
- **What Miloosh can contribute**: To be determined after a real feed sample — premature to commit specifics
- **What Miloosh must not do**: Assume link-friendliness or spam level without a real sample first
- **5 example contribution scenarios**: Deferred — this group needs a real feed sample before scenario-planning is meaningful (flagged honestly rather than invented)

### 5. Helping Property Managers with AppFolio, Buildium, Propertyware, and more
- **Audience**: Property managers (7.5K, vendor-owned)
- **Why we care**: The single strongest buyer-intent quote evidence in the entire audit — real, named tool-usage disclosure
- **Buyer-intent themes**: Tool switching, AI-integration interest
- **Products discussed**: AppFolio, Buildium, Propertyware (all named directly)
- **Common pains**: Managing large unit counts, wanting AI integrations
- **Seller/spam level**: UNKNOWN precisely, but vendor-owned — treat neutrality claims with extra caution
- **Link risk**: UNKNOWN — not yet rules-checked
- **Self-promotion rules**: UNKNOWN
- **What Miloosh can contribute**: This is exactly the audience for the property-management content gap identified in section 9 — once built, factual AppFolio-vs-Buildium comparison data would be directly on-topic
- **What Miloosh must not do**: Post before Miloosh has real property-management content to reference, or before verifying this vendor-owned group's actual rules
- **5 example contribution scenarios**:
  1. Once AppFolio/Buildium pages exist, a factual answer to "AppFolio vs Buildium for X units" questions.
  2. A factual answer to unit-count-scaling questions if Miloosh's data supports it.
  3. Answering an AI-integration question with what's actually documented about each tool's AI features, not speculation.
  4. Never claiming property-management operating experience Miloosh doesn't have.
  5. Given vendor ownership, treat any admin-authored "best tool" claim with visible skepticism if referencing it.

### 6. IT & MSP Business Owners Group
- **Audience**: MSP/IT business owners (29.8K, private)
- **Why we care**: Highest score in the entire dataset (88) — richest real evidence of any group researched
- **Buyer-intent themes**: Vendor evaluation criteria (pricing scalability, support responsiveness, migration lock-in)
- **Products discussed**: RMM/PSA/ticketing tools generically named in the deep-audit draft; no single product directly quoted this session
- **Common pains**: Vendors that "go quiet after the sale," one-way migration paths
- **Seller/spam level**: LOW (based on prior deep-audit characterization)
- **Link risk**: UNKNOWN precisely but historically characterized as VALUE_ONLY
- **Self-promotion rules**: Not directly re-verified this session
- **What Miloosh can contribute**: Genuinely relevant IT/MSP tooling comparison content — **but see Phase 10**: Eyal cannot personally join this group without misrepresenting being an MSP owner, so any future participation would require a different vehicle (a Miloosh brand presence, or simply not participating and treating this purely as a research/listening source)
- **What Miloosh must not do**: Fabricate an MSP-owner identity to gain entry
- **5 example contribution scenarios**: Not applicable in the near term given the personal-access constraint — this group's CORE value is as a demand-research source, not a participation venue, until that constraint changes

### 7. IT Business Owners Group
- Same audience/constraint pattern as #6 at smaller scale (8K, private). Round 3 surfaced the single best named-tool buyer-intent evidence in the whole audit (Huntress vs. Microsoft-native tooling for tenant onboarding). Same personal-access caveat applies — CORE for research value, not participation, until Eyal's actual professional identity changes or a different vehicle is used.

### 8. GoHighLevel Users Funnels Automation & Hiring Support
- **Audience**: GoHighLevel users/agencies (89K per Round 1 note)
- **Why we care**: Largest single GHL-specific community; real evidence, not name-inferred
- **Buyer-intent themes**: GHL-vs-alternative/custom-build comparisons
- **Products discussed**: GoHighLevel
- **Common pains**: UNKNOWN precisely — not deep-quoted this session
- **Seller/spam level**: MEDIUM — Round 1 noted real freelancer/agency self-promotion dilution in replies (observed in the sister Highlevel official community)
- **Link risk**: UNKNOWN — not directly rules-checked this session
- **Self-promotion rules**: UNKNOWN
- **What Miloosh can contribute**: Now directly relevant — the new GoHighLevel profile and GoHighLevel-vs-HubSpot comparison are exactly on-topic
- **What Miloosh must not do**: Post before rules are verified; get pulled into the freelancer-self-promotion pattern already observed
- **5 example contribution scenarios**:
  1. A factual GHL-vs-HubSpot pricing/feature answer when directly asked.
  2. Clarifying GHL's actual pricing tiers when misremembered in a thread.
  3. Never offering "DM me" freelance-style responses — that's the exact dilution pattern to avoid replicating.
  4. Answering an "is GHL worth it vs building custom" question with the real trade-offs Miloosh's page documents.
  5. Not claiming to have run an agency on GHL — Miloosh's content is comparison research, not operator testimony.

### 9. Highlevel (GHL) official community
- Same ecosystem as #8 (34K per Round 1), explicitly the "best buyer-intent evidence found among the GHL communities, but replies show real freelancer-marketplace dilution." Same contribution posture as #8.

### 10. Zoho CRM Tips & Tricks
- **Audience**: Zoho CRM users (11.5K, public)
- **Why we care**: Genuinely low-spam, real support-question community — confirmed Round 3 (real question + real step-by-step community answer)
- **Buyer-intent themes**: Product-usage support, not switching
- **Products discussed**: Zoho CRM
- **Common pains**: Contact-grouping/mass-email workflows
- **Seller/spam level**: LOW
- **Link risk**: UNKNOWN — not directly rules-checked
- **Self-promotion rules**: UNKNOWN
- **What Miloosh can contribute**: Factual Zoho CRM feature/pricing answers Miloosh already has published
- **What Miloosh must not do**: Answer every support question — Miloosh isn't Zoho support and shouldn't pretend to be
- **5 example contribution scenarios**:
  1. If someone asks how Zoho CRM compares on price to HubSpot, share what Miloosh's published comparison actually says.
  2. If someone asks about Zoho's alternatives, reference the 5 real published comparisons.
  3. Never answer a Zoho-specific technical how-to question Miloosh doesn't actually have sourced — redirect to Zoho's own support instead.
  4. If someone asks about migrating away from Zoho, share the real trade-offs documented on Miloosh.
  5. Genuine appreciation comments on good community answers (no link) build presence without violating anything.

### 11. CPA & Accountant Business Owners (USA)
- **Audience**: CPAs, accountants (27.6K, public)
- **Why we care**: Real, active community; now content-matched by the new QuickBooks/Xero pages
- **Buyer-intent themes**: Practice-operations (Round 3's single sample was a hiring post, not software) — genuine buyer-intent evidence for *software* specifically is not yet captured
- **Products discussed**: UNKNOWN precisely from this session's sample
- **Common pains**: Hiring, staffing (from the one sampled post)
- **Seller/spam level**: LOW (based on the one real, non-spam post seen)
- **Link risk**: UNKNOWN
- **Self-promotion rules**: UNKNOWN
- **What Miloosh can contribute**: The new QuickBooks-vs-Xero comparison, if and when a genuine software-selection thread appears — not yet confirmed this happens often here
- **What Miloosh must not do**: Overstate how often software-buying questions actually appear here based on a single, non-software sample
- **5 example contribution scenarios**:
  1. If a genuine "QuickBooks vs Xero for my practice" thread appears, share the real comparison.
  2. If a client-software-recommendation question appears, answer factually.
  3. Do not proactively start a software-comparison thread unprompted — the one real sample here was about hiring, not tools.
  4. If pricing-change complaints appear, cross-check against Miloosh's own `last_verified` data before commenting.
  5. Build presence through genuine, on-topic replies before ever considering a first post.

### 12. Xero Users Support Community
- **Audience**: Xero users (37.1K, private)
- **Why we care**: Real, explicit anti-self-promotion rules confirmed ("No self promotion (this isn't a sales channel)"), genuinely high activity (155 posts/month, +63 members/week) — the strongest rules-verified evidence among the blocked/private groups
- **Buyer-intent themes**: UNKNOWN precisely — feed itself was inaccessible without joining
- **Products discussed**: Xero (by definition of the group)
- **Common pains**: UNKNOWN
- **Seller/spam level**: Likely LOW given the explicit, enforced no-self-promo rule
- **Link risk**: HIGH for anything self-promotional — rule is explicit and enforced
- **Self-promotion rules**: **VERIFIED** — "give more than you take... self-promotion will be removed, and repeated links to your own content or promoting other groups without permission of the admins will lead to your removal"
- **What Miloosh can contribute**: Genuinely useful, non-promotional Xero pricing/feature/comparison answers when directly on-topic — this is the kind of group where "give more than you take" content (no link) could work well
- **What Miloosh must not do**: Post any link without prior admin permission — the rule is explicit, not assumed
- **5 example contribution scenarios**:
  1. If someone asks how Xero's pricing compares to QuickBooks, share the real numbers as text, no link, unless admin permission is separately obtained.
  2. If someone asks about a Xero feature Miloosh has documented, answer factually.
  3. Never mention Miloosh by name unprompted — "give more than you take" framing suggests value-first, identity-second.
  4. If a pricing-change discussion appears, cross-check against Miloosh's `last_verified: 2026-08-18` data.
  5. Ask admins directly whether a link to a neutral comparison would be welcome, rather than testing the rule by posting one.

---

## Phase 8 — Content → community matrix

| Miloosh Page | Relevant Facebook Groups | Audience | Problem Solved | When Naturally Referenced | Link Risk | Affiliate Opportunity |
|---|---|---|---|---|---|---|
| `/software/gohighlevel` | GoHighLevel Users Funnels Automation & Hiring Support, Highlevel (GHL) official community | Agencies, GHL operators | "What does GHL actually cost / include?" | When pricing or feature questions appear | UNKNOWN (not rules-checked) | UNKNOWN |
| `/compare/gohighlevel-vs-hubspot` | Same two + SaaS Marketing Group, SaaS Founders Club | Agencies choosing between all-in-one vs. single-purpose CRM | "GHL vs HubSpot, which one" | Direct comparison questions | UNKNOWN / UNKNOWN | HubSpot ACTIVE-researched, GHL UNKNOWN |
| `/software/quickbooks-online`, `/software/xero`, `/compare/quickbooks-online-vs-xero` | CPA & Accountant Business Owners (USA), Xero Users Support Community | Accountants, small-business owners | "QuickBooks vs Xero, which for my business" | Direct software-selection questions | Xero: HIGH (explicit no-promo rule); QuickBooks: UNKNOWN | Both UNKNOWN |
| `/software/zoho-crm` + its 5 comparisons | Zoho CRM Tips & Tricks, GoHighLevel clusters (as an alternative) | Zoho CRM users and CRM shoppers | Usage support + comparison shopping | Both usage questions and switching questions | UNKNOWN | Zoho ACTIVE-researched |
| `/software/pipedrive` + its comparisons | GoHighLevel clusters (implied alternative) | Sales teams | "Simple CRM vs all-in-one" | Comparison questions | UNKNOWN | Pipedrive PENDING_REVIEW |

**Multi-community assets** (one Miloosh page serving several groups —
highlighted per the instruction):
- **`/compare/gohighlevel-vs-hubspot`** serves both GHL-specific communities
  AND the general SaaS-founder communities (SaaS Marketing Group, SaaS
  Founders Club) whenever a member is choosing a CRM platform generally —
  the single highest-leverage multi-community asset built this turn.
- **`/software/zoho-crm`'s comparison set** (5 pages) already serves Zoho CRM
  Tips & Tricks directly and any GHL/CRM-shopping community indirectly as an
  alternative reference point.
- **`/compare/quickbooks-online-vs-xero`** serves both accounting-specific
  communities (CPA group, Xero group) and, plausibly, any small-business
  general group where "what accounting software should I use" comes up —
  genuinely repeated across verticals (SaaS founders need books too).

---

## Phase 9 — TOP 10 listening communities

Communities better used to detect trends than to promote in — never treated
as promotional opportunities:

1. **SAAS Product Marketing / SaaS Sales & Marketing** — confirmed
   duplicate-audience network (identical cross-posted vendor ad found in
   both); watch for what vendors are pitching as a signal of what's
   competitive, not a place to post
2. **Software Marketplace - Cloud Based Software Buy Sell** — explicit
   vendor marketplace; watch what's being listed/sold as a market signal
3. **Software Requirements & Startups** — confirmed vendor-post venue (a
   hotel-management SaaS ad was the sampled post); same pattern
4. **CRM systems** — downgraded this turn after its vendor-ad-dominated
   sample; still useful to watch for what CRM vendors are marketing
5. **AI Automations For Business** — 78.6K members but confirmed nearly
   dormant (1 post/day); watch occasional real content, don't rely on it
6. **Businesses looking for Accountant, CPA, Bookkeeping, Tax Prep** — real
   demand-side signal, but for accounting *services* not *software*; useful
   to watch for spillover software mentions
7. **IT & MSP Business Owners Group** — CORE-grade evidence quality, but the
   personal-access constraint (Phase 10) means its practical role for now is
   as a listening/research source, not participation
8. **IT Business Owners Group** — same constraint, smaller scale
9. **HVAC Business Owners & Contractors** — real, large (96K), but Miloosh
   has no matching content yet; watch for direct product-name mentions to
   justify a future field-service content build
10. **Property Management Professionals Unite** — large (56K) but its
    sampled post was a vendor ad, unlike the smaller, higher-quality
    "Helping Property Managers" group; watch it as a scale signal while
    treating the smaller group as the real participation candidate

---

## Phase 10 — Privacy / personal-account exposure classification

| Group | Classification | Reasoning |
|---|---|---|
| SaaS Marketing Group | SAFE ENOUGH TO CONSIDER | Already a member, no misrepresentation required, real value confirmed |
| SaaS Founders Club | SAFE ENOUGH TO CONSIDER | Same |
| Claude AI Builds That Actually Make You Money | SAFE ENOUGH TO CONSIDER | Already a member, most deeply verified group in the audit, no identity mismatch |
| AI \| AI Prompts & Automation for Business | SAFE ENOUGH TO CONSIDER | Already a member, clean join, no gating questions |
| Helping Property Managers with AppFolio, Buildium | PRIVACY COST — JOIN ONLY IF HIGH VALUE | Not yet joined; real high value, but vendor-owned — worth the cost once Miloosh has property-management content to justify presence |
| **IT & MSP Business Owners Group** | **NOT WORTH PERSONAL MEMBERSHIP** | Eyal is not an MSP owner; entry/posting questions would require misrepresenting that. This is the standing decision from the earlier CORE portfolio phase, reaffirmed here — the group's CORE status reflects content-research value, not a recommendation to join |
| **IT Business Owners Group** | **NOT WORTH PERSONAL MEMBERSHIP** | Same reasoning, smaller scale |
| GoHighLevel Users Funnels Automation & Hiring Support | PRIVACY COST — JOIN ONLY IF HIGH VALUE | Real dilution risk (freelancer self-promotion observed) but genuinely on-topic now; worth it once rules are verified |
| Highlevel (GHL) official community | PRIVACY COST — JOIN ONLY IF HIGH VALUE | Same |
| Zoho CRM Tips & Tricks | SAFE ENOUGH TO CONSIDER | Low spam, no identity mismatch, genuinely on-topic |
| CPA & Accountant Business Owners (USA) | UNKNOWN | Not yet rules-checked; Eyal has no accounting-professional identity to misrepresent, but whether entry questions demand one is unverified |
| Xero Users Support Community | PRIVACY COST — JOIN ONLY IF HIGH VALUE | Private, would require a real join decision; explicit strong no-self-promo rules make it a genuinely useful "give more than you take" venue if joined |
| AI & Automation for US-based Business Owners | NOT WORTH FURTHER POSTING | Already a member (OBSERVE_ONLY); geo-mismatch means posting rights should never be unlocked, regardless of content value |
| HVAC Business Owners & Contractors, Construction Business Owners Group | NOT WORTH PERSONAL MEMBERSHIP (for now) | No matching Miloosh content exists yet to justify the exposure; revisit only if a field-service content build happens |
| Digital Dentist, Law Firm Owners and Managers | NOT WORTH PERSONAL MEMBERSHIP (for now) | Evidence too thin, no matching content, no clear value to justify exposure |

---

*Strictly research-and-content-only this turn: no groups were joined, no
membership requests submitted, no posts/comments/reactions/messages/follows
made. New Miloosh content was built, tested locally, and committed — **not
deployed**, per instruction.*
