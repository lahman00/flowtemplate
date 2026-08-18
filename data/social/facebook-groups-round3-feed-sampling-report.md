# Miloosh — Facebook Groups Round 3: Feed-Sampling Report

Date: 2026-08-18. Baseline: commit `50fec60` (Round 1), `a7b026b`/`60db3ad` (Round 2),
this round persisted in `85c431d`. Sole purpose per the owner's instruction: close the
feed-sampling gap — the prior round had only 7 of 75 groups with genuine feed content
inspected, against a 30-group target.

**No new discovery was performed.** No groups were joined, no membership requests
submitted, no posts/comments/reactions/messages/follows made. Read-only throughout.

---

## 1. Additional groups successfully feed-sampled this round

**25 groups** — every one backed by a real, on-screen post (screenshot evidence),
never a search-result snippet or an inferred value. Full list with real, paraphrased
post content, engagement numbers, and per-group findings is in the commit `85c431d`
diff (`data/social/facebook-groups.json`, `notes` field per group, each entry
timestamped "ROUND 3 FEED SAMPLE 2026-08-18").

## 2. Cumulative feed-sampled total

**32 of 75 groups** now have `postsInspected > 0` (7 from Round 1 + 25 new this round).
Verified programmatically against the persisted dataset, not estimated.

## 3. Whether the ≥30 requirement is now genuinely met

**Yes — 32 ≥ 30.** Met with real evidence, not by lowering the bar: every sampled
group has an actual visible post described from direct observation, and 8 further
attempts that hit genuinely inaccessible private feeds were marked
`FEED_SAMPLE_BLOCKED` and excluded from the count rather than padded in.

## 4. Groups whose score increased after feed evidence

| Group | Change | Why |
|---|---|---|
| Zoho CRM Tips & Tricks | 45 → 49 (+4) | Real user support question with a genuine helpful reply — low spam, real product-usage discussion. |
| IT Business Owners Group | 51 → 55 (+4) | 3 highlighted posts visible incl. a genuine named-tool (Huntress) buyer/operator discussion — real buyer-intent signal. |
| HVAC Business Owners & Contractors | 48 → 50 (+2) | Real peer-to-peer technical post, 11 comments, 9 reactions — confirms genuine engagement quality. |
| AI Automations For Business | — (+1 engagement) | Real educational post with a genuine user correction comment — real interaction, not just admin broadcast. |
| SaaS Marketing Group | 77 → 78 (+1) | Real technical build-in-public post confirms this CORE group's engagement quality. |

## 5. Groups whose score decreased after feed evidence

| Group | Change | Why |
|---|---|---|
| CRM systems | 57 → 51 (−6) | Top visible post is an "AI content"-labeled vendor ad (Fovty Solutions), not user discussion — contradicts the name-based assumption of genuine CRM discussion. |
| SaaS Growth & Scale — Founders & Agency Owners | 56 → 54 (−2) | Top visible post is a vendor presales-tool ad, not buyer discussion. |
| AI AUTOMATION & AGENTIC AI | 53 → 50 (−3) | Top visible post is an "AI content"-labeled automated lead-gen giveaway, not peer discussion. |
| SAAS Product Marketing & SaaS Sales & Marketing | 46 → 44 each (−2 each) | Both show the *identical* cross-posted vendor ad — real evidence of shared/duplicate-audience management, not two independent communities. |
| Property Management Professionals Unite | (new entry, scored down at persistence) | Top visible post is a cleaning-company vendor ad. |
| Construction Business Owners Group | 50 → 47 (−3 via penalty) | Top visible post is a third-party app-download promo. |
| AI for Small Business Owners – Automations, Marketing & Growth | 48 → 47 (−1) | Top visible post is a consultant's self-promotional funnel disguised as free advice. |
| Software Requirements & Startups | 42 → 40 (−2) | Top visible post is a vendor SaaS product ad (hotel-management software) — confirms the group is a vendor-post venue, not a startup buyer-discussion space. |
| Productivity and Workflow Growth | 36 → 35 (−1) | Top visible post is generic motivational filler, unrelated to productivity tooling despite the name. |

