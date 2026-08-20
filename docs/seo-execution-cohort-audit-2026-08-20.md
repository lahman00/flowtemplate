# SEO Factory execution cohort audit — 2026-08-20

## Scope and baseline

This audit uses immutable baseline run `2026-08-19T22-06-14-223Z-1187a321`, captured at `2026-08-19T22:06:14.800Z` for the GSC window `2026-07-20` through `2026-08-16`. It does not overwrite the baseline, start an experiment, or change public content.

All 12 live URLs returned HTTP 200. They share the same indexable software-page template: one generated title, meta description and H1; a self-canonical; breadcrumb, SoftwareApplication and FAQ JSON-LD; alternatives cards; a category link; related software; and every published comparison involving the product. No candidate has a confirmed GSC query-to-page cannibalization finding in the final entity-aware Factory run.

The common structural weakness is not title/H1 alignment: all 12 already render `Best {Product} Alternatives`. It is decision depth. Most pages expose only two or three alternatives while their inventories contain 8–16 relevant comparisons, and the generated “How to choose” copy repeats a generic workflow/integration/migration frame. Any execution should add product-specific decision support, not another alternatives URL or a cosmetic title-only test.

## Candidate diagnoses

| Candidate | Immutable query baseline | Page aggregate | Current surface | Affiliate truth | Diagnosis | Decision |
|---|---:|---:|---|---|---|---|
| Pipedrive | 124 impressions, 0 clicks, position 76.6; 9 variants | 187 impressions, 0 clicks, position 77.1 | 2 alternatives, 8 comparisons, 16 inbound links; one homepage source dated 2026-07-31; pricing absent | ACTIVE | Correct canonical and entity. Strong CRM comparison inventory is buried below a two-option alternatives section. The page needs decision dimensions for sales-pipeline CRM selection and current official plan/integration evidence, not a new URL. | EXECUTE |
| Airtable | 103 impressions, 1 click, position 78.6; 8 variants | 134 impressions, 1 click, position 79.3 | 3 alternatives, 11 comparisons, 13 inbound links; three sources dated 2026-07-31; pricing absent | ACTIVE | Correct canonical. Existing alternatives cover docs, projects and visual work management, but do not explain the database/app-building tradeoff or route readers into the 11 comparisons. Official positioning now emphasizes app building, AI agents and scale. | EXECUTE |
| Semrush | 774 impressions, 0 clicks, position 77.1; 14 variants | 973 impressions, 0 clicks, position 76.9 | 2 alternatives, 10 comparisons, 13 inbound links; homepage-only source dated 2026-08-04; pricing absent | VIABLE, not active; Impact owner action remains | Largest monetization-independent signal in the cohort. Google is associating the correct URL with the cluster, but two alternatives do not cover the separate SEO-suite, analytics and specialist-tool decisions implied by the queries. No affiliate CTA may be added. | EXECUTE |
| Todoist | 62 impressions, 0 clicks, position 68.8; 10 variants | 66 impressions, 0 clicks, position 69.1 | 3 alternatives, 15 comparisons, 20 inbound links; product/features/pricing verified 2026-08-19 | ACTIVE | Correct target, broad comparison support and the freshest factual/pricing record in the cohort. Demand is materially lower, while variants split into free, open-source and Apple/task-management needs that require more competitor research. Preserve as a clean control for this cohort. | WAIT — lower incremental value after recent factual refresh |
| Freshdesk | 359 impressions, 0 clicks, position 81.6; 14 variants | 992 impressions, 0 clicks, position 80.0 | 2 alternatives, 12 comparisons, 19 inbound links; two sources dated 2026-08-01; pricing absent | PENDING; no tracking URL | Correct target with substantial page and alternatives demand. Current copy leads with AI but omits the concrete helpdesk/AI-pricing boundary and exposes only Zendesk/Gorgias despite 12 existing comparisons. SEO work is independent of pending approval; no affiliate CTA. | EXECUTE |
| Buffer | 214 impressions, 0 clicks, position 84.9; 15 variants | 276 impressions, 0 clicks, position 84.1 | 2 alternatives, 10 comparisons, 13 inbound links; homepage-only source dated 2026-08-01; pricing absent | VIABLE, not active | Correct software entity; no content references Miloosh's publishing infrastructure. Query variants repeatedly ask for free options, while the page does not establish Buffer's current free/paid boundary or distinguish lightweight publishing from listening/enterprise workflows. | EXECUTE |
| Sprout Social | 194 impressions, 0 clicks, position 80.5; 14 variants | 298 impressions, 0 clicks, position 81.6 | 2 alternatives, 12 comparisons, 15 inbound links; homepage-only source dated 2026-08-01; pricing absent | VIABLE, not active | Correct target, but its two alternatives are the reciprocal Buffer/Hootsuite set. Executing it in the same cohort as Buffer would change two tightly connected pages and weaken attribution. It first needs a distinct social-intelligence/listening decision model. | WAIT — experiment contamination and differentiation gap |
| ClickUp | 194 impressions, 0 clicks, position 90.2; 9 variants | 211 impressions, 0 clicks, position 88.6 | 3 alternatives, 16 comparisons, 245 inbound links; product/features sources dated 2026-07-31; pricing absent | PENDING; no tracking URL | Correct target and unusually strong internal-link support. More linking is not the supported diagnosis. Its very poor ranking despite 245 inbound links suggests content/competition or demand-quality issues requiring a separate deep content experiment, not inclusion in a mixed first cohort. | WAIT — unsuitable for an internal-link-led cohort |
| RingCentral | 113 impressions, 0 clicks, position 69.0; 18 variants | 130 impressions, 0 clicks, position 67.8 | 3 alternatives, 12 comparisons, 15 inbound links; homepage-only source dated 2026-08-04; pricing absent | VIABLE, not active | Correct target. Current alternatives over-index on meetings/collaboration while query intent includes business-phone and cheaper-provider evaluation. Existing KrispCall, Teams, Zoom and Webex comparisons can support a phone-system-specific decision section. | EXECUTE |
| Help Scout | 282 impressions, 0 clicks, position 73.3; 9 variants | 331 impressions, 0 clicks, position 73.9 | 2 alternatives, 12 comparisons, 20 inbound links; two sources dated 2026-08-01; pricing absent | PENDING since 2026-08-20; no tracking URL | Correct target. Current page uses a vendor-reported resolution figure in the feature list without the pricing/add-on context and exposes only Front/Crisp despite a broad support comparison graph. Current official pricing establishes Free, Standard, Plus and Pro decision boundaries. | EXECUTE |
| Intercom | 943 impressions, 1 click, position 86.1; 42 variants | 1,062 impressions, 1 click, position 86.0 | 2 alternatives, 12 comparisons, 16 inbound links; two sources dated 2026-08-01; pricing absent | NONE; no qualifying affiliate program found | Strongest query breadth and page-level demand. Correct canonical, no cannibalization, but the page reduces a complex AI-agent/helpdesk decision to Zendesk and Help Scout. It needs clear AI-led versus traditional helpdesk, simpler-team and cross-team workflow routes. Editorial priority remains high despite no monetization. | EXECUTE |
| Front | 385 impressions, 0 clicks, position 75.5; 10 variants | 386 impressions, 0 clicks, position 75.4 | 2 alternatives, 13 comparisons, 17 inbound links; three sources dated 2026-08-01; pricing absent | UNKNOWN/non-active | Nearly all page visibility belongs to the alternatives cluster, making intent alignment unusually clean. Current two-option section does not expose the shared-inbox, ticketing, cross-team operations and AI workflow choices supported by 13 existing comparisons. | EXECUTE |

