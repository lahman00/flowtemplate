# Affiliate applications — live status + acquisition queue

Updated: 2026-08-20 (reconciled Webflow + ActiveCampaign to REJECTED from real first-party emails; Setmore ACTIVATED from a real first-party approval email; Setmore commission/payout terms independently verified against the official affiliate-terms PDF)

This file is the operational affiliate list for Miloosh across PartnerStack accounts and direct networks. Statuses below distinguish **ACTIVE**, **PENDING**, **KNOWN REJECTED**, and **MONITORING TARGETS**. Never mark a program active until a real tracking URL has been issued and verified.

## PartnerStack Account #1 (hello@miloosh.com)

| Program | Network | Status | Commission / Evidence | Next Action |
|---|---|---|---|---|
| Airtable | PartnerStack | ACTIVE | 20% recurring | Link active in Miloosh (`https://airtable.partnerlinks.io/b0dz88v48tek`) |
| Setmore | Tapfiliate | ACTIVE | Real first-party approval email received 2026-08-20 (network: Tapfiliate, `setmore.com/affiliates`). Live affiliate URL `https://www.setmore.com?ref=nge2zwi` verified 2026-08-20: resolves to the genuine Setmore homepage, ref parameter preserved, no third-party redirect. **Commission (verified 2026-08-20 against the official affiliate-terms PDF, assets.setmore.com):** 30% of the referred customer's first payment, **one-time, not recurring**. Verbatim tiers: Monthly Pro 1-user $12→$3.60, Pro 2-user $24→$7.20, Team 3-6 users $27–$54→$8.10–$16.20; Yearly Pro 1-user $60→$18, Pro 2-user $120→$36, Team 3-6 users $180–$360→$54–$108. Commission is held 30 days (monthly plans) or 365 days (yearly plans) before it's payable, then paid ~90 days later. **Cookie window: 90 days.** **⚠️ PPC RESTRICTION IS CONFLICTING between first-party sources** — the official PDF only bars bidding on Setmore's own brand keywords; the approval email bars ALL paid advertising (Google Ads, PPC, display ads, paid social, branded or not). Treating the broader email restriction as operative (stricter/safer), but this is unresolved, not confirmed. Only organic promotion is permitted under either reading (blog/content, organic social, newsletters, website referrals); commissions from prohibited paid channels will not be approved or paid. **Payout threshold/method: UNVERIFIED** — not stated in the PDF. `setmore.tapfiliate.com/login` shows an existing account (avatar visible) still mid-onboarding at Step 4 "Payout method" — real owner action required to finish payout setup; no data was entered by this agent. Full detail and sourceUrls in `data/revenue/affiliate-programs.ts`. 9 real comparison pages involve Setmore (`calendly-vs-setmore`, `doodle-vs-setmore`, `acuity-scheduling-vs-setmore`, `microsoft-bookings-vs-setmore`, `cal-com-vs-setmore`, `motion-vs-setmore`, `reclaim-ai-vs-setmore`, `savvycal-vs-setmore`, `setmore-vs-youcanbookme`) — all 9 gained exactly one newly-monetized side (none of the counterparts are active partners, so none became dual-monetized) | Link active in canonical registry. Do NOT use or recommend paid promotion for this partner in any social/affiliate automation. Owner: complete Tapfiliate Step 4 payout setup when ready |
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
| Close | PartnerStack | PENDING | Application under review | Wait; do not reapply |
| ClickUp | PartnerStack | PENDING | Application under review | Wait; do not reapply |
| Help Scout | PartnerStack | PENDING | Submitted 2026-08-20. 15% or 20% per closed deal for 12 months depending on referral volume. First-party confirmation: "Application submitted! ... Your application was submitted on Aug 20, 2026." | Wait; do not reapply. Do NOT activate on any public page until a real URL is issued |
| Amplitude | PartnerStack | PENDING | Submitted 2026-08-20. 20% revenue share, first year of subscription. First-party confirmation: "Application submitted!" No fabricated traffic/conversion figures were provided (explicitly stated as not independently verified). | Wait; do not reapply. Do NOT activate on any public page until a real URL is issued |
| Toggl Track | PartnerStack | PENDING | Submitted 2026-08-20 (new discovery this sweep, not previously tracked). 30% commission on first payment per new customer. First-party confirmation: "Application submitted!" | Wait; do not reapply. Do NOT activate on any public page until a real URL is issued |

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
- **Webflow** (moved here 2026-08-20): owner-provided first-party PartnerStack email, subject *"Updates to your Webflow Application"*: *"After careful consideration, Webflow has declined your application to join their program."* This supersedes the earlier "diagnosed vendor form defect / still blocked" status recorded the same day — the form-interaction diagnosis (dropdown overlays never closing, one silently corrupting a Country selection) remains factually accurate as a real bug encountered, but the actual outcome is a real decline, not an open/retryable application. Never added to `active-partners.ts`. Do NOT reapply without new evidence.
- **ActiveCampaign** (moved here 2026-08-20, was previously listed PENDING in the table above — that was stale): owner-provided first-party PartnerStack email, subject *"Updates to your ActiveCampaign Application"*: *"After careful consideration, ActiveCampaign has declined your application."* Never added to `active-partners.ts`. Do NOT reapply without new evidence.