## 6. Groups rejected specifically because feed quality was poor

None were moved to REJECT tier this round — all sampled groups had real (if sometimes
low-quality) content, and score adjustments captured the quality difference without
requiring outright rejection. The closest cases (CRM systems, Software Requirements &
Startups) were downgraded but kept at B tier pending a second post sample, since a
single-post view is not enough evidence to reject a group outright.

## 7. Strongest buyer-intent examples by ecosystem

- **IT/MSP tooling**: IT Business Owners Group — a member directly comparing Huntress
  (ITDR product) against Microsoft-native tooling for tenant onboarding friction. The
  single strongest real buyer-intent example found this round.
- **CRM (Zoho)**: a genuine "how do I do X in Zoho CRM" support question with a
  step-by-step community answer — real product-usage depth, not switching/comparison
  intent, but confirms an engaged, non-spam user base.
- **Home services (HVAC)**: peer-to-peer technical troubleshooting (furnace rewiring)
  with real engagement — operational, not software-buying, but confirms a live,
  non-dormant community worth a deeper future sample.
- **SaaS/founder (CORE groups)**: a genuine build-in-public technical post in SaaS
  Marketing Group (AI Readiness Scanner tool, Claude Code usage) — the kind of
  organic, technically substantive content Miloosh's own drafts should sit alongside.

## 8. Updated TOP 25 overall

| # | Score | Tier | Group | Sampled |
|---|---|---|---|---|
| 1 | 88 | S | IT & MSP Business Owners Group | — |
| 2 | 78 | A | SaaS Marketing Group | ✓ |
| 3 | 74 | A | SaaS Founders Club | ✓ |
| 4 | 66 | A | Claude AI Builds That Actually Make You Money | ✓ (Round 1) |
| 5 | 66 | A | Helping Property Managers with AppFolio, Buildium, Propertyware, and more | ✓ |
| 6 | 65 | A | AI \| AI Prompts & Automation for Business | ✓ (Round 1) |
| 7 | 63 | B | AI & Automation for US-based Business Owners | ✓ |
| 8 | 58 | B | Digital Dentist | blocked |
| 9 | 56 | B | Business Automation | blocked |
| 10 | 55 | B | IT Business Owners Group | ✓ |
| 11 | 55 | B | Startup group SaaS: Online Software & Services | ✓ |
| 12 | 54 | B | CPA & Accountant Business Owners (USA) | ✓ |
| 13 | 54 | B | SaaS Growth & Scale — Founders & Agency Owners | ✓ |
| 14 | 53 | B | AI Automation Community USA | blocked |
| 15 | 53 | B | Dental Practice Owners USA | — |
| 16 | 53 | B | Xero Users Support Community | blocked |
| 17 | 52 | B | Businesses looking for Accountant, CPA, Bookkeeping, Tax Prep | — |
| 18 | 51 | B | Highlevel (GHL) official community | ✓ (Round 1) |
| 19 | 51 | B | Independent QuickBooks Online Help & Support | — |
| 20 | 51 | B | Small Business Owners Who Need Bookkeepers | — |
| 21 | 51 | B | CRM systems | ✓ |
| 22 | 50 | B | AI, Ads & Automation For Business Owners | blocked |
| 23 | 50 | B | AI AUTOMATION & AGENTIC AI | ✓ |
| 24 | 50 | B | HVAC Business Owners & Contractors | ✓ |
| 25 | 49 | B | Salon & Spa Owners USA | — |

## 9. Updated TOP 15 buyer-intent

Unchanged from Round 2 except **IT Business Owners Group now genuinely confirmed**
(the Huntress/Microsoft post is real, direct, named-tool buyer/operator discussion —
the single best piece of buyer-intent evidence surfaced in any round of this audit).
All other Round 2 buyer-intent rankings stand; feed sampling this round targeted
breadth (closing the count gap) over exhaustively re-verifying every buyer-intent
sub-score.

## 10. Updated TOP 10 small-but-exceptional

