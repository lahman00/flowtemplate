# Affiliate applications — live status + acquisition queue

Updated: 2026-08-20 (overnight PartnerStack marketplace sweep: Webflow/Help Scout/Amplitude/Toggl Track re-verified and staged, 11 programs confirmed absent from PartnerStack)

This file is the operational affiliate list for Miloosh across PartnerStack accounts and direct networks. Statuses below distinguish **ACTIVE**, **PENDING**, **KNOWN REJECTED**, and **MONITORING TARGETS**. Never mark a program active until a real tracking URL has been issued and verified.

## PartnerStack Account #1 (hello@miloosh.com)

| Program | Network | Status | Commission / Evidence | Next Action |
|---|---|---|---|---|
| Airtable | PartnerStack | ACTIVE | 20% recurring | Link active in Miloosh (`https://airtable.partnerlinks.io/b0dz88v48tek`) |
| Constant Contact | PartnerStack | ACTIVE (Approved) | Commission terms not re-verified in today's collected materials | Link active in canonical registry |
| Todoist | PartnerStack | ACTIVE (Approved) | Up to 25%; yearly one-time/monthly up to 12 payments | Link active in canonical registry |
| Moosend | PartnerStack | ACTIVE (Approved) | 30–40% recurring | Link active in canonical registry |
| Volza | PartnerStack | ACTIVE (Approved) | 20–30% revenue share (program wording) | Link active in canonical registry |
| Miro | PartnerStack (unconfirmed for this account) | NOT FOUND on this account | Live-verified 2026-08-19: zero results in both Partnerships and Invitations search on this PartnerStack login. Production affiliate pipeline had shown `status: "approved"` for Miro, but that entry's own history showed the jump to approved was self-reported as "fast-tracked" with no cited evidence, and briefly carried an affiliate URL later admitted to be copy-pasted from monday.com's entry — the "approved" pipeline status had no verifiable basis. **Corrected in code the same day**: reclassified `HOLD / UNCLEAR` in `partner-materials-audit.ts`, and the production affiliate pipeline was moved to `needs_owner_action`. Public program (`market.partnerstack.com/page/miroaffiliate`) states $10–$40 per qualified corporate trial signup by geography — unverified against any Miloosh dashboard since no partnership record exists here | Confirm with Eyal whether Miro was ever applied to, and under which account/email, before assuming approval |
| Pipedrive | PartnerStack | ACTIVE (Approved) | 20%/30% revenue share for first 12 months; Power custom | Link active in canonical registry |
| GetResponse | PartnerStack | ACTIVE (Approved) | 40%/50%/60% for 12 months by tier | Link active in canonical registry |
| KrispCall | PartnerStack | ACTIVE (Approved) | Commission terms UNKNOWN in collected materials | Link active in canonical registry |
| Freshworks (Freshdesk + Freshsales) | PartnerStack | PENDING | Submitted 2026-08-20 for Miloosh, targeting Freshdesk (highest real-traffic monetization gap identified by the Phase 12 Money Map — 1029 real 28-day GSC impressions, unmonetized) and Freshsales (Miloosh also has real content for it). First-party confirmation: "Your application was received." Real commission figures conflict across 3 sources — 15% (Freshworks FAQ), "up to 30%" (PartnerStack landing page), 20%/25%/custom tiered (PartnerStack in-app Offer structure, most authoritative). See `data/revenue/affiliate-programs.ts` for full detail | Wait; do not reapply. Do NOT activate Freshdesk/Freshsales on any public page until a real URL is issued |
| FreshBooks | PartnerStack | PENDING | Application under review | Wait; do not reapply |
| ActiveCampaign | PartnerStack | PENDING | Application under review | Wait; do not reapply |
| Close | PartnerStack | PENDING | Application under review | Wait; do not reapply |
| ClickUp | PartnerStack | PENDING | Application under review | Wait; do not reapply |
| Kit | PartnerStack | PENDING | Application under review | Wait; do not reapply |

## PartnerStack Account #2 (Preserve / Do Not Modify)

| Program | Network | Status | Commission / Evidence | Next Action |
|---|---|---|---|---|
| monday.com | PartnerStack | ACTIVE | $10+ per signup / rev share | Link active in Miloosh (`https://try.monday.com/1p2fpizulcj7`) |
| WhatConverts | PartnerStack | ACTIVE | 20% recurring for 2 years | Link active in Miloosh (`https://partners.whatconverts.com/bmckzlf0vnl8`) |
| ElevenLabs | PartnerStack | ACTIVE | 22% for first 12 months | Link active in Miloosh (`https://try.elevenlabs.io/gkp73pehjgtl`) |
| Wrike | PartnerStack | PENDING | Application under review | Wait; do not reapply |
| Zendesk | PartnerStack | PENDING | Application under review | Wait; do not reapply |

