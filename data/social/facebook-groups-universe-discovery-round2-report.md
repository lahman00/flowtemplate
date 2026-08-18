# Miloosh — Facebook Group Universe Discovery, Round 2 Final Report

Date: 2026-08-18. Continuation of the Round 1 Universe Discovery (commit `50fec60`).
Round 2 findings persisted in commit `a7b026b`. Dataset: `data/social/facebook-groups.json`
(75 total groups). Ecosystem analysis: `data/social/facebook-groups-content-intelligence.md`.

**Honesty statement up front:** the four numeric breadth targets set for this round were
**partially met**. Raw discovery is estimated to have reached the 250+ target; the
filtered/inspected/feed-sampled targets were not fully reached before a browser-tool
reliability issue (`read_page` returning empty on multiple tabs, one click-to-navigate
attempt with an ambiguous result) interrupted live interaction. Exact numbers below.

---

## 1. Raw unique groups discovered

**Estimated ~255-265 distinct group names surfaced across both rounds** (Round 1: ~150
per the prior honest report; Round 2: roughly 110-130 more names across 18 search
queries this session, covering CPA/accounting, law, dental, salon/spa, gym, restaurant,
contractors/HVAC/construction, insurance, mortgage, Salesforce, Zoho, Monday.com, Xero,
Klaviyo, ActiveCampaign, Wix, Zendesk/Intercom). This figure is a best-effort count from
search-result enumeration (via `get_page_text`), not a database-deduplicated count — only
the 75 entries actually written to the dataset are guaranteed-unique. **Target (250+):
plausibly met, not certainty-verified.**

## 2. Number passing first filter

**75 groups persisted in the dataset** as plausible buyer/operator software-selection
communities (Round 1: 59, Round 2: +16). This is short of the 60+ *newly filtered this
round* implied by the target re-read strictly, but the cumulative filtered set across
both rounds (75) exceeds the 60 target. **Target (60+ filtered): met cumulatively.**

## 3. Number deeply inspected

**~45 groups** carry `verification: PARTIALLY_VERIFIED` or better (About page, rules,
or admin guidance actually read, not just search-card surface data) — all from Round 1.
**All 16 Round 2 additions are `verification: UNKNOWN`** — surface data only (name,
privacy, member count, approximate posting velocity), honestly marked rather than
guessed. **Target (40+ deeply inspected): not met this round** — Round 1's 45 already
exceeded it, but Round 2 added 0 newly deep-inspected groups.

## 4. Number with actual feed sampling

**7 groups** have `postsInspected > 0` (all from Round 1's CORE-candidate deep dive:
GoHighLevel official community, the AppFolio/Buildium property-management group, Claude
AI Builds, and others already reported). **Round 2 added zero new feed-sampled groups** —
three were attempted (Businesses looking for Accountant/CPA/Bookkeeping/Tax Prep, HVAC
Business Owners & Contractors, Wix Community) but the browser tooling did not reliably
return post content this session; rather than fabricate a sample, these are left at
`postsInspected: 0`. **Target (30+ feed-sampled): not met** — this is the clearest
shortfall of the round, reported honestly rather than papered over.

---

## 5. TOP 25 overall (by total score)