## Selected execution cohort

Nine existing canonical pages have sufficient evidence for a controlled intervention:

1. `/software/pipedrive`
2. `/software/airtable`
3. `/software/semrush`
4. `/software/freshdesk`
5. `/software/buffer`
6. `/software/ringcentral`
7. `/software/help-scout`
8. `/software/intercom`
9. `/software/front`

The intervention should be substantive alternatives decision support plus relevant existing comparison/category links. Title and H1 changes are not justified because both already exactly match the observed intent. Metadata changes should be considered only if the new page content makes the existing product-summary description materially incomplete; current positions are too low for a pure CTR experiment.

## Deferred candidates

- Todoist — `WAIT`: recently refreshed first-party pricing, lower demand, and already broad comparison support.
- Sprout Social — `WAIT`: changing it alongside Buffer would contaminate measurement, and the page needs a distinct listening/intelligence frame first.
- ClickUp — `WAIT`: 245 inbound links rule out a simple authority-flow diagnosis; isolate it in a later content-depth experiment.

## First-party evidence verified for execution planning

- Pipedrive: `https://www.pipedrive.com/en/pricing` — current Lite/Growth/Premium/Ultimate structure, 14-day trial, sales pipeline, automation and integration boundaries.
- Airtable: `https://airtable.com/pricing` and `https://www.airtable.com/platform` — Free/Team/Business/Enterprise structure; relational data, interfaces, automations, app building and scale.
- Semrush: `https://www.semrush.com/pricing/` and `https://www.semrush.com/features/` — current SEO/AI-search toolkit and feature structure.
- Freshdesk: `https://www.freshworks.com/freshdesk/pricing/` and `https://www.freshworks.com/freshdesk/features/` — Growth/Pro/Enterprise, ticketing, shared inbox, knowledge base, routing, analytics and separately priced AI capabilities.
- Buffer: `https://buffer.com/pricing` and `https://buffer.com` — current publishing, engagement, analytics and plan boundary evidence.
- RingCentral: `https://www.ringcentral.com/office/plansandpricing.html` — RingEX, 14-day trial, calling/messaging/video, AI Receptionist and integration evidence.
- Help Scout: `https://www.helpscout.com/pricing/` — Free/Standard/Plus/Pro, shared inbox, channels, Docs, automation, AI Answers and integrations.
- Intercom: `https://www.intercom.com/pricing` and `https://www.intercom.com/helpdesk` — helpdesk and Fin AI Agent product boundaries.
- Front: `https://front.com/pricing` and `https://front.com/product` — shared inbox, ticketing, workflow and AI customer-operations positioning.

The vendor pages are evidence inputs, not independent endorsements. Vendor-supplied customer counts, ratings, savings, reliability claims and subjective superlatives are excluded from the planned editorial changes.

## Safety conclusion

- No separate alternatives URL is justified.
- No candidate needs a canonical, robots or structured-data repair before execution.
- No confirmed cannibalization consolidation is supported.
- No affiliate state or CTA should change during the SEO cohort.
- Autonomous editorial execution remains Level 0 and mass publishing remains off.