## Confirmed No PartnerStack Listing (2026-08-20 sweep)

Real negative evidence — searched directly on the PartnerStack marketplace, no results. Does not rule out a direct/other-network program; just confirms these are not reachable via the existing PartnerStack session: Intercom, Auth0, Contentful, Copy.ai, Craft CMS, Clockify, Ecwid, MuleSoft, Basecamp, TickTick, Sprout Social, Klaviyo, Hotjar, Zoho CRM, Synthesia, Hootsuite, Calendly, Teamwork, Jasper, Smartsheet, Zapier, RingCentral, Matomo. (Notion is listed but confirmed still closed to new affiliates — see program_found history.)

## Found But Deprioritized

- **Gorgias** (PartnerStack): live listing confirmed 2026-08-20, but commission is genuinely disclosed as "N/A" and the application form (asks "How many clients do you have on Shopify") is clearly oriented toward agencies/resellers managing client stores, not an editorial publisher like Miloosh. Not applied.

## Corrected 2026-08-20 (reconciliation sweep)

- **Kit (formerly ConvertKit)**: previously tracked here and in `partner-materials-audit.ts` as PartnerStack PENDING/"Application under review" — that was stale/incorrect. A full 20-row sweep of every partnership on this PartnerStack account (hello@miloosh.com), searched by both "Kit" and "Convert", found **no Kit/ConvertKit application at all** — it does not exist as a partnership on this account, pending or otherwise. The program itself is real and live on the PartnerStack marketplace ("Kit (formerly ConvertKit) — Earn 50% recurring commission for customer's 1st year"), so this is a genuine READY_TO_APPLY opportunity, not a pending wait. Not resubmitted in this task (out of scope — this task was reconciliation, not new applications).

## New Approvals Found, Not Yet Monetizable (2026-08-20)

Discovered during the same 20-row sweep — real, already-Active PartnerStack partnerships this agent never applied to (pre-existing on the account) and that were not yet in `active-partners.ts`:

- **Hubstaff**: Active, real referral link `https://affiliate.hubstaff.com/ca2oe167vcj1` (→ hubstaff.com), commission offers of 30% (year 1) or 20% (year 1) shown on the partnership page. **Not activated**: Miloosh has no `data/software/hubstaff.json` and no existing Hubstaff editorial content anywhere in the repo. Activating the affiliate link would have no effect since no software/comparison page exists to carry the CTA. This is real, free revenue blocked purely on an editorial decision (whether to cover Hubstaff at all), not on any further affiliate step. See `data/revenue/affiliate-programs.ts` (slug: `hubstaff`).
- **PDWare**: Active, real referral link `https://try.pdware.com/9l2hndbyhssz` (→ pdware.com), 10% per Closed Referral. **Not activated**: PDWare has never appeared anywhere in this repo before — no editorial content exists, and it's not clear what category of product it is or whether it fits Miloosh's catalog at all. Owner should confirm before any content work. See `data/revenue/affiliate-programs.ts` (slug: `pdware`).

Also noted, not acted on: PartnerStack's own dashboard shows "Agree to terms & conditions for 1 program to gain access" for the **PartnerStack self-referral program itself** (refer other publishers to PartnerStack) — unrelated to any Miloosh software/comparison content, and accepting new terms requires explicit owner sign-off. Not accepted in this task.

## Activation Rule

Only after a program is approved and a real tracking URL is issued:
1. Record the exact approval status and tracking URL in Miloosh.
2. Set the corresponding affiliate URL in `.env.local` (`NEXT_PUBLIC_AFFILIATE_URL_<SLUG>`) or `config/affiliate-credentials.json`.
3. Verify the tracking URL opens the correct vendor destination and preserves attribution.
4. Only then allow Miloosh CTAs to use it and show the affiliate disclosure.