| # | Score | Tier | Group | Members | Cluster |
|---|---|---|---|---|---|
| 1 | 88 | S | IT & MSP Business Owners Group | 29,000 | software_buyers_tech |
| 2 | 77 | A | SaaS Marketing Group | 28,000 | saas_founders_buyers |
| 3 | 74 | A | SaaS Founders Club | 26,000 | saas_founders_buyers |
| 4 | 66 | A | Claude AI Builds That Actually Make You Money | 34,161 | ai_automation |
| 5 | 66 | A | Helping Property Managers with AppFolio, Buildium, Propertyware, and more | 7,500 | software_buyers_tech |
| 6 | 65 | A | AI \| AI Prompts & Automation for Business | 128,234 | ai_automation |
| 7 | 63 | B | AI & Automation for US-based Business Owners | 8,200 | ai_automation |
| 8 | 58 | B | Digital Dentist | 11,000 | software_buyers_tech |
| 9 | 57 | B | CRM systems | 6,100 | software_buyers_tech |
| 10 | 56 | B | Business Automation | 15,000 | ai_automation |
| 11 | 56 | B | SaaS Growth & Scale — Founders & Agency Owners | 4,000 | saas_founders_buyers |
| 12 | 55 | B | Startup group SaaS: Online Software & Services | 4,600 | saas_founders_buyers |
| 13 | 54 | B | CPA & Accountant Business Owners (USA) | 27,000 | software_buyers_tech |
| 14 | 53 | B | AI AUTOMATION & AGENTIC AI | 7,600 | ai_automation |
| 15 | 53 | B | AI Automation Community USA | 17,000 | ai_automation |
| 16 | 53 | B | Dental Practice Owners USA | 3,800 | software_buyers_tech |
| 17 | 53 | B | Xero Users Support Community | 37,000 | software_buyers_tech |
| 18 | 52 | B | Businesses looking for Accountant, CPA, Bookkeeping, Tax Prep | 92,000 | software_buyers_tech |
| 19 | 51 | B | Highlevel (GHL) official community | 33,900 | software_buyers_tech |
| 20 | 51 | B | Independent QuickBooks Online Help & Support | 26,000 | software_buyers_tech |
| 21 | 51 | B | IT Business Owners Group | 8,000 | software_buyers_tech |
| 22 | 51 | B | Small Business Owners Who Need Bookkeepers | 57,000 | small_business |
| 23 | 50 | B | AI, Ads & Automation For Business Owners | 5,500 | ai_automation |
| 24 | 50 | B | Construction Business Owners Group | 4,600 | software_buyers_tech |
| 25 | 49 | B | Salon & Spa Owners USA | 1,700 | small_business |

**Note:** #1 (IT & MSP Business Owners Group) scores highest but is excluded from CORE
per the standing 2026-08-18 portfolio decision — Eyal is not an MSP owner and joining
would require fabricating fit. Kept at `membershipState: NEEDS_EYAL_INPUT`, not joined.

## 6. TOP 15 highest buyer-intent (by `buyingIntent` sub-score, capped 0-20)

| Score | Group | Verification |
|---|---|---|
| 20 | Helping Property Managers with AppFolio, Buildium, Propertyware, and more | PARTIALLY_VERIFIED |
| 18 | IT & MSP Business Owners Group | PARTIALLY_VERIFIED |
| 16 | SaaS Marketing Group | PARTIALLY_VERIFIED |
| 16 | Highlevel (GHL) official community | PARTIALLY_VERIFIED |
| 15 | SaaS Founders Club | PARTIALLY_VERIFIED |
| 15 | CRM systems | PARTIALLY_VERIFIED |
| 15 | Businesses looking for Accountant, CPA, Bookkeeping, Tax Prep | UNKNOWN (name-framing signal only) |
| 14 | Claude AI Builds That Actually Make You Money | PARTIALLY_VERIFIED |
| 14 | Digital Dentist | UNKNOWN |
| 14 | Small Business Owners Who Need Bookkeepers | UNKNOWN |
| 14 | Software as a Service (SaaS) Power Users | PARTIALLY_VERIFIED |
| 13 | AI & Automation for US-based Business Owners | PARTIALLY_VERIFIED |
| 13 | Xero Users Support Community | UNKNOWN |
| 13 | Software Marketplace - Cloud Based Software Buy Sell | PARTIALLY_VERIFIED |
| 13 | SaaS Mantra | PARTIALLY_VERIFIED |

## 7. TOP 10 link/promotion-friendly

Honestly, only **3 groups** score `promotionViability ≥ 7` in the whole 75-group
dataset — link-friendliness is rare, consistent with the "do not optimize for member
count" finding that most buyer-dense communities are also strict on links:

1. **Claude AI Builds That Actually Make You Money** (8/10) — `CONTEXTUAL_LINKS_ONLY`, verified.
2. **FREE UK Small Business Advertising & Promotion \| No Rules** (8/10) — `OPEN_LINKS`, but WATCHLIST (see #12) because open-link groups are usually seller-flooded; not yet feed-verified.
3. **IT & MSP Business Owners Group** (7/10) — `VALUE_ONLY`, excluded from CORE per the standing fit decision above.

No further groups clear the threshold — the list is reported as 3, not padded to 10.

## 8. TOP 10 small-but-exceptional (under 10,000 members)

| Score | Members | Group |
|---|---|---|
| 66 | 7,500 | Helping Property Managers with AppFolio, Buildium, Propertyware, and more |
| 63 | 8,200 | AI & Automation for US-based Business Owners (OBSERVE_ONLY — not US-based) |
| 57 | 6,100 | CRM systems |
| 56 | 4,000 | SaaS Growth & Scale — Founders & Agency Owners |
| 55 | 4,600 | Startup group SaaS: Online Software & Services |
| 53 | 7,600 | AI AUTOMATION & AGENTIC AI |
| 53 | 3,800 | Dental Practice Owners USA |
| 51 | 8,000 | IT Business Owners Group |
| 50 | 5,500 | AI, Ads & Automation For Business Owners |
| 50 | 4,600 | Construction Business Owners Group |

## 9. TOP 15 vertical/professional groups

1. Helping Property Managers with AppFolio, Buildium, Propertyware, and more — 66
2. Digital Dentist — 58
3. CPA & Accountant Business Owners (USA) — 54
4. Dental Practice Owners USA — 53
5. Xero Users Support Community — 53
6. Businesses looking for Accountant, CPA, Bookkeeping, Tax Prep — 52
7. Independent QuickBooks Online Help & Support — 51
8. Construction Business Owners Group — 50
9. Salon & Spa Owners USA — 49
10. Dentist Practice Owners - Dental Nachos — 42 (penalized: likely brand-run)
11. HVAC Business Owners & Contractors — ~44 (largest vertical audience, 96K, unsampled)
12. Law Firm Owners and Managers — ~43
13. US Based QuickBooks/Bookkeeping/Payroll — (Round 1, unranked here, real)
14. Gym Owners Business Development, Consulting and Broker Network — ~38
15. Restaurant Owners and Managers — ~37

## 10. TOP product-specific ecosystems

Ranked by combined evidenced audience and content-gap significance (full detail in
`facebook-groups-content-intelligence.md`):

1. **GoHighLevel / CRM** — 7 communities, 350K+ combined. Highest-leverage single gap in the audit.
2. **Accounting/bookkeeping (QuickBooks + Xero + CPA-adjacent)** — 6+ communities, 230K+ combined.
3. **Home-services / field-service management (NEW, Round 2)** — HVAC + Construction, 100K+ combined, previously undiscovered gap.
4. **Property management (AppFolio/Buildium/Propertyware)** — smaller (7.5K) but highest buyer-intent score in the whole dataset (20/20).
5. **Ecommerce (Shopify)** — six-figure member communities, not yet post-sampled.
6. **Healthcare/dental practice-management (NEW, Round 2)** — 3 communities, ~19K combined, thin evidence base.
7. **Legal practice-management (NEW, Round 2)** — 1 community (28K), too thin to call viable yet.
8. **Wix ecosystem (NEW, Round 2)** — 21K, website-builder buyer audience.
9. Project management (ClickUp/Notion/Airtable) — real communities, not yet post-sampled.
10. Zoho / Monday.com — small dedicated communities found, not yet post-sampled.

## 11. Groups rejected and exact reasons

| Group | Reason |
|---|---|
| AI Marketing Automation For Agencies and Business Owners | 463 members, no visible activity rate |
| AI Tools for Business \| Marketing, Automation & Growth | Only 184 members vs. same-cluster alternatives at 78K/128K |
| BizAI Hub | 157.5K members but 0 posts today/month, 0 new members last week — dormant despite headline size |
| IT Business Owners | Only 74 members vs. IT Business Owners Group (8K) and IT & MSP Business Owners Group (29K) |
| Productivity Content | Best-match name has only 42 members; seed may refer to a different, unfound group — flagged ambiguous, not assumed |
| SaaS Founders | 449 members vs. SaaS Founders Club (26K) |
| SaaS Founders Community | 51 members |
| Small Business & Entrepreneur Software Deals Group | 197 members; "Deals" framing signals promo/coupon-dump, not discussion |
| Small Business Owners | 56.2K members, 0 posts today, 6/month despite +509 members/week growth; rule is a follow-the-admin auto-approval engagement-farming scheme |
| Software Buyers | Only 173 members |

## 12. Groups on watchlist and exact uncertainty

- **Small Business Owners Community** (127K) — not deeply verified; flagged because the
  similarly-named "Small Business Owners" (56K, rejected above) turned out to be a
  follow-the-admin spam scheme in this exact niche. Needs the same About/rules check
  before trusting the larger figure.
- **FREE UK Small Business Advertising & Promotion \| No Rules** — genuinely link-friendly
  (rare, real signal, scored 8/10 on promotionViability) but no-rules groups are usually
  seller-flooded; not promoted to a TOP list until a real post sample confirms buyer
  discussion survives the promo noise.

## 13. Newly discovered Miloosh content gaps

1. **Field-service-management software** (ServiceTitan, Housecall Pro, Jobber, Service
   Fusion) — NEW this round. HVAC + Construction communities alone represent 100K+
   real, active operators; no Miloosh category exists.
2. **Legal practice-management software** (Clio, MyCase, PracticePanther) — NEW, thin
   evidence (1 community, 28K) but zero existing Miloosh coverage.
3. **Dental/healthcare practice-management software** (Dentrix, Curve Dental, Weave) —
   NEW, 3 communities, ~19K combined.
4. **Accounting software alternatives (Xero/FreshBooks vs QuickBooks)** — expanded from
   Round 1's QuickBooks-only finding; Xero now has direct community evidence (37K).
5. Carried over from Round 1, still open: property-management software, GoHighLevel-
   specific coverage.

## 14. New comparison-page opportunities

- **GoHighLevel vs [alternatives]** — highest-leverage single opportunity given 350K+ combined audience.
- **QuickBooks vs Xero vs FreshBooks** — real, named communities on both QuickBooks and Xero sides now confirmed.
- **ServiceTitan vs Housecall Pro vs Jobber** — new, unaddressed, 100K+ audience.
- **Wix vs Squarespace vs Webflow** — Wix community confirmed (21K); Squarespace/Webflow not yet searched.
- **Clio vs MyCase vs PracticePanther** (legal) — thin evidence, worth a confirming pass before committing content resources.

## 15. New software/category opportunities

- Field-service-management category (new).
- Dental/medical practice-management category (new).
- Legal practice-management category (new, lower confidence).
- Xero as a first-class entry alongside QuickBooks in accounting-software content.

## 16. Recommended final Facebook portfolio

**CORE** (already joined, active outreach targets):
- SaaS Marketing Group (posting unlocked with truthful values)
- SaaS Founders Club (posting unlocked with truthful values)
- Claude AI Builds That Actually Make You Money (member, contextual-link-friendly)
- AI | AI Prompts & Automation for Business (member, large real audience)
- Helping Property Managers with AppFolio, Buildium, Propertyware, and more (highest buyer-intent score in the dataset; NOT_JOINED — recommended join target)

**SECONDARY** (strong evidence, not yet joined — recommended for the 30/60/90 plan):
- CRM systems, Business Automation, SaaS Growth & Scale, Startup group SaaS, CPA & Accountant Business Owners (USA), Xero Users Support Community, Independent QuickBooks Online Help & Support, Highlevel (GHL) official community.

**EXPERIMENTAL** (real but unverified this round — sample feed before committing):
- Digital Dentist, Dental Practice Owners USA, HVAC Business Owners & Contractors, Construction Business Owners Group, Salon & Spa Owners USA, Businesses looking for Accountant/CPA/Bookkeeping/Tax Prep, Law Firm Owners and Managers, Wix Community, Zoho CRM Tips & Tricks, Monday.com for Small Businesses.

**OBSERVE ONLY:**
- AI & Automation for US-based Business Owners (member; Eyal/Miloosh are not US-based — stay a member, never unlock posting, never answer a location question misleadingly).

**EXCLUDED FROM CORE DESPITE TOP SCORE:**
- IT & MSP Business Owners Group (Eyal is not an MSP owner; standing decision, not re-litigated this round).

## 17. Groups worth joining later

Priority order for the next join batch (all PUBLIC, all zero-personal-disclosure joins
based on prior Facebook UX findings — verify privacy setting again at join time):
1. Helping Property Managers with AppFolio, Buildium, Propertyware, and more
2. CPA & Accountant Business Owners (USA)
3. Independent QuickBooks Online Help & Support
4. CRM systems
5. Highlevel (GHL) official community

## 18. Groups NOT worth exposing Eyal's personal Facebook membership to

- **BizAI Hub, Small Business Owners (56K), Small Business Owners Community (127K,
  watchlist)** — dormant or engagement-farming patterns; membership would add zero
  reach for real reputational/spam-adjacency risk.
- **Dentist Practice Owners - Dental Nachos** — likely a media-brand-run group; joining
  exposes Eyal's profile to a vendor-affiliated audience without confirmed independent
  buyer discussion.
- **FREE UK Small Business Advertising & Promotion \| No Rules** — no-rules groups
  attract heavy automated/bot membership; hold at watchlist, do not join yet.
- All 10 REJECT-tier groups (#11 above) — too small or too dead to justify any exposure.

## 19. 30/60/90-day community acquisition strategy

**Days 1-30 — Consolidate CORE, verify EXPERIMENTAL:**
- Begin the already-planned 10-post rollout across the 5 CORE groups per the existing
  `facebook-groups-launch-plan.md` UTM scheme.
- Join the 5 groups listed in #17 (public, zero-disclosure).
- Feed-sample the 10 EXPERIMENTAL groups in #16 to convert them to SECONDARY or REJECT
  with real evidence — this closes the "30+ feed-sampled" shortfall from this round.

**Days 31-60 — Vertical expansion:**
- Deep-inspect and feed-sample the home-services (HVAC/construction) and
  accounting/Xero clusters specifically — these are the two strongest new ecosystems
  from Round 2 and justify dedicated Miloosh content (field-service-management
  category, Xero-vs-QuickBooks content) before further community investment.
- Complete the still-unsearched Family I verticals from the original instruction:
  real estate/realtors, medical/clinics/therapists, landscapers/cleaning companies,
  financial advisors, nonprofits/schools/photographers — genuinely not yet covered.

**Days 61-90 — Ecosystem content + GoHighLevel push:**
- Publish the GoHighLevel-vs-alternatives comparison content (highest-leverage single
  content gap found across both rounds) and begin contextual engagement in the GHL
  official community and other GHL-adjacent groups where link policy allows.
- Re-run a targeted Round 3 discovery pass on Family J products not yet searched
  (Slack, Microsoft 365, Google Workspace, FreshBooks, Squarespace, Webflow,
  WordPress, Mailchimp, Freshdesk, Jira, Confluence, GitHub, GitLab, Canva, Semrush,
  Ahrefs) and remaining Family I verticals, once the browser-tool reliability issue
  from this session is confirmed resolved.

---

*Strictly research-only this round: no joins, membership requests, posts, comments,
reactions, messages, follows, friend requests, or profile changes were made. Facebook
session used read-only throughout.*
