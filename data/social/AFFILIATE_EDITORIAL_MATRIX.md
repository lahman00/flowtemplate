# Affiliate-Aware Editorial Intelligence

Pulled 2026-08-19 directly from the real production pipeline state (Vercel Blob-backed store, `lib/revenue/affiliate-pipeline.ts`) and cross-checked against real production environment variables (`vercel env ls production`) — not from the stale local seed file (`var/agents/affiliate-pipeline.json`, which only has 1 entry and does not reflect production).

## The one finding that changes everything else here

**Zero affiliate links are actually live in production right now.** `vercel env ls production` shows no `NEXT_PUBLIC_AFFILIATE_*` variables set at all — confirmed by listing every production env var name. The pipeline dashboard records 6 products as `activated` (airtable, monday, elevenlabs, wix, shopify, whatconverts), but "activated" in the pipeline tracker means *approved and ready to activate*, not *actually wired up* — activation only happens when a real `NEXT_PUBLIC_AFFILIATE_URL_<SLUG>` env var is set in Vercel, and none are. Every Miloosh CTA today points at the plain official site.

**This is a real, actionable, non-editorial fix:** the 6 "activated" pipeline entries need their real approved affiliate URLs pasted into Vercel production env vars. I did not do this myself — I have no real affiliate URLs to enter, and fabricating one would violate the project's own non-negotiable rule against invented data. This is Eyal's action, not a content task.

**Addendum, found mid-session:** a new file, `data/affiliate/affiliate-revenue-map.md` (dated 2026-08-19), appeared in the working tree while this task was running — not written by me — claiming 5 *additional* partners (Constant Contact, Todoist, Moosend, Volza, Brevo) are "confirmed ACTIVE" via a manual PartnerStack batch application. I re-checked both sources of truth against this claim: the Blob-backed pipeline tracker still shows these 5 at `submitted`/`verified`/`needs_owner_action` (not `activated`), and `vercel env ls production` still shows zero `NEXT_PUBLIC_AFFILIATE_*` variables. The claim in that new file has not yet been reconciled into either the pipeline tracker or actual production activation — treat it as an unverified report pending reconciliation, not as a second confirmed-live tier, until someone (Eyal, most likely, since this needs real PartnerStack dashboard access this agent doesn't have) checks which of the two is out of date.

**Practical consequence for editorial planning:** with zero live commercial relationships, there is currently nothing for content to be "commercially aware" *around* in the sense of steering praise toward a payer — the neutrality problem the task warned about doesn't yet exist in practice. Content prioritization below still surfaces the pipeline's most-advanced products first, on the reasoning that by the time a post publishes, activation may have landed — not because any of them currently pay Miloosh.

## Real pipeline status (56 tracked entries)

| Status | Count |
|---|---|
| verified (researched, not yet applied) | 22 |
| submitted (application in) | 8 |
| pending_review | 1 |
| approved | 1 |
| activated (pipeline-recorded; **not live** — see above) | 6 |
| needs_owner_action (blocked on an account/credential only Eyal can create) | 18 |
| earning | 0 |

Of the full 105-product research set: 78 confirmed a real affiliate program exists, 15 confirmed none exists, 12 remain unconfirmed.

## Priority content table (highest pipeline stage first)

Every row below already has a live Miloosh software page; "Comparison" marks whether a published `/compare` page exists today.

| Product | Pipeline status | Miloosh page | Comparison live | Content opportunity |
|---|---|---|---|---|
| Miro | approved | ✅ | ✅ (vs Lucidchart) | Highest-priority — next stage is activation. "Miro vs Lucidchart" already live; a pricing-explained or alternatives piece adds a second angle. |
| Airtable | activated (pipeline) | ✅ | ✅ | Alternatives/switching content — Airtable's real-source pricing tiers make a strong "pricing explained" post. |
| Monday | activated (pipeline) | ✅ | ✅ | Category-insight or X-vs-Y piece within project management. |
| ElevenLabs | activated (pipeline) | ✅ | ✅ | Newer category (AI voice) — a "who ElevenLabs is actually for" piece has real differentiation value. |
| Wix | activated (pipeline) | ✅ | ✅ | Already Miloosh's own funnel partner (see `lib/wix-funnels.ts`) — strongest existing commercial alignment once truly activated. |
| Shopify | activated (pipeline) | ✅ | ✅ | High buyer-intent category (ecommerce) — "switching to Shopify" or limitations piece. |
| WhatConverts | activated (pipeline) | ✅ | — (no comparison yet) | No comparison page exists — lowest-effort win is a comparison-gap fill, not a social post, before featuring it. |
| Pipedrive | pending_review | ✅ | ✅ | Safe to cover now — pending review doesn't block honest editorial coverage of a real, sourced product. |
| HubSpot | submitted | ✅ | ✅ | Same — submitted-but-not-live doesn't change what's true about the product. |
| ClickUp, n8n, Todoist, Zendesk, ActiveCampaign, GetResponse, Squarespace | submitted | ✅ | ✅ (ClickUp, Todoist, ActiveCampaign) | Standard editorial coverage, no special commercial framing needed since nothing is earning yet. |

## Disclosure rule (unchanged, and currently moot)

`shouldShowAffiliateDisclosure()` in `lib/affiliate.ts` already gates the inline disclosure note on `isAffiliateLink()` being true — which today is false for every product, since no env vars are set. The moment Eyal activates any of the 6 approved products, the existing code will automatically start showing the disclosure on that product's page with zero further work. Nothing new needed here — just confirmed the existing mechanism is correct and will fire honestly once real activation happens.

## What this means for Phase 5 (the calendar) and Phase 6 (tomorrow's post)

No post is selected *because* a product pays Miloosh — none currently do. Selection is driven by real audience value, buyer intent, and which Miloosh pages already have the strongest sourced content to draw from (see the calendar and tomorrow's-post sections). Pipeline stage is used only as a soft tiebreaker among otherwise-equal candidates, exactly as instructed.