| Score | Members | Group |
|---|---|---|
| 66 | 7,500 | Helping Property Managers with AppFolio, Buildium, Propertyware, and more |
| 63 | 8,200 | AI & Automation for US-based Business Owners |
| 55 | 8,000 | IT Business Owners Group |
| 55 | 4,600 | Startup group SaaS: Online Software & Services |
| 54 | 4,000 | SaaS Growth & Scale — Founders & Agency Owners |
| 53 | 3,800 | Dental Practice Owners USA |
| 50 | 5,500 | AI, Ads & Automation For Business Owners |
| 50 | 7,600 | AI AUTOMATION & AGENTIC AI |
| 49 | 1,700 | Salon & Spa Owners USA |
| 49 | 2,800 | Small Business AI and Automations |

## 11. Updated CORE / SECONDARY / EXPERIMENTAL / OBSERVE ONLY portfolio

No changes to the portfolio tier assignments from the Round 2 report — this round's
purpose was verification, not re-decisioning. The three CORE groups sampled this round
(SaaS Marketing Group, SaaS Founders Club, AI & Automation for US-based Business
Owners) all showed real, non-spam content, **confirming** rather than changing their
CORE/OBSERVE_ONLY status. See `facebook-groups-universe-discovery-round2-report.md`
section 16 for the full portfolio, still current.

## 12. Newly discovered Miloosh content/comparison opportunities caused specifically by feed evidence

- **Group-network duplication as a targeting lesson**: SAAS Product Marketing and
  SaaS Sales & Marketing showing identical cross-posted content is new evidence that
  some "distinct" groups in the AI/SaaS-founder cluster may share admin/audience
  overlap — worth deduping expectations (not URLs, which remain genuinely distinct)
  when planning distribution reach in this cluster.
- **IT/MSP tooling comparison content**: the Huntress-vs-Microsoft-native tenant
  onboarding friction mentioned in IT Business Owners Group is a concrete, real
  example of the kind of ITDR/security-tooling comparison question Miloosh could
  address — no new category needed (falls under existing security/IT tooling scope)
  but a real, quotable-paraphrase content angle now exists.
- **Vendor-ad density as a scoring factor confirmed, not new**: this round's pattern
  (7 of 25 sampled groups showed a vendor/agency ad as the single visible post) is a
  quantified confirmation of the Round 1/2 "do not optimize for member count, watch
  for seller-dominated feeds" finding — no new opportunity, but strengthens confidence
  in the existing scoring rubric's promotionViability/penalty mechanics.

## 13. Remaining uncertainties

- **8 groups remain feed-sample-blocked** (private, no visible posts without joining):
  Xero Users Support Community, Monday.com for Small Businesses, Business Automation,
  Digital Dentist, AI Automation Community USA, AI Ads & Automation For Business
  Owners, Software as a Service (SaaS) Power Users, SaaS Mantra. Two of these
  (Digital Dentist: 10 posts/day; Xero Users Support Community: 155 posts/month) show
  genuinely high real activity from their About-page stats and are strong future join
  candidates specifically to unlock feed verification.
- **Single-post samples are a real limitation**: nearly every successful sample this
  round saw only 1 post (the top of the feed at initial load) because the scroll
  gesture reliably hung the browser renderer this session (documented root cause: a
  `computer{action:"scroll"}` call against a live-loading Facebook feed times out and
  leaves the tab blank). The tall-viewport-no-scroll workaround got real content but
  caps each sample at whatever loads without scrolling — a future pass with reliable
  scrolling could deepen each of these 25 samples toward the 8–15-post target.
  IT Business Owners Group (3 posts via "Group highlights") is the only exception.
- **43 of 75 groups remain entirely unsampled** (name/member-count/About-page evidence
  only). The highest-priority ones for a future pass are the still-unsampled TOP 25
  entries above (Dental Practice Owners USA, Businesses looking for Accountant/CPA/
  Bookkeeping/Tax Prep, Independent QuickBooks Online Help & Support, Small Business
  Owners Who Need Bookkeepers, Salon & Spa Owners USA).

---

*Strictly read-only this round: no joins, membership requests, posts, comments,
reactions, messages, follows, friend requests, or profile changes were made.*