## Non-PartnerStack / Direct Programs

| Program | Network | Status | Notes |
|---|---|---|---|
| Shopify | Impact | ACTIVE | Real Impact tracking URL recorded (`https://shopify.pxf.io/L0EG9O`) |
| Wix | Impact | ACTIVE | Multi-funnel Impact routing (`https://wix.pxf.io/c/7623171/2096727/25616`) |
| Semrush | Impact | BLOCKED — needs owner action | Highest real-traffic unmonetized gap identified by the Phase 12 Money Map. Program re-verified live 2026-08-20: $10/trial, $50-$300/sale by toolkit (Semrush One up to $450 at Platinum tier), 120-day cookie, direct apply link is Semrush's own "Become a partner" button → `app.impact.com/campaign-campaign-info-v2/Semrush.brand`. **Cannot be submitted by Claude**: no Impact.com session/account exists in this environment (confirmed live by navigating to app.impact.com — redirected to login). Applying requires creating a new Impact account (password) and likely payment/tax setup, both outside Claude's authority. Owner action needed: sign in to Impact.com in the Miloosh working session (reuse Shopify/Wix credentials if the same account) or create a new publisher account, then Claude can complete the program-specific application truthfully. See `data/revenue/affiliate-programs.ts` and the affiliate pipeline (`slug: "semrush"`) for full evidence and eligibility text. Do NOT activate Semrush on any public page until a real tracking URL is issued. |

## Known Rejected / Not Pending

- **HubSpot**: Rejected by vendor affiliate program. Do NOT treat as pending or reapply.
- **n8n**: Rejected by vendor affiliate program. Do NOT treat as pending or reapply.
- **Brevo** (moved here 2026-08-19, was previously listed ACTIVE in the table above — that was wrong): PartnerStack's top-level partnership badge still shows "Active," but the program's own Messages tab (same account, hello@miloosh.com, same program) shows a first-party Brevo message dated Today: *"Your application was not approved... your application has been removed from our onboarding process."* A prior message (Yesterday) said the application was "under review." This fully explains the missing Offer/referral link. **Corrected in code the same day**: removed from `active-partners.ts`, reclassified `REJECTED` in `partner-materials-audit.ts`, and the production affiliate pipeline was moved to `rejected`. Do NOT treat as pending or reapply without owner review of why it was rejected.

## Ready to Apply — Deferred Tonight (Browser Tooling Issue)

Discovered/re-verified live via the PartnerStack marketplace during the 2026-08-20 overnight affiliate-expansion sweep. All four are real, open, PartnerStack-hosted programs with no owner-only blockers (no personal-identity fields, no new account needed — the existing Miloosh PartnerStack session applies). Submission was deliberately deferred after a reproducible browser-automation bug was confirmed twice tonight: on multi-dropdown PartnerStack application forms, selecting a second dropdown value silently reset an earlier-confirmed selection (verified via two independent read methods, not a misread). Rather than submit with unverified/possibly-corrupted answers, all four were left at `ready_to_apply` for a clean retry.

| Program | Network | Commission | Notes |
|---|---|---|---|
| Webflow | PartnerStack | 50% for 12 months per new customer | Real Miloosh page exists (`/software/webflow`). Supersedes an earlier (now-stale) blocker that assumed a direct webflow.com form requiring a personal name — the PartnerStack listing has no such field. |
| Help Scout | PartnerStack | 15% or 20% per closed deal for 12 months (by referral volume) | Commission upgraded from unconfirmed to verified tonight. Simple 5-field form. |
| Amplitude | PartnerStack | 20% revenue share, first year | Commission upgraded from unconfirmed to verified tonight. |
| Toggl Track | PartnerStack | 30% on first payment per new customer | New discovery tonight — not in any prior research pass. |

## Confirmed No PartnerStack Listing (2026-08-20 sweep)

Real negative evidence — searched directly on the PartnerStack marketplace, no results. Does not rule out a direct/other-network program; just confirms these are not reachable via the existing PartnerStack session: Intercom, Auth0, Contentful, Copy.ai, Craft CMS, Clockify, Ecwid, MuleSoft, Basecamp, TickTick, Sprout Social. (Notion is listed but confirmed still closed to new affiliates — see program_found history.)

## Activation Rule

Only after a program is approved and a real tracking URL is issued:
1. Record the exact approval status and tracking URL in Miloosh.
2. Set the corresponding affiliate URL in `.env.local` (`NEXT_PUBLIC_AFFILIATE_URL_<SLUG>`) or `config/affiliate-credentials.json`.
3. Verify the tracking URL opens the correct vendor destination and preserves attribution.
4. Only then allow Miloosh CTAs to use it and show the affiliate disclosure.
